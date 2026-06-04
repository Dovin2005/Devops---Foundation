#!/bin/bash

# ===== CONFIG =====
MONGO_URI=""
BACKUP_DIR="/mnt/nikil"

# Databases list
DATABASES=(
	
	""
	)

# ===== SETUP =====
mkdir -p "$BACKUP_DIR"

echo "===== Mongo Backup Started at $(date) ====="

# ===== BACKUP LOOP =====
for DB in "${DATABASES[@]}"
do
  echo "Backing up database: $DB"

  # Remove old backup if exists
  rm -rf "$BACKUP_DIR/$DB"

  mongodump \
    --uri="$MONGO_URI/$DB" \
    --out="$BACKUP_DIR"

  if [ $? -eq 0 ]; then
    echo "SUCCESS: $DB backed up to $BACKUP_DIR/$DB"
  else
    echo "ERROR: Failed to back up $DB"
  fi

  echo "----------------------------------------"
done

echo "===== Mongo Backup Completed at $(date) ====="
