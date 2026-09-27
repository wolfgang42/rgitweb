import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { App } from "./ui/App.js";
import { ErrorBoundary } from "./ui/components/ErrorBoundary.js";

const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing #root element");
}
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary isRoot>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
