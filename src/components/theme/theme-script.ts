// Shared between the inline <head> script (runs before first paint) and the
// client theme store, so both read and apply the preference the same way.

export const THEME_STORAGE_KEY = "hf-theme";
export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];

// Runs synchronously while the browser parses <head>: applies the saved theme
// (or the system preference) before anything is painted, so there is no flash.
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||((t!=="light")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
