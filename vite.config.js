import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Pages (subcarpeta) usa p. ej. `/NombreRepo/`; local y user site usan `/`. */
const base = process.env.VITE_BASE_PATH?.trim() || '/';

export default defineConfig({
  plugins: [react()],
  base: base.endsWith('/') ? base : `${base}/`,
});
