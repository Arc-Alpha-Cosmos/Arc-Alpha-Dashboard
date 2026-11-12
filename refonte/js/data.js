/* ARC ALPHA - Acces aux donnees : Supabase, authentification, synchronisation. Ce fichier reste tel quel. */
const ROLE_BADGES={admin:"⚙ ADMIN",amiraute:"★ AMIRAUTÉ",brs:"◉ BRS",member:"● MEMBRE"};
const ROLE_COLORS={admin:"var(--or)",amiraute:"var(--ye)",brs:"#7c5cff",member:"var(--ac)"};
const ROLE_LABELS={admin:"Admin",amiraute:"Amirauté",brs:"BRS",member:"Membre ARC"};
const SUPA_URL="https://vejxnhmrrckpczjsdclx.supabase.co";
const SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlanhuaG1ycmNrcGN6anNkY2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NDI5NDcsImV4cCI6MjA5NzIxODk0N30.btczeuZJDL3o8Z8GEQ-t6DZG2BSMn0gsUFJAf34ech4";
const T={config:"arc_config",members:"arc_members",users:"arc_users",blames:"arc_blames",
  missions:"arc_missions",announce:"arc_annonces",activity:"arc_activity",
  absences:"arc_absences",reports:"arc_reports",cmdmissions:"arc_cmd_missions",documents:"arc_documents",tasks:"arc_tasks",polls:"arc_polls",pollvotes:"arc_poll_votes",formations:"arc_formations",activites:"arc_activites",tickets:"arc_tickets",messages:"arc_messages",rapports:"arc_rapports",
  missionLib:"arc_mission_lib",missionRot:"arc_mission_rot"};

const GRADE_ORDER=["CMDM","CMD","VCMD","MAJ","CPT","LT","SGT","ARC"];
const GRADE_COLORS={CMDM:"#fff",CMD:"#cfd6e2",VCMD:"#ffd23d",MAJ:"#ff8a3d",CPT:"#ff3b5c",LT:"#6f9bff",SGT:"#22d97a",ARC:"#00e5ff"};
const REGIMENT_COLORS={"501st":"#3399ff","212th":"#ff8800","327th":"#ffcc00","41st":"#22cc55","104th":"#aaaaaa","408th":"#9933ff","65th":"#ff4444"};
const FORMATION_COLORS={alpha:"var(--ac)",trooper:"var(--gr)",cmd:"var(--or)",bleu:"#6f9bff",nego:"var(--ye)"};
const MEDALS=[
  {id:"croix_honneur",   name:"Croix d'Honneur de la B.O.S", icon:"✠", color:"#f5f0e1", scope:"B.O.S",       desc:"Plus haute distinction de la Brigade des Opérations Spéciales, décernée aux unités ayant prouvé être l'élite de l'élite (nécessite les trois autres médailles B.O.S)."},
  {id:"insigne_direction",name:"Insigne de la Direction B.O.S",icon:"★", color:"#e8b923", scope:"Direction", desc:"Attribuée à ceux ayant porté le titre honorifique de Direction B.O.S. Témoigne de leur leadership. (Direction B.O.S uniquement)"},
  {id:"securite_int",    name:"Médaille de la Sécurité Intérieure",icon:"🔍",color:"#7c5cff",scope:"B.R.S",    desc:"Récompense les agents ayant participé à de multiples opérations (enquêtes résolues, renseignements cruciaux pour le Sénat). (B.R.S uniquement)"},
  {id:"croix_guerre_rc", name:"Croix de Guerre du Commando", icon:"⚔",  color:"#ff3b5c", scope:"RC",         desc:"Plus haute distinction pour un Commando Républicain ayant servi avec honneur et panache durant la Grande Guerre. (RC uniquement)"},
  {id:"dix_muunilinst",  name:"L'Ordre des Dix de Muunilinst",icon:"🛡",color:"#00e5ff", scope:"ARC Alpha",  desc:"Honore les 10 ARC Troopers ayant accompagné Fordo à la bataille de Muunilinst. Symbole de bravoure face à un ennemi puissant. (ARC Alpha uniquement)"},
  {id:"renseignement",   name:"Médaille du Renseignement",   icon:"📡", color:"#6f9bff", scope:"B.O.S",       desc:"Décernée aux unités ayant fourni un renseignement capable de faire pencher le cours de la guerre ou ayant fortement aidé la G.A.R."},
  {id:"agent_terrain",   name:"Médaille de l'Agent de Terrain",icon:"🎯",color:"#22d97a", scope:"B.O.S",       desc:"Décernée aux unités qui s'impliquent dans de nombreuses missions et les réussissent à la perfection."},
  {id:"veteran_fs",      name:"Médaille du Vétéran des Forces Spéciales",icon:"⏳",color:"#ff8a3d",scope:"B.O.S",desc:"Décernée aux unités effectuant des missions pour la B.O.S depuis plus de 4 mois."},
];
const MEDAL_BY_ID=Object.fromEntries(MEDALS.map(m=>[m.id,m]));
function getMemberMedals(m){
  if(!m||!m.medals)return[];
  try{const a=typeof m.medals==="string"?JSON.parse(m.medals):m.medals;return Array.isArray(a)?a:[];}catch{return[];}
}
function canAwardMedals(){
  if(!Auth.ok())return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  if(session.role==="brs")return false;
  return gradeLevel(getSessionGrade())>=4;
}


function cyrb53(s){
  let h1=0xdeadbeef,h2=0x41c6ce57;
  for(let i=0,ch;i<s.length;i++){
    ch=s.charCodeAt(i);
    h1=Math.imul(h1^ch,2654435761);
    h2=Math.imul(h2^ch,1597334677);
  }
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return(4294967296*(2097151&h2)+(h1>>>0)).toString(16);
}


const DBG_MAX=40;
const _dbgLog=[];
function dbgStr(v){
  if(v===null||v===undefined)return String(v);
  if(typeof v==="string")return v;
  if(v instanceof Error)return v.message||String(v);
  try{return JSON.stringify(v);}catch(e){return String(v);}
}
function dbgPush(kind,msg,where){
  try{
    _dbgLog.push({t:Date.now(),kind,msg:dbgStr(msg).slice(0,300),where:String(where||"").slice(0,160)});
    if(_dbgLog.length>DBG_MAX)_dbgLog.shift();
  }catch(e){}
}
window.addEventListener("error",e=>dbgPush("erreur",e.message,`${e.filename||""}:${e.lineno||0}`));
window.addEventListener("unhandledrejection",e=>dbgPush("promesse",(e.reason&&e.reason.message)||e.reason,""));
(function(){
  const ow=console.warn,oe=console.error;
  console.warn=function(){dbgPush("alerte",Array.from(arguments).map(dbgStr).join(" "),"");ow.apply(console,arguments);};
  console.error=function(){dbgPush("erreur",Array.from(arguments).map(dbgStr).join(" "),"");oe.apply(console,arguments);};
})();

const sh=()=>({apikey:SUPA_KEY,Authorization:"Bearer "+SUPA_KEY,"Content-Type":"application/json",Prefer:"return=representation"});
let _netOkAt=0,_netFailAt=0;
async function supaGet(table,filter=""){
  try{
    const sep=filter?"&":"";
    const url=`${SUPA_URL}/rest/v1/${table}?${filter}${sep}order=created_at.desc`;
    const r=await fetch(url,{headers:sh()});
    _netOkAt=Date.now();
    if(!r.ok){
      console.warn("supaGet error",table,r.status,await r.text());
      return null;
    }
    const data=await r.json();
    return Array.isArray(data)?data:null;
  }catch(e){
    _netFailAt=Date.now();
    console.warn("supaGet exception",table,e);
    return null;
  }
}
/* ------------------------------------------------------------------
   Portier d'écriture. Quand la base est verrouillée (securite.sql),
   plus aucune écriture directe n'est acceptée : tout passe par la
   fonction SQL arc_write, qui revérifie EN BASE qui écrit, dans quelle
   table et quoi. Tant que la fonction n'existe pas, on écrit en direct
   comme avant (le site marche identiquement avant et après).
   Les messages privés ont leurs propres fonctions, ils ne passent
   jamais par le portier. ------------------------------------------- */
let _gwOn=null; // null inconnu, true installé, false absent
function gwFilterToMatch(filter){
  const out={};
  const parts=String(filter||"").split("&").filter(Boolean);
  for(const p of parts){
    const m=p.match(/^([^=]+)=eq\.(.*)$/);
    if(!m)return null;               // filtre non géré par le portier
    try{out[decodeURIComponent(m[1])]=decodeURIComponent(m[2]);}catch(e){out[m[1]]=m[2];}
  }
  return out;
}
async function gwTry(op,table,data,match){
  if(_gwOn===false)return{done:false};
  if(table===T.messages||table===T.rapports)return{done:false};
  const pr=(typeof Auth!=="undefined"&&Auth.proof)?Auth.proof():null;
  if(!pr)return{done:false};         // visiteur non connecté : voie publique directe
  if((op==="update"||op==="delete")&&match===null)return{done:false};
  const r=await supaRpc("arc_write",{p_auth_hash:pr.uh,p_auth_pass:pr.ph,
    p_table:table,p_op:op,p_data:data||{},p_match:match||{}});
  if(r.missing){_gwOn=false;return{done:false};}
  _gwOn=true;
  if(r.ok)return{done:true,ok:true,data:r.data};
  return{done:true,ok:false,data:null};
}
async function supaPost(table,body){
  if(!writeAllowed(table))return null;
  const g=await gwTry("insert",table,body,null);
  if(g.done){
    if(!g.ok)return null;
    const row=(g.data&&typeof g.data==="object"&&g.data.id!==undefined)?g.data:{...body,id:Date.now()};
    return [row];
  }
  try{
    const r=await fetch(`${SUPA_URL}/rest/v1/${table}`,{method:"POST",headers:sh(),body:JSON.stringify(body)});
    if(!r.ok){
      const txt=await r.text();
      console.warn("supaPost error",table,r.status,txt);
      return null;
    }
    const txt=await r.text();
    if(!txt||txt==="null"||txt==="[]")return [{...body,id:Date.now()}];
    try{return JSON.parse(txt);}catch{return [{...body,id:Date.now()}];}
  }catch(e){console.warn("supaPost exception",e);return null;}
}
async function supaPatch(table,filter,body){
  if(!writeAllowed(table))return null;
  const g=await gwTry("update",table,body,gwFilterToMatch(filter));
  if(g.done)return g.ok?true:null;
  try{
    const r=await fetch(`${SUPA_URL}/rest/v1/${table}?${filter}`,{method:"PATCH",headers:sh(),body:JSON.stringify(body)});
    if(!r.ok){
      const txt=await r.text();
      console.warn("supaPatch error",table,filter,r.status,txt);
      return null;
    }
    const txt=await r.text();
    if(!txt)return true;
    try{return JSON.parse(txt);}catch{return true;}
  }catch(e){console.warn("supaPatch exception",table,e);return null;}
}
async function supaDelete(table,filter){
  if(!writeAllowed(table))return false;
  const g=await gwTry("delete",table,null,gwFilterToMatch(filter));
  if(g.done)return !!g.ok;
  try{const r=await fetch(`${SUPA_URL}/rest/v1/${table}?${filter}`,{method:"DELETE",headers:sh()});return r.ok;}catch{return false;}
}
function cfgStr(v){
  if(v==null) return "";
  if(typeof v!=="string") return String(v);
  try{ const p=JSON.parse(v); return typeof p==="string"?p:v; }catch(e){ return v; }
}
async function setConfig(key,value){
  const strVal = typeof value==="string" ? value : JSON.stringify(value);
  const existing=await supaGet(T.config,`key=eq.${key}`);
  if(existing&&existing.length>0)await supaPatch(T.config,`key=eq.${key}`,{value:strVal});
  else await supaPost(T.config,{key,value:strVal});
}

function clearLegacyAssistant(){
  try{["arcClaudeVault","arcClaudeKey","arcClaudeLock","arcClaudeChats"].forEach(k=>localStorage.removeItem(k));}catch(e){}
}

/* ============================================================
   AUTHENTIFICATION VÉRIFIÉE CÔTÉ BASE
   ------------------------------------------------------------
   Le localStorage n'est plus une source d'autorité. Il ne garde que
   deux empreintes (identifiant + mot de passe) qui servent de jeton :
   le rôle, le grade et le nom affiché sont TOUJOURS relus dans
   arc_users, au démarrage puis pendant la synchronisation.

   Une session fabriquée à la main dans la console n'est donc jamais
   « bénie » : Auth.ok() compare l'objet session courant à une
   référence privée validée par la base, et toutes les fonctions de
   permission comme toutes les écritures exigent Auth.ok().
   ============================================================ */

/* Appel d'une fonction SQL. Renvoie {missing:true} si la fonction n'est
   pas encore installée en base, ce qui laisse le site fonctionner avant
   l'exécution du script SQL. */
async function supaRpc(fn,args){
  try{
    const r=await fetch(`${SUPA_URL}/rest/v1/rpc/${fn}`,{method:"POST",headers:sh(),body:JSON.stringify(args||{})});
    const txt=await r.text();
    if(r.status===404||/PGRST202|Could not find the function/i.test(txt))return{missing:true};
    if(!r.ok){console.warn("rpc "+fn,r.status,txt);return{failed:true,status:r.status};}
    let d=null;try{d=txt?JSON.parse(txt):null;}catch(e){}
    return{ok:true,data:d};
  }catch(e){console.warn("rpc "+fn,e);return{failed:true};}
}

/* Tables qu'un visiteur non connecté a le droit d'alimenter :
   la demande de récupération de mot de passe et sa trace. */
const PUBLIC_WRITE=[T.tickets,T.activity];
function writeAllowed(table){
  if(Auth.ok())return true;
  if(PUBLIC_WRITE.indexOf(table)!==-1)return true;
  console.warn("écriture refusée : session non vérifiée",table);
  return false;
}

let _loginFails=0,_loginWait=0;

const Auth=(function(){
  const LS="arcSession";
  let blessed=null;   // objet session validé par la base (référence privée)
  let cred=null;      // {uh,ph} : empreintes servant de jeton
  let row=null;      // dernière ligne arc_users connue
  let verified=false; // vrai seulement après un contrôle réussi des identifiants

  function readStored(){
    try{
      const s=JSON.parse(localStorage.getItem(LS)||"null");
      if(s&&typeof s==="object"&&s.userHash&&s.passHash)
        return{uh:String(s.userHash),ph:String(s.passHash)};
    }catch(e){}
    return null;
  }
  function writeStored(){
    try{
      if(cred)localStorage.setItem(LS,JSON.stringify({userHash:cred.uh,passHash:cred.ph}));
      else localStorage.removeItem(LS);
    }catch(e){}
  }

  /* Lecture du compte, avec trois issues bien distinctes :
       une ligne  : identifiants valides
       null       : identifiants refusés
       undefined  : impossible de trancher (réseau), on ne déconnecte pas */
  async function lookup(ident,uh,ph){
    const r=await supaRpc("arc_login",{p_ident:ident||null,p_user_hash:uh||null,p_pass_hash:String(ph)});
    if(r.ok){
      const d=Array.isArray(r.data)?(r.data[0]||null):(r.data||null);
      return d||null;
    }
    if(r.failed)return undefined;
    /* Repli tant que la fonction SQL n'est pas installée : comparaison
       côté client, qui suppose pass_hash lisible par la clé anon. */
    const filter=(ident&&uh)
      ?`or=(user_hash.eq.${encodeURIComponent(uh)},display.eq.${encodeURIComponent(ident)})`
      :`user_hash=eq.${encodeURIComponent(uh)}`;
    const rows=await supaGet(T.users,filter);
    if(rows===null)return undefined;
    return rows.find(x=>String(x.pass_hash)===String(ph))||null;
  }

  function gradeOf(r){
    const list=state.members||[];
    const mid=(r.member_id===undefined||r.member_id===null)?"":String(r.member_id);
    let m=mid?list.find(x=>String(x.id)===mid):null;
    if(!m)m=list.find(x=>(x.user_hash&&x.user_hash===r.user_hash)||(x.linked_user&&x.linked_user===r.user_hash));
    return (m&&m.grade)?m.grade:(r.grade||"");
  }

  /* Construit la session à partir de la ligne de base, puis la verrouille :
     « session.role = "admin" » dans la console n'a plus d'effet. */
  function bless(r){
    row=r;
    const s={
      user:r.display||"",
      role:r.role||"member",
      userId:(r.id===undefined||r.id===null)?null:r.id,
      userHash:r.user_hash||(cred?cred.uh:""),
      memberId:(r.member_id===undefined||r.member_id===null)?null:r.member_id,
      grade:gradeOf(r)
    };
    ["user","role","userId","userHash","memberId","grade"].forEach(k=>{
      try{Object.defineProperty(s,k,{value:s[k],writable:false,configurable:false,enumerable:true});}catch(e){}
    });
    try{Object.freeze(s);}catch(e){}
    blessed=s;session=s;
    return s;
  }
  function stamp(){ return blessed?(blessed.role+"|"+blessed.grade+"|"+blessed.user+"|"+blessed.memberId):""; }
  function reseal(){ const b=stamp(); if(!row)return false; bless(row); return stamp()!==b; }

  function destroy(){ blessed=null;cred=null;row=null;verified=false;session=null;writeStored(); }
  function ok(){ return blessed!==null&&session===blessed; }

  /* Contrôle synchrone, sans requête : remet la session bénie en place si
     quelque chose l'a remplacée, et efface toute session inventée alors
     qu'aucun identifiant n'a été présenté. */
  function integrity(){
    if(!cred||!verified){
      if(session!==null){
        session=null;blessed=null;
        console.warn("session non authentifiée écartée");
        try{updateNavUI();nav("home");}catch(e){}
      }
      return;
    }
    if(!ok()){
      console.warn("session altérée, rétablissement");
      reseal();
      try{updateNavUI();renderNav();applyPermissionsUI();}catch(e){}
    }
  }

  async function restore(){
    cred=readStored();
    if(!cred){destroy();return false;}
    const r=await lookup(null,cred.uh,cred.ph);
    if(r===undefined){blessed=null;session=null;return false;} // le chien de garde réessaiera
    if(!r){destroy();try{updateNavUI();}catch(e){}return false;}
    cred.uh=r.user_hash||cred.uh;writeStored();verified=true;
    bless(r);try{updateNavUI();}catch(e){}
    return true;
  }

  async function login(ident,uh,ph){
    const r=await lookup(ident,uh,ph);
    if(r===undefined)return{err:"net"};
    if(!r)return{err:"bad"};
    cred={uh:r.user_hash||uh,ph:String(ph)};writeStored();verified=true;
    bless(r);
    return{ok:true,row:r};
  }

  /* Chien de garde, en deux niveaux.
     1. contrôle immédiat sur arc_users déjà synchronisé : compte supprimé,
        rôle changé, grade changé, session remplacée dans la console ;
     2. revérification complète des identifiants contre la base, au plus
        une fois toutes les cinq minutes, pour détecter un mot de passe
        changé ou réinitialisé ailleurs. */
  let lastDeep=0;
  async function watch(){
    if(!cred)return;
    const list=verified?(state.users||[]):[];
    if(list.length){
      const r=list.find(x=>x.user_hash===cred.uh)||null;
      if(!r){
        destroy();
        try{updateNavUI();renderDashboard();nav("home");toast("Ton compte n'existe plus, session fermée","error");}catch(e){}
        return;
      }
      row=Object.assign({},r);
      if(reseal()){try{updateNavUI();renderNav();applyPermissionsUI();}catch(e){}}
    }
    if(verified&&Date.now()-lastDeep<300000)return;
    lastDeep=Date.now();
    const deep=await lookup(null,cred.uh,cred.ph);
    if(deep===undefined)return;
    if(!deep){
      destroy();
      try{updateNavUI();renderDashboard();nav("home");toast("Session expirée, reconnecte-toi","error");}catch(e){}
      return;
    }
    row=deep;verified=true;
    if(reseal()){try{updateNavUI();renderNav();applyPermissionsUI();}catch(e){}}
  }

  function syncGrade(){
    if(!row)return false;
    const changed=reseal();
    if(changed){try{updateNavUI();renderNav();applyPermissionsUI();}catch(e){}}
    return changed;
  }

  function setPass(ph){ if(cred){cred.ph=String(ph);writeStored();} }
  function setRow(patch){ if(row){Object.assign(row,patch||{});if(reseal()){try{updateNavUI();}catch(e){}}} }
  /* La preuve (les deux empreintes) sert aux fonctions SQL qui vérifient
     en base le droit de l'appelant, par exemple le changement de rôle. */
  function proof(){ return cred?{uh:cred.uh,ph:cred.ph}:null; }
  function account(){ return row?{id:row.id,user_hash:row.user_hash,display:row.display,role:row.role,member_id:row.member_id,grade:row.grade}:null; }

  /* gelé : on ne remplace pas une fonction de ce module depuis la console. */
  return Object.freeze({restore,login,watch,integrity,ok,destroy,syncGrade,setPass,setRow,account,proof});
})();

/* Pose le rôle d'un compte par la fonction SQL arc_set_role, qui vérifie en
   base que l'appelant détient bien un compte administrateur. La colonne role
   n'est pas modifiable directement par la clé publique une fois le script SQL
   appliqué. Renvoie "ok", "absent" (fonction pas encore installée) ou "refus". */
async function setRoleServerSide(id,role){
  const pr=Auth.proof();
  if(!pr)return "refus";
  const r=await supaRpc("arc_set_role",{p_auth_hash:pr.uh,p_auth_pass:pr.ph,
                                        p_target_id:String(id),p_role:String(role)});
  if(r.missing)return "absent";
  return (r.ok&&r.data)?"ok":"refus";
}


const SYNC_TABLES=[
  {key:"members",     table:T.members,     into:"members"},
  {key:"blames",      table:T.blames,      into:"blames"},
  {key:"announces",   table:T.announce,    into:"announces"},
  {key:"activity",    table:T.activity,    into:"activity", filter:"limit=200&order=created_at.desc"},
  {key:"absences",    table:T.absences,    into:"absences"},
  {key:"reports",     table:T.reports,     into:"reports"},
  {key:"cmdmissions", table:T.cmdmissions, into:"cmdmissions"},
  {key:"documents",   table:T.documents,   into:"documents"},
  {key:"tasks",       table:T.tasks,       into:"tasks"},
  {key:"polls",       table:T.polls,       into:"polls"},
  {key:"pollvotes",   table:T.pollvotes,   into:"pollVotes"},
  {key:"formations",  table:T.formations,  into:"formations"},
  {key:"activites",   table:T.activites,   into:"activites"},
  {key:"tickets",     table:T.tickets,     into:"tickets"},
  {key:"rapports",    table:T.rapports,    into:"rapports"},
  {key:"missionlib",  table:T.missionLib,  into:"missionLib"},
  {key:"missionrot",  table:T.missionRot,  into:"missionRot", filter:"limit=60&order=week_key.desc"},
  {key:"users",       table:T.users,       into:"users"},
];

async function fetchSyncTables(){
  const res=await Promise.all(SYNC_TABLES.map(d=>supaGet(d.table,d.filter||"")));
  const changed=new Set();
  SYNC_TABLES.forEach((d,i)=>{
    let rows=res[i];
    if(rows===null)return;
    /* Les empreintes de mot de passe ne sont jamais conservées en mémoire
       côté navigateur : il n'y a rien à lire dans la console. */
    if(d.key==="users")rows=rows.map(u=>{const c=Object.assign({},u);delete c.pass_hash;return c;});
    const sig=tableSig(rows);
    if(_sig[d.key]!==sig){_sig[d.key]=sig;changed.add(d.key);}
    state[d.into]=rows;
  });
  return {changed,allFailed:res.every(r=>r===null)};
}

async function loadAll(){
  const [cfg]=await Promise.all([supaGet(T.config),fetchSyncTables()]);
  if(cfg)cfg.forEach(row=>{try{
    if(row.key==="recOpen")    state.recOpen    =JSON.parse(row.value);
    if(row.key==="maintenance")state.maintenance=JSON.parse(row.value);
    if(row.key==="autoReport") state.autoReport =JSON.parse(row.value);
    if(row.key==="effectifCible"){
      const _ec=parseInt(cfgStr(row.value),10);
      if(_ec>0&&_ec<=999)state.effectifCible=_ec;
    }
    if(row.key==="autoReportSince") state.autoReportSince=cfgStr(row.value);
    if(row.key==="reportExempt"){
      const parsed=JSON.parse(row.value);
      state.reportExempt=(parsed&&typeof parsed==="object")?parsed:{};
    }
    if(row.key==="reportWeeks"){
      const parsed=JSON.parse(row.value);
      state.reportWeeks=(parsed&&typeof parsed==="object")?parsed:{};
    }
    if(row.key==="manualTests"){
      const parsed=JSON.parse(row.value);
      state.manualTests=(parsed&&typeof parsed==="object")?parsed:{};
    }
    if(row.key==="discordAnnonces") state.discord.annonces=cfgStr(row.value);
    if(row.key==="discordPromo")    state.discord.promo   =cfgStr(row.value);
    if(row.key==="discordFormations")state.discord.formations=cfgStr(row.value);
    if(row.key==="discordRecrutTrooper")state.discord.recrutTrooper=cfgStr(row.value);
    if(row.key==="discordRecrutAlpha")  state.discord.recrutAlpha  =cfgStr(row.value);
    if(row.key==="discordRecrutRoles")  state.discord.recrutRoles  =cfgStr(row.value);
    if(row.key==="discordRapports")     state.discord.rapports     =cfgStr(row.value);
    if(row.key==="discordStyle")    state.discord.style   =cfgStr(row.value)||"detaille";
    if(row.key==="discordBotName")  state.discord.botName =cfgStr(row.value);
    if(row.key==="discordBotAvatar")state.discord.botAvatar=cfgStr(row.value);
    if(row.key==="content"){
      const parsed=JSON.parse(row.value);
      state.content=typeof parsed==="string"?JSON.parse(parsed):parsed;
    }
    if(row.key==="regiments"){
      const rg=JSON.parse(row.value);
      if(Array.isArray(rg)&&rg.length)state.regiments=rg;
    }
    if(row.key==="reglement"){
      state.reglement=row.value;
    }
  }catch(e){console.warn("config: clé illisible",row.key,e);};});
  renderContent();
}

function saveLS(){
  try{ localStorage.setItem("arcState",JSON.stringify(state)); }
  catch(e){ console.warn("localStorage indisponible",e); }
}


async function logActivity(text){
  const obj={text,created_at:new Date().toISOString()};
  if(supaOK)await supaPost(T.activity,obj);
  state.activity.unshift(obj);if(state.activity.length>200)state.activity.pop();
  if(!supaOK)saveLS();
}

/* Rythme revu (2026-11) : 8 s en activite, 30 s au repos, 60 s en panne.
   La table arc_missions, morte cote interface, n'est plus relue. */
const POLL_BASE=8000, POLL_MAX=60000, POLL_IDLE_MAX=30000;
/* Quand rien ne change, on espace les interrogations au lieu de demander
   dix-huit tables toutes les cinq secondes pour rien. Le moindre changement,
   le moindre geste, ou le retour sur l'onglet remet le rythme normal. */
let _pollQuiet=true;
let _pollDelay=POLL_BASE, _pollTimer=null, _pollBusy=false, _sig={}, _lastSync=0;

function tableSig(rows){
  if(!rows) return "∅";
  try{ return rows.length+":"+cyrb53(JSON.stringify(rows)); }
  catch(e){ return rows.length+":?"; }
}

function uiBusy(){
  try{
    const el=document.activeElement;
    if(el&&(el.tagName==="INPUT"||el.tagName==="SELECT"||el.tagName==="TEXTAREA"||el.isContentEditable)) return true;
    if(document.querySelector(".modal-bg.show")) return true;
    const k=document.getElementById("cmdkOverlay");
    if(k&&k.classList.contains("open")) return true;
  }catch(e){}
  return false;
}


function syncBadge(mode){
  const el=document.getElementById("syncDot");
  if(!el) return;
  el.className="sync-dot "+(mode||"");
  try{offlineBar(mode==="off");}catch(e){}
  const w=document.getElementById("syncWrap"),l=document.getElementById("syncLbl");
  const txt = mode==="off" ? "Hors ligne - nouvelle tentative en cours"
            : mode==="busy" ? "Synchronisation…"
            : "À jour - les modifications apparaissent automatiquement";
  el.title=txt; if(w)w.title=txt; if(l)l.textContent=mode==="off"?"Hors ligne":"En ligne";
}

function pollWake(immediat){
  _pollDelay=POLL_BASE;
  if(immediat){ clearTimeout(_pollTimer); _pollTimer=setTimeout(pollRealtime,250); }
  else schedulePoll();
}
["pointerdown","keydown"].forEach(ev=>document.addEventListener(ev,()=>{
  if(_pollDelay!==POLL_BASE) pollWake(false);
},{passive:true}));
/* Le retour sur l'onglet est deja traite plus bas, par un ecouteur qui force
   en plus une relecture des tables (pollCount=2). On n'en pose pas un second. */

async function pollRealtime(){
  if(_pollBusy) return schedulePoll();
  _pollBusy=true;
  _pollQuiet=true;
  try{Auth.integrity();}catch(e){}
  let failed=false;
  try{
    if(supaOK && !document.hidden){
      syncBadge("busy");

      const cfg=await supaGet(T.config);
      if(cfg===null) failed=true;
      if(cfg){
        let nm=state.maintenance, nr=state.recOpen, cfgChanged=false, repChanged=false;
        cfg.forEach(row=>{try{
          if(row.key==="maintenance") nm=JSON.parse(row.value);
          if(row.key==="recOpen")     nr=JSON.parse(row.value);
          if(row.key==="autoReport")  state.autoReport=JSON.parse(row.value);
          if(row.key==="effectifCible"){
            const _ec=parseInt(cfgStr(row.value),10);
            if(_ec>0&&_ec<=999&&_ec!==state.effectifCible){ state.effectifCible=_ec; cfgChanged=true; }
          }
          if(row.key==="autoReportSince"&&cfgStr(row.value)!==state.autoReportSince){
            state.autoReportSince=cfgStr(row.value); repChanged=true;
          }
          if(row.key==="reportExempt"||row.key==="reportWeeks"){
            const p=JSON.parse(row.value);
            const cur=row.key==="reportExempt"?state.reportExempt:state.reportWeeks;
            if(p&&typeof p==="object"&&JSON.stringify(p)!==JSON.stringify(cur||{})){
              if(row.key==="reportExempt")state.reportExempt=p;else state.reportWeeks=p;
              repChanged=true;
            }
          }
          if(row.key==="reglement"){
            if(row.value!==state.reglement){ state.reglement=row.value; cfgChanged=true; }
          }
          if(row.key==="content"){
            const _raw=JSON.parse(row.value);
            const nc=typeof _raw==="string"?JSON.parse(_raw):_raw;
            if(JSON.stringify(nc)!==JSON.stringify(state.content)){ state.content=nc; renderContent(); }
          }
        }catch(e){}});
        if(nm!==state.maintenance){ state.maintenance=nm; applyMaintenance(); }
        if(nr!==state.recOpen){ state.recOpen=nr; applyRec(); }
        if(cfgChanged||repChanged) _pollQuiet=false;
        if(cfgChanged){
          _sig.config="changed"+Date.now();
          /* un onglet qui depend de la configuration (reglement, recrutements,
             comptes rendus, administration) se repeint quand elle change ailleurs */
          const cm=TAB_RENDER[_activeTab];
          if(session&&cm&&cm.on.indexOf("config")!==-1&&!uiBusy()){const f=window[cm.fn];if(typeof f==="function"){try{f();}catch(e){}}}
        }
        if(repChanged && session && !uiBusy()){
          try{ if(_activeTab==="reports") renderReports(); else if(_activeTab==="overview") renderOverview(); }catch(e){}
          try{ checkMyReportStatus(); }catch(e){}
        }
      }

      pollCount++;
      /* En rythme normal, les tables ne sont relues qu'un cycle sur trois.
         Au repos, les cycles sont déjà espacés : on relit à chaque fois,
         sinon la fraîcheur se dégraderait au lieu de rester stable. */
      if(pollCount%3===0||_pollDelay>POLL_BASE){
        const {changed,allFailed}=await fetchSyncTables();
      if(changed.size) _pollQuiet=false;
        if(allFailed) failed=true;

        const _day=new Date().toISOString().slice(0,10);
        const _hour=Math.floor(Date.now()/3600000);
        if(session && _lastWeeklyJobsHour!==_hour){
          _lastWeeklyJobsHour=_hour;
          runWeeklyReportJobs();
          /* même rendez-vous horaire pour l'annonce du lundi : elle ne fait
             rien tant que l'heure n'est pas venue ou que c'est déjà parti */
          try{ misAnnonceAuto(); }catch(e){ console.warn("annonce missions",e); }
        }
        if(session && (_lastReconcileDay!==_day||changed.has("absences")||changed.has("members"))){
          _lastReconcileDay=_day;
          try{ if(await reconcileAbsenceStatus()) changed.add("members"); }
          catch(e){ console.warn("sync: statuts absences",e); }
        }

        if(session && (changed.has("members")||changed.has("users"))){
          try{ _midxRef=null;_midxLen=-1; syncSessionGrade(); }catch(e){}
        }
        if(session && changed.size && !uiBusy()){
          const meta=TAB_RENDER[_activeTab];
          if(meta && meta.on.some(t=>changed.has(t))){
            const fn=window[meta.fn];
            if(typeof fn==="function"){ try{ fn(); }catch(e){ console.warn("sync: "+meta.fn,e); } }
          }
          try{ if(typeof checkMyReportStatus==="function") checkMyReportStatus(); }catch(e){}
          try{ if(typeof refreshChatBadge==="function") refreshChatBadge(); }catch(e){}
        }
      }
      if(!failed){ _lastSync=Date.now(); syncBadge(""); }
      try{ if(session&&!_pollQuiet)refreshNotifications(); }catch(e){}
      try{ await Auth.watch(); }catch(e){}
    }
  }catch(e){ failed=true; console.warn("sync: cycle interrompu",e); }
  finally{
    _pollBusy=false;
    if(failed){ _pollDelay=Math.min(_pollDelay*2,POLL_MAX); syncBadge("off"); }
    else if(_pollQuiet) _pollDelay=Math.min(Math.round(_pollDelay*1.5),POLL_IDLE_MAX);
    else _pollDelay=POLL_BASE;
    schedulePoll();
  }
}

function schedulePoll(){
  clearTimeout(_pollTimer);
  _pollTimer=setTimeout(pollRealtime,_pollDelay);
}

document.addEventListener("visibilitychange",()=>{
  if(document.hidden) return;
  _pollDelay=POLL_BASE;
  pollCount=2;
  clearTimeout(_pollTimer);
  _pollTimer=setTimeout(pollRealtime,150);
});
window.addEventListener("online",()=>{ _pollDelay=POLL_BASE; schedulePoll(); });
window.addEventListener("offline",()=>syncBadge("off"));
