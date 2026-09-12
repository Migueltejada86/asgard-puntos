import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrImg({ data, size = 240, alt = "QR" }: { data: string; size?: number; alt?: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(data, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#0a0a0a", light: "#e8d5a3" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [data, size]);

  if (!src) {
    return <div className="mx-auto rounded-sm bg-cream" style={{ width: size, height: size }} aria-hidden />;
  }

  return <img src={src} width={size} height={size} alt={alt} className="mx-auto rounded-sm bg-cream" />;
}
