import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');
/** @type {'' | `/${string}`} */
const base = dev ? '' : /** @type {`/${string}`} */ (process.env.BASE_PATH ?? '/Freiheit');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ pages: 'build', assets: 'build', strict: true }),
		// GitHub Pages: https://maierreisen.github.io/Freiheit/ – lokal (vite dev) ohne Präfix
		paths: { base }
	}
};

export default config;
