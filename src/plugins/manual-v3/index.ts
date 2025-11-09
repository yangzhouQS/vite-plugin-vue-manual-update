// 主入口文件，导出插件工厂函数
import { createManualUpdatePlugin } from './plugin';
import type { ManualUpdatePluginOptions } from './types';

export * from './types';
export * from './plugin';

export default createManualUpdatePlugin;