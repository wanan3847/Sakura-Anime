"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  User,
  Heart,
  Clock,
  LogIn,
  Menu,
  X,
  Shield,
  Coffee,
  Bug,
  Bell,
} from "lucide-react";

interface NotificationItem {
  id: string;
  userId: string | null;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/category", label: "目录" },
  { href: "/ranking", label: "排行榜" },
  { href: "/schedule", label: "周番表" },
];

export default function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [keyword, setKeyword] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!session?.user;
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const userId = (session?.user as { id?: string })?.id;

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.list || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close bell dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    if (bellOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [bellOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications?id=all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
      setKeyword("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-border shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🌸</span>
            <span className="text-lg font-bold text-foreground hidden sm:block">
              樱花动漫
            </span>
          </Link>

          {/* 导航链接 - 桌面端 */}
          <nav className="hidden md:flex items-center gap-6 ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted hover:text-primary transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-[140px] sm:max-w-xs md:max-w-sm lg:max-w-md mx-2 sm:mx-4">
            <div className="relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索动漫..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </div>
          </form>

          {/* 用户菜单 */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/user/favorites" className="text-muted hover:text-primary transition-colors flex items-center gap-1 text-sm">
                  <Heart className="w-4 h-4" />
                  <span className="hidden md:inline text-sm">收藏</span>
                </Link>
                <Link href="/user/history" className="text-muted hover:text-primary transition-colors flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  <span className="hidden md:inline text-sm">历史</span>
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-muted hover:text-primary transition-colors flex items-center gap-1 text-sm">
                    <Shield className="w-4 h-4" />
                    <span className="hidden md:inline text-sm">管理</span>
                  </Link>
                )}
                <Link
                  href="/user/profile"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-accent/50"
                  title={session.user?.name || session.user?.email}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline text-sm text-foreground truncate max-w-[100px]">{session.user?.name || session.user?.email}</span>
                </Link>
                {/* Notification bell - rightmost */}
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={() => setBellOpen(!bellOpen)}
                    className="text-muted hover:text-primary transition-colors relative p-1"
                    title="通知"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {bellOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-border shadow-lg z-[100] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <span className="text-sm font-semibold text-foreground">
                          通知
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary hover:underline"
                          >
                            全部已读
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted text-sm">
                          暂无通知
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (!n.read) handleMarkRead(n.id);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors border-b border-border/50 last:border-b-0 ${
                                !n.read ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {!n.read && (
                                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                                    )}
                                    <span className="text-sm font-medium text-foreground truncate">
                                      {n.title}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted mt-0.5 line-clamp-2">
                                    {n.message}
                                  </p>
                                  <span className="text-[10px] text-muted mt-1 block">
                                    {new Date(n.createdAt).toLocaleString("zh-CN")}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </>
            ) : (
              <>
                <Link href="/feedback" className="text-muted hover:text-primary transition-colors flex items-center gap-1 text-sm">
                  <Bug className="w-4 h-4" />
                  <span className="hidden md:inline text-sm">反馈</span>
                </Link>
                <Link href="/donate" className="text-muted hover:text-primary transition-colors flex items-center gap-1 text-sm">
                  <Coffee className="w-4 h-4" />
                  <span className="hidden md:inline text-sm">赞赏</span>
                </Link>
                <Link
                  href="/user/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  登录
                </Link>
              </>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden text-muted hover:text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-border">
                {isLoggedIn ? (
                  <>
                    <Link href="/user/favorites" className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(false)}>收藏</Link>
                    <Link href="/user/history" className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(false)}>历史</Link>
                    <Link href="/feedback" className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(false)}>反馈</Link>
                    <Link href="/donate" className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(false)}>赞赏</Link>
                    <Link href="/user/profile" className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(false)}>我的</Link>
                    {isAdmin && (
                      <Link href="/admin" className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(false)}>管理</Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/feedback" className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(false)}>反馈</Link>
                    <Link href="/donate" className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(false)}>赞赏</Link>
                    <Link href="/user/profile" className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(false)}>登录</Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>

    {/* Announcement modal - center page for unread global notifications */}
    {isLoggedIn && unreadCount > 0 && (() => {
      try { if (localStorage.getItem("dismissed_announcement") === "true") return null; } catch {}
      return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">公告</h2>
            <p className="text-muted text-sm leading-relaxed">
              {notifications.filter(n => !n.read).slice(0, 1).map(n => n.message).join("") || "暂无新公告"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => {
                notifications.filter(n => !n.read).forEach(n => handleMarkRead(n.id));
              }}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              知道了
            </button>
            <button
              onClick={() => {
                handleMarkAllRead();
                try { localStorage.setItem("dismissed_announcement", "true"); } catch {}
              }}
              className="px-6 py-2.5 bg-card hover:bg-card-hover text-muted rounded-lg text-sm border border-border transition-colors"
            >
              以后不提醒
            </button>
          </div>
        </div>
      </div>
    )})()}

    </>
  );
}
