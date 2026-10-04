import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Freiheit – by Maier Reisen',
				short_name: 'Freiheit',
				description: 'Bereiste Länder, Reisen, Flüge und Kosten an einem Ort.',
				lang: 'de',
				display: 'standalone',
				background_color: '#EDF2F4',
				theme_color: '#0A1A23',
				icons: [
					{ src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
					{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
					{ src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webmanifest}', 'prerendered/**/*.html'],
				// Die eingebettete Weltkarte macht das Haupt-Bundle groß
				maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
						handler: 'StaleWhileRevalidate',
						options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } }
					},
					{
						// feine Kartendetails (10m), werden erst bei starkem Zoom nachgeladen
						urlPattern: ({ url }) => url.href.startsWith('https://cdn.jsdelivr.net/npm/world-atlas@'),
						handler: 'CacheFirst',
						options: { cacheName: 'world-atlas', expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 } }
					}
				]
			},
			devOptions: { enabled: false }
		})
	]
});
