#!/bin/bash
# ============================================================
#  Tributoo — One-command deploy to AWS
#  Usage:  bash deploy.sh
#  Requires: AWS CLI configured, SSH key for EC2
# ============================================================

set -e  # Stop on any error

# ── CONFIG ──────────────────────────────────────────────────
EC2_USER="ubuntu"                        # Change to ec2-user if Amazon Linux
EC2_HOST="13.234.38.148"
EC2_APP_DIR="/home/ubuntu/tributto"      # Path on EC2 where your app lives
SSH_KEY="~/.ssh/tributoo-ec2.pem"       # Path to your EC2 .pem key file
S3_BUCKET="tributo-frontend"
# ────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting Tributoo deployment...${NC}"
echo "──────────────────────────────────────"

# STEP 1 — Build frontend
echo -e "${YELLOW}[1/3] Building frontend...${NC}"
npm run build
echo -e "${GREEN}✅ Frontend built (dist/ folder ready)${NC}"

# STEP 2 — Deploy code + dist to EC2
# Express serves both the API and the React frontend (for bot prerendering + SEO)
echo -e "${YELLOW}[2/3] Deploying to EC2 (${EC2_HOST})...${NC}"

# Copy the built dist/ folder to EC2
echo "  📦 Uploading dist/ to EC2..."
rsync -az --delete -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  ./dist/ ${EC2_USER}@${EC2_HOST}:${EC2_APP_DIR}/dist/
echo -e "${GREEN}  ✅ dist/ uploaded${NC}"

# SSH in to pull code and restart server
ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
  set -e
  cd /home/ubuntu/tributto

  echo "📥 Pulling latest server code..."
  git pull origin main

  echo "📦 Installing dependencies..."
  npm install --omit=dev

  echo "♻️  Restarting server..."
  if command -v pm2 &> /dev/null; then
    pm2 restart tributoo 2>/dev/null || pm2 start server/index.js --name tributoo
    pm2 save
  else
    pkill -f "node server/index.js" || true
    nohup node server/index.js > /tmp/tributoo.log 2>&1 &
    echo "Server started (PID: $!)"
  fi

  echo "✅ Backend deployed and serving React frontend"
ENDSSH
echo -e "${GREEN}✅ Deployed to EC2${NC}"

# STEP 3 — Done
echo "──────────────────────────────────────"
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "   Site:    http://${EC2_HOST}:5000"
echo -e "   Tip:     Point your domain DNS to ${EC2_HOST} (port 80 via Nginx)"
echo "──────────────────────────────────────"
