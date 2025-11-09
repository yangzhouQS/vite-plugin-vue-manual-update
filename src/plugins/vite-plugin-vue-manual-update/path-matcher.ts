// path-matcher.ts - 路径匹配器
import { PathMatcherOptions } from './types'

export class PathMatcher {
	private baseDirs: string[]    // 改为数组存储多个基础目录
	private extensions: string[]
	private pathSeparator: string

	constructor(options: PathMatcherOptions = {}) {
		// 处理基础目录为数组的情况
		this.baseDirs = Array.isArray(options.baseDir)
			? options.baseDir
			: options.baseDir ? [options.baseDir] : ['src/components']

		this.extensions = options.extensions || ['.vue', '.tsx', '.ts', '.js']
		this.pathSeparator = options.pathSeparator || '/'
	}

	/**
	 * 标准化组件路径
	 */
	normalizePath(path: string): string {
		let normalized = path
		// 移除扩展名
		for (const ext of this.extensions) {
			if (normalized.endsWith(ext)) {
				normalized = normalized.slice(0, -ext.length)
				break
			}
		}
		// 统一路径分隔符
		return normalized.replace(/[\\/]/g, this.pathSeparator)
	}

	/**
	 * 从多个基础目录中找到匹配的并生成组件ID
	 */
	generateComponentId(filePath: string): string {
		let normalizedPath = this.normalizePath(filePath)

		// 尝试匹配多个基础目录
		for (const baseDir of this.baseDirs) {
			const normalizedBase = this.normalizePath(baseDir)
			if (normalizedPath.startsWith(normalizedBase)) {
				// 从基础目录后截取路径
				let relativePath = normalizedPath.slice(normalizedBase.length)
				// 移除开头的路径分隔符
				if (relativePath.startsWith(this.pathSeparator)) {
					relativePath = relativePath.slice(1)
				}
				return relativePath || 'index'
			}
		}

		// 如果没有匹配的基础目录，使用完整路径的标准化形式
		return normalizedPath
	}

	/**
	 * 基于路径数组进行多模式匹配
	 */
	matchClosest(registry: Record<string, any>, targetPaths: string | string[]): string | null {
		// 确保目标路径是数组格式
		const targets = Array.isArray(targetPaths) ? targetPaths : [targetPaths]
		const normalizedTargets = targets.map(path => this.normalizePath(path))
		const candidates = Object.keys(registry)

		// 1. 精确匹配：检查是否有任何目标路径与注册的组件ID精确匹配
		for (const target of normalizedTargets) {
			if (candidates.includes(target)) {
				return target
			}
		}

		// 2. 层级匹配：尝试匹配各级父路径
		for (const target of normalizedTargets) {
			const pathSegments = target.split(this.pathSeparator)
			// 从长到短尝试父路径
			for (let i = pathSegments.length - 1; i > 0; i--) {
				const partialPath = pathSegments.slice(0, i).join(this.pathSeparator)
				if (candidates.includes(partialPath)) {
					return partialPath
				}
			}
		}

		// 3. 根路径匹配
		if (candidates.includes('index')) {
			return 'index'
		}

		return null
	}
}
