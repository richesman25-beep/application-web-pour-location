const logo='/images/logo-lokasyon-lakay.png';
export function Brand(){return <span className="site-brand has-logo"><img src={logo} alt="LOKASYON LAKAY" fetchPriority="high"/></span>;}
export function LoadingScreen({message='Chargement de votre espace…'}:{message?:string}){return <div className="brand-loading" role="status" aria-live="polite"><Brand/><span className="spinner" aria-hidden="true"/><p>{message}</p></div>;}
