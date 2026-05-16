import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    open: "/pages/auth/login.html",
    proxy: {
      // Browser: same-origin /api/* → Spring Boot. Use 127.0.0.1 so Node does not hit ::1
      // while Spring is only listening on IPv4 (common Windows issue after restarts).
      "/api": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
    },
  },
});

