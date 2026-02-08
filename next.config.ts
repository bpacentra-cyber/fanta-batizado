import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Impediamo qualsiasi comportamento da "static export"
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ksneokdftofuwxkefcuh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
