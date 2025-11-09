// vite-plugin-manual-update.ts
import type { Plugin, TransformResult } from "vite";
import { parse, compileScript, compileTemplate, SFCScriptCompileOptions } from "@vue/compiler-sfc";
import { generate } from "@babel/generator";
import { parse as parseBabel } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { createFilter } from "@rollup/pluginutils";
import { transformAsync } from "@babel/core"; // 使用异步版本更符合Vite的工作方式

// 插件配置选项
export interface ManualUpdatePluginOptions {
	include: (string | RegExp)[];
	exclude?: (string | RegExp)[];
}

// 注入更新触发器逻辑
function injectTriggerLogic(code: string): string {
	if (code.includes("__manualUpdateTrigger")) return code;

	return `import { ref } from 'vue';
const __manualUpdateTrigger = ref(0);
export const triggerUpdate = () => { __manualUpdateTrigger.value++; };
${ code }`;
}

// 修改渲染函数使其依赖于触发器
function modifyRenderFunction(code: string): string {
	if (code.includes("__manualUpdateTrigger.value")) return code;

	const ast = parseBabel(code, {
		sourceType: "module",
		plugins: [ "typescript", "jsx" ]
	});

	traverse(ast, {
		ReturnStatement(path) {
			if (!path.node.argument) return;

			const triggerExpr = t.memberExpression(
				t.identifier("__manualUpdateTrigger"),
				t.identifier("value")
			);

			// 处理多根节点情况（数组）
			if (t.isArrayExpression(path.node.argument)) {
				path.node.argument.elements.push(t.jsxExpressionContainer(triggerExpr));
			}
			// 处理JSX元素
			else if (t.isJSXElement(path.node.argument)) {
				path.node.argument.openingElement.attributes.push(
					t.jsxAttribute(
						t.jsxIdentifier("__manualUpdateMarker"),
						t.jsxExpressionContainer(triggerExpr)
					)
				);
			}
			// 处理h函数调用
			else if (t.isCallExpression(path.node.argument) &&
				t.isIdentifier(path.node.argument.callee) &&
				path.node.argument.callee.name === "h") {
				const args = path.node.argument.arguments;
				if (args.length >= 2 && t.isObjectExpression(args[1])) {
					args[1].properties.push(
						t.objectProperty(t.identifier("__manualUpdateMarker"), triggerExpr)
					);
				} else if (args.length === 1) {
					args.splice(1, 0, t.objectExpression([
						t.objectProperty(t.identifier("__manualUpdateMarker"), triggerExpr)
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
}

// 处理Vue单文件组件
async function processVueSFC(code: string, id: string): Promise<TransformResult> {
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
		finalCode += `\nimport { render as __render } from './${ filename }.vue?vue&type=template'\n`;
		finalCode += `export default { ...defaultExport, render: __render }`;
	}

	return finalCode !== code ? { code: finalCode, map: null } : null;
}

// 处理TSX组件 - 修正Babel配置
async function processTSX(code: string): Promise<TransformResult | null> {
	const withTrigger = injectTriggerLogic(code);

	// 修改渲染函数前先进行一次Babel转换，确保JSX语法正确解析
	const preprocessed  = await transformAsync(withTrigger, {
		presets: [ "@babel/preset-typescript" ],
		plugins: [ "@vue/babel-plugin-jsx" ], // 这里是关键修正
		sourceMaps: true,
		filename: "component.tsx"
	});

	if (!preprocessed?.code) return null;

	// 修改渲染函数
	const withModifiedRender = modifyRenderFunction(preprocessed.code);
	console.log('withModifiedRender == ', withModifiedRender);
	if (withModifiedRender === preprocessed.code){
		console.warn('withModifiedRender 相等的---');
		return null;
	}

	console.log('result ==== start');
	// 最终转换
	const result = await transformAsync(withModifiedRender, {
		presets: ['@babel/preset-typescript'],
		plugins: ['@vue/babel-plugin-jsx'],
		sourceMaps: true,
		filename: 'component.tsx'
	});

	console.log('result ==== ', result);

	return result ? {
		code: result.code || withModifiedRender,
		map: result.map
	} : { code: withModifiedRender, map: null };
}

// 处理H函数组件
function processHComponent(code: string): TransformResult {
	const withTrigger = injectTriggerLogic(code);
	const withModifiedRender = modifyRenderFunction(withTrigger);

	return withModifiedRender === code ? null : {
		code: withModifiedRender,
		map: null
	};
}

// 插件主函数
export function manualUpdatePlugin(options: ManualUpdatePluginOptions): Plugin {
	const filter = createFilter(options.include, options.exclude);

	return {
		name: "vite-plugin-manual-update",

		async transform(code, id) {
			console.log('--- code', code );
			console.log('--- id', id );
			if (!filter(id)) return null;

			// 处理Vue SFC
			if (id.endsWith(".vue")) {
				return await processVueSFC(code, id);
			}

			// 处理TSX组件
			if (id.endsWith(".tsx")) {
				return await processTSX(code); // 添加await
			}

			// 处理H函数组件
			if (id.endsWith(".ts") && code.includes("h(")) {
				return processHComponent(code);
			}

			return null;
		}
	};
}

export default manualUpdatePlugin;