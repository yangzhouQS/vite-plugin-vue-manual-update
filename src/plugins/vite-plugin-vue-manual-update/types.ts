import { Component, ComponentOptions, VNode } from 'vue'

export type ComponentType = 'vue' | 'tsx' | 'h-function'

export interface ResolvedComponent {
	component: Component | ComponentOptions | ((...args: any[]) => VNode)
	type: ComponentType
	path: string
}

export interface ComponentRegistry {
	[key: string]: ResolvedComponent
}

// 调整为支持数组格式的路径配置
export interface PathMatcherOptions {
	baseDir?: string | string[]  // 支持单个或多个基础目录
	extensions?: string[]
	pathSeparator?: string       // 路径分隔符，默认'/'
}