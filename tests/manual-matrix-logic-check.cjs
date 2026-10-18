const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const sourcePath = path.resolve(__dirname, '../src/features/admin/manual-matrix-selection.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  reportDiagnostics: true,
});
assert.equal(transpiled.diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error).length, 0);
const testModule = { exports: {} };
vm.runInNewContext(transpiled.outputText, { module: testModule, exports: testModule.exports, require }, { filename: sourcePath });
const { evaluateManualMatrixSelection: check, resolveManualQuestionChapterIds: chaptersFor, getManualSectionQuotas } = testModule.exports;
const chapters = [
  { id:'c1', number:1, sourceChapterId:'1', title:'Chuong 1' },
  { id:'c2', number:2, sourceChapterId:'2', title:'Chuong 2' },
];
assert.deepEqual(Array.from(chaptersFor({ chapterId:'1', chapterIds:['1'], chapterNumber:1 }, chapters)), ['c1']);
assert.deepEqual(Array.from(chaptersFor({ chapterIds:[], chapterNumber:2 }, chapters)), ['c2']);
const quotas = getManualSectionQuotas([
  {code:'TOPIC-1', title:'Nhom 1',questionCount:2,criticalQuestionCount:0,chapterIds:['c1']},
  {code:'TOPIC-2', title:'Nhom 2',questionCount:1,criticalQuestionCount:0,chapterIds:['c2']},
  {code:'CRITICAL', title:'Diem liet',questionCount:1,criticalQuestionCount:1,chapterIds:[]},
]);
const candidates = [
  {id:'q1', isCritical:false, chapterIds:['c1']},
  {id:'q2', isCritical:false, chapterIds:['c1']},
  {id:'q3', isCritical:false, chapterIds:['c2']},
  {id:'q4', isCritical:true, chapterIds:['c1']},
  {id:'q5', isCritical:false, chapterIds:['c1']},
  {id:'q6', isCritical:true, chapterIds:['c2']},
  {id:'q7', isCritical:false, chapterIds:['c1','c2']},
];
let result = check(['q1','q2','q3','q4'], candidates, quotas);
assert.equal(result.valid,true);assert.equal(result.complete,true);assert.deepEqual(Array.from(result.assignedBySection),[2,1,1]);
assert.equal(check(['q1','q2','q3'], candidates, quotas).complete,false);
assert.equal(check(['q1','q2','q5'], candidates, quotas).valid,false); // chapter 1 over quota
assert.equal(check(['q1','q2','q3','q4','q5'], candidates, quotas).valid,false); // over 4
assert.equal(check(['q1','q2','q3','q4','q4'], candidates, quotas).valid,false); // duplicate
assert.equal(check(['q1','q2','q3','unknown'], candidates, quotas).valid,false);
assert.equal(check(['q1','q2','q4','q6'], candidates, quotas).valid,false); // over critical quota
const overlap = check(['q1','q7','q3','q4'], candidates, quotas);
assert.equal(overlap.complete,true); // overlapping source eligibility
console.log('ManualSelectionUnitTests=PASS (9 scenarios)');
