"use client";
import { useState } from "react";
import { provisionServer } from "../dashboard/deploy-actions";

export default function DeployForm({ nodes, eggs, userCoins }: { nodes: any[], eggs: any[], userCoins: number }) {
  const [selectedNodeId, setSelectedNodeId] = useState(nodes.length > 0 ? nodes[0].id : "");
  const [selectedEggId, setSelectedEggId] = useState(eggs.length > 0 ? eggs[0].id : "");
  const [isDeploying, setIsDeploying] = useState(false);

  const activeEgg = eggs.find(e => e.id === selectedEggId);
  const pricePerHour = activeEgg ? activeEgg.price : 0;
  
  const hoursLeft = pricePerHour > 0 ? Math.floor(userCoins / pricePerHour) : 0;
  const daysLeft = (hoursLeft / 24).toFixed(1);

  const handleDeploy = async () => {
    if (hoursLeft < 1) {
      alert("❌ Not enough coins! Watch an ad first.");
      return;
    }
    
    setIsDeploying(true);
    
    const formData = new FormData();
    formData.append("nodeId", selectedNodeId);
    formData.append("eggId", selectedEggId);

    // ACTUALLY READ THE BACKEND RESPONSE
    const result = await provisionServer(formData);
    
    setIsDeploying(false);

    if (result?.error) {
      // PRINT THE REAL ERROR TO THE SCREEN!
      alert("❌ PTERODACTYL ERROR: " + result.error);
    } else {
      alert("✅ SUCCESS: Server deployed!");
      window.location.reload(); // Refresh to update coins instantly
    }
  };

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Node Location</label>
          <select 
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition text-white"
          >
            {nodes.length === 0 ? <option disabled>No Nodes</option> : nodes.map(node => (
              <option key={node.id} value={node.id}>{node.name} ({node.location})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Server Type</label>
          <select 
            value={selectedEggId}
            onChange={(e) => setSelectedEggId(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition text-white"
          >
            {eggs.length === 0 ? <option disabled>No Eggs Added</option> : eggs.map(egg => (
              <option key={egg.id} value={egg.id}>{egg.name} - {egg.price} Coins/hr</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
         <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-indigo-300 font-medium">Server Burn Rate:</span>
            <span className="text-sm text-white font-bold">{pricePerHour} Coins / Hour</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-sm text-indigo-300 font-medium">Estimated Runtime:</span>
            <span className={`text-lg font-black ${hoursLeft < 24 ? 'text-red-400' : 'text-green-400'}`}>
              {hoursLeft} Hours <span className="text-sm text-gray-400 font-medium">({daysLeft} Days)</span>
            </span>
         </div>
      </div>

      <button 
        type="button" 
        onClick={handleDeploy}
        disabled={isDeploying || hoursLeft < 1}
        className={`w-full font-bold py-3 rounded-xl mt-4 transition shadow-lg ${
          isDeploying || hoursLeft < 1 
            ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
        }`}
      >
        {isDeploying ? 'Provisioning...' : 'Provision Server'}
      </button>
    </form>
  );
}
