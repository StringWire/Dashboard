"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function rewardAdWatch() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return { error: "Not logged in" };

  const settings = await prisma.settings.findFirst();
  const rewardAmount = settings?.adCoins || 15;

  await prisma.user.update({
    where: { id: (session.user as any).id },
    data: { coins: { increment: rewardAmount } }
  });

  revalidatePath("/dashboard");
  return { success: true, amount: rewardAmount };
}
