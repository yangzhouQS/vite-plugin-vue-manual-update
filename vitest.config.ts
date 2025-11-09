import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue'; // 处理 .vue 文件
import vueJsx from '@vitejs/plugin-vue-jsx'; // 处理 TSX/JSX 文件

export default defineConfig({
	plugins: [
		vue(), // 启用 Vue 单文件组件支持
		vueJsx({
			// 可选：配置 Vue JSX 转换选项（如事件修饰符）
			transformOn: true, // 将 on:click 转换为 onClick
			mergeProps: true // 合并 props
		})
	],
	test: {
		globals: true, // 启用全局 API（describe、it、expect 等无需 import）
		environment: 'jsdom', // 模拟浏览器 DOM 环境（测试 Vue 组件必需）
		include: ['**/*.test.tsx',"**/*.test.ts"], // 匹配 TSX 测试文件（可根据需求调整）
		setupFiles: './src/tests/setup.ts', // 测试初始化脚本（如扩展断言）
		// 解决 Vue 组件测试中的路径别名（如果项目用了 @ 别名）
		/*alias: {
			'@': '/src'
		}*/
	}
});