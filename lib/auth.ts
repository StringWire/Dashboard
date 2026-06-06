import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 6 * 60 * 60, // 6 hours
  },
  callbacks: {
    // --- MASTER ADMIN AUTO-PROMOTION ---
    async signIn({ user, account, profile }) {
      if (profile && profile.id === process.env.ADMIN_DISCORD_ID) {
        try {
          // Instantly upgrade them to Admin in the database
          await prisma.user.update({
            where: { email: user.email! },
            data: { role: 'ADMIN' } 
          });
          console.log(`👑 Master Admin ${user.name} has entered the dashboard!`);
        } catch (error) {
          console.error("Failed to promote admin:", error);
        }
      }
      return true; // Let them finish logging in
    },
    // -----------------------------------
    
    async session({ session, user }: any) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.coins = user.coins;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
