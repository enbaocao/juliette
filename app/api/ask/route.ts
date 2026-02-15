import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai";
import {
  retrieveRelevantChunksEnhanced,
} from "@/utils/retrieval";
import {
  buildSimpleModePrompt,
  buildPracticeModePrompt,
  buildAnimationModePrompt,
} from "@/utils/prompts";
import { findClosestAnimation, getAnimationUrl } from "@/lib/animation-library";

import { TranscriptChunk } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      video_id,
      videoId,
      question,
      mode,
      interest_tags,
      interestTags,
      live_session_id,
      liveSessionId: liveSessionIdCamel,
      is_live,
      isLive,
    } = body;

    // Support both camelCase (old) and snake_case (new) for backwards compatibility
    const resolvedVideoId = video_id ?? videoId;
    const resolvedInterestTags = interest_tags ?? interestTags;
    const resolvedLiveSessionId = live_session_id ?? liveSessionIdCamel;
    const resolvedIsLive = is_live ?? isLive ?? false;

    if (!question || !mode) {
      return NextResponse.json(
        { error: "question and mode are required" },
        { status: 400 },
      );
    }

    if (!["simple", "practice", "animation"].includes(mode)) {
      return NextResponse.json(
        { error: "mode must be simple, practice, or animation" },
        { status: 400 },
      );
    }

    // Get user from auth session, fallback to demo for unauthenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? process.env.DEMO_USER_ID ?? "demo-user-" + Date.now();

    // Retrieve relevant transcript chunks
    // For live sessions, prioritize real-time chunks
    let chunks: TranscriptChunk[] = [];
    if (resolvedLiveSessionId || resolvedVideoId) {
      chunks = await retrieveRelevantChunksEnhanced(question, {
        videoId: resolvedVideoId,
        liveSessionId: resolvedLiveSessionId,
        topK: 5,
      });
    }

    // For non-live sessions without video chunks, return error
    if (chunks.length === 0 && resolvedVideoId && !resolvedIsLive) {
      return NextResponse.json(
        {
          error:
            "No transcript found for this video. Please wait for transcription to complete.",
        },
        { status: 404 },
      );
    }

    // For live sessions without chunks yet, continue with empty context
    // (AI can still answer general questions)
    // For animation mode, check pre-rendered library first
    let prerenderedMatch = null;
    if (mode === "animation") {
      prerenderedMatch = findClosestAnimation(question);
      console.log(
        "Pre-rendered match:",
        prerenderedMatch ? prerenderedMatch.entry.title : "none",
      );
    }

    // Build prompt based on mode
    let prompt: { system: string; user: string } = { system: "", user: "" };
    switch (mode) {
      case "simple":
        prompt = buildSimpleModePrompt(question, chunks);
        break;
      case "practice":
        prompt = buildPracticeModePrompt(question, chunks, resolvedInterestTags);
        break;
      case "animation":
        prompt = buildAnimationModePrompt(
          question,
          chunks,
          prerenderedMatch
            ? {
              title: prerenderedMatch.entry.title,
              description: prerenderedMatch.entry.description,
              filename: prerenderedMatch.entry.filename,
            }
            : null,
        );
        break;
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content || "";

    // Prepare answer object
    let answer: any = {
      content: responseContent,
      references: chunks.slice(0, 3).map((c) => ({
        start_sec: c.start_sec,
        end_sec: c.end_sec,
        text: c.text.substring(0, 200) + "...",
      })),
    };

    // If animation mode, parse JSON response and handle accordingly
    if (mode === "animation") {
      try {
        const animationSpec = JSON.parse(responseContent);
        answer = {
          ...answer,
          animation_spec: animationSpec,
        };

        // Check if LLM chose pre-rendered or custom
        if (
          animationSpec.strategy === "prerendered" &&
          animationSpec.prerendered_filename
        ) {
          // Serve pre-rendered animation instantly
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const animationUrl = getAnimationUrl(
            supabaseUrl,
            animationSpec.prerendered_filename,
          );

          answer.animation_url = animationUrl;
          answer.animation_status = "ready";
          answer.delivery_time = "instant";

          console.log(
            "✓ Serving pre-rendered animation:",
            animationSpec.prerendered_filename,
          );
        } else if (
          animationSpec.strategy === "custom" &&
          animationSpec.template
        ) {
          // Create render job for custom animation
          await supabaseAdmin.from("jobs").insert({
            type: "render",
            payload: {
              video_id: resolvedVideoId,
              template: animationSpec.template,
              params: animationSpec.parameters,
            },
            status: "pending",
          });

          answer.animation_status = "rendering";
          answer.delivery_time = "20-30 seconds";

          console.log(
            "⏳ Creating render job for custom animation:",
            animationSpec.template,
          );
        } else {
          // Fallback: treat as text response if strategy unclear
          console.warn(
            "Animation spec missing strategy or required fields:",
            animationSpec,
          );
        }
      } catch (e) {
        // If JSON parsing fails, treat as text response
        console.error("Failed to parse animation JSON:", e);
      }
    }

    // Save question and answer to database
    const { data: savedQuestion, error: dbError } = await supabaseAdmin
      .from("questions")
      .insert({
        video_id: resolvedVideoId || null,
        user_id: userId,
        question,
        mode,
        interest_tags: resolvedInterestTags || [],
        answer,
        live_session_id: resolvedLiveSessionId || null,
        is_live: resolvedIsLive,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to save question:", dbError);
      // Don't fail the request, just log it
    }

    return NextResponse.json({
      success: true,
      answer,
      question: savedQuestion,
      questionId: savedQuestion?.id,
    });
  } catch (error) {
    console.error("Ask API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
