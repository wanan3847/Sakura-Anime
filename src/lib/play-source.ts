// 播放源名称中文化映射 & 解析工具（纯函数，不含服务端导入）
// 单独文件避免客户端组件引入 Prisma 导致 Turbopack 构建失败

export interface PlaySource {
  name: string;
  episodes: Episode[];
}

export interface Episode {
  name: string;
  url: string;
}

const SOURCE_NAME_MAP: Record<string, string> = {
  bfzym3u8: "暴风", bfzyplay: "暴风", "1080zyk": "精品", "1080tk": "精品",
  tkm3u8: "西瓜", ffm3u8: "非凡", wjm3u8: "无尽", hnm3u8: "红牛",
  jsm3u8: "计算云", fcm3u8: "凤雏云", xgm3u8: "西瓜", dbm3u8: "量子",
  kdm3u8: "酷点", jinyingm3u8: "金鹰", tam3u8: "暴风", zuidam3u8: "最大",
  bfzyapi: "暴风", liangzi: "量子", lzm3u8: "量子", lzm3u82: "量子2",
  zuidam3u82: "最大2", ffzym3u8: "非凡资源", ffzyapi: "非凡资源",
  feifan: "非凡",
};

function mapSourceName(name: string): string {
  const lower = name.toLowerCase().trim();
  return SOURCE_NAME_MAP[lower] || name;
}

/** 解析播放地址字符串为结构化数组 */
export function parsePlaySources(vodPlayFrom: string, vodPlayUrl: string): PlaySource[] {
  if (!vodPlayFrom || !vodPlayUrl) return [];

  const sources: PlaySource[] = [];
  const fromList = vodPlayFrom.split("$$$");
  const urlList = vodPlayUrl.split("$$$");

  fromList.forEach((name, index) => {
    const urlStr = urlList[index] || "";
    const episodes: Episode[] = urlStr.split("#").filter(Boolean).map((ep) => {
      const [epName, epUrl] = ep.split("$");
      return { name: epName || "播放", url: epUrl || "" };
    });
    sources.push({ name: mapSourceName(name), episodes });
  });

  return sources;
}
