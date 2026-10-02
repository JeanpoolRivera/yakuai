import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/index.css";
import { AuthProvider } from "./app/auth";
import { App } from "./app/App";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    if (import.meta.env.DEV) {
      // Never serve Vite modules from an earlier interface in local development.
      const registrations = await navigator.serviceWorker.getRegistrations();
      const ownWorker = new URL("/sw.js", location.origin).href;
      const ownsController = navigator.serviceWorker.controller?.scriptURL === ownWorker;
      await Promise.all(registrations.filter((registration) =>
        [registration.active, registration.waiting, registration.installing].some((worker) => worker?.scriptURL === ownWorker)
      ).map((registration) => registration.unregister()));
      if (ownsController) location.reload();
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* SW no disponible */
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
