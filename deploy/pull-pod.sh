#!/usr/bin/env bash
# Externes Backup: lädt die Live-DB (api.kuin.at/content.pod) mit Datum nach ~/Backups/kuin/ (nur Download,
# auf dem Server wird nichts verändert), prüft sie und behält die letzten KEEP Kopien.
# Usage: bash deploy/pull-pod.sh        (KEEP=10 Standard)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.local; set +a
export SSHPASS="$PLESK_PASSWORD"
POD=/var/www/vhosts/kuin.at/api.kuin.at/content.pod
DEST="${BACKUP_DIR:-$HOME/Backups/kuin}"; KEEP="${KEEP:-10}"
mkdir -p "$DEST"
OUT="$DEST/content-$(date +%Y-%m-%d_%H%M).pod"
sshpass -e scp -o PubkeyAuthentication=no "kuin-server:$POD" "$OUT"

# Integritätsprüfung der Kopie (Node 22 = better-sqlite3 passt zu node_modules)
POD_FILE="$OUT" node -e "
const D=require('better-sqlite3');const db=new D(process.env.POD_FILE,{readonly:true});
const r=db.pragma('integrity_check',{simple:true});
const n=db.prepare('select count(*) c from _entries').get().c, m=db.prepare('select count(*) c from _media').get().c;
console.log('integrity:',r,'| entries:',n,'| media:',m); process.exit(r==='ok'?0:1);
" || { echo "FEHLER: Kopie defekt, wird gelöscht"; rm -f "$OUT"; exit 1; }

rm -f "$OUT-shm" "$OUT-wal"   # entstehen beim Öffnen der WAL-Datenbank
ls -t "$DEST"/content-*.pod | tail -n +$((KEEP+1)) | xargs -I{} rm -- {} 2>/dev/null || true
echo "Backup: $OUT ($(du -h "$OUT" | cut -f1)); vorhanden: $(ls "$DEST"/content-*.pod | wc -l)/$KEEP"
