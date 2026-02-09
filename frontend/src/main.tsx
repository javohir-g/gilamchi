
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

import { TelegramProvider } from "./app/context/TelegramContext.tsx";

createRoot(document.getElementById("root")!).render(
  <TelegramProvider>
    <App />
  </TelegramProvider>
);
