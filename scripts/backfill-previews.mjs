import { getPool } from '../db/pool.mjs';
import { resolvePreview } from '../lib/video-preview.mjs';
const pool = getPool();
try {
  const result = await pool.query("SELECT id,embed FROM videos WHERE thumbnail='' ORDER BY created DESC");
  let found = 0;
  for (let offset = 0; offset < result.rows.length; offset += 4) {
    await Promise.all(result.rows.slice(offset, offset + 4).map(async video => {
      const thumbnail = await resolvePreview(video.embed);
      if (thumbnail) { await pool.query("UPDATE videos SET thumbnail=$1 WHERE id=$2 AND thumbnail=''", [thumbnail,video.id]); found++; }
    }));
    console.log(`Preview detection: ${Math.min(offset+4,result.rows.length)}/${result.rows.length} videos checked.`);
  }
  console.log(`Previews detected: ${found}. Videos requiring a custom preview: ${result.rows.length-found}.`);
} finally { await pool.end(); }
