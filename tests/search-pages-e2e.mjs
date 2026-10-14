import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3100';
async function page(path,status=200){const response=await fetch(base+path,{redirect:'manual'});assert.equal(response.status,status,path);return {response,html:await response.text()};}
const redirect=await page('/',307);
assert.equal(new URL(redirect.response.headers.get('location'),base).pathname,'/watch/index.html');
const home=await page('/watch/index.html');
assert.ok(home.html.includes('flutter_bootstrap.js'),'homepage opens the original video library');
assert.match(home.html,/<meta name="rating" content="adult"/);
assert.ok(home.html.includes('<link rel="canonical" href="https://www.xxxr.online/watch/index.html"'),'library canonical points to primary HTTPS origin');
const robots=await page('/robots.txt');assert.match(robots.html,/Sitemap: https:\/\/www.xxxr.online\/sitemap.xml/);
const sitemap=await page('/sitemap.xml');assert.match(sitemap.html,/<loc>https:\/\/www.xxxr.online\/browse<\/loc>/);assert.doesNotMatch(sitemap.html,/\/admin|\/login|\/api\//);
await page('/browse');
const catalog=await (await fetch(base+'/api/catalog')).json();
for(const group of ['categories','performers','tags']) {
 const term=catalog[group].find(term=>term.usage>0);if(!term)continue;
 const path=`/browse/${group}/${encodeURIComponent(term.id)}`;
 const result=await page(path);assert.match(result.html,/<h1>/);assert.ok(sitemap.html.includes('https://www.xxxr.online'+path));
}
const videos=await(await fetch(base+'/api/videos')).json();
for(const video of videos){const path='/videos/'+encodeURIComponent(video.id);const result=await page(path);assert.ok(result.html.includes('?video='+encodeURIComponent(video.id)));assert.ok(sitemap.html.includes('https://www.xxxr.online'+path));assert.doesNotMatch(result.html,/embedframe|"embed":/);}
await page('/videos/missing-seo-test',404);await page('/browse/categories/missing-seo-test',404);
const login=await page('/admin-login');assert.equal(login.response.headers.get('x-robots-tag'),'noindex, nofollow');
console.log('PASS original video-library homepage, adult rating, canonical, sitemap, robots, catalog and video links, protected player URLs, missing-page 404s, and admin noindex.');
