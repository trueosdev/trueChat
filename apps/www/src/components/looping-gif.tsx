"use client";

import { useEffect, useRef } from "react";

interface LoopingGifProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function LoopingGif({ src, alt, width, height, className }: LoopingGifProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const reloadGif = () => {
      const currentSrc = img.src;
      img.src = "";
      img.src = currentSrc;
    };

    // Reload the GIF when it finishes playing (estimated duration)
    // Adjust the interval based on your GIF's duration
    const interval = setInterval(reloadGif, 500); // Reload every 300ms for short GIFs

    return () => clearInterval(interval);
  }, []);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}

