export const fileSuffixList = ['.js', '.jsx', '.ts', '.tsx']


export function warpForResolveIndex(fn, _filePath, ...rest) {
  fn(_filePath + '.ts', ...rest);
  fn(_filePath + '.js', ...rest);
  fn(_filePath + '.tsx', ...rest);
  fn(_filePath + '/index.ts', ...rest);
  fn(_filePath + '/index.js', ...rest);
  fn(_filePath + '/index.tsx', ...rest);
}


