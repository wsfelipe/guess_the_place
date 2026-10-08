import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sb } from '../lib/supabase';
import { MODES, readJSON } from '../lib/game';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// envia pro Supabase os resultados já terminados que estão salvos no navegador
async function pushLocal(user) {
  if (!sb || !user) return;
  const rows = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || '';
    const m = k.match(/^pino:state:(pais|cidade):(-?\d+)$/);
    if (!m) continue;
    const s = readJSON(k);
    if (!s || !s.done) continue;
    rows.push({ user_id: user.id, mode: MODES[m[1]].db, day: +m[2], tries: s.guesses.length, score: s.score, won: s.won });
  }
  if (rows.length) await sb.from('scores').upsert(rows, { onConflict: 'user_id,mode,day', ignoreDuplicates: true });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [dialog, setDialog] = useState(null);   // null | 'login' | 'signup'

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setUser(data.session ? data.session.user : null));
    const { data } = sb.auth.onAuthStateChange((_e, session) => setUser(session ? session.user : null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sb || !user) { setUsername(null); return; }
    let off = false;
    setDialog(null);
    (async () => {
      const { data } = await sb.from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (!off) setUsername(data ? data.username : user.email);
      await pushLocal(user);
    })();
    return () => { off = true; };
  }, [user && user.id]);

  const savePending = useCallback(() => pushLocal(user), [user]);
  const value = useMemo(() => ({
    enabled: !!sb, user, username, dialog, savePending,
    openAuth: (mode = 'login') => setDialog(mode),
    closeAuth: () => setDialog(null),
    setDialogMode: setDialog,
    signOut: () => sb && sb.auth.signOut()
  }), [user, username, dialog, savePending]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
