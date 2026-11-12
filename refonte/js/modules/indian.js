/* ARC ALPHA - Module indian. */
const IND_KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
const IND_EMOJI  = ["🇮🇳","🐘","🛺","🥘","🫓","🍛","🪕","🐅","🙏","🌶️","🫖","🦚"];
const IND_TICKER = [
  "cheese naan localisé ✓",
  "coordonnées du tikka massala acquises ✓",
  "samosa chaud détecté - croustillant confirmé ✓",
  "liaison sécurisée avec le lassi mangue ✓",
  "niveau d'épices : CRITIQUE 🌶️",
  "éléphant repéré en approche du secteur 7 ✓",
  "MISSION TOURISTA : SUCCÈS - NAMASTÉ 🙏"
];

const IND_EXACT = {
  "Accueil":"Namasté",
  "L'unité":"Le Maharajat",
  "Recrutement":"Recrute-mangue",
  "Dashboard":"Le Bazar",
  "Connexion":"Namasté, entrez",
  "Découvrir ↓":"Déguster ↓",
  "Rejoindre l'unité →":"Rejoindre le palais →",
  "Effectifs d'élite":"Brigade des cuisines",
  "Génération ARC":"Génération Tandoori",
  "Origine":"Terroir",
  "Accès rapide":"Accès express Mumbai",
  "Comment le jouer":"Comment l'épicer",
  "Caractère":"Épices dominantes",
  "Équipement":"Bagages",
  "Missions":"Expéditions",
  "Membres légendaires":"Légendes de Bollywood",
  "Reconnaissance":"Repérage de dhabas",
  "Sabotage":"Sabotage de cantine",
  "Élimination ciblée":"Dégustation ciblée",
  "Extraction":"Extraction de samosas",
  "Commandement":"Commandement du palais",
  "Autonomie totale":"Autonomie totale",
  "Capteurs avancés":"Épices détectrices"
};
const IND_WORDS = [
  ["Grande Armée de la République","Grande Armée du Maharajat"],
  ["Tipoca City","Mumbai"],
  ["Jango Fett","Jango Patel"],
  ["Anakin Skywalker","Anakin Shah Rukh"],
  ["Ordre 66","Ordre Tikka 66"],
  ["Yeux Jaig","Yeux de Ganesh"],
  ["ARC Alpha","ARC Masala"],
  ["Muunilinst","Munnar"],
  ["Rattatak","Rajasthan"],
  ["Hypori","Hyderabad"],
  ["Kamino","Kerala"],
  ["Tipoca","Mumbai"],
  ["Kaminoans","Keralais"],
  ["Grievous","Ravi Grievous"],
  ["Bacara","Bangalore"],
  ["République","Maharajat"],
  ["séparatistes","rebelles du Rajasthan"],
  ["séparatiste","rebelle du Rajasthan"],
  ["mandaloriennes","bollywoodiennes"],
  ["mandalorien","bollywoodien"],
  ["Mandalorien","Bollywoodien"],
  ["droïdes","tuk-tuks"],
  ["droïde","tuk-tuk"],
  ["Jedi","gourous"],
  ["clones","cousins"],
  ["clone","cousin"],
  ["Alpha","Masala"],
  ["Omega","Tandoori"],
  ["blasters","lance-curry"],
  ["blaster","lance-curry"],
  ["jetpack","tapis volant"],
  ["armures","saris blindés"],
  ["armure","sari blindé"],
  ["casques","turbans"],
  ["casque","turban"],
  ["visière","voile"],
  ["fusils","sitars"],
  ["fusil","sitar"],
  ["missions","expéditions"],
  ["mission","expédition"],
  ["soldats","maharadjas"],
  ["soldat","maharadja"],
  ["guerre","mousson"],
  ["commandos","commandos"],
  ["comlink","conque"],
  ["détonateurs","currys explosifs"],
  ["canon rotatif","moulin à épices"],
  ["élite","élite"],
  ["Recon","Recon"]
];

const IND_TABS = {
  overview :{label:"Vue du Gange",     icon:"🛕"},
  monespace:{label:"Mon ashram",       icon:"🧘"},
  roster   :{label:"Effec-tikka",      icon:"🍛"},
  formations:{label:"For-masala",      icon:"🌶️"},
  reserve  :{label:"Réser-vindaloo",   icon:"🥘"},
  blacklist:{label:"Blacklassi",       icon:"🥤"},
  absences :{label:"Ab-samosas",       icon:"🥟"},
  reports  :{label:"Rap-poppadums",    icon:"🫓", badge:"reportPulseBadge"},
  rapports :{label:"Rendu-ravi",       icon:"📝", badge:"rapportPulseBadge"},
  cmd      :{label:"CMD New Delhi",    icon:"🛺"},
  polls    :{label:"Son-dahl",         icon:"🍲"},
  blames   :{label:"Blâ-masala",       icon:"🔥"},
  announce :{label:"An-naan-ces",      icon:"📣"},
  reglement:{label:"Règle-mangue",     icon:"🥭"},
  documents:{label:"Docu-mantras",     icon:"📜"},
  tasks    :{label:"Tâ-chaï",          icon:"🫖"},
  journal  :{label:"Journal de Mumbai",icon:"🐅"},
  admin    :{label:"Le Maharaja",      icon:"👑"}
};
const IND_GROUPS = {
  accueil   :{label:"Namasté",    icon:"🙏"},
  gestion   :{label:"Le Bazar",   icon:"🛺"},
  activite  :{label:"Bollywood",  icon:"🪕"},
  discipline:{label:"Karma",      icon:"🐅"},
  ressources:{label:"Les Épices", icon:"🌶️"},
  admin     :{label:"Maharaja",   icon:"👑"}
};
const IND_HEADS = {
  "Accès rapide":"Accès express Mumbai",
  "Qui sont les ARC Alpha":"Qui sont les Maharajas Alpha",
  "Missions":"Expéditions vers Delhi",
  "Équipement":"Bagages",
  "Membres légendaires":"Légendes de Bollywood",
  "Recrutement":"Recrute-mangue",
  "Accès réservé":"Accès VIP Taj Mahal",
  "Vue d'ensemble":"Vue du Gange",
  "Mon espace":"Mon ashram",
  "Effectif":"Effec-tikka",
  "Journal des modifications":"Chroniques de Mumbai",
  "Formations":"For-masala",
  "Réservistes":"Réser-vindaloo",
  "Blacklist":"Blacklassi",
  "CMD de Mission":"CMD de New Delhi",
  "Classement":"Classement du Maharaja",
  "Historique":"Chroniques du Raj",
  "Blâmes":"Blâ-masala",
  "Absences":"Ab-samosas",
  "En cours":"En cours de cuisson",
  "Calendrier":"Calendrier des moussons",
  "Rapports hebdomadaires":"Rap-poppadums hebdomadaires",
  "Annonces":"An-naan-ces",
  "Règlement":"Règle-mangue",
  "Documents":"Docu-mantras",
  "Tâches":"Tâ-chaï",
  "Administration":"Le Maharaja"
};

let _indOn=false, _indRainTimer=null, _indDrops=0, _indGen=0, _indBanTimer=null;
let _indTextBackup=[], _indTabsBackup=null, _indBrandBackup=null, _indAudioRetry=null;

function indianIsOn(){ return _indOn; }
function _indEl(id){ try{ return document.getElementById(id); }catch(e){ return null; } }
function _indDrop(node){ if(!node) return; if(node.parentNode) node.parentNode.removeChild(node); }

function indianOn(){
  if(_indOn) return;
  const rain=_indEl("indianRain"), ban=_indEl("indianBanner");
  if(!rain||!ban) return;
  _indOn=true;
  try{ indianBanner(ban); }      catch(e){ console.warn("mode indien: bandeau",e); }
  try{ rain.hidden=false; indianRainStart(); }catch(e){ console.warn("mode indien: pluie",e); }
  try{ indianAudioStart(); }     catch(e){ console.warn("mode indien: audio",e); }
  try{ indianRenameOn(); }       catch(e){ console.warn("mode indien: renommage",e); }
  try{ indianTextOn(); }         catch(e){ console.warn("mode indien: texte",e); }
}

function indianOff(){
  if(!_indOn) return;
  _indOn=false;
  try{ clearInterval(_indRainTimer); }catch(e){}
  try{ clearTimeout(_indBanTimer); }catch(e){}
  _indRainTimer=null; _indBanTimer=null;
  try{ indianAudioStop(); }catch(e){ console.warn("mode indien: audio",e); }
  const ban=_indEl("indianBanner"), rain=_indEl("indianRain");
  if(ban){ try{ ban.className="indian-banner"; ban.hidden=true; }catch(e){} }
  if(rain){ try{ while(rain.firstChild) rain.removeChild(rain.firstChild); rain.hidden=true; }catch(e){} }
  _indDrops=0; _indGen++;
  try{ indianTextOff(); }  catch(e){ console.warn("mode indien: texte",e); }
  try{ indianRenameOff(); }catch(e){ console.warn("mode indien: renommage",e); }
}

function indianBanner(ban){
  const track=_indEl("ibTrack");
  if(track){
    let one="";
    for(let i=0;i<IND_TICKER.length;i++) one+="<span>"+esc(IND_TICKER[i])+"</span>";
    track.innerHTML=one+one;
  }
  ban.hidden=false;
  setTimeout(function(){ if(_indOn && ban) ban.className="indian-banner on"; },30);
  _indBanTimer=setTimeout(function(){
    if(!_indOn||!ban) return;
    ban.className="indian-banner";
    setTimeout(function(){ if(_indOn && ban) ban.hidden=true; },450);
  },7000);
}

function indianRainStart(){
  let slow=false;
  try{ slow = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches); }catch(e){}
  _indRainTimer=setInterval(indianDrop, slow?900:190);
  const n = slow?2:6;
  for(let i=0;i<n;i++) setTimeout(indianDrop, i*90);
}

function indianDrop(){
  if(!_indOn) return;
  const rain=_indEl("indianRain");
  if(!rain || _indDrops>70) return;
  try{ if(document.hidden) return; }catch(e){}
  let d;
  try{
    d=document.createElement("div");
    d.className="ir-drop";
    d.textContent=IND_EMOJI[Math.floor(Math.random()*IND_EMOJI.length)];
    d.style.left=(Math.random()*98)+"%";
    d.style.fontSize=(1.1+Math.random()*1.4).toFixed(2)+"rem";
    d.style.animationName="irFall"+Math.floor(Math.random()*4);
    d.style.animationDuration=(4.5+Math.random()*4).toFixed(2)+"s";
    d.style.webkitAnimationName=d.style.animationName;
    d.style.webkitAnimationDuration=d.style.animationDuration;
  }catch(e){ return; }
  _indDrops++;
  let done=false; const gen=_indGen;
  function kill(){
    if(done) return; done=true;
    _indDrop(d);
    if(gen===_indGen && _indDrops>0) _indDrops--;
  }
  try{ d.addEventListener("animationend",kill,false); }catch(e){}
  try{ d.addEventListener("webkitAnimationEnd",kill,false); }catch(e){}
  setTimeout(kill,12000);
  try{ rain.appendChild(d); }catch(e){ kill(); }
}

function indianAudioStart(){
  const a=_indEl("indianAudio");
  if(!a) return;
  try{ a.volume=0.55; }catch(e){}
  try{ a.currentTime=0; }catch(e){}
  indianAudioPlay(a);
}

function indianAudioPlay(a){
  let p;
  try{ p=a.play(); }catch(e){ indianAudioArmRetry(); return; }
  if(p && typeof p.then==="function"){
    p.catch(function(){
      indianAudioArmRetry();
    });
  }
}

function indianAudioArmRetry(){
  if(_indAudioRetry) return;
  _indAudioRetry=function(){
    indianAudioDisarmRetry();
    const a=_indEl("indianAudio");
    if(a && _indOn){ try{ const q=a.play(); if(q&&q.catch) q.catch(function(){}); }catch(e){} }
  };
  try{
    document.addEventListener("click",_indAudioRetry,true);
    document.addEventListener("keydown",_indAudioRetry,true);
    document.addEventListener("touchstart",_indAudioRetry,true);
  }catch(e){}
  console.warn("Mode indien : lecture auto refusée, le son démarrera au prochain clic.");
}

function indianAudioDisarmRetry(){
  if(!_indAudioRetry) return;
  try{
    document.removeEventListener("click",_indAudioRetry,true);
    document.removeEventListener("keydown",_indAudioRetry,true);
    document.removeEventListener("touchstart",_indAudioRetry,true);
  }catch(e){}
  _indAudioRetry=null;
}

function indianAudioStop(){
  indianAudioDisarmRetry();
  const a=_indEl("indianAudio");
  if(!a) return;
  try{ a.pause(); }catch(e){}
  try{ a.currentTime=0; }catch(e){}
}
function indianAudioPause(){ const a=_indEl("indianAudio"); if(a){ try{ a.pause(); }catch(e){} } }
function indianAudioResume(){
  const a=_indEl("indianAudio");
  if(a && _indOn) indianAudioPlay(a);
}

const IND_LETTER="0-9A-Za-zÀ-ÖØ-öø-ÿ";

function indianCasedReplace(str){
  let out=str;
  for(let i=0;i<IND_WORDS.length;i++){
    const from=IND_WORDS[i][0], to=IND_WORDS[i][1];
    const lit=from.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    let rx;
    try{ rx=new RegExp("(^|[^"+IND_LETTER+"])("+lit+")(?![" +IND_LETTER+ "])","gi"); }catch(e){ continue; }
    const fn=function(m,pre,word){
      let rep=to;
      if(word===word.toUpperCase() && word!==word.toLowerCase()) rep=to.toUpperCase();
      else if(word.charAt(0)===word.charAt(0).toUpperCase()) rep=to.charAt(0).toUpperCase()+to.slice(1);
      else rep=to.toLowerCase();
      return pre+rep;
    };
    out=out.replace(rx,fn);
    out=out.replace(rx,fn);
  }
  return out;
}

function indianCollectText(node,out,skip){
  if(!node) return;
  if(node.nodeType===3){ out.push(node); return; }
  if(node.nodeType!==1) return;
  let tag="";
  try{ tag=(node.tagName||"").toUpperCase(); }catch(e){}
  if(skip[tag]) return;
  const kids=node.childNodes;
  for(let i=0;i<kids.length;i++) indianCollectText(kids[i],out,skip);
}

function indianTextOn(){
  if(_indTextBackup.length) return;
  const SKIP={SCRIPT:1,STYLE:1,NOSCRIPT:1,TEXTAREA:1,INPUT:1};
  const sels=["#v-home","#v-about","#v-recruitment",".nav-tabs"];
  for(let si=0;si<sels.length;si++){
    let root=null;
    try{ root=document.querySelector(sels[si]); }catch(e){}
    if(!root) continue;
    const nodes=[];
    indianCollectText(root,nodes,SKIP);
    for(let i=0;i<nodes.length;i++){
      const node=nodes[i], orig=node.nodeValue;
      if(!orig || !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(orig)) continue;
      const trimmed=orig.replace(/^\s+|\s+$/g,"");
      let next;
      if(Object.prototype.hasOwnProperty.call(IND_EXACT,trimmed)) next=orig.replace(trimmed,IND_EXACT[trimmed]);
      else next=indianCasedReplace(orig);
      if(next!==orig){ _indTextBackup.push([node,orig]); node.nodeValue=next; }
    }
  }
}

function indianTextOff(){
  for(let i=0;i<_indTextBackup.length;i++){
    try{ _indTextBackup[i][0].nodeValue=_indTextBackup[i][1]; }catch(e){}
  }
  _indTextBackup=[];
}

function indianRenameOn(){
  if(_indTabsBackup) return;
  _indTabsBackup={};
  for(const k in IND_TABS){
    if(!Object.prototype.hasOwnProperty.call(IND_TABS,k) || !TAB_META[k]) continue;
    _indTabsBackup[k]={label:TAB_META[k].label, icon:TAB_META[k].icon};
    TAB_META[k].label=IND_TABS[k].label;
    TAB_META[k].icon =IND_TABS[k].icon;
  }
  let hs=[];
  try{ hs=document.querySelectorAll("#v-dashboard h2"); }catch(e){}
  for(let i=0;i<hs.length;i++){
    const h=hs[i], t=h.textContent.replace(/^\s+|\s+$/g,"");
    if(Object.prototype.hasOwnProperty.call(IND_HEADS,t) && !h.getAttribute("data-ind-orig")){
      h.setAttribute("data-ind-orig",h.textContent);
      h.textContent=IND_HEADS[t];
    }
  }
  const b=document.querySelector(".brand-txt");
  if(b){ _indBrandBackup=b.innerHTML; b.innerHTML='ARC <b>MASALA</b>'; }
  try{ renderNav(); }catch(e){ console.warn("mode indien: renderNav",e); }
}

function indianRenameOff(){
  if(_indTabsBackup){
    for(const k in _indTabsBackup){
      if(!Object.prototype.hasOwnProperty.call(_indTabsBackup,k) || !TAB_META[k]) continue;
      TAB_META[k].label=_indTabsBackup[k].label;
      TAB_META[k].icon =_indTabsBackup[k].icon;
    }
    _indTabsBackup=null;
  }
  let hs=[];
  try{ hs=document.querySelectorAll("h2[data-ind-orig]"); }catch(e){}
  for(let i=0;i<hs.length;i++){
    hs[i].textContent=hs[i].getAttribute("data-ind-orig");
    hs[i].removeAttribute("data-ind-orig");
  }
  const b=document.querySelector(".brand-txt");
  if(b && _indBrandBackup!==null){ b.innerHTML=_indBrandBackup; _indBrandBackup=null; }
  try{ renderNav(); }catch(e){ console.warn("mode indien: renderNav",e); }
}

function indianPatchGroups(){
  let btns=[];
  try{ btns=document.querySelectorAll(".side-grp-h[data-gid]"); }catch(e){ return; }
  for(let i=0;i<btns.length;i++){
    const btn=btns[i];
    const g=IND_GROUPS[btn.getAttribute("data-gid")];
    if(!g) continue;
    const ic=btn.querySelector(".ico"), lb=btn.querySelector(".glbl");
    if(ic) ic.textContent=g.icon;
    if(lb) lb.textContent=g.label;
  }
}

const _renderNavBase = renderNav;
renderNav = function(){
  const r=_renderNavBase.apply(this,arguments);
  if(_indOn){ try{ indianPatchGroups(); }catch(e){} }
  return r;
};

const IND_KEYALIAS={Up:"ArrowUp",Down:"ArrowDown",Left:"ArrowLeft",Right:"ArrowRight"};
const IND_KEYCODE={38:"ArrowUp",40:"ArrowDown",37:"ArrowLeft",39:"ArrowRight",66:"b",65:"a"};

(function(){
  let buf=[];
  function onKey(e){
    try{
      const t=e.target;
      if(t && (t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable)){ buf=[]; return; }
      if(e.ctrlKey||e.metaKey||e.altKey){ buf=[]; return; }
      let k=e.key;
      if(typeof k!=="string"||!k) k=IND_KEYCODE[e.keyCode||e.which]||"";
      if(!k) return;
      if(IND_KEYALIAS[k]) k=IND_KEYALIAS[k];
      if(k.length===1) k=k.toLowerCase();
      buf.push(k);
      if(buf.length>IND_KONAMI.length) buf.shift();
      if(buf.length!==IND_KONAMI.length) return;
      for(let i=0;i<IND_KONAMI.length;i++){ if(buf[i]!==IND_KONAMI[i]) return; }
      buf=[];
      if(_indOn) indianOff(); else indianOn();
    }catch(err){ console.warn("mode indien: touche",err); }
  }
  try{ document.addEventListener("keydown",onKey,false); }catch(e){}
  try{
    document.addEventListener("visibilitychange",function(){
      if(!_indOn) return;
      if(document.hidden) indianAudioPause(); else indianAudioResume();
    },false);
  }catch(e){}
})();
