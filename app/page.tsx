import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import DynamicIslandHeader from "@/components/DynamicIslandHeader";
import PollFeed from "@/components/PollFeed";

export default async function HomePage() {
  const cookieStore = await cookies();
  const votedRaw = cookieStore.get("voted_polls")?.value || "";
  const votedPollIds = votedRaw ? votedRaw.split(",") : [];

  const polls = await prisma.poll.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: { options: true },
  });

  return (
    <>
      <DynamicIslandHeader />
      <main className="pt-20 pb-24 px-4 max-w-[600px] mx-auto">
        <PollFeed polls={polls} votedPollIds={votedPollIds} />
      </main>
      <footer className="fixed bottom-0 left-0 right-0 py-2 text-center">
        <a
          href="/admin"
          className="text-text/30 hover:text-text/50 text-xs transition-colors"
          aria-label="Админ-панель"
        >
          •
        </a>
      </footer>
    </>
  );
}
