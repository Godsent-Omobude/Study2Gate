// The app's CSS only defines rules for html[data-theme="dark"] (see
// index.css) — there is no CSS for html[data-theme="system"]. So the
// stored preference ("light" | "dark" | "system") has to be resolved to
// an actual "light" or "dark" value before it's applied to the DOM, or
// "system" silently renders as light no matter what the OS is set to.
export const resolveTheme = (theme) => {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  // "system" (or anything unrecognized) falls back to the OS preference.
  return typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};
