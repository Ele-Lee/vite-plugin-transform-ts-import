import type { ParserPlugin } from '@babel/parser';

export type TAliasList = Array<{ find: RegExp | string; replacement: string }>;

export interface TTsVarMap {
  [k: string]: Array<
    TTsVarMapVal & {
      isExport?: boolean;
      tsType?: number;
    }
  >;
}

type TTsVarMapVal = {
  path?: string;
  matching?: RegExp;
};

export interface VitePluginParams {
  exclude?: string[];
  plugins?: ParserPlugin[];
  tsInDeps?: TTsVarMap;
}

export interface ISpecifiersListItem {
  localName: string;
  importedName: string | null;
  exportedName: string | null;
  path: string;
  isDefault: boolean;
  isType?: boolean;
  isExportByDefault?: boolean;
}
