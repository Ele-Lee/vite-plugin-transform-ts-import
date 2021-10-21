import { fileSuffixList } from "./common";
import { exclude, include } from "./var";

export function isLogicFile(filePath) {
  const tmp = filePath.split('/');
  const filename = tmp[tmp.length - 1];
  return include.length > 0
    ? include.some(_name => _name == filename)
    : fileSuffixList.some(suffix => filePath.endsWith(suffix)) &&
        !exclude.includes(filename);
}