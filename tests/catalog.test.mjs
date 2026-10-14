import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogName,catalogIds} from '../lib/catalog-validation.mjs';
test('tag assignments allow selecting the full catalog beyond the default limit',()=>{
 const tags=Array.from({length:61},(_,index)=>`tag-${index}`);
 assert.deepEqual(catalogIds(tags,1000),tags);
 assert.throws(()=>catalogIds(tags));
 assert.throws(()=>catalogIds(Array(1001).fill('tag'),1000));
});
test('catalog names normalize spacing, Unicode width, and duplicate lookup keys',()=>{
 assert.deepEqual(catalogName('  Studio   Name '),{name:'Studio Name',nameKey:'studio name'});
 assert.equal(catalogName('Ｓｔｕｄｉｏ').nameKey,'studio');
 for(const name of ['',null,123,'x'.repeat(81)])assert.throws(()=>catalogName(name));
});
test('catalog assignments reject malformed or excessive IDs and remove duplicates',()=>{
 assert.deepEqual(catalogIds(['a','a','b']),['a','b']);
 assert.deepEqual(catalogIds([]),[]);
 for(const ids of [null,'id',[null],[''],Array(21).fill('x')])assert.throws(()=>catalogIds(ids));
});
