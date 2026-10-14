'use client';
import { useState } from 'react';
export default function PerformerPhoto({name,image}:{name:string;image:string}) {
  const [failed,setFailed]=useState(false);
  return <div className="performer-photo">{image.startsWith('https://')&&!failed?<img src={image} alt={`${name} performer photo`} referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<div className="performer-photo-placeholder" role="img" aria-label={`${name}: photo unavailable`}><span aria-hidden="true">{name.slice(0,2).toUpperCase()}</span><small>Photo unavailable</small></div>}</div>;
}
