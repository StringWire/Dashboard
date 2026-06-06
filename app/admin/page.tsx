import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export default async function AdminDashboard() {
  const settings = await prisma.settings.findFirst();
  const nodes = await prisma.node.findMany();
  const eggs = await prisma.egg.findMany();

  // --- SERVER ACTIONS ---
  async function saveSettings(formData: FormData) {
    "use server";
    const data = {
      pteroUrl: formData.get("pteroUrl") as string,
      pteroApiKey: formData.get("pteroApiKey") as string,
      adLink: formData.get("adLink") as string,
      adCoins: parseInt(formData.get("adCoins") as string) || 10,
      maxServers: parseInt(formData.get("maxServers") as string) || 3,
      deleteAfterHours: parseInt(formData.get("deleteAfterHours") as string) || 48,
    };
    const existing = await prisma.settings.findFirst();
    if (existing) {
      await prisma.settings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.settings.create({ data });
    }
    revalidatePath("/admin");
  }

  async function saveNode(formData: FormData) {
    "use server";
    await prisma.node.create({
      data: {
        name: formData.get("name") as string,
        location: formData.get("location") as string,
        ram: parseInt(formData.get("ram") as string),
        maxServers: parseInt(formData.get("maxServers") as string),
      }
    });
    revalidatePath("/admin");
  }

  // THE MISSING NODE DELETION ACTION!
  async function deleteNodeAction(formData: FormData) {
      "use server";
      await prisma.node.delete({ where: { id: formData.get("id") as string }});
      revalidatePath("/admin");
  }

  async function saveEgg(formData: FormData) {
    "use server";
    await prisma.egg.create({
      data: {
        name: formData.get("name") as string,
        pteroNestId: parseInt(formData.get("pteroNestId") as string),
        pteroEggId: parseInt(formData.get("pteroEggId") as string),
        ram: parseInt(formData.get("ram") as string),
        cpu: parseInt(formData.get("cpu") as string),
        disk: parseInt(formData.get("disk") as string),
        price: parseInt(formData.get("price") as string),
        backups: parseInt(formData.get("backups") as string) || 1,
        databases: parseInt(formData.get("databases") as string) || 1,
        allocations: parseInt(formData.get("allocations") as string) || 1,
        cpuPinning: formData.get("cpuPinning") as string || "",
      }
    });
    revalidatePath("/admin");
  }

  async function deleteEggAction(formData: FormData) {
      "use server";
      await prisma.egg.delete({ where: { id: formData.get("id") as string }});
      revalidatePath("/admin");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 font-sans text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black">Codespace <span className="text-indigo-500">Admin</span></h1>
            <a href="/dashboard" className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition">Back to Dashboard</a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            
            {/* INFRASTRUCTURE NODES */}
            <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">Infrastructure Nodes</h2>
              <form action={saveNode} className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <input name="name" placeholder="Name (e.g. DE-1)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="location" placeholder="Location (DE)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="ram" type="number" placeholder="Total RAM (MB)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="maxServers" type="number" placeholder="Max Server Capacity" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                </div>
                <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 font-bold py-2 rounded-xl transition">ADD NODE</button>
              </form>
              <div className="space-y-2">
                {nodes.map(node => (
                  <div key={node.id} className="p-3 bg-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold">{node.name}</span> <span className="text-xs text-gray-400">({node.location})</span>
                      <p className="text-xs text-indigo-400">Cap: {node.maxServers} Servers</p>
                    </div>
                    {/* THE MISSING NODE DROP BUTTON IS HERE! */}
                    <form action={deleteNodeAction}>
                        <input type="hidden" name="id" value={node.id} />
                        <button type="submit" className="text-xs font-bold text-red-400 hover:text-red-300">DROP</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>

            {/* PTERODACTYL EGGS */}
            <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">Pterodactyl Eggs</h2>
              <form action={saveEgg} className="space-y-4 mb-6">
                <input name="name" placeholder="Name (e.g. Paper MC)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                <div className="grid grid-cols-2 gap-4">
                  <input name="pteroNestId" type="number" placeholder="Nest ID" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="pteroEggId" type="number" placeholder="Egg ID" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="ram" type="number" placeholder="RAM (MB)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="cpu" type="number" placeholder="CPU (%)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="disk" type="number" placeholder="Disk (MB)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="price" type="number" placeholder="Price (Coins/hr)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="backups" type="number" placeholder="Backups Limit" defaultValue="1" className="w-full bg-indigo-900/20 border border-indigo-500/30 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="databases" type="number" placeholder="Databases Limit" defaultValue="1" className="w-full bg-indigo-900/20 border border-indigo-500/30 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="allocations" type="number" placeholder="Port Allocations" defaultValue="1" className="w-full bg-indigo-900/20 border border-indigo-500/30 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" required />
                  <input name="cpuPinning" type="text" placeholder="CPU Pinning (e.g. 1-2) Optional" className="w-full bg-indigo-900/20 border border-indigo-500/30 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm" />
                </div>
                <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 font-bold py-2 rounded-xl transition">ADD EGG WITH LIMITS</button>
              </form>
              <div className="space-y-2">
                {eggs.map(egg => (
                  <div key={egg.id} className="p-3 bg-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold">{egg.name}</span>
                      <p className="text-xs text-gray-400">{egg.ram}MB RAM | {egg.cpu}% CPU | {egg.price} Coins/hr</p>
                      <p className="text-xs text-indigo-400 mt-1">DBs: {egg.databases} | Backups: {egg.backups} | Ports: {egg.allocations}</p>
                    </div>
                    <form action={deleteEggAction}>
                        <input type="hidden" name="id" value={egg.id} />
                        <button type="submit" className="text-xs font-bold text-red-400 hover:text-red-300">DROP</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">Master Settings</h2>
              <form action={saveSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pterodactyl URL</label>
                  <input name="pteroUrl" defaultValue={settings?.pteroUrl || ""} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">App API Key</label>
                  <input name="pteroApiKey" type="password" defaultValue={settings?.pteroApiKey || ""} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Adsterra Direct Link</label>
                  <input name="adLink" defaultValue={settings?.adLink || ""} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Coins Per Ad</label>
                    <input name="adCoins" type="number" defaultValue={settings?.adCoins || 10} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Max Servers / User</label>
                    <input name="maxServers" type="number" defaultValue={settings?.maxServers || 3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 outline-none focus:border-indigo-500 text-sm" />
                  </div>
                </div>
                <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl mt-4">
                   <label className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-2">☠️ Grim Reaper Setting</label>
                   <p className="text-xs text-gray-400 mb-2">How many hours after running out of coins should the server be permanently deleted from Pterodactyl?</p>
                   <input name="deleteAfterHours" type="number" defaultValue={settings?.deleteAfterHours || 48} className="w-full bg-black/50 border border-red-500/30 rounded-xl px-4 py-2 outline-none focus:border-red-500 text-sm text-red-100" />
                </div>
                <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 font-bold py-3 mt-4 rounded-xl transition shadow-lg shadow-indigo-500/20">SAVE MASTER SETTINGS</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
