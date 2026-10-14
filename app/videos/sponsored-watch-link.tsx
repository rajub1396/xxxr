'use client';
export default function SponsoredWatchLink({id}:{id:string}) {
  return <><a className="search-action" href={`/watch/index.html?video=${encodeURIComponent(id)}`} onClick={event=>{
    if(event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    try {window.open('https://apiguinee.org/4/4654f140d1b72470ff9adaacd8b2f5b8','_blank','noopener,noreferrer');} catch {/* Continue to playback when a popup is blocked. */}
  }}>Watch in the video library — 18+</a><p className="search-note">Selecting a video opens a sponsored tab.</p></>;
}
