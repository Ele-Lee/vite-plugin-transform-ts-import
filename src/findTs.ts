import fs from 'fs';
import { warpForResolveIndex } from './utils/common';
import { isLogicFile } from './utils/file';
import { aliasList, pathMapForRecord, plugins, tsVarMap } from './utils/var';
import parser from '@babel/parser';
import nodePath from 'path';
import traverse from '@babel/traverse';
import t from '@babel/types';

export function recordTs(filePath) {
  if (pathMapForRecord[filePath]) return;
  if (!fs.existsSync(filePath)) return;
  if (!fs.statSync(filePath).isFile()) {
    warpForResolveIndex(recordTs, filePath);
    return;
  }
  if (!isLogicFile(filePath)) return;

  const str = fs.readFileSync(filePath, {
    encoding: 'utf-8',
  });
  const ast = parser.parse(str, {
    sourceType: 'module',
    plugins: plugins,
  });

  const innerHandlerForExportNamed = (path, tsType) => {
    const isExport = t.isExportNamedDeclaration(path.parent);
    if (!isExport) return;
    tsVarMap[path.node.id.name] = tsVarMap[path.node.id.name] || [];
    const tmp = {
      path: filePath,
      isExport,
      tsType, // 1. interface, 2. type
    };
    tsVarMap[path.node.id.name].push(tmp);

    // fs.writeFileSync('./tsVarMap-cache.json', JSON.stringify(tsVarMap), 'utf8');
  };

  const innerHandlerForRecursive = path => {
    if (!path.node) return;
    if (!path.node.source) return;
    let pathTmp = path.node.source.value as string;

    if (pathTmp.startsWith('./')) {
      pathTmp = nodePath.join(filePath.replace(/[^/]+$/, ''), pathTmp);
    }

    warpForResolveIndex(recordTs, pathTmp);
  };

  traverse(ast, {
    TSInterfaceDeclaration(_path) {
      innerHandlerForExportNamed(_path, 1);
    },
    TSTypeAliasDeclaration(_path) {
      innerHandlerForExportNamed(_path, 2);
    },
    ExportNamedDeclaration(_path) {
      innerHandlerForRecursive(_path);
    },
    ExportAllDeclaration(_path) {
      innerHandlerForRecursive(_path);
    },
  });
  pathMapForRecord[filePath] = 1;
}

export function findTsInMap(targetName, targetSourcePath, filePath) {
  const tmp = tsVarMap.hasOwnProperty(targetName);

  if (!tmp) return false;

  if (
    tsVarMap[targetName].some(
      tsCache => !!tsCache.matching && tsCache.matching.test(targetSourcePath)
    )
  ) {
    return true;
  }

  const aliasPathTmp = aliasList.find(item =>
    (typeof item.find === 'string'
      ? new RegExp('^' + item.find)
      : item.find
    ).test(targetSourcePath)
  ) || {
    find: './',
    replacement: filePath.replace(/[^/]+$/, ''),
  };
  let sourcesPathInPC = '';
  if (aliasPathTmp) {
    sourcesPathInPC = targetSourcePath
      .replace(
        new RegExp('^' + aliasPathTmp.find),
        aliasPathTmp.replacement + '/'
      )
      .replace('//', '/');
  }
  if(/\.{1,2}\//.test(sourcesPathInPC)) {
    sourcesPathInPC = nodePath.resolve(filePath.replace(/\/[\w\d]+.\w+$/,''), sourcesPathInPC)
  }
  return tsVarMap[targetName].some(tsCache => {
    if (tsCache.path) {
      return tsCache.path.includes(sourcesPathInPC);
    }
    if (tsCache.matching) {
      return tsCache.matching.test(sourcesPathInPC);
    }
    return false;
  });
}
