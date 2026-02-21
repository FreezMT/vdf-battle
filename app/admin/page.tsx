import DynamicIslandHeader from "@/components/DynamicIslandHeader";
import AdminGate from "./AdminGate";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: { options: true },
  });

  return (
    <>
      <DynamicIslandHeader />
      <main className="pt-20 pb-12 px-4 max-w-[600px] mx-auto">
        <AdminGate polls={polls} />
      </main>
    </>
  );
}
