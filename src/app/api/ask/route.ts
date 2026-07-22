import { NextRequest, NextResponse } from "next/server";
import { askGemini, type ChatTurn } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 20;
const MAX_RECORD_CHARS = 12000;
const MAX_MESSAGE_CHARS = 2000;

/**
 * POST /api/ask
 * Body: { messages: {role:"user"|"model", text:string}[], record: string }
 * Returns: { answer } or { error }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const record = String(body?.record || "").slice(0, MAX_RECORD_CHARS);

    const messages: ChatTurn[] = rawMessages
      .slice(-MAX_MESSAGES)
      .filter(
        (m: unknown): m is ChatTurn =>
          !!m &&
          typeof (m as ChatTurn).text === "string" &&
          ((m as ChatTurn).role === "user" || (m as ChatTurn).role === "model"),
      )
      .map((m: ChatTurn) => ({
        role: m.role,
        text: m.text.slice(0, MAX_MESSAGE_CHARS),
      }));

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "Expected a trailing user message." },
        { status: 400 },
      );
    }

    const answer = await askGemini(messages, record);
    return NextResponse.json({ answer });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
