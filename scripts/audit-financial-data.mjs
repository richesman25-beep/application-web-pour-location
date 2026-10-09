// Read-only preflight before deploying stricter financial rules. Never prints document contents.
import {createRequire} from 'node:module';
const require=createRequire(new URL('../functions/package.json',import.meta.url));
const args=process.argv.slice(2),project=args[args.indexOf('--project')+1];
if(!args.includes('--project')||!project||project.startsWith('--'))throw new Error('Indiquez --project PROJECT_ID.');
if(process.env.FIRESTORE_EMULATOR_HOST){if(!project.startsWith('demo-'))throw new Error('Les essais locaux exigent un projet demo-.');}
else if(!args.includes('--production-read-only'))throw new Error('Sans émulateur, --production-read-only et des identifiants de lecture sont requis.');
const {initializeApp}=require('firebase-admin/app'),{getFirestore}=require('firebase-admin/firestore');
const db=getFirestore(initializeApp({projectId:project}));
const money=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e9&&Math.abs(v*100-Math.round(v*100))<1e-5;
const methods=['Cash HTG','Cash USD','MonCash','NatCash','Carte bancaire','Virement','Chèque','Crédit','Autre'];
const result={project,mode:process.env.FIRESTORE_EMULATOR_HOST?'emulator':'production-read-only',checked:0,incompatible:0,examples:[]};
for(const kind of ['rentals','payments']){
 let last;
 for(;;){let query=db.collectionGroup(kind).orderBy('__name__').limit(250);if(last)query=query.startAfter(last);const page=await query.get();if(page.empty)break;
  for(const document of page.docs){const match=/^organizations\/([^/]+)\/(rentals|payments)\/[^/]+$/.exec(document.ref.path);if(!match)continue;const org=match[1],v=document.data();let valid=v.organizationId===org;result.checked++;
   if(kind==='rentals')valid=valid&&Number.isInteger(v.quantity)&&v.quantity>0&&['HTG','USD'].includes(v.currency)&&['rentalTotal','deposit','total','paid','balance'].every(k=>money(v[k]))&&v.paid<=v.total&&Math.abs(v.total-v.rentalTotal-v.deposit)<1e-5&&Math.abs(v.balance-v.total+v.paid)<1e-5;
   else{const allowed=['organizationId','rentalId','amount','currency','method','date'];valid=valid&&Object.keys(v).every(k=>allowed.includes(k))&&typeof v.rentalId==='string'&&!v.rentalId.includes('/')&&typeof v.date==='string'&&money(v.amount)&&v.amount>0&&['HTG','USD'].includes(v.currency)&&methods.includes(v.method);if(valid){const rental=await db.doc(`organizations/${org}/rentals/${v.rentalId}`).get();valid=rental.exists&&v.currency===rental.data().currency&&v.amount<=rental.data().total;}}
   if(!valid){result.incompatible++;if(result.examples.length<100)result.examples.push({path:document.ref.path,reason:'Incompatible avec les nouvelles validations financières'});}
  }
  last=page.docs.at(-1);if(page.size<250)break;
 }
}
console.log(JSON.stringify(result,null,2));process.exitCode=result.incompatible?1:0;
