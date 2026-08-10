import { ArrowRight, CheckCircle2, Clock, MessageCircle } from "lucide-react";

const CHAT_MESSAGES = [
  { from: "Mia", text: "yo can everyone send their share? 😅" },
  { from: "me", text: "netflix is $15.99, your share is $4" },
  { from: "Mia", text: "send money 🙏" },
  { from: "Jake", text: "sent?" },
  { from: "me", text: "still waiting on 2 people..." },
] as const;

const AFTER_ROWS = [
  { label: "Alex paid $4.00", ok: true },
  { label: "Jordan paid $4.00", ok: true },
  { label: "Sam pending — reminder sent", ok: false },
  { label: "Meme reminder scheduled 🍕", ok: true },
] as const;

function ChatMock() {
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Group chat</p>
        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
          <MessageCircle className="h-3 w-3" />
          47 messages
        </span>
      </div>
      <div className="space-y-2">
        {CHAT_MESSAGES.map((m, i) => (
          <div
            key={i}
            className={
              m.from === "me"
                ? "ml-8 rounded-lg rounded-tr-sm bg-primary/10 px-3 py-1.5 text-xs"
                : "mr-8 rounded-lg rounded-tl-sm bg-muted px-3 py-1.5 text-xs"
            }
          >
            <span className="block text-[10px] font-medium text-muted-foreground">
              {m.from}
            </span>
            {m.text}
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        "hey, did you get my venmo?" ×4
      </p>
    </div>
  );
}

function AfterMock() {
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">SubSplit</p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          All caught up
        </span>
      </div>
      <div className="space-y-1.5">
        {AFTER_ROWS.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
          >
            <span className="font-medium">{row.label}</span>
            {row.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        No texts. No awkwardness. Just green checks.
      </p>
    </div>
  );
}

/** Секция "From chaos to clarity": чат vs SubSplit */
export function BeforeAfter() {
  return (
    <section className="border-t bg-muted/40">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            From chaos to clarity
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Stop chasing payments in group chats. SubSplit tracks everything so
            nobody has to ask.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-xl border bg-background shadow-lg">
            <ChatMock />
          </div>

          <div className="hidden items-center justify-center md:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ArrowRight className="h-5 w-5" />
            </span>
          </div>

          <div className="rounded-xl border border-emerald-600/30 bg-background shadow-lg">
            <AfterMock />
          </div>
        </div>
      </div>
    </section>
  );
}
