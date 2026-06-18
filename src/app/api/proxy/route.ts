import { NextRequest, NextResponse } from "next/server";

function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getContentType(url: string): string {
  if (url.includes(".m3u8")) return "application/vnd.apple.mpegurl";
  if (url.includes(".ts")) return "video/mp2t";
  if (url.includes(".aac")) return "audio/aac";
  if (url.includes(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

function rewriteM3u8(content: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  const basePath = base.pathname.substring(0, base.pathname.lastIndexOf("/") + 1);

  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;

      // Relative URL → absolute → proxy
      let absoluteUrl: string;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        absoluteUrl = trimmed;
      } else if (trimmed.startsWith("/")) {
        absoluteUrl = `${base.protocol}//${base.host}${trimmed}`;
      } else {
        absoluteUrl = `${base.protocol}//${base.host}${basePath}${trimmed}`;
      }

      return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
    })
    .join("\n");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "缺少 url 参数" }, { status: 400 });
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: "无效的 URL" }, { status: 400 });
  }

  try {
    // 根据URL自动选择 Referer — 不同 CDN 需要不同的防盗链来源
    let referer = "https://bfzyapi.com/";
    try {
      const hostname = new URL(url).hostname;
      const subdomain = hostname.split(".").slice(-2, -1)[0] || "";
      if (hostname.includes("ffzy") || hostname.includes("feifan")) {
        referer = "https://www.ffzyapi.com/";
      } else if (hostname.includes("zuidazi") || subdomain.includes("zuid")) {
        referer = "https://www.zuidapi.com/";
      } else if (hostname.includes("wujin")) {
        referer = "https://www.wujinapi.com/";
      }
    } catch { /* use default */ }

    const res = await fetch(url, {
      headers: {
        Referer: referer,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `上游返回 ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = getContentType(url);

    if (url.includes(".m3u8")) {
      const text = await res.text();
      const rewritten = rewriteM3u8(text, url);
      return new NextResponse(rewritten, {
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    }

    // 流式返回 .ts 等二进制文件
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "代理请求失败", details: error instanceof Error ? error.message : "未知" },
      { status: 502 }
    );
  }
}
