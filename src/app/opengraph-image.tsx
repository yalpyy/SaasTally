import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090B",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#7CFF6B",
              display: "flex",
            }}
          />
          <div style={{ color: "#FAFAFA", fontSize: 34, fontWeight: 600 }}>SaaSTally</div>
        </div>
        <div
          style={{
            color: "#FAFAFA",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            display: "flex",
            maxWidth: 900,
          }}
        >
          Find software worth paying for.
        </div>
        <div style={{ color: "#A1A1AA", fontSize: 28, display: "flex" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
