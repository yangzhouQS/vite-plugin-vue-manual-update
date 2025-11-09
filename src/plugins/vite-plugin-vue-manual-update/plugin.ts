// plugin.ts - 插件核心
import { App, Component } from 'vue'
import { ComponentRegistry, ResolvedComponent, PathMatcherOptions } from './types'
import { ComponentResolver } from './component-resolver'
import { PathMatcher } from './path-matcher'

export class ComponentPlugin {
	private registry: ComponentRegistry = {}
	private resolver: ComponentResolver
	private pathMatcher: PathMatcher

	constructor(options: PathMatcherOptions = {}) {
		this.resolver = new ComponentResolver()
		this.pathMatcher = new PathMatcher(options)
	}

	// ... 其他方法保持不变

	/**
	 * 根据路径数组获取组件
	 */
	getComponentByPath(paths: string | string[]): ResolvedComponent | null {
		const matchedId = this.pathMatcher.matchClosest(this.registry, paths)
		return matchedId ? this.registry[matchedId] : null
	}

	/**
	 * 安装插件到Vue应用
	 */
	install(app: App): void {
		// 全局注册所有组件
		for (const [id, resolved] of Object.entries(this.registry)) {
			app.component(id, resolved.component as Component)
		}

		// 提供全局方法，支持数组路径
		app.config.globalProperties.$getComponentByPath = (paths: string | string[]) =>
			this.getComponentByPath(paths)?.component
	}
}
