#!/bin/bash
echo "=== Test Comment POST ==="
curl -s --max-time 10 -X POST http://localhost:3001/api/comments \
  -H 'Content-Type: application/json' \
  -d '{"animeId":"142248","text":"好看！五星好评","rating":5}' 2>&1
echo ""
echo "=== Verify Comment ==="
curl -s --max-time 10 'http://localhost:3001/api/comments?animeId=142248' 2>&1
echo ""
echo "=== Test Anime Sort (hits) ==="
curl -s --max-time 15 'http://localhost:3001/api/anime?page=1&limit=3&sort=hits&type=%E6%97%A5%E6%9C%AC%E5%8A%A8%E6%BC%AB' 2>&1 | head -c 500
echo ""
echo "=== Test Anime Sort (time) ==="
curl -s --max-time 15 'http://localhost:3001/api/anime?page=1&limit=3&sort=time&type=%E6%97%A5%E6%9C%AC%E5%8A%A8%E6%BC%AB' 2>&1 | head -c 500
echo ""
echo "=== Test Homepage ==="
curl -s --max-time 15 -o /dev/null -w "Homepage: HTTP %{http_code}" http://localhost:3001/ 2>&1
echo ""
echo "=== Test Category ==="
curl -s --max-time 15 -o /dev/null -w "Category: HTTP %{http_code}" "http://localhost:3001/category" 2>&1
echo ""
echo "=== Test Schedule Page ==="
curl -s --max-time 15 -o /dev/null -w "Schedule: HTTP %{http_code}" "http://localhost:3001/schedule" 2>&1
echo ""
echo "=== Test Play Page ==="
curl -s --max-time 15 -o /dev/null -w "Play: HTTP %{http_code}" "http://localhost:3001/anime/play/142248" 2>&1
echo ""
echo "=== DONE ==="
