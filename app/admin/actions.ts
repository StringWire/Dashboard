"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function saveSettings(formData: FormData) {
  const data = {
    pteroUrl: formData.get("pteroUrl") as string,
    pteroApiKey: formData.get("pteroApiKey") as string,
    adLink: formData.get("adLink") as string,
    adCoins: Number(formData.get("adCoins")),
    maxServers: Number(formData.get("maxServers")),
    suspendHours: Number(formData.get("suspendHours")),
  };

  const existing = await prisma.settings.findFirst();
  if (existing) {
    await prisma.settings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.settings.create({ data });
  }
  
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function addNode(formData: FormData) {
  await prisma.node.create({
    data: {
      name: formData.get("name") as string,
      location: formData.get("location") as string,
      ram: Number(formData.get("ram")),
      maxServers: Number(formData.get("maxServers")), // NEW LIMIT
      ramUsed: 0,
    }
  });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function deleteNode(formData: FormData) {
  await prisma.node.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function addEgg(formData: FormData) {
  await prisma.egg.create({
    data: {
      name: formData.get("name") as string,
      pteroNestId: Number(formData.get("pteroNestId")),
      pteroEggId: Number(formData.get("pteroEggId")),
      price: Number(formData.get("price")),
      ram: Number(formData.get("ram")),     // NEW SPECS
      cpu: Number(formData.get("cpu")),     // NEW SPECS
      disk: Number(formData.get("disk")),   // NEW SPECS
    }
  });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function deleteEgg(formData: FormData) {
  await prisma.egg.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
