import type {Row} from '../types';
import {money} from './pricingService';

export function invoiceDate(value:string){
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return 'Non renseignée';
 return new Intl.DateTimeFormat('fr-HT',{timeZone:'America/Port-au-Prince',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(date);
}

export function invoiceItems(r:Row):[string,string|number][]{
 const adjustments=[['Réduction',r.discount],['Frais',r.fees],['Pénalités',r.penalties]] as const;
 const applicable=adjustments.filter(([,amount])=>Number(amount)>0);
 return [
  ['Bien',r.assetName],['Quantité',r.quantity],
  ['Départ',invoiceDate(r.start)],['Retour prévu',invoiceDate(r.end)],
  ['Durée',`${r.duration} ${r.unit}(s)`],['Tarif',money(r.rate,r.currency)],
  ...(applicable.length?[['Sous-total',money(r.subtotal,r.currency)] as [string,string]]:[]),
  ...applicable.map(([label,amount]):[string,string]=>[label,money(amount,r.currency)]),
  ['Coût location',money(r.rentalTotal,r.currency)],
  ...(Number(r.deposit)>0?[['Caution',money(r.deposit,r.currency)] as [string,string]]:[]),
  ['Total à payer',money(r.total,r.currency)],['Montant payé',money(r.paid,r.currency)],['Solde',money(r.balance,r.currency)],
 ];
}
