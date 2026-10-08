import {describe,it,expect} from 'vitest';
import {invoiceDate,invoiceItems} from '../src/services/invoicePresentation';
const rental={id:'LOC-1',organizationId:'test',assetName:'Véhicule',quantity:1,start:'2026-10-08T13:05:09Z',end:'2026-10-09T13:05:09Z',duration:1,unit:'jour',rate:100,currency:'HTG',subtotal:100,rentalTotal:100,total:100,paid:25,balance:75,deposit:0,discount:0,fees:0,penalties:0};
describe('présentation des factures',()=>{
 it('affiche les secondes en heure d’Haïti, indépendamment du navigateur',()=>{
  expect(invoiceDate(rental.start)).toContain('09:05:09');
  expect(invoiceDate('2026-01-08T13:05:09Z')).toContain('08:05:09');
  expect(invoiceDate('invalide')).toBe('Non renseignée');
 });
 it('masque les ajustements à zéro et conserve les montants essentiels',()=>{
  const rows=invoiceItems(rental);
  expect(rows.map(([label])=>label)).not.toContain('Réduction');
  expect(rows.map(([label])=>label)).not.toContain('Frais');
  expect(rows.map(([label])=>label)).not.toContain('Pénalités');
  expect(rows.map(([label])=>label)).not.toContain('Caution');
  expect(rows).toContainEqual(['Montant payé','25 HTG']);
  expect(rows).toContainEqual(['Solde','75 HTG']);
  expect(rows.find(([label])=>label==='Retour prévu')?.[1]).toContain('09:05:09');
 });
 it('conserve les ajustements et la caution applicables sans recalculer les montants',()=>{
  const rows=invoiceItems({...rental,discount:10,fees:5,penalties:20,deposit:50,rentalTotal:115,total:165,balance:140});
  for(const row of [['Sous-total','100 HTG'],['Réduction','10 HTG'],['Frais','5 HTG'],['Pénalités','20 HTG'],['Caution','50 HTG'],['Total à payer','165 HTG'],['Solde','140 HTG']])expect(rows).toContainEqual(row);
 });
});
