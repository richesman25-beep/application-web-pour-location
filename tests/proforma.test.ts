import {describe,it,expect} from 'vitest';
import {validateProforma,assertConvertible} from '../src/services/proformaPolicy';
const input={quantity:2,rate:250,unit:'jour',currency:'HTG',start:'2026-10-10T13:00:00Z',end:'2026-10-11T13:00:00Z',validUntil:'2099-12-31',deposit:100,paid:500};
describe('pro forma',()=>{
 it('calcule un document prévisionnel sans paiement',()=>{expect(validateProforma(input)).toMatchObject({duration:1,total:600,paid:0,balance:600});});
 it('refuse une quantité fractionnaire',()=>expect(()=>validateProforma({...input,quantity:1.5})).toThrow());
 it('refuse une validité passée et un retour avant départ',()=>{expect(()=>validateProforma({...input,validUntil:'2000-01-01'})).toThrow();expect(()=>validateProforma({...input,end:'2026-10-01T13:00:00Z'})).toThrow();});
 it('refuse une conversion expirée, annulée ou déjà effectuée',()=>{for(const q of [{status:'Brouillon',validUntil:'2000-01-01'},{status:'Annulée',validUntil:input.validUntil},{status:'Convertie',validUntil:input.validUntil}])expect(()=>assertConvertible(q)).toThrow();});
 it('refuse une date inexistante',()=>expect(()=>validateProforma({...input,validUntil:'2099-02-30'})).toThrow());
 it('autorise les propositions valides',()=>{for(const status of ['Brouillon','Envoyée'])expect(()=>assertConvertible({status,validUntil:input.validUntil})).not.toThrow();});
});
