// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./styles/index.css";
import AppRoutes from "./app/routes/AppRoutes";
import { AuthProvider } from "./features/auth/context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid #334155",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.875rem",
              borderRadius: "0.5rem",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#1e293b" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#1e293b" },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
