import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Using a relative base ("./") means the build works whether it's hosted at
// https://<user>.github.io/  or  https://<user>.github.io/<repo-name>/
// so you don't need to edit this when you create the GitHub repo.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
