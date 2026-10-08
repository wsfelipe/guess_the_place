import { shuffled, readJSON, writeJSON } from './game';

// nomes de arquivo que quase nunca são fotos de lugar
const BAD = /flag|bandeira|coat[_ ]of|arms|map|locator|logo|icon|symbol|seal|emblem|blank|commons-|wikt|question|edit-|ambox|portrait|signature|diagram|chart|graph|stamp|banner|montage|collage|wiki/i;
const INFO = { prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1200', iiextmetadatafilter: 'Artist|LicenseShortName' };

async function api(host, params) {
  const u = new URL(`https://${host}/w/api.php`);
  Object.entries({ format: 'json', origin: '*', ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

function toPhoto(page) {
  const ii = page.imageinfo && page.imageinfo[0];
  if (!ii || !ii.thumburl) return null;
  const ratio = ii.width / ii.height;
  if (ii.width < 900 || ii.height < 500 || ratio < 1.2 || ratio > 2.3) return null;
  const meta = ii.extmetadata || {};
  const artist = ((meta.Artist && meta.Artist.value) || '').replace(/<[^>]*>/g, '').trim();
  const lic = (meta.LicenseShortName && meta.LicenseShortName.value) || '';
  return { src: ii.thumburl, credit: [artist || 'autor desconhecido', lic, 'Wikimedia Commons'].filter(Boolean).join(' · ') };
}

async function fetchPhotos(target, seed) {
  // 1) imagens do artigo da Wikipedia (curadas por editores)
  try {
    const d = await api('en.wikipedia.org', { action: 'query', titles: target.wiki, prop: 'images', imlimit: '80', redirects: '1' });
    const page = Object.values(d.query.pages)[0];
    const files = (page.images || []).map(i => i.title).filter(t => /\.jpe?g$/i.test(t) && !BAD.test(t));
    if (files.length) {
      const cands = [files[0], ...shuffled(files.slice(1), seed)].slice(0, 14);
      const info = await api('commons.wikimedia.org', { action: 'query', titles: cands.join('|'), ...INFO });
      const pages = Object.values(info.query.pages).sort((a, b) => cands.indexOf(a.title) - cands.indexOf(b.title));
      const photos = pages.map(toPhoto).filter(Boolean).slice(0, 4);
      if (photos.length) return photos;
    }
  } catch { /* cai pro plano B */ }

  // 2) plano B: busca direta no Commons
  const q = target.country ? `${target.name} ${target.country}` : target.name;
  const d = await api('commons.wikimedia.org', { action: 'query', generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: '30', ...INFO });
  const pages = Object.values((d.query && d.query.pages) || {}).sort((a, b) => a.index - b.index);
  return pages.filter(p => /\.jpe?g$/i.test(p.title) && !BAD.test(p.title)).map(toPhoto).filter(Boolean).slice(0, 4);
}

const cacheKey = (mode, day, target) => `pino:img:${mode}:${day}:${target.id}`;

export async function loadPhotos(mode, day, target, seed, force = false) {
  const key = cacheKey(mode, day, target);
  if (force) localStorage.removeItem(key);
  const cached = readJSON(key);
  if (cached && cached.length) return cached;
  const photos = await fetchPhotos(target, seed);
  if (photos.length) writeJSON(key, photos);
  return photos;
}

export async function ptSummary(name) {
  try {
    const t = name.replace(/\s*\(.*\)/, '');
    const d = await api('pt.wikipedia.org', { action: 'query', prop: 'extracts', exintro: '1', explaintext: '1', exsentences: '3', redirects: '1', titles: t });
    return Object.values(d.query.pages)[0].extract || '';
  } catch { return ''; }
}
