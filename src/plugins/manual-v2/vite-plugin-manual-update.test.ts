// vite-plugin-manual-update.test.ts
import { describe, it, expect, vi } from 'vitest';
import { manualUpdatePlugin } from './vite-plugin-manual-update';
import type { Plugin } from 'vite';

describe.skip('manualUpdatePlugin', () => {
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
		const code2 = `
      import { defineComponent } from 'vue';
      export default defineComponent({
        setup() {
          return () => <div>TSX Test</div>;
        }
      });
    `;

		const code = `
    import { defineComponent } from 'vue';
    export default defineComponent({
      setup() {
        return () => <div>TSX Test</div>;
      }
    });
  `;

		const result = await transform(code, 'Test.tsx');
		console.log('result --- ',result);
		expect(result).toBeDefined();
		expect(result!.code).toContain('__manualUpdateMarker');
		expect(result!.code).toContain('triggerUpdate');
	});

	it.skip('should handle h function components', async () => {
		const code = `
      import { h, defineComponent } from 'vue';
      export default defineComponent({
        setup() {
          return () => h('div', null, 'H Function Test');
        }
      });
    `;

		const result = await transform(code, 'Test.ts');
		expect(result).toBeDefined();
		expect(result!.code).toContain('__manualUpdateMarker');
	});

	it.skip('should handle components with multiple root nodes', async () => {
		const code = `
      <template>
        <div>First</div>
        <div>Second</div>
      </template>
      <script setup></script>
    `;

		const result = await transform(code, 'MultiRoot.vue');
		expect(result).toBeDefined();
		expect(result!.code).toContain('__manualUpdateTrigger');
	});

	it.skip('should not process excluded files', async () => {
		const excludedPlugin = manualUpdatePlugin({
			include: ['**/*'],
			exclude: ['**/*.vue']
		}) as Plugin;

		const code = `<template><div></div></template>`;
		const result = await excludedPlugin.transform!(code, 'Excluded.vue');
		expect(result).toBeNull();
	});

	it.skip('should not inject duplicate code', async () => {
		const code = `
      <template><div></div></template>
      <script setup>
        import { ref } from 'vue';
        const __manualUpdateTrigger = ref(0);
        export const triggerUpdate = () => { __manualUpdateTrigger.value++; };
      </script>
    `;

		const result = await transform(code, 'Duplicate.vue');
		const triggerCount = (result!.code.match(/triggerUpdate/g) || []).length;
		expect(triggerCount).toBe(1);
	});
});