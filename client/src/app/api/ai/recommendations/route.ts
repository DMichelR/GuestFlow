import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";

// Simple in-memory rate limiter per user (not persistent across serverless instances).
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 6; // max requests per user per window
const userRequests: Map<string, number[]> = new Map();

function isRateLimited(userId: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = userRequests.get(userId) || [];
  // keep only timestamps inside window
  const recent = timestamps.filter((t) => t > windowStart);
  recent.push(now);
  userRequests.set(userId, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session.userId;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (isRateLimited(userId)) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured on server");
      return new NextResponse("Server misconfiguration", { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt : undefined;
    if (!prompt) {
      return new NextResponse("Missing prompt", { status: 400 });
    }

    // Initialize client server-side using server-only key
    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const text = response?.text ?? "";
    return NextResponse.json({ recommendations: [text.trim()] });
  } catch (err: unknown) {
    console.error("AI proxy error:", err);
    const status = (err as { status?: number } | undefined)?.status;
    if (status === 429) {
      return new NextResponse("Rate limited by provider", { status: 429 });
    }
    return new NextResponse("Internal AI error", { status: 500 });
  }
}
