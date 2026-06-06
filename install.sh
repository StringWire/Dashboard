#!/bin/bash
echo -e "\e[34m=========================================\e[0m"
echo -e "\e[36m   Codespace Dashboard Auto-Installer\e[0m"
echo -e "\e[34m=========================================\e[0m"

echo -e "\e[32m[1/5] Installing Node.js 20, Git, and PM2...\e[0m"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2

echo -e "\e[32m[2/5] Downloading Dashboard Source Code...\e[0m"
cd /root
git clone https://github.com/StringWire/Dashboard.git host-dashboard
cd host-dashboard

echo -e "\e[32m[3/5] Environmental Configuration\e[0m"
read -p "Enter your MongoDB URL: " MONGO_URL
read -p "Enter your Discord Client ID: " DISCORD_ID
read -p "Enter your Discord Client Secret: " DISCORD_SECRET
read -p "Enter your Discord Guild ID: " GUILD_ID
read -p "Enter your Discord Bot Token: " BOT_TOKEN
read -p "Enter your NextAuth URL (e.g., https://dashboard.codespaceide.online): " AUTH_URL
read -p "Enter your Pterodactyl Panel URL: " PTERO_URL
read -p "Enter your Pterodactyl API Key: " PTERO_KEY

# Auto-generate a secure random secret for NextAuth so the user doesn't have to guess one
AUTH_SECRET=$(openssl rand -base64 32)

# Write the .env file with exact spacing and formatting
cat <<EOF > .env
DATABASE_URL="$MONGO_URL"

DISCORD_CLIENT_ID="$DISCORD_ID"
DISCORD_CLIENT_SECRET="$DISCORD_SECRET"

DISCORD_GUILD_ID="$GUILD_ID"
DISCORD_BOT_TOKEN="$BOT_TOKEN"
ADMIN_DISCORD_ID="$ADMIN_DISCORD_ID"

NEXTAUTH_SECRET="$AUTH_SECRET"
NEXTAUTH_URL="$AUTH_URL"

PTERODACTYL_URL="$PTERO_URL"
PTERODACTYL_API_KEY="$PTERO_KEY"
EOF

echo -e "\e[32m[4/5] Compiling Dashboard & Database Engine...\e[0m"
npm install
npx prisma generate
npx prisma db push
npm run build

echo -e "\e[32m[5/5] Launching UI & Background Billing Worker...\e[0m"
pm2 start npm --name "dashboard" -- start
pm2 save
pm2 startup

# Inject the automated billing engine into the Linux Cron table
(crontab -l 2>/dev/null; echo "0 * * * * cd /root/host-dashboard && /usr/bin/node worker.js >> /var/log/dashboard-billing.log 2>&1") | crontab -

echo -e "\e[34m=========================================\e[0m"
echo -e "\e[32m✅ INSTALLATION COMPLETE!\e[0m"
echo -e "\e[36mAccess your dashboard at \$AUTH_URL\e[0m"
echo -e "\e[34m=========================================\e[0m"
