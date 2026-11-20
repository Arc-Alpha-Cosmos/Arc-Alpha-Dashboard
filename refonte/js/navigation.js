/* ARC ALPHA - Navigation : vues publiques, groupes et onglets du dashboard, palette Ctrl+K. */
function nav(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("on"));
  document.querySelectorAll(".nav-tab[data-v]").forEach(t=>t.classList.toggle("on",t.dataset.v===view));
  const el=document.getElementById(`v-${view}`);if(el)el.classList.add("on");
  window.scrollTo({top:0,behavior:"instant"});
  if(view==="dashboard")renderDashboard();
  syncAppMode();
}

function cdmTab(id){
  const v=document.getElementById("v-fichecdm");
  if(!v)return;
  v.querySelectorAll("section").forEach(s=>s.classList.toggle("on",s.id===id));
  v.querySelectorAll(".cdm-tabs button").forEach(b=>b.classList.toggle("on",b.dataset.cdm===id));
  window.scrollTo({top:0,behavior:"instant"});
}
function initFicheCdm(){
  const v=document.getElementById("v-fichecdm");
  if(!v)return;
  v.querySelectorAll(".tabs button").forEach(b=>{
    b.addEventListener("click",()=>{
      v.querySelectorAll(".tabs button").forEach(x=>x.setAttribute("aria-selected",x===b?"true":"false"));
      const f=b.dataset.f;
      v.querySelectorAll("#vgrid .veh").forEach(el=>{el.hidden=!(f==="all"||el.dataset.k===f);});
    });
  });
  v.querySelectorAll(".var").forEach(g=>{
    g.addEventListener("click",e=>{
      const b=e.target.closest("button");
      if(!b)return;
      const pic=g.previousElementSibling;
      if(pic)pic.querySelectorAll("img").forEach((im,i)=>{im.hidden=String(i)!==String(b.dataset.i);});
      g.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"));
    });
  });
}

let _navEditDraft = null;

/* Ordre conseillé des onglets, déduit de l'organisation par défaut. Sert au
   bouton « Trier » : il range les onglets DANS chaque groupe sans jamais les
   déplacer d'un groupe à l'autre, donc une organisation sur mesure survit. */
function navCanonicalOrder(){
  const out=[];
  DEFAULT_NAV_GROUPS.forEach(g=>g.tabs.forEach(t=>{ if(out.indexOf(t)===-1)out.push(t); }));
  Object.keys(TAB_META).forEach(t=>{ if(out.indexOf(t)===-1)out.push(t); });
  return out;
}

function renderNavEditor(){
  const panel = document.getElementById("navEditorPanel");
  if(!panel) return;
  if(!canEditNav()){ panel.style.display="none"; return; }
  panel.style.display="block";

  if(!_navEditDraft) _navEditDraft = JSON.parse(JSON.stringify(_navGroups));

  const el = document.getElementById("navEditorGroups");
  const allTabs = Object.keys(TAB_META);
  const nb = _navEditDraft.length;

  el.innerHTML = _navEditDraft.map((g,gi)=>`
    <div class="nav-ed-grp">
      <div class="nav-ed-head">
        <input type="text" class="inline-inp nav-ed-ico" value="${esc(g.icon)}"
          onchange="updateNavGroupField(${gi},'icon',this.value)" title="Icône du groupe" aria-label="Icône du groupe">
        <input type="text" class="inline-inp nav-ed-name" value="${esc(g.label)}"
          onchange="updateNavGroupField(${gi},'label',this.value)" title="Nom du groupe" aria-label="Nom du groupe">
        <span class="nav-ed-count" title="${g.tabs.length} onglet${g.tabs.length>1?"s":""}">${g.tabs.length}</span>
      </div>
      <div class="nav-ed-tools">
        <button class="icon-btn" onclick="moveNavGroup(${gi},-1)"${gi===0?" disabled":""}
          title="Déplacer ce groupe vers la gauche" aria-label="Déplacer ce groupe vers la gauche">←</button>
        <button class="icon-btn" onclick="moveNavGroup(${gi},1)"${gi===nb-1?" disabled":""}
          title="Déplacer ce groupe vers la droite" aria-label="Déplacer ce groupe vers la droite">→</button>
        <span class="nav-ed-sep"></span>
        ${nb>1?`<button class="icon-btn del" onclick="removeNavGroup(${gi})"
          title="Supprimer le groupe" aria-label="Supprimer le groupe ${esc(g.label)}">✕</button>`:""}
      </div>
      <ul class="nav-ed-list">
        ${g.tabs.map((t,ti)=>{
          const meta = TAB_META[t]||{label:t,icon:""};
          return `<li class="nav-ed-tab">
            <span class="nav-ed-rank">${ti+1}</span>
            <span class="nav-ed-lbl" title="${esc(meta.label)}">${tabIcon(t)} ${esc(meta.label)}</span>
            <button class="icon-btn" onclick="moveTabInGroup(${gi},${ti},-1)"${ti===0?" disabled":""}
              title="Monter" aria-label="Monter ${esc(meta.label)}">↑</button>
            <button class="icon-btn" onclick="moveTabInGroup(${gi},${ti},1)"${ti===g.tabs.length-1?" disabled":""}
              title="Descendre" aria-label="Descendre ${esc(meta.label)}">↓</button>
            <button class="icon-btn del" onclick="moveTabFromGroup(${gi},'${escJs(t)}')"
              title="Retirer du groupe" aria-label="Retirer ${esc(meta.label)}">✕</button>
          </li>`;
        }).join("")||'<li class="nav-ed-empty">Aucun onglet dans ce groupe</li>'}
      </ul>
      <select class="inline-sel nav-ed-add" onchange="addTabToGroup(${gi},this.value);this.value=''"
        aria-label="Ajouter un onglet au groupe ${esc(g.label)}">
        <option value="">+ Ajouter un onglet…</option>
        ${allTabs.filter(t=>!g.tabs.includes(t)).map(t=>
          `<option value="${esc(t)}">${esc(TAB_META[t].label)}</option>`).join("")}
      </select>
    </div>`).join("");

  const orph=document.getElementById("navEditorOrphans");
  if(orph){
    const pris=new Set();
    _navEditDraft.forEach(g=>g.tabs.forEach(t=>pris.add(t)));
    const seuls=allTabs.filter(t=>!pris.has(t));
    orph.style.display=seuls.length?"":"none";
    orph.textContent=seuls.length
      ? "⚠ Hors de tout groupe, donc inaccessible : "+seuls.map(t=>TAB_META[t].label).join(", ")
      : "";
  }
}

/* Rang d'un onglet dans son groupe. */
function moveTabInGroup(gi,ti,dir){
  const g=_navEditDraft[gi];
  if(!g) return;
  const j=ti+dir;
  if(j<0||j>=g.tabs.length) return;
  const t=g.tabs.splice(ti,1)[0];
  g.tabs.splice(j,0,t);
  renderNavEditor();
}

/* Rang d'un groupe dans la barre. */
function moveNavGroup(gi,dir){
  const j=gi+dir;
  if(j<0||j>=_navEditDraft.length) return;
  const g=_navEditDraft.splice(gi,1)[0];
  _navEditDraft.splice(j,0,g);
  renderNavEditor();
}

/* Remet les onglets de chaque groupe dans l'ordre conseillé, sans toucher à
   la répartition entre groupes. */
function sortNavTabs(){
  const ordre=navCanonicalOrder();
  const rang=t=>{const i=ordre.indexOf(t);return i===-1?999:i;};
  let bouge=false;
  _navEditDraft.forEach(g=>{
    const avant=g.tabs.join("|");
    g.tabs.sort((a,b)=>rang(a)-rang(b));
    if(g.tabs.join("|")!==avant) bouge=true;
  });
  renderNavEditor();
  toast(bouge?"Onglets remis dans l'ordre conseillé":"Les onglets étaient déjà dans l'ordre",
        bouge?"success":"info");
}

function updateNavGroupField(gi,field,value){
  if(_navEditDraft[gi]) _navEditDraft[gi][field]=value;
}

function addTabToGroup(gi,tab){
  if(!tab) return;
  _navEditDraft.forEach(g=>{ g.tabs = g.tabs.filter(t=>t!==tab); });
  _navEditDraft[gi].tabs.push(tab);
  renderNavEditor();
}

function moveTabFromGroup(gi,tab){
  _navEditDraft[gi].tabs = _navEditDraft[gi].tabs.filter(t=>t!==tab);
  renderNavEditor();
}

function addNavGroup(){
  const id = "grp"+Date.now();
  _navEditDraft.push({id, label:"Nouveau groupe", icon:"●", tabs:[]});
  renderNavEditor();
}

async function removeNavGroup(gi){
  if(_navEditDraft.length<=1) return;
  if(!await uiConfirm({title:"Supprimer le groupe",message:"Supprimer ce groupe ? Ses onglets devront être réassignés.",okText:"Supprimer",danger:true})) return;
  _navEditDraft.splice(gi,1);
  renderNavEditor();
}

async function saveNavGroups(){
  if(!canEditNav()){toast("Accès insuffisant","error");return;}
  const allTabs = Object.keys(TAB_META);
  const assigned = new Set();
  _navEditDraft.forEach(g=>g.tabs.forEach(t=>assigned.add(t)));
  const orphans = allTabs.filter(t=>!assigned.has(t));
  if(orphans.length){
    const names = orphans.map(t=>TAB_META[t].label).join(", ");
    if(!await uiConfirm({title:"Onglets orphelins",message:`Ces onglets ne sont dans aucun groupe et seront inaccessibles : ${names}. Continuer quand même ?`,okText:"Continuer"})) return;
  }
  _navGroups = JSON.parse(JSON.stringify(_navEditDraft));
  const _nc=await contentMerge(o=>{o.navGroups=JSON.stringify(_navGroups);});
  if(_nc===null){toast("Base injoignable : l'organisation n'a pas été enregistrée","error");return;}
  toast("✓ Organisation des menus enregistrée","success");
  await logActivity(`Organisation des menus modifiée par ${session?.user}`);
  renderNav();
}

async function resetNavGroups(){
  if(!await uiConfirm({title:"Réinitialiser",message:"Réinitialiser l'organisation par défaut ?",okText:"Réinitialiser"})) return;
  _navEditDraft = JSON.parse(JSON.stringify(DEFAULT_NAV_GROUPS));
  renderNavEditor();
}


const DEFAULT_NAV_GROUPS = [
  {id:"accueil", label:"Accueil", icon:"⌂", tabs:["overview","monespace"]},
  {id:"gestion", label:"Gestion", icon:"▤", tabs:["roster","formations","entrainements","recrutements","reserve","blacklist","absences","reports","rapports"]},
  {id:"activite", label:"Activité", icon:"◈", tabs:["missions","cmd","polls","calendrier","stats"]},
  {id:"discipline", label:"Discipline", icon:"⚑", tabs:["blames","announce","reglement"]},
  {id:"ressources", label:"Ressources", icon:"▦", tabs:["documents","pantheon","personnages","tasks","historique","journal"]},
  {id:"admin", label:"Admin", icon:"⚙", tabs:["admin"]}
];

const TAB_META = {
  overview:{label:"Vue d'ensemble", icon:""},
  monespace:{label:"Mon espace", icon:"👤"},
  roster:{label:"Effectif", icon:""},
  formations:{label:"Formations", icon:"🎓"},
  entrainements:{label:"Entraînements", icon:"🎯"},
  recrutements:{label:"Recrutements", icon:"📝"},
  reserve:{label:"Réservistes", icon:"🛡"},
  blacklist:{label:"Blacklist", icon:"⛔"},
  absences:{label:"Absences", icon:""},
  reports:{label:"Rapports", icon:"", badge:"reportPulseBadge"},
  rapports:{label:"Comptes rendus", icon:"📝", badge:"rapportPulseBadge"},
  missions:{label:"Missions", icon:"⚔"},
  cmd:{label:"CMD Mission", icon:""},
  polls:{label:"Sondages", icon:"🗳"},
  blames:{label:"Blâmes", icon:""},
  announce:{label:"Annonces", icon:""},
  reglement:{label:"Règlement", icon:"📋"},
  pantheon:{label:"Panthéon", icon:"landmark"},
  personnages:{label:"Personnages connus", icon:"🎭"},
  documents:{label:"Documents", icon:"📁"},
  tasks:{label:"Tâches", icon:"✅"},
  journal:{label:"Journal", icon:"📜"},
  calendrier:{label:"Calendrier", icon:"calendar"},
  stats:{label:"Statistiques", icon:"bar-chart-3"},
  historique:{label:"Historique", icon:"history"},
  admin:{label:"Administration", icon:"⚙"}
};

let _navGroups = JSON.parse(JSON.stringify(DEFAULT_NAV_GROUPS));
let _activeGroup = "accueil";
let _activeTab = "overview";

function loadNavGroups(){
  try{
    if(state.content && state.content.navGroups){
      const parsed = typeof state.content.navGroups==="string"
        ? JSON.parse(state.content.navGroups) : state.content.navGroups;
      if(Array.isArray(parsed) && parsed.length) _navGroups = parsed;
    }
  }catch(e){console.warn("loadNavGroups",e);}
  try{
    for(const dg of DEFAULT_NAV_GROUPS){
      let grp = _navGroups.find(g=>g.id===dg.id);
      if(!grp){ _navGroups.push(JSON.parse(JSON.stringify(dg))); continue; }
      const present = new Set(_navGroups.flatMap(g=>g.tabs));
      dg.tabs.forEach((tab,i)=>{
        if(present.has(tab)) return;
        const prev = i>0 ? dg.tabs[i-1] : null;
        const pos = prev ? grp.tabs.indexOf(prev) : -1;
        if(pos>=0) grp.tabs.splice(pos+1,0,tab); else grp.tabs.push(tab);
        present.add(tab);
      });
    }
  }catch(e){console.warn("reconcile nav",e);}
  try{
    const known=new Set(Object.keys(TAB_META));
    _navGroups.forEach(g=>{g.tabs=g.tabs.filter(t=>known.has(t));});
  }catch(e){console.warn("cleanup nav",e);}
}

function canEditNav(){
  if(!Auth.ok()) return false;
  if(session.role==="admin") return true;
  if(session.role==="brs"||session.role==="amiraute") return false;
  const lvl = gradeLevel(getSessionGrade());
  return lvl>=6;
}

function canManageUsers(){
  if(!Auth.ok()) return false;
  if(session.role==="admin") return true;
  if(session.role==="amiraute") return true;
  if(session.role==="brs") return false;
  return gradeLevel(getSessionGrade())>=6;
}

/* Le panneau de recrutement de l'Administration, ouvert à partir du
   Vice-Commandant. Même forme que canEditNav, un cran plus bas. */
function canAdminRecrut(){
  if(!Auth.ok()) return false;
  if(session.role==="admin") return true;
  if(session.role==="brs"||session.role==="amiraute") return false;
  return gradeLevel(getSessionGrade())>=5;
}

function canViewTab(tab){
  if(!Auth.ok()) return false;
  if(session.role==="admin") return true;
  if(tab==="admin"){
    /* on entre dans l'onglet dès qu'un panneau s'y adresse à nous : chaque
       panneau se cache ensuite tout seul si le droit manque */
    return canManageUsers() || canEditNav() || canAdminRecrut() || canEditMissions();
  }
  if(tab==="journal"){
    if(session.role==="amiraute") return true;
    if(session.role==="brs") return false;
    return gradeLevel(getSessionGrade())>=6;
  }
  if(session.role==="brs" || session.role==="amiraute") return true;
  const lvl = gradeLevel(getSessionGrade());
  if(tab==="tasks") return lvl>=3;
  return true;
}

/* Icone par onglet (Lucide). TAB_META garde le champ `icon` pour le mode indien
   et la palette ; ici le nom d'icone de reference de chaque onglet. */
const TAB_ICONS={overview:"layout-dashboard",monespace:"user",roster:"users",formations:"graduation-cap",
  entrainements:"target",recrutements:"file-pen-line",reserve:"shield",blacklist:"ban",absences:"clock",
  reports:"file-check",rapports:"file-text",missions:"swords",cmd:"radio",polls:"vote",blames:"alert-triangle",
  announce:"megaphone",reglement:"clipboard-list",personnages:"drama",pantheon:"landmark",documents:"folder",tasks:"check-square",
  journal:"scroll-text",admin:"settings",calendrier:"calendar",stats:"bar-chart-3",historique:"history"};
const GROUP_ICONS={accueil:"home",gestion:"layout-list",activite:"activity",discipline:"flag",ressources:"library",admin:"settings"};
function tabIcon(t){
  const meta=TAB_META[t]||{};
  if(meta.icon&&!/^[a-z0-9-]+$/.test(meta.icon)&&!ICON_MAP[meta.icon])return esc(meta.icon); /* emoji du mode indien */
  return navIconHtml(meta.icon&&/^[a-z0-9-]+$/.test(meta.icon)?meta.icon:(TAB_ICONS[t]||"circle"));
}
function groupIcon(g){
  const s=String(g.icon||"").trim();
  if(s&&!ICON_MAP[s]&&!/^[a-z0-9-]+$/.test(s))return esc(s);
  return navIconHtml(s&&/^[a-z0-9-]+$/.test(s)?s:(ICON_MAP[s]||GROUP_ICONS[g.id]||"folder"));
}

/* Favoris : onglets epingles en tete de la barre laterale et dans les
   raccourcis de l'accueil. Garde dans le navigateur. */
function favTabs(){ const l=uiPrefs.get("favs",[]); return Array.isArray(l)?l.filter(t=>TAB_META[t]):[]; }
function toggleFav(tab,ev){
  if(ev){ev.stopPropagation();ev.preventDefault();}
  let l=favTabs();
  if(l.includes(tab))l=l.filter(t=>t!==tab); else l.push(tab);
  uiPrefs.set("favs",l);
  renderNav();
  if(_activeTab==="overview"&&typeof renderOvShortcuts==="function")renderOvShortcuts();
  toast(l.includes(tab)?`${TAB_META[tab].label} ajouté aux favoris`:`${TAB_META[tab].label} retiré des favoris`,"info");
}
function toggleSidebar(){
  const on=!uiPrefs.get("sideCollapsed",false);
  uiPrefs.set("sideCollapsed",on);
  applySidebarState();
}
function applySidebarState(){
  const side=document.getElementById("dashSide");if(!side)return;
  const on=!!uiPrefs.get("sideCollapsed",false);
  side.classList.toggle("collapsed",on);
  const b=document.getElementById("sideCollapseBtn");
  if(b){b.innerHTML=navIconHtml(on?"panel-left-open":"panel-left-close");b.title=on?"Déployer le menu":"Réduire le menu";b.setAttribute("aria-label",b.title);}
  lucideRefresh(side);
}

/* Pastilles « il y a quelque chose pour toi » : rapports dus, comptes rendus
   a relire, selon les memes regles qu'avant (checkMyReportStatus). */
function tabPulse(t){
  try{
    if(t==="reports"&&session){
      const me=memberById(session.memberId);
      if(me){const st=reportWeekStatus(me,getWeekKey(0));return st.due&&!st.done;}
    }
    if(t==="rapports")return rapBadgeCount()>0;
  }catch(e){}
  return false;
}

/* Compteur discret a droite d'un onglet : ce qui attend, pour le compte
   connecte et selon ses droits. null = rien a afficher. */
function tabCount(t){
  try{
    if(!Auth.ok())return null;
    const lvl=(session.role==="admin"||session.role==="amiraute")?99:gradeLevel(getSessionGrade());
    const one=(n,hot)=>n?{n:n>99?"99+":n,hot:!!hot}:null;
    if(t==="rapports")return one(rapBadgeCount(),true);
    if(t==="reports"&&lvl>=GRADE_LEVEL.CPT&&session.role!=="brs")return one(countRapportsAVerifier());
    if(t==="tasks"){const me=sessionMember();if(!me)return null;
      return one((state.tasks||[]).filter(x=>x.active&&x.assignee_member_id!=null&&String(x.assignee_member_id)===String(me.id)).length,true);}
    if(t==="polls")return one((state.polls||[]).filter(p=>p.active&&!isPollExpired(p)&&getMyVote(p.id)===null).length);
    if(t==="absences"){const d=ymdLocal(new Date());return one((state.absences||[]).filter(a=>a.start_date<=d&&d<=a.end_date).length);}
    if(t==="blames"&&lvl>=GRADE_LEVEL.MAJ)return one((state.blames||[]).filter(b=>!b.resolved).length);
    if(t==="admin"&&session.role==="admin")return one((state.tickets||[]).filter(x=>x.status==="open").length,true);
  }catch(e){}
  return null;
}
function sideItemHtml(t,fav){
  const meta=TAB_META[t]||{label:t,icon:""};
  const lock=canEditNav()?(canEdit(t)?"":`<span class="lock" title="Lecture seule pour la plupart des grades">${navIconHtml("lock")}</span>`):"";
  return `<button class="side-item${t===_activeTab?" on":""}" data-tab="${esc(t)}" onclick="dashTab('${escJs(t)}')" title="${esc(meta.label)}" ${t===_activeTab?'aria-current="page"':""}>
      <span class="ico">${tabIcon(t)}</span><span class="lbl">${esc(meta.label)}</span>${lock}
      <span class="pulse${tabPulse(t)?" show":""}"></span>${(c=>`<span class="cnt${c&&c.hot?" hot":""}"${c?"":" hidden"}>${c?c.n:""}</span>`)(tabCount(t))}
      <span class="fav${fav?" on":""}" role="button" tabindex="0" title="${fav?"Retirer des favoris":"Ajouter aux favoris"}" aria-label="${fav?"Retirer des favoris":"Ajouter aux favoris"}" onclick="toggleFav('${escJs(t)}',event)" onkeydown="if(event.key==='Enter'||event.key===' ')toggleFav('${escJs(t)}',event)">${navIconHtml("star")}</span>
    </button>`;
}

function renderNav(){
  loadNavGroups();
  const navEl=document.getElementById("dashNav");
  if(!navEl)return;
  const visibleGroups=_navGroups.filter(g=>g.tabs.some(t=>canViewTab(t)));
  if(!visibleGroups.find(g=>g.id===_activeGroup))_activeGroup=visibleGroups.length?visibleGroups[0].id:"accueil";
  const owning=visibleGroups.find(g=>g.tabs.includes(_activeTab));
  if(!owning||!canViewTab(_activeTab)){
    const g=visibleGroups.find(x=>x.id===_activeGroup)||visibleGroups[0];
    _activeTab=g?g.tabs.find(t=>canViewTab(t)):"overview";
  }else _activeGroup=owning.id;

  const favs=favTabs().filter(t=>canViewTab(t));
  let html="";
  if(favs.length){
    html+=`<div class="side-grp"><div class="side-grp-h"><span class="ico">${navIconHtml("star")}</span><span>Favoris</span></div>${favs.map(t=>sideItemHtml(t,true)).join("")}</div>`;
  }
  html+=visibleGroups.map(g=>`<div class="side-grp" data-gid="${esc(g.id)}">
      <div class="side-grp-h" data-gid="${esc(g.id)}"><span class="ico">${groupIcon(g)}</span><span class="glbl">${esc(g.label)}</span></div>
      ${g.tabs.filter(t=>canViewTab(t)).map(t=>sideItemHtml(t,favs.includes(t))).join("")}
    </div>`).join("");
  navEl.innerHTML=html;
  applySidebarState();

  /* barre basse (mobile) : 4 acces directs + menu */
  const bb=document.getElementById("dashBottom");
  if(bb){
    const quick=["overview","roster","reports","calendrier"].filter(t=>canViewTab(t)).slice(0,4);
    bb.style.display=session?"":"none";
    bb.innerHTML=quick.map(t=>`<button class="${t===_activeTab?"on":""}" onclick="dashTab('${escJs(t)}')" aria-label="${esc(TAB_META[t].label)}">${tabIcon(t)}<span>${esc(TAB_META[t].label.split(" ")[0])}</span>${tabPulse(t)?'<span class="hdr-badge show">!</span>':""}</button>`).join("")
      +`<button onclick="openMob()" aria-label="Tous les onglets">${navIconHtml("menu")}<span>Menu</span></button>`;
  }
  /* tiroir mobile : tous les groupes */
  const md=document.getElementById("mobDash");
  if(md){
    md.innerHTML=session?visibleGroups.map(g=>`<div class="mob-sec">${esc(g.label)}</div>`+
      g.tabs.filter(t=>canViewTab(t)).map(t=>`<button class="mob-item sub${t===_activeTab?" on":""}" onclick="goToTab('${escJs(t)}');closeMob()"><span class="ico">${tabIcon(t)}</span>${esc(TAB_META[t].label)}</button>`).join("")).join(""):"";
  }
  /* carte du compte, en pied de barre laterale */
  const su=document.getElementById("sideUser");
  if(su&&session){
    const m=sessionMember();
    const role={admin:"Administrateur",brs:"BRS",amiraute:"Amirauté"}[session.role]||(m?gradeLabel(m.grade):"Membre");
    su.innerHTML=`<button class="av" style="background:${roleAvatarColor(session.role,m&&m.grade)}" onclick="openAccount()" title="Mon compte" aria-label="Mon compte">${esc((session.user[0]||"?").toUpperCase())}</button>
      <div class="w"><div class="n">${esc(session.user)}</div><div class="r">${esc(role)}${m&&m.matricule?" · "+esc(m.matricule):""}</div></div>
      <button class="icon-btn" onclick="dashTab('monespace')" title="Mon espace" aria-label="Mon espace">${navIconHtml("user")}</button>
      <button class="icon-btn del" onclick="doLogout()" title="Se déconnecter" aria-label="Se déconnecter">${navIconHtml("log-out")}</button>`;
    lucideRefresh(su);
  }
  renderCrumbs();
  lucideRefresh(navEl);
  checkMyReportStatus();
}

function renderCrumbs(){
  const c=document.getElementById("dashCrumbs");if(!c)return;
  const g=_navGroups.find(x=>x.tabs.includes(_activeTab));
  const meta=TAB_META[_activeTab]||{label:_activeTab};
  c.innerHTML=`<button onclick="goToTab('overview')">${navIconHtml("home")} Dashboard</button>`
    +(g&&g.id!=="accueil"?`<span class="sep">›</span><button onclick="selectGroup('${escJs(g.id)}')">${esc(g.label)}</button>`:"")
    +`<span class="sep">›</span><span class="cur">${esc(meta.label)}</span>`;
  lucideRefresh(c);
}

function selectGroup(groupId){
  _activeGroup=groupId;
  const g=_navGroups.find(x=>x.id===groupId);
  if(g){
    const firstVisible=g.tabs.find(t=>canViewTab(t));
    if(firstVisible){_activeTab=firstVisible;dashTab(firstVisible);return;}
  }
  renderNav();
}

function dashTab(tab){
  if(!TAB_META[tab])tab="overview";
  _activeTab=tab;
  const owningGroup=_navGroups.find(g=>g.tabs.includes(tab));
  if(owningGroup)_activeGroup=owningGroup.id;
  document.querySelectorAll(".dash-tab").forEach(t=>t.style.display=t.dataset.dtc===tab?"block":"none");
  const meta=TAB_RENDER[tab];
  if(meta){
    const fn=window[meta.fn];
    if(typeof fn==="function"){try{fn();}catch(e){console.warn("dashTab: "+meta.fn,e);}}
  }
  applyPermissionsUI();
  renderNav();
  try{if(window.scrollY>200)window.scrollTo({top:0,behavior:"instant"});}catch(e){}
}

/* Mode application : dans le tableau de bord, la barre du haut devient une
   barre d'outils et le decor de la vitrine se retire. */
function syncAppMode(){
  const v=document.getElementById("v-dashboard");
  document.body.classList.toggle("app-mode",!!session&&!!v&&v.classList.contains("on"));
}
function updateNavUI(){
  try{syncAppMode();}catch(e){}
  const lb=document.getElementById("loginBtn"),uc=document.getElementById("userChip");
  const dl=document.getElementById("dashLock");
  if(session){
    lb.style.display="none";uc.style.display="flex";
    const ck=document.getElementById("cmdkHint"); if(ck)ck.style.display="flex";
    document.getElementById("ucName").textContent=session.user;
    document.getElementById("ucAv").textContent=(session.user[0]||"?").toUpperCase();
    const liveGrade=(sessionMember()||{}).grade||session.grade||"";
    document.getElementById("ucAv").style.background=roleAvatarColor(session.role,liveGrade);
    const displayGrade=liveGrade;
    const roleLabels={admin:"ADMIN",brs:"BRS",amiraute:"AMIRAUTÉ"};
    const displayRole=roleLabels[session.role]||(displayGrade||"MEMBRE");
    document.getElementById("ucRole").textContent=displayRole;
    document.getElementById("ucRole").className="uc-role "+(session.role==="admin"?"admin":"member");
    if(dl)dl.style.display="none";
    try{refreshNotifications();}catch(e){}
  }else{
    try{refreshNotifications();}catch(e){}
    const bb=document.getElementById("dashBottom"); if(bb)bb.style.display="none";
    const md=document.getElementById("mobDash"); if(md)md.innerHTML="";
    lb.style.display="flex";uc.style.display="none";
    const ck0=document.getElementById("cmdkHint"); if(ck0)ck0.style.display="none";
    if(dl)dl.textContent="🔒";
  }
}


/* Un lien du type .../#missions ouvre directement cet onglet du Dashboard.
   Le repère n'est lu qu'une fois : sans cela, chaque rendu y ramènerait et
   on ne pourrait plus changer d'onglet. Tant que la session n'est pas
   ouverte il n'est pas consommé, donc il survit à la connexion. */
let _lienOngletVu=false;
function ongletDuLien(consommer){
  if(_lienOngletVu)return null;
  let h="";
  try{ h=decodeURIComponent(String(location.hash||"")).replace(/^#/,"").trim(); }
  catch(e){ return null; }
  if(!h||!TAB_META[h])return null;
  if(!canViewTab(h))return null;
  if(consommer)_lienOngletVu=true;
  return h;
}

function renderDashboard(){
  const locked=document.getElementById("dashLocked"),content=document.getElementById("dashContent");
  if(!session){locked.style.display="flex";content.style.display="none";return;}
  locked.style.display="none";content.style.display="block";
  renderNav();
  dashTab(ongletDuLien(true)||_activeTab||"overview");
  applyPermissionsUI();
  try{applyOverviewPref();}catch(e){}
  try{refreshNotifications();}catch(e){}
  checkMyReportStatus();
  startChat();
  reconcileAbsenceStatus().then(ch=>{if(ch){renderRoster();renderOverview();refreshMemberViews();}});
  runWeeklyReportJobs();
  const cmdb=document.getElementById("cmdModeBtn");
  if(cmdb)cmdb.style.display=(Auth.ok()&&(session.role==="admin"||session.role==="brs"||session.role==="amiraute"||gradeLevel(getSessionGrade())>=4))?"":"none";
}


const TAB_RENDER={
  overview  :{fn:"renderOverview",  on:["members","blames","absences","reports","announces","cmdmissions","tasks"]},
  monespace :{fn:"renderMonEspace", on:["members","blames","reports","tasks","cmdmissions"]},
  roster    :{fn:"renderRoster",    on:["members","cmdmissions","formations"]},
  formations:{fn:"renderFormations",on:["formations","members"]},
  entrainements:{fn:"renderEntrainements",on:["activites","members"]},
  recrutements:{fn:"renderRecrutements",on:["config"]},
  reserve   :{fn:"renderReserve",   on:["members"]},
  blacklist :{fn:"renderBlacklist", on:["members"]},
  absences  :{fn:"renderAbsences",  on:["absences","members"]},
  reports   :{fn:"renderReports",   on:["reports","members"]},
  rapports  :{fn:"renderRapports",  on:["rapports","config"]},
  missions  :{fn:"renderMissions",  on:["missionlib","missionrot"]},
  cmd       :{fn:"renderCmd",       on:["cmdmissions","members"]},
  polls     :{fn:"renderPolls",     on:["polls","pollvotes"]},
  blames    :{fn:"renderBlames",    on:["blames"]},
  announce  :{fn:"renderAnnounces", on:["announces"]},
  reglement :{fn:"renderReglement", on:["config"]},
  personnages:{fn:"renderPersonnages", on:[]},
  pantheon  :{fn:"renderPantheon",  on:["config","members"]},
  documents :{fn:"renderDocuments", on:["documents"]},
  tasks     :{fn:"renderTasks",     on:["tasks","members"]},
  journal   :{fn:"renderJournal",   on:["activity"]},
  calendrier:{fn:"renderCalendrier",on:["absences","tasks","formations","activites","missionlib","missionrot","config"]},
  stats     :{fn:"renderStats",     on:["members","reports","blames","formations","activites","cmdmissions","config"]},
  historique:{fn:"renderHistorique",on:["activity"]},
  admin     :{fn:"renderAdmin",     on:["users","tickets","config"]}
};


function openMob(){document.getElementById("mobMenu").classList.add("show");document.getElementById("mobOv").classList.add("show");try{lucideRefresh();}catch(e){}}
function closeMob(){document.getElementById("mobMenu").classList.remove("show");document.getElementById("mobOv").classList.remove("show");}


function applyPermissionsUI(){
  if(!session)return;
  const btnMap={
    "[onclick=\'openMemberModal()\']":canEdit("roster"),
    "[onclick=\'openCmdModal()\']":canEdit("cmd"),
    "[onclick=\'openBlameModal()\']":canEdit("blames"),
    "[onclick=\'openAbsModal()\']":canEdit("absences"),
    "[onclick=\'openAnnounceModal()\']":canEdit("announces"),
    "[onclick=\'resetWeek()\']":canEdit("reports"),
  };
  Object.entries(btnMap).forEach(([sel,ok])=>{
    const el=document.querySelector(sel);if(el)el.style.display=ok?"":"none";
  });
}


let _cmdkItems=[],_cmdkSel=0;
function goToTab(tab){
  nav("dashboard");
  if(typeof dashTab==="function")dashTab(tab);
}
function openCmdK(){
  if(!session)return;
  document.getElementById("cmdkOverlay").classList.add("open");
  const inp=document.getElementById("cmdkInput");
  inp.value="";renderCmdK("");
  setTimeout(()=>{try{inp.focus();}catch{}},50);
}
function closeCmdK(){document.getElementById("cmdkOverlay").classList.remove("open");}
function renderCmdK(q){
  const box=document.getElementById("cmdkResults");
  const ql=(q||"").trim().toLowerCase();
  const tabs=Object.keys(TAB_META).filter(t=>{try{return canViewTab(t);}catch{return true;}})
    .map(t=>({type:"tab",id:t,label:TAB_META[t].label,icon:tabIcon(t)}))
    .filter(t=>!ql||t.label.toLowerCase().includes(ql));
  let members=[];
  if(ql){
    members=state.members.filter(m=>(m.categorie||"effectif")!=="blacklist")
      .filter(m=>[m.nom,m.matricule,m.grade].some(v=>v&&String(v).toLowerCase().includes(ql)))
      .slice(0,8)
      .map(m=>({type:"member",id:m.id,label:`${m.matricule||"?"} - ${m.nom||"?"}`,grade:m.grade||"",role:""}));
  }
  _cmdkItems=[];let html="";
  if(tabs.length){
    html+='<div class="cmdk-group">Navigation</div>';
    tabs.forEach(t=>{const i=_cmdkItems.length;_cmdkItems.push(t);
      html+=`<div class="cmdk-item" data-i="${i}" onclick="cmdkActivate(${i})">
        <div class="cmdk-item-ic">${t.icon}</div>
        <div class="cmdk-item-txt"><div class="cmdk-item-t">${esc(t.label)}</div></div>
        <span class="cmdk-item-k">Onglet</span></div>`;});
  }
  if(members.length){
    html+='<div class="cmdk-group">Membres</div>';
    members.forEach(mb=>{const i=_cmdkItems.length;_cmdkItems.push(mb);
      html+=`<div class="cmdk-item" data-i="${i}" onclick="cmdkActivate(${i})">
        <div class="cmdk-item-av" style="background:${roleAvatarColor(mb.role,mb.grade)}">${esc((mb.label[0]||"?").toUpperCase())}</div>
        <div class="cmdk-item-txt"><div class="cmdk-item-t">${esc(mb.label)}</div><div class="cmdk-item-s">${esc(mb.grade)}</div></div>
        <span class="cmdk-item-k">Fiche</span></div>`;});
  }
  if(canDebug()){
    const tools=[
      {type:"debug",icon:navIconHtml("wrench"),label:"Tests à faire",hint:"Ctrl+Shift+D",words:"tests à faire menu de débug diagnostic debug"}
    ].filter(t=>!ql||t.words.includes(ql));
    if(tools.length)html+='<div class="cmdk-group">Outils</div>';
    tools.forEach(t=>{const i=_cmdkItems.length;_cmdkItems.push({type:t.type});
      html+=`<div class="cmdk-item" data-i="${i}" onclick="cmdkActivate(${i})">
        <div class="cmdk-item-ic">${t.icon}</div>
        <div class="cmdk-item-txt"><div class="cmdk-item-t">${esc(t.label)}</div></div>
        <span class="cmdk-item-k">${esc(t.hint)}</span></div>`;});
  }
  if(!_cmdkItems.length)html='<div class="cmdk-empty">Aucun résultat pour « '+esc(q||"")+' »</div>';
  box.innerHTML=html;_cmdkSel=0;updateCmdkSel();
}
function updateCmdkSel(){
  document.querySelectorAll("#cmdkResults .cmdk-item").forEach((el,i)=>el.classList.toggle("sel",i===_cmdkSel));
  const sel=document.querySelector("#cmdkResults .cmdk-item.sel");
  if(sel)sel.scrollIntoView({block:"nearest"});
}
function cmdkKey(e){
  if(e.key==="ArrowDown"){e.preventDefault();_cmdkSel=Math.min(_cmdkSel+1,_cmdkItems.length-1);updateCmdkSel();}
  else if(e.key==="ArrowUp"){e.preventDefault();_cmdkSel=Math.max(_cmdkSel-1,0);updateCmdkSel();}
  else if(e.key==="Enter"){e.preventDefault();cmdkActivate(_cmdkSel);}
  else if(e.key==="Escape"){e.preventDefault();closeCmdK();}
}
function cmdkActivate(i){
  const it=_cmdkItems[i];if(!it)return;
  closeCmdK();
  if(it.type==="tab")goToTab(it.id);
  else if(it.type==="member")openMemberProfile(it.id);
  else if(it.type==="debug")openDebug();
}
