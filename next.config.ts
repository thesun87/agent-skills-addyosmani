import type { NextConfig } from "next";

const publicStorageUrl =
  process.env.STORAGE_PUBLIC_BASE_URL ||
  "http://127.0.0.1:54321/storage/v1/object/public/product-images/";

let storagePattern: {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
} = {
  protocol: "http",
  hostname: "127.0.0.1",
  port: "54321",
  pathname: "/storage/v1/object/public/**",
};

try {
  const parsed = new URL(publicStorageUrl);
  storagePattern = {
    protocol: (parsed.protocol.replace(":", "") || "http") as "http" | "https",
    hostname: parsed.hostname,
    port: parsed.port || undefined,
    pathname: `${parsed.pathname.replace(/\/$/, "")}/**`,
  };
} catch {
  // fallback to default local pattern
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      storagePattern,
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/don-hang",
        permanent: false,
      },
      {
        source: "/admin/login",
        destination: "/admin/dang-nhap",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
