"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import Loading from "@/components/common/Loading";

interface ScheduleItem {
  id: string;
  animeId: string;
  animeName: string;
  animePic: string | null;
  dayOfWeek: number;
  timeSlot: string | null;
  remark: string | null;
}

const DAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const DAY_COLORS = [
  "bg-pink-100 text-pink-600",
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-orange-100 text-orange-600",
  "bg-purple-100 text-purple-600",
  "bg-yellow-100 text-yellow-600",
  "bg-red-100 text-red-600",
];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Record<number, ScheduleItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => res.json())
      .then((data) => setSchedule(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 获取今天是星期几
  const today = new Date().getDay();

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">周番表</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {DAY_NAMES.map((dayName, dayIdx) => {
          const items = schedule[dayIdx] || [];
          const isToday = dayIdx === today;

          return (
            <div
              key={dayIdx}
              className={`rounded-xl border transition-all ${
                isToday
                  ? "border-l-4 border-l-primary border-t border-r border-b border-t-primary/20 border-r-primary/20 border-b-primary/20 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="px-3 py-2.5 border-b border-border">
                <span className={`text-base ${isToday ? "font-extrabold text-primary" : "font-semibold text-foreground"}`}>
                  {dayName}
                </span>
              </div>

              <div className="p-3 space-y-2.5 min-h-[140px] max-h-[60vh] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-muted text-sm text-center py-4">暂无排期</p>
                ) : (
                  items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/anime/${item.animeId}`}
                      className="block group"
                    >
                      <div className="rounded-lg overflow-hidden bg-accent/30 hover:bg-accent/50 transition-colors">
                        {item.animePic && (
                          <img
                            src={item.animePic}
                            alt={item.animeName}
                            className="w-full aspect-[3/4] object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="p-2.5">
                          <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {item.animeName}
                          </h3>
                          {item.timeSlot && (
                            <p className="text-xs text-muted mt-1">{item.timeSlot}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
