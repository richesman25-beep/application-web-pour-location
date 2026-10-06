import {describe,it,expect} from 'vitest';
import {pricing,duration} from '../src/services/pricingService';
describe('calcul des locations',()=>{
 it('sépare la caution du revenu et calcule les paiements partiels',()=>{expect(pricing({quantity:2,rate:100,duration:3,discount:50,fees:20,deposit:200,paid:400})).toEqual({subtotal:600,rentalTotal:570,total:770,deposit:200,paid:400,balance:370});});
 it('arrondit les semaines commencées',()=>{expect(duration('2026-10-01T00:00:00Z','2026-10-09T00:00:00Z','semaine')).toBe(2);});
 it('rejette les dates inversées',()=>{expect(()=>duration('2026-10-09','2026-10-01','jour')).toThrow();});
 it('rejette les quantités nulles, montants négatifs et surpaiements',()=>{for(const v of [{quantity:0},{rate:-1},{paid:101},{discount:101}])expect(()=>pricing({quantity:1,rate:100,duration:1,...v})).toThrow();});
 it('arrondit les montants à deux décimales',()=>{expect(pricing({quantity:3,rate:.1,duration:1}).total).toBe(.3);});
 it('applique les pénalités au retour sans compter la caution',()=>{expect(pricing({quantity:1,rate:100,duration:1,deposit:50,penalties:20,paid:80}).balance).toBe(90);});
});

import {fromHaiti} from '../src/services/dateService';
it('convertit les horaires de location depuis le fuseau haïtien',()=>{expect(fromHaiti('2026-10-01T09:00')).toBe('2026-10-01T13:00:00.000Z');expect(fromHaiti('2026-01-01T09:00')).toBe('2026-01-01T14:00:00.000Z');});
