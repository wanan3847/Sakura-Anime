declare module "dplayer" {
  interface DPlayerOptions {
    container: HTMLElement;
    autoplay?: boolean;
    theme?: string;
    loop?: boolean;
    screenshot?: boolean;
    hotkey?: boolean;
    preload?: string;
    volume?: number;
    mutex?: boolean;
    video: {
      url: string;
      type?: string;
      customType?: Record<string, (video: HTMLVideoElement, player: DPlayer) => void>;
    };
    pluginOptions?: {
      hls?: Record<string, unknown>;
      flv?: { mediaDataSource?: Record<string, unknown> };
    };
    danmaku?: {
      id: string;
      api: string;
      addition?: string[];
    };
    api?: {
      id: string;
      url: string;
    };
  }

  export default class DPlayer {
    constructor(options: DPlayerOptions);
    video: HTMLVideoElement;
    destroy(): void;
  }
}
