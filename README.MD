# vite-plugin-vue-manual-update

## 插件简介

vite-plugin-vue-manual-update 是一个 Vite 插件，用于为 Vue 组件（包括 Vue SFC、TSX 和 H 函数组件）添加手动更新触发能力。该插件通过静态分析和代码转换，在编译时为组件注入必要的更新触发逻辑，使开发者能够手动控制组件的更新时机。

## 安装

```bash
# 使用 npm
npm install vite-plugin-vue-manual-update --save-dev

# 使用 yarn
yarn add vite-plugin-vue-manual-update -D

# 使用 pnpm
pnpm add vite-plugin-vue-manual-update -D
```

## 基本使用

### 1. 在 Vite 配置中注册插件

```typescript:vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createManualUpdatePlugin } from 'vite-plugin-vue-manual-update'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    createManualUpdatePlugin({
      include: ['**/*.vue', '**/*.tsx', '**/*.ts']
    })
  ]
})
```

### 2. 在组件中使用

#### Vue SFC 组件

```vue:MyComponent.vue
<template>
  <div :__manualUpdateMarker="true">
    {{ count }}
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

// 组件将自动获得一个 triggerUpdate 方法
const triggerUpdate = defineOptions({
  // 这是由插件注入的更新触发函数
})

// 手动触发更新
function handleClick() {
  count.value++
  // 通常 Vue 会自动更新，但在某些情况下你可能需要手动触发
  triggerUpdate()
}
</script>
```

#### TSX 组件

```tsx:MyTsxComponent.tsx
import { defineComponent, ref } from 'vue'

const MyTsxComponent = defineComponent({
  setup() {
    const count = ref(0)
    
    // 组件将自动获得一个 triggerUpdate 方法
    const triggerUpdate = {
      // 这是由插件注入的更新触发函数
    }
    
    return () => (
      <div __manualUpdateMarker="true">
        <span>{count.value}</span>
        <button onClick={() => {
          count.value++
          triggerUpdate()
        }}>Update</button>
      </div>
    )
  }
})

export default MyTsxComponent
```

#### H 函数组件

```ts:MyHComponent.ts
import { h, ref } from 'vue'

function MyHComponent() {
  const count = ref(0)
  
  // 组件将自动获得一个 triggerUpdate 方法
  const triggerUpdate = {
    // 这是由插件注入的更新触发函数
  }
  
  return h('div', {
    __manualUpdateMarker: true,
    onClick: () => {
      count.value++
      triggerUpdate()
    }
  }, count.value)
}

export default MyHComponent
```

## 配置选项

插件提供了以下配置选项来自定义其行为：

```typescript
export interface ManualUpdatePluginOptions {
  /**
   * 需要处理的文件路径匹配规则数组
   * 支持字符串和正则表达式
   * 必需参数
   */
  include: (string | RegExp)[];
  
  /**
   * 排除的文件路径匹配规则数组
   * 支持字符串和正则表达式
   * 可选参数，默认为空数组
   */
  exclude?: (string | RegExp)[];
  
  /**
   * 组件更新标记的属性名
   * 可选参数，默认为 '__manualUpdateMarker'
   */
  markerAttribute?: string;
  
  /**
   * 触发更新的函数名
   * 可选参数，默认为 'triggerUpdate'
   */
  updateFunctionName?: string;
  
  /**
   * 内部更新触发器引用名
   * 可选参数，默认为 '__manualUpdateTrigger'
   */
  triggerRefName?: string;
  
  /**
   * 是否打印处理错误信息
   * 可选参数，默认为 true
   */
  logErrors?: boolean;
}
```

## 高级用法

### 自定义更新函数名

```typescript:vite.config.ts
import { defineConfig } from 'vite'
import { createManualUpdatePlugin } from 'vite-plugin-vue-manual-update'

export default defineConfig({
  plugins: [
    createManualUpdatePlugin({
      include: ['**/*.vue'],
      updateFunctionName: 'refreshComponent'
    })
  ]
})
```

然后在组件中使用自定义的函数名：

```vue:MyComponent.vue
<template>
  <div :__manualUpdateMarker="true">
    Content
  </div>
</template>

<script setup lang="ts">
// 现在使用自定义的函数名
const refreshComponent = defineOptions({})

function forceRefresh() {
  refreshComponent()
}
</script>
```

### 在不同环境中控制错误日志

```typescript:vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import { createManualUpdatePlugin } from 'vite-plugin-vue-manual-update'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [
      createManualUpdatePlugin({
        include: ['**/*.vue', '**/*.tsx'],
        // 在生产环境中禁用错误日志，在开发环境中启用
        logErrors: env.NODE_ENV !== 'production'
      })
    ]
  }
})
```

### 使用正则表达式匹配文件

```typescript:vite.config.ts
import { defineConfig } from 'vite'
import { createManualUpdatePlugin } from 'vite-plugin-vue-manual-update'

export default defineConfig({
  plugins: [
    createManualUpdatePlugin({
      include: [
        /src\\components\\dynamic\\.*\\.vue$/ // 只处理特定目录下的组件
      ],
      exclude: [
        /src\\components\\static\\/ // 排除某些目录
      ]
    })
  ]
})
```

## 常见问题与解决方案

### 1. 组件没有获得 triggerUpdate 方法

**问题**：配置了插件但组件中没有自动注入 triggerUpdate 方法。

**解决方案**：
- 确保在组件模板的根元素上添加了 `__manualUpdateMarker="true"` 属性
- 检查 Vite 配置中的 include 规则是否匹配到了你的组件文件
- 查看控制台是否有相关错误信息（如果 logErrors 为 true）

### 2. 控制台出现错误日志

**问题**：在使用插件时控制台输出了 "Error processing Vue SFC" 等错误信息。

**解决方案**：
- 在插件配置中设置 `logErrors: false` 来禁用错误日志
- 检查你的组件代码是否有语法错误或不符合规范的地方

### 3. 某些文件没有被处理

**问题**：有些组件文件没有被插件处理。

**解决方案**：
- 检查 include/exclude 配置是否正确
- 确保文件扩展名与配置中的匹配规则一致
- 检查文件路径是否包含特殊字符

## 浏览器兼容性

该插件生成的代码兼容所有现代浏览器和 Vue 3 支持的浏览器。生成的代码不包含任何 ES6+ 特性以外的语法，因此不需要额外的 polyfill。

## 开发环境注意事项

在开发过程中，建议保持 `logErrors: true` 以便及时发现潜在问题。如果需要在测试环境中禁用错误日志，可以在测试配置中设置 `logErrors: false`。

## 版本要求

- Vite: 3.0.0 及以上
- Vue: 3.0.0 及以上
- Node.js: 14.18.0 及以上

## 许可证

MIT