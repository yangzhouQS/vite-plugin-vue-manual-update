import type { Plugin, TransformResult } from "vite";
import { parse, compileScript, compileTemplate, SFCScriptCompileOptions } from "@vue/compiler-sfc";
import { generate } from "@babel/generator";
import { parse as parseBabel } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { createFilter } from "@rollup/pluginutils";
import { transformAsync } from "@babel/core";
import type { ManualUpdatePluginOptions } from "./types";

/**
 * 创建手动更新Vue组件的Vite插件
 */
export function createManualUpdatePlugin(options: ManualUpdatePluginOptions): Plugin {
	// 设置默认配置
	const {
		include,
		exclude = [],
		markerAttribute = "__manualUpdateMarker",
		updateFunctionName = "triggerUpdate",
		triggerRefName = "__manualUpdateTrigger",
		logErrors = true // 添加默认值
	} = options;

	// 创建文件过滤器
	const filter = createFilter(include, exclude);

	/**
	 * 注入更新触发器逻辑到代码中
	 */
	function injectTriggerLogic(code: string): string {
		// 避免重复注入
		if (code.includes(triggerRefName)) {
			return code;
		}

		return `import { ref } from 'vue';
const ${ triggerRefName } = ref(0);
export const ${ updateFunctionName } = () => { ${ triggerRefName }.value++; };
${ code }`;
	}

	/**
	 * 修改渲染函数使其依赖于更新触发器
	 */
	function modifyRenderFunction(code: string): string {
		// 避免重复修改
		if (code.includes(`${ triggerRefName }.value`)) {
			return code;
		}

		try {
			const ast = parseBabel(code, {
				sourceType: "module",
				plugins: [ "typescript", "jsx" ]
			});

			traverse(ast, {
				ReturnStatement(path) {
					if (!path.node.argument) {
						return;
					}

					// 创建对触发器引用的表达式
					const triggerExpr = t.memberExpression(
						t.identifier(triggerRefName),
						t.identifier("value")
					);

					// 处理多根节点情况（数组）
					if (t.isArrayExpression(path.node.argument)) {
						path.node.argument.elements.push(triggerExpr);
					}
					// 处理JSX元素
					else if (t.isJSXElement(path.node.argument)) {
						path.node.argument.openingElement.attributes.push(
							t.jsxAttribute(
								t.jsxIdentifier(markerAttribute),
								t.jsxExpressionContainer(triggerExpr)
							)
						);
					}
					// 处理h函数调用
					else if (t.isCallExpression(path.node.argument) &&
						((t.isIdentifier(path.node.argument.callee) && path.node.argument.callee.name === "h") ||
							(t.isIdentifier(path.node.argument.callee) && path.node.argument.callee.name === "createVNode"))) {

						const args = path.node.argument.arguments;
						// 如果第二个参数是props对象，直接添加标记
						if (args.length >= 2 && t.isObjectExpression(args[1])) {
							args[1].properties.push(
								t.objectProperty(t.identifier(markerAttribute), triggerExpr)
							);
						}
						// 如果只有一个参数，添加空props对象并添加标记
						else if (args.length === 1) {
							args.splice(1, 0, t.objectExpression([
								t.objectProperty(t.identifier(markerAttribute), triggerExpr)
							]));
						}
						// 如果第二个参数不是对象（比如字符串子节点），插入一个新的props对象
						else if (args.length >= 2 && !t.isObjectExpression(args[1])) {
							args.splice(1, 0, t.objectExpression([
								t.objectProperty(t.identifier(markerAttribute), triggerExpr)
							]));
						}
					}
					// 其他情况用数组包裹
					else {
						path.node.argument = t.arrayExpression([
							path.node.argument,
							triggerExpr
						]);
					}
				}
			});

			const { code: transformedCode } = generate(ast);
			return transformedCode || code;
		} catch ( error ) {
			console.error("Error modifying render function:", error);
			return code; // 在出错时返回原始代码
		}
	}

	/**
	 * 处理Vue单文件组件
	 */
	async function processVueSFC(code: string, id: string): Promise<TransformResult | null> {
		try {
			const { descriptor } = parse(code);
			const filename = id.split("?")[0];

			// 编译脚本
			let scriptContent = "";
			if (descriptor.script || descriptor.scriptSetup) {
				const scriptOptions: SFCScriptCompileOptions = {
					id,
					filename,
					sourceMap: true,
					babelParserPlugins: [ "typescript", "jsx" ]
				};

				const scriptResult = compileScript(descriptor, scriptOptions);
				scriptContent = injectTriggerLogic(scriptResult.content);
			}

			// 编译模板
			let templateContent = "";
			if (descriptor.template) {
				const templateResult = compileTemplate({
					source: descriptor.template.content,
					filename,
					id,
					compilerOptions: {
						mode: "module",
						sourceMap: true
					}
				});
				templateContent = modifyRenderFunction(templateResult.code);
			}

			// 组合结果
			let finalCode = scriptContent;
			if (templateContent) {
				// 确保我们不会重复注入相同的逻辑
				finalCode += `
						import { render as __render } from './${ filename?.replace(/\//g, "\\/") }.vue?vue&type=template'
						`;
			}

			return finalCode !== code ? { code: finalCode, map: null } : null;
		} catch ( error ) {
			if(logErrors){
				console.error("Error processing Vue SFC:", error);
			}
			return null; // 在出错时返回null
		}
	}

	/**
	 * 处理TSX组件
	 */
	async function processTSX(code: string): Promise<TransformResult | null> {
		try {
			// 注入触发器逻辑
			const withTrigger = injectTriggerLogic(code);

			// 修改渲染函数前先进行一次Babel转换，确保JSX语法正确解析
			const preprocessed = await transformAsync(withTrigger, {
				presets: [ "@babel/preset-typescript" ],
				plugins: [ "@vue/babel-plugin-jsx" ],
				sourceMaps: true,
				filename: "component.tsx"
			});

			if (!preprocessed?.code) {
				return null;
			}

			// 修改渲染函数
			const withModifiedRender = modifyRenderFunction(preprocessed.code);

			// 如果没有修改，返回null
			if (withModifiedRender === preprocessed.code) {
				return null;
			}

			// 最终转换
			const result = await transformAsync(withModifiedRender, {
				presets: [ "@babel/preset-typescript" ],
				plugins: [ "@vue/babel-plugin-jsx" ],
				sourceMaps: true,
				filename: "component.tsx"
			});

			return result ? {
				code: result.code || withModifiedRender,
				map: result.map
			} : { code: withModifiedRender, map: null };
		} catch ( error ) {
			if (logErrors){
				console.error("Error processing TSX component:", error);
			}
			return null; // 在出错时返回null
		}
	}

	/**
	 * 处理H函数组件
	 */
	function processHComponent(code: string): TransformResult | null {
		try {
			const withTrigger = injectTriggerLogic(code);
			const withModifiedRender = modifyRenderFunction(withTrigger);

			return withModifiedRender === code ? null : {
				code: withModifiedRender,
				map: null
			};
		} catch ( error ) {
			if (logErrors){
				console.error("Error processing H function component:", error);
			}
			return null; // 在出错时返回null
		}
	}

	// 返回Vite插件对象
	return {
		name: "vite-plugin-vue-manual-update",

		async transform(code, id) {
			// 检查文件是否应该被处理
			if (!filter(id)) {
				return null;
			}

			// 处理Vue SFC
			if (id.endsWith(".vue")) {
				return await processVueSFC(code, id);
			}

			// 处理TSX组件
			if (id.endsWith(".tsx")) {
				return await processTSX(code);
			}

			// 处理H函数组件（.ts文件中包含h函数调用）
			if (id.endsWith(".ts") && (code.includes("h(") || code.includes("createVNode("))) {
				return processHComponent(code);
			}

			return null;
		}
	};
}