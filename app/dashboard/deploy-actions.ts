"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function provisionServer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return { error: "Unauthorized" };

  const nodeId = formData.get("nodeId") as string;
  const eggId = formData.get("eggId") as string;

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  const egg = await prisma.egg.findUnique({ where: { id: eggId } });
  const settings = await prisma.settings.findFirst();
  
  if (!user || !egg || !settings || !settings.pteroUrl || !settings.pteroApiKey) {
      return { error: "Missing configuration" };
  }

  const activeServersCount = await prisma.server.count({ where: { userId: user.id } });
  if (activeServersCount >= (settings.maxServers || 3)) {
      return { error: `Server limit reached. You can only have ${settings.maxServers} servers.` };
  }

  if ((user.coins ?? 0) < egg.price) {
      return { error: `Not enough coins! You need at least ${egg.price} coins for the first hour.` };
  }

  let panelPass = user.panelPassword;
  if (!panelPass) {
    panelPass = Math.random().toString(36).slice(-8) + "X9!";
    await prisma.user.update({ where: { id: user.id }, data: { panelPassword: panelPass } });
  }

  const pteroHeaders = {
      "Authorization": `Bearer ${settings.pteroApiKey}`,
      "Content-Type": "application/json",
      "Accept": "Application/vnd.pterodactyl.v1+json"
  };

  const userEmail = user.email || `user_${user.id.substring(0, 6)}@codespace.local`;
  const username = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  
  const pteroUserRes = await fetch(`${settings.pteroUrl}/api/application/users`, {
      method: "POST", headers: pteroHeaders,
      body: JSON.stringify({
          email: userEmail, username: username,
          first_name: user.name || "Codespace", last_name: "User",
          password: panelPass
      })
  });
  
  let pteroUserData = await pteroUserRes.json();
  let pteroUserId = pteroUserData.attributes?.id;

  if (!pteroUserId) {
      const existingUserRes = await fetch(`${settings.pteroUrl}/api/application/users?filter[email]=${userEmail}`, { headers: pteroHeaders });
      const existingUserData = await existingUserRes.json();
      pteroUserId = existingUserData.data[0]?.attributes?.id;
  }
  if (!pteroUserId) return { error: "Failed to create or find Pterodactyl user." };

  const eggDetailsRes = await fetch(`${settings.pteroUrl}/api/application/nests/${egg.pteroNestId}/eggs/${egg.pteroEggId}?include=variables`, {
      method: "GET", headers: pteroHeaders
  });
  const eggDetails = await eggDetailsRes.json();
  if (!eggDetails.attributes) return { error: "Could not fetch Egg details from panel." };

  const environmentVars: any = {};
  const variables = eggDetails.attributes.relationships?.variables?.data || [];
  for (const v of variables) environmentVars[v.attributes.env_variable] = v.attributes.default_value;

  const pteroServerRes = await fetch(`${settings.pteroUrl}/api/application/servers`, {
      method: "POST", headers: pteroHeaders,
      body: JSON.stringify({
          name: `${user.name}'s ${egg.name}`,
          user: pteroUserId,
          egg: egg.pteroEggId,
          docker_image: eggDetails.attributes.docker_image,
          startup: eggDetails.attributes.startup,
          environment: environmentVars,
          // NEW DYNAMIC LIMITS INJECTED HERE
          limits: { 
              memory: egg.ram, swap: 0, disk: egg.disk, io: 500, cpu: egg.cpu, 
              threads: egg.cpuPinning === "" ? null : egg.cpuPinning 
          },
          feature_limits: { databases: egg.databases, backups: egg.backups, allocations: egg.allocations },
          deploy: { locations: [1], dedicated_ip: false, port_range: [] }
      })
  });

  const pteroServerData = await pteroServerRes.json();
  if (pteroServerData.errors) return { error: pteroServerData.errors[0].detail || "Panel rejected the server." };

  await prisma.user.update({
      where: { id: user.id },
      data: { coins: { decrement: egg.price } }
  });

  await prisma.server.create({
    data: {
        name: `${user.name}'s ${egg.name}`,
        userId: user.id,
        nodeId: nodeId,
        eggId: eggId,
        status: "provisioning",
        pteroId: pteroServerData.attributes.id 
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}
