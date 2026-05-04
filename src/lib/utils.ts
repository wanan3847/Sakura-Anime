import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// 格式化播放量
export function formatViews(views: number): string {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + "万";
  }
  return views.toString();
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return d.toLocaleDateString("zh-CN");
}

// 占位图URL
export function getPlaceholderImage(width: number, height: number, text?: string): string {
  const bg = "1a1a2e";
  const color = "e94560";
  const encoded = text ? encodeURIComponent(text) : "Sakura Anime";
  return `https://placehold.co/${width}x${height}/${bg}/${color}?text=${encoded}`;
}

// 动漫封面占位图
export function getAnimeCover(title?: string): string {
  return getPlaceholderImage(300, 400, title || "Anime");
}
