import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

interface BuildMetadataInput {
  title: string;
  description: string;
  /** Site-relative path, used for the canonical URL. */
  path: string;
  /** Absolute or site-relative OG image. Falls back to the default card. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
}

const defaultImage = "/opengraph-image";

export function buildMetadata({
  title,
  description,
  path,
  image = defaultImage,
  type = "website",
  publishedTime,
  modifiedTime,
  noIndex = false,
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      site: siteConfig.twitter,
    },
  };
}

/** Title formatter used by pages that build their own Metadata object. */
export function pageTitle(title: string): string {
  return `${title} | ${siteConfig.name}`;
}
