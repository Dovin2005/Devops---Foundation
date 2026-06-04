#!/bin/bash

# ===== CONFIG =====
MONGO_URI=""
BACKUP_DIR="/mnt/nikil"

# Databases list
DATABASES=(
	
	"158_tenant_dev"
"159_tenant_dev"
"160_tenant_dev"
"161_tenant_dev"
"162_tenant_dev"
"163_tenant_dev"
"164_tenant_dev"
"165_tenant_dev"
"166_tenant_dev"
"181_tenant_dev"
"182_tenant_dev"
"183_tenant_dev"
"184_tenant_dev"
"190_tenant_dev"
"191_tenant_dev"
"193_tenant_dev"
"194_tenant_dev"
"195_tenant_dev"
"1_tenant_dev"
"200_tenant_dev"
"206_tenant_dev"
"207_tenant_dev"
"208_tenant_dev"
"20_tenant_dev"
"212_tenant_dev"
"213_tenant_dev"
"214_tenant_dev"
"215_tenant_dev"
"216_tenant_dev"
"217_tenant_dev"
"218_tenant_dev"
"219_tenant_dev"
"21_tenant_dev"
"220_tenant_dev"
"221_tenant_dev"
"222_tenant_dev"
"223_tenant_dev"
"224_tenant_dev"
"225_tenant_dev"
"226_tenant_dev"
"227_tenant_dev"
"229_tenant_dev"
"22_tenant_dev"
"230_tenant_dev"
"231_tenant_dev"
"23_tenant_dev"
"243_tenant_dev"
"247_tenant_dev"
"248_tenant_dev"
"249_tenant_dev"
"24_tenant_dev"
"250_tenant_dev"
"251_tenant_dev"
"252_tenant_dev"
"253_tenant_dev"
"254_tenant_dev"
"256_tenant_dev"
"257_tenant_dev"
"25_tenant_dev"
"26_tenant_dev"
"27_tenant_dev"
"28_tenant_dev"
"2_tenant_dev"
"30_tenant_dev"
"31_tenant_dev"
"32_tenant_dev"
"33_tenant_dev"
"34_tenant_dev"
"35_tenant_dev"
"36_tenant_dev"
"3_tenant_dev"
"4_tenant_dev"
"5_tenant_dev"
"zoho-book-kanakku"
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
