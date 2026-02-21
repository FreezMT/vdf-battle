import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  const polls = await prisma.poll.findMany({
    where: all ? undefined : { status: "open" },
    orderBy: { createdAt: "desc" },
    include: { options: true },
  });
  return NextResponse.json(polls);
}
