import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';
import { getDay } from '../lib/game';
import { useAuth } from './AuthContext';

export default function Ranking() {
  const { username } = useAuth();
  const [scope, setScope] = useState('hoje');
  const [state, setState] = useState({ status: 'loading', rows: [] });

  useEffect(() => {
    if (!sb) return;
    let off = false;
    setState({ status: 'loading', rows: [] });
    (async () => {
      try {
        let rows;
        if (scope === 'hoje') {
          const { data, error } = await sb.from('scores').select('mode,score,profiles(username)').eq('day', getDay()).limit(1000);
          if (error) throw error;
          const by = {};
          data.forEach(r => {
            const u = r.profiles ? r.profiles.username : '?';
            by[u] = by[u] || { username: u, total: 0, games: 0 };
            by[u].total += r.score; by[u].games += 1;
          });
          rows = Object.values(by).sort((a, b) => b.total - a.total).slice(0, 50);
        } else {
          const { data, error } = await sb.from('leaderboard').select('*').order('total', { ascending: false }).limit(50);
          if (error) throw error;
          rows = data;
        }
        if (!off) setState({ status: 'ready', rows });
      } catch {
        if (!off) setState({ status: 'error', rows: [] });
      }
    })();
    return () => { off = true; };
  }, [scope]);

  let body;
  if (!sb) body = <p className="empty">Funcionalidade em breve.</p>;
  else if (state.status === 'loading') body = <p className="empty">Carregando…</p>;
  else if (state.status === 'error') body = <p className="empty">Não foi possível carregar o ranking agora.</p>;
  else if (!state.rows.length) body = <p className="empty">Ninguém pontuou ainda. Seja o primeiro.</p>;
  else body = (
    <table className="rank">
      <thead><tr><th>#</th><th>Jogador</th><th className="n">Jogos</th><th className="n">Pontos</th></tr></thead>
      <tbody>
        {state.rows.map((r, i) => (
          <tr key={r.username} className={username === r.username ? 'me' : undefined}>
            <td>{i + 1}</td>
            <td>{r.username}</td>
            <td className="n">{r.games}</td>
            <td className="n">{Number(r.total).toLocaleString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <section>
      <div className="seg" role="tablist">
        {[['hoje', 'Hoje'], ['geral', 'Geral']].map(([s, label]) => (
          <button key={s} type="button" role="tab" aria-selected={scope === s} onClick={() => setScope(s)}>{label}</button>
        ))}
      </div>
      {body}
    </section>
  );
}
