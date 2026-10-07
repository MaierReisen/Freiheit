// See https://svelte.dev/docs/kit/types#app.d.ts
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />
declare global {
	const __APP_VERSION__: string;
	namespace App {}
}

export {};
