import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Erzeugt die PWA-Icons in static/ aus static/icon.svg: npm run icons
// Hintergrund in der Icon-Farbe, damit Apple- und Maskable-Icons keinen weißen Rand bekommen
const bg = { background: '#0A2030', fit: 'contain' } as const;

export default defineConfig({
	preset: {
		...minimal2023Preset,
		maskable: { ...minimal2023Preset.maskable, resizeOptions: bg },
		apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: bg }
	},
	images: ['static/icon.svg']
});
