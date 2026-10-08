import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';

// Keep the text being edited separate from the number used by the calculations.
export function NumberInput({value,onValueChange,...props}:Omit<InputHTMLAttributes<HTMLInputElement>,'type'|'value'|'defaultValue'|'onChange'> & {value:number;onValueChange:(value:number)=>void}){
 const [text,setText]=useState(String(value)),lastValue=useRef(value);
 useEffect(()=>{
  if(value!==lastValue.current){lastValue.current=value;setText(String(value));}
 },[value]);
 return <input {...props} type="number" value={text} onChange={e=>{
  const next=e.target.value;
  setText(next);
  const numeric=next===''?0:Number(next);
  if(Number.isFinite(numeric)){lastValue.current=numeric;onValueChange(numeric);}
 }} onFocus={e=>{
  if(e.target.value==='0')e.target.select();
  props.onFocus?.(e);
 }} onBlur={e=>{
  if(e.target.value!==''&&Number.isFinite(Number(e.target.value)))setText(String(Number(e.target.value)));
  props.onBlur?.(e);
 }}/>;
}
