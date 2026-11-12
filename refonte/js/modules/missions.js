/* ARC ALPHA - Module missions. */
/* Bibliothèque de départ. Elle n'est PAS affichée depuis ici : le bouton
   « Charger la bibliothèque de départ » l'écrit en base, et les missions
   deviennent ensuite des lignes ordinaires, modifiables comme les autres. */
const MIS_DEPART=[
{nom:"Bivouac tactique conjoint",categorie:"Coopération",difficulte:"Moyenne",
 regiments:"41st, 501st",participants:"Une escouade, ou plusieurs groupes coordonnés",duree:"1 h 30",
 tags:"camp, patrouille, inter-régiments",
 description:"ARC Alpha organise un camp de terrain avec un régiment partenaire. Les participants montent un bivouac, enchaînent des exercices tactiques adaptés au RP, tiennent des patrouilles et terminent par un débriefing collectif.",
 objectifs:"Installer et sécuriser un camp temporaire\nOrganiser une patrouille ou un exercice tactique\nRéaliser une activité de coopération entre les participants\nEffectuer un débriefing RP",
 consignes:"Prévenir le régiment partenaire à l'avance. Le camp reste en jeu du début à la fin : pas de téléportation, pas de reset en cours de scène."},
{nom:"Simulation d'embuscade",categorie:"Simulation",difficulte:"Moyenne",
 regiments:"327th, 104th",participants:"Une escouade évaluée, 2 observateurs",duree:"1 h",
 tags:"embuscade, réaction, évaluation",
 description:"ARC Alpha prépare un scénario surprise pour tester la réaction d'une escouade face à une embuscade simulée. On regarde la communication, la coordination et la tenue sous pression, dans un cadre RP contrôlé.",
 objectifs:"Préparer un scénario et définir les règles de sécurité RP\nOrganiser une embuscade simulée\nObserver les réactions et la coordination de l'escouade\nRéaliser un débriefing avec des conseils d'amélioration",
 consignes:"Annoncer le cadre avant de commencer : munitions simulées, pas de mort définitive. Un arbitre ARC Alpha reste neutre."},
{nom:"Cours de reconnaissance et d'infiltration",categorie:"Formation",difficulte:"Accessible",
 regiments:"Tous",participants:"3 à 5 volontaires",duree:"1 h",
 tags:"reconnaissance, discrétion, formation",
 description:"ARC Alpha organise une session pratique pour un petit groupe de volontaires. Les participants apprennent à observer une zone, repérer ce qui compte, transmettre leurs informations et se déplacer discrètement.",
 objectifs:"Effectuer une reconnaissance d'une zone définie\nIdentifier et signaler des éléments pertinents\nRéaliser un exercice de déplacement discret\nPrésenter un compte rendu de mission",
 consignes:"Choisir une zone avec de vrais points d'observation. Le compte rendu final peut être déposé dans l'onglet Comptes rendus."},
{nom:"Manoeuvre inter-régiments",categorie:"Coordination",difficulte:"Exigeante",
 regiments:"Tous",participants:"Deux groupes de 3 minimum, plus un arbitre",duree:"1 h 30",
 tags:"coordination, arbitrage, inter-régiments",
 description:"Deux régiments mènent un exercice commun pour tester leur capacité à communiquer et à coordonner leurs actions. ARC Alpha arbitre et évalue le déroulement.",
 objectifs:"Définir un objectif commun\nRépartir les rôles entre les régiments\nRéaliser une opération simulée\nÉvaluer la coordination et effectuer un débriefing",
 consignes:"ARC Alpha n'entre pas dans l'action : son rôle est d'observer et de trancher les litiges RP."},
{nom:"Inspection et entraînement au tir",categorie:"Entraînement",difficulte:"Accessible",
 regiments:"Tous",participants:"4 à 8 troopers",duree:"45 min",
 tags:"tir, évaluation, conseil",
 description:"ARC Alpha rend visite à un régiment sur son stand de tir pour mener une séance d'entraînement RP. Quelques troopers passent des exercices de précision et repartent avec des conseils adaptés à leurs résultats.",
 objectifs:"Organiser une séance au stand de tir\nFaire participer plusieurs troopers à des exercices\nÉvaluer les performances selon des critères définis\nDonner des conseils et conclure par un compte rendu RP",
 consignes:"Annoncer les critères de notation avant de commencer. Les résultats servent à conseiller, jamais à sanctionner."},
{nom:"Escorte d'un officier",categorie:"Protection",difficulte:"Moyenne",
 regiments:"Tous",participants:"3 à 6 participants, plus l'escorté",duree:"1 h",
 tags:"escorte, protection, déplacement",
 description:"ARC Alpha escorte un officier ou un personnage important lors d'un déplacement RP. L'organisateur glisse des imprévus, des contrôles et des rencontres avec d'autres joueurs.",
 objectifs:"Préparer le dispositif d'escorte et répartir les rôles\nAssurer le déplacement jusqu'au point d'arrivée\nGérer les imprévus annoncés par l'organisateur\nRendre compte de l'escorte",
 consignes:"L'escorté est joué par un volontaire. Les imprévus viennent de l'organisateur, jamais des escorteurs eux-mêmes."},
{nom:"Recherche d'une balise perdue",categorie:"Exploration",difficulte:"Accessible",
 regiments:"Tous",participants:"2 à 6 participants",duree:"45 min",
 tags:"exploration, indices, recherche",
 description:"Une balise de communication a été perdue dans un secteur défini. Les participants explorent la zone, recueillent des indices et retrouvent le dispositif au fil d'un scénario RP.",
 objectifs:"Délimiter la zone de recherche\nRecueillir les indices laissés par l'organisateur\nRetrouver la balise\nRapporter les circonstances de la perte",
 consignes:"L'organisateur place les indices avant le début. La balise doit être atteignable sans noclip."},
{nom:"Enquête sur une anomalie",categorie:"Enquête",difficulte:"Moyenne",
 regiments:"Tous",participants:"2 à 5 enquêteurs, plus des témoins",duree:"1 h",
 tags:"enquête, immersion, témoignages",
 description:"Un événement inhabituel est signalé dans une installation. Les joueurs recueillent des témoignages, inspectent les lieux et présentent leurs conclusions à ARC Alpha.",
 objectifs:"Recueillir les témoignages des personnels présents\nInspecter les lieux et relever ce qui cloche\nFormuler une hypothèse\nPrésenter les conclusions à ARC Alpha",
 consignes:"Prévoir deux ou trois joueurs qui tiennent le rôle de témoins, avec des versions qui ne concordent pas tout à fait."},
{nom:"Exercice de communication sous pression",categorie:"Coordination",difficulte:"Exigeante",
 regiments:"Tous",participants:"Une escouade de 4 à 6",duree:"45 min",
 tags:"radio, discipline, procédures",
 description:"Une escouade enchaîne plusieurs objectifs en n'utilisant que les moyens de communication et les procédures fixés pour l'exercice.",
 objectifs:"Fixer les procédures radio avant le départ\nEnchaîner les objectifs sans sortir du cadre\nTenir la discipline de communication sous contrainte\nDébriefer les écarts constatés",
 consignes:"Toute communication hors procédure compte comme un écart. L'organisateur ajoute de la pression par des interruptions."},
{nom:"Défense d'un point stratégique",categorie:"Défense",difficulte:"Exigeante",
 regiments:"41st, 501st, 327th, 104th",participants:"5 à 10 défenseurs",duree:"1 h 30",
 tags:"défense, position, vagues",
 description:"ARC Alpha monte un exercice de protection d'une position face à une attaque simulée. Les participants établissent un dispositif de défense et réagissent aux événements annoncés.",
 objectifs:"Reconnaître la position et ses points faibles\nÉtablir un dispositif de défense\nRéagir aux vagues annoncées\nDébriefer la tenue de la position",
 consignes:"Les vagues sont annoncées à l'avance en nombre et en direction : l'exercice teste l'organisation, pas la surprise."},
{nom:"Extraction d'un personnel isolé",categorie:"Sauvetage",difficulte:"Moyenne",
 regiments:"Tous",participants:"3 à 6 participants, plus les isolés",duree:"1 h",
 tags:"sauvetage, plan, coordination",
 description:"Un ou plusieurs personnages sont déclarés isolés dans une zone de jeu. Les participants préparent puis mènent leur extraction, avec les complications prévues par l'organisateur.",
 objectifs:"Localiser le personnel isolé\nPréparer le plan d'extraction\nRéaliser l'extraction\nRendre compte de l'état du personnel récupéré",
 consignes:"Les isolés sont joués par des volontaires et n'aident pas leurs sauveteurs par métagame."},
{nom:"Audit des procédures d'une escouade",categorie:"Inspection",difficulte:"Accessible",
 regiments:"Tous",participants:"Une escouade, plus 1 ou 2 observateurs",duree:"45 min",
 tags:"audit, procédures, progression",
 description:"ARC Alpha observe une escouade pendant une mise en situation RP pour évaluer sa communication, la répartition des rôles et le respect des procédures établies.",
 objectifs:"Choisir une mise en situation avec le chef d'escouade\nObserver sans intervenir\nRelever les écarts et les bons réflexes\nRestituer l'audit à l'escouade",
 consignes:"L'observateur reste muet pendant la mise en situation. Tout se dit au débriefing."}
];

/* ===================== MISSIONS HEBDOMADAIRES =====================
   Une bibliothèque administrable, et trois missions par semaine tirées
   de façon déterministe : la même semaine, la même bibliothèque et le
   même historique donnent toujours le même tirage, donc tout le monde
   voit la même chose même avant que la sélection soit figée en base.
   Une fois figée (arc_mission_rot, clé de semaine unique), c'est elle
   qui fait foi : modifier la bibliothèque ne change plus la semaine en
   cours. */
const MIS_PAR_SEMAINE=3;
const MIS_CATEGORIES=["Coopération","Simulation","Formation","Entraînement","Protection",
  "Exploration","Enquête","Coordination","Défense","Sauvetage","Inspection","Autre"];
const MIS_DIFFICULTES=["Accessible","Moyenne","Exigeante"];
const MIS_NOM_MAX=90, MIS_TXT_MAX=1200;

let misSearchQ="", misFiltreV="";
const misSearchDebounced=debounce(v=>{misSearchQ=v;renderMissionAdmin();},150);

function misLib(){ return Array.isArray(state.missionLib)?state.missionLib:[]; }
function misRot(){ return Array.isArray(state.missionRot)?state.missionRot:[]; }
function misById(id){ return misLib().filter(m=>String(m.id)===String(id))[0]||null; }
function misActives(){ return misLib().filter(m=>m.actif!==false&&m.actif!=="false"); }
function misTirables(){ return misActives().filter(m=>m.exclu!==true&&m.exclu!=="true"); }
function canEditMissions(){ return canEdit("missions"); }

/* Les identifiants d'une ligne de rotation, qu'elle vienne de la base
   (texte JSON) ou d'un calcul local (tableau). */
function misIds(r){
  let v=r&&r.mission_ids;
  if(typeof v==="string"){ try{ v=JSON.parse(v); }catch(e){ v=null; } }
  return Array.isArray(v)?v.map(String):[];
}

/* Empreinte numérique maison : il faut un entier pour amorcer le tirage,
   et il doit être le même dans tous les navigateurs. */
function misGraine(txt){
  let h=2166136261;
  const s=String(txt||"");
  for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;
  return h>>>0;
}
function misAlea(graine){
  let x=(graine>>>0)||123456789;
  return function(){
    x^=x<<13; x>>>=0;
    x^=x>>>17;
    x^=x<<5;  x>>>=0;
    return x/4294967296;
  };
}

/* Decale une cle de semaine de k semaines. */
function misSemaineDecalee(semaine,k){
  const p=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(semaine||""));
  if(!p)return "";
  const d=new Date(+p[1],+p[2]-1,+p[3]);
  d.setDate(d.getDate()+k*7);
  return ymdLocal(d);
}

/* Index de semaine depuis une origine fixe, en semaines pleines. C'est lui
   qui fait avancer la rotation : trois missions de plus à chaque semaine. */
const MIS_ORIGINE="2026-01-05";
function misIndexSemaine(semaine){
  const a=/^(\d{4})-(\d{2})-(\d{2})/.exec(MIS_ORIGINE);
  const b=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(semaine||""));
  if(!a||!b)return 0;
  const da=new Date(+a[1],+a[2]-1,+a[3]), db=new Date(+b[1],+b[2]-1,+b[3]);
  return Math.round((db-da)/604800000);
}

/* Ordre de parcours de la bibliothèque : un mélange reproductible, puis les
   missions reprises une par catégorie, en tournant, pour que trois rangs
   consécutifs mêlent trois formats différents.
   Il ne dépend que du contenu de la bibliothèque, jamais de la semaine :
   c'est ce qui rend le non-recouvrement démontrable. */
function misOrdre(pool){
  const l=pool.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  const rnd=misAlea(misGraine("ordre#"+l.map(m=>String(m.id)).join(",")));
  for(let i=l.length-1;i>0;i--){
    const k=Math.floor(rnd()*(i+1));
    const t=l[i];l[i]=l[k];l[k]=t;
  }
  const paq={},cles=[];
  l.forEach(m=>{
    const c=String(m.categorie||"-");
    if(!paq[c]){paq[c]=[];cles.push(c);}
    paq[c].push(m);
  });
  const ordre=[];
  let reste=l.length;
  while(reste>0){
    for(const c of cles){
      const p=paq[c];
      if(p.length){ ordre.push(p.shift()); reste--; }
    }
  }
  return ordre;
}

/* Rang de départ de la semaine. On avance de trois, plus un rang de dérive
   à chaque tour complet de bibliothèque : sans cette dérive, les mêmes trios
   reviendraient à l'identique tous les quatre tours. L'écart entre deux
   semaines vaut donc 3 ou 4, jamais moins : deux fenêtres de trois rangs ne
   peuvent pas se chevaucher dès que la bibliothèque compte 7 missions.
   En dessous, on avance simplement de trois. */
function misDepart(bloc,n){
  if(n<7)return ((bloc*MIS_PAR_SEMAINE)%n+n)%n;
  const parTour=Math.floor(n/MIS_PAR_SEMAINE);
  const derive=Math.floor(bloc/parTour);
  return (((bloc*MIS_PAR_SEMAINE+derive)%n)+n)%n;
}

/* Le tirage d'une semaine. Déterministe : la même bibliothèque et la même
   semaine donnent toujours le même résultat, dans tous les navigateurs. */
function misTirage(semaine,tirage){
  const pool=misTirables();
  const n=pool.length;
  if(!n)return [];
  if(n<=MIS_PAR_SEMAINE)return pool.slice();
  const bloc=misIndexSemaine(semaine)+(+tirage||0);
  const ordre=misOrdre(pool);
  const dep=misDepart(bloc,n);
  /* Si la semaine precedente est figee en base, on en tient compte : un
     tirage manuel a pu la sortir du cycle, et le cycle seul l'ignorerait.
     C'est une donnee lue, pas un calcul, donc partagee par tout le monde. */
  const prec=misRotDe(misSemaineDecalee(semaine,-1));
  const evite={};
  if(prec)misIds(prec).forEach(id=>{ evite[String(id)]=1; });
  const out=[],vus={};
  for(let k=0;k<n&&out.length<MIS_PAR_SEMAINE;k++){
    const m=ordre[(dep+k)%n];
    if(m&&!vus[m.id]&&!evite[String(m.id)]){ vus[m.id]=1; out.push(m); }
  }
  /* bibliotheque trop petite pour tout eviter : mieux vaut completer que
     proposer moins de trois missions */
  for(let k=0;k<n&&out.length<MIS_PAR_SEMAINE;k++){
    const m=ordre[(dep+k)%n];
    if(m&&!vus[m.id]){ vus[m.id]=1; out.push(m); }
  }
  return out;
}

function misRotDe(semaine){
  return misRot().filter(r=>String(r.week_key||"")===String(semaine))[0]||null;
}

/* Les missions d'une semaine : celles figées en base si la ligne existe,
   sinon le tirage calculé. Une mission supprimée entre-temps disparaît
   simplement de la liste, on ne la remplace pas en douce. */
function misSemaine(semaine){
  const r=misRotDe(semaine);
  if(r){
    const out=misIds(r).map(id=>misById(id)).filter(Boolean);
    if(out.length)return out;
  }
  return misTirage(semaine,r?(+r.tirage||0):0);
}

function misPeriode(semaine){
  const p=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(semaine||""));
  if(!p)return "";
  const a=new Date(+p[1],+p[2]-1,+p[3]);
  const b=new Date(a.getFullYear(),a.getMonth(),a.getDate()+6);
  return "du "+fmtDate(ymdLocal(a))+" au "+fmtDate(ymdLocal(b));
}
function misJoursRestants(semaine){
  const p=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(semaine||""));
  if(!p)return 0;
  const fin=new Date(+p[1],+p[2]-1,+p[3]);
  fin.setDate(fin.getDate()+7);
  return Math.max(0,Math.ceil((fin-new Date())/86400000));
}

/* Fige la sélection de la semaine. La clé de semaine est unique en base :
   si deux personnes ouvrent l'onglet en même temps, la seconde écriture
   est refusée et tout le monde relit la ligne gagnante. */
let _misFigeEnCours=false;
async function misEnsureWeek(){
  if(_misFigeEnCours||!supaOK||!Auth.ok())return false;
  /* Figer la semaine est une écriture que la base accepte dès le CPT : on
     s'aligne dessus, sinon l'annonce du lundi attendrait qu'un gestionnaire
     passe. */
  if(!misPeutAnnoncer())return false;
  const wk=getWeekKey(0);
  if(misRotDe(wk))return false;
  const choix=misTirage(wk,0);
  if(choix.length===0)return false;
  _misFigeEnCours=true;
  try{
    const w=await supaPost(T.missionRot,{week_key:wk,
      mission_ids:JSON.stringify(choix.map(m=>String(m.id))),
      tirage:0,manuelle:false,created_by:session?.user||""});
    if(w&&w.length){
      if(!state.missionRot)state.missionRot=[];
      state.missionRot.unshift(w[0]);
      return true;
    }
    /* refusée : quelqu'un d'autre a figé la semaine avant nous */
    const frais=await supaGet(T.missionRot,"limit=60&order=week_key.desc");
    if(frais)state.missionRot=frais;
  }finally{ _misFigeEnCours=false; }
  return false;
}

async function misEcrireRotation(wk,missions,tirage,manuelle){
  const ids=JSON.stringify(missions.map(m=>String(m.id)));
  const ligne=misRotDe(wk);
  if(!supaOK){
    if(ligne)Object.assign(ligne,{mission_ids:ids,tirage:tirage,manuelle:!!manuelle});
    else{ if(!state.missionRot)state.missionRot=[];
      state.missionRot.unshift({id:Date.now().toString(),week_key:wk,mission_ids:ids,
        tirage:tirage,manuelle:!!manuelle,created_at:new Date().toISOString()}); }
    saveLS();
    return true;
  }
  if(ligne){
    const w=await supaPatch(T.missionRot,"id=eq."+encodeURIComponent(ligne.id),
      {mission_ids:ids,tirage:tirage,manuelle:!!manuelle,created_by:session?.user||""});
    if(w===null)return false;
    Object.assign(ligne,{mission_ids:ids,tirage:tirage,manuelle:!!manuelle});
    return true;
  }
  const w=await supaPost(T.missionRot,{week_key:wk,mission_ids:ids,tirage:tirage,
    manuelle:!!manuelle,created_by:session?.user||""});
  if(!w||!w.length)return false;
  if(!state.missionRot)state.missionRot=[];
  state.missionRot.unshift(w[0]);
  return true;
}

async function misRotationManuelle(){
  if(!canEditMissions()){toast("Réservé à la gestion des missions","error");return;}
  const wk=getWeekKey(0);
  const ligne=misRotDe(wk);
  const suivant=(ligne?(+ligne.tirage||0):0)+1;
  const choix=misTirage(wk,suivant);
  if(!choix.length){toast("Aucune mission active et tirable dans la bibliothèque","error");return;}
  const ok=await uiConfirm({kicker:"// ROTATION",title:"Tirer de nouvelles missions ?",
    message:"La semaine en cours change pour tout le monde, immédiatement.\n\nNouveau tirage :\n"
      +choix.map(m=>"· "+String(m.nom||"?")).join("\n"),
    okText:"Tirer",cancelText:"Annuler",danger:true,wide:true});
  if(!ok)return;
  if(!await misEcrireRotation(wk,choix,suivant,true)){
    toast("Tirage impossible : exécute missions.sql dans Supabase","error");return;
  }
  renderMissions();renderMissionAdmin();
  toast("Nouveau tirage effectué","success");
  await logActivity((session?.user||"?")+" a tiré de nouvelles missions pour la semaine "+wk);
}

function misVersAdmin(){
  dashTab("admin");
  setTimeout(function(){
    const e=document.getElementById("missionPanel");
    if(e)e.scrollIntoView({behavior:"smooth",block:"start"});
  },140);
}

/* ---------------- bibliothèque : création, modification ---------------- */
function misOptions(sel,liste,valeur){
  const el=document.getElementById(sel);
  if(!el)return;
  el.innerHTML=liste.map(v=>`<option value="${esc(v)}"${String(valeur||"")===v?" selected":""}>${esc(v)}</option>`).join("");
}
function openMissionModal(id){
  if(!canEditMissions()){toast("Réservé à la gestion des missions","error");return;}
  const m=id?misById(id):null;
  const g=k=>document.getElementById(k);
  misOptions("misCat",MIS_CATEGORIES,m?m.categorie:"Coopération");
  misOptions("misDif",MIS_DIFFICULTES,m?m.difficulte:"Moyenne");
  if(g("misId"))g("misId").value=m?String(m.id):"";
  if(g("misNom"))g("misNom").value=m?String(m.nom||""):"";
  if(g("misDesc"))g("misDesc").value=m?String(m.description||""):"";
  if(g("misObj"))g("misObj").value=m?String(m.objectifs||""):"";
  if(g("misReg"))g("misReg").value=m?String(m.regiments||""):"Tous";
  if(g("misPart"))g("misPart").value=m?String(m.participants||""):"";
  if(g("misDuree"))g("misDuree").value=m?String(m.duree||""):"";
  if(g("misTags"))g("misTags").value=m?String(m.tags||""):"";
  if(g("misCons"))g("misCons").value=m?String(m.consignes||""):"";
  if(g("misActif"))g("misActif").checked=m?(m.actif!==false):true;
  if(g("misExclu"))g("misExclu").checked=m?(m.exclu===true):false;
  if(g("misErr")){g("misErr").style.display="none";g("misErr").textContent="";}
  if(g("misModalTitle"))g("misModalTitle").textContent=m?"Modifier la mission":"Nouvelle mission";
  document.getElementById("missionModal").classList.add("show");
}

async function saveMission(){
  const er=document.getElementById("misErr");
  const fail=m=>{ if(er){er.textContent=m;er.style.display="block";} };
  if(er)er.style.display="none";
  if(!canEditMissions()){fail("Réservé aux MAJ et plus, ou à la tâche « Gérer les missions ».");return;}
  const g=k=>(document.getElementById(k)||{}).value;
  const id=String(g("misId")||"").trim();
  const nom=String(g("misNom")||"").trim();
  const desc=String(g("misDesc")||"").trim();
  if(!nom){fail("Donne un nom à la mission.");return;}
  if(nom.length>MIS_NOM_MAX){fail("Le nom est trop long.");return;}
  if(desc.length>MIS_TXT_MAX){fail("La description est trop longue.");return;}

  const obj={nom:nom.slice(0,MIS_NOM_MAX),description:desc,
    objectifs:String(g("misObj")||"").trim(),
    categorie:String(g("misCat")||"Autre"),
    difficulte:String(g("misDif")||""),
    regiments:String(g("misReg")||"").trim(),
    participants:String(g("misPart")||"").trim(),
    duree:String(g("misDuree")||"").trim(),
    tags:String(g("misTags")||"").trim(),
    consignes:String(g("misCons")||"").trim(),
    actif:!!(document.getElementById("misActif")||{}).checked,
    exclu:!!(document.getElementById("misExclu")||{}).checked};

  if(id){
    obj.updated_at=new Date().toISOString();
    const m=misById(id);
    if(supaOK){
      const w=await supaPatch(T.missionLib,"id=eq."+encodeURIComponent(id),obj);
      if(w===null){fail("Enregistrement refusé par la base.");return;}
    }
    if(m)Object.assign(m,obj);
    if(!supaOK)saveLS();
    toast("Mission mise à jour","success");
    await logActivity((session?.user||"?")+" a modifié la mission « "+nom+" »");
  }else{
    obj.created_at=new Date().toISOString();
    obj.auteur=session?.user||"";
    if(supaOK){
      const w=await supaPost(T.missionLib,obj);
      if(!w||!w.length){fail("Création impossible : exécute missions.sql dans Supabase.");return;}
      if(!state.missionLib)state.missionLib=[];
      state.missionLib.unshift(w[0]);
    }else{
      obj.id=Date.now().toString();
      if(!state.missionLib)state.missionLib=[];
      state.missionLib.unshift(obj);
      saveLS();
    }
    toast("Mission ajoutée à la bibliothèque","success");
    await logActivity((session?.user||"?")+" a ajouté la mission « "+nom+" »");
  }
  closeModal("missionModal");
  renderMissionAdmin();renderMissions();
}

/* Désactiver vaut mieux que supprimer : une mission déjà tirée resterait
   référencée par l'historique. On le dit, et on propose les deux. */
async function deleteMission(id){
  if(!canEditMissions()){toast("Réservé à la gestion des missions","error");return;}
  const m=misById(id);
  if(!m){toast("Mission introuvable","error");return;}
  const passages=misRot().filter(r=>misIds(r).indexOf(String(id))>=0).length;
  const dit=["Supprimer définitivement « "+String(m.nom||"?")+" » de la bibliothèque ?"];
  if(passages)dit.push("Elle a déjà été proposée "+passages+" fois : son nom disparaîtra de l'historique. La désactiver la garde en mémoire tout en la retirant des tirages.");
  if(!await uiConfirm({kicker:"// BIBLIOTHÈQUE",title:"Supprimer la mission",
    message:dit.join("\n\n"),okText:"Supprimer",cancelText:"Annuler",danger:true}))return;
  if(supaOK){
    const w=await supaDelete(T.missionLib,"id=eq."+encodeURIComponent(id));
    if(!w){toast("Suppression refusée par la base","error");return;}
  }
  state.missionLib=misLib().filter(x=>String(x.id)!==String(id));
  if(!supaOK)saveLS();
  renderMissionAdmin();renderMissions();
  toast("Mission supprimée","info");
  await logActivity((session?.user||"?")+" a supprimé la mission « "+String(m.nom||"?")+" »");
}

async function misBascule(id,champ){
  if(!canEditMissions()){toast("Réservé à la gestion des missions","error");return;}
  if(champ!=="actif"&&champ!=="exclu")return;
  const m=misById(id);
  if(!m)return;
  const val=!(champ==="actif"?(m[champ]!==false):(m[champ]===true));
  const patch={};patch[champ]=val;patch.updated_at=new Date().toISOString();
  if(supaOK){
    const w=await supaPatch(T.missionLib,"id=eq."+encodeURIComponent(id),patch);
    if(w===null){toast("Modification refusée par la base","error");return;}
  }
  Object.assign(m,patch);
  if(!supaOK)saveLS();
  renderMissionAdmin();renderMissions();
  toast(champ==="actif"?(val?"Mission activée":"Mission désactivée")
                       :(val?"Mission écartée du prochain tirage":"Mission remise dans le tirage"),"info");
  await logActivity((session?.user||"?")+" a "+(champ==="actif"?(val?"activé":"désactivé")
    :(val?"écarté du tirage":"remis dans le tirage"))+" la mission « "+String(m.nom||"?")+" »");
}

async function misChargerDepart(){
  if(!canEditMissions()){toast("Réservé à la gestion des missions","error");return;}
  if(misLib().length){toast("La bibliothèque n'est pas vide","info");return;}
  if(!await uiConfirm({kicker:"// BIBLIOTHÈQUE",title:"Charger la bibliothèque de départ",
    message:"Ajoute "+MIS_DEPART.length+" missions prêtes à jouer. Elles seront ensuite modifiables comme n'importe quelle autre.",
    okText:"Charger"}))return;
  let n=0;
  for(const d of MIS_DEPART){
    const obj=Object.assign({actif:true,exclu:false,created_at:new Date().toISOString(),
      auteur:session?.user||""},d);
    if(supaOK){
      const w=await supaPost(T.missionLib,obj);
      if(w&&w.length){ state.missionLib.push(w[0]); n++; }
    }else{
      obj.id="d"+(++n);
      state.missionLib.push(obj);
    }
  }
  if(!supaOK)saveLS();
  renderMissionAdmin();renderMissions();
  if(n)toast(n+" missions chargées","success");
  else toast("Chargement impossible : exécute missions.sql dans Supabase","error");
  if(n)await logActivity((session?.user||"?")+" a chargé la bibliothèque de missions de départ ("+n+")");
}

/* ------------------------- annonce du lundi -------------------------
   Le site n'a ni serveur ni tâche planifiée : l'annonce part au premier
   passage d'un officier le lundi à partir de 9 h, heure locale. La ligne
   de la semaine porte le drapeau et la réservation est atomique, donc un
   seul message même si plusieurs personnes sont connectées. */
const MIS_PING_ROLE="1054864224242913330";
const MIS_ANNONCE_HEURE=9;
const MIS_LIEN_DEFAUT="https://arc-alpha-cosmos.github.io/Arc-Alpha-Dashboard/";

/* Le lien envoyé sur Discord. Il porte le repère de l'onglet, pour tomber
   sur les missions et pas sur l'accueil public. */
function misLien(){
  let base=MIS_LIEN_DEFAUT;
  try{
    if(location.protocol==="http:"||location.protocol==="https:")
      base=location.origin+location.pathname.replace(/index\.html?$/i,"").replace(/\/refonte\/$/,"/");
  }catch(e){}
  return base.replace(/#.*$/,"")+"#missions";
}

/* Qui peut déclencher l'envoi : le niveau que la base acceptera de toute
   façon pour écrire la réservation. Plus large que la gestion des missions,
   sinon l'annonce attendrait qu'un gestionnaire se connecte. */
function misPeutAnnoncer(){
  if(!Auth.ok())return false;
  if(session.role==="brs")return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  return gradeLevel(getSessionGrade())>=3;
}

function misAnnonceFaite(semaine){
  const r=misRotDe(semaine);
  return !!(r&&r.annonce_at);
}

/* Lundi 9 h passé ? */
function misAnnonceDue(semaine){
  const p=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(semaine||""));
  if(!p)return false;
  const debut=new Date(+p[1],+p[2]-1,+p[3],MIS_ANNONCE_HEURE,0,0,0);
  return new Date().getTime()>=debut.getTime();
}

function misAnnoncePayload(semaine,liste){
  const lignes=liste.map((m,i)=>{
    const t=String(m.nom||"Mission");
    const c=m.categorie?"  ·  "+String(m.categorie):"";
    let d=String(m.description||"").replace(/\s+/g," ").trim();
    if(d.length>190)d=d.slice(0,190).trim()+"…";
    return "**"+(i+1)+". "+t+"**"+c+(d?"\n"+d:"");
  });
  const embed={
    title:"MISSIONS DE LA SEMAINE",
    description:(lignes.join("\n\n")+"\n\n**[Ouvrir le Dashboard]("+misLien()+")**").slice(0,4000),
    color:0x00e5ff,
    fields:[{name:"Période",value:misPeriode(semaine)||String(semaine),inline:true},
            {name:"À jouer",value:liste.length+" mission"+(liste.length>1?"s":""),inline:true}],
    footer:{text:"Nouvelles missions chaque lundi · Centre de Commandement"},
    timestamp:new Date().toISOString()
  };
  const out={embeds:[embed]};
  const role=String(MIS_PING_ROLE||"").replace(/[^0-9]/g,"");
  if(role){ out.content="<@&"+role+">"; out.allowed_mentions={roles:[role]}; }
  return out;
}

/* Réservation : le filtre porte sur annonce_at, donc le premier qui écrit
   gagne et les autres repartent les mains vides. Même mécanisme que la
   publication des comptes rendus. */
async function misAnnonceClaim(semaine){
  const r=misRotDe(semaine);
  if(!r)return false;
  const maintenant=new Date().toISOString();
  if(!supaOK){ r.annonce_at=maintenant; return true; }
  const w=await supaPatch(T.missionRot,
    "id=eq."+encodeURIComponent(r.id)+"&annonce_at=is.null",
    {annonce_at:maintenant,annonce_par:session?.user||""});
  if(w===null)return false;
  if(Array.isArray(w)&&w.length===0)return false;
  r.annonce_at=maintenant;
  return true;
}
/* L'envoi a échoué : on rend la réservation pour pouvoir réessayer. */
async function misAnnonceRelease(semaine){
  const r=misRotDe(semaine);
  if(!r)return;
  if(supaOK)await supaPatch(T.missionRot,"id=eq."+encodeURIComponent(r.id),{annonce_at:null});
  r.annonce_at=null;
}

let _misAnnonceEnCours=false;
async function misAnnonceAuto(){
  if(_misAnnonceEnCours)return false;
  if(!misPeutAnnoncer())return false;
  if(!state.discord.annonces)return false;
  const wk=getWeekKey(0);
  if(!misAnnonceDue(wk))return false;
  if(misAnnonceFaite(wk))return false;
  if(!misSemaine(wk).length)return false;
  if(!misRotDe(wk)&&!await misEnsureWeek())return false;
  _misAnnonceEnCours=true;
  try{
    if(!await misAnnonceClaim(wk))return false;
    const liste=misSemaine(wk);
    const ok=await discordSend(state.discord.annonces,misAnnoncePayload(wk,liste));
    if(!ok){ await misAnnonceRelease(wk); return false; }
    await logActivity("Annonce automatique des missions de la semaine "+wk+" envoyée sur Discord");
    try{ renderMissionAdmin(); }catch(e){}
    return true;
  }finally{ _misAnnonceEnCours=false; }
}

async function misAnnonceManuelle(){
  if(!canEditMissions()){toast("Réservé à la gestion des missions","error");return;}
  const wk=getWeekKey(0);
  const liste=misSemaine(wk);
  if(!liste.length){toast("Aucune mission à annoncer cette semaine","error");return;}
  if(!state.discord.annonces){toast("Aucun salon d'annonces configuré","error");return;}
  const deja=misAnnonceFaite(wk);
  const ok=await uiConfirm({kicker:"// ANNONCE",
    title:deja?"Renvoyer l'annonce ?":"Annoncer les missions ?",
    message:(deja?"L'annonce de cette semaine est déjà partie. Un second message sera publié.\n\n":"")
      +discordPreview(misAnnoncePayload(wk,liste)),
    okText:"Envoyer",cancelText:"Annuler",danger:deja,wide:true});
  if(!ok)return;
  const envoye=await discordSend(state.discord.annonces,misAnnoncePayload(wk,liste));
  if(!envoye){toast("Envoi refusé par Discord","error");return;}
  if(!deja){
    if(!misRotDe(wk))await misEnsureWeek();
    await misAnnonceClaim(wk);
  }
  renderMissionAdmin();
  toast("Annonce envoyée dans le salon des annonces","success");
  await logActivity((session?.user||"?")+" a annoncé les missions de la semaine "+wk+" sur Discord");
}

/* ------------------------------ affichage ------------------------------ */
function misCarte(m,opts){
  const o=opts||{};
  const objs=String(m.objectifs||"").split("\n").map(s=>s.trim()).filter(Boolean);
  const meta=[];
  if(m.regiments)meta.push("<b>Régiments</b> "+esc(m.regiments));
  if(m.participants)meta.push("<b>Participants</b> "+esc(m.participants));
  if(m.duree)meta.push("<b>Durée</b> "+esc(m.duree));
  return `<article class="mis-card">
    <div class="mis-h">
      <h4>${esc(m.nom||"Mission")}</h4>
      ${m.categorie?`<span class="mis-tag t-cat">${esc(m.categorie)}</span>`:""}
      ${m.difficulte?`<span class="mis-tag t-dif">${esc(m.difficulte)}</span>`:""}
      ${o.etat?`<span class="mis-tag ${o.etatClasse||"t-etat"}">${esc(o.etat)}</span>`:""}
    </div>
    ${m.description?`<div class="mis-d">${esc(m.description)}</div>`:""}
    ${objs.length?`<div class="mis-sec">Objectifs</div><ul class="mis-obj">${objs.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}
    ${m.consignes?`<div class="mis-note">${esc(m.consignes)}</div>`:""}
    ${meta.length?`<div class="mis-meta">${meta.join("")}</div>`:""}
  </article>`;
}

function renderMissions(){
  const zone=document.getElementById("misCards");
  if(!zone)return;
  const wk=getWeekKey(0);
  const gere=canEditMissions();
  const bg=document.getElementById("misGererBtn");
  if(bg)bg.style.display=gere?"":"none";

  const tag=document.getElementById("misPeriodeTag");
  if(tag)tag.textContent=misPeriode(wk);

  const liste=misSemaine(wk);
  const intro=document.getElementById("misIntro");
  if(intro){
    if(!misLib().length){
      intro.textContent=gere
        ? "La bibliothèque est vide. Ouvre la gestion des missions pour charger les missions de départ."
        : "Aucune mission n'est encore enregistrée.";
    }else{
      const j=misJoursRestants(wk);
      intro.textContent="Trois missions à jouer cette semaine, renouvelées chaque lundi. "
        +(j===1?"Il reste 1 jour.":"Il reste "+j+" jours.");
    }
  }

  if(!liste.length){
    zone.innerHTML='<div class="empty"><p>Aucune mission disponible cette semaine</p></div>';
  }else{
    const j=misJoursRestants(wk);
    zone.innerHTML=liste.map(m=>misCarte(m,{etat:"Disponible · "+j+" j"})).join("");
  }

  const suiv=document.getElementById("misNext");
  if(suiv){
    const wn=getWeekKey(1);
    const ln=misSemaine(wn);
    const tn=document.getElementById("misNextTag");
    if(tn)tn.textContent=misPeriode(wn);
    suiv.innerHTML=ln.length?ln.map(m=>`<span>${esc(m.nom||"?")}</span>`).join("")
      :'<span style="border-style:solid;color:var(--dm)">rien de prévu</span>';
  }

  misEnsureWeek().then(function(fige){
    if(fige){ try{ renderMissions(); renderMissionAdmin(); }catch(e){} }
  });
}

function misLigne(m){
  const off=(m.actif===false);
  const exc=(m.exclu===true);
  const bits=[];
  if(m.categorie)bits.push(esc(m.categorie));
  if(m.regiments)bits.push(esc(m.regiments));
  if(exc)bits.push("écartée du tirage");
  return `<div class="mis-row${off?" off":""}">
    <div class="n">${esc(m.nom||"?")}<small>${bits.join(" · ")||"&nbsp;"}</small></div>
    <div class="mis-acts">
      <button class="xs sbtn" onclick="openMissionModal('${escJs(m.id)}')">Modifier</button>
      <button class="xs sbtn" onclick="misBascule('${escJs(m.id)}','actif')">${off?"Activer":"Désactiver"}</button>
      <button class="xs sbtn" onclick="misBascule('${escJs(m.id)}','exclu')">${exc?"Remettre":"Écarter"}</button>
      <button class="xs sbtn danger" onclick="deleteMission('${escJs(m.id)}')">Supprimer</button>
    </div></div>`;
}

function renderMissionAdmin(){
  const p=document.getElementById("missionPanel");
  if(!p)return;
  if(!canEditMissions()){p.style.display="none";return;}
  p.style.display="block";

  const lib=misLib();
  const tag=document.getElementById("misLibTag");
  if(tag)tag.textContent=lib.length+" mission"+(lib.length>1?"s":"")+" · "+misTirables().length+" tirables";
  const seed=document.getElementById("misSeedBtn");
  if(seed)seed.style.display=lib.length?"none":"";

  const wk=getWeekKey(0), wn=getWeekKey(1);
  const now=document.getElementById("misRotNow");
  if(now){
    const l=misSemaine(wk), r=misRotDe(wk);
    now.innerHTML=l.length
      ? l.map(m=>`<div class="mis-row"><div class="n">${esc(m.nom||"?")}<small>${esc(m.categorie||"")}</small></div></div>`).join("")
        +`<div style="font-family:var(--fm);font-size:.6rem;color:var(--dm);margin-top:.3rem">${
            r?("figée en base"+(r.manuelle?" · tirage manuel":"")+" · "+esc(misPeriode(wk)))
             :("calculée, pas encore figée · "+esc(misPeriode(wk)))}</div>`
      : '<div class="empty"><p>Aucune mission tirable</p></div>';
    const a=document.getElementById("misAnnonceEtat");
    if(a){
      const r=misRotDe(wk);
      const faite=!!(r&&r.annonce_at);
      a.innerHTML=(faite
        ? '<span class="mis-tag t-etat">annonce envoyée</span> <span class="c-dm">le '
          +esc(fmtDate(String(r.annonce_at).slice(0,10)))+(r.annonce_par?" par "+esc(r.annonce_par):"")+"</span>"
        : (misAnnonceDue(wk)
            ? '<span class="mis-tag t-dif">annonce en attente</span> <span class="c-dm">elle partira au prochain passage d\'un officier</span>'
            : '<span class="mis-tag t-fin">annonce prévue</span> <span class="c-dm">lundi à '
              +MIS_ANNONCE_HEURE+" h</span>"))
        +' <button class="sbtn" style="padding:.14rem .45rem;font-size:.6rem;margin-left:.3rem" onclick="misAnnonceManuelle()">'
        +(faite?"Renvoyer":"Envoyer maintenant")+"</button>";
    }
  }
  const nxt=document.getElementById("misRotNext");
  if(nxt){
    const l=misSemaine(wn);
    nxt.innerHTML=l.length
      ? l.map(m=>`<div class="mis-row"><div class="n">${esc(m.nom||"?")}<small>${esc(m.categorie||"")}</small></div></div>`).join("")
      : '<div class="empty"><p>Aucune mission tirable</p></div>';
  }

  const el=document.getElementById("misLibList");
  if(el){
    const q=String(misSearchQ||"").trim().toLowerCase();
    let l=lib.slice();
    if(misFiltreV==="actives")l=l.filter(m=>m.actif!==false);
    else if(misFiltreV==="off")l=l.filter(m=>m.actif===false);
    else if(misFiltreV==="exclues")l=l.filter(m=>m.exclu===true);
    if(q)l=l.filter(m=>[m.nom,m.categorie,m.regiments,m.tags,m.description]
      .some(v=>v&&String(v).toLowerCase().indexOf(q)>=0));
    l.sort((a,b)=>String(a.nom||"").localeCompare(String(b.nom||"")));
    el.innerHTML=l.length?l.map(misLigne).join("")
      :`<div class="empty"><p>${lib.length?"Aucune mission ne correspond":"Bibliothèque vide"}</p></div>`;
  }

  const h=document.getElementById("misHist");
  if(h){
    const rows=misRot().slice().sort((a,b)=>String(b.week_key||"").localeCompare(String(a.week_key||""))).slice(0,12);
    h.innerHTML=rows.length?rows.map(r=>{
      const noms=misIds(r).map(id=>{const m=misById(id);return m?String(m.nom):"(supprimée)";});
      const encours=String(r.week_key)===wk;
      return `<div class="mis-row"><div class="n">${esc(misPeriode(r.week_key))||esc(r.week_key)}
        <small>${esc(noms.join(" · ")||"-")}</small></div>
        <span class="mis-tag ${encours?"t-etat":"t-fin"}">${encours?"en cours":"terminée"}</span>
        ${r.manuelle?'<span class="mis-tag t-dif">manuel</span>':""}</div>`;
    }).join(""):'<div class="empty"><p>Aucune rotation enregistrée</p></div>';
  }
}

/* Pastille de l'onglet : ce qui attend la personne qui regarde. */
function rapBadgeCount(){
  if(!Auth.ok())return 0;
  let n=0;
  if(canReviewRapport())n+=rapPending().length;
  if(canWriteRapport())n+=rapMine().filter(r=>rapStatut(r)==="refuse").length;
  return n;
}
function rapBadge(){
  const b=document.getElementById("rapportPulseBadge");
  if(!b)return;
  b.style.display=rapBadgeCount()>0?"block":"none";
}
