export type Row = {id:string; organizationId:string; [key:string]:any};
export type Unit = 'heure'|'jour'|'nuit'|'semaine'|'mois'|'fixe'|'personnalisé';
export type Currency = 'HTG'|'USD';
export const methods=['Cash HTG','Cash USD','MonCash','NatCash','Carte bancaire','Virement','Chèque','Crédit','Autre'];
export const units:Unit[]=['heure','jour','nuit','semaine','mois','fixe','personnalisé'];
export const defaults={name:'LOKASYON LAKAY',phone:'',whatsapp:'',address:'Port-au-Prince, Haïti',email:'',currency:'HTG',exchange:132,terms:'Merci de retourner les biens dans leur état initial.',prefix:'FAC',logo:''};
