"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function claimAdCoins(adCoins: number) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return { error: "Unauthorized" };

  await prisma.user.update({
    where: { id: (session.user as any).id },
    data: { coins: { increment: adCoins } }
  });
  
  return { success: true };
}
