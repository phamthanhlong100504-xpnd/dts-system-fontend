const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const original = Module._resolveFilename;
Module._resolveFilename = function (name, parent, ...args) {
  return original.call(this, name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : name, parent, ...args);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (module, file) => {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {fileName: file, compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  }}).outputText;
  module._compile(output, file);
};
Module._extensions['.css'] = module => { module.exports = new Proxy({}, {get: (_, key) => key === "__esModule" ? false : String(key)}); };
