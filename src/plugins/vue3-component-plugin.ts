import { App, Component, ComponentOptions, VNode, h } from 'vue'

// 类型定义
export type ComponentType = 'vue' | 'tsx' | 'h-function'

export interface ResolvedComponent {
	component: Component | ComponentOptions | ((...args: any[]) => VNode)
	type: ComponentType
	path: string
}

export interface ComponentRegistry {
	[key: string]: ResolvedComponent
}

export interface PathMatcherOptions {
	baseDir?: string | string[]
	extensions?: string[]
	pathSeparator?: string
}

// 路径匹配器
class PathMatcher {
	private baseDirs: string[]
	private extensions: string[]
	private pathSeparator: string

	constructor(options: PathMatcherOptions = {}) {
		this.baseDirs = Array.isArray(options.baseDir)
			? options.baseDir
			: options.baseDir ? [options.baseDir] : ['src/components']

		this.extensions = options.extensions || ['.vue', '.tsx', '.ts', '.js']
		this.pathSeparator = options.pathSeparator || '/'
	}

	normalizePath(path: string): string {
		let normalized = path
		for (const ext of this.extensions) {
			if (normalized.endsWith(ext)) {
				normalized = normalized.slice(0, -ext.length)
				break
			}
		}
		return normalized.replace(/[\\/]/g, this.pathSeparator)
	}

	generateComponentId(filePath: string): string {
		const normalizedPath = this.normalizePath(filePath)

		for (const baseDir of this.baseDirs) {
			const normalizedBase = this.normalizePath(baseDir)
			if (normalizedPath.startsWith(normalizedBase)) {
				let relativePath = normalizedPath.slice(normalizedBase.length)
				if (relativePath.startsWith(this.pathSeparator)) {
					relativePath = relativePath.slice(1)
				}
				return relativePath || 'index'
			}
		}

		return normalizedPath
	}

	matchClosest(registry: Record<string, any>, targetPaths: string | string[]): string | null {
		const targets = Array.isArray(targetPaths) ? targetPaths : [targetPaths]
		const normalizedTargets = targets.map(path => this.normalizePath(path))
		const candidates = Object.keys(registry)

		// 精确匹配
		for (const target of normalizedTargets) {
			if (candidates.includes(target)) {
				return target
			}
		}

		// 层级匹配
		for (const target of normalizedTargets) {
			const pathSegments = target.split(this.pathSeparator)
			for (let i = pathSegments.length - 1; i > 0; i--) {
				const partialPath = pathSegments.slice(0, i).join(this.pathSeparator)
				if (candidates.includes(partialPath)) {
					return partialPath
				}
			}
		}

		// 根路径匹配
		if (candidates.includes('index')) {
			return 'index'
		}

		return null
	}
}

// 组件解析器
class ComponentResolver {
	resolve(component: any, path: string): ResolvedComponent {
		if (this.isVueComponent(component)) {
			return { component, type: 'vue', path }
		}

		if (this.isTsxComponent(component)) {
			return { component, type: 'tsx', path }
		}

		if (this.isHFunctionComponent(component)) {
			return { component, type: 'h-function', path }
		}

		throw new Error(`Unsupported component type at path: ${path}`)
	}

	private isVueComponent(component: any): component is Component | ComponentOptions {
		return (
			typeof component === 'object' &&
			component !== null &&
			('name' in component || 'setup' in component || 'render' in component)
		)
	}

	private isTsxComponent(component: any): component is (props: any) => VNode {
		return (
			typeof component === 'function' &&
			typeof component.prototype === 'undefined'
		)
	}

	private isHFunctionComponent(component: any): component is (...args: any[]) => VNode {
		return (
			typeof component === 'function' &&
			(component.toString().includes('h(') ||
				component.toString().includes('createVNode('))
		)
	}
}

// 插件核心
export class ComponentPlugin {
	private registry: ComponentRegistry = {}
	private resolver: ComponentResolver
	private pathMatcher: PathMatcher

	constructor(options: PathMatcherOptions = {}) {
		this.resolver = new ComponentResolver()
		this.pathMatcher = new PathMatcher(options)
	}

	registerComponent(filePath: string, component: any): void {
		const componentId = this.pathMatcher.generateComponentId(filePath)
		const resolved = this.resolver.resolve(component, filePath)
		this.registry[componentId] = resolved
	}

	registerComponents(components: Record<string, any>, basePath: string = ''): void {
		for (const [fileName, component] of Object.entries(components)) {
			const fullPath = basePath ? `${basePath}/${fileName}` : fileName
			this.registerComponent(fullPath, component)
		}
	}

	getComponentByPath(paths: string | string[]): ResolvedComponent | null {
		const matchedId = this.pathMatcher.matchClosest(this.registry, paths)
		return matchedId ? this.registry[matchedId] : null
	}

	install(app: App): void {
		for (const [id, resolved] of Object.entries(this.registry)) {
			app.component(id, resolved.component as Component)
		}

		app.config.globalProperties.$getComponentByPath = (paths: string | string[]) =>
			this.getComponentByPath(paths)?.component
	}

	getRegisteredComponents(): ComponentRegistry {
		return { ...this.registry }
	}
}

export function createComponentPlugin(options?: PathMatcherOptions) {
	return new ComponentPlugin(options)
}