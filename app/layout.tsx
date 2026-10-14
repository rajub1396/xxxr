import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { metadataBase: new URL('https://www.xxxr.online'), title:'xxxr', description:'the best porn site.', applicationName:'xxxr', icons:{icon:'/favicon.svg',apple:'/watch/icons/Icon-192.png'}, manifest:'/watch/manifest.json', openGraph:{title:'xxxr',description:'the best porn site.',siteName:'xxxr',type:'website',images:[{url:'/brand-social.png',width:1200,height:630,alt:'xxxr'}]}, twitter:{card:'summary_large_image',title:'xxxr',description:'the best porn site.',images:['/brand-social.png']} };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
