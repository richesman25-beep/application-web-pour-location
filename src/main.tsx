import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {Provider,useApp} from './contexts/AppContext';
import {Layout} from './components/Layout';
import {Login} from './pages/Login';
import {Dashboard} from './pages/Dashboard';
import {Records,RecordForm} from './pages/Records';
import {RentalList,NewRental,RentalDetail} from './pages/Rentals';
import {Payments,Invoices,Invoice} from './pages/Finance';
import {Settings} from './pages/Settings';
import {Search} from './pages/Search';
import './style.css';
function Protected(){const {user,ready,loading,error,logout}=useApp();if(!ready||loading)return <div className="loading"><span className="spinner"/>Chargement de votre espace…</div>;if(!user)return <Navigate to="/login" replace/>;if(error)return <div className="error padded">Connexion Firestore impossible : {error}. Vérifiez les émulateurs ou les règles Firebase.<button onClick={()=>window.location.reload()}>Réessayer</button><button onClick={logout}>Déconnexion</button></div>;return <Layout/>;}
function Admin({children}:{children:React.ReactNode}){return useApp().role==='admin'?children:<Navigate to="/dashboard" replace/>;}
function LoginRoute(){const {user,ready}=useApp();return ready&&user?<Navigate to="/dashboard" replace/>:<Login/>;}
function App(){return <BrowserRouter><Routes><Route path="/login" element={<LoginRoute/>}/><Route element={<Protected/>}><Route path="/dashboard" element={<Dashboard/>}/>{(['customers','assets','categories'] as const).map(kind=><React.Fragment key={kind}><Route path={`/${kind}`} element={kind==='categories'?<Admin><Records kind={kind}/></Admin>:<Records kind={kind}/>}/><Route path={`/${kind}/new`} element={kind==='categories'?<Admin><RecordForm kind={kind}/></Admin>:<RecordForm kind={kind}/>}/><Route path={`/${kind}/:id`} element={kind==='categories'?<Admin><RecordForm kind={kind}/></Admin>:<RecordForm kind={kind}/>}/></React.Fragment>)}<Route path="/rentals" element={<RentalList/>}/><Route path="/rentals/new" element={<NewRental/>}/><Route path="/rentals/:id" element={<RentalDetail/>}/><Route path="/returns" element={<RentalList returns/>}/><Route path="/payments" element={<Payments/>}/><Route path="/invoices" element={<Invoices/>}/><Route path="/invoices/:id" element={<Invoice/>}/><Route path="/settings" element={<Admin><Settings/></Admin>}/><Route path="/search" element={<Search/>}/></Route><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></BrowserRouter>;}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Provider><App/></Provider></React.StrictMode>);
