import { ParserPlugin } from "@babel/parser";
import { TAliasList, TTsVarMap } from "../typing";

export const aliasList: TAliasList = [];
export const tsVarMap: TTsVarMap = {
  
};
export const exclude = [] as string[];
export const include = [];
export const plugins = ['typescript', 'jsx', 'classProperties'] as ParserPlugin[];

export const pathMapForRecord = {};