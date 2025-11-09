
// vite-plugin-manual-update.test.ts
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { manualUpdatePlugin } from './vite-plugin-manual-update';
import type { Plugin } from 'vite';
import { transformAsync } from '@babel/core';

// 模拟Babel转换，避免测试环境问题
vi.mock('@babel/core', () => ({
	transformAsync: vi.fn(async (code) => ({
		code,
		map: null
	}))
}));

describe('manualUpdatePlugin', () => {
	const plugin = manualUpdatePlugin({ include: ['**/*'] }) as Plugin;
	const transform = plugin.transform!;

	it('should be properly defined', () => {
		expect(plugin.name).toBe('vite-plugin-manual-update');
		expect(transform).toBeInstanceOf(Function);
	});

	it('should inject trigger logic into Vue SFC', async () => {
		const code = `
      <template>
        <div>Test</div>
      </template>
      <script setup lang="ts">
        const count = 1;
      </script>
    `;

		const result = await transform(code, 'Test.vue');
		expect(result).toBeDefined();
		expect(result!.code).toContain('__manualUpdateTrigger');
		expect(result!.code).toContain('triggerUpdate');
	});

	it('should handle TSX components', async () => {
		const code = `
      import { defineComponent } from 'vue';
      export default defineComponent({
        setup() {
          return () => <div>TSX Test</div>;
        }
      });
    `;

		const result = await transform(code, 'Test.tsx');
		expect(result).toBeDefined();
		expect(result!.code).toContain('__manualUpdateMarker');
		expect(result!.code).toContain('triggerUpdate');
	});

	// 其他测试用例保持不变...
});