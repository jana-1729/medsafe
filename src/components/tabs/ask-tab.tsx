"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Send, Loader2, ShieldCheck } from "lucide-react";
import { buildRecordContext, type RecordBundle } from "@/lib/record-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "model"; text: string };

/** Render inline **bold** segments. */
function renderInline(s: string, keyBase: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith("**") && seg.endsWith("**") ? (
      <strong key={`${keyBase}-${i}`}>{seg.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyBase}-${i}`}>{seg}</span>
    ),
  );
}

/** Lightweight renderer: paragraphs, "- " bullets, and **bold**. */
function MessageText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const isBullet = /^\s*[-*]\s+/.test(line);
        const content = line.replace(/^\s*[-*]\s+/, "");
        return isBullet ? (
          <div key={i} className="flex gap-1.5">
            <span className="mt-px text-muted-foreground">•</span>
            <span>{renderInline(content, `l${i}`)}</span>
          </div>
        ) : (
          <p key={i}>{renderInline(content, `l${i}`)}</p>
        );
      })}
    </div>
  );
}

const SUGGESTIONS = [
  "What medications am I on?",
  "When was my last tetanus shot?",
  "Is anything out of range?",
  "Summarize my active problems",
  "Am I due for any vaccines?",
];

/** Ask-your-records — a chat grounded only in the patient's connected FHIR. */
export function AskTab({ bundle }: { bundle: RecordBundle }) {
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const record = useMemo(() => buildRecordContext(bundle), [bundle]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next: Turn[] = [...messages, { role: "user", text: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, record }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setMessages((m) => [...m, { role: "model", text: data.answer }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages((m) => [
        ...m,
        { role: "model", text: `⚠️ Couldn't get an answer: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex h-[560px] flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 border-b px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
          <Sparkles className="size-4" />
        </span>
        <div>
          <div className="text-sm font-semibold leading-tight">
            Ask your records
          </div>
          <div className="text-xs text-muted-foreground">
            Answers grounded only in your connected records
          </div>
        </div>
      </div>

      <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <Sparkles className="size-6" />
            </span>
            <p className="mt-3 font-medium">Ask about your health record</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Plain-language answers pulled straight from your connected data —
              with the source cited. Not medical advice.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full"
                  onClick={() => send(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "whitespace-pre-wrap bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {m.role === "user" ? m.text : <MessageText text={m.text} />}
              </div>
            </div>
          ))
        )}

        {loading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Reading your records…
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </CardContent>

      <div className="border-t p-3">
        {messages.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <Button
                key={s}
                size="xs"
                variant="outline"
                className="rounded-full"
                onClick={() => send(s)}
                disabled={loading}
              >
                {s}
              </Button>
            ))}
          </div>
        ) : null}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your meds, labs, visits…"
            className="h-10 flex-1 rounded-xl border bg-background px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <Button type="submit" size="icon" className="size-10 shrink-0" disabled={loading}>
            <Send className="size-4" />
          </Button>
        </form>
        <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3" />
          Grounded in your records · not medical advice · confirm with your doctor
        </p>
      </div>
    </Card>
  );
}
