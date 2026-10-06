import {duration,pricing,today} from './pricingService';
import {units} from '../types';
export function validateProforma(input:any){
 if(!Number.isInteger(input.quantity)||input.quantity<1||!units.includes(input.unit)||!['HTG','USD'].includes(input.currency))throw new Error('Quantité, unité ou devise invalide.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.validUntil)||(Number.isNaN(Date.parse(input.validUntil))||new Date(input.validUntil).toISOString().slice(0,10)!==input.validUntil)||input.validUntil<today())throw new Error('La validité doit être une date à venir.');
 const count=duration(input.start,input.end,input.unit);return {...pricing({...input,duration:count,paid:0,penalties:0}),duration:count};
}
export function assertConvertible(q:any){if(!q||!['Brouillon','Envoyée'].includes(q.status))throw new Error('Cette pro forma ne peut plus être convertie.');if(q.validUntil<today())throw new Error('Cette pro forma a expiré. Modifiez sa validité avant conversion.');}
