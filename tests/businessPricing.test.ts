import {test,expect} from 'vitest';
import {pricing as clientPricing,duration as clientDuration} from '../src/services/pricingService';
import {pricing as serverPricing,duration as serverDuration} from '../functions/src/businessPricing';
test('la validation serveur conserve les calculs du site pour toutes les unités',()=>{
 for(const unit of ['heure','jour','nuit','semaine','mois','fixe','personnalisé'] as const){const start='2026-10-07T10:00:00Z',end='2026-10-10T14:00:00Z';expect(serverDuration(start,end,unit)).toBe(clientDuration(start,end,unit));const input={quantity:2,rate:12.5,duration:clientDuration(start,end,unit),discount:1.5,fees:3,deposit:20,paid:4,penalties:1};expect(serverPricing(input)).toEqual(clientPricing(input));}
});
