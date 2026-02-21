"use client";

import { vote } from "@/app/actions";
import { BarChart3, Timer, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTransition } from "react";

type Option = {
  id: string;
  text: string;
  voteCount: number;
};

type PollCardProps = {
  poll: {
    id: string;
    question: string;
    options: Option[];
    createdAt: Date;
    durationSeconds: number;
  };
  votedPollIds: string[];
  onVoteSuccess: (pollId: string) => void;
};

function getPercentages(options: Option[]): Record<string, number> {
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  if (total === 0) {
    return Object.fromEntries(options.map((o) => [o.id, 0]));
  }
  return Object.fromEntries(
    options.map((o) => [o.id, Math.round((o.voteCount / total) * 100)])
  );
}

function getWinner(options: Option[]): Option | null {
  if (options.length === 0) return null;
  const max = Math.max(...options.map((o) => o.voteCount));
  if (max === 0) return null;
  return options.find((o) => o.voteCount === max) ?? null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, "0")}`;
  return `${s} сек`;
}

export default function PollCard({
  poll,
  votedPollIds,
  onVoteSuccess,
}: PollCardProps) {
  const [isPending, startTransition] = useTransition();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const hasVoted = votedPollIds.includes(poll.id);
  const percentages = getPercentages(poll.options);
  const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0);
  const winner = getWinner(poll.options);

  const createdAtMs = new Date(poll.createdAt).getTime();
  const durationMs = (poll.durationSeconds ?? 60) * 1000;
  const endAtMs = createdAtMs + durationMs;

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now >= endAtMs) {
        setRemainingSeconds(0);
        return;
      }
      setRemainingSeconds(Math.ceil((endAtMs - now) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAtMs]);

  const isExpired = remainingSeconds === 0;

  const handleVote = useCallback(
    (optionId: string) => {
      if (hasVoted || isPending || isExpired) return;
      startTransition(async () => {
        await vote(optionId, poll.id);
        onVoteSuccess(poll.id);
      });
    },
    [hasVoted, isPending, isExpired, poll.id, onVoteSuccess]
  );

  const showResults = hasVoted || totalVotes > 0 || isExpired;

  return (
    <article className="bg-surface rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-text font-semibold text-base flex-1">
          {poll.question}
        </h2>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
            isExpired ? "bg-border/50 text-text/70" : "bg-bg text-text"
          }`}
        >
          <Timer size={12} />
          {remainingSeconds !== null && !isExpired && (
            <span>{formatTime(remainingSeconds)}</span>
          )}
          {isExpired && <span>Завершено</span>}
        </div>
      </div>

      {isExpired && winner && (
        <div className="mb-4 p-3 rounded-lg bg-bg border border-border flex items-center gap-3">
          <Trophy size={24} className="text-text shrink-0" />
          <div>
            <p className="text-xs text-text/60">Победитель</p>
            <p className="text-text font-semibold">{winner.text}</p>
            {totalVotes > 0 && (
              <p className="text-xs text-text/50">
                {percentages[winner.id]}% ({winner.voteCount} голосов)
              </p>
            )}
          </div>
        </div>
      )}

      {showResults ? (
        <div className="space-y-3">
          {poll.options.map((opt) => (
            <div key={opt.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-text">{opt.text}</span>
                <span className="text-text/70">{percentages[opt.id]}%</span>
              </div>
              <div className="h-2 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-border rounded-full transition-all duration-500"
                  style={{ width: `${percentages[opt.id]}%` }}
                />
              </div>
            </div>
          ))}
          {totalVotes > 0 && (
            <p className="text-xs text-text/50 flex items-center gap-1 mt-2">
              <BarChart3 size={12} />
              {totalVotes}{" "}
              {totalVotes === 1 ? "голос" : "голосов"}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {poll.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={isPending || isExpired}
              className="w-full text-left px-4 py-3 rounded-lg border border-border bg-bg hover:bg-border/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm text-text"
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
