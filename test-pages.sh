#!/bin/bash
# First warm up the pages (first compile takes time)
echo "=== Warming up pages ==="
curl -s --max-time 30 -o /dev/null -w "Homepage: HTTP %{http_code}\n" http://localhost:3000/ 2>&1
curl -s --max-time 30 -o /dev/null -w "Category: HTTP %{http_code}\n" "http://localhost:3000/category" 2>&1
curl -s --max-time 30 -o /dev/null -w "Schedule: HTTP %{http_code}\n" "http://localhost:3000/schedule" 2>&1
curl -s --max-time 30 -o /dev/null -w "Play: HTTP %{http_code}\n" "http://localhost:3000/anime/play/142248" 2>&1
curl -s --max-time 30 -o /dev/null -w "AnimeDetail: HTTP %{http_code}\n" "http://localhost:3000/anime/142248" 2>&1
curl -s --max-time 30 -o /dev/null -w "Admin: HTTP %{http_code}\n" "http://localhost:3000/admin" 2>&1
curl -s --max-time 30 -o /dev/null -w "AdminCarousel: HTTP %{http_code}\n" "http://localhost:3000/admin/carousel" 2>&1
echo "=== DONE ==="
