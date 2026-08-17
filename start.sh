#!/bin/bash
# Quick launcher for RP Assistant (dev mode)
# Запускает Vite + Electron

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Запускаем RP Assistant..."
npm run dev
