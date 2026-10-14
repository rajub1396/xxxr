import Link from 'next/link';
import { publicVideos, videoPath } from '../../lib/search-pages';
export function SearchShell({children}: {children:React.ReactNode}) {
  return <main className="search-page"><div className="search-content"><header className="search-header"><Link className="search-brand" href="/">xxxr</Link><nav className="search-links"><Link href="/browse">Browse catalog</Link><a href="/watch/index.html">Open video library</a><Link href="/login">Sign in</Link></nav></header>{children}<footer><p>xxxr — the best porn site.</p><p className="search-note">For adults aged 18 or older. Playback requires age confirmation. Premium videos require an active membership.</p></footer></div></main>;
}
export function VideoList({items}: {items:Awaited<ReturnType<typeof publicVideos>>}) {
  return <div className="search-grid">{items.map(video => <article className="search-card" key={video.id}><h2><Link href={videoPath(video.id)}>{video.title}</Link></h2><p>{video.description.slice(0,220)}</p><p className="search-note">{video.premium ? 'Premium membership' : 'Free to watch'} · {video.category}</p></article>)}</div>;
}
export function VideoPagination({page,total,path}:{page:number;total:number;path:string}) {
  const pages=Math.ceil(total/30);
  if(!total)return null;
  const href=(number:number)=>number===1?path:`${path}?page=${number}`;
  return <nav aria-label="Video pages"><p>Showing {(page-1)*30+1}–{Math.min(page*30,total)} of {total} videos</p>{pages>1&&<div className="search-links">{page>1&&<Link href={href(page-1)}>Previous</Link>}<span>Page {page} of {pages}</span>{page<pages&&<Link href={href(page+1)}>Next</Link>}</div>}</nav>;
}
