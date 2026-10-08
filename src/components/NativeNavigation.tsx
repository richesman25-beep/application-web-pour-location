import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Capacitor,type PluginListenerHandle} from '@capacitor/core';
import {App} from '@capacitor/app';
import {nativeBackDestination} from '../services/nativeNavigation';

export function NativeNavigation(){
 const navigate=useNavigate();
 useEffect(()=>{
  if(!Capacitor.isNativePlatform())return;
  let disposed=false,listener:PluginListenerHandle|undefined;
  void App.addListener('backButton',()=>{
   const dialog=[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1);
   if(dialog){dialog.close();return;}
   const cancel=document.querySelector<HTMLButtonElement>('.modal-backdrop [role="dialog"] button.spaced');
   if(cancel){cancel.click();return;}
   const menu=document.querySelector<HTMLButtonElement>('.sidebar.open + .overlay');
   if(menu){menu.click();return;}
   const action=nativeBackDestination(window.location.pathname,Number(window.history.state?.idx||0));
   if(action==='history')navigate(-1);
   else if(action==='dashboard')navigate('/dashboard',{replace:true});
   else void App.minimizeApp();
  }).then(handle=>{if(disposed)void handle.remove();else listener=handle;});
  return()=>{disposed=true;void listener?.remove();};
 },[navigate]);
 return null;
}
