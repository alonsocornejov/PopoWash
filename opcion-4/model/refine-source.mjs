import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const ts=path.join(dir,'createBidet.ts');
let code=fs.readFileSync(ts,'utf8');
const stage=code.match(/Sculpt build pass: ([a-z-]+)/)?.[1]??'blockout';
if(!code.includes("import { refineGeometry }")){
 code="import { refineGeometry } from './refineGeometry.js';\n"+code;
 code=code.replace('  root.userData.actionReadiness = {','  refineGeometry(root.userData.sculptRuntime);\n  root.userData.actionReadiness = {');
 fs.writeFileSync(ts,code);
}
code=code.replace(/refineGeometry\(root.userData.sculptRuntime(?:, '[a-z-]+')?\);/,`refineGeometry(root.userData.sculptRuntime, '${stage}');`);
// Clean solid finishes must not tile the photographed illumination or molded contours.
code=code.replace("?.declared === true;", "?.declared === true || spec.colorVariation?.pattern === 'solid';");
fs.writeFileSync(ts,code);
// Node's built-in TypeScript stripping preserves the factory without introducing a bundler.
const {stripTypeScriptTypes}=await import('node:module');
fs.writeFileSync(path.join(dir,'createBidet.js'),stripTypeScriptTypes(code,{mode:'strip'}).replaceAll('model/material-evidence/','material-evidence/').replaceAll('model/chrome-evidence/','chrome-evidence/'));
