#!/bin/bash

# ===== CONFIG =====
NEW_MONGO_URI=""

BACKUP_DIR="/mnt/"

echo "===== Mongo Restore Started at $(date) ====="

# ===== RESTORE FULL CLUSTER =====
mongorestore \
  --uri="$NEW_MONGO_URI" \
  --drop \
  "$BACKUP_DIR"

# ===== STATUS =====
if [ $? -eq 0 ]; then
  echo "SUCCESS: Full cluster restore completed."
else
  echo "ERROR: Cluster restore failed."
fi

echo "===== Restore Completed at $(date) ====="
