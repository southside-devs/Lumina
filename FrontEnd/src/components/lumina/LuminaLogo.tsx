import { type ImgHTMLAttributes } from "react";

interface LuminaLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  alt?: string;
}

/**
 * Lumina Logo using the exact cropped transparent PNG asset
 */
export function LuminaLogo({
  className = "h-5 w-auto object-contain",
  alt = "LUMINA",
  ...props
}: LuminaLogoProps) {
  return (
    <img
      src="/lumina-logo.png"
      alt={alt}
      className={`select-none pointer-events-none ${className}`}
      draggable={false}
      {...props}
    />
  );
}
