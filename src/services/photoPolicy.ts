export function photoPath(value:string,org:string){
 let path=value;
 if(value.startsWith('https://')){try{const u=new URL(value),m=/^\/v0\/b\/[^/]+\/o\/(.+)$/.exec(u.pathname);if(u.hostname!=='firebasestorage.googleapis.com'||!m)return '';path=decodeURIComponent(m[1]);}catch{return '';}}
 return path.startsWith(`organizations/${org}/`)&&!path.includes('..')?path:'';
}
