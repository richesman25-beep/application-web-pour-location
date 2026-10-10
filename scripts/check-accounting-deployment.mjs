// Vérification locale de l’artefact Functions ; aucun déploiement ni appel à une base.
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(new URL('../functions/package.json',import.meta.url));
const config=JSON.parse(readFileSync(new URL('../firebase.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../functions/package.json',import.meta.url)));
if(manifest.engines.node!=='22')throw new Error('Runtime Node 22 attendu.');
if(!config.functions?.some(f=>f.source==='functions'&&f.predeploy?.length))throw new Error('Source Functions ou compilation predeploy manquante.');
const built=require('./lib/index.js');
const names=['accountingStatus','accountingInitialize','accountingSaveAccount','accountingPost','accountingReverse','accountingSetPeriod','accountingSync'];
for(const name of names){const fn=built[name];if(typeof fn!=='function'||fn.__endpoint?.platform!=='gcfv2'||!fn.__endpoint?.region?.includes('us-central1'))throw new Error(`Export ou région invalide : ${name}.`);}
console.log('Artefact local prêt : 7 fonctions comptables v2, us-central1, Node 22.');
console.log('Aucune vérification des ressources publiées ni des permissions IAM de production effectuée.');
