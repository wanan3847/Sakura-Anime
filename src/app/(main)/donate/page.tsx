import { Coffee } from "lucide-react";
import Image from "next/image";

const donateImages = [
  { src: "/images/donate/donate-wechat.jpeg", alt: "微信赞赏" },
  { src: "/images/donate/donate-alipay.jpeg", alt: "支付宝赞赏" },
];

export default function DonatePage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <Coffee className="w-16 h-16 text-primary mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">赞赏咖啡</h1>
        <p className="text-muted">所有赞赏将用于服务器租赁，感谢您的支持 ❤</p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
        {donateImages.map((img) => (
          <div key={img.src} className="p-4 sm:p-6 rounded-xl bg-card border border-border text-center space-y-3">
            <Image
              src={img.src}
              alt={img.alt}
              width={400}
              height={400}
              className="w-full aspect-square object-contain rounded-lg"
            />
            <p className="text-sm text-muted">{img.alt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
