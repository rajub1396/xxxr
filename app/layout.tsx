import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'RedX 18+ Video',description:'An adults-only video collection with free browsing and premium membership.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
