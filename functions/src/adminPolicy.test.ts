import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertManageable,canManage,validBoolean,validId,validRole,validText} from './adminPolicy';
test('un administrateur ordinaire ou suspendu ne reçoit pas l’accès global',()=>{assert.equal(canManage(undefined,false),false);assert.equal(canManage({active:false},false),false);assert.equal(canManage({active:true},true),false);assert.equal(canManage({active:true},false),true);});
test('on ne peut pas suspendre son propre compte ni un super-admin actif',()=>{assert.throws(()=>assertManageable('a','a',false));assert.throws(()=>assertManageable('a','b',true));assert.doesNotThrow(()=>assertManageable('a','b',false));});
test('les rôles métier ne permettent aucune promotion globale',()=>{assert.equal(validRole('admin'),'admin');assert.equal(validRole('employee'),'employee');assert.throws(()=>validRole('superadmin'));});
test('les identifiants ne peuvent pas cibler d’autres chemins Firestore',()=>{assert.equal(validId('abc-123'),'abc-123');for(const id of ['','a/b','../superAdmins','a'.repeat(129),null])assert.throws(()=>validId(id));});
test('les booléens et motifs sont contrôlés côté serveur',()=>{assert.throws(()=>validBoolean('false'));assert.equal(validBoolean(false),false);assert.throws(()=>validText('  '));assert.throws(()=>validText('a'.repeat(201)));assert.equal(validText(' motif '),'motif');});
