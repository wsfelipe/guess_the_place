import { PINO } from './data';

export const MAX = PINO.MAX_TRIES;
export const TOP = 1000;
export const STEP = 50;
export const ZOOM = [4.5, 3.2, 2.3, 1.6, 1];   // zoom por número de palpites
export const UNLOCK = [0, 4, 6, 8];             // palpites para liberar cada foto
const EPOCH = Date.UTC(2026, 0, 1);

export const MODES = {
  pais:   { label: 'País',   db: 'country', list: PINO.countries, seed: 7 },
  cidade: { label: 'Cidade', db: 'city',    list: PINO.cities,    seed: 13 }
};

export const pointsFor = wrongGuesses => Math.max(0, TOP - STEP * wrongGuesses);

export const norm = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
export const readJSON = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
export const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage cheio ou bloqueado */ } };

/* dia e sorteio */
export function getDay() {
  const q = new URLSearchParams(location.search).get('dia');   // ?dia=12 pra testar
  if (q !== null && !isNaN(+q)) return +q;
  const d = new Date();
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 864e5);
}
export function mulberry32(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function shuffled(arr, seed) {
  const r = mulberry32(seed), a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function pickTarget(cfg, day) {
  const order = shuffled(cfg.list, cfg.seed);
  return order[((day % order.length) + order.length) % order.length];
}

/* geografia e formatação */
const rad = d => d * Math.PI / 180;
export function dist(a, b) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
export function bearing(a, b) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
export function fmtPop(n) {
  if (n >= 1e6) return (n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
  return Math.round(n / 1e3).toLocaleString('pt-BR') + ' mil';
}

/* comparação: hit = certo, near = quase, miss = errado */
export function compare(mode, g, t) {
  const cells = [];
  if (mode === 'cidade') {
    cells.push({ k: 'País', text: g.country, cls: g.cc === t.cc ? 'hit' : g.continent === t.continent ? 'near' : 'miss' });
  }
  cells.push({ k: 'Continente', text: g.continent, cls: g.continent === t.continent ? 'hit' : 'miss' });

  const nearCur = g.currency.split(' ')[0] === t.currency.split(' ')[0];   // ex.: Peso x Peso
  cells.push({ k: 'Moeda', text: g.currency, cls: g.currency === t.currency ? 'hit' : nearCur ? 'near' : 'miss' });

  const sameLang = g.langs.length === t.langs.length && g.langs.every(l => t.langs.includes(l));
  const overlap = g.langs.some(l => t.langs.includes(l));
  cells.push({ k: 'Idiomas', text: g.langs.join(', '), cls: sameLang ? 'hit' : overlap ? 'near' : 'miss' });

  const ratio = g.pop / t.pop;
  const popCls = ratio >= 0.85 && ratio <= 1.18 ? 'hit' : ratio >= 0.5 && ratio <= 2 ? 'near' : 'miss';
  cells.push({ k: 'População', text: fmtPop(g.pop), cls: popCls, arrow: popCls === 'hit' ? null : (t.pop > g.pop ? 0 : 180) });

  const km = g.id === t.id ? 0 : dist(g, t);
  cells.push({
    k: 'Distância',
    text: km === 0 ? 'Acertou' : Math.round(km).toLocaleString('pt-BR') + ' km',
    cls: km === 0 ? 'hit' : km < 1500 ? 'near' : 'miss',
    arrow: km === 0 ? null : Math.round(bearing(g, t))
  });
  return cells;
}
