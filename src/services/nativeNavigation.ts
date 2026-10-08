export function nativeBackDestination(path:string,historyIndex:number){
 if(historyIndex>0)return 'history';
 return ['/dashboard','/login','/','/super-admin'].includes(path)?'minimize':'dashboard';
}
