/* ARC ALPHA - Fonctions communes : echappement, dates, dialogue, toast, formats. */
function esc(s){
  if(s==null)return"";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function escTrunc(s,n){
  const t=String(s??"");
  return esc(t.length>n?t.slice(0,n)+"…":t);
}
/* Valeur destinée à une chaîne JS placée dans un attribut HTML, par exemple
   onclick="f('...')". Le navigateur décode les entités AVANT de lire le JS,
   donc esc() seul ne suffit pas : une apostrophe devenue &#39; redevient une
   apostrophe et referme la chaîne. On échappe donc d'abord pour JS, puis pour
   le HTML, dans cet ordre. Les deux séparateurs de ligne Unicode sont visés
   par leur code, pour ne pas les écrire en clair dans ce fichier. */
function escJs(s){
  if(s==null)return"";
  return esc(String(s)
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/"/g,'\\"')
    .replace(/\r/g,"\\r")
    .replace(/\n/g,"\\n")
    .replace(new RegExp(String.fromCharCode(8232),"g"),"\\u2028")
    .replace(new RegExp(String.fromCharCode(8233),"g"),"\\u2029"));
}

/* Nettoie du HTML riche. Le règlement est rédigé dans un éditeur
   contenteditable, il doit donc garder sa mise en forme : on ne peut pas
   l'échapper, on filtre. Seules les balises que la feuille de style connaît
   sont gardées, tout attribut d'événement est retiré, et les liens doivent
   être http, https ou mailto. L'analyse se fait dans un document détaché,
   qui n'exécute rien et ne charge aucune image. */
const SANI_TAGS=["P","BR","DIV","SPAN","B","STRONG","I","EM","U","S","STRIKE","SUB","SUP",
  "H1","H2","H3","H4","H5","H6","UL","OL","LI","A","BLOCKQUOTE","CODE","PRE","HR",
  "TABLE","THEAD","TBODY","TFOOT","TR","TH","TD","FONT","SMALL","MARK"];
const SANI_ATTRS=["href","title","colspan","rowspan","align","color","face","size","style","class"];
function sanitizeHtml(html){
  const src=String(html==null?"":html);
  if(!src)return"";
  try{
    const doc=new DOMParser().parseFromString("<body>"+src+"</body>","text/html");
    const walk=(node)=>{
      Array.from(node.children||[]).forEach(el=>{
        if(SANI_TAGS.indexOf(el.tagName)===-1){
          /* balise inconnue : on garde son texte, on jette la balise */
          el.parentNode.replaceChild(doc.createTextNode(el.textContent||""),el);
          return;
        }
        Array.from(el.attributes).forEach(at=>{
          const n=at.name.toLowerCase();
          if(SANI_ATTRS.indexOf(n)===-1){el.removeAttribute(at.name);return;}
          if(n==="href"){
            let ok=false;
            try{ok=["http:","https:","mailto:"].indexOf(new URL(at.value,location.href).protocol)!==-1;}catch(e){}
            if(!ok)el.removeAttribute("href");
          }
          if(n==="style"&&/expression|javascript:|url\s*\(/i.test(at.value))el.removeAttribute("style");
        });
        walk(el);
      });
    };
    walk(doc.body);
    return doc.body.innerHTML;
  }catch(e){console.warn("sanitizeHtml",e);return esc(src);}
}


/* Donne son ton a un chiffre cle, et sa ligne de contexte s'il y en a une.
   Un seul endroit pour toutes les pages : le ton suit toujours la valeur. */
function statTone(id,ton,sous){
  const el=document.getElementById(id);
  if(!el)return;
  el.className="stat-v"+(ton?" t-"+ton:"");
  if(sous!==undefined){
    let s=el.parentElement&&el.parentElement.querySelector(".stat-s");
    if(!s&&el.parentElement){
      s=document.createElement("div");s.className="stat-s";el.parentElement.appendChild(s);
    }
    if(s)s.textContent=sous||"";
  }
}

function colorGradeSelect(sel){sel.style.color=GRADE_COLORS[sel.value]||"#e9eef7";}


function ymdLocal(d){
  const z=n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
}
function getWeekKey(offset=0){
  const d=new Date();d.setDate(d.getDate()-(d.getDay()===0?6:d.getDay()-1)+offset*7);
  return ymdLocal(d);
}
function weekKeyOf(dateStr){
  const p=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr||""));
  if(!p)return getWeekKey(0);
  const d=new Date(+p[1],+p[2]-1,+p[3]);
  if(isNaN(d.getTime()))return getWeekKey(0);
  d.setDate(d.getDate()-(d.getDay()===0?6:d.getDay()-1));
  return ymdLocal(d);
}

function stLabel(s){return{present:"Présent",absent:"Absent",reserve:"Réserve"}[s]||s||"Présent";}
function fmtDate(d){if(!d)return"-";try{return new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});}catch{return esc(d);}}

let toastTimer;
let _confirmResolver=null,_confirmMode="confirm";
function confirmResolve(ok){
  const m=document.getElementById("confirmModal");
  const inp=document.getElementById("confirmInput");
  let out;
  if(_confirmMode==="prompt")out=ok?(inp?inp.value:""):null;
  else out=ok;
  if(m)m.classList.remove("show");
  document.removeEventListener("keydown",_confirmKeyHandler);
  if(_confirmResolver){const r=_confirmResolver;_confirmResolver=null;r(out);}
}
function _confirmKeyHandler(e){
  if(e.key==="Escape")confirmResolve(false);
  else if(e.key==="Enter"&&_confirmMode!=="prompt")confirmResolve(true);
}
function _uiDialog(opts){
  if(typeof opts==="string")opts={message:opts};
  opts=opts||{};
  const mode=opts.mode||"confirm";
  _confirmMode=mode;
  const danger=!!opts.danger;
  const m=document.getElementById("confirmModal");
  if(!m){
    if(mode==="alert"){window.alert(opts.message||"");return Promise.resolve(true);}
    if(mode==="prompt")return Promise.resolve(window.prompt(opts.message||"",opts.defaultValue||""));
    return Promise.resolve(window.confirm(opts.message||"Confirmer ?"));
  }
  const kick=opts.kicker||(mode==="alert"?"// INFORMATION":mode==="prompt"?"// SAISIE":(danger?"// ACTION SENSIBLE":"// CONFIRMATION"));
  document.getElementById("confirmKicker").textContent=kick;
  document.getElementById("confirmTitle").textContent=opts.title||(mode==="alert"?"Information":mode==="prompt"?"Saisie":(danger?"Attention":"Confirmation"));
  document.getElementById("confirmMsg").textContent=opts.message||"";
  const okBtn=document.getElementById("confirmOkBtn");
  const cancelBtn=document.getElementById("confirmCancelBtn");
  const inp=document.getElementById("confirmInput");
  if(mode==="prompt"){
    inp.style.display="";inp.value=opts.defaultValue||"";inp.placeholder=opts.placeholder||"";
  }else{inp.style.display="none";inp.value="";}
  okBtn.textContent=opts.okText||(mode==="alert"?"OK":mode==="prompt"?"Valider":(danger?"Supprimer":"Confirmer"));
  cancelBtn.style.display=(mode==="alert")?"none":"";
  cancelBtn.textContent=opts.cancelText||"Annuler";
  okBtn.className="btn "+(danger?"btn-danger":"btn-primary");
  /* Un aperçu a besoin de largeur ; une question simple n'en veut pas. */
  const box=m.querySelector(".modal");
  if(box)box.classList.toggle("wide",!!opts.wide);
  const icon=document.getElementById("confirmIcon");
  if(danger){
    icon.style.borderColor="rgba(255,59,92,.4)";icon.style.background="rgba(255,59,92,.08)";
    icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="var(--rd)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  }else if(mode==="prompt"){
    icon.style.borderColor="var(--ls)";icon.style.background="rgba(0,229,255,.06)";
    icon.innerHTML='<i data-lucide="pencil"></i>';
  }else{
    icon.style.borderColor="var(--ls)";icon.style.background="rgba(0,229,255,.06)";
    icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="var(--ac)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }
  m.classList.add("show");
  setTimeout(()=>{try{(mode==="prompt"?inp:okBtn).focus();if(mode==="prompt")inp.select();}catch{}},60);
  document.addEventListener("keydown",_confirmKeyHandler);
  return new Promise(res=>{_confirmResolver=res;});
}
function uiConfirm(opts){if(typeof opts==="string")opts={message:opts};return _uiDialog({...opts,mode:"confirm"});}
function uiAlert(opts){if(typeof opts==="string")opts={message:opts};return _uiDialog({...opts,mode:"alert"});}
function uiPrompt(opts){if(typeof opts==="string")opts={message:opts};return _uiDialog({...opts,mode:"prompt"});}

/* Un bouton qui lance une operation reseau se bloque le temps de celle-ci.
   Sans cela il accepte un second clic pendant que le premier enregistre,
   et rien n'indique a l'utilisateur que quelque chose se passe.

   On n'enveloppe pas les fonctions metier : elles restent appelables telles
   quelles depuis ailleurs. C'est le bouton qui porte l'etat, via son
   attribut, et il le rend des que la promesse est reglee, qu'elle
   aboutisse ou non. Une fonction synchrone passe sans rien declencher. */
function occupe(btn,fn){
  if(typeof fn!=="function")return;
  if(!btn)return fn();
  if(btn.dataset.busy==="1")return;
  let r;
  try{ r=fn(); }
  catch(e){ console.warn("occupe",e); throw e; }
  if(!r||typeof r.then!=="function")return r;
  btn.dataset.busy="1";
  btn.disabled=true;
  const rendre=()=>{ btn.dataset.busy=""; btn.disabled=false; };
  r.then(rendre,function(e){ rendre(); console.warn("occupe",e); });
  return r;
}

function toast(msg,type="info"){
  const t=document.getElementById("toast"),m=document.getElementById("toastMsg");if(!t||!m)return;
  const icons={success:'<polyline points="20 6 9 17 4 12"/>',error:'<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',info:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>'};
  t.querySelector(".ti").innerHTML=icons[type]||icons.info;
  t.className=type;m.textContent=msg;t.classList.add("show");
  /* Retirer puis remettre la classe force l'animation a rejouer, y compris
     sur un toast deja affiche : sans ce passage par un reflow, deux messages
     consecutifs ne donneraient qu'une seule pointe. */
  t.classList.remove("pop");void t.offsetWidth;t.classList.add("pop");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3500);
}


function roleAvatarColor(role,grade){
  if(role==="amiraute")return"var(--gd)";
  if(role==="brs")return"var(--vi)";
  if(role==="admin")return"var(--gd)";
  return GRADE_COLORS[grade||"ARC"]||"var(--ac)";
}


function animateCount(el,target){
  if(!el)return;
  target=parseInt(target)||0;
  /* Premier remplissage : au chargement, passer du zero affiche a la vraie
     valeur n'est pas un changement pour celui qui regarde, et le cadre n'y
     serait que du bruit. On ne peut pas se fier a data-val pour le savoir :
     showSkeletons() le remet a "0" juste avant loadAll(). D'ou cette marque
     a nous, que ni le balisage ni le squelette ne posent. Elle est ecrite
     avant le retour anticipe ci-dessous, sinon un compteur inchange au
     demarrage passerait pour neuf a sa premiere vraie variation. */
  const premier=(el.dataset.vu!=="1");
  el.dataset.vu="1";
  const current=parseInt(el.dataset.val||"0");
  if(current===target){el.textContent=target;return;}
  el.dataset.val=target;
  /* On arrive ici seulement si la valeur a vraiment bouge : l'egalite
     au-dessus rend la main. Le cadre ne clignote donc pas sur un simple
     reaffichage, ni sur le tout premier affichage. */
  if(!premier){
    el.classList.remove("val-new");void el.offsetWidth;el.classList.add("val-new");
  }
  const start=current;
  const duration=600;
  const startTime=performance.now();
  function step(now){
    const elapsed=now-startTime;
    const progress=Math.min(elapsed/duration,1);
    const eased=1-Math.pow(1-progress,3);
    const val=Math.round(start+(target-start)*eased);
    el.textContent=val;
    if(progress<1)requestAnimationFrame(step);
    else el.textContent=target;
  }
  requestAnimationFrame(step);
}


const GRADE_LABELS={CMDM:"Commandant-Maréchal",CMD:"Commandant",VCMD:"Vice-Commandant",
  MAJ:"Major",CPT:"Capitaine",LT:"Lieutenant",SGT:"Sergent",ARC:"Membre ARC"};


function gradeLabel(g){ return GRADE_LABELS[g]||g||"-"; }
function gradeColorInt(g){
  const hex=(GRADE_COLORS[g]||"#00e5ff").replace("#","");
  const v=parseInt(hex.length===3?hex.split("").map(c=>c+c).join(""):hex,16);
  return isNaN(v)?0x00e5ff:v;
}


/* ============================================================
   Refonte 2026-11 : briques communes
   ============================================================ */

/* Retarde un appel tant que l'utilisateur tape encore. */
function debounce(fn,ms){
  let t=null;
  return function(){const a=arguments,c=this;clearTimeout(t);t=setTimeout(()=>fn.apply(c,a),ms||150);};
}

/* Preferences du navigateur (favoris, affichage compact, barre reduite,
   notifications lues). Jamais une donnee metier : tout cela peut se perdre
   sans dommage en changeant d'appareil. */
const uiPrefs={
  get(k,d){try{const v=localStorage.getItem("arcui_"+k);return v===null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem("arcui_"+k,JSON.stringify(v));}catch(e){}}
};

/* Icones Lucide. Une icone se declare par <i data-lucide="nom"></i> ; cette
   fonction les dessine, y compris celles ajoutees par innerHTML. */
function lucideRefresh(root){
  try{ if(window.lucide&&lucide.createIcons)lucide.createIcons({attrs:{"aria-hidden":"true"},nameAttr:"data-lucide"}); }catch(e){}
}
function iconHtml(name,cls){
  return `<i data-lucide="${esc(name)}"${cls?` class="${esc(cls)}"`:""}></i>`;
}
/* Glyphes et emoji historiques des menus : on les traduit en icones. Une
   valeur inconnue (icone saisie par un officier, mode indien) reste du texte. */
const ICON_MAP={"⌂":"home","▤":"layout-list","◈":"activity","⚑":"flag","▦":"library","⚙":"settings",
  "👤":"user","🎓":"graduation-cap","🎯":"target","📝":"file-pen-line","🛡":"shield","⛔":"ban","⚔":"swords",
  "🗳":"vote","📋":"clipboard-list","🎭":"drama","📁":"folder","✅":"check-square","📜":"scroll-text","●":"circle"};
function navIconHtml(icon){
  const s=String(icon==null?"":icon).trim();
  if(!s)return "";
  if(/^[a-z0-9-]+$/.test(s))return `<i data-lucide="${s}"></i>`;
  if(ICON_MAP[s])return `<i data-lucide="${ICON_MAP[s]}"></i>`;
  return esc(s);
}

/* Tableaux : etiquette de colonne sur chaque cellule (mode cartes sur
   telephone) et tri par clic sur l'en-tete. Rien a changer dans les gabarits :
   tout se lit dans le DOM apres chaque rendu. */
const _tblSort=new Map();
function tablesEnhance(root){
  (root||document).querySelectorAll("table.tbl").forEach(tbl=>{
    const ths=[...tbl.querySelectorAll("thead th")];
    if(!ths.length)return;
    const labels=ths.map(th=>(th.textContent||"").replace(/\?$/,"").trim());
    tbl.querySelectorAll("tbody tr").forEach(tr=>{
      if(tr.children.length<2)return; /* ligne « vide » ou squelette */
      [...tr.children].forEach((td,i)=>{
        if(!td.hasAttribute("data-label"))td.setAttribute("data-label",labels[i]&&labels[i]!=="Actions"?labels[i]:"");
      });
    });
    if(!tbl.dataset.sortReady){
      tbl.dataset.sortReady="1";
      const key=tbl.closest("[data-dtc]")?.dataset.dtc+"/"+(tbl.querySelector("tbody")?.id||"");
      tbl.dataset.sortKey=key;
      ths.forEach((th,i)=>{
        if(labels[i]==="Actions"||!labels[i])return;
        th.classList.add("sortable");th.setAttribute("tabindex","0");th.setAttribute("role","button");
        th.title="Trier par "+labels[i];
        const go=()=>{
          const cur=_tblSort.get(key);
          const dir=cur&&cur.col===i&&cur.dir==="asc"?"desc":"asc";
          _tblSort.set(key,{col:i,dir});
          tableApplySort(tbl);
        };
        th.addEventListener("click",go);
        th.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
      });
    }
    tableApplySort(tbl);
  });
}
function tableApplySort(tbl){
  const s=_tblSort.get(tbl.dataset.sortKey);
  const ths=[...tbl.querySelectorAll("thead th")];
  ths.forEach(th=>th.removeAttribute("data-dir"));
  if(!s)return;
  const tb=tbl.querySelector("tbody");if(!tb)return;
  const rows=[...tb.querySelectorAll(":scope > tr")].filter(r=>r.children.length>1);
  if(rows.length<2)return;
  if(ths[s.col])ths[s.col].setAttribute("data-dir",s.dir);
  const val=r=>{
    const td=r.children[s.col];if(!td)return "";
    const inp=td.querySelector("input,select");
    const t=inp?(inp.value||""):(td.textContent||"");
    return t.trim();
  };
  const num=v=>{const n=parseFloat(String(v).replace(",",".").replace(/[^\d.-]/g,""));return isNaN(n)?null:n;};
  const allNum=rows.every(r=>num(val(r))!==null);
  const sorted=rows.slice().sort((a,b)=>{
    const va=val(a),vb=val(b);
    let c=allNum?(num(va)-num(vb)):va.localeCompare(vb,"fr",{numeric:true,sensitivity:"base"});
    return s.dir==="asc"?c:-c;
  });
  /* on ne deplace les lignes que si l'ordre change : sinon chaque passage
     relancerait l'observateur, qui relancerait le tri, sans fin */
  if(sorted.some((r,i)=>r!==rows[i]))sorted.forEach(r=>tb.appendChild(r));
}

/* Barres de filtres generiques : <div class="filters" data-filter="#cible"
   data-sel=".ligne"> avec un champ de recherche, d'eventuels <select
   data-ffield>, un bouton de reinitialisation et un compteur. Le filtre lit le
   texte des elements : il marche sur n'importe quel rendu sans le modifier. */
function filtersInit(root){
  (root||document).querySelectorAll(".filters[data-filter]").forEach(bar=>{
    if(bar.dataset.ready)return;
    bar.dataset.ready="1";
    const inp=bar.querySelector("input"),reset=bar.querySelector(".reset");
    const sels=[...bar.querySelectorAll("select[data-ffield]")];
    const run=debounce(()=>filtersApply(bar),150);
    if(inp)inp.addEventListener("input",run);
    sels.forEach(s=>s.addEventListener("change",()=>filtersApply(bar)));
    if(reset)reset.addEventListener("click",()=>{if(inp)inp.value="";sels.forEach(s=>s.value="");filtersApply(bar);});
  });
}
function filtersApply(bar){
  const target=document.querySelector(bar.dataset.filter);
  const cnt=bar.querySelector(".count"),reset=bar.querySelector(".reset");
  if(!target){if(cnt)cnt.textContent="";return;}
  const q=((bar.querySelector("input")||{}).value||"").trim().toLowerCase();
  const terms=[...bar.querySelectorAll("select[data-ffield]")].map(s=>(s.value||"").trim().toLowerCase()).filter(Boolean);
  const items=[...target.querySelectorAll(bar.dataset.sel||"tr")].filter(el=>!(el.children.length===1&&el.querySelector(".empty")));
  let shown=0;
  items.forEach(el=>{
    const t=(el.textContent||"").toLowerCase();
    const ok=(!q||t.includes(q))&&terms.every(x=>t.includes(x));
    el.classList.toggle("hidden-by-filter",!ok);
    if(ok)shown++;
  });
  /* categories de documents : une section sans carte visible disparait */
  target.querySelectorAll(":scope > div").forEach(sec=>{
    const cards=sec.querySelectorAll(bar.dataset.sel||"tr");
    if(cards.length)sec.classList.toggle("hidden-by-filter",![...cards].some(c=>!c.classList.contains("hidden-by-filter")));
  });
  const active=!!(q||terms.length);
  if(reset)reset.hidden=!active;
  if(cnt)cnt.textContent=items.length?(active?`${shown} / ${items.length} résultat${items.length>1?"s":""}`:`${items.length} élément${items.length>1?"s":""}`):"";
}
function filtersRefresh(){document.querySelectorAll(".filters[data-filter][data-ready]").forEach(filtersApply);}

/* Erreur par champ : bordure rouge et message sous le champ, retires a la
   prochaine saisie. Renvoie false pour pouvoir ecrire `return fieldError(...)`. */
function fieldError(inputId,msg){
  const el=document.getElementById(inputId);
  if(!el){toast(msg,"error");return false;}
  const f=el.closest(".field")||el.parentElement;
  if(f){
    f.classList.add("is-invalid");
    let m=f.querySelector(".field-err");
    if(!m){m=document.createElement("div");m.className="field-err";f.appendChild(m);}
    m.textContent=msg;
    const clear=()=>{f.classList.remove("is-invalid");if(m)m.textContent="";};
    el.addEventListener("input",clear,{once:true});el.addEventListener("change",clear,{once:true});
  }
  try{el.focus({preventScroll:false});}catch(e){}
  return false;
}
function fieldsClear(modalId){
  const m=modalId?document.getElementById(modalId):document;
  if(!m)return;
  m.querySelectorAll(".field.is-invalid").forEach(f=>f.classList.remove("is-invalid"));
  m.querySelectorAll(".field-err").forEach(e=>e.textContent="");
}

/* Date relative courte pour les listes d'activite. */
function fmtRel(iso){
  if(!iso)return "";
  const d=new Date(iso);if(isNaN(d))return "";
  const s=(Date.now()-d.getTime())/1000;
  if(s<60)return "à l'instant";
  if(s<3600)return "il y a "+Math.floor(s/60)+" min";
  if(s<86400)return "il y a "+Math.floor(s/3600)+" h";
  if(s<86400*7)return "il y a "+Math.floor(s/86400)+" j";
  return fmtDate(iso);
}

/* La cle « content » de arc_config porte trois choses (textes de la vitrine,
   organisation des menus, formulaires de recrutement). Avant, chaque
   enregistrement reecrivait le bloc entier avec la copie locale : deux
   officiers qui modifiaient deux parties differentes s'ecrasaient. Ici on
   relit la valeur distante, on n'y change que ce que `mutate` touche, puis on
   ecrit. Renvoie le nouveau contenu, ou null si la base est injoignable. */
async function contentMerge(mutate){
  let base=Object.assign({},state.content||{});
  if(supaOK){
    const rows=await supaGet(T.config,"key=eq.content");
    if(rows===null)return null;
    if(rows.length){
      try{let p=JSON.parse(rows[0].value);if(typeof p==="string")p=JSON.parse(p);if(p&&typeof p==="object")base=p;}catch(e){}
    }
  }
  const next=Object.assign({},base);
  mutate(next);
  if(supaOK)await setConfig("content",next);
  state.content=next;
  return next;
}

/* ============================================================
   Carte statistique (statCard)
   Reprise du composant StatCard propose par le proprietaire (React,
   framer-motion), traduit pour ce site : pas de React ni de Tailwind ici,
   le survol passe par le CSS (.kpi.go:hover) et l'icone par Lucide.
   Une seule fabrique pour l'accueil et les Statistiques.

   statCard({title, value, unit, sub, color, icon, tab, trend})
     color : couleur de la carte (une variable CSS, ex. "var(--gr)")
     tab   : onglet ouvert au clic ; sans lui, la carte n'est pas cliquable
     trend : variation, voir statTrend. Absente = pas de ligne de variation.
   ============================================================ */
function statCard(o){
  const go=!!o.tab;
  const act=go?` role="button" tabindex="0" onclick="dashTab('${escJs(o.tab)}')"`
    +` onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();dashTab('${escJs(o.tab)}')}"`:"";
  return `<div class="kpi${go?" go":""}" style="--kc:${o.color||"var(--ac)"}"${act}>
    <span class="l">${esc(o.title)}</span>
    <span class="ic" aria-hidden="true">${navIconHtml(o.icon||"activity")}</span>
    <span class="v">${esc(o.value)}${o.unit?`<small>${esc(o.unit)}</small>`:""}</span>
    ${statTrend(o.trend)}
    ${o.sub?`<span class="s">${esc(o.sub)}</span>`:""}
  </div>`;
}

/* Variation affichee sous la valeur. Toujours calculee sur des donnees
   reelles ; quand il n'y a rien a comparer, on n'affiche rien plutot qu'un
   « +0 % » sans objet.
     {cur, prev}              pourcentage d'une periode sur l'autre
     {cur, prev, mode:"pts"}  ecart en points (pour un taux)
     {cur, mode:"abs"}        simple compte, ex. « +2 arrivees »
     lowerIsBetter            une hausse est une mauvaise nouvelle (blames...)
     neutral                  ni bon ni mauvais : couleur neutre
     ctx                      texte gris apres le chiffre, ex. « vs 30 j prec. »
     hint                     bulle au survol : ce qui est compare exactement */
function statTrend(t){
  if(!t)return "";
  const cur=Number(t.cur)||0, prev=Number(t.prev)||0;
  let d, txt;
  if(t.mode==="pts"){
    if(t.cur==null||t.prev==null)return "";
    d=Math.round((cur-prev)*10)/10;
    txt=(d>0?"+":"")+String(d).replace(".",",")+(Math.abs(d)>=2?" pts":" pt");
  }else if(t.mode==="abs"){
    if(!cur)return "";
    d=cur;txt="+"+cur;
  }else{
    if(!cur&&!prev)return "";
    d=cur-prev;
    txt=prev?((d>0?"+":"")+Math.round(d/prev*100)+" %"):("+"+cur);
  }
  const dir=d>0?"up":(d<0?"down":"flat");
  const tone=dir==="flat"||t.neutral?"neutral":(((dir==="up")!==!!t.lowerIsBetter)?"good":"bad");
  const ic=dir==="up"?"arrow-up-right":(dir==="down"?"arrow-down-right":"arrow-right");
  return `<span class="kpi-trend ${tone}"${t.hint?` title="${esc(t.hint)}"`:""}>${navIconHtml(ic)}${esc(dir==="flat"?"stable":txt)}`
    +`${t.ctx?`<span class="ctx">${esc(t.ctx)}</span>`:""}</span>`;
}

/* Nombre d'elements dont la date tombe dans une fenetre de `days` jours
   finissant aujourd'hui, ou `offset` jours plus tot. La date d'un element est
   une date simple (AAAA-MM-JJ) ou un horodatage, ramene au jour local. */
function countInWindow(arr,dateOf,days,offset){
  const end=addDaysYmd(ymdLocal(new Date()),-(offset||0));
  const start=addDaysYmd(end,-(days-1));
  return (arr||[]).filter(x=>{
    const raw=String(dateOf(x)||"");
    let d=raw.slice(0,10);
    if(raw.length>10){const t=new Date(raw);if(!isNaN(t))d=ymdLocal(t);}
    return /^\d{4}-\d{2}-\d{2}$/.test(d)&&d>=start&&d<=end;
  }).length;
}
