import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const variant=process.argv[2]||'debug';
const tasks={debug:'assembleDebug',validation:'bundleValidation',release:'bundleRelease'};
if(!tasks[variant])throw new Error('Choisissez debug, validation ou release.');
function run(command,args,cwd=process.cwd()){
 const result=spawnSync(command,args,{cwd,stdio:'inherit',env:process.env});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
run(process.execPath,['node_modules/typescript/bin/tsc','-b']);
run(process.execPath,['node_modules/vite/bin/vite.js','build','--mode','android','--outDir','dist-android']);
run(process.execPath,['node_modules/@capacitor/cli/bin/capacitor','sync','android']);
const task=tasks[variant];
if(process.platform==='win32')run('cmd.exe',['/d','/s','/c',`gradlew.bat --no-daemon --max-workers=2 ${task}`],resolve('android'));
else run('./gradlew',['--no-daemon','--max-workers=2',task],resolve('android'));
console.log(variant==='debug'?'APK : android/app/build/outputs/apk/debug/app-debug.apk':`AAB : android/app/build/outputs/bundle/${variant}/app-${variant}.aab`);
