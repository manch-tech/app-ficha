// ============================================================
// shared.js — Manoel Pedra - Versão GitHub + Supabase opcional
// Funciona 100% offline com localStorage, e sincroniza com Supabase se configurado
// Não quebra o app se Supabase não estiver configurado
// ============================================================

const WHATSAPP_PADRAO = "5547992069588";
const SENHA_PADRAO = "1020";
const SITE_URL = "https://manoelpedra.com.br";
const FICHA_URL = "https://manoelpedra.com.br/ficha";
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

// ========= CONFIGURAÇÃO SUPABASE (OPCIONAL) =========
// Para ativar, preencha e mude enabled para true
// Se deixar enabled=false, o app funciona só com localStorage e não quebra
const SUPABASE_CONFIG = {
  url: "", // ex: https://xxxx.supabase.co
  anonKey: "", // anon public key
  enabled: false
};

// ---------- Formatação ----------
function formatarCNPJ(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 14);
  if (n.length <= 2) return n;
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
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

// ---------- SUPABASE SYNC (NÃO QUEBRA SE FALHAR) ----------
let supabaseClient = null;
function getSupabaseClient() {
  if (!SUPABASE_CONFIG.enabled || !SUPABASE_CONFIG.url) return null;
  if (supabaseClient) return supabaseClient;
  if (!window.supabase || !window.supabase.createClient) {
    console.log("[Supabase] Aguardando lib carregar...");
    return null;
  }
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return supabaseClient;
  } catch(e) {
    console.warn("[Supabase] Falha ao criar client", e);
    return null;
  }
}

// Tenta carregar a lib automaticamente se config estiver ativa
(function autoLoadSupabase() {
  if (!SUPABASE_CONFIG.enabled || !SUPABASE_CONFIG.url) return;
  if (window.supabase) return;
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.onload = () => {
    console.log("[Supabase] Lib carregada, iniciando restore...");
    getSupabaseClient();
    restaurarDoSupabase();
  };
  document.head.appendChild(s);
})();

async function syncParaSupabase(tipo, dados) {
  if (!SUPABASE_CONFIG.enabled) return;
  const sb = getSupabaseClient();
  if (!sb) return; // ainda não carregou, ignora silencioso
  try {
    if (tipo === 'docs') {
      const { error } = await sb.from('docs').upsert(dados, { onConflict: 'id' });
      if (error) throw error;
      console.log(`[Supabase] ${tipo} sincronizado:`, dados.length);
    } else if (tipo === 'codigos') {
      const { error } = await sb.from('codigos').upsert(dados, { onConflict: 'codigo' });
      if (error) throw error;
      console.log(`[Supabase] ${tipo} sincronizado`);
    } else if (tipo === 'fichas') {
      const paraSalvar = dados.map(f => ({ protocolo: f.protocolo, dados: f }));
      const { error } = await sb.from('fichas').upsert(paraSalvar, { onConflict: 'protocolo' });
      if (error) throw error;
      console.log(`[Supabase] ${tipo} sincronizado`);
    }
  } catch (err) {
    console.warn(`[Supabase] Falha ao sincronizar ${tipo}:`, err.message);
    // NÃO dá alert, não quebra o app
  }
}

async function restaurarDoSupabase() {
  const sb = getSupabaseClient();
  if (!sb || !SUPABASE_CONFIG.enabled) return;
  try {
    const { data: docs } = await sb.from('docs').select('*');
    if (docs && docs.length > 0) {
      const localDocs = lsGet("manoel_docs_links", []);
      if (localDocs.length === 0 || localDocs.length === 1 && localDocs[0].id === "termo-gps-padrao") {
        // só restaura se local estiver vazio ou só padrão
        // não sobrescreve se já tem dados locais mais novos
      }
      // Opcional: descomente para sempre puxar do Supabase
      // lsSet("manoel_docs_links", docs);
    }
  } catch(e) {}
}

// ---------- Store (compatível com código antigo, nunca quebra) ----------
const Store = {
  getCodigos: () => lsGet("manoel_codigos_v2", []),
  setCodigos: (v) => {
    lsSet("manoel_codigos_v2", v);
    // sync em background, sem await
    setTimeout(() => syncParaSupabase("codigos", v), 100);
  },
  getFichas: () => lsGet("manoel_fichas_v2", []),
  setFichas: (v) => {
    lsSet("manoel_fichas_v2", v);
    setTimeout(() => syncParaSupabase("fichas", v), 100);
  },
  getWhats: () => {
    try { return localStorage.getItem("manoel_whats_v2") || WHATSAPP_PADRAO; } catch { return WHATSAPP_PADRAO; }
  },
  setWhats: (v) => { try { localStorage.setItem("manoel_whats_v2", v); } catch {} },
  getSenha: () => {
    try { return localStorage.getItem("manoel_admin_senha") || SENHA_PADRAO; } catch { return SENHA_PADRAO; }
  },
  setSenha: (v) => { try { localStorage.setItem("manoel_admin_senha", v); } catch {} },
  getDocs: () => {
    const docs = lsGet("manoel_docs_links", null);
    if (docs && Array.isArray(docs) && docs.length > 0) return docs;
    lsSet("manoel_docs_links", DOCS_PADRAO);
    return DOCS_PADRAO;
  },
  setDocs: (v) => {
    lsSet("manoel_docs_links", v);
    setTimeout(() => syncParaSupabase("docs", v), 100);
  },
};

// ---------- Ícones ----------
function Icon({ path, className = "h-4 w-4", viewBox = "0 0 24 24" }) {
  return React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className }, React.createElement("path", { d: path }));
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
