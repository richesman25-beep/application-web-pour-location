import {test,expect} from 'vitest';
import {fingerprint} from '../src/services/offlineStore';
test('les contrôles de conflit ignorent l’ordre des propriétés mais détectent toute modification',()=>{
 expect(fingerprint({name:'Jean',address:{city:'Port-au-Prince',number:1},amounts:[10,20]})).toBe(fingerprint({amounts:[10,20],address:{number:1,city:'Port-au-Prince'},name:'Jean'}));
 expect(fingerprint({available:10})).not.toBe(fingerprint({available:9}));expect(fingerprint([10,20])).not.toBe(fingerprint([20,10]));expect(fingerprint(undefined)).not.toBe(fingerprint({}));
});
