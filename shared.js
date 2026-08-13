// ============================================================
// shared.js — Manoel Pedra - GitHub + Supabase
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

// ========= CONFIGURAÇÃO SUPABASE =========
const SUPABASE_CONFIG = {
  url: "https://pirpitolwdgzildiawdr.supabase.co",
  anonKey: "sb_publishable_dVVwnbI1p4AsuqCX7MIhqw_E1QZ0y5M",
  enabled: true
};

// Inicializa cliente Supabase se habilitado
let supabaseClient = null;
function getSupabase(){
  if(!SUPABASE_CONFIG.enabled) return null;
  if(supabaseClient) return supabaseClient;
  if(window.supabase && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey){
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return supabaseClient;
  }
  return null;
}

// ========= STORAGE HÍBRIDO (localStorage + Supabase) =========
const LS_KEYS = { FICHAS: "mp_fichas", CODIGOS: "mp_codigos", DOCS: "mp_docs" };

function loadLS(key, fallback){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch{ return fallback; }
}
function saveLS(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// ---- FICHAS ----
async function getFichas(){
  const local = loadLS(LS_KEYS.FICHAS, []);
  const sb = getSupabase();
  if(!sb) return local;
  try{
    const { data, error } = await sb.from("fichas").select("*").order("created_at", {ascending:false});
    if(error) throw error;
    if(data && data.length) { saveLS(LS_KEYS.FICHAS, data); return data; }
  }catch(e){ console.warn("Supabase getFichas fallback LS", e); }
  return local;
}
async function saveFicha(ficha){
  const local = loadLS(LS_KEYS.FICHAS, []);
  const nova = { id: ficha.id || Date.now().toString(), created_at: new Date().toISOString(), ...ficha };
  local.unshift(nova);
  saveLS(LS_KEYS.FICHAS, local);
  const sb = getSupabase();
  if(sb){
    try{ await sb.from("fichas").insert([nova]); }catch(e){ console.warn("Erro salvar Supabase", e); }
  }
  return nova;
}

// ---- CODIGOS ----
async function getCodigos(){
  const local = loadLS(LS_KEYS.CODIGOS, []);
  const sb = getSupabase();
  if(!sb) return local;
  try{
    const { data } = await sb.from("codigos").select("*");
    if(data && data.length){ saveLS(LS_KEYS.CODIGOS, data); return data; }
  }catch{}
  return local;
}
async function saveCodigo(codigo){
  const local = loadLS(LS_KEYS.CODIGOS, []);
  local.push(codigo);
  saveLS(LS_KEYS.CODIGOS, local);
  const sb = getSupabase();
  if(sb){ try{ await sb.from("codigos").insert([codigo]); }catch(e){ console.warn(e); } }
}

// ---- DOCS ----
async function getDocs(){
  const local = loadLS(LS_KEYS.DOCS, DOCS_PADRAO);
  const sb = getSupabase();
  if(!sb) return local;
  try{
    const { data } = await sb.from("docs").select("*");
    if(data && data.length){ saveLS(LS_KEYS.DOCS, data); return data; }
  }catch{}
  return local;
}
