import { type ImgHTMLAttributes } from "react";
import luminaLogoSrc from "@/assets/lumina-logo.png";

interface LuminaLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  alt?: string;
}

/**
 * Lumina Logo using the exact cropped transparent PNG asset.
 * Bundled via Vite asset graph with multi-tier fallback for localhost and production.
 */
export function LuminaLogo({
  className = "h-5 w-auto object-contain",
  alt = "LUMINA",
  ...props
}: LuminaLogoProps) {
  return (
    <img
      src={luminaLogoSrc || "./lumina-logo.png"}
      alt={alt}
      className={`select-none pointer-events-none ${className}`}
      draggable={false}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.dataset.fallbackLevel) {
          img.dataset.fallbackLevel = "1";
          img.src = "./lumina-logo.png";
        } else if (img.dataset.fallbackLevel === "1") {
          img.dataset.fallbackLevel = "2";
          img.src = "/lumina-logo.png";
        }
      }}
      {...props}
    />
  );
}
