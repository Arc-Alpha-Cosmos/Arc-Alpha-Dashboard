/* ARC ALPHA - Demarrage, session, vitrine, maintenance, raccourcis clavier. */
window.addEventListener("DOMContentLoaded",async()=>{
  clearLegacyAssistant();
  initTooltips();
  initParticles();
  initFicheCdm();
  const paintOvDate=()=>{const el=document.getElementById("ovDate");if(el)el.textContent=new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});};
  paintOvDate();setInterval(paintOvDate,60000);setInterval(function(){try{ovRenderDeadline();}catch(e){}},60000);
  supaOK=true;
  showSkeletons();
  await loadAll();
  await Auth.restore();
  await discordConfigLoad();
  applyMaintenance();applyRec();renderContent();
  /* on regarde le repère avant de rendre, pour savoir où atterrir */
  const _cibleLien=ongletDuLien(false);
  renderDashboard();
  nav(_cibleLien?"dashboard":"home");
  schedulePoll();
  try{applyOverviewPref();}catch(e){}
  try{refreshNotifications();}catch(e){}
});


const TOUR_STEPS = [
  {icon:"🛡️", title:"Bienvenue dans le dashboard ARC Alpha",
   text:"Ce dashboard centralise toute la gestion de l'unité : effectif, discipline, missions, messagerie et plus. Voici un tour rapide. Tu peux le passer à tout moment."},
  {icon:"⌂", title:"Accueil & Mon espace",
   text:"La Vue d'ensemble montre l'état de l'unité d'un coup d'œil (effectif, présents, blâmes, rapports manquants). « Mon espace » est ta page perso : ton rapport de la semaine, ta progression vers le grade suivant, tes tâches, blâmes et médailles."},
  {icon:"▤", title:"Gestion de l'effectif",
   text:"L'Effectif liste tous les membres avec une barre de recherche (nom, matricule, grade, régiment). Clique sur un nom pour ouvrir sa fiche. Tu y trouves aussi les Réservistes, la Blacklist (avec bouton Ajouter), les Formations, Absences et Rapports."},
  {icon:"👤", title:"La fiche membre",
   text:"Chaque fiche regroupe : le Parcours (timeline chronologique des promotions, blâmes, formations, missions), les Médailles & décorations, les CMD de mission, blâmes, absences et rapports. Les informations perso et remarques officiers sont séparées et protégées selon ton grade."},
  {icon:"🎖️", title:"Médailles & décorations",
   text:"Huit décorations officielles B.O.S peuvent être attribuées (Ordre des Dix de Muunilinst, Croix d'Honneur, etc.). Les officiers MAJ+ les attribuent depuis l'onglet Médailles de la fiche ; elles s'affichent en badges colorés sur la fiche et dans Mon espace."},
  {icon:"◈", title:"Activité & missions",
   text:"Les Missions de l'unité, les points CMD gagnés en commandant des missions (remis à zéro à chaque promotion), et les Sondages."},
  {icon:"⚑", title:"Discipline & règlement",
   text:"Les Blâmes pour le suivi disciplinaire, les Annonces à épingler, et le Règlement complet avec éditeur de texte (mise en forme, couleurs, titres). Les rapports manquants déclenchent un avertissement le dimanche soir puis un blâme automatique 48h plus tard, sauf pour les membres en absence (désactivable par les VCMD+)."},
  {icon:"💬", title:"Messagerie directe",
   text:"Le bouton en bas à droite ouvre la messagerie : démarre une discussion avec n'importe quel membre, reçois les messages en direct avec notification sonore et indicateur « vu ». Les conversations les plus récentes remontent en haut."},
  {icon:"⌘", title:"Palette de commandes",
   text:"Appuie sur Ctrl+K (ou Cmd+K) n'importe où pour ouvrir la palette : navigue instantanément vers un onglet ou cherche un membre au clavier. Le raccourci le plus rapide du dashboard."},
  {icon:"🔒", title:"Permissions par grade",
   text:"Selon ton grade et ton rôle (Admin, Amirauté, BRS, membre), tu peux modifier certains onglets ou seulement les consulter. Tout s'adapte automatiquement - les officiers supérieurs débloquent plus d'actions."},
  {icon:"✓", title:"C'est parti !",
   text:"Tu connais l'essentiel. Explore à ton rythme, et souviens-toi de Ctrl+K pour aller vite. Bonne gestion, soldat ! 🫡"}
];
let _tourIdx = 0;

function startTour(){
  _tourIdx = 0;
  renderTourStep();
  document.getElementById("tourModal").classList.add("show");
}

function renderTourStep(){
  const step = TOUR_STEPS[_tourIdx];
  document.getElementById("tourIcon").textContent = step.icon;
  document.getElementById("tourTitle").textContent = step.title;
  document.getElementById("tourText").textContent = step.text;
  document.getElementById("tourDots").innerHTML = TOUR_STEPS.map((_,i)=>
    `<span style="width:7px;height:7px;border-radius:50%;background:${i===_tourIdx?"var(--ac)":"var(--ln)"};transition:background .2s"></span>`
  ).join("");
  document.getElementById("tourPrev").style.display = _tourIdx>0?"":"none";
  const next = document.getElementById("tourNext");
  next.textContent = _tourIdx===TOUR_STEPS.length-1 ? "Terminer" : "Suivant";
}

function tourStep(dir){
  _tourIdx += dir;
  if(_tourIdx >= TOUR_STEPS.length){ closeTour(); return; }
  if(_tourIdx < 0) _tourIdx = 0;
  renderTourStep();
}

function closeTour(){
  document.getElementById("tourModal").classList.remove("show");
  localStorage.setItem("arcTourSeen","1");
}

function maybeShowTour(){
  if(session && !localStorage.getItem("arcTourSeen")){
    setTimeout(()=>startTour(), 600);
  }
}

function initTooltips(){
  const tip = document.getElementById("globalTooltip");
  if(!tip) return;
  function positionTip(el){
    tip.style.display = "block";
    const r = el.getBoundingClientRect();
    const tw = 260;
    let left = r.left + r.width/2 - tw/2;
    if(left < 8) left = 8;
    if(left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
    const top = r.top - tip.offsetHeight - 10;
    tip.style.left = left + "px";
    tip.style.top  = top + "px";
    const arrowLeft = r.left + r.width/2 - left;
    tip.style.setProperty("--arrow-left", arrowLeft + "px");
  }
  document.addEventListener("mouseover", e=>{
    const el = e.target.closest(".info-help[data-tip]");
    if(!el) return;
    const title = el.dataset.tipTitle||"";
    const text  = el.dataset.tip||"";
    tip.innerHTML = (title?`<strong>${title}</strong>`:"") + text;
    positionTip(el);
  });
  document.addEventListener("mouseout", e=>{
    if(e.target.closest(".info-help[data-tip]")) tip.style.display = "none";
  });
  /* meme bulle au clavier : l'aide ne doit pas dependre de la souris */
  document.addEventListener("focusin", e=>{
    const el = e.target.closest&&e.target.closest(".info-help[data-tip]");
    if(!el) return;
    tip.innerHTML = (el.dataset.tipTitle?`<strong>${el.dataset.tipTitle}</strong>`:"") + (el.dataset.tip||"");
    positionTip(el);
  });
  document.addEventListener("focusout", e=>{
    if(e.target.closest&&e.target.closest(".info-help[data-tip]")) tip.style.display = "none";
  });
  document.addEventListener("scroll", ()=>{ tip.style.display="none"; }, true);
}

function openLogin(){if(!session)document.getElementById("loginModal").classList.add("show");}
function closeModal(id){document.getElementById(id).classList.remove("show");}

async function doLogin(){
  const u=document.getElementById("loginUser").value.trim();
  const p=document.getElementById("loginPass").value.trim();
  const err=document.getElementById("loginErr");
  const fail=(m)=>{err.textContent=m;err.classList.add("show");};
  err.classList.remove("show");
  if(!u||!p){fail("Remplis tous les champs");return;}
  if(Date.now()<_loginWait){fail("Trop de tentatives, patiente un instant");return;}
  const res=await Auth.login(u,cyrb53(u),cyrb53(p));
  if(res.err==="net"){fail("Base injoignable, réessaie");return;}
  if(res.err){
    _loginFails++;
    if(_loginFails>=3)_loginWait=Date.now()+Math.min(30000,2000*(_loginFails-2));
    fail("Identifiants incorrects");
    return;
  }
  _loginFails=0;_loginWait=0;
  await discordConfigLoad();
  closeModal("loginModal");
  document.getElementById("loginUser").value="";document.getElementById("loginPass").value="";
  updateNavUI();applyPermissionsUI();checkMyReportStatus();toast("Bienvenue "+session.user+" !","success");maybeShowTour();
  await logActivity(`${session.user} s'est connecté`);
  renderDashboard();
}

function doLogout(){
  Auth.destroy();
  stopChat();
  closeModal("accountModal");updateNavUI();nav("home");toast("Déconnecté","info");
}

function openAccount(){document.getElementById("accountModal").classList.add("show");
  if(!session)return;
  document.getElementById("accName").textContent=session.user;
  document.getElementById("accTitle").textContent=session.user;
  document.getElementById("accAv").textContent=(session.user[0]||"?").toUpperCase();
  document.getElementById("accAv").style.background=roleAvatarColor(session.role,(sessionMember()||{}).grade||session.grade);
  document.getElementById("accRole").textContent={admin:"ADMIN",brs:"BRS",amiraute:"AMIRAUTÉ"}[session.role]||"MEMBRE";
  document.getElementById("accRole").className="uc-role "+(session.role==="admin"?"admin":"member");
  document.getElementById("accDesc").textContent={
    admin:"Tu es administrateur. Accès total + gestion.",
    brs:"Bureau du Renseignement Sénatorial. Accès à tout le dashboard en lecture seule.",
    amiraute:"Amirauté. Accès complet au dashboard avec droits d'édition."
  }[session.role]||"Tu es membre de la ARC Alpha.";
}


function applyMaintenance(){
  const ms=document.getElementById("maint-screen"),mb=document.getElementById("maintBar");
  const isAdmin=Auth.ok()&&session.role==="admin";
  const shouldShow=state.maintenance&&!isAdmin;
  const wasShown=ms.classList.contains("show");
  if(shouldShow){
    ms.classList.add("show");
    setTimeout(()=>startMaintAnimation(),50);
  } else {
    ms.classList.remove("show");
    stopMaintAnimation();
  }
  if(state.maintenance&&isAdmin){
    mb.classList.add("show");
    const note=document.getElementById("maint-admin-note");
    if(note)note.style.display="block";
  } else {
    mb.classList.remove("show");
    const note=document.getElementById("maint-admin-note");
    if(note)note.style.display="none";
  }
  const mt=document.getElementById("maintToggle"),ml=document.getElementById("maintToggleLbl");
  if(mt)mt.classList.toggle("on",state.maintenance);
  if(ml)ml.textContent=state.maintenance?"Maintenance active":"Site en ligne";
}

async function toggleMaint(force){
  if(!Auth.ok()||session.role!=="admin"){toast("Accès admin requis","error");return;}
  state.maintenance=typeof force==="boolean"?force:!state.maintenance;
  if(supaOK)await setConfig("maintenance",state.maintenance);
  applyMaintenance();
  toast(state.maintenance?"Maintenance activée":"Maintenance désactivée",state.maintenance?"info":"success");
  await logActivity(`Maintenance ${state.maintenance?"activée":"désactivée"} par ${session.user}`);
}

function applyRec(){
  const rt=document.getElementById("recTitle"),rs=document.getElementById("recSub"),rb=document.getElementById("recBadge");
  const btn=document.getElementById("recApplyBtn"),hb=document.getElementById("heroRecBtn");
  const vr=document.getElementById("v-recruitment");
  if(vr){vr.classList.toggle("rec-open",state.recOpen);vr.classList.toggle("rec-closed",!state.recOpen);}
  if(rt)rt.textContent=state.recOpen?"Recrutement ouvert":"Recrutement fermé";
  if(rs)rs.textContent=state.recOpen?"Les candidatures sont acceptées":"Aucune candidature pour le moment";
  if(rb)rb.textContent=state.recOpen?"● OPEN":"● CLOSED";
  if(btn)btn.disabled=!state.recOpen;if(hb)hb.disabled=!state.recOpen;
  const rtt=document.getElementById("recToggle"),rl=document.getElementById("recToggleLbl");
  if(rtt)rtt.classList.toggle("on",state.recOpen);
  if(rl)rl.textContent=state.recOpen?"Recrutement ouvert":"Recrutement fermé";
}



async function toggleRec(){
  if(!Auth.ok()||session.role!=="admin"){toast("Accès admin requis","error");return;}
  state.recOpen=!state.recOpen;
  if(supaOK)await setConfig("recOpen",state.recOpen);
  applyRec();toast(state.recOpen?"Recrutement ouvert":"Recrutement fermé",state.recOpen?"success":"info");
  await logActivity(`Recrutement ${state.recOpen?"ouvert":"fermé"} par ${session.user}`);
}

function applyNow(){
  if(!state.recOpen){toast("Recrutement fermé","error");return;}
  window.open("https://docs.google.com/forms/d/e/1FAIpQLSc8kJahEjC6zjjd52mgFRXS9XUUp1mwOzY0CVf4fH6-XHVw9g/viewform","_blank");
}


function toggleEditMode(){
  if(!editMode && typeof indianIsOn==="function" && indianIsOn()) indianOff();
  editMode=!editMode;document.body.classList.toggle("edit-mode",editMode);
  document.getElementById("editToolbar").classList.toggle("show",editMode);
  document.getElementById("editModeBtn").textContent=editMode?"Désactiver l'édition":"Activer l'édition";
  document.querySelectorAll("[data-e]").forEach(el=>el.contentEditable=editMode?"true":"false");
}

async function resetVitrineTexts(){
  if(!Auth.ok()||session.role!=="admin"){toast("Réservé à l'administrateur","error");return;}
  const rx=/^(mission_|equip_|mem_rp|mem_bat|mem_catlabel)/;
  const keys=Object.keys(state.content||{}).filter(k=>rx.test(k));
  if(!keys.length){toast("Aucun texte personnalisé sur ces sections","info");return;}
  const ok=await uiConfirm({
    kicker:"// VITRINE",
    title:"Restaurer les textes d'origine",
    message:`${keys.length} texte(s) personnalisé(s) des sections Missions, Équipement et Membres légendaires seront effacés : le site reprendra les textes du fichier.\n\nLes autres contenus (accueil, présentation de l'unité, noms et bios des membres) ne sont pas touchés.`,
    okText:"Restaurer",cancelText:"Annuler",danger:true});
  if(!ok)return;
  const _rc=await contentMerge(o=>{keys.forEach(k=>delete o[k]);});
  if(_rc===null){toast("Base injoignable : rien n'a été restauré","error");return;}
  await logActivity(`${session.user} a restauré les textes d'origine de la vitrine`);
  toast("Textes restaurés - rechargement…","success");
  setTimeout(()=>location.reload(),900);
}

async function saveEdits(){
  if(!Auth.ok()||session.role!=="admin"){toast("Réservé à l'administrateur","error");return;}
  const st=document.getElementById("editSt");if(st)st.textContent="Sauvegarde…";
  const _wasIndian = (typeof indianIsOn==="function") && indianIsOn();
  if(_wasIndian) indianTextOff();
  const _txt={};
  document.querySelectorAll("[data-e]").forEach(el=>_txt[el.dataset.e]=el.textContent);
  if(_wasIndian) indianTextOn();
  const _sc=await contentMerge(o=>{Object.assign(o,_txt);});
  if(_sc===null){if(st)st.textContent="";toast("Base injoignable : la vitrine n'a pas été enregistrée","error");return;}
  if(st){st.textContent="✓ Sauvegardé";setTimeout(()=>st.textContent="",3000);}
  toast("Vitrine mise à jour","success");
}

function renderContent(){
  const _wasIndian = (typeof indianIsOn==="function") && indianIsOn();
  if(_wasIndian) indianTextOff();
  document.querySelectorAll("[data-e]").forEach(el=>{if(state.content[el.dataset.e])el.textContent=state.content[el.dataset.e];});
  if(_wasIndian) indianTextOn();
}


function initParticles(){
  const c=document.getElementById("fxc");if(!c)return;
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches){c.style.display="none";return;}
  try{
    const ctx=c.getContext("2d");if(!ctx)return;
    let w,h;const P=[];
    const resize=()=>{w=c.width=window.innerWidth;h=c.height=window.innerHeight;};
    resize();window.addEventListener("resize",resize);
    let mx=-1,my=-1;
    window.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;},{passive:true});
    const N=Math.min(55,Math.floor(window.innerWidth/22));
    for(let i=0;i<N;i++)P.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.5+.5});
    const LINK=110,LINK2=LINK*LINK;
    let raf=null;
    const tick=()=>{
      ctx.clearRect(0,0,w,h);
      for(let i=0;i<P.length;i++){
        const p=P[i];p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>w)p.vx*=-1;
        if(p.y<0||p.y>h)p.vy*=-1;
        const dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy);
        if(d>0&&d<LINK){p.x+=dx/d;p.y+=dy/d;}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fillStyle="rgba(0,229,255,.4)";ctx.fill();
        for(let j=i+1;j<P.length;j++){
          const q=P[j],ex=p.x-q.x,ey=p.y-q.y,d2=ex*ex+ey*ey;
          if(d2<LINK2){
            const dd=Math.sqrt(d2);
            ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
            ctx.strokeStyle=`rgba(0,229,255,${.12*(1-dd/LINK)})`;ctx.lineWidth=.5;ctx.stroke();
          }
        }
      }
      raf=requestAnimationFrame(tick);
    };
    /* Comme le radar : on ne lance pas la boucle si la page est chargee
       dans un onglet deja masque. L'ecouteur ci-dessous s'en chargera au
       moment ou elle redevient visible. */
    const start=()=>{if(raf===null&&!document.hidden)raf=requestAnimationFrame(tick);};
    const stop=()=>{if(raf!==null){cancelAnimationFrame(raf);raf=null;}};
    document.addEventListener("visibilitychange",()=>{document.hidden?stop():start();});
    start();
  }catch(e){console.warn("particles",e);}
}


let _maintT=0,_maintRAF=null,_maintLog=null;
const _matChars='01アイウエΩΨΔΛΣ∇⊕∈∉⊂⊃'.split('');
const _logLines=[
  '> INITIALISATION MODE MAINTENANCE...',
  '> SUSPENSION DES ACCÈS MEMBRES',
  '> SAUVEGARDE DES DONNÉES EN COURS',
  '> MODULE EFFECTIF: LOCKED',
  '> MODULE RAPPORTS: LOCKED',
  '> MODULE PRÉSENCES: LOCKED',
  '> ADMIN: ACCÈS MAINTENU',
  '> MISE À JOUR EN COURS...',
  '> ARC ALPHA BIENTÔT DE RETOUR'
];
let _logIdx=0;

function startMaintAnimation(){
  const bg=document.getElementById('maint-bg');
  const logEl=document.getElementById('maint-log');
  if(!bg)return;
  const bc=bg.getContext('2d');
  if(!bc)return;
  const screen=document.getElementById('maint-screen');
  bg.width=window.innerWidth||1200;
  bg.height=window.innerHeight||800;
  const W=bg.width,H=bg.height;
  const cw=13,ncols=Math.floor(W/cw);
  const cols=[];
  for(let i=0;i<ncols;i++)cols.push({
    x:i*cw+6,y:Math.random()*-H,
    spd:55+Math.random()*110,
    len:6+Math.floor(Math.random()*20),
    ac:Math.random()<.1
  });
  if(logEl){
    logEl.innerHTML='<span style="color:rgba(0,200,255,.6)">></span> DÉMARRAGE...<br>';_logIdx=0;
    if(_maintLog)clearInterval(_maintLog);
    _maintLog=setInterval(()=>{
      if(!logEl)return;
      if(_logIdx<_logLines.length){
        logEl.innerHTML+=_logLines[_logIdx]+'<br>';
        _logIdx++;
        logEl.scrollTop=logEl.scrollHeight;
      } else {
        _logIdx=0;logEl.innerHTML='';
      }
    },800);
  }
  function loop(ts){
    _maintT=(ts||0)/1000;
    const dt=0.016;
    bc.fillStyle='rgba(5,8,16,.15)';bc.fillRect(0,0,W,H);
    cols.forEach(col=>{
      col.y+=col.spd*dt;
      if(col.y-col.len*13>H){col.y=Math.random()*-200;col.spd=55+Math.random()*110;}
      for(let i=0;i<col.len;i++){
        const cy=col.y-i*13;if(cy<-13||cy>H)continue;
        const alpha=i===0?1:Math.max(0,1-i/col.len)*.75;
        bc.fillStyle=i===0
          ?(col.ac?`rgba(200,230,255,${alpha})`:`rgba(160,225,255,${alpha})`)
          :`rgba(0,${Math.round(130+alpha*80)},220,${alpha*.65})`;
        bc.font=(i===0?'500 ':'400 ')+'11px var(--fm),monospace';
        bc.textAlign='center';
        bc.fillText(_matChars[Math.floor((_maintT*6+i+col.x)%_matChars.length)],col.x,cy);
      }
    });
    bc.textAlign='left';
    _maintRAF=requestAnimationFrame(loop);
  }
  if(_maintRAF)cancelAnimationFrame(_maintRAF);
  _maintRAF=requestAnimationFrame(loop);
}

function stopMaintAnimation(){
  if(_maintRAF){cancelAnimationFrame(_maintRAF);_maintRAF=null;}
  if(_maintLog){clearInterval(_maintLog);_maintLog=null;}
}


function openGmodConnect(){
  document.getElementById("gmodModal").classList.add("show");
}
function copyGmodCmd(){
  const txt="connect cw.cosmos-community.fr";
  if(navigator.clipboard){
    navigator.clipboard.writeText(txt).then(()=>{
      const btn=document.getElementById("gmodCopyBtn");
      btn.textContent="✓ Copié !";btn.style.color="var(--gr)";
      setTimeout(()=>{btn.textContent="Copier";btn.style.color="";},2000);
    }).catch(()=>fallbackCopy(txt));
  } else fallbackCopy(txt);
}
function fallbackCopy(txt){
  const el=document.getElementById("gmodCmd");
  const range=document.createRange();range.selectNode(el);
  window.getSelection().removeAllRanges();window.getSelection().addRange(range);
  document.execCommand("copy");window.getSelection().removeAllRanges();
  const btn=document.getElementById("gmodCopyBtn");
  btn.textContent="✓ Copié !";btn.style.color="var(--gr)";
  setTimeout(()=>{btn.textContent="Copier";btn.style.color="";},2000);
}


function showSkeletons(){
  /* un squelette a la forme du contenu dans chaque tableau et chaque liste,
     tant que la premiere synchronisation n'est pas arrivee */
  document.querySelectorAll("#dashContent table.tbl tbody").forEach(tb=>{
    const n=tb.closest("table").querySelectorAll("thead th").length||6;
    tb.innerHTML=Array(4).fill(0).map(()=>`<tr><td colspan="${n}" style="padding:.3rem"><div class="skeleton sk-row"></div></td></tr>`).join("");
  });
  ["blamesList","announceList","pollsList","docCategories","misCards","persoList","allTasksList","ovActivity","ovKpis","calBody","histBody"].forEach(id=>{
    const el=document.getElementById(id);
    if(el&&!el.children.length)el.innerHTML='<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div>';
  });
  ["ovTotal","ovPresent","ovReserve","ovBlames"].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.dataset.val="0";
  });
}


document.querySelectorAll(".modal-bg").forEach(bg=>{
  bg.addEventListener("click",e=>{if(e.target===bg)bg.classList.remove("show");});
});

/* À l'ouverture d'une fenêtre, le clavier entre dedans : sinon la tabulation
   reste derrière le voile et on ne voit plus où on est. Sur petit écran on
   s'abstient, pour ne pas faire surgir le clavier tactile d'office. */
(function(){
  const champs="input:not([type=hidden]):not([disabled]),select,textarea";
  const obs=new MutationObserver(list=>{
    list.forEach(m=>{
      const el=m.target;
      if(!el.classList||!el.classList.contains("modal-bg"))return;
      if(!el.classList.contains("show")||el.id==="confirmModal")return;
      if(window.innerWidth<720)return;
      setTimeout(()=>{try{
        const f=el.querySelector(champs);
        if(f&&typeof f.focus==="function")f.focus({preventScroll:true});
      }catch(e){}},60);
    });
  });
  document.querySelectorAll(".modal-bg").forEach(m=>obs.observe(m,{attributes:true,attributeFilter:["class"]}));
})();
document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&(e.key==="k"||e.key==="K")){
    if(session){e.preventDefault();
      const ov=document.getElementById("cmdkOverlay");
      if(ov&&ov.classList.contains("open"))closeCmdK();else openCmdK();
    }
    return;
  }
  if(e.key!=="Escape")return;
  const cmdk=document.getElementById("cmdkOverlay");
  if(cmdk&&cmdk.classList.contains("open")){closeCmdK();return;}
  const open=[...document.querySelectorAll(".modal-bg.show")].filter(m=>m.id!=="confirmModal");
  if(open.length){open[open.length-1].classList.remove("show");return;}
  const mm=document.getElementById("mobMenu");
  if(mm&&mm.classList.contains("show")){closeMob();return;}
  if(_chatOpen)toggleChatPanel();
});


/* ============================================================
   Refonte 2026-11 : horloge, icones, tableaux, filtres, focus
   ============================================================ */
function renderClock(){
  const t=document.getElementById("hdrTime"),d=document.getElementById("hdrDate");
  const now=new Date();
  if(t)t.textContent=now.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  if(d)d.textContent=now.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
}
renderClock();setInterval(renderClock,30000);

/* Apres chaque rendu par innerHTML : icones, etiquettes et tri des tableaux,
   barres de filtres. Un seul observateur, regroupe par image d'ecran. */
(function(){
  let pending=false;
  const run=()=>{pending=false;try{lucideRefresh();}catch(e){}try{tablesEnhance();}catch(e){}try{filtersInit();filtersRefresh();}catch(e){}};
  const obs=new MutationObserver(list=>{
    if(pending)return;
    for(const m of list){
      if(m.type==="childList"&&m.addedNodes.length){
        /* on ignore les changements que l'on provoque soi-meme (svg des icones) */
        let real=false;
        m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.tagName!=="svg"&&n.tagName!=="SVG"&&n.tagName!=="path")real=true;});
        if(!real)continue;
        pending=true;requestAnimationFrame(run);return;
      }
    }
  });
  const app=document.getElementById("app");
  if(app)obs.observe(app,{childList:true,subtree:true});
  ["notifPanel","mobMenu","dashBottom","chatPanel","cmdkOverlay"].forEach(id=>{const e=document.getElementById(id);if(e)obs.observe(e,{childList:true,subtree:true});});
  run();
})();

/* Fenetres : le clavier reste dedans (Tab circule), et revient sur le bouton
   d'origine a la fermeture. */
(function(){
  let opener=null;
  const FOC="button:not([disabled]),[href],input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";
  document.addEventListener("pointerdown",e=>{const b=e.target.closest("button,[role=button]");if(b)opener=b;},true);
  document.addEventListener("keydown",e=>{
    if(e.key!=="Tab")return;
    const open=[...document.querySelectorAll(".modal-bg.show")].pop();
    if(!open)return;
    const box=open.querySelector(".modal")||open;
    const f=[...box.querySelectorAll(FOC)].filter(x=>x.offsetParent!==null);
    if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&(document.activeElement===first||!box.contains(document.activeElement))){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  const obs=new MutationObserver(list=>{
    list.forEach(m=>{
      const el=m.target;
      if(!el.classList||!el.classList.contains("modal-bg"))return;
      if(el.classList.contains("show")){el.setAttribute("aria-modal","true");el.setAttribute("role","dialog");fieldsClear(el.id);}
      else if(opener&&document.body.contains(opener)&&!document.querySelector(".modal-bg.show")){try{opener.focus({preventScroll:true});}catch(e){}}
    });
  });
  document.querySelectorAll(".modal-bg").forEach(m=>obs.observe(m,{attributes:true,attributeFilter:["class"]}));
})();

/* Echap ferme aussi le panneau des notifications. */
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&typeof _notifOpen!=="undefined"&&_notifOpen)toggleNotifPanel(false);});

/* Bandeau hors ligne : suit l'indicateur de synchronisation. */
function offlineBar(on){const b=document.getElementById("offlineBar");if(b)b.classList.toggle("show",!!on&&!!session);}

/* Raccourci « / » : place le curseur dans la recherche de l'onglet affiche,
   ou ouvre la recherche globale s'il n'en a pas. */
document.addEventListener("keydown",e=>{
  if(e.key!=="/"||e.ctrlKey||e.metaKey||e.altKey||!session)return;
  const t=e.target;
  if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable))return;
  if(document.querySelector(".modal-bg.show"))return;
  const tab=document.querySelector('.dash-tab[data-dtc="'+_activeTab+'"]');
  const inp=tab&&[...tab.querySelectorAll(".roster-search input")].find(x=>x.offsetParent!==null);
  e.preventDefault();
  if(inp)inp.focus();else openCmdK();
});
