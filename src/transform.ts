import fs from 'fs'
import { warpForResolveIndex } from './utils/common';
import { isLogicFile } from "./utils/file";
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import t from '@babel/types';
import generate from '@babel/generator';
import { findTsInMap, recordTs } from './findTs';
import { aliasList, plugins } from './utils/var';
import { ISpecifiersListItem } from './typing';

export function transformFile(filePath, str = '', canRecursive = true) {
  if (!fs.existsSync(filePath)) return '';

  var stat = fs.statSync(filePath);
  if (stat.isFile()) {
    if (isLogicFile(filePath)) {
      if (!str) {
        str = fs.readFileSync(filePath, {
          encoding: 'utf-8',
        });
      }

      const res = transformByCodeStr(str, filePath);
      return res;
    }
  }
  if (!canRecursive) {
    return str;
  }

  return warpForResolveIndex(transformFile, filePath, '', false);
}

function transformByCodeStr(codeStr, filePath) {
  const ast = parser.parse(codeStr, {
    sourceType: 'module',
    plugins: plugins,
  });

  const innerHandlerForTransform = (_path, type = 'import') => {
    const specifiersList:ISpecifiersListItem[] = [];
    const source = _path.node.source.value as string;

    // 判断是一个路径，直接再次进去
    const aliasPathTmp = aliasList.find(item =>
      (typeof item.find === 'string'
        ? new RegExp('^' + item.find)
        : item.find
      ).test(source)
    ) || {
      find: './',
      replacement: filePath.replace(/[^/]+$/, ''),
    };

    if (aliasPathTmp) {
      const targetPath = source
        .replace(
          new RegExp('^' + aliasPathTmp.find),
          aliasPathTmp.replacement + '/'
        )
        .replace('//', '/');
      warpForResolveIndex(recordTs, targetPath);
    }

    _path.node.specifiers.forEach(item => {
      if ('ImportDefaultSpecifier' === item.type) {
        specifiersList.push({
          localName: item.local.name,
          importedName: null,
          exportedName: null,
          path: filePath,
          isType: false,
          isDefault: true,
        });
      } else if (item.imported && item.imported.name) {
        specifiersList.push({
          localName: item.local.name,
          importedName: item.imported.name,
          exportedName: null,
          path: filePath,
          isType: _path.node.importKind === 'type',
          isDefault: false,
        });
      } else if (item.exported && item.exported.name) {
        specifiersList.push({
          localName: item.local.name,
          importedName: null,
          exportedName: item.exported.name,
          path: filePath,
          isType: undefined,
          isDefault: item.exported.name == 'default',
          isExportByDefault: item.local.name === 'default' && item.exported.name !== 'default'
        });
      }
    });


    const list = specifiersList.map(item2 => {
      let tmp: any = null;
      let importStr = '';

      if (item2.exportedName) {
        importStr =
          item2.localName == item2.exportedName
            ? item2.exportedName
            :  item2.isExportByDefault
            ? `${item2.localName} as ${item2.exportedName}`
            : `${item2.exportedName} as ${item2.localName}`;
      } else {
        importStr =
          item2.localName == item2.importedName
            ? item2.importedName
            : `${item2.importedName} as ${item2.localName}`;
      }

      if (
        findTsInMap(item2.importedName, source, filePath) ||
        item2.isType ||
        findTsInMap(item2.exportedName, source, filePath)
      ) {
        tmp = t.identifier(`${type} type {${importStr}} from '${source}';`);
      } else if (item2.isDefault && !item2.exportedName) {
        tmp = t.identifier(`${type} ${item2.localName} from '${source}';`);
      } else {
        tmp = t.identifier(`${type} {${importStr}} from '${source}';`);
      }

      return tmp;
    });

    if (list.length) {
      _path.replaceWithMultiple(list);
      _path.skip();
    }
  };

  traverse(ast, {
    ImportDeclaration(_path) {
      innerHandlerForTransform(_path);
    },
    ExportNamedDeclaration(_path) {
      if (!_path.node) return;
      if (!_path.node.source) return;
      innerHandlerForTransform(_path, 'export');
    },
  });

  return generate(ast, {
    comments: false,
  }).code;
}
