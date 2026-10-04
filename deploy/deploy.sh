#!/usr/bin/env bash
# Deploy to preview.kuin.at — the steps from agent.md "Deploy-Ablauf" in one go.
# Uses the SSH key if it works, otherwise PLESK_PASSWORD from .env.local via sshpass.
set -euo pipefail
cd "$(dirname "$0")/.."

APP=/var/www/vhosts/kuin.at/preview.kuin.at
NODE=/opt/plesk/node/25

SSH=(ssh)
if ! ssh -o BatchMode=yes -o ConnectTimeout=10 kuin-server true 2>/dev/null; then
  set -a; . ./.env.local; set +a
  export SSHPASS="$PLESK_PASSWORD"
  SSH=(sshpass -e ssh -o PubkeyAuthentication=no)
fi

# dist/ excluded: a local build bakes in this Mac's content.pod path (see agent.md).
rsync -az -e "${SSH[*]}" \
  --exclude 'node_modules/' --exclude '.git/' --exclude '.astro/' --exclude 'dist/' \
  --exclude 'content.pod' --exclude '*.pod' --exclude 'import-source/' \
  --exclude 'orbiter-env.d.ts' --exclude '.env' --exclude '.env.example' \
  --exclude 'tmp/' --exclude '.superpowers/' --exclude '.env.local' --exclude 'SERVER.local.md' --exclude '.claude/' \
  ./ kuin-server:$APP/

"${SSH[@]}" kuin-server "cd $APP && \
  ORBITER_POD=/var/www/vhosts/kuin.at/api.kuin.at/content.pod \
  PATH=$NODE/bin:\$PATH $NODE/bin/node $NODE/lib/node_modules/npm/bin/npm-cli.js run build && \
  touch tmp/restart.txt"

curl -s -o /dev/null -w 'preview.kuin.at/events -> %{http_code}\n' https://preview.kuin.at/events
