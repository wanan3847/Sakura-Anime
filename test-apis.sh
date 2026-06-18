#!/bin/bash
cd /Users/yangyazhou/Sakura-Anime-main

# Start server
npx next dev -p 3001 > /tmp/next-dev.log 2>&1 &
NPID=$!

# Wait for ready
echo "Waiting for server..."
for i in $(seq 1 30); do
  sleep 2
  if grep -q "Ready in" /tmp/next-dev.log 2>/dev/null; then
    echo "Server ready after $((i*2))s"
    break
  fi
done

cat /tmp/next-dev.log

# Test
sleep 3
echo ""
echo "=== CAROUSEL ==="
curl -s --max-time 10 http://localhost:3001/api/carousel 2>&1
echo ""
echo "=== COMMENTS ==="
curl -s --max-time 10 'http://localhost:3001/api/comments?animeId=test' 2>&1
echo ""
echo "=== SCHEDULE ==="
curl -s --max-time 10 http://localhost:3001/api/schedule 2>&1
echo ""
echo "=== ANIME ==="
curl -s --max-time 15 'http://localhost:3001/api/anime?page=1&limit=2' 2>&1
echo ""
echo "=== DONE ==="
kill $NPID 2>/dev/null
