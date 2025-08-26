import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // Do not rewrite; backend already expects /api prefix
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Ensure consistent build output across platforms
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
    // Disable source maps in production for smaller bundle size
    sourcemap: mode !== 'production',
  },
  optimizeDeps: {
    // Force Vite to pre-bundle these dependencies
    include: [
      'react',
      'react-dom',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod',
      'react-hot-toast',
      'react-router-dom'
    ],
    // Don't exclude these from optimization
    exclude: []
  },
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode || 'production'),
    // Only VITE_ variables are exposed to the client
    'process.env': Object.keys(env).reduce((acc: Record<string, string>, key) => {
      if (key.startsWith('VITE_')) {
        acc[key] = JSON.stringify(env[key]);
      }
      return acc;
    }, {} as Record<string, string>)
  },
  // Resolve platform-specific dependencies
  resolve: {
    alias: {
      // Add any necessary aliases here
    },
  },
  };
});
