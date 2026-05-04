"use client";

import { useState } from "react";
import { User, Mail, Lock, LogOut } from "lucide-react";

export default function ProfilePage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? "/api/auth/callback/credentials" : "/api/auth/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch {}
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white text-center">
        {isLogin ? "登录" : "注册"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl bg-card border border-border">
        {!isLogin && (
          <div>
            <label className="text-sm text-muted mb-1 block">用户名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入用户名"
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-accent/50 border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}
        <div>
          <label className="text-sm text-muted mb-1 block">邮箱</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-accent/50 border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-muted mb-1 block">密码</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-accent/50 border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full h-10 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm"
        >
          {isLogin ? "登录" : "注册"}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-muted hover:text-primary transition-colors"
        >
          {isLogin ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </div>
    </div>
  );
}
