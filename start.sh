#!/usr/bin/env bash
set -e
(
    npm run build
)
    redis-server &
npm run dev &

wait
