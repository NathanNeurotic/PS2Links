#!/bin/bash

# Create a backup directory with the current date
BACKUP_DIR="backup_$(date +%Y%m%d)"
mkdir "$BACKUP_DIR"

# Copy the files to the backup directory
cp index.html "$BACKUP_DIR/"
cp styles.css "$BACKUP_DIR/"
cp script.js "$BACKUP_DIR/"
# Check if links.json exists before copying
if [ -f "links.json" ]; then
    cp links.json "$BACKUP_DIR/"
else
    echo "links.json not found, skipping."
fi

# List the contents of the backup directory to verify
ls "$BACKUP_DIR"
