import React from "react";
import ReactDOM from "react-dom/client";
import installStoragePolyfill from "./storagePolyfill.js";
import App from "./App.jsx";
import "./index.css";

installStoragePolyfill();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA: register the service worker in production builds only.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline caching is a progressive enhancement — app still works without it */
    });
  });
}
