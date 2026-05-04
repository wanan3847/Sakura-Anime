"use client";

import { Users, Shield, User } from "lucide-react";

// 示例用户数据
const sampleUsers = [
  { id: "1", name: "管理员", email: "admin@sakura-anime.com", role: "admin", createdAt: "2026-01-01" },
  { id: "2", name: "测试用户", email: "test@example.com", role: "user", createdAt: "2026-03-15" },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users className="w-7 h-7 text-blue-400" />
        用户管理
      </h1>

      <div className="space-y-3">
        {sampleUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border"
          >
            <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center shrink-0">
              {user.role === "admin" ? (
                <Shield className="w-5 h-5 text-yellow-400" />
              ) : (
                <User className="w-5 h-5 text-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white text-sm font-medium">{user.name}</h3>
              <p className="text-muted text-xs">{user.email}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${
              user.role === "admin"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-accent/50 text-muted"
            }`}>
              {user.role === "admin" ? "管理员" : "用户"}
            </span>
            <span className="text-muted text-xs">{user.createdAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
