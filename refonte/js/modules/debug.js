/* ARC ALPHA - Module debug. */
const MANUAL_TESTS=[
  {id:"entrainements-base",v:1,date:"2026-09-23",zone:"Entraînements",titre:"L'enregistrement arrive bien en base",
   etapes:["Applique d'abord dans Supabase le SQL de création de la table ET la colonne participants, donnés par Claude",
     "Onglet Entraînements : clique sur « Nouvelle entrée », choisis le type Entraînement, mets un intitulé, coche deux membres, ajoute deux matricules dans « Autres participants » en tapant chacun puis Entrée, choisis l'officier qui valide, ajoute un commentaire, enregistre",
     "Recharge complètement la page (Ctrl + F5) et rouvre l'onglet",
     "Ouvre le site sur un autre appareil ou un autre navigateur"],
   attendu:"L'entrée est toujours là après rechargement, avec ses deux membres, ses deux participants en étiquettes, son commentaire et son officier. Elle apparaît aussi sur l'autre appareil. Si elle disparaît au rechargement, la table n'existe pas encore ou les politiques RLS la bloquent."},
  {id:"entrainements-rapport",v:1,date:"2026-09-23",zone:"Entraînements",titre:"Une entrée valide le rapport de chaque membre concerné",
   etapes:["Onglet Rapports, semaine courante : repère deux membres de l'effectif encore en « À valider », qui ne sont ni dispensés ni absents",
     "Onglet Entraînements : crée une entrée datée d'un jour de la semaine courante et coche ces deux membres",
     "Lis le message qui s'affiche en bas de l'écran, puis retourne dans l'onglet Rapports",
     "Regarde aussi le Journal"],
   attendu:"Le message annonce « Rapport validé pour 2 membres ». Dans Rapports, les deux membres sont passés à Validé. Le Journal porte une ligne par rapport validé automatiquement. Un membre déjà validé, dispensé ou absent n'est pas recompté."},
  {id:"entrainements-filtres",v:1,date:"2026-09-23",zone:"Entraînements",titre:"Filtres, historique et affichage sur téléphone",
   etapes:["Crée au moins trois entrées à des dates différentes, dont une de type Tâche",
     "Utilise le filtre « Tous les types », puis le filtre par membre, puis les deux ensemble",
     "Vérifie que la liste des membres à cocher est lisible : une case à cocher normale à gauche, le nom sur une seule ligne, le grade à droite. Vérifie aussi qu'un matricule tapé puis validé par Entrée devient une étiquette, et que la croix le retire. Survole l'intitulé d'une entrée qui a un commentaire, et la colonne des membres d'une entrée qui en a plus de trois",
     "Ouvre l'onglet sur ton téléphone"],
   attendu:"L'historique est trié de la date la plus récente à la plus ancienne. Les filtres réduisent la liste et le compteur suit. Le commentaire et la liste complète des membres apparaissent au survol. Sur téléphone, le tableau reste lisible et la fenêtre d'ajout garde son titre et ses boutons visibles."},
  {id:"entrainements-droits",v:1,date:"2026-09-23",zone:"Entraînements",titre:"Droits d'ajout et de suppression",
   etapes:["Connecte-toi avec un compte de grade SGT (ou demande à un SGT) : ouvre l'onglet Entraînements",
     "Fais la même chose avec un compte de grade ARC",
     "Avec un compte MAJ ou plus, regarde les boutons au bout d'une ligne"],
   attendu:"Le SGT voit le bouton « Nouvelle entrée » et peut modifier. L'ARC voit l'onglet et l'historique mais aucun bouton d'ajout ni de modification. Seul un MAJ et plus (ou un CPT porteur de la tâche effectif) voit la corbeille de suppression."},
  {id:"vitrine-restauration",v:1,date:"2026-09-16",zone:"Vitrine publique",titre:"Textes Missions et Équipement à jour",
   etapes:["Administration, panneau « Édition de la vitrine » : clique sur « Restaurer les textes d'origine » et confirme",
     "Après le rechargement, ouvre l'accueil et descends jusqu'aux sections Missions et Équipement"],
   attendu:"Missions : contre-terrorisme, élimination stratégique, sabotage tactique, libération d'otages, reconnaissance avancée, missions impossibles. Équipement : Blaster M5, DC-17S et DC-15, Z-6 et Quad Blaster, PLX-1 et grenades, jetpack et grappin, dispositifs avancés."},
  {id:"debug-raccourci",v:1,date:"2026-09-16",zone:"Menu de débug",titre:"Raccourci clavier et copie du rapport",
   etapes:["Appuie sur Ctrl + Shift + D : le menu s'ouvre. Appuie de nouveau : il se ferme",
     "Rouvre-le et clique sur « Copier le rapport pour Claude »",
     "Colle le résultat dans un bloc-notes"],
   attendu:"Le texte collé commence par « RAPPORT DE DIAGNOSTIC ARC ALPHA » et contient les vérifications et la liste des tests manuels."},
  {id:"fenetres-taille",v:1,date:"2026-09-16",zone:"Interface",titre:"Taille du menu de débug",
   etapes:["Ouvre ce menu sur ton écran d'ordinateur","Ouvre-le ensuite sur ton téléphone"],
   attendu:"Le titre et les boutons du bas restent visibles dans les deux cas, seul le contenu défile."},
  {id:"dispense-semaines",v:1,date:"2026-09-16",zone:"Rapports",titre:"Dispense manuelle limitée à ses semaines",
   etapes:["Onglet Rapports, semaine courante : clique sur « Dispenser » pour un membre et donne un motif",
     "Passe à la semaine précédente et regarde ce membre",
     "Reviens à la semaine courante et clique sur « Rétablir »",
     "Regarde le Journal, puis l'activité récente de la Vue d'ensemble"],
   attendu:"Le membre passe en « Dispensé (manuel) » sur la semaine courante seulement. Après « Rétablir », il redevient « À valider ». Les deux actions figurent au Journal mais pas dans l'activité récente."},
  {id:"absence-moitie-semaine",v:2,date:"2026-09-17",zone:"Rapports",titre:"Une absence dispense à partir de 4 jours dans la semaine",
   etapes:["Onglet Absences : crée une absence de test pour un membre de l'effectif qui n'a aucune absence, sur 3 jours de la semaine courante (par exemple du lundi au mercredi)",
     "Onglet Rapports, semaine courante : regarde ce membre",
     "Supprime cette absence et recrée-la sur 4 jours de la même semaine (par exemple du lundi au jeudi), puis regarde de nouveau",
     "Recrée-la enfin sur deux périodes séparées de 2 jours chacune dans la semaine, regarde, puis supprime les absences de test"],
   attendu:"Avec 3 jours, le membre reste « À valider ». Avec 4 jours, puis avec 2 + 2 jours, il passe « Absent » et le survol indique 4 jours sur cette semaine. Après suppression, il redevient « À valider »."},
  {id:"automatisation-semaine",v:2,date:"2026-09-17",zone:"Rapports",titre:"Activation de l'automatisation à partir de la semaine courante",
   etapes:["Onglet Rapports, panneau « Automatisation des rapports » : si l'interrupteur est activé, désactive-le d'abord",
     "Active-le, lis le message de confirmation, puis ouvre l'onglet Blâmes"],
   attendu:"Le message indique « activée à partir de la semaine du » suivi du lundi de la semaine courante. Aucun blâme automatique n'est créé pour les semaines d'avant. Le Journal contient la même mention."},
  {id:"historique-fige",v:2,date:"2026-09-17",zone:"Rapports",titre:"Historique figé d'une semaine terminée",
   etapes:["Attends qu'une semaine soit terminée depuis plus de 48 h (à partir du mercredi suivant)",
     "Ouvre le tableau de bord avec ton compte, puis l'onglet Rapports, et clique sur la flèche de gauche pour afficher cette semaine",
     "Dans le menu de débug, « Copier le rapport pour Claude » : regarde la ligne « Historique des semaines »"],
   attendu:"Le titre de la semaine se termine par « historique figé », et la ligne du rapport indique [ok]. Une promotion ou une absence modifiée après coup ne change plus les statuts de cette semaine."},
  {id:"grade-session-promotion",v:1,date:"2026-09-17",zone:"Profil",titre:"Le grade affiché suit une promotion sans reconnexion",
   etapes:["Ouvre le site dans deux navigateurs : l'un avec ton compte administrateur, l'autre avec le compte d'un membre lié à une fiche",
     "Avec l'administrateur, change le grade de ce membre (onglet Effectif ou sa fiche)",
     "Sans recharger, attends une vingtaine de secondes dans le navigateur du membre, puis regarde le badge en haut à droite et ouvre « Mon espace »"],
   attendu:"Le badge en haut à droite affiche le nouveau grade, avec sa couleur, comme Mon espace et l'Effectif. Les onglets et boutons correspondent aux droits du nouveau grade."},
  {id:"formation-rapport",v:1,date:"2026-09-16",zone:"Formations",titre:"Une formation valide le rapport du formateur",
   etapes:["Onglet Formations : « Nouvelle formation » avec un formateur SGT ou LT dont le rapport de la semaine n'est pas encore validé",
     "Enregistre, puis ouvre l'onglet Rapports"],
   attendu:"Le message de confirmation indique « Rapport validé pour ... », et le rapport du formateur est coché sur la semaine de la date de formation."},
  {id:"cmd-rapport",v:1,date:"2026-09-17",zone:"CMD de Mission",titre:"Un CMD de mission valide le rapport du membre",
   etapes:["Section CMD de Mission : « Ajouter » pour un membre dont le rapport de la semaine n'est pas encore validé",
     "Laisse la date du jour, choisis Chef ou Second, puis « Enregistrer »",
     "Ouvre l'onglet Rapports, semaine courante"],
   attendu:"Le message de confirmation indique « CMD enregistré. Rapport validé pour ... », le membre est coché dans Rapports et le Journal indique « validé automatiquement ... suite à un CMD de mission »."},
  {id:"formation-sgt",v:1,date:"2026-09-16",zone:"Formations",titre:"Types de formation limités pour un SGT",
   etapes:["Connecte-toi avec un compte lié à un membre SGT",
     "Onglet Formations : « Nouvelle formation »",
     "Ouvre la liste Formation"],
   attendu:"La liste ne propose que ARC Trooper et CMD de mission, et aucun bouton « Modifier » n'apparaît sur les formations ARC Alpha."},
  {id:"blame-levee",v:1,date:"2026-09-16",zone:"Blâmes",titre:"Levée d'un blâme avec justificatif",
   etapes:["Onglet Blâmes : sur un blâme actif, clique sur « Résoudre »",
     "Valide sans rien écrire, puis recommence avec un justificatif",
     "Ouvre le formulaire d'un nouveau blâme pour ce membre, sans l'enregistrer"],
   attendu:"Sans texte, la levée est refusée. Avec un justificatif, le blâme passe en levé, et le niveau proposé pour le blâme suivant en tient compte."},
  {id:"messagerie-suppression",v:1,date:"2026-09-16",zone:"Messagerie",titre:"Suppression d'une conversation",
   etapes:["Ouvre la messagerie avec la bulle en bas à droite",
     "Sur une conversation de test, clique sur la corbeille et confirme"],
   attendu:"La conversation disparaît de ta liste, et aussi chez l'autre personne."}
];

const MANUAL_STATUS={
  todo:{label:"À faire",color:"var(--ye)"},
  ok:{label:"Fonctionne",color:"var(--gr)"},
  ko:{label:"Ne fonctionne pas",color:"var(--rd)"}
};

function manualTestState(def){
  const r=(state.manualTests||{})[def.id]||null;
  if(!r||!MANUAL_STATUS[r.status]||r.status==="todo")return{status:"todo",r,stale:false};
  if((r.v||1)<def.v)return{status:"todo",r,stale:true};
  return{status:r.status,r,stale:false};
}
function manualTestCounts(){
  const c={todo:0,ok:0,ko:0};
  MANUAL_TESTS.forEach(d=>{c[manualTestState(d).status]++;});
  return c;
}

async function configMerge(key,current,mutate){
  let base=current||{};
  if(supaOK){
    const rows=await supaGet(T.config,`key=eq.${key}`);
    if(rows===null)return null;
    if(rows.length){try{const p=JSON.parse(rows[0].value);if(p&&typeof p==="object")base=p;}catch(e){}}
  }
  const next={...base};
  mutate(next);
  if(supaOK)await setConfig(key,next);
  return next;
}

async function refreshManualTests(){
  if(!supaOK)return;
  const rows=await supaGet(T.config,"key=eq.manualTests");
  if(rows===null)return;
  if(!rows.length){state.manualTests={};return;}
  try{const p=JSON.parse(rows[0].value);if(p&&typeof p==="object")state.manualTests=p;}catch(e){}
}

async function setManualTest(id,status){
  if(!canDebug())return;
  const def=MANUAL_TESTS.find(t=>t.id===id);
  if(!def||!MANUAL_STATUS[status])return;
  let note="";
  if(status==="ko"){
    const prev=(state.manualTests||{})[id];
    const txt=await uiPrompt({kicker:"// TEST MANUEL",title:"Qu'est-ce qui ne marche pas ?",
      message:`${def.titre}\n\nDécris ce que tu as fait, ce que tu as vu, et le message d'erreur s'il y en a un.`,
      placeholder:"Ex : rien ne se passe au clic, message « ... »",
      defaultValue:prev&&prev.status==="ko"?prev.note||"":"",okText:"Enregistrer"});
    if(txt===null)return;
    note=String(txt).trim();
    if(note.length<3){toast("Décris le problème en quelques mots","error");return;}
  }
  const entry=status==="todo"?null:{status,note,v:def.v,by:session.user,at:new Date().toISOString()};
  const next=await configMerge("manualTests",state.manualTests,o=>{if(entry)o[id]=entry;else delete o[id];});
  if(next===null){toast("Supabase injoignable, résultat non enregistré","error");return;}
  state.manualTests=next;
  if(!supaOK)saveLS();
  renderDebug();
  updateDebugBtn();
  toast(status==="ok"?"Test validé":status==="ko"?"Problème noté":"Test remis à faire",status==="ko"?"info":"success");
}

function updateDebugBtn(){
  const b=document.getElementById("debugOpenBtn");
  if(!b)return;
  const mt=manualTestCounts(),pending=mt.todo+mt.ko;
  b.textContent=pending?`Ouvrir les tests (${pending} en attente)`:"Ouvrir les tests";
}

function renderManualTests(){
  const rank={ko:0,todo:1,ok:2};
  const list=MANUAL_TESTS.map(def=>Object.assign({def},manualTestState(def)))
    .sort((a,b)=>rank[a.status]-rank[b.status]||String(b.def.date).localeCompare(String(a.def.date)));
  const c=manualTestCounts();
  const small="padding:.26rem .55rem;font-size:.6rem";
  const item=x=>{
    const d=x.def,st=MANUAL_STATUS[x.status],r=x.r;
    const btn=(s,label,cls)=>x.status===s?"":
      `<button class="sbtn${cls?" "+cls:""}" style="${small}" onclick="setManualTest('${escJs(d.id)}','${s}')">${label}</button>`;
    const noteLine=r&&r.status==="ko"&&r.note
      ?`<div style="margin-top:.35rem;font-size:.7rem;color:${x.stale?"var(--dm)":"var(--rd)"};word-break:break-word">${x.stale?"Ancienne note":"Ta note"} : ${esc(r.note)}</div>`:"";
    const who=r&&r.at?` · ${esc(r.by||"?")}, ${fmtDate(r.at)}`:"";
    return `<div style="padding:.5rem .65rem;margin-bottom:.4rem;border:1px solid var(--ln);border-left:2px solid ${st.color};background:var(--s2)">
      <div style="display:flex;gap:.6rem;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1 1 260px;min-width:0">
          <div style="font-size:.78rem;font-weight:600;color:var(--tx)">${x.fresh?'<span style="font-family:var(--fm);font-size:.6rem;letter-spacing:.08em;color:var(--bg,#050810);background:var(--ac);padding:.08rem .35rem;margin-right:.4rem;vertical-align:middle">NOUVEAU</span>':""}${esc(d.titre)}</div>
          <div style="font-family:var(--fm);font-size:.6rem;color:var(--dm);margin-top:.1rem">${esc(d.zone)} · ajouté le ${fmtDate(d.date)} · <span style="color:${st.color}">${st.label}${x.stale?", à retester":""}</span>${x.status!=="todo"?who:""}</div>
        </div>
        <div style="display:flex;gap:.3rem;flex-wrap:wrap">
          ${btn("ok","Ça marche","green")}${x.status==="ko"
            ?`<button class="sbtn danger" style="${small}" onclick="setManualTest('${escJs(d.id)}','ko')">Modifier la note</button>`
            :btn("ko","Ça ne marche pas","danger")}${x.status!=="todo"?btn("todo","Pas encore fait",""):""}
        </div>
      </div>
      <details data-k="how-${d.id}" style="margin-top:.3rem">
        <summary style="cursor:pointer;font-size:.66rem;color:var(--ac)">Comment tester</summary>
        <ol style="margin:.35rem 0 .3rem 1.1rem;padding:0;font-size:.72rem;color:var(--tx2);line-height:1.55">${d.etapes.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
        <div style="font-size:.72rem;color:var(--tx2);line-height:1.5"><span style="color:var(--gr);font-weight:600">Résultat attendu :</span> ${esc(d.attendu)}</div>
      </details>
      ${noteLine}
    </div>`;
  };
  const newest=MANUAL_TESTS.reduce((m,t)=>String(t.date)>m?String(t.date):m,"");
  list.forEach(x=>{x.fresh=x.status==="todo"&&String(x.def.date)===newest;});
  const fresh=list.filter(x=>x.fresh);
  const todo=list.filter(x=>x.status==="todo"&&!x.fresh);
  const failed=list.filter(x=>x.status==="ko");
  const done=list.filter(x=>x.status==="ok");
  const title=(t,color)=>`<div style="font-family:var(--fm);font-size:.6rem;letter-spacing:.12em;color:${color};margin:1.1rem 0 .45rem">${t}</div>`;
  const hint=t=>`<div style="font-size:.72rem;color:var(--tx2);margin:-.2rem 0 .5rem">${t}</div>`;
  const chip=(n,label,color)=>`<div style="flex:1 1 130px;padding:.45rem .7rem;border:1px solid var(--ln);border-left:2px solid ${color};background:var(--s2)">
    <div style="font-weight:700;font-size:1.05rem;color:${color}">${n}</div>
    <div class="mono-xs">${label}</div></div>`;
  let html=`<p style="font-size:.78rem;color:var(--tx2);line-height:1.55;margin:0 0 .8rem">Voici ce que Claude te demande de vérifier sur le site. Pour chaque test, ouvre « Comment tester », fais les étapes, puis clique sur la réponse qui correspond. Tes réponses sont enregistrées tout de suite : Claude les lit au début de la séance suivante.</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
      ${chip(c.todo,"à faire","var(--ye)")}${chip(c.ko,"ne marche pas","var(--rd)")}${chip(c.ok,`validé${c.ok>1?"s":""}`,"var(--gr)")}
    </div>`;
  if(fresh.length)html+=title(`// NOUVEAUX TESTS DU ${fmtDate(newest).toUpperCase()} (${fresh.length})`,"var(--ac)")+fresh.map(item).join("");
  if(todo.length)html+=title(`// ENCORE À FAIRE (${todo.length})`,"var(--ye)")+todo.map(item).join("");
  if(failed.length)html+=title(`// NE MARCHE PAS (${failed.length})`,"var(--rd)")
    +hint("Claude doit corriger ces points. Il te redemandera le test une fois la correction faite.")+failed.map(item).join("");
  if(!fresh.length&&!todo.length&&!failed.length)
    html+=`<div style="margin-top:1rem;font-size:.8rem;color:var(--gr)">Rien à tester pour l'instant. Les prochaines vérifications apparaîtront ici.</div>`;
  if(done.length)html+=`<details data-k="tests-done" style="margin-top:1.1rem"><summary style="cursor:pointer;font-family:var(--fm);font-size:.6rem;letter-spacing:.12em;color:var(--gr)">// DÉJÀ VALIDÉS (${done.length})</summary><div style="margin-top:.45rem;opacity:.75">${done.map(item).join("")}</div></details>`;
  return html;
}

function manualTestsReport(){
  const L=[];
  const c=manualTestCounts();
  L.push(`TESTS MANUELS (${c.todo} à faire, ${c.ko} en échec, ${c.ok} validés)`);
  MANUAL_TESTS.forEach(d=>{
    const x=manualTestState(d);
    const tag=x.status==="ok"?"[ok]":x.status==="ko"?"[KO]":"[à faire]";
    let line=`${tag} ${d.id} v${d.v} : ${d.titre}`;
    if(x.stale&&x.r)line+=` (à retester, ancien résultat ${x.r.status} en v${x.r.v||1})`;
    if(x.r&&x.r.status==="ko"&&x.r.note)line+=` | note : ${x.r.note}`;
    if(x.r&&x.r.at&&x.status!=="todo")line+=` | ${x.r.by||"?"}, ${x.r.at.slice(0,16).replace("T"," ")}`;
    L.push(line);
  });
  return L.join("\n");
}

function canDebug(){return Auth.ok()&&session.role==="admin";}
async function openDebug(){
  if(!canDebug()){toast("Réservé à l'administrateur","error");return;}
  renderDebug();
  const m=document.getElementById("debugModal");
  if(m)m.classList.add("show");
  await refreshManualTests();
  if(m&&m.classList.contains("show"))renderDebug();
}
document.addEventListener("keydown",e=>{
  if(!e.ctrlKey||!e.shiftKey)return;
  if(e.key!=="D"&&e.key!=="d")return;
  if(!canDebug())return;
  e.preventDefault();
  const m=document.getElementById("debugModal");
  if(m&&m.classList.contains("show"))closeModal("debugModal");else openDebug();
});

function debugStats(){
  const g=k=>Array.isArray(state[k])?state[k].length:0;
  return{members:g("members"),users:g("users"),blames:g("blames"),absences:g("absences"),
    reports:g("reports"),formations:g("formations"),cmdmissions:g("cmdmissions"),
    tasks:g("tasks"),polls:g("polls"),documents:g("documents"),announces:g("announces"),
    tickets:g("tickets"),activity:g("activity")};
}

function debugChecks(){
  const out=[],add=(ok,label,detail)=>out.push({ok:!!ok,label,detail:detail||""});
  const age=_lastSync?Math.round((Date.now()-_lastSync)/1000):null;
  const reach=_netOkAt>0&&_netOkAt>=_netFailAt;
  add(supaOK&&reach,"Connexion Supabase",!supaOK?"mode hors ligne, lecture du cache local"
    :(reach?"serveur joignable":(_netFailAt?`injoignable depuis ${dbgTime(_netFailAt)}`:"pas encore contacté")));
  add(age!==null&&age<180,"Dernière synchronisation",age===null?"aucune depuis l'ouverture":`il y a ${age} s`);
  const me=session&&session.memberId?memberById(session.memberId):null;
  add(!!session&&!(session.memberId&&!me),"Session",session
    ?`${session.user} (${session.role}), grade ${getSessionGrade()||"?"}${session.memberId?(me?`, fiche ${me.matricule||"?"}`:", fiche membre introuvable"):", aucun membre lié"}`
    :"déconnecté");
  add((state.members||[]).length>0,"Effectif chargé",`${(state.members||[]).length} membre(s)`);

  const orph=[];
  const scan=(arr,field,label)=>{(state[arr]||[]).forEach(r=>{const v=r[field];
    if(v!==null&&v!==undefined&&v!==""&&!memberById(v))orph.push(`${label} ${r.id||"?"}`);});};
  scan("blames","member_id","blâme");scan("absences","member_id","absence");
  scan("reports","member_id","rapport");scan("cmdmissions","member_id","CMD");
  scan("formations","formateur_id","formation/formateur");scan("formations","eleve_id","formation/élève");
  scan("tasks","assignee_member_id","tâche");
  add(!orph.length,"Références vers des membres",orph.length
    ?`${orph.length} ligne(s) pointent vers un membre supprimé : ${orph.slice(0,5).join(", ")}${orph.length>5?"…":""}`
    :"toutes résolues");

  const seen={},dup=[];
  (state.members||[]).forEach(m=>{const k=String(m.matricule||"").trim().toLowerCase();
    if(!k)return;if(seen[k])dup.push(m.matricule);else seen[k]=1;});
  add(!dup.length,"Matricules uniques",dup.length?`doublon(s) : ${dup.join(", ")}`:`${Object.keys(seen).length} matricule(s)`);

  const noMat=(state.members||[]).filter(m=>!String(m.matricule||"").trim()).length;
  add(!noMat,"Matricule renseigné",noMat?`${noMat} membre(s) sans matricule`:"tous renseignés");

  const badAbs=(state.absences||[]).filter(a=>!a.start_date||!a.end_date||a.end_date<a.start_date);
  add(!badAbs.length,"Dates d'absence",badAbs.length
    ?`${badAbs.length} absence(s) sans dates ou dont la fin précède le début`:"cohérentes");

  const today=ymdLocal(new Date());
  const activeBy=new Set((state.absences||[]).filter(a=>a.start_date<=today&&today<=a.end_date).map(a=>String(a.member_id)));
  const wrong=(state.members||[]).filter(m=>(m.categorie||"effectif")==="effectif"&&m.status!=="reserve").filter(m=>{
    const act=activeBy.has(String(m.id));
    if(act)return m.status!=="absent";
    return m.status==="absent"&&(state.absences||[]).some(a=>String(a.member_id)===String(m.id));
  });
  add(!wrong.length,"Statuts présent/absent",wrong.length
    ?`${wrong.length} à recalculer : ${wrong.slice(0,5).map(m=>m.matricule||"?").join(", ")}`
    :"alignés sur les absences");

  const badWk=(state.reports||[]).filter(r=>!r.week_key||weekKeyOf(r.week_key)!==r.week_key);
  add(!badWk.length,"Clés de semaine",badWk.length
    ?`${badWk.length} rapport(s) dont la semaine ne tombe pas un lundi`:"toutes sur un lundi");

  const exKeys=Object.keys(state.reportExempt||{});
  const exOrph=exKeys.filter(k=>!memberById(k));
  const exNow=exKeys.filter(k=>manualReportExemptFor(k,getWeekKey(0))).length;
  add(!exOrph.length,"Dispenses de rapport",
    `${exNow} active(s) cette semaine sur ${exKeys.length} membre(s) suivi(s)${exOrph.length?`, ${exOrph.length} vers un membre supprimé`:""}`);

  const frozenKeys=Object.keys(state.reportWeeks||{}).sort();
  const lastWk=getWeekKey(-1);
  const lateFreeze=lastWk>=REPORT_RULES_SINCE&&weekClosed(lastWk)&&!frozenWeek(lastWk);
  add(!lateFreeze,"Historique des semaines",
    `${frozenKeys.length} semaine(s) figée(s)${frozenKeys.length?`, de ${frozenKeys[0]} à ${frozenKeys[frozenKeys.length-1]}`:""}${lateFreeze?`, la semaine du ${lastWk} aurait dû être figée`:""} ; automatisation ${state.autoReport?`active depuis la semaine du ${state.autoReportSince||"?"}`:"désactivée"}`);

  const missFn=Object.keys(TAB_RENDER).filter(k=>typeof window[TAB_RENDER[k].fn]!=="function");
  add(!missFn.length,"Fonctions d'affichage",missFn.length
    ?`manquante(s) : ${missFn.join(", ")}`:`${Object.keys(TAB_RENDER).length} onglets câblés`);

  const errs=_dbgLog.filter(l=>l.kind!=="alerte").length;
  add(!errs,"Erreurs JavaScript",errs?`${errs} depuis l'ouverture de la page`:"aucune");

  const mt=manualTestCounts();
  add(!mt.ko,"Tests manuels",`${mt.todo} à faire, ${mt.ko} en échec, ${mt.ok} validé${mt.ok>1?"s":""}`);
  return out;
}

function dbgTime(t){try{return new Date(t).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});}catch(e){return "?";}}

function renderDebug(){
  const el=document.getElementById("debugBody");
  if(!el)return;
  const keepScroll=el.scrollTop;
  const openKeys=new Set([...el.querySelectorAll("details[data-k][open]")].map(d=>d.dataset.k));
  const closedKeys=new Set([...el.querySelectorAll("details[data-k]:not([open])")].map(d=>d.dataset.k));
  el.innerHTML=renderManualTests()+
    `<pre id="dbgReportPre" style="display:none;white-space:pre-wrap;word-break:break-word;margin-top:1rem;padding:.7rem;background:var(--s2);border:1px solid var(--ln);font-family:var(--fm);font-size:.64rem;color:var(--tx2);max-height:240px;overflow:auto"></pre>`;
  el.querySelectorAll("details[data-k]").forEach(d=>{
    if(openKeys.has(d.dataset.k))d.open=true;
    else if(closedKeys.has(d.dataset.k))d.open=false;
  });
  el.scrollTop=keepScroll;
}

function debugReport(){
  const checks=debugChecks(),stats=debugStats();
  const L=[];
  L.push("RAPPORT DE DIAGNOSTIC ARC ALPHA");
  L.push("Généré le "+new Date().toLocaleString("fr-FR"));
  L.push("");
  L.push("VÉRIFICATIONS");
  checks.forEach(c=>L.push(`${c.ok?"[ok]":"[KO]"} ${c.label} : ${c.detail}`));
  L.push("");
  L.push(manualTestsReport());
  L.push("");
  L.push("DONNÉES EN MÉMOIRE");
  L.push(Object.keys(stats).map(k=>`${k}=${stats[k]}`).join(", "));
  L.push("");
  L.push("TECHNIQUE");
  L.push(`page modifiée le ${document.lastModified}`);
  L.push(`synchro toutes les ${Math.round(_pollDelay/1000)} s, onglet actif ${_activeTab||"?"}`);
  L.push(`écran ${window.innerWidth}x${window.innerHeight}`);
  L.push(`navigateur ${(navigator.userAgent||"").slice(0,120)}`);
  L.push("");
  L.push(`MESSAGES CAPTURÉS (${_dbgLog.length})`);
  if(!_dbgLog.length)L.push("aucun");
  else _dbgLog.slice().reverse().forEach(l=>L.push(`${dbgTime(l.t)} ${l.kind} : ${l.msg}${l.where?" ("+l.where+")":""}`));
  return L.join("\n");
}

async function copyDebugReport(){
  const txt=debugReport();
  let ok=false;
  try{await navigator.clipboard.writeText(txt);ok=true;}
  catch(e){
    try{
      const ta=document.createElement("textarea");
      ta.value=txt;ta.style.position="fixed";ta.style.top="-1000px";ta.style.opacity="0";
      document.body.appendChild(ta);ta.select();
      ok=document.execCommand("copy");
      document.body.removeChild(ta);
    }catch(e2){ok=false;}
  }
  if(ok)toast("Rapport copié, colle-le dans Claude Code","success");
  else{
    const pre=document.getElementById("dbgReportPre");
    if(pre){pre.style.display="block";pre.textContent=txt;}
    toast("Copie refusée par le navigateur, le texte est affiché en bas","error");
  }
}
