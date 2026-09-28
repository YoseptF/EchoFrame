import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "../styles.css";
import { EffectsProvider } from "@/components/effects/motion-system";
import { AppRoutes } from "./routes";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EffectsProvider>
      <AppRoutes />
    </EffectsProvider>
  </React.StrictMode>,
);
