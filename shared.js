
// ============================================================
// shared.js — Manoel Pedra - Original + Supabase Sync
// ============================================================

const WHATSAPP_PADRAO = "5547992069588";
const SENHA_PADRAO = "1020";
const SITE_URL = "https://manoelpedra.com.br";
const FICHA_URL = "https://manch-tech.github.io/app-ficha/";
const LOGO_URL = "https://manoelpedra.com.br/files/logo-manoel-pedra.png";

const DOCS_PADRAO = [
  {
    id: "termo-gps-padrao",
    titulo: "Termo de Declaração de Conflito - GPS",
    url: "./ficha/termo.html",
    descricao: "Baixe, preencha, assine e envie de volta via WhatsApp",
    obrigatorio: true,
  },
];

// ========= SUPABASE CONFIG =========
const SUPABASE_CONFIG = {
  url: "https://pirpitolwdgzildiawdr.supabase.co",
  anonKey: "sb_publishable_dVVwnbI1p4AsuqCX7MIhqw_E1QZ0y5M",
  enabled: true
};

let supabaseClient = null;
function getSupabase(){
  try{
    if(!SUPABASE_CONFIG.enabled) return null;
    if(supabaseClient) return supabaseClient;
    if(window.supabase && SUPABASE_CONFIG.url){
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      return supabaseClient;
    }
  }catch(e){ console.warn("Supabase init falhou", e); }
  return null;
}

// ---------- Formatação ----------
function formatarCNPJ(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 14);
  if (n.length <= 2) return n;
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
  if (n.length <= 12)
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}
function formatarTelefone(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}
function gerarCodigo() { return `MP-${Math.floor(1000 + Math.random() * 9000)}`; }
function gerarProtocolo() {
  const d = new Date();
  const pad = (v) => String(v).padStart(2, "0");
  const rnd = Math.floor(Math.random() * 90 + 10);
  return `MP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}${rnd}`;
}

// ---------- localStorage helpers ----------
function lsGet(chave, padrao) {
  try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch { return padrao; }
}
function lsSet(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch {}
}

// ---------- Supabase helpers ----------
async function sbUpsert(table, rows){
  const sb = getSupabase();
  if(!sb || !rows || !rows.length) return;
  try{ await sb.from(table).upsert(rows, { onConflict: 'id' }); }catch(e){ console.warn("Supabase upsert erro", table, e); }
}
async function sbDelete(table, id){
  const sb = getSupabase();
  if(!sb) return;
  try{ await sb.from(table).delete().eq('id', id); }catch(e){ console.warn("Supabase delete erro", e); }
}
async function sbFetchAll(table){
  const sb = getSupabase();
  if(!sb) return null;
  try{
    const { data, error } = await sb.from(table).select('*').order('created_at', {ascending:false}).limit(1000);
    if(error) throw error;
    return data;
  }catch(e){ console.warn("Supabase fetch erro", table, e); return null; }
}

const Store = {
  getCodigos: () => lsGet("manoel_codigos_v2", []),
  setCodigos: (v) => {
    lsSet("manoel_codigos_v2", v);
    // sync supabase async
    const rows = v.map(c=>({ id: c.codigo, codigo: c.codigo, payload: c, created_at: c.data || new Date().toISOString() }));
    sbUpsert("codigos", rows);
    // se limpar tudo, deleta no supabase também? mantém por segurança, não deleta em massa
  },
  // para deletar um código específico
  deleteCodigo: (codigo) => {
    const atual = Store.getCodigos().filter(x=>x.codigo!==codigo);
    lsSet("manoel_codigos_v2", atual);
    sbDelete("codigos", codigo);
    return atual;
  },

  getFichas: () => lsGet("manoel_fichas_v2", []),
  setFichas: (v) => {
    lsSet("manoel_fichas_v2", v);
    const rows = v.map(f=>({ id: f.protocolo, protocolo: f.protocolo, payload: f, created_at: f.dataISO || new Date().toISOString() }));
    sbUpsert("fichas", rows);
  },

  getWhats: () => {
    try { return localStorage.getItem("manoel_whats_v2") || WHATSAPP_PADRAO; } catch { return WHATSAPP_PADRAO; }
  },
  setWhats: (v) => { try{ localStorage.setItem("manoel_whats_v2", v);}catch{} },

  getSenha: () => {
    try { return localStorage.getItem("manoel_admin_senha") || SENHA_PADRAO; } catch { return SENHA_PADRAO; }
  },
  setSenha: (v) => { try{ localStorage.setItem("manoel_admin_senha", v);}catch{} },

  getDocs: () => {
    const docs = lsGet("manoel_docs_links", null);
    if (docs && Array.isArray(docs) && docs.length > 0) return docs;
    lsSet("manoel_docs_links", DOCS_PADRAO);
    return DOCS_PADRAO;
  },
  setDocs: (v) => {
    lsSet("manoel_docs_links", v);
    const rows = v.map(d=>({ id: d.id, titulo: d.titulo, url: d.url, descricao: d.descricao||"", obrigatorio: !!d.obrigatorio, payload: d, created_at: new Date().toISOString() }));
    sbUpsert("docs", rows);
  },

  // Sincroniza do Supabase para localStorage (chamado no load)
  syncFromSupabase: async () => {
    const sb = getSupabase();
    if(!sb) return;
    // codigos
    const codigos = await sbFetchAll("codigos");
    if(codigos && codigos.length){
      const lista = codigos.map(r=> r.payload || { codigo: r.codigo || r.id, data: r.created_at, status: "disponivel" }).filter(Boolean);
      if(lista.length) lsSet("manoel_codigos_v2", lista);
    }
    // fichas
    const fichas = await sbFetchAll("fichas");
    if(fichas && fichas.length){
      const lista = fichas.map(r=> r.payload).filter(Boolean);
      if(lista.length) lsSet("manoel_fichas_v2", lista);
    }
    // docs
    const docs = await sbFetchAll("docs");
    if(docs && docs.length){
      const lista = docs.map(r=> r.payload || { id: r.id, titulo: r.titulo, url: r.url, descricao: r.descricao, obrigatorio: r.obrigatorio }).filter(Boolean);
      if(lista.length) lsSet("manoel_docs_links", lista);
    }
    window.dispatchEvent(new Event("mp_sync"));
  }
};

// tenta sync ao carregar (não bloqueia UI)
setTimeout(()=>{ Store.syncFromSupabase(); }, 800);

// ---------- Ícones ----------
function Icon({ path, className = "h-4 w-4", viewBox = "0 0 24 24" }) {
  return React.createElement("svg",{ xmlns:"http://www.w3.org/2000/svg", viewBox, fill:"none", stroke:"currentColor", strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round", className }, React.createElement("path",{d:path}));
}
const ICONS = {
  lock: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",
  building: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2 M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",
  check: "M20 6 9 17l-5-5",
  external: "M15 3h6v6 M10 14 21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  copy: "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  message: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  fileText: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z M14 2v4a2 2 0 0 0 2 2h4 M10 9H8 M16 13H8 M16 17H8",
  alert: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3 M12 9v4 M12 17h.01",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  key: "M15.5 7.5a5 5 0 1 0-7.07 7.07L2 21l3 1 1-3 2 2 1.43-1.43",
  trash: "M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",
  pencil: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16 M21 21l-4.3-4.3",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  paperclip: "M13.23 20.25 21 12.3 M16 6l-8.41 8.59a2 2 0 0 0 2.83 2.83l8.41-8.59a4 4 0 0 0-5.66-5.66l-8.41 8.58a6 6 0 1 0 8.49 8.49",
};
