/* ARC ALPHA - Module historique.
   Timeline de arc_activity (texte libre). La categorie est deduite du texte
   par mots-cles : c'est fragile par nature, et la colonne `type` proposee
   dans le livrable base de donnees la rendrait exacte. Les lignes sensibles
   (comptes, mots de passe, remarques...) restent reservees aux CMD+ et a
   l'Amiraute, comme le Journal. */

let _histQ="";
const histSearchDebounced=debounce(v=>{_histQ=v;renderHistorique();},150);
function histReset(){_histQ="";const q=document.getElementById("histQ");if(q)q.value="";const c=document.getElementById("histCat");if(c)c.value="";const p=document.getElementById("histPeriod");if(p)p.value="30";renderHistorique();}

const HIST_CATS=[
  {id:"discipline",label:"Discipline",icon:"alert-triangle",color:"var(--rd)",rx:/bl[aâ]me|blacklist|exclu/i},
  {id:"absence",label:"Absences",icon:"clock",color:"var(--ye)",rx:/a déclaré une absence|absence de .* du /i},
  {id:"rapport",label:"Rapports et comptes rendus",icon:"file-text",color:"var(--ac)",rx:/rapport|compte rendu|comptes rendus|dispens/i},
  {id:"formation",label:"Formations et entraînements",icon:"graduation-cap",color:"var(--vi)",rx:/formation|entraînement|tâche|formé/i},
  {id:"mission",label:"Missions et CMD",icon:"swords",color:"var(--or)",rx:/mission|cmd|tirage/i},
  {id:"compte",label:"Comptes et réglages",icon:"key-round",color:"var(--dm)",rx:/compte "|mot de passe|rôle|connecté|maintenance|webhook|menus|règlement|formulaires|vitrine|recrutement (ouvert|fermé)/i},
  {id:"annonce",label:"Annonces et sondages",icon:"megaphone",color:"var(--or)",rx:/annonce|sondage/i},
  {id:"effectif",label:"Effectif et promotions",icon:"users",color:"var(--gr)",rx:/promu|grade|ajouté|supprimé|réserve|effectif|fiche|membre|cible|rétrograd|médaille|infos perso|remarque/i},
  {id:"autre",label:"Autre",icon:"circle",color:"var(--dm)",rx:/./}
];
function histCat(text){return HIST_CATS.find(c=>c.rx.test(text||""))||HIST_CATS[HIST_CATS.length-1];}
function histCanSeeSensitive(){
  if(!Auth.ok())return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  if(session.role==="brs")return false;
  return gradeLevel(getSessionGrade())>=6;
}
/* Met en gras le premier nom de compte ou matricule rencontre. */
function histLine(text){
  const t=esc(text||"");
  return t.replace(/^([^\s]{2,}(?:\s[^\s]{2,})?)\s(a |s'est |- )/,(m,a,b)=>`<b>${a}</b> ${b}`).replace(/(A-\d{1,3})/g,"<b>$1</b>");
}

function renderHistorique(){
  const body=document.getElementById("histBody"),cnt=document.getElementById("histCount"),tag=document.getElementById("histTag");
  if(!body)return;
  const sel=document.getElementById("histCat");
  if(sel&&sel.options.length<=1)HIST_CATS.forEach(c=>{const o=document.createElement("option");o.value=c.id;o.textContent=c.label;sel.appendChild(o);});
  const cat=sel?sel.value:"",days=parseInt((document.getElementById("histPeriod")||{}).value||"30",10);
  const since=days>0?new Date(Date.now()-days*864e5).toISOString():"";
  const sensitive=histCanSeeSensitive();
  const q=(_histQ||"").trim().toLowerCase();
  let rows=(state.activity||[]).filter(l=>l&&l.text);
  if(!sensitive)rows=rows.filter(l=>!isSensitiveLog(l.text));
  rows=rows.map(l=>({...l,cat:histCat(l.text)}));
  if(since)rows=rows.filter(l=>(l.created_at||"")>=since);
  if(cat)rows=rows.filter(l=>l.cat.id===cat);
  if(q)rows=rows.filter(l=>l.text.toLowerCase().includes(q));
  rows.sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||""));
  if(tag)tag.textContent=sensitive?"journal complet":"actions publiques";
  if(cnt)cnt.textContent=rows.length+(rows.length>1?" actions":" action")+(state.activity&&state.activity.length>=200?" · 200 dernières lignes chargées":"");
  if(!rows.length){body.innerHTML='<div class="empty"><p>Aucune action sur cette période.</p></div>';return;}
  let html="",day="";
  rows.forEach(l=>{
    const d=String(l.created_at||"").slice(0,10);
    if(d!==day){day=d;html+=`<div class="hist-day">${d?esc(new Date(d+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})):"Date inconnue"}</div>`;}
    const t=l.created_at?new Date(l.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):"";
    html+=`<div class="hist-row" style="--hc:${l.cat.color}"><span class="ic" title="${esc(l.cat.label)}">${navIconHtml(l.cat.icon)}</span><span class="t">${histLine(l.text)}</span><span class="d">${t}</span></div>`;
  });
  body.innerHTML=html;
  lucideRefresh(body);
}
