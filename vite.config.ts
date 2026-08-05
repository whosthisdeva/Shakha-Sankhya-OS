import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// PWA intentionally disabled: its NavigationRoute was intercepting
// /__/auth/handler and breaking Google sign-in on Firebase Hosting.
// (attendance-tracker has no PWA for the same reason.)
export default defineConfig({
  plugins: [react()]
});
