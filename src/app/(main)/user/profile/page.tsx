"use client";

import { useState } from "react";
import { signIn, useSession, signOut } from "next-auth/react";
import { User, Mail, Lock, LogOut, Save, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdOk, setPwdOk] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleChangePwd = async () => {
    if (!oldPwd || !newPwd || newPwd.length < 6) return;
    setPwdLoading(true);
    setPwdMsg("");
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: oldPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdOk(true);
        setPwdMsg("密码修改成功");
        setOldPwd("");
        setNewPwd("");
      } else {
        setPwdOk(false);
        setPwdMsg(data.error || "修改失败");
      }
    } catch {
      setPwdOk(false);
      setPwdMsg("网络错误");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (res?.error) {
          setError("邮箱或密码错误");
        } else {
          window.location.reload();
        }
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "注册失败");
        } else {
          const loginRes = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (loginRes?.error) {
            setError("注册成功，请手动登录");
            setIsLogin(true);
          } else {
            window.location.reload();
          }
        }
      }
    } catch {
      setError("请求失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="h-8 bg-card rounded animate-pulse" />
        <div className="h-64 bg-card rounded animate-pulse" />
      </div>
    );
  }

  if (session) {
    const user = session.user as { name?: string; email?: string; role?: string; image?: string };
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground text-center">个人中心</h1>

        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt="" className="w-16 h-16 rounded-full" />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-foreground font-medium text-lg">{user.name || "用户"}</h2>
              <p className="text-muted text-sm">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                user.role === "admin"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-accent/50 text-muted"
              }`}>
                {user.role === "admin" ? "管理员" : "普通用户"}
              </span>
            </div>
          </div>

          {/* 修改密码 */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              修改密码
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder="当前密码"
                  className="w-full h-10 pl-9 pr-10 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <button type="button" onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="新密码（至少6位）"
                  className="w-full h-10 pl-9 pr-10 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwdMsg && (
                <div className={`text-xs ${pwdOk ? "text-green-400" : "text-red-400"}`}>{pwdMsg}</div>
              )}
              <button
                onClick={handleChangePwd}
                disabled={pwdLoading || !oldPwd || !newPwd || newPwd.length < 6}
                className="w-full h-9 bg-card hover:bg-card-hover border border-border text-foreground rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {pwdLoading ? "修改中..." : "保存新密码"}
              </button>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full h-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground text-center">
        {isLogin ? "登录" : "注册"}
      </h1>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

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
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
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
              required
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
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
              required
              minLength={6}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm disabled:opacity-50"
        >
          {loading ? "请稍候..." : isLogin ? "登录" : "注册"}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => { setIsLogin(!isLogin); setError(""); }}
          className="text-sm text-muted hover:text-primary transition-colors"
        >
          {isLogin ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </div>
    </div>
  );
}
