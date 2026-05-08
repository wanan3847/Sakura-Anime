"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import AnimeCard from "@/components/anime/AnimeCard";
import Loading from "@/components/common/Loading";

interface Favorite {
  id: string;
  animeId: string;
  animeName: string;
  animeCover: string | null;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          setFavorites(await res.json());
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handleRemove = async (animeId: string) => {
    try {
      await fetch(`/api/favorites?animeId=${animeId}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.animeId !== animeId));
    } catch {}
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Heart className="w-7 h-7 text-pink-400" />
        我的收藏
      </h1>

      {favorites.length === 0 ? (
        <div className="text-center py-20 text-muted">暂无收藏</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="relative group">
              <AnimeCard
                id={fav.animeId}
                title={fav.animeName}
                cover={fav.animeCover || ""}
              />
              <button
                onClick={() => handleRemove(fav.animeId)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
