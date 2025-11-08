import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  onLoad?: () => void;
}

function optimizeImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  if (url.includes("cloudfront.net")) {
    const urlObj = new URL(url);

    if (width) urlObj.searchParams.set("w", width.toString());
    if (height) urlObj.searchParams.set("h", height.toString());
    urlObj.searchParams.set("q", quality.toString());
    urlObj.searchParams.set("f", "webp");

    return urlObj.toString();
  }

  return url;
}

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  width,
  height,
  quality = 80,
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = optimizeImageUrl(src, width, height, quality);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div
          className={cn("absolute inset-0 bg-muted animate-pulse", className)}
        />
      )}

      <img
        src={optimizedSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        width={width}
        height={height}
      />
    </div>
  );
}
