"use client";

import { BarChart3, Timer, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { deletePoll } from "@/app/actions";

type Option = {
  id: string;
  text: string;
  voteCount: number;
};

type Poll = {
  id: string;
  question: string;
  options: Option[];
  createdAt: Date | string;
  durationSeconds: number;
};

type AdminPollListProps = {
  polls: Poll[];
  pin: string;
};

const POLL_INTERVAL = 2000;
const STORAGE_KEY = "vinyl-deleted-polls";

function getDeletedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addDeletedId(pollId: string) {
  if (typeof window === "undefined") return;
  const ids = getDeletedIds();
  ids.add(pollId);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

function removeDeletedId(pollId: string) {
  if (typeof window === "undefined") return;
  const ids = getDeletedIds();
  ids.delete(pollId);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

export default function AdminPollList({ polls: initialPolls, pin }: AdminPollListProps) {
  const [polls, setPolls] = useState<Poll[]>(() =>
    initialPolls.filter(
      (p) => !getDeletedIds().has(p.id) && (p as { status?: string }).status === "open"
    )
  );
  const [isPending, startTransition] = useTransition();

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch(`/api/polls?all=1&_=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as (Poll & { status?: string })[];
        const deleted = getDeletedIds();
        const open = data.filter(
          (p) => p.status === "open" && !deleted.has(p.id)
        );
        setPolls(open);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const id = setInterval(fetchPolls, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchPolls]);

  const handleDelete = useCallback(
    (pollId: string) => {
      if (!confirm("Удалить этот опрос?")) return;
      addDeletedId(pollId);
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
      startTransition(async () => {
        const result = await deletePoll(pollId, pin);
        if (!result?.success) {
          removeDeletedId(pollId);
          fetchPolls();
        }
      });
    },
    [pin, fetchPolls]
  );

  if (polls.length === 0) {
    return (
      <p className="text-text/50 text-sm py-4">Опросов пока нет</p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-text font-semibold text-sm">Ваши опросы</h2>
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
        {polls.map((poll) => {
          const createdAtMs = new Date(poll.createdAt).getTime();
          const endAtMs = createdAtMs + (poll.durationSeconds ?? 60) * 1000;
          const isExpired = Date.now() >= endAtMs;
          const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0);
          const winner = !isExpired
            ? null
            : poll.options.reduce(
                (best, o) => (o.voteCount > (best?.voteCount ?? 0) ? o : best),
                null as Option | null
              );

          return (
            <div
              key={poll.id}
              className="bg-bg rounded-lg border border-border p-3 text-sm flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-text font-medium truncate">{poll.question}</p>
                <p className="text-text/60 text-xs mt-1.5">
                  {poll.options.map((o) => o.text).join(" · ")}
                </p>
                <div className="flex items-center gap-3 mt-2 text-text/60 text-xs flex-wrap">
                  <span className="flex items-center gap-1">
                    <Timer size={12} />
                    {poll.durationSeconds === 120
                      ? "2 мин"
                      : poll.durationSeconds === 60
                      ? "1 мин"
                      : poll.durationSeconds === 30
                      ? "30 сек"
                      : "15 сек"}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 size={12} />
                    {totalVotes} голосов
                  </span>
                  {isExpired && winner && (
                    <span className="text-text/80">Победитель: {winner.text}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(poll.id)}
                disabled={isPending}
                className="p-2 rounded-lg text-text/60 hover:text-red-400 hover:bg-bg/80 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Удалить опрос"
                title="Удалить"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
