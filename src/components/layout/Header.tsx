"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, User, Heart, Clock, LogIn, Menu, X, Shield } from "lucide-react";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/category", label: "分类" },
  { href: "/ranking", label: "排行榜" },
];

export default function Header() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
      setKeyword("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-secondary/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">
              樱花动漫
            </span>
          </Link>

          {/* 导航链接 - 桌面端 */}
          <nav className="hidden md:flex items-center gap-6 ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted hover:text-white transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索动漫..."
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-accent/50 border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </div>
          </form>

          {/* 用户菜单 */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/user/favorites" className="text-muted hover:text-white transition-colors">
              <Heart className="w-5 h-5" />
            </Link>
            <Link href="/user/history" className="text-muted hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </Link>
            <Link href="/user/profile" className="text-muted hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/admin" className="text-muted hover:text-white transition-colors">
              <Shield className="w-5 h-5" />
            </Link>
            <button className="ml-2 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm rounded-lg transition-colors flex items-center gap-1.5">
              <LogIn className="w-4 h-4" />
              登录
            </button>
          </div>

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden text-muted hover:text-white"
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
                  className="text-muted hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-4 pt-2 border-t border-border">
                <Link href="/user/favorites" className="text-muted hover:text-white">收藏</Link>
                <Link href="/user/history" className="text-muted hover:text-white">历史</Link>
                <Link href="/admin" className="text-muted hover:text-white">管理</Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
