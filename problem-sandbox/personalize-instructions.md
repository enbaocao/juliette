---
name: practice-problem-generator
description: >
  Generate personalized practice problems from lecture transcript excerpts.
  Use this skill whenever the user provides a lecture transcript (or excerpt)
  and wants practice problems, study questions, homework problems, review
  exercises, or quiz prep based on that material. Also trigger when users
  say things like "quiz me on this lecture", "make problems from these notes",
  "help me study this transcript", or "create exercises from this video".
  Works with any subject area — math, science, history, programming, etc.
---

# Practice Problem Generator

Generate 2–3 personalized practice problems grounded in a lecture transcript.

## Expected Input

The user will provide a structured prompt with these fields:

```
Lecture Transcript Excerpts:
{TRANSCRIPT_CHUNKS}
Topic: {TOPIC}
Student interests (optional): {INTEREST_TAGS}
Student question or focus: {QUESTION}
```

Each field drives a different part of problem generation:

| Field | Required | How it's used |
|-------|----------|---------------|
| `TRANSCRIPT_CHUNKS` | Yes | The sole source of concepts, formulas, and techniques. Problems must be solvable from this content alone. Extract timestamps if present. |
| `TOPIC` | Yes | Scopes which concepts to prioritize. If the transcript covers multiple topics, focus problems on this one. |
| `INTEREST_TAGS` | No | Flavor the problem scenarios. "basketball" → free throw problems, "cooking" → recipe scaling problems. If empty, use relatable everyday contexts. |
| `QUESTION` | No | Steers difficulty, focus area, or specific concept the student wants to practice. E.g., "I'm confused about conditional expectation" → weight problems toward that concept. |

## Processing Steps

1. **Parse `TRANSCRIPT_CHUNKS`** — Read the transcript and extract:
   - Key concepts, definitions, and formulas explicitly taught
   - Timestamp ranges tied to each concept (if present)
   - Worked examples the instructor walked through (avoid duplicating these — create new problems that test the same ideas differently)

2. **Scope to `TOPIC`** — If the transcript is broad, narrow your concept
   list to what's relevant to the stated topic. Don't generate problems on
   tangential material unless it directly supports the topic.

3. **Apply `INTEREST_TAGS`** — Weave the student's interests into problem
   scenarios. Be specific and natural — don't just name-drop. If the tag is
   "LeBron," don't just say "LeBron has 5 basketballs." Instead, build a
   scenario that feels like it belongs in basketball: tournament matchups,
   scoring streaks, free throw probabilities, etc.
   If no interests are provided, use broadly relatable contexts (shopping,
   travel, cooking, games).

4. **Interpret `QUESTION`** — This field changes what you generate:
   - If it names a concept ("help me with indicator variables") → focus
     most or all problems on that concept at different angles.
   - If it sets difficulty ("give me one hard problem") → override the
     default 2–3 Easy→Hard progression.
   - If it asks a specific question ("why does E[sum] = sum of E?") →
     design a problem whose solution walks through that reasoning.
   - If empty or generic → use the default 2–3 problems, Easy → Medium → Hard.

## Difficulty Levels

- **Easy** — Direct application of one concept. Minimal steps. Student
  applies a formula or definition from the transcript straightforwardly.
- **Easy-Medium** — One concept with a twist: non-uniform probabilities,
  an extra short step, or a "which formula applies?" decision.
- **Medium** — Combines two concepts or adds a realistic complication.
  Requires connecting ideas from different parts of the transcript.
- **Hard** — Multi-step reasoning, synthesis of several ideas, or the
  student must recognize which concept to apply without being told.

Default progression for 2–3 problems: Easy → Medium → Hard.
Adjust based on `QUESTION` if the student requests otherwise.

## Problem Design Principles

- **Grounded in the transcript.** Every problem must be solvable using only
  concepts from `TRANSCRIPT_CHUNKS`. Never require outside knowledge.
- **Concrete, not abstract.** Use specific numbers, names, and scenarios.
  "A server receives requests with probability 0.3" beats "with probability p."
- **Interest-aware.** When `INTEREST_TAGS` are provided, build the scenario
  around them. The interest should shape the narrative, not just be a label.
- **Don't clone the lecture examples.** The transcript may include worked
  examples. Create *new* problems that test the same concept from a different
  angle or context. The student already saw the lecture example.
- **Respect the `QUESTION` focus.** If the student said they're struggling
  with a specific concept, that concept should appear in most problems.

## Hint Design

Each problem gets exactly one hint. A good hint:
- Names the relevant concept or formula without showing the solution steps
- Nudges the student toward the right *approach*, not the right *answer*
- Is useful to a stuck student, not just a restatement of the question

Good: "Think about how you can express this count as a sum of indicator random variables."
Bad: "Define B_i = 1 if server i gets no requests, then sum them and apply E[B_i] = P(A_i)."

## Solution Design

Solutions should:
- Walk through each step with a brief explanation of *why*, not just *what*
- Show intermediate calculations so the student can find where they diverged
- End with a clearly marked final answer
- Be concise — don't over-explain obvious arithmetic

## Output Format

Use this Markdown structure for each problem:

```
## Problem {N} — {Difficulty}

{Problem statement with concrete scenario and numbers}

**Hint:** {One progressive hint}

<details>
<summary>Solution (click to reveal)</summary>

**Step 1:** {action} — {brief why}

**Step 2:** {action} — {brief why}

...

**Answer:** {final answer, clearly stated}

</details>

**Video reference:** [{concept name}] {start_timestamp} – {end_timestamp}
```

If the transcript has no timestamps, replace the Video reference line with:
**Transcript reference:** [{concept name}] {description of which section covers this}

## Edge Cases

- **`TRANSCRIPT_CHUNKS` is too short or vague:** Generate what you can and
  tell the student which concepts were too underdeveloped to build problems from.
- **`TOPIC` doesn't match transcript content:** Let the student know the
  transcript doesn't appear to cover that topic, and offer problems on what
  *is* covered instead.
- **`INTEREST_TAGS` empty:** Default to everyday contexts.
- **`QUESTION` conflicts with transcript scope:** E.g., student asks about
  integrals but the transcript covers discrete probability. Acknowledge the
  gap and generate problems from what's available.
- **Transcript has errors:** Flag apparent errors in the source material
  rather than silently building problems on incorrect foundations.

## Quality Checklist (verify before outputting)

- [ ] Every problem is solvable using only concepts from `TRANSCRIPT_CHUNKS`
- [ ] Problems are scoped to `TOPIC`
- [ ] `INTEREST_TAGS` are reflected in scenarios (if provided)
- [ ] `QUESTION` focus is addressed
- [ ] Difficulty matches the requested level or default progression
- [ ] Each hint helps without spoiling
- [ ] Solutions show clear step-by-step reasoning
- [ ] Video/transcript references are accurate
- [ ] Numbers are concrete and realistic
- [ ] Problems are distinct from worked examples in the transcript