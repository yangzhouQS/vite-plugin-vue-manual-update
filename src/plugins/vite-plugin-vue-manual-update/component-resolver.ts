// component-resolver.ts - 组件解析器
import { Component, ComponentOptions, VNode, h } from 'vue'
import { ResolvedComponent, ComponentType } from './types'

export class ComponentResolver {
	/**
	 * 解析组件并确定其类型
	 */
	resolve(component: any, path: string): ResolvedComponent {
		if (this.isVueComponent(component)) {
			return {
				component,
				type: 'vue',
				path
			}
		}

		if (this.isTsxComponent(component)) {
			return {
				component,
				type: 'tsx',
				path
			}
		}

		if (this.isHFunctionComponent(component)) {
			return {
				component,
				type: 'h-function',
				path
			}
		}

		throw new Error(`Unsupported component type at path: ${path}`)
	}

	/**
	 * 判断是否为Vue组件
	 */
	private isVueComponent(component: any): component is Component | ComponentOptions {
		return (
			typeof component === 'object' &&
			component !== null &&
			('name' in component || 'setup' in component || 'render' in component)
		)
	}

	/**
	 * 判断是否为TSX组件
	 */
	private isTsxComponent(component: any): component is (props: any) => VNode {
		return (
			typeof component === 'function' &&
			// TSX组件通常返回VNode
			typeof component.prototype === 'undefined'
		)
	}

	/**
	 * 判断是否为h函数渲染组件
	 */
	private isHFunctionComponent(component: any): component is (...args: any[]) => VNode {
		return (
			typeof component === 'function' &&
			// 简单判断：检查函数是否返回VNode类似结构
			(component.toString().includes('h(') ||
				component.toString().includes('createVNode('))
		)
	}
}
