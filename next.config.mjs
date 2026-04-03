function createRemotePattern(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const pathname = url.pathname && url.pathname !== "/" ? `${url.pathname.replace(/\/+$/, "")}/**` : "/**";

    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      port: url.port,
      pathname,
    };
  } catch {
    return null;
  }
}

const remotePatterns = [
  createRemotePattern(process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL),
  createRemotePattern(process.env.MEDIA_PUBLIC_BASE_URL),
].filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns,
  },
};

export default nextConfig;
