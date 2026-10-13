import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPreview, previewUrl, publicIpv4, resolvePreview } from '../lib/video-preview.mjs';
test('YouTube previews resolve without exposing a player URL', async () => {
  assert.equal(await resolvePreview('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
});
test('explicit preview images take precedence', async () => {
  assert.equal(await resolvePreview('https://example.com/embed/123', 'https://images.example.com/cover.jpg'), 'https://images.example.com/cover.jpg');
});
test('metadata extraction supports reversed attributes, relative URLs, video posters and structured thumbnails', () => {
  assert.equal(extractPreview('<meta content="/cover.jpg?a=1&amp;b=2" property="og:image">', 'https://example.com/embed/1'), 'https://example.com/cover.jpg?a=1&b=2');
  assert.equal(extractPreview('<video poster="/poster.jpg">', 'https://example.com/embed/1'), 'https://example.com/poster.jpg');
  assert.equal(extractPreview('{"thumbnailUrl":"https://cdn.example.com/cover.jpg"}', 'https://example.com/embed/1'), 'https://cdn.example.com/cover.jpg');
  assert.equal(extractPreview('<meta property="og:image" content="http://localhost/test">', 'https://example.com/embed/1'), '');
  assert.equal(extractPreview("player.setThumbUrl('https://cdn.example.com/preview.jpg');", 'https://example.com/embed/1'), 'https://cdn.example.com/preview.jpg');
});
test('private and special network addresses are rejected before metadata requests', () => {
  for (const ip of ['127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.1','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1']) assert.equal(publicIpv4(ip), false);
  assert.equal(publicIpv4('8.8.8.8'), true);
  for (const value of ['http://example.com/a.jpg','https://127.0.0.1/a.jpg','https://[::1]/a.jpg','https://internal.local/a.jpg','https://user:pass@example.com/a.jpg']) assert.throws(() => previewUrl(value));
});
