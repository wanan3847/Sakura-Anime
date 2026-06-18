import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-foreground font-bold mb-3">樱花动漫</h3>
            <p className="text-muted text-sm">
              海量动漫资源在线观看，支持多线路切换，给你最佳的追番体验。
            </p>
          </div>
          <div>
            <h3 className="text-foreground font-bold mb-3">快速导航</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/" className="text-muted hover:text-foreground transition-colors">首页</Link>
              <Link href="/category" className="text-muted hover:text-foreground transition-colors">分类浏览</Link>
              <Link href="/ranking" className="text-muted hover:text-foreground transition-colors">排行榜</Link>
            </div>
          </div>
          <div>
            <h3 className="text-foreground font-bold mb-3">关于我们</h3>
            <p className="text-muted text-sm">
              本站仅提供索引服务，所有资源均来自互联网，仅供学习交流使用。
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-center text-muted text-xs">
          &copy; 2026 樱花动漫. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
