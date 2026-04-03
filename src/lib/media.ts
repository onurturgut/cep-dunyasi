export type ResponsiveImageKind =
  | "hero"
  | "product-card"
  | "product-detail"
  | "campaign-banner"
  | "thumbnail"
  | "logo"
  | "admin-preview";

type OptimizedImageOptions = {
  kind?: ResponsiveImageKind;
  width?: number;
  height?: number;
  quality?: number;
};

const responsiveSizeMap: Record<ResponsiveImageKind, string> = {
  hero: "(max-width: 768px) 90vw, (max-width: 1280px) 48vw, 42vw",
  "product-card": "(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 18vw",
  "product-detail": "(max-width: 768px) 100vw, (max-width: 1280px) 52vw, 42vw",
  "campaign-banner": "(max-width: 768px) 92vw, (max-width: 1280px) 44vw, 32vw",
  thumbnail: "(max-width: 768px) 22vw, 96px",
  logo: "(max-width: 768px) 160px, (max-width: 1280px) 240px, 300px",
  "admin-preview": "(max-width: 768px) 30vw, 160px",
};

function supportsTransformQuery(url: URL) {
  return /(?:^|\.)imagedelivery\.net$/i.test(url.hostname) || url.pathname.includes("/cdn-cgi/image/");
}

export function getResponsiveImageSizes(kind: ResponsiveImageKind, fallback?: string) {
  return responsiveSizeMap[kind] ?? fallback ?? "100vw";
}

export function getOptimizedImageUrl(src: string | null | undefined, options: OptimizedImageOptions = {}) {
  if (!src) {
    return "";
  }

  if (src.startsWith("/")) {
    return src;
  }

  try {
    const url = new URL(src);

    if (!supportsTransformQuery(url)) {
      return src;
    }

    if (options.width && !url.searchParams.has("width")) {
      url.searchParams.set("width", `${options.width}`);
    }

    if (options.height && !url.searchParams.has("height")) {
      url.searchParams.set("height", `${options.height}`);
    }

    if (options.quality && !url.searchParams.has("quality")) {
      url.searchParams.set("quality", `${options.quality}`);
    }

    if (options.kind && !url.searchParams.has("fit")) {
      url.searchParams.set("fit", options.kind === "product-detail" ? "contain" : "cover");
    }

    return url.toString();
  } catch {
    return src;
  }
}
