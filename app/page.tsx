'use client';
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  const handleLogin = async () => {
    // 1. Create a "Digital Fingerprint" of the browser
    const fingerprintData = [
      navigator.userAgent,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      navigator.language
    ].join('|');
    
    // 2. Encode it so it's a clean string
    const browserHash = btoa(fingerprintData);

    // 3. Send the user to Discord and pass the fingerprint to our backend
    signIn('discord', { 
      callbackUrl: '/dashboard' 
    }, { 
      browserHash // This is the secret key we use to catch alts!
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] font-sans text-white overflow-hidden">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>

      <main className="relative z-10 flex flex-col items-center p-12 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl max-w-md w-full text-center">
        <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
           <h2 className="text-sm font-black tracking-[0.3em] text-blue-400 uppercase">System Node</h2>
        </div>

        <h1 className="text-5xl font-bold tracking-tighter mb-4">
          CODESPACE<span className="text-blue-500">.</span>
        </h1>
        
        <p className="text-zinc-400 leading-relaxed mb-10">
          Professional hosting infrastructure. <br/>
          Secure your session to continue.
        </p>

        <button
          onClick={handleLogin}
          className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] font-bold text-white transition-all hover:bg-[#4752C4] hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="text-lg">Login with Discord</span>
          <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>

        <div className="mt-8 flex flex-col gap-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
            Managed by String Wire Gamer
          </p>
        </div>
      </main>
    </div>
  );
}
