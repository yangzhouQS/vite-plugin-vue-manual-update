import { describe, it, expect } from "vitest";
import { ComponentPlugin, createComponentPlugin } from "./vue3-component-plugin";

describe("createComponentPlugin", () => {
	it("should create a plugin instance", () => {
		const plugin = createComponentPlugin();
		expect(plugin).toBeInstanceOf(ComponentPlugin);
	});
});
/*

// 模拟组件
const mockVueComponent = {
name: 'MockVue',
setup() { return {} }
}

const mockTsxComponent = (props: { text: string }) => ({
type: 'div',
children: props.text
}) as unknown as VNode

const mockHFunctionComponent = (text: string) => {
return { type: 'span', children: text } as VNode
}

describe('ComponentPlugin', () => {
describe('PathMatcher', () => {
	it('should normalize path with extensions', () => {
		const matcher = new ComponentPlugin().pathMatcher as any
		expect(matcher.normalizePath('Button.vue')).toBe('Button')
		expect(matcher.normalizePath('Card.tsx')).toBe('Card')
		expect(matcher.normalizePath('Icon.ts')).toBe('Icon')
	})

	it('should handle multiple base directories', () => {
		const plugin = new ComponentPlugin({
			baseDir: ['src/components', 'src/views']
		})
		const matcher = plugin['pathMatcher'] as any

		expect(matcher.generateComponentId('src/components/Button.vue')).toBe('Button')
		expect(matcher.generateComponentId('src/views/Home.vue')).toBe('Home')
		expect(matcher.generateComponentId('src/layouts/Header.tsx')).toBe('src/layouts/Header')
	})

	it('should match closest path from array', () => {
		const registry = {
			'Button': {},
			'common/Card': {},
			'index': {}
		}
		const matcher = new ComponentPlugin().pathMatcher as any

		// 精确匹配
		expect(matcher.matchClosest(registry, 'Button')).toBe('Button')

		// 数组匹配
		expect(matcher.matchClosest(registry, ['NotFound', 'common/Card'])).toBe('common/Card')

		// 层级匹配
		expect(matcher.matchClosest(registry, 'common/Card/Detail')).toBe('common/Card')

		// 根匹配
		expect(matcher.matchClosest(registry, 'unknown/path')).toBe('index')
	})

	it('should handle custom path separators', () => {
		const plugin = new ComponentPlugin({
			pathSeparator: '\\'
		})
		const matcher = plugin['pathMatcher'] as any

		expect(matcher.normalizePath('a/b/c.vue')).toBe('a\\b\\c')
		expect(matcher.matchClosest({ 'a\\b': {} }, 'a/b')).toBe('a\\b')
	})
})

describe('ComponentResolver', () => {
	const resolver = new ComponentPlugin()['resolver'] as any

	it('should identify vue components', () => {
		const result = resolver.resolve(mockVueComponent, 'test.vue')
		expect(result.type).toBe('vue')
	})

	it('should identify tsx components', () => {
		const result = resolver.resolve(mockTsxComponent, 'test.tsx')
		expect(result.type).toBe('tsx')
	})

	it('should identify h-function components', () => {
		const result = resolver.resolve(mockHFunctionComponent, 'test.ts')
		expect(result.type).toBe('h-function')
	})

	it('should throw error for unknown component types', () => {
		expect(() => resolver.resolve('invalid', 'test.txt'))
			.toThrow('Unsupported component type at path: test.txt')
	})
})

describe('ComponentPlugin core', () => {
	it('should register single component', () => {
		const plugin = new ComponentPlugin()
		plugin.registerComponent('src/components/Button.vue', mockVueComponent)

		const registry = plugin.getRegisteredComponents()
		expect(registry['Button']).toBeDefined()
		expect(registry['Button'].type).toBe('vue')
	})

	it('should register multiple components', () => {
		const plugin = new ComponentPlugin()
		plugin.registerComponents({
			'Button.vue': mockVueComponent,
			'Card.tsx': mockTsxComponent
		}, 'src/components')

		const registry = plugin.getRegisteredComponents()
		expect(registry['Button']).toBeDefined()
		expect(registry['Card']).toBeDefined()
	})

	it('should get component by path', () => {
		const plugin = new ComponentPlugin()
		plugin.registerComponent('src/components/Button.vue', mockVueComponent)
		plugin.registerComponent('src/components/common/Card.tsx', mockTsxComponent)

		expect(plugin.getComponentByPath('Button')?.type).toBe('vue')
		expect(plugin.getComponentByPath('common/Card')?.type).toBe('tsx')
		expect(plugin.getComponentByPath(['unknown', 'common/Card'])?.type).toBe('tsx')
	})

	it('should return null for non-existent components', () => {
		const plugin = new ComponentPlugin()
		expect(plugin.getComponentByPath('NonExistent')).toBeNull()
	})
})

describe('Vue app integration', () => {
	it('should install plugin and register components globally', () => {
		const app = createApp({})
		const plugin = createComponentPlugin()
		plugin.registerComponent('src/components/Button.vue', mockVueComponent)

		app.use(plugin)

		const globalComponents = app._context.components
		expect(globalComponents.get('Button')).toBeDefined()
	})

	it('should provide global $getComponentByPath method', () => {
		const app = createApp({})
		const plugin = createComponentPlugin()
		plugin.registerComponent('src/components/Button.vue', mockVueComponent)

		app.use(plugin)

		const globalMethods = app.config.globalProperties
		expect(globalMethods.$getComponentByPath).toBeDefined()

		const component = globalMethods.$getComponentByPath('Button')
		expect(component).toBe(mockVueComponent)
	})
})
})*/
