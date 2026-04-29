import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply persisted theme before first render to avoid flash
const saved = localStorage.getItem("appearance_prefs");
if (saved) {
  try {
    const { theme } = JSON.parse(saved);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  } catch {
    // ignore malformed data
  }
}

createRoot(document.getElementById("root")!).render(<App />);
