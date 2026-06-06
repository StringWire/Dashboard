"use client";
import { useState } from "react";
import { rewardAdWatch } from "../dashboard/ad-actions";

export default function AdButton({ adLink, adCoins }: { adLink: string, adCoins: number }) {
  const [isWatching, setIsWatching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const handleWatchAd = async () => {
    if (!adLink || adLink === "") {
      alert("❌ The Admin hasn't set up the Ad Link yet!");
      return;
    }

    // Try to open the ad (Brave might block this, but we will catch it!)
    try {
        window.open(adLink, "_blank");
    } catch (e) {
        console.log("Popup blocked by browser.");
    }

    setIsWatching(true);
    let time = 15;
    setTimeLeft(time);

    const timer = setInterval(async () => {
      time -= 1;
      setTimeLeft(time);

      if (time <= 0) {
        clearInterval(timer);
        setIsWatching(false);
        await rewardAdWatch();
        window.location.reload(); // Instantly refreshes the balance!
      }
    }, 1000);
  };

  if (isWatching) {
    return (
      <button disabled className="mt-4 w-full bg-black/50 border border-white/10 py-2 rounded-xl text-sm text-gray-400 font-bold cursor-not-allowed transition">
        Verifying Ad... {timeLeft}s
      </button>
    );
  }

  return (
    <button
      onClick={handleWatchAd}
      className="mt-4 w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 py-2 rounded-xl text-sm transition shadow-lg text-green-400 font-bold"
    >
      Watch Ad (+{adCoins} Coins)
    </button>
  );
}
