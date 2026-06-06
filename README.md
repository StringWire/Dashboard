# Codespace Dashboard 🚀

A professional, fully automated hosting dashboard built with Next.js and integrated directly with Pterodactyl Panel. It features an automated hourly billing engine, auto-suspension for expired servers, and an integrated ad-watching system for users to earn free server coins.

## ⚡ One-Click Installation (Recommended)

The easiest way to deploy the entire Codespace Dashboard, including the automated background billing engine, is to run our one-click auto-installer on a fresh Ubuntu VPS.

Run this command in your terminal:

```bash
bash <(curl -s [https://raw.githubusercontent.com/StringWire/Dashboard/main/install.sh](https://raw.githubusercontent.com/StringWire/Dashboard/main/install.sh))
The installer will automatically:
```
Install Node.js 20, Git, and PM2.

Prompt you for your MongoDB URL and Pterodactyl API Keys.

Build the Next.js dashboard.

Launch the application via PM2.

Program the Linux Cron Job for the hourly automated billing worker.

🛠️ Features
Pterodactyl Integration: Deploy, start, stop, and restart servers directly from the dashboard without logging into the panel.

Automated Billing Engine: Background cron worker automatically deducts coins hourly based on server resource usage.

The Grim Reaper: Servers are automatically suspended when a user hits 0 coins, and permanently deleted after 48 hours to save space.

Ad-Based Economy: Trustless 15-second ad-watching verification system to reward users with coins safely.

Admin Control Panel: Manage users, gift coins, adjust global pricing, and monitor system health.

💻 Manual Developer Setup
If you want to edit the code or run the project locally on your development machine instead of using the auto-installer:

1. Install the dependencies:

Bash
npm install
2. Configure your environment variables:
Copy the example file to create your local config.

Bash
cp .env.example .env
(Make sure to fill in your DATABASE_URL, NEXTAUTH_SECRET, PTERODACTYL_URL, and PTERODACTYL_API_KEY inside the new .env file).

3. Sync the Prisma database schema:

Bash
npx prisma db push
4. Run the development server:

Bash
npm run dev
Open http://localhost:3000 with your browser to see the result. You can start editing the page by modifying app/page.tsx. The page auto-updates as you edit the file.
