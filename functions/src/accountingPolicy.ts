export type AccountType='asset'|'liability'|'equity'|'income'|'expense';
export type Account={code:string;name:string;type:AccountType;enabled:boolean;system:boolean};
export type JournalLine={accountCode:string;accountName:string;accountType:AccountType;debit:number;credit:number};
export const accountTypes:Record<AccountType,string>={asset:'Actif',liability:'Passif',equity:'Capitaux propres',income:'Produits',expense:'Charges'};
export const defaultAccounts:Account[]=[
 ['101','Capital et apports','equity'],['119','Résultats reportés','equity'],['164','Emprunts','liability'],['165','Cautions remboursables','liability'],
 ['218','Matériel et équipements','asset'],['281','Amortissements cumulés','asset'],['401','Fournisseurs','liability'],['411','Clients','asset'],['445','Taxes à payer','liability'],
 ['512','Banque','asset'],['513','MonCash','asset'],['514','NatCash','asset'],['531','Caisse','asset'],['580','Encaissements à affecter','asset'],
 ['606','Achats et fournitures','expense'],['613','Loyers','expense'],['615','Entretien et réparations','expense'],['616','Assurances','expense'],['622','Honoraires et prestations','expense'],['623','Publicité','expense'],['625','Déplacements','expense'],['627','Frais bancaires','expense'],['641','Salaires','expense'],['681','Dotations aux amortissements','expense'],
 ['706','Revenus des locations','income'],['707','Autres prestations','income'],['758','Autres produits','income'],
].map(([code,name,type])=>({code,name,type:type as AccountType,enabled:true,system:true}));
export function dayInHaiti(value:Date|string=new Date()){const d=new Date(value);if(!Number.isFinite(d.getTime()))throw new Error('Date invalide.');return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Port-au-Prince',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}
export function validDate(value:unknown){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value||value<'2000-01-01'||value>dayInHaiti())throw new Error('Date comptable invalide ou future.');return value;}
export function validCurrency(value:unknown):'HTG'|'USD'{if(value!=='HTG'&&value!=='USD')throw new Error('Choisissez HTG ou USD.');return value;}
export function cents(value:unknown){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e9||Math.abs(value*100-Math.round(value*100))>1e-5)throw new Error('Montant invalide : deux décimales au maximum.');return Math.round(value*100);}
export function validAccountCode(value:unknown){if(typeof value!=='string'||!/^\d{3,8}$/.test(value))throw new Error('Code de compte : 3 à 8 chiffres.');return value;}
export function validateJournalLines(input:unknown,accounts:Account[]):JournalLine[]{
 if(!Array.isArray(input)||input.length<2||input.length>30)throw new Error('Une écriture doit contenir entre 2 et 30 lignes.');
 const lines=input.map(value=>{const code=validAccountCode(value?.accountCode),account=accounts.find(a=>a.code===code&&a.enabled);if(!account)throw new Error(`Compte ${code} absent ou désactivé.`);const debit=cents(value.debit),credit=cents(value.credit);if((debit>0)===(credit>0))throw new Error('Chaque ligne doit avoir un débit ou un crédit, jamais les deux.');return {accountCode:code,accountName:account.name,accountType:account.type,debit,credit};});
 const debit=lines.reduce((n,l)=>n+l.debit,0),credit=lines.reduce((n,l)=>n+l.credit,0);if(debit!==credit)throw new Error('Le total des débits doit être égal au total des crédits.');return lines;
}
export function invoiceLines(revenue:number,deposit:number,oldRevenue=0,oldDeposit=0){
 const changes=[{accountCode:'411',amount:(revenue+deposit)-(oldRevenue+oldDeposit)},{accountCode:'706',amount:oldRevenue-revenue},{accountCode:'165',amount:oldDeposit-deposit}];
 return changes.filter(c=>c.amount!==0).map(c=>({accountCode:c.accountCode,debit:Math.max(0,c.amount)/100,credit:Math.max(0,-c.amount)/100}));
}
export function paymentAccount(method:unknown){const accounts:Record<string,string>={'Cash HTG':'531','Cash USD':'531',MonCash:'513',NatCash:'514','Carte bancaire':'512',Virement:'512','Chèque':'512',Autre:'580'};if(typeof method!=='string'||!accounts[method])throw new Error('Ce moyen ne représente pas un encaissement. Corrigez le moyen de paiement avant import.');return accounts[method];}
