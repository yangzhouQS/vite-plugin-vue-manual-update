import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import {createManualUpdatePlugin} from './src/plugins/manual-v3'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		vueJsx(),
		createManualUpdatePlugin({
			//include: ["./src/**/*.vue", "./src/**/*.tsx"]
			include: ['**/*.vue', '**/*.tsx', '**/*.ts']
		})
	],
});
