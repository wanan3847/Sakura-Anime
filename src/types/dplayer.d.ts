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
  }

  export default class DPlayer {
    constructor(options: DPlayerOptions);
    video: HTMLVideoElement;
    destroy(): void;
  }
}
