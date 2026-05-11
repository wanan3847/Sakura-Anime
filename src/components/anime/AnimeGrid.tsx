import AnimeCard from "./AnimeCard";

interface Anime {
  vod_id: string | number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  type_name: string;
}

interface AnimeGridProps {
  animes: Anime[];
  title?: string;
}

export default function AnimeGrid({ animes, title }: AnimeGridProps) {
  return (
    <section>
      {title && (
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full" />
          {title}
        </h2>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {animes.map((anime) => (
          <AnimeCard
            key={String(anime.vod_id)}
            id={String(anime.vod_id)}
            title={anime.vod_name}
            cover={anime.vod_pic}
            remarks={anime.vod_remarks}
            year={anime.vod_year}
            type={anime.type_name}
          />
        ))}
      </div>
    </section>
  );
}
