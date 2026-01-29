// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./Component/AuthProvider.jsx";
import { PendingProvider } from "./Component/PendingContext.jsx";
import { setupResizeObserverErrorHandler } from "./Pages/inference/shenai/utils/resizeObserverErrorHandler.js";
import "./global.css";
import "./index.css";
import "./i18n"; // Initialize i18n

// Set up ResizeObserver error handler to suppress benign loop errors
setupResizeObserverErrorHandler();

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <PendingProvider>
        <App />
      </PendingProvider>
    </AuthProvider>
  </BrowserRouter>
  // </StrictMode>
);