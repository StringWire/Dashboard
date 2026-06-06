import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import DeployForm from "../components/DeployForm";
import ServerList from "../components/ServerList";
import AdButton from "../components/AdButton";

const prisma = new PrismaClient();

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");

  const dbUser = await prisma.user.findUnique({
    where: { id: (session.user as any).id }
  });
  if (!dbUser) return redirect("/");

  const settings = await prisma.settings.findFirst();
  const nodes = await prisma.node.findMany();
  const eggs = await prisma.egg.findMany();

  const userServers = await prisma.server.findMany({ 
    where: { userId: dbUser.id },
    include: { egg: true }
  });
  
  const activeServersCount = userServers.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* TOP BANNER */}
        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div>
            <h1 className="text-3xl font-black text-white">Welcome, <span className="text-indigo-400">{dbUser.name}</span></h1>
            <div className="flex gap-3 mt-2">
              <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-md uppercase tracking-wider">ROLE: {dbUser.role}</span>
              {dbUser.role === "ADMIN" && (
                 <span className="text-xs font-bold bg-red-500/20 text-red-300 px-3 py-1 rounded-md uppercase tracking-wider">ADMIN ACTIVE</span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            {dbUser.role === "ADMIN" && (
              <a href="/admin" className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition">Admin Panel</a>
            )}
            <a href="/api/auth/signout" className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold transition">Disconnect Node</a>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-pink-400 mb-1">Wallet Balance</h3>
            <div className="text-4xl font-bold text-white">{dbUser.coins ?? 0} <span className="text-lg text-gray-500">Coins</span></div>
            
            {/* THE REAL AD BUTTON IS INJECTED HERE */}
            <AdButton adLink={settings?.adLink || ""} adCoins={settings?.adCoins || 10} />
            
          </div>

          <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-purple-400 mb-1">Active Servers</h3>
            <div className="text-4xl font-bold mt-2 text-white">{activeServersCount} <span className="text-lg text-gray-500">/ {settings?.maxServers || 3}</span></div>
          </div>

          <div className="bg-indigo-900/20 border border-indigo-500/20 p-6 rounded-2xl relative overflow-hidden">
            <h3 className="text-sm font-bold text-indigo-400 mb-2">Panel Access</h3>
            <div className="space-y-1 z-10 relative">
              <p className="text-xs text-gray-400">URL: <a href={settings?.pteroUrl || "#"} target="_blank" rel="noreferrer" className="text-indigo-300 hover:underline">{settings?.pteroUrl || "Not Configured"}</a></p>
              <p className="text-xs text-gray-400">User: <span className="text-white">{dbUser.email}</span></p>
              <p className="text-xs text-gray-400">Pass: <span className="text-white">{dbUser.panelPassword || "Generates on deploy"}</span></p>
            </div>
          </div>
        </div>

        {/* DEPLOYMENT BOX */}
        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
          <h2 className="text-xl font-black text-white mb-6">Deploy New Server</h2>
          <DeployForm nodes={nodes} eggs={eggs} userCoins={dbUser.coins ?? 0} />
        </div>

        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
          <ServerList servers={userServers} />
        </div>

      </div>
    </div>
  );
}
