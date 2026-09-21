const ACCENT_THEME_COLORS = {
  blue: "#0b4a50",
  royalblue: "#1464d2",
  red: "#dc2626",
  purple: "#7c3aed",
  green: "#16a34a",
  yellow: "#ca8a04",
};

const DEFAULT_ACCENT = "blue";

let lastObjectUrl = null;

export const applyDynamicManifest = (accentColor) => {
  if (typeof document === "undefined") return; // no-op during SSR/tests

  const themeColor = ACCENT_THEME_COLORS[accentColor] || ACCENT_THEME_COLORS[DEFAULT_ACCENT];
  const origin = window.location.origin;

  const manifest = {
    short_name: "Study2Gate",
    name: "Study2Gate",
    description: "Study2Gate - Academic resource sharing platform",
    icons: [
      { src: `${origin}/icon-192.png`, type: "image/png", sizes: "192x192", purpose: "any" },
      { src: `${origin}/icon-512.png`, type: "image/png", sizes: "512x512", purpose: "any" },
      { src: `${origin}/icon-maskable-512.png`, type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
    start_url: `${origin}/?source=pwa`,
    scope: `${origin}/`,
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: themeColor,
    background_color: "#f2f8f5",
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.querySelector('link[rel="manifest"]');
  if (link) link.setAttribute("href", objectUrl);

  // Also keep the address-bar/task-switcher theme-color meta tag (which
  // applies even before install, and on browsers that don't act on the
  // manifest's theme_color at all) in sync with the same color.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", themeColor);

  // Revoke the previous blob URL now that the link no longer references
  // it, so repeated accent changes in one session don't leak object URLs.
  if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
  lastObjectUrl = objectUrl;
};
