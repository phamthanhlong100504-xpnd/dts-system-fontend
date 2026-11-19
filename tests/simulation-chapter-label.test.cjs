require('./simulation-test-loader.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chapterDisplayName}=require('../src/features/simulations/components/simulation-presentation.ts');
for(const [number,roman] of [[1,'I'],[2,'II'],[3,'III'],[4,'IV'],[5,'V'],[6,'VI']])test(`chapter ${number}: display strips only its matching repeated label`,()=>{
 const name='Giao thông trên đường đô thị';
 assert.equal(chapterDisplayName(`Chương ${number}: ${name}`,number),name);
 assert.equal(chapterDisplayName(`Chương ${roman} – ${name}`,number),name);
 assert.equal(chapterDisplayName(name,number),name);
});
test('unexpected prefix, mismatched chapter and an empty remaining title are preserved instead of hiding data',()=>{
 for(const name of ['Chương 2: Giao thông','Chương 1: ','Chương trình an toàn','Chapter 1: Traffic'])assert.equal(chapterDisplayName(name,1),name);
});
