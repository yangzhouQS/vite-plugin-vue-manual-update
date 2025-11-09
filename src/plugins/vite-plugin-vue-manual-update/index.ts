// index.ts - 插件入口
import { ComponentPlugin } from './plugin'
import { PathMatcherOptions } from './types'

export function createComponentPlugin(options?: PathMatcherOptions) {
	return new ComponentPlugin(options)
}

export * from './types'
export * from './plugin'
