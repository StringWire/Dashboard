"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function deleteUserServer(serverId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  const server = await prisma.server.findUnique({ where: { id: serverId } });
  const settings = await prisma.settings.findFirst();

  // Security: Make sure the user actually owns this server!
  if (!server || server.userId !== user?.id) {
      return { error: "Server not found or you don't own it." };
  }

  // 1. DELETE FROM PTERODACTYL
  if (server.pteroId && settings?.pteroUrl && settings?.pteroApiKey) {
      const pteroRes = await fetch(`${settings.pteroUrl}/api/application/servers/${server.pteroId}`, {
          method: "DELETE",
          headers: {
              "Authorization": `Bearer ${settings.pteroApiKey}`,
              "Accept": "Application/vnd.pterodactyl.v1+json"
          }
      });
      
      // If Pterodactyl throws an error (other than 404 not found), stop.
      if (!pteroRes.ok && pteroRes.status !== 404) {
          return { error: "Pterodactyl failed to delete the server." };
      }
  }

  // 2. DELETE FROM DATABASE
  await prisma.server.delete({ where: { id: serverId } });

  revalidatePath("/dashboard");
  return { success: true };
}
