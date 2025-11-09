import type { Plugin } from 'vite';

export interface ManualUpdatePluginOptions {
  /**
   * 需要处理的文件路径匹配规则数组
   * 支持字符串和正则表达式
   */
  include: (string | RegExp)[];
  
  /**
   * 排除的文件路径匹配规则数组
   * 支持字符串和正则表达式
   */
  exclude?: (string | RegExp)[];
  
  /**
   * 组件更新标记的属性名
   * @default '__manualUpdateMarker'
   */
  markerAttribute?: string;
  
  /**
   * 触发更新的函数名
   * @default 'triggerUpdate'
   */
  updateFunctionName?: string;
  
  /**
   * 内部更新触发器引用名
   * @default '__manualUpdateTrigger'
   */
  triggerRefName?: string;

	/**
	 * 是否打印处理错误信息
	 * @default true
	 */
	logErrors?: boolean;
}

export interface ManualUpdatePluginAPI {
  /**
   * 创建Vite插件实例
   */
  createManualUpdatePlugin: (options: ManualUpdatePluginOptions) => Plugin;
}