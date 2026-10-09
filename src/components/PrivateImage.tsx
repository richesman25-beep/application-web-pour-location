import {useEffect,useState,type ImgHTMLAttributes} from 'react';
import {useApp} from '../contexts/AppContext';
import {photoDataUrl} from '../services/photoService';
export function PrivateImage({src,...props}:ImgHTMLAttributes<HTMLImageElement>){const {org,user,accessError}=useApp(),[image,setImage]=useState('');
 useEffect(()=>{let alive=true;setImage('');if(src&&user&&!accessError)void photoDataUrl(src,org).then(value=>{if(alive)setImage(value);}).catch(()=>{});return()=>{alive=false;};},[src,org,user?.uid,accessError]);
 return image?<img {...props} src={image}/>:<span className={props.className} role="img" aria-label={props.alt||'Photo indisponible'}>◇</span>;
}
