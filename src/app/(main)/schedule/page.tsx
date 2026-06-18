"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ChevronRight } from "lucide-react";
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

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Record<number, ScheduleItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().getDay());

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => res.json())
      .then((data) => setSchedule(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Poll for poster updates (schedule API auto-fetches missing posters)
  useEffect(() => {
    if (loading) return;
    const hasMissing = Object.values(schedule).some(items =>
      items.some(item => !item.animePic)
    );
    if (!hasMissing) return;

    const timer = setTimeout(() => {
      fetch("/api/schedule")
        .then((res) => res.json())
        .then((data) => setSchedule(data))
        .catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading, schedule]);

  if (loading) return <Loading />;

  const totalItems = Object.values(schedule).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">周番表</h1>
          <span className="text-sm text-muted">共 {totalItems} 部</span>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-card rounded-lg border border-border overflow-x-auto">
        {DAY_NAMES.map((dayName, dayIdx) => {
          const isToday = dayIdx === new Date().getDay();
          const isActive = dayIdx === activeDay;
          const count = (schedule[dayIdx] || []).length;
          return (
            <button
              key={dayIdx}
              onClick={() => setActiveDay(dayIdx)}
              className={`flex-1 min-w-[56px] px-2 py-2 rounded-md transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : isToday
                    ? "text-primary font-bold"
                    : "text-muted hover:text-foreground hover:bg-accent/30"
              }`}
            >
              <span className="text-xs font-medium">{dayName}</span>
              <span className={`block text-[9px] ${isActive ? "opacity-80" : "opacity-50"}`}>
                {count > 0 ? `${count}部` : "-"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active day content */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-foreground">{DAY_NAMES[activeDay]}</h2>
          {activeDay === new Date().getDay() && <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">今天</span>}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
          {(schedule[activeDay] || []).map((item) => (
            <Link
              key={item.id}
              href={`/anime/${item.animeId}`}
              className="group block rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="relative aspect-[3/4] bg-accent/30">
                {item.animePic ? (
                  <img
                    src={item.animePic}
                    alt={item.animeName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center">
                    <span className="text-pink-600 text-sm font-bold">{item.animeName.slice(0, 2)}</span>
                  </div>
                )}
                {item.timeSlot && (
                  <span className="absolute top-1 left-1 px-1 py-px bg-black/50 text-white text-[9px] rounded flex items-center gap-px">
                    <Clock className="w-2 h-2" /> {item.timeSlot}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-white text-[10px] flex items-center gap-0.5">
                    观看 <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
              <div className="p-1.5">
                <h3 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {item.animeName}
                </h3>
              </div>
            </Link>
          ))}
          {(schedule[activeDay] || []).length === 0 && (
            <div className="col-span-full text-center py-12">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-muted opacity-30" />
              <p className="text-muted text-sm">{DAY_NAMES[activeDay]}暂无排期</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
