"use client";
import { useState } from "react";
import { deleteUserServer } from "../dashboard/server-actions";

export default function ServerList({ servers }: { servers: any[] }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will PERMANENTLY delete your server and all its files!")) return;
    
    setIsDeleting(id);
    const result = await deleteUserServer(id);
    
    if (result?.error) {
      alert("❌ Error: " + result.error);
      setIsDeleting(null);
    } else {
      alert("✅ Server successfully deleted!");
      window.location.reload();
    }
  };

  if (servers.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-white mb-4">Your Active Servers</h3>
      <div className="space-y-4">
        {servers.map(server => (
          <div key={server.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center">
            <div>
              <h4 className="text-lg font-bold text-white">{server.name}</h4>
              <p className="text-sm text-gray-400">
                Status: <span className={server.suspended ? "text-red-400" : "text-green-400"}>
                  {server.suspended ? "Suspended" : "Active"}
                </span>
              </p>
            </div>
            <button 
              onClick={() => handleDelete(server.id)}
              disabled={isDeleting === server.id}
              className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white px-4 py-2 rounded-lg font-bold transition"
            >
              {isDeleting === server.id ? "Deleting..." : "Delete Server"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
