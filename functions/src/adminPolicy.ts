export function validId(value: unknown): string {
 if(typeof value!=='string'||!value||value.length>128||! /^[A-Za-z0-9_-]+$/.test(value))throw new Error('Identifiant invalide.');return value;
}
export function validText(value: unknown, maximum=200): string {
 if(typeof value!=='string'||!value.trim()||value.trim().length>maximum)throw new Error('Texte invalide.');return value.trim();
}
export function validBoolean(value:unknown):boolean{if(typeof value!=='boolean')throw new Error('Valeur invalide.');return value;}
export function validRole(value:unknown):'admin'|'employee'{if(value!=='admin'&&value!=='employee')throw new Error('Rôle invalide.');return value;}
export function assertManageable(actor:string,target:string,protectedAdmin:boolean){
 if(actor===target)throw new Error('Vous ne pouvez pas désactiver ou rétrograder votre propre compte.');
 if(protectedAdmin)throw new Error('Retirez d’abord le rôle super-admin de ce compte.');
}
export function canManage(record: {active?: boolean}|undefined,disabled:boolean){return record?.active===true&&!disabled;}
