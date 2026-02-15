import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createClient } from "@/lib/supabase/server";

// Configure route
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for transcription

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

function chunkTranscript(
  segments: TranscriptSegment[],
  chunkDuration: number = 60,
): Array<{ start_sec: number; end_sec: number; text: string }> {
  const chunks: Array<{ start_sec: number; end_sec: number; text: string }> =
    [];
  let currentChunk = {
    start_sec: 0,
    end_sec: 0,
    text: "",
  };

  for (const segment of segments) {
    const segmentStart = segment.start || 0;
    const segmentEnd = segment.end || segmentStart + 1;
    const segmentText = segment.text || "";

    // If this segment would make the chunk too long, save current chunk and start new one
    if (
      currentChunk.text &&
      segmentEnd - currentChunk.start_sec > chunkDuration
    ) {
      chunks.push({ ...currentChunk });
      currentChunk = {
        start_sec: segmentStart,
        end_sec: segmentEnd,
        text: segmentText.trim(),
      };
    } else {
      // Add to current chunk
      if (!currentChunk.text) {
        currentChunk.start_sec = segmentStart;
      }
      currentChunk.end_sec = segmentEnd;
      currentChunk.text += (currentChunk.text ? " " : "") + segmentText.trim();
    }
  }

  // Add final chunk
  if (currentChunk.text) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Starting direct transcription...");

    // Get user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Prefer authenticated user id, otherwise fall back to DEMO_USER_ID env var.
    // If neither is present, return an instructive error rather than inserting a null.
    const envDemoId = process.env.DEMO_USER_ID;
    const candidateId = user?.id ?? envDemoId ?? null;

    if (!candidateId) {
      console.error("No authenticated user and no DEMO_USER_ID set");
      return NextResponse.json(
        {
          error:
            "Authentication required or set DEMO_USER_ID to a valid user UUID in your environment",
        },
        { status: 401 },
      );
    }

    // If DEMO_USER_ID exists, validate it's a UUID to avoid DB errors
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (envDemoId && !uuidRegex.test(envDemoId)) {
      console.error("DEMO_USER_ID is not a valid UUID:", envDemoId);
      return NextResponse.json(
        {
          error:
            "DEMO_USER_ID env is present but not a valid UUID. Set it to a valid UUID.",
        },
        { status: 500 },
      );
    }

    const userId = candidateId;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    console.log(
      `📁 Received file: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
    );

    // Create video record (storage_path is null since we're not storing the video)
    const { data: video, error: videoError } = await supabaseAdmin
      .from("videos")
      .insert({
        user_id: userId,
        title: title || "Zoom Recording",
        storage_path: null, // No storage - direct transcription
        status: "uploaded",
      })
      .select()
      .single();

    if (videoError) {
      console.error("Failed to create video record:", videoError);
      console.error("Error details:", JSON.stringify(videoError, null, 2));
      return NextResponse.json(
        { error: "Failed to create video record", details: videoError.message },
        { status: 500 },
      );
    }

    console.log(`✅ Created video record: ${video.id}`);

    // Send directly to OpenAI Whisper without persisting the file
    console.log("🎤 Forwarding file to OpenAI Whisper...");

    // Convert uploaded File to Buffer then append as a Blob to ensure proper multipart encoding
    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const openaiForm = new FormData();
    const fileBlob = new Blob([buffer]);
    openaiForm.append("file", fileBlob as any, (file as any).name || "upload");
    openaiForm.append("model", "whisper-1");
    openaiForm.append("response_format", "verbose_json");
    openaiForm.append("timestamp_granularities[]", "segment");

    const openaiRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          // Let fetch set the Content-Type boundary for FormData
        },
        body: openaiForm,
      },
    );

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI transcription failed:", openaiRes.status, errText);
      return NextResponse.json(
        { error: "OpenAI transcription failed", details: errText },
        { status: 502 },
      );
    }

    const transcription = await openaiRes.json();
    const segments = (transcription as any).segments || [];
    console.log(`✅ Transcribed ${segments.length} segments`);

    // Build full transcript text
    const fullText = (transcription as any).text
      ? String((transcription as any).text)
      : segments.map((s: any) => String(s?.text || '')).join(' ').trim();

    // Chunk the transcript
    const chunks = chunkTranscript(segments, 60);
    console.log(`📦 Created ${chunks.length} chunks`);

    // Insert chunks into database
    const chunksToInsert = chunks.map((chunk) => ({
      video_id: video.id,
      start_sec: chunk.start_sec,
      end_sec: chunk.end_sec,
      text: chunk.text,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("transcript_chunks")
      .insert(chunksToInsert);

    if (insertError) {
      console.error("Failed to insert chunks:", insertError);
      return NextResponse.json(
        { error: "Failed to save transcript" },
        { status: 500 },
      );
    }

    console.log("✅ Saved transcript chunks to database");

    // Store the full transcript text on the video record if a column exists.
    // This is best-effort: it won't fail the request if your schema doesn't have this column.
    try {
      await supabaseAdmin
        .from('videos')
        .update({ transcript: fullText } as any)
        .eq('id', video.id);
    } catch {
      // ignore
    }

    // Update video status to transcribed
    await supabaseAdmin
      .from("videos")
      .update({ status: "transcribed" })
      .eq("id", video.id);

    console.log("✅ Video marked as transcribed");

    return NextResponse.json({
      success: true,
      videoId: video.id,
      chunksCount: chunks.length,
      message: "Transcription completed successfully",
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Transcription failed",
      },
      { status: 500 },
    );
  }
}
