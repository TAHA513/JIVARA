#!/bin/bash
set -e
npm install --prefer-offline 2>/dev/null || npm install
npm run db:push --force 2>/dev/null || npm run db:push
