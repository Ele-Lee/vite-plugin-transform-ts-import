import { transformFile } from "./transform";
import { VitePluginParams } from "./typing";
import { fileSuffixList } from "./utils/common";
import { aliasList, exclude, plugins, tsVarMap } from "./utils/var";


export default (params?: VitePluginParams) => {
  const {
    exclude: excludesFromParams = [],
    plugins: pluginsFromParams = [],
    tsInDeps = {}
  } = params || {}
  exclude.push(...excludesFromParams)
  plugins.push(...pluginsFromParams)
  Object.assign(tsVarMap, tsInDeps)
  
  return {
    enforce: 'pre' as 'pre' | 'post',
    name: 'vite:transform-ts',
    async configResolved(resolvedConfig) {
      // 存储最终解析的配置
      if (Array.isArray(resolvedConfig.resolve.alias)) {
        aliasList.push(...resolvedConfig.resolve.alias.filter(
          item =>
            typeof item.replacement === 'string' &&
            item.replacement.startsWith('/')
        ));
      }
    },
    transform(code, pathId) {
      if (
        exclude.some(str => pathId.includes(str))
      ) {
        return code;
      }
      if (
        !pathId.includes('node_modules/') &&
        fileSuffixList.some(suffix =>
          new RegExp(`[^/]+${suffix}$`).test(pathId)
        )
      ) {
        return transformFile(pathId, code);
      }
      return code;
    },
  };
};