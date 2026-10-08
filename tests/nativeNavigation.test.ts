import {describe,it,expect} from 'vitest';
import {nativeBackDestination} from '../src/services/nativeNavigation';
import {publicHttpsUrl} from '../src/components/NativeAccountLinks';

describe('navigation Android',()=>{
 it('revient dans l’historique avant de minimiser l’application',()=>{
  expect(nativeBackDestination('/rentals/new',2)).toBe('history');
  expect(nativeBackDestination('/dashboard',1)).toBe('history');
 });
 it('revient au tableau de bord pour une page ouverte sans historique',()=>{
  expect(nativeBackDestination('/invoices/FAC-1',0)).toBe('dashboard');
 });
 it('minimise aux pages racines sans déconnecter le compte',()=>{
  for(const path of ['/dashboard','/login','/super-admin','/'])expect(nativeBackDestination(path,0)).toBe('minimize');
 });
 it('accepte seulement les pages publiques HTTPS sans identifiants dans l’URL',()=>{
  expect(publicHttpsUrl('https://example.org/privacy')).toBe('https://example.org/privacy');
  for(const value of [undefined,'javascript:alert(1)','http://example.org','https://user:password@example.org'])expect(publicHttpsUrl(value)).toBe('');
 });
});
