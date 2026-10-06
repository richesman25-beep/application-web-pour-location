const zone='America/Port-au-Prince';
function parts(date:Date){const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);return Object.fromEntries(p.map(v=>[v.type,v.value]));}
export function localDate(){const p=parts(new Date());return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
export function fromHaiti(value:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw new Error('Renseignez une date et une heure valides.');
 const [y,m,d,h,min]=value.split(/[-T:]/).map(Number),naive=Date.UTC(y,m-1,d,h,min);let stamp=naive;
 for(let i=0;i<3;i++){const p=parts(new Date(stamp)),shown=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));stamp=naive-(shown-stamp);}
 const p=parts(new Date(stamp));if(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`!==value)throw new Error('Cette heure n’existe pas dans le fuseau America/Port-au-Prince.');
 return new Date(stamp).toISOString();
}
