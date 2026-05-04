"use client";

import { MessageSquare, Trash2, Check } from "lucide-react";

// 示例弹幕数据
const sampleDanmakus = [
  { id: "1", text: "太好看了！", color: "#ffffff", animeName: "进击的巨人", time: "12:34", user: "用户A" },
  { id: "2", text: "泪目了", color: "#ff6b6b", animeName: "鬼灭之刃", time: "05:21", user: "用户B" },
  { id: "3", text: "前方高能", color: "#ffd93d", animeName: "咒术回战", time: "08:15", user: "用户C" },
];

export default function DanmakuPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <MessageSquare className="w-7 h-7 text-yellow-400" />
        弹幕管理
      </h1>

      <div className="space-y-3">
        {sampleDanmakus.map((danmaku) => (
          <div
            key={danmaku.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: danmaku.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm">{danmaku.text}</p>
              <p className="text-muted text-xs mt-1">
                {danmaku.animeName} · {danmaku.time} · {danmaku.user}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="p-2 text-muted hover:text-green-400 transition-colors" title="通过">
                <Check className="w-4 h-4" />
              </button>
              <button className="p-2 text-muted hover:text-red-400 transition-colors" title="删除">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
