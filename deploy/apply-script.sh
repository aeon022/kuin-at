#!/usr/bin/env bash
# Run one idempotent migrate script (scripts/migrate/<x>.ts) against the LIVE pod, after a backup.
# Usage: bash deploy/apply-script.sh scripts/migrate/<x>.ts [extra files the script reads, e.g. scripts/migrate/assets/<y>.png ...]
set -euo pipefail
cd "$(dirname "$0")/.."
F="${1:?script path}"; shift; L="$(basename "$F" .ts)-$(date +%F)"
set -a; . ./.env.local; set +a
export SSHPASS="$PLESK_PASSWORD"
APP=/var/www/vhosts/kuin.at/preview.kuin.at
POD=/var/www/vhosts/kuin.at/api.kuin.at/content.pod
NODE=/opt/plesk/node/25
for f in "$F" "$@"; do
  sshpass -e ssh -o PubkeyAuthentication=no kuin-server "mkdir -p $APP/$(dirname "$f")"
  sshpass -e scp -o PubkeyAuthentication=no "$f" kuin-server:$APP/$f
done
sshpass -e ssh -o PubkeyAuthentication=no kuin-server "cp $POD $POD.bak-pre-$L && cd $APP && ORBITER_POD=$POD PATH=$NODE/bin:\$PATH node --import tsx $F && touch tmp/restart.txt"
echo "backup: content.pod.bak-pre-$L"
