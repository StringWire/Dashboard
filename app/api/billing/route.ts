import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer CRON_SECRET_CODESPACE`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.settings.findFirst();
  if (!settings || !settings.pteroUrl || !settings.pteroApiKey) {
    return NextResponse.json({ error: "Panel not configured" }, { status: 500 });
  }

  const pteroHeaders = {
    "Authorization": `Bearer ${settings.pteroApiKey}`,
    "Content-Type": "application/json",
    "Accept": "Application/vnd.pterodactyl.v1+json"
  };

  // Find ALL servers (both active and suspended)
  const allServers = await prisma.server.findMany({
    include: { user: true, egg: true }
  });

  let processed = 0;
  let suspended = 0;
  let deleted = 0;

  for (const server of allServers) {
    const hourlyCost = server.egg.price;
    const currentCoins = server.user.coins || 0;

    // --- CASE 1: SERVER IS ACTIVE ---
    if (!server.suspended) {
        if (currentCoins >= hourlyCost) {
            // Deduct coins
            await prisma.user.update({
              where: { id: server.user.id },
              data: { coins: { decrement: hourlyCost } }
            });
            processed++;
        } else {
            // Out of money. Suspend and stamp the exact time!
            if (server.pteroId) {
              await fetch(`${settings.pteroUrl}/api/application/servers/${server.pteroId}/suspend`, {
                method: "POST", headers: pteroHeaders
              });
            }
            await prisma.server.update({
              where: { id: server.id },
              data: { suspended: true, status: "suspended", suspendedAt: new Date() } // <-- TIMESTAMP ADDED
            });
            suspended++;
        }
    } 
    // --- CASE 2: SERVER IS ALREADY SUSPENDED (The Grim Reaper) ---
    else if (server.suspended && server.suspendedAt) {
        const hoursSinceSuspension = (new Date().getTime() - new Date(server.suspendedAt).getTime()) / (1000 * 60 * 60);
        const deletionLimit = settings.deleteAfterHours || 48; // Default 48 hours

        if (hoursSinceSuspension >= deletionLimit) {
             // Times up. Nuke it completely from Pterodactyl.
             if (server.pteroId) {
                await fetch(`${settings.pteroUrl}/api/application/servers/${server.pteroId}`, {
                   method: "DELETE", headers: pteroHeaders
                });
             }
             // Remove from Database
             await prisma.server.delete({ where: { id: server.id } });
             deleted++;
        }
    }
  }

  return NextResponse.json({ 
      message: "Billing run complete", 
      processed, 
      suspended, 
      deleted 
  });
}
