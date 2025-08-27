import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import axios from "axios";

// Configure Axios base URL once for the entire app.
// Use Vite-exposed env var (set VITE_API_URL in your .env/.env.production).
// Example: VITE_API_URL=https://feedstreambackend.onrender.com
const apiBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
if (apiBase && apiBase.trim().length > 0) {
  axios.defaults.baseURL = apiBase;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <App />
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>,
);
