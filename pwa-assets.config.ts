import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Erzeugt die PWA-Icons in static/ aus static/icon.svg: npm run icons
export default defineConfig({
	preset: minimal2023Preset,
	images: ['static/icon.svg']
});
