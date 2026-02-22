"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const VOTED_COOKIE = "voted_polls";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const DURATION_OPTIONS = [15, 30, 60, 120] as const;

const DEFAULT_QUESTION = "Кто выиграет батл?";

export async function createPoll(formData: FormData) {
  const questionRaw = (formData.get("question") as string)?.trim();
  const question = questionRaw || DEFAULT_QUESTION;
  const optionsRaw = formData.get("options") as string;
  const duration = parseInt(formData.get("durationSeconds") as string, 10);
  const status = (formData.get("status") as string) === "open" ? "open" : "closed";

  const options = optionsRaw
    ? optionsRaw
        .split("\n")
        .map((o) => o.trim())
        .filter((o) => o.length > 0)
    : [];

  if (options.length < 2 || options.length > 10) {
    return { error: "Нужно от 2 до 10 вариантов ответа" };
  }

  const durationSeconds = DURATION_OPTIONS.includes(duration as 15 | 30 | 60 | 120)
    ? duration
    : 60;

  await prisma.poll.create({
    data: {
      question,
      durationSeconds,
      status,
      options: {
        create: options.map((text) => ({ text })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function vote(optionId: string, pollId: string) {
  const option = await prisma.option.findUnique({
    where: { id: optionId },
    include: { poll: true },
  });
  if (!option || option.pollId !== pollId) {
    return { error: "Invalid vote" };
  }
  if (option.poll.status !== "open") {
    return { error: "Опрос недоступен" };
  }
  const endAt = new Date(option.poll.createdAt);
  endAt.setSeconds(endAt.getSeconds() + (option.poll.durationSeconds ?? 60));
  if (new Date() >= endAt) {
    return { error: "Голосование завершено" };
  }

  await prisma.option.update({
    where: { id: optionId },
    data: { voteCount: { increment: 1 } },
  });

  const cookieStore = await cookies();
  const existing = cookieStore.get(VOTED_COOKIE)?.value || "";
  const ids = new Set(existing ? existing.split(",") : []);
  ids.add(pollId);
  cookieStore.set(VOTED_COOKIE, Array.from(ids).join(","), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  revalidatePath("/");
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const adminPin = process.env.ADMIN_PIN || "1234";
  return pin === adminPin;
}

export async function deletePoll(pollId: string, pin: string) {
  const adminPin = process.env.ADMIN_PIN || "1234";
  if (pin !== adminPin) {
    return { error: "Неверный PIN" };
  }
  try {
    await prisma.poll.delete({ where: { id: pollId } });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2025") {
      return { success: true };
    }
    throw e;
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function publishPoll(pollId: string, pin: string) {
  const adminPin = process.env.ADMIN_PIN || "1234";
  if (pin !== adminPin) {
    return { error: "Неверный PIN" };
  }
  try {
    await prisma.poll.update({
      where: { id: pollId },
      data: { status: "open", createdAt: new Date() },
    });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2025") return { error: "Опрос не найден" };
    throw e;
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
