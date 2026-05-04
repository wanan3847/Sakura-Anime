"use client";

import { useEffect, useState } from "react";
import { Users, Database, MessageSquare, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";

interface Stats {
  users: number;
  sources: number;
  danmakus: number;
  favorites: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, sources: 0, danmakus: 0, favorites: 0 });

  useEffect(() => {
    // 这里应该从API获取统计数据
    // 为了简化，使用模拟数据
    setStats({ users: 42, sources: 3, danmakus: 1280, favorites: 356 });
  }, []);

  const cards = [
    { label: "注册用户", value: stats.users, icon: Users, color: "text-blue-400" },
    { label: "视频源", value: stats.sources, icon: Database, color: "text-green-400" },
    { label: "弹幕总数", value: stats.danmakus, icon: MessageSquare, color: "text-yellow-400" },
    { label: "收藏总数", value: stats.favorites, icon: TrendingUp, color: "text-pink-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">管理仪表盘</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-xl bg-card border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted text-sm">{card.label}</span>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <p className="text-3xl font-bold text-white">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-white font-medium mb-4">系统信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">框架</span>
              <span className="text-white">Next.js 16</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">数据库</span>
              <span className="text-white">SQLite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">运行环境</span>
              <span className="text-white">Node.js</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-white font-medium mb-4">快捷操作</h3>
          <div className="space-y-2">
            <a href="/admin/sources" className="block p-3 rounded-lg bg-accent/30 hover:bg-accent/50 text-white text-sm transition-colors">
              管理视频源
            </a>
            <a href="/admin/users" className="block p-3 rounded-lg bg-accent/30 hover:bg-accent/50 text-white text-sm transition-colors">
              管理用户
            </a>
            <a href="/admin/danmaku" className="block p-3 rounded-lg bg-accent/30 hover:bg-accent/50 text-white text-sm transition-colors">
              审核弹幕
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
