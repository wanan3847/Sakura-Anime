"use client";

import { useEffect, useState } from "react";
import { Users, Database, TrendingUp, Bug } from "lucide-react";

interface Stats {
  users: number;
  sources: number;
  favorites: number;
  bugReports: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, sources: 0, favorites: 0, bugReports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "注册用户", value: stats.users, icon: Users, color: "text-blue-400" },
    { label: "视频源", value: stats.sources, icon: Database, color: "text-green-400" },
    { label: "收藏总数", value: stats.favorites, icon: TrendingUp, color: "text-pink-400" },
    { label: "Bug 反馈", value: stats.bugReports, icon: Bug, color: "text-red-400", link: "/admin/bug-reports" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">管理仪表盘</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-xl bg-card border border-border animate-pulse">
              <div className="h-4 bg-accent/50 rounded w-20 mb-3" />
              <div className="h-8 bg-accent/50 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">管理仪表盘</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Tag = card.link ? "a" : "div";
          const linkProps = card.link ? { href: card.link } : {};
          return (
            <Tag
              key={card.label}
              {...linkProps}
              className={`p-5 rounded-xl bg-card border border-border ${card.link ? "hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted text-sm">{card.label}</span>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value.toLocaleString()}</p>
            </Tag>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-foreground font-medium mb-4">系统信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">框架</span>
              <span className="text-foreground">Next.js 16</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">数据库</span>
              <span className="text-foreground">SQLite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">运行环境</span>
              <span className="text-foreground">Node.js</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-foreground font-medium mb-4">快捷操作</h3>
          <div className="space-y-2">
            <a href="/admin/sources" className="block p-3 rounded-lg bg-accent/30 hover:bg-accent/50 text-foreground text-sm transition-colors">
              管理视频源
            </a>
            <a href="/admin/users" className="block p-3 rounded-lg bg-accent/30 hover:bg-accent/50 text-foreground text-sm transition-colors">
              管理用户
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
