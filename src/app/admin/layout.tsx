"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Database, Users, MessageSquare, ArrowLeft } from "lucide-react";

const navItems = [
  { href: "/admin", label: "仪表盘", icon: Layout },
  { href: "/admin/sources", label: "视频源管理", icon: Database },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/danmaku", label: "弹幕管理", icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-64 bg-secondary border-r border-border min-h-screen p-4 shrink-0">
          <div className="mb-6">
            <Link href="/" className="flex items-center gap-2 text-muted hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              返回主站
            </Link>
          </div>
          <h2 className="text-lg font-bold text-white mb-4">后台管理</h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted hover:text-white hover:bg-card"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 主内容 */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
