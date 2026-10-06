import type {Account,JournalLine} from '../../functions/src/accountingPolicy';
export type Journal={id:string;date:string;currency:string;reference:string;description:string;lines:JournalLine[];createdAt:string;source:string;reversedBy?:string;reverses?:string;rentalId?:string};
export function journalSort(a:Journal,b:Journal){return a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id);}
export function trialBalance(entries:Journal[],accounts:Account[],currency:string,from:string,to:string){
 const rows=new Map<string,Account&{opening:number;debit:number;credit:number;balance:number}>();
 for(const account of accounts)rows.set(account.code,{...account,opening:0,debit:0,credit:0,balance:0});
 for(const entry of entries){if(entry.currency!==currency||entry.date>to)continue;for(const line of entry.lines){let row=rows.get(line.accountCode);if(!row){row={code:line.accountCode,name:line.accountName,type:line.accountType,enabled:true,system:false,opening:0,debit:0,credit:0,balance:0};rows.set(row.code,row);}if(entry.date<from)row.opening+=line.debit-line.credit;else{row.debit+=line.debit;row.credit+=line.credit;}row.balance+=line.debit-line.credit;}}
 return [...rows.values()].sort((a,b)=>a.code.localeCompare(b.code));
}
export function reports(entries:Journal[],accounts:Account[],currency:string,from:string,to:string){
 const rows=trialBalance(entries,accounts,currency,from,to),income=rows.filter(a=>a.type==='income').reduce((sum,a)=>sum+a.credit-a.debit,0),expenses=rows.filter(a=>a.type==='expense').reduce((sum,a)=>sum+a.debit-a.credit,0),assets=rows.filter(a=>a.type==='asset').reduce((sum,a)=>sum+a.balance,0),liabilities=-rows.filter(a=>a.type==='liability').reduce((sum,a)=>sum+a.balance,0),equity=-rows.filter(a=>a.type==='equity').reduce((sum,a)=>sum+a.balance,0);
 const cumulativeProfit=rows.reduce((sum,a)=>sum+(a.type==='income'?-a.balance:a.type==='expense'?-a.balance:0),0);
 return {rows,income,expenses,profit:income-expenses,assets,liabilities,equity,cumulativeProfit,balanceCheck:assets-liabilities-equity-cumulativeProfit,treasury:rows.filter(a=>a.type==='asset'&&/^5/.test(a.code)).reduce((sum,a)=>sum+a.balance,0),receivables:rows.filter(a=>a.code.startsWith('411')).reduce((sum,a)=>sum+a.balance,0),payables:-rows.filter(a=>a.code.startsWith('401')).reduce((sum,a)=>sum+a.balance,0),deposits:-rows.filter(a=>a.code.startsWith('165')).reduce((sum,a)=>sum+a.balance,0),debit:rows.reduce((sum,a)=>sum+a.debit,0),credit:rows.reduce((sum,a)=>sum+a.credit,0)};
}
export function generalLedger(entries:Journal[],accountCode:string,currency:string,from:string,to:string){
 let opening=0;const movements=entries.filter(e=>e.currency===currency&&e.date<=to).sort(journalSort).flatMap(entry=>entry.lines.filter(line=>line.accountCode===accountCode).map(line=>({entry,line})));const rows:({entry:Journal;line:JournalLine;balance:number})[]=[];let balance=0;
 for(const movement of movements){balance+=movement.line.debit-movement.line.credit;if(movement.entry.date<from)opening=balance;else rows.push({...movement,balance});}return {opening,rows,balance};
}
export function csvContent(rows:(string|number)[][]){const cell=(value:string|number)=>{let text=String(value);if(typeof value==='string'&&/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};return '\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n');}
export function exportCsv(filename:string,rows:(string|number)[][]){const blob=new Blob([csvContent(rows)],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
