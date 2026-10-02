#!/usr/bin/env bash
# One-off (2026-10-02): Team-Mitglieder + Mag.a-Titel auf die Live-DB (api.kuin.at/content.pod).
# Macht zuerst eine Sicherung, dann laufen die beiden idempotenten Skripte mit dem Server-Node.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.local; set +a
export SSHPASS="$PLESK_PASSWORD"
S=(sshpass -e ssh -o PubkeyAuthentication=no)
APP=/var/www/vhosts/kuin.at/preview.kuin.at
POD=/var/www/vhosts/kuin.at/api.kuin.at/content.pod
NODE=/opt/plesk/node/25

sshpass -e scp -o PubkeyAuthentication=no scripts/migrate/add-team-members.ts scripts/migrate/fix-vorstand-titles.ts kuin-server:$APP/scripts/migrate/
"${S[@]}" kuin-server "cp $POD $POD.bak-pre-people-2026-10-02 && cd $APP && export ORBITER_POD=$POD PATH=$NODE/bin:\$PATH && \
  node --import tsx scripts/migrate/add-team-members.ts && node --import tsx scripts/migrate/fix-vorstand-titles.ts && touch tmp/restart.txt"
sleep 3
curl -s https://preview.kuin.at/der-verein/vorstand | grep -oE 'Mag\.<sup>a</sup>[^<]*'
curl -s https://preview.kuin.at/der-verein/team | grep -oE 'Anita Brodtrager|Ed Haberl|Teammitglied [12]' | sort -u
