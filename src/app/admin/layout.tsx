"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Layout, Database, Users, MessageSquare, Calendar, Coffee, ArrowLeft, ShieldX } from "lucide-react";
import Loading from "@/components/common/Loading";

const navItems = [
  { href: "/admin", label: "仪表盘", icon: Layout },
  { href: "/admin/sources", label: "视频源管理", icon: Database },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/danmaku", label: "弹幕管理", icon: MessageSquare },
  { href: "/admin/schedule", label: "排期管理", icon: Calendar },
  { href: "/admin/donate", label: "赞赏管理", icon: Coffee },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") return <Loading />;

  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldX className="w-16 h-16 text-muted mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">无权限访问</h1>
          <p className="text-muted">此页面仅管理员可访问</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主站
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-64 bg-white border-r border-border min-h-screen p-4 shrink-0">
          <div className="mb-6">
            <Link href="/" className="flex items-center gap-2 text-muted hover:text-primary transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              返回主站
            </Link>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-4">后台管理</h2>
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
                      : "text-muted hover:text-foreground hover:bg-accent/50"
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
