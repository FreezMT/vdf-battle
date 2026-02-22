"use client";

import { Archive, Check, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { deletePoll, publishPoll } from "@/app/actions";

type Option = {
  id: string;
  text: string;
  voteCount: number;
};

type Poll = {
  id: string;
  question: string;
  status: string;
  options: Option[];
  createdAt: Date | string;
  durationSeconds: number;
};

type AdminArchiveProps = {
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

export default function AdminArchive({ polls: initialPolls, pin }: AdminArchiveProps) {
  const [polls, setPolls] = useState<Poll[]>(() =>
    initialPolls.filter((p) => !getDeletedIds().has(p.id))
  );
  const [isPending, startTransition] = useTransition();

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch(`/api/polls?all=1&_=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as Poll[];
        const deleted = getDeletedIds();
        const closed = data.filter((p) => p.status === "closed" && !deleted.has(p.id));
        setPolls(closed);
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

  const handlePublish = useCallback(
    (pollId: string) => {
      if (!confirm("Опубликовать этот опрос? Он появится в ленте.")) return;
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
      startTransition(async () => {
        const result = await publishPoll(pollId, pin);
        if (!result?.success) {
          fetchPolls();
        }
      });
    },
    [pin, fetchPolls]
  );

  return (
    <div className="space-y-4">
      <h2 className="text-text font-semibold text-sm flex items-center gap-2">
        <Archive size={16} />
        Архив
      </h2>
      {polls.length === 0 ? (
        <p className="text-text/50 text-sm py-4">Архив пуст</p>
      ) : (
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="bg-bg rounded-lg border border-border p-3 text-sm flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-text font-medium truncate">{poll.question}</p>
                <p className="text-text/60 text-xs mt-1.5">
                  {poll.options.map((o) => o.text).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePublish(poll.id)}
                  disabled={isPending}
                  className="p-2 rounded-lg text-text/60 hover:text-green-500 hover:bg-bg/80 transition-colors disabled:opacity-50"
                  aria-label="Опубликовать"
                  title="Опубликовать"
                >
                  <Check size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(poll.id)}
                  disabled={isPending}
                  className="p-2 rounded-lg text-text/60 hover:text-red-400 hover:bg-bg/80 transition-colors disabled:opacity-50"
                  aria-label="Удалить"
                  title="Удалить"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
