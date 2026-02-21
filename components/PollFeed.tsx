"use client";

import { useCallback, useEffect, useState } from "react";
import PollCard from "./PollCard";

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

type PollFeedProps = {
  polls: Poll[];
  votedPollIds: string[];
};

const POLL_INTERVAL = 2000;

export default function PollFeed({ polls: initialPolls, votedPollIds: initialVoted }: PollFeedProps) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [votedPollIds, setVotedPollIds] = useState<string[]>(initialVoted);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await fetch("/api/polls");
        if (res.ok) {
          const data = await res.json();
          setPolls(data);
        }
      } catch {
        // ignore network errors
      }
    };
    const id = setInterval(fetchPolls, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const onVoteSuccess = useCallback((pollId: string) => {
    setVotedPollIds((prev) => (prev.includes(pollId) ? prev : [...prev, pollId]));
  }, []);

  if (polls.length === 0) {
    return (
      <div className="text-center py-16 text-text/50 text-sm">
        Пока нет опросов. Скоро здесь появятся голосования.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={{ ...poll, createdAt: new Date(poll.createdAt) }}
          votedPollIds={votedPollIds}
          onVoteSuccess={onVoteSuccess}
        />
      ))}
    </div>
  );
}
