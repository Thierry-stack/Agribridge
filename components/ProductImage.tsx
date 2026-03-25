"use client";

import Image from "next/image";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-image-default";

type Props = {
  /** Stored path e.g. /uploads/products/uuid.jpg — empty uses default. */
  src?: string | null;
  alt: string;
  /** Square size in pixels */
  size?: number;
  className?: string;
};

/**
 * Product thumbnail — uses default SVG when no image is stored.
 */
export function ProductImage({ src, alt, size = 88, className = "" }: Props) {
  const resolved = src?.trim() ? src : DEFAULT_PRODUCT_IMAGE;
  const isSvg = resolved.endsWith(".svg");

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        unoptimized={isSvg}
      />
    </div>
  );
}
