import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// null quando não configurado: o jogo roda sem login/ranking
export const sb = url && key ? createClient(url, key) : null;
