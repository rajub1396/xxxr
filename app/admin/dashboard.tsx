'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

type Entry={id:string;name:string;kind:string;bio:string;image:string;usage:number};
type Catalog={categories:Entry[];performers:Entry[];tags:Entry[]};
type Video={id:string;title:string;description:string;embed?:string;thumbnail:string;premium:number;category:string;categories:Entry[];performers:Entry[];tags:Entry[]};
type Member={id:string;email:string;premium:number};
type Tab='videos'|'categories'|'performers'|'tags'|'members';
async function api<T>(path:string,options?:RequestInit):Promise<T>{
  const response=await fetch(`/api/${path}`,{...options,headers:{'Content-Type':'application/json',...options?.headers}});
  const body=await response.json() as {error?:string};
  if(!response.ok)throw new Error(body.error||'Unable to complete this request.');
  return body as T;
}
function Preview({src,name}:{src:string;name:string}){return <img className="admin-video-preview" src={src||'/video-placeholder.svg'} alt={`${name} preview`} loading="lazy" referrerPolicy="no-referrer" onError={e=>{if(!e.currentTarget.src.endsWith('/video-placeholder.svg'))e.currentTarget.src='/video-placeholder.svg';}}/>;}
function Choices({label,name,entries,selected=[]}:{label:string;name:string;entries:Entry[];selected?:Entry[]}){
  return <fieldset className="admin-choices"><legend>{label}</legend>{entries.length?<div className="admin-choice-list">{entries.map(entry=><label className="admin-check" key={entry.id}><input type="checkbox" name={name} value={entry.id} defaultChecked={selected.some(item=>item.id===entry.id)}/>{entry.name}</label>)}</div>:<p className="admin-muted">Add {label.toLowerCase()} in the catalog tabs first.</p>}</fieldset>;
}
function TagChoices({entries,selected=[]}:{entries:Entry[];selected?:Entry[]}){
  const selectRef=useRef<HTMLSelectElement>(null);
  function chooseAll(checked:boolean){if(selectRef.current)for(const option of selectRef.current.options)option.selected=checked;}
  const options=[...entries].sort((a,b)=>a.name.localeCompare(b.name));
  return <fieldset className="admin-choices"><legend>Tags</legend>{options.length?<><label htmlFor="video-tag-options">Select tags ({options.length} available)</label><div className="admin-actions"><button type="button" className="admin-secondary" onClick={()=>chooseAll(true)}>Select all</button><button type="button" className="admin-secondary" onClick={()=>chooseAll(false)}>Clear selection</button></div><select ref={selectRef} id="video-tag-options" className="admin-tag-select" name="tagIds" multiple size={Math.min(8,Math.max(3,options.length))} defaultValue={selected.map(tag=>tag.id)} aria-describedby="video-tag-help">{options.map(tag=><option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><p id="video-tag-help" className="admin-muted">Select all tags or choose individual options. On a computer, hold Ctrl or Command to select multiple options. Manage names in the Tags tab.</p></>:<p className="admin-muted">Add names in the Tags tab to make them available here.</p>}</fieldset>;
}
function VideoForm({video,catalog,busy,onSave,onCancel}:{video:Video|null;catalog:Catalog;busy:boolean;onSave:(body:Record<string,unknown>)=>Promise<boolean>;onCancel:()=>void}){
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const values=new FormData(form);
    const body={title:values.get('title'),embed:values.get('embed'),thumbnail:values.get('thumbnail'),description:values.get('description'),premium:values.get('premium')==='on',categoryIds:values.getAll('categoryIds'),performerIds:values.getAll('performerIds'),tagIds:values.getAll('tagIds')};
    if(await onSave(body))form.reset();
  }
  return <section className="admin-card"><h2>{video?'Edit video':'Publish a video'}</h2><p className="admin-muted">Manage the title, player, cover image, and catalog names.</p><form key={video?.id||'new'} onSubmit={submit} className="admin-form"><fieldset className="admin-form-fields" disabled={busy}>
    <label>Title<input name="title" required maxLength={120} defaultValue={video?.title} placeholder="Video title"/></label>
    <label>Embed link or iframe<textarea name="embed" required rows={3} defaultValue={video?.embed} placeholder="HTTPS player link or iframe code"/></label>
    <label>Preview image URL<input name="thumbnail" type="url" defaultValue={video?.thumbnail?.startsWith('https://')?video.thumbnail:''} placeholder="Leave empty for automatic detection"/></label>
    <label>Description<textarea name="description" rows={3} maxLength={1000} defaultValue={video?.description}/></label>
    <Choices label="Categories" name="categoryIds" entries={catalog.categories} selected={video?.categories||catalog.categories.filter(entry=>entry.name.toLowerCase()==='general')}/>
    <Choices label="Performers" name="performerIds" entries={catalog.performers} selected={video?.performers}/>
    <TagChoices entries={catalog.tags} selected={video?.tags}/>
    <label className="admin-check"><input name="premium" type="checkbox" defaultChecked={!!video?.premium}/>Premium members only</label>
    <button className="admin-button" disabled={busy}>{busy?'Saving…':video?'Save video':'Publish video'}</button>
    {video&&<button className="admin-secondary" type="button" onClick={onCancel}>Cancel editing</button>}
  </fieldset></form></section>;
}
function CatalogManager({group,entries,busy,search,onSave,onDelete}:{group:keyof Catalog;entries:Entry[];busy:boolean;search:string;onSave:(id:string|null,body:Record<string,unknown>)=>Promise<boolean>;onDelete:(entry:Entry)=>void}){
  const [editing,setEditing]=useState<Entry|null>(null);
  const singular=group==='categories'?'category':group==='performers'?'performer':'tag';
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const data=new FormData(form);if(await onSave(editing?.id||null,{name:data.get('name'),bio:data.get('bio')||'',image:data.get('image')||''})){setEditing(null);form.reset();}}
  const shown=entries.filter(entry=>entry.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="admin-grid"><section className="admin-card"><h2>{editing?'Edit':'Add'} {singular}</h2><p className="admin-muted">Names are shared across all assigned videos.</p><form key={editing?.id||'new'} onSubmit={submit} className="admin-form"><label>Name<input name="name" required maxLength={80} defaultValue={editing?.name} placeholder={`${singular[0].toUpperCase()+singular.slice(1)} name`}/></label>
    {group==='performers'&&<><label>Profile image URL<input name="image" type="url" defaultValue={editing?.image} placeholder="https://…"/></label><label>Biography<textarea name="bio" rows={4} maxLength={1000} defaultValue={editing?.bio} placeholder="Optional performer information"/></label></>}
    <button className="admin-button" disabled={busy}>{busy?'Saving…':editing?'Save changes':`Add ${singular}`}</button>{editing&&<button className="admin-secondary" type="button" onClick={()=>setEditing(null)}>Cancel</button>}
  </form></section><section className="admin-card"><h2>{group[0].toUpperCase()+group.slice(1)} <span className="admin-muted">({entries.length})</span></h2><p className="admin-muted">Removing an entry keeps its videos in the library.</p>{shown.map(entry=><article className="admin-row" key={entry.id}>{group==='performers'&&(entry.image?<Preview src={entry.image} name={entry.name}/>:<span className="admin-avatar">{entry.name.slice(0,2).toUpperCase()}</span>)}<div><h3>{entry.name}</h3><p className="admin-muted">{entry.usage} {entry.usage===1?'video':'videos'}</p>{entry.bio&&<p className="admin-muted">{entry.bio}</p>}</div><div className="admin-actions"><button className="admin-secondary" disabled={busy} onClick={()=>setEditing(entry)}>Edit</button><button className="admin-delete" disabled={busy} onClick={()=>{if(window.confirm(`Remove “${entry.name}” from the catalog and its assigned videos? The videos will be kept.`)){onDelete(entry);if(editing?.id===entry.id)setEditing(null);}}}>Remove</button></div></article>)}{!shown.length&&<p className="admin-empty">{search?'No matching names.':`Add your first ${singular}.`}</p>}</section></div>;
}
export default function AdminDashboard({email}:{email:string}){
  const [videos,setVideos]=useState<Video[]>([]),[members,setMembers]=useState<Member[]>([]),[catalog,setCatalog]=useState<Catalog>({categories:[],performers:[],tags:[]});
  const [tab,setTab]=useState<Tab>('videos'),[editing,setEditing]=useState<Video|null>(null),[search,setSearch]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const load=useCallback(async()=>{const [v,m,c]=await Promise.all([api<Video[]>('videos'),api<Member[]>('members'),api<Catalog>('catalog')]);setVideos(v);setMembers(m);setCatalog(c);},[]);
  useEffect(()=>{load().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[load]);
  async function perform(action:()=>Promise<unknown>,message:string){setBusy(true);setError('');setNotice('');try{await action();await load();setNotice(message);return true;}catch(e){setError(e instanceof Error?e.message:'Unable to save.');return false;}finally{setBusy(false);}}
  async function edit(video:Video){setBusy(true);setError('');try{setEditing(await api<Video>(`videos/${encodeURIComponent(video.id)}`));window.scrollTo({top:0,behavior:'smooth'});}catch(e){setError(e instanceof Error?e.message:'Unable to load video.');}finally{setBusy(false);}}
  const shown=videos.filter(video=>[video.title,video.description,...video.categories.map(t=>t.name),...video.performers.map(t=>t.name),...video.tags.map(t=>t.name)].join(' ').toLowerCase().includes(search.toLowerCase()));
  return <main className="admin-shell"><div className="admin-container"><header className="admin-header"><div><a className="admin-brand" href="/">xxx<span>r</span></a><p className="admin-muted">Admin Studio</p></div><div className="admin-account"><span>{email}</span><a href="/signout-with-chatgpt?return_to=%2Fadmin-login">Sign out</a></div></header>
    <div className="admin-heading"><div><p className="admin-eyebrow">YOUR CONTROL ROOM</p><h1>Collection overview</h1><p className="admin-muted">Manage videos, categories, performer names, tags, and members.</p></div><a className="admin-secondary" href="/">View library ↗</a></div>
    <div className="admin-stats">{[['Videos',videos.length],['Categories',catalog.categories.length],['Performers',catalog.performers.length],['Members',members.length]].map(([label,count])=><section className="admin-card" key={label}><span className="admin-muted">{label}</span><strong>{loading?'—':count}</strong></section>)}</div>
    {error&&<p className="admin-error" role="alert">{error}</p>}{notice&&<p className="admin-notice" role="status">{notice}</p>}
    <nav className="admin-tabs" aria-label="Administration sections">{(['videos','categories','performers','tags','members'] as Tab[]).map(name=><button key={name} disabled={busy} aria-pressed={tab===name} onClick={()=>{setTab(name);setSearch('');setEditing(null);}}>{name[0].toUpperCase()+name.slice(1)}</button>)}</nav>
    <input className="admin-search" aria-label={`Search ${tab}`} placeholder={tab==='videos'?'Search titles, names, categories, or tags…':`Search ${tab}…`} value={search} onChange={e=>setSearch(e.target.value)}/>
    {loading?<p className="admin-muted" role="status">Loading the catalog…</p>:tab==='videos'?<div className="admin-grid"><VideoForm video={editing} catalog={catalog} busy={busy} onCancel={()=>setEditing(null)} onSave={async body=>{const saved=await perform(()=>api(editing?`videos/${encodeURIComponent(editing.id)}`:'videos',{method:editing?'PATCH':'POST',body:JSON.stringify(body)}),editing?'Video updated.':'Video published.');if(saved)setEditing(null);return saved;}}/>
      <section className="admin-card"><h2>Videos ({videos.length})</h2>{shown.map(video=><article className="admin-row" key={video.id}><Preview src={video.thumbnail} name={video.title}/><div><h3>{video.title}</h3><p className="admin-muted">{video.category} · {video.premium?'Premium':'Free'}</p>{!!video.performers.length&&<p className="admin-muted">{video.performers.map(term=>term.name).join(', ')}</p>}{!!video.tags.length&&<div className="admin-tags">{video.tags.map(term=><span key={term.id}>{term.name}</span>)}</div>}</div><div className="admin-actions"><button className="admin-secondary" disabled={busy} onClick={()=>void edit(video)}>Edit video</button><button className="admin-delete" disabled={busy} onClick={()=>{if(window.confirm(`Delete “${video.title}”? This cannot be undone.`))void perform(()=>api(`videos/${encodeURIComponent(video.id)}`,{method:'DELETE'}),'Video deleted.');}}>Delete</button></div></article>)}{!shown.length&&<p className="admin-empty">{search?'No matching videos.':'Publish your first video.'}</p>}</section></div>
    :tab==='members'?<section className="admin-card"><h2>Members</h2>{members.filter(member=>member.email.toLowerCase().includes(search.toLowerCase())).map(member=><article className="admin-row" key={member.id}><div><h3>{member.email}</h3><p className="admin-muted">{member.premium?'Premium access':'Free member'}</p></div><button className="admin-secondary" disabled={busy} onClick={()=>void perform(()=>api(`members/${encodeURIComponent(member.id)}`,{method:'PATCH',body:JSON.stringify({premium:!member.premium})}),'Membership updated.')}>{member.premium?'Revoke premium':'Grant premium'}</button></article>)}</section>
    :<CatalogManager key={tab} group={tab} entries={catalog[tab]} busy={busy} search={search} onSave={(id,body)=>perform(()=>api(id?`${tab}/${encodeURIComponent(id)}`:tab,{method:id?'PATCH':'POST',body:JSON.stringify(body)}),'Catalog saved.')} onDelete={entry=>void perform(()=>api(`${tab}/${encodeURIComponent(entry.id)}`,{method:'DELETE'}),'Catalog entry removed; videos kept.')}/>}
  </div></main>;
}
