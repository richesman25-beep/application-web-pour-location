export type SiteSettings={name:string;supportEmail:string;maintenance:boolean;registrationOpen:boolean;message:string};
export const siteDefaults:SiteSettings={name:'Lokasyon',supportEmail:'',maintenance:false,registrationOpen:true,message:''};
export type Account={uid:string;email:string;name:string;disabled:boolean;emailVerified:boolean;createdAt:string;lastLogin:string};
