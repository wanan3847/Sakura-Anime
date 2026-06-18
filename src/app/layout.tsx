import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "樱花动漫 - 在线动漫观看平台",
  description: "海量日本动漫资源在线观看，支持多线路切换、每集评论",
  keywords: "樱花动漫,在线动漫,动漫观看,动漫资源",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: 'system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif' }}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
