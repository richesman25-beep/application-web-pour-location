import type {Unit} from '../types';
export function duration(start:string,end:string,unit:Unit){
 const hours=(Date.parse(end)-Date.parse(start))/3600000;
 if(!Number.isFinite(hours)||hours<0) throw new Error('La date de retour doit être après le départ.');
 if(unit==='fixe'||unit==='personnalisé') return 1;
 return Math.max(1,Math.ceil(hours/({heure:1,jour:24,nuit:24,semaine:168,mois:720}[unit])));
}
export function pricing(input:{quantity:number;rate:number;duration:number;discount?:number;fees?:number;penalties?:number;deposit?:number;paid?:number}){
 const {quantity,rate,duration:count,discount=0,fees=0,penalties=0,deposit=0,paid=0}=input;
 if(![quantity,rate,count,discount,fees,penalties,deposit,paid].every(v=>Number.isFinite(v)&&v>=0)||quantity<=0||count<=0) throw new Error('Les montants doivent être positifs et la quantité supérieure à zéro.');
 const round=(n:number)=>Math.round(n*100)/100;
 const subtotal=round(quantity*rate*count),rentalTotal=round(subtotal-discount+fees+penalties);
 if(rentalTotal<0) throw new Error('La réduction dépasse le coût de la location.');
 const total=round(rentalTotal+deposit);if(paid>total) throw new Error('Le paiement dépasse le total à payer.');
 return {subtotal,rentalTotal,total,deposit,paid,balance:round(total-paid)};
}
export function money(n:number,currency='HTG'){return `${new Intl.NumberFormat('fr-HT',{maximumFractionDigits:2}).format(n||0)} ${currency}`;}
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Port-au-Prince',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function overdue(r:any){return r.status==='Active'&&Date.parse(r.end)<Date.now();}
