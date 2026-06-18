#!/bin/bash
cd /Users/yangyazhou/Sakura-Anime-main

# Start server
npx next dev -p 3000 > /tmp/next-dev.log 2>&1 &
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

# Warm up (first compile takes time)
echo ""
echo "=== Warming up pages ==="
curl -s --max-time 30 -o /dev/null -w "Homepage: HTTP %{http_code}\n" http://localhost:3000/ 2>&1
curl -s --max-time 30 -o /dev/null -w "Category: HTTP %{http_code}\n" "http://localhost:3000/category" 2>&1
curl -s --max-time 30 -o /dev/null -w "Schedule: HTTP %{http_code}\n" "http://localhost:3000/schedule" 2>&1
curl -s --max-time 30 -o /dev/null -w "Play: HTTP %{http_code}\n" "http://localhost:3000/anime/play/142248" 2>&1
curl -s --max-time 30 -o /dev/null -w "AnimeDetail: HTTP %{http_code}\n" "http://localhost:3000/anime/142248" 2>&1
curl -s --max-time 30 -o /dev/null -w "AdminCarousel: HTTP %{http_code}\n" "http://localhost:3000/admin/carousel" 2>&1

echo ""
echo "=== API Tests ==="
echo "Carousel:"
curl -s --max-time 10 http://localhost:3000/api/carousel
echo ""
echo "Comments:"
curl -s --max-time 10 'http://localhost:3000/api/comments?animeId=142248'
echo ""
echo "Schedule:"
curl -s --max-time 10 http://localhost:3000/api/schedule | head -c 200
echo ""

# Check for errors in log
echo ""
echo "=== Server Errors ==="
grep -i "error\|Error" /tmp/next-dev.log | grep -v "font\|woff\|resource" | head -10

echo ""
echo "=== DONE ==="
# Keep server running
