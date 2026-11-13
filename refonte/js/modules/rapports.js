/* ARC ALPHA - Module rapports. */
/* ============================================================
   COMPTES RENDUS : rédaction, validation, publication
   ------------------------------------------------------------
   À ne pas confondre avec l'onglet « Rapports hebdomadaires »
   juste au-dessus, qui ne fait que cocher qui a rendu le sien.
   Ici le compte rendu est ÉCRIT dans le site, validé ou refusé
   par un officier, puis publié sur Discord. Un compte rendu
   validé coche la semaine de son auteur dans le suivi
   hebdomadaire : les deux systèmes se parlent au lieu de faire
   double emploi.

   Qui fait quoi :
   - rédaction : les grades qui doivent un rapport, donc CT (ARC)
     à LTN (LT). C'est exactement REPORT_EXEMPT à l'envers, la
     règle n'est donc écrite qu'une seule fois dans le fichier ;
   - validation : un officier CPT et plus À QUI LA TÂCHE
     « Gérer les rapports » a été attribuée (onglet Tâches). Le
     grade seul ne suffit pas, c'est la règle demandée.

   Tout est revérifié EN BASE par les fonctions arc_rapport_*
   (rapports.sql) : l'interface ne fait que cacher des boutons.
   Tant que le SQL n'est pas exécuté, on écrit en direct comme
   partout ailleurs, avec le même garde-fou : le filtre porte sur
   le statut, donc deux officiers ne peuvent pas trancher deux
   fois, et un compte rendu ne peut pas partir deux fois.
   ============================================================ */
const RAP_TYPES=["Patrouille","Mission","Entraînement","Formation","Incident","Autre"];
const RAP_ETATS={
  en_attente:{label:"En attente",color:"var(--ye)"},
  valide:{label:"Validé",color:"var(--gr)"},
  refuse:{label:"Refusé",color:"var(--rd)"}
};
const RAP_TITRE_MAX=90, RAP_TEXTE_MAX=3500, RAP_TEXTE_MIN=20, RAP_MOTIF_MAX=400;

/* Pièces jointes, facultatives. Deux façons de joindre (coller un lien, ou
   envoyer un fichier), une seule structure stockée :
   {t:"lien"|"fichier", url, nom, taille}. */
const RAP_PIECES_MAX=5, RAP_PIECE_URL_MAX=600, RAP_PIECE_NOM_MAX=80;
const RAP_FICHIER_MAX=3*1024*1024;
const RAP_BUCKET="rapports";
const RAP_FICHIER_TYPES=["image/png","image/jpeg","image/gif","image/webp","application/pdf"];

/* Une adresse n'est acceptée qu'en http(s). C'est ce qui ferme la porte à
   javascript: et data: dans un href ou un src. Revérifié à l'affichage et
   pas seulement à la saisie : la donnée vient de la base. */
function rapUrlOk(u){
  const s=String(u||"").trim();
  if(!s||s.length>RAP_PIECE_URL_MAX)return false;
  if(/[\s<>"'\\]/.test(s))return false;
  return /^https?:\/\/[^\/]+\.[^\/]/i.test(s);
}
function rapPieceNom(p){
  const n=String((p&&p.nom)||"").trim();
  if(n)return n.slice(0,RAP_PIECE_NOM_MAX);
  try{
    const u=new URL(String(p&&p.url||""));
    const bout=u.pathname.split("/").filter(Boolean).pop();
    return decodeURIComponent(bout||u.hostname).slice(0,RAP_PIECE_NOM_MAX);
  }catch(e){ return "Pièce jointe"; }
}
function rapPieces(r){
  let v=r&&r.pieces;
  if(typeof v==="string"){ try{ v=JSON.parse(v); }catch(e){ v=null; } }
  if(!Array.isArray(v))return [];
  return v.filter(p=>p&&rapUrlOk(p.url)).slice(0,RAP_PIECES_MAX).map(p=>({
    t:(p.t==="fichier"?"fichier":"lien"),
    url:String(p.url).trim(),
    nom:rapPieceNom(p),
    taille:(+p.taille>0?+p.taille:0)}));
}
function rapEstImage(u){ return /\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(String(u||"")); }
function rapTaille(n){
  const o=+n||0;
  if(!o)return "";
  return o>=1048576?((Math.round(o/104857.6)/10)+" Mo"):(Math.round(o/1024)+" Ko");
}
function rapPiecesHtml(r){
  const ps=rapPieces(r);
  if(!ps.length)return "";
  const items=ps.map(p=>{
    const lien=esc(p.url), nom=esc(p.nom);
    if(rapEstImage(p.url)){
      return `<a class="rap-pj-img" href="${lien}" target="_blank" rel="noopener noreferrer" title="${nom}"><img src="${lien}" alt="${nom}" loading="lazy"><span>${nom}</span></a>`;
    }
    return `<a class="rap-pj-doc" href="${lien}" target="_blank" rel="noopener noreferrer" title="${nom}"><span class="rap-pj-t">${p.t==="fichier"?"fichier":"lien"}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${nom}</span>${p.taille?`<span class="rap-pj-s">${esc(rapTaille(p.taille))}</span>`:""}</a>`;
  }).join("");
  return `<div style="margin-top:.9rem">
      <div style="font-family:var(--fm);font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;color:var(--dm);margin-bottom:.45rem">Pièces jointes (${ps.length})</div>
      <div class="rap-pj-grid">${items}</div>
    </div>`;
}

function rapStatut(r){ return String((r&&r.statut)||"en_attente"); }
function rapEtat(r){ return RAP_ETATS[rapStatut(r)]||RAP_ETATS.en_attente; }
function rapList(){ return Array.isArray(state.rapports)?state.rapports:[]; }
function rapById(id){ return rapList().find(r=>String(r.id)===String(id))||null; }
function rapIsMine(r){
  if(!r||!Auth.ok())return false;
  if(r.author_hash&&session.userHash&&r.author_hash===session.userHash)return true;
  return r.author_member_id!=null&&r.author_member_id!==""&&session.memberId!=null
    &&String(r.author_member_id)===String(session.memberId);
}
function rapMine(){ return rapList().filter(rapIsMine); }
function rapPending(){ return rapList().filter(r=>rapStatut(r)==="en_attente"); }

/* Rédaction : réservée aux grades qui doivent un rapport hebdomadaire. */
function canWriteRapport(){
  if(!Auth.ok())return false;
  if(session.role==="brs")return false;
  if(session.role==="admin")return true;
  const g=getSessionGrade();
  return !!g&&REPORT_EXEMPT.indexOf(g)===-1;
}
/* Validation : officier CPT+ ET porteur de la tâche « Gérer les rapports ». */
function canReviewRapport(){
  if(!Auth.ok())return false;
  if(session.role==="brs")return false;
  if(session.role==="admin")return true;
  if(gradeLevel(getSessionGrade())<3)return false;
  return getMyTasks().indexOf("rapports")!==-1;
}
/* Visibilité totale sur les comptes rendus : le haut commandement voit tout,
   même sans la tâche. Voir n'est pas valider : les boutons de décision
   restent réservés aux porteurs de la tâche. */
function canSeeAllRapports(){
  if(!Auth.ok())return false;
  if(session.role==="brs")return false;
  if(canReviewRapport())return true;
  return gradeLevel(getSessionGrade())>=6;
}
/* Suppression. Un compte rendu validé est une décision d'officier, pas un
   brouillon : son auteur ne peut plus l'effacer seul. Tant qu'il n'a pas été
   validé, en revanche, il reste à lui. */
function canDeleteRapport(r){
  if(!r||!Auth.ok())return false;
  if(session.role==="brs")return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  if(canReviewRapport())return true;
  if(gradeLevel(getSessionGrade())>=6)return true;
  return rapIsMine(r)&&rapStatut(r)!=="valide";
}

/* Officier assez gradé mais sans la tâche : on lui explique pourquoi. */
function rapOfficerWithoutTask(){
  if(!Auth.ok())return false;
  if(session.role==="brs"||session.role==="admin")return false;
  return gradeLevel(getSessionGrade())>=3&&getMyTasks().indexOf("rapports")===-1;
}

/* Les fonctions SQL dédiées quand elles existent, sinon écriture directe.
   On retient par nom de fonction : « absente » ne vaut que pour elle. */
const _rapRpcSeen={};
async function rapRpc(fn,args){
  if(_rapRpcSeen[fn]===false)return{missing:true};
  const pr=(Auth.ok()&&Auth.proof)?Auth.proof():null;
  if(!pr)return{failed:true};
  const r=await supaRpc(fn,Object.assign({p_auth_hash:pr.uh,p_auth_pass:pr.ph},args||{}));
  if(r.missing){_rapRpcSeen[fn]=false;return{missing:true};}
  if(r.ok)_rapRpcSeen[fn]=true;
  return r;
}
async function rapRefresh(){
  if(!supaOK)return;
  const rows=await supaGet(T.rapports);
  if(rows!==null)state.rapports=rows;
  renderRapports();checkMyReportStatus();
}

function rapCount(){
  const co=document.getElementById("rapContenu"), el=document.getElementById("rapCountLbl");
  if(!co||!el)return;
  const n=(co.value||"").length;
  el.textContent=n+" / "+RAP_TEXTE_MAX;
  el.style.color=n>RAP_TEXTE_MAX?"var(--rd)":(n<RAP_TEXTE_MIN?"var(--dm)":"var(--gr)");
}
/* Liste en cours de saisie. Remise à zéro à chaque ouverture du formulaire. */
let _rapPieces=[];

function renderRapPieces(){
  const box=document.getElementById("rapPiecesList");
  if(box){
    box.innerHTML=_rapPieces.length
      ? _rapPieces.map((p,i)=>`<div class="rap-pj">
          <span class="rap-pj-t">${p.t==="fichier"?"fichier":"lien"}</span>
          <a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.nom)}</a>
          ${p.taille?`<span class="rap-pj-s">${esc(rapTaille(p.taille))}</span>`:""}
          <button type="button" class="rap-pj-x" title="Retirer" aria-label="Retirer ${esc(p.nom)}" onclick="rapPieceDel(${i})">✕</button>
        </div>`).join("")
      : `<div class="mono-xs">Aucune pièce jointe.</div>`;
  }
  const c=document.getElementById("rapPiecesCount");
  if(c)c.textContent=_rapPieces.length+" / "+RAP_PIECES_MAX;
  const plein=_rapPieces.length>=RAP_PIECES_MAX;
  ["rapPieceAddBtn","rapPieceFileBtn"].forEach(k=>{
    const b=document.getElementById(k);
    if(b){b.disabled=plein;b.title=plein?("Maximum atteint : "+RAP_PIECES_MAX+" pièces jointes"):"";}
  });
}
function rapPieceDel(i){ _rapPieces.splice(i,1); renderRapPieces(); }
function rapPieceAdd(){
  const iu=document.getElementById("rapPieceUrl"), inom=document.getElementById("rapPieceNom");
  const url=((iu&&iu.value)||"").trim(), nom=((inom&&inom.value)||"").trim();
  if(_rapPieces.length>=RAP_PIECES_MAX){toast("Cinq pièces jointes au maximum","error");return;}
  if(!rapUrlOk(url)){toast("Colle une adresse complète, commençant par http:// ou https://","error");return;}
  if(_rapPieces.some(p=>p.url===url)){toast("Ce lien est déjà joint","info");return;}
  _rapPieces.push({t:"lien",url:url,nom:nom?nom.slice(0,RAP_PIECE_NOM_MAX):rapPieceNom({url:url}),taille:0});
  if(iu)iu.value="";
  if(inom)inom.value="";
  renderRapPieces();
}

/* Envoi d'un fichier dans l'espace de stockage. Le site doit continuer de
   marcher si l'espace n'existe pas encore : on le dit clairement et les liens
   restent disponibles. */
async function rapUpload(f){
  const qui=String((session&&session.userHash)||"anon").replace(/[^a-zA-Z0-9]/g,"").slice(0,24)||"anon";
  const base=(f.name||"piece").replace(/[^a-zA-Z0-9._-]/g,"_").slice(-60)||"piece";
  const chemin=qui+"/"+Date.now()+"_"+base;
  try{
    const rep=await fetch(`${SUPA_URL}/storage/v1/object/${RAP_BUCKET}/${encodeURI(chemin)}`,{
      method:"POST",
      headers:{apikey:SUPA_KEY,Authorization:"Bearer "+SUPA_KEY,
        "Content-Type":f.type||"application/octet-stream","x-upsert":"false"},
      body:f});
    if(rep.ok)return{ok:true,url:`${SUPA_URL}/storage/v1/object/public/${RAP_BUCKET}/${encodeURI(chemin)}`};
    if(rep.status===404)return{ok:false,message:"L'espace de stockage « rapports » n'existe pas encore : exécute rapports.sql, ou colle un lien."};
    if(rep.status===401||rep.status===403)return{ok:false,message:"L'espace de stockage refuse l'envoi : vérifie ses règles d'accès, ou colle un lien."};
    if(rep.status===409)return{ok:false,message:"Un fichier de ce nom existe déjà : renomme-le."};
    if(rep.status===413)return{ok:false,message:"Fichier refusé par le stockage : trop lourd."};
    return{ok:false,message:"Envoi impossible ("+rep.status+") : colle un lien en attendant."};
  }catch(e){
    return{ok:false,message:"Envoi impossible (réseau) : colle un lien en attendant."};
  }
}
async function rapPieceFichier(input){
  const f=input&&input.files&&input.files[0];
  if(!f)return;
  input.value="";
  const hint=document.getElementById("rapPieceHint");
  const dire=(m,c)=>{if(hint){hint.style.display=m?"":"none";hint.textContent=m||"";hint.style.color=c||"var(--or)";}};
  if(_rapPieces.length>=RAP_PIECES_MAX){toast("Cinq pièces jointes au maximum","error");return;}
  if(RAP_FICHIER_TYPES.indexOf(f.type)===-1){
    dire("Formats acceptés : PNG, JPEG, GIF, WebP et PDF.");toast("Format refusé","error");return;}
  if(f.size>RAP_FICHIER_MAX){
    dire("Fichier trop lourd : "+rapTaille(f.size)+" pour "+rapTaille(RAP_FICHIER_MAX)+" au maximum.");
    toast("Fichier trop lourd","error");return;}
  if(!supaOK||!Auth.ok()){dire("Envoi de fichier indisponible hors connexion : colle un lien.");return;}
  const btn=document.getElementById("rapPieceFileBtn");
  if(btn)btn.disabled=true;
  dire("Envoi de "+f.name+"…","var(--dm)");
  const r=await rapUpload(f);
  if(btn)btn.disabled=false;
  if(!r.ok){dire(r.message);toast("Envoi impossible","error");return;}
  dire("");
  _rapPieces.push({t:"fichier",url:r.url,nom:(f.name||"fichier").slice(0,RAP_PIECE_NOM_MAX),taille:f.size});
  renderRapPieces();
  toast("Pièce jointe ajoutée","success");
}

function openRapportModal(fromId){
  if(!canWriteRapport()){toast("La rédaction est réservée aux grades CT à LTN","error");return;}
  const src=fromId?rapById(fromId):null;
  const sel=document.getElementById("rapType");
  if(sel)sel.innerHTML=RAP_TYPES.map(t=>
    `<option value="${esc(t)}"${src&&src.type===t?" selected":""}>${esc(t)}</option>`).join("");
  const ti=document.getElementById("rapTitre"), co=document.getElementById("rapContenu"),
        er=document.getElementById("rapErr"), fi=document.getElementById("rapFromId"),
        tt=document.getElementById("rapModalTitle"), mb=document.getElementById("rapMotifBack");
  if(ti)ti.value=src?String(src.titre||""):"";
  if(co)co.value=src?String(src.contenu||""):"";
  if(fi)fi.value=src?String(src.id):"";
  if(er){er.style.display="none";er.textContent="";}
  if(tt)tt.textContent=src?"Reprendre le compte rendu":"Rédiger un compte rendu";
  if(mb){
    if(src&&src.refus_motif){mb.style.display="";mb.textContent="Motif du refus : "+String(src.refus_motif);}
    else{mb.style.display="none";mb.textContent="";}
  }
  _rapPieces=src?rapPieces(src):[];
  ["rapPieceUrl","rapPieceNom"].forEach(k=>{const e=document.getElementById(k);if(e)e.value="";});
  const ph=document.getElementById("rapPieceHint");
  if(ph){ph.style.display="none";ph.textContent="";}
  renderRapPieces();
  rapCount();
  document.getElementById("rapportModal").classList.add("show");
}

async function saveRapport(){
  const er=document.getElementById("rapErr");
  const fail=(m)=>{if(er){er.textContent=m;er.style.display="block";}};
  if(er)er.style.display="none";
  if(!canWriteRapport()){fail("La rédaction est réservée aux grades CT à LTN.");return;}
  const titre=(document.getElementById("rapTitre").value||"").trim();
  const type=document.getElementById("rapType").value||"Autre";
  const contenu=(document.getElementById("rapContenu").value||"").trim();
  if(!titre){fail("Donne un titre à ton compte rendu.");return;}
  if(contenu.length<RAP_TEXTE_MIN){fail("Le compte rendu est trop court : "+contenu.length+" caractères sur "+RAP_TEXTE_MIN+" minimum.");return;}
  if(contenu.length>RAP_TEXTE_MAX){fail("Le compte rendu est trop long : "+contenu.length+" caractères, maximum "+RAP_TEXTE_MAX+".");return;}
  const wk=getWeekKey(0);
  const pieces=_rapPieces.slice(0,RAP_PIECES_MAX).filter(p=>rapUrlOk(p.url));
  const res=await rapRpc("arc_rapport_submit",
    {p_titre:titre.slice(0,RAP_TITRE_MAX),p_type:type,p_contenu:contenu,p_week:wk,
     p_pieces:pieces.length?pieces:null});
  if(res.failed){fail("La base a refusé l'envoi : ton grade ne permet peut-être pas la rédaction.");return;}
  let row=null;
  if(res.ok){
    if(!res.data||res.data.ok!==true){fail("La base a refusé l'envoi.");return;}
    row=res.data.row||null;
  }else{
    /* Pas encore de fonction SQL : écriture directe. L'auteur vient de la
       session vérifiée, jamais d'un champ du formulaire. */
    const me=sessionMember();
    const obj={author_hash:session.userHash||"",
      author_name:me?(String(me.matricule||"?")+" "+String(me.nom||"")).trim():(session.user||"?"),
      author_member_id:me?String(me.id):null,author_grade:me?String(me.grade||""):"",
      titre:titre.slice(0,RAP_TITRE_MAX),type:type,contenu:contenu,
      statut:"en_attente",week_key:wk,created_at:new Date().toISOString()};
    if(pieces.length)obj.pieces=pieces;
    if(supaOK){
      let w=await supaPost(T.rapports,obj);
      if(w===null&&pieces.length){
        /* La colonne « pieces » manque sans doute : mieux vaut garder le
           compte rendu et le dire que tout perdre. */
        delete obj.pieces;
        w=await supaPost(T.rapports,obj);
        if(w!==null)toast("Compte rendu envoyé, mais sans les pièces jointes : la colonne manque en base","info");
      }
      if(w===null){fail("Envoi impossible : exécute rapports.sql dans Supabase (table arc_rapports).");return;}
      row=(w&&w[0])||obj;
    }else{obj.id=Date.now().toString();row=obj;}
  }
  if(row){ if(!state.rapports)state.rapports=[]; state.rapports.unshift(row); }
  if(!supaOK)saveLS();
  closeModal("rapportModal");
  renderRapports();checkMyReportStatus();
  toast("Compte rendu soumis - en attente de validation","success");
  await logActivity((session?.user||"?")+" a soumis un compte rendu : "+titre);
}

async function rapReview(id,decision){
  if(!canReviewRapport()){toast("Réservé aux officiers ayant la tâche « Gérer les rapports »","error");return;}
  if(decision!=="valide"&&decision!=="refuse")return;
  const r=rapById(id);
  if(!r){toast("Compte rendu introuvable","error");return;}
  if(rapStatut(r)!=="en_attente"){toast("Ce compte rendu a déjà été traité","info");renderRapports();return;}

  let motif="";
  if(decision==="refuse"){
    const saisie=await uiPrompt({kicker:"// REFUS",title:"Motif du refus",
      message:"L'auteur verra ce motif dans son espace. Dis-lui ce qui doit être corrigé.",
      okText:"Refuser",placeholder:"ex : il manque le déroulé et les pertes"});
    if(saisie===null)return;
    motif=String(saisie||"").trim();
    if(motif.length<3){toast("Un refus doit être justifié","error");return;}
    motif=motif.slice(0,RAP_MOTIF_MAX);
  }else{
    const apercu=state.discord.rapports
      ? "Il part ensuite dans le salon Discord des comptes rendus :\n\n"
        +discordPreview(discordRapportPayload(r,session?.user))
      : "Aucun salon Discord n'est configuré : le compte rendu sera validé sans être publié.";
    if(!await uiConfirm({kicker:"// VALIDATION",title:"Valider ce compte rendu ?",
      message:apercu,okText:"Valider et publier",wide:true}))return;
  }

  const res=await rapRpc("arc_rapport_review",{p_id:String(id),p_decision:decision,p_motif:motif});
  let row=null;
  if(res.failed){toast("La base a refusé la décision","error");return;}
  if(res.ok){
    if(!res.data||res.data.ok!==true){
      toast(res.data&&res.data.reason==="deja_traite"
        ?"Trop tard : un autre officier a déjà tranché":"Décision refusée","info");
      await rapRefresh();return;
    }
    row=res.data.row||null;
  }else{
    const patch={statut:decision,reviewer_hash:session.userHash||"",reviewer_name:session.user||"?",
      reviewed_at:new Date().toISOString(),refus_motif:decision==="refuse"?motif:null};
    if(supaOK){
      /* le filtre contient le statut : un seul officier peut gagner */
      const w=await supaPatch(T.rapports,"id=eq."+encodeURIComponent(id)+"&statut=eq.en_attente",patch);
      if(w===null){toast("La base a refusé la décision","error");return;}
      if(Array.isArray(w)&&w.length===0){
        toast("Trop tard : un autre officier a déjà tranché","info");await rapRefresh();return;}
      row=(Array.isArray(w)&&w[0])?w[0]:Object.assign({},r,patch);
    }else{row=Object.assign({},r,patch);saveLS();}
  }
  Object.assign(r,row||{});
  closeModal("rapportViewModal");
  if(decision==="valide"){
    await rapCreditWeek(r);
    toast("Compte rendu validé ✓","success");
    await rapPublish(r.id,true);
  }else{
    toast("Compte rendu refusé - l'auteur voit le motif","info");
  }
  renderRapports();checkMyReportStatus();
  await logActivity((session?.user||"?")+" a "+(decision==="valide"?"validé":"refusé")
    +" le compte rendu « "+String(r.titre||"?")+" » de "+String(r.author_name||"?"));
}

/* Réservation de la publication EN BASE : le premier qui l'obtient publie,
   les autres repartent les mains vides. C'est ça qui empêche le doublon. */
async function rapClaim(id){
  const res=await rapRpc("arc_rapport_claim",{p_id:String(id)});
  if(res.failed)return{won:false,err:true};
  if(res.ok)return(res.data&&res.data.ok===true)?{won:true,row:res.data.row||null}:{won:false};
  if(!supaOK){
    const r=rapById(id);
    if(r){r.published_at=new Date().toISOString();saveLS();}
    return{won:true,row:null};
  }
  const w=await supaPatch(T.rapports,
    "id=eq."+encodeURIComponent(id)+"&statut=eq.valide&published_at=is.null",
    {published_at:new Date().toISOString(),publisher_hash:session?.userHash||""});
  if(w===null)return{won:false,err:true};
  if(Array.isArray(w)&&w.length===0)return{won:false};
  return{won:true,row:(Array.isArray(w)&&w[0])?w[0]:null};
}
/* L'envoi Discord a échoué : on rend la réservation pour pouvoir réessayer. */
async function rapRelease(id){
  const res=await rapRpc("arc_rapport_release",{p_id:String(id)});
  if(res.missing&&supaOK&&session&&session.userHash){
    await supaPatch(T.rapports,
      "id=eq."+encodeURIComponent(id)+"&publisher_hash=eq."+encodeURIComponent(session.userHash),
      {published_at:null,publisher_hash:null});
  }
  const r=rapById(id);
  if(r){r.published_at=null;r.publisher_hash=null;}
  if(!supaOK)saveLS();
}

async function rapPublish(id,auto){
  const r=rapById(id);
  if(!r)return false;
  if(!canReviewRapport()){
    if(!auto)toast("Réservé aux officiers ayant la tâche « Gérer les rapports »","error");
    return false;
  }
  if(rapStatut(r)!=="valide"){
    if(!auto)toast("Seul un compte rendu validé peut être publié","error");
    return false;
  }
  if(r.published_at){ if(!auto)toast("Ce compte rendu est déjà publié","info"); return false; }
  const url=state.discord.rapports||"";
  if(!url){toast("Le salon Discord des comptes rendus n'est pas configuré","error");return false;}
  const claim=await rapClaim(r.id);
  if(!claim.won){
    toast(claim.err?"Publication impossible":"Déjà publié par quelqu'un d'autre","info");
    await rapRefresh();return false;
  }
  if(claim.row)Object.assign(r,claim.row);
  const sent=await discordSend(url,discordRapportPayload(r,r.reviewer_name||session?.user),false);
  if(!sent){
    await rapRelease(r.id);
    toast("Validé, mais l'envoi Discord a échoué - le bouton « Publier » permet de réessayer","error");
    renderRapports();return false;
  }
  toast("Publié dans le salon des comptes rendus ✓","success");
  renderRapports();
  await logActivity((session?.user||"?")+" a publié le compte rendu « "+String(r.titre||"?")+" » sur Discord");
  return true;
}

/* Un compte rendu validé coche la semaine de son auteur dans le suivi
   hebdomadaire : c'est le mécanisme qui existe déjà, on ne le double pas. */
async function rapCreditWeek(r){
  const mid=r&&r.author_member_id;
  if(mid===null||mid===undefined||mid==="")return;
  const m=memberById(mid);
  if(!m)return;
  const wk=String(r.week_key||"")||weekKeyOf(r.created_at||"");
  if(!wk||frozenWeek(wk))return;
  if((state.reports||[]).some(x=>String(x.member_id)===String(mid)&&x.week_key===wk))return;
  const obj={member_id:mid,member_name:(String(m.matricule||"?")+" "+String(m.nom||"")).trim(),week_key:wk};
  if(supaOK){const w=await supaPost(T.reports,obj);if(w&&w.length>0)state.reports.push(w[0]);}
  else{obj.id=Date.now().toString();state.reports.push(obj);saveLS();}
}

function rapTypeColor(t){
  const k=String(t||"").toLowerCase();
  if(k.indexOf("mission")===0)return 0xff8a3d;
  if(k.indexOf("incident")===0)return 0xff3b5c;
  if(k.indexOf("entra")===0)return 0x22d97a;
  if(k.indexOf("formation")===0)return 0x6f9bff;
  return 0x00e5ff;
}
function discordRapportPayload(r,validateur){
  const titre=String((r&&r.titre)||"Compte rendu");
  const corps=String((r&&r.contenu)||"");
  const auteur=String((r&&r.author_name)||"?")+((r&&r.author_grade)?" ("+String(r.author_grade)+")":"");
  const pieces=rapPieces(r);
  const embed={
    title:"📝 "+titre.slice(0,250),
    description:corps.length>3900?corps.slice(0,3900)+"…":corps,
    color:rapTypeColor(r&&r.type),
    fields:[
      {name:"Auteur",value:auteur.slice(0,250)||"?",inline:true},
      {name:"Type",value:String((r&&r.type)||"Autre").slice(0,250),inline:true},
      {name:"Validé par",value:String(validateur||"?").slice(0,250),inline:true}
    ],
    footer:{text:"Compte rendu validé · Centre de Commandement"},
    timestamp:new Date().toISOString()
  };
  if(pieces.length){
    /* Les crochets et parenthèses casseraient le lien Markdown de Discord. */
    const lignes=pieces.map(p=>"["+String(p.nom).replace(/[\[\]()]/g,"").slice(0,80)+"]("+p.url+")");
    embed.fields.push({name:"Pièces jointes ("+pieces.length+")",
      value:lignes.join("\n").slice(0,1000),inline:false});
    const img=pieces.find(p=>rapEstImage(p.url));
    if(img)embed.image={url:img.url};
  }
  return {embeds:[embed]};
}

const RAP_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
function rapPill(r){
  const e=rapEtat(r);
  return `<span class="badge" style="color:${e.color};background:color-mix(in srgb,${e.color} 13%,transparent)">${esc(e.label)}</span>`;
}
async function rapDelete(id){
  const r=rapById(id);
  if(!r){toast("Compte rendu introuvable","error");return;}
  if(!canDeleteRapport(r)){toast("Tu ne peux pas supprimer ce compte rendu","error");return;}

  const dit=["Supprimer définitivement « "+String(r.titre||"?")+" » ?"];
  if(r.published_at)dit.push("Il a déjà été publié : le message Discord, lui, restera en place.");
  else if(rapStatut(r)==="valide")dit.push("Il a été validé par "+String(r.reviewer_name||"un officier")+".");
  if(!await uiConfirm({kicker:"// SUPPRESSION",title:"Supprimer le compte rendu",
    message:dit.join("\n\n"),okText:"Supprimer",cancelText:"Annuler",danger:true}))return;

  const res=await rapRpc("arc_rapport_delete",{p_id:String(id)});
  if(res.failed){toast("La base a refusé la suppression","error");return;}
  if(res.ok){
    if(!res.data||res.data.ok!==true){
      const quoi=(res.data&&res.data.reason)||"";
      toast(quoi==="interdit"?"La base a refusé : droits insuffisants"
           :(quoi==="introuvable"?"Ce compte rendu n'existe plus":"Suppression refusée"),"error");
      await rapRefresh();
      return;
    }
  }else if(supaOK){
    /* Pas encore de fonction SQL : suppression directe. */
    const w=await supaDelete(T.rapports,"id=eq."+encodeURIComponent(id));
    if(!w){toast("Suppression impossible : la base a refusé","error");return;}
  }
  state.rapports=rapList().filter(x=>String(x.id)!==String(id));
  if(!supaOK)saveLS();
  closeModal("rapportViewModal");
  renderRapports();checkMyReportStatus();
  toast("Compte rendu supprimé","info");
  await logActivity((session?.user||"?")+" a supprimé le compte rendu : "+String(r.titre||"?"));
}

function rapCardHtml(r,opts){
  const o=opts||{}, e=rapEtat(r), st=rapStatut(r);
  const acts=[`<button class="xs sbtn" onclick="openRapportView('${escJs(r.id)}')">Consulter</button>`];
  if(o.review&&st==="en_attente"){
    acts.push(`<button class="xs sbtn green" onclick="rapReview('${escJs(r.id)}','valide')">Valider</button>`);
    acts.push(`<button class="xs sbtn danger" onclick="rapReview('${escJs(r.id)}','refuse')">Refuser</button>`);
  }
  if(o.review&&st==="valide"&&!r.published_at){
    acts.push(`<button class="xs sbtn blue" onclick="rapPublish('${escJs(r.id)}',false)">Publier</button>`);
  }
  if(o.mine&&st==="refuse"){
    acts.push(`<button class="xs sbtn" onclick="openRapportModal('${escJs(r.id)}')">Reprendre</button>`);
  }
  if(canDeleteRapport(r)){
    acts.push(`<button class="xs sbtn danger" onclick="rapDelete('${escJs(r.id)}')">Supprimer</button>`);
  }
  const meta=[esc(r.author_name||"?"),fmtDate(r.created_at)];
  const _np=rapPieces(r).length;
  if(_np)meta.push(_np+" pièce"+(_np>1?"s":"")+" jointe"+(_np>1?"s":""));
  if(r.reviewed_at)meta.push((st==="valide"?"validé":"refusé")+" par "+esc(r.reviewer_name||"?")+" le "+fmtDate(r.reviewed_at));
  if(r.published_at)meta.push("publié sur Discord");
  else if(st==="valide")meta.push("pas encore publié");
  return `<div class="ann" style="border-left-color:${e.color}">
    <div class="ann-ico" style="color:${e.color}">${RAP_ICON}</div>
    <div class="ann-c">
      <div class="ann-t">${escTrunc(r.titre,RAP_TITRE_MAX)}${rapPill(r)}<span class="mono-xs">${esc(r.type||"")}</span></div>
      <div class="ann-d">${escTrunc(r.contenu,220)}</div>
      ${(st==="refuse"&&r.refus_motif)?`<div style="margin-top:.45rem;padding:.4rem .6rem;background:rgba(255,59,92,.08);border:1px solid rgba(255,59,92,.25);font-size:.78rem;color:var(--tx2)"><b style="color:var(--rd)">Motif du refus :</b> ${escTrunc(r.refus_motif,RAP_MOTIF_MAX)}</div>`:""}
      <div class="ann-meta">${meta.join(" · ")}<span style="display:inline-flex;gap:.35rem;margin-left:.8rem;flex-wrap:wrap">${acts.join("")}</span></div>
    </div></div>`;
}

function openRapportView(id){
  const r=rapById(id);
  if(!r)return;
  const st=rapStatut(r);
  const b=document.getElementById("rapViewBody");
  if(b){
    b.innerHTML=`<div style="display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;margin-bottom:.7rem">
        ${rapPill(r)}<span style="font-family:var(--fm);font-size:.74rem;color:var(--dm)">${esc(r.type||"Autre")}</span>
        ${r.published_at?`<span style="font-family:var(--fm);font-size:.74rem;color:var(--gr)">publié sur Discord</span>`:""}
      </div>
      <div style="font-family:var(--fs);font-size:1rem;font-weight:700;margin-bottom:.25rem">${escTrunc(r.titre,RAP_TITRE_MAX)}</div>
      <div style="font-family:var(--fm);font-size:.74rem;color:var(--dm);margin-bottom:.9rem">${esc(r.author_name||"?")}${r.author_grade?" · "+esc(r.author_grade):""} · ${fmtDate(r.created_at)}</div>
      <div style="white-space:pre-wrap;font-size:.86rem;color:var(--tx);line-height:1.7;background:var(--s2);border:1px solid var(--ln);padding:.9rem 1rem">${esc(r.contenu||"")}</div>
      ${rapPiecesHtml(r)}
      ${(st==="refuse"&&r.refus_motif)?`<div style="margin-top:.8rem;padding:.6rem .8rem;background:rgba(255,59,92,.08);border:1px solid rgba(255,59,92,.25);font-size:.82rem"><b style="color:var(--rd)">Motif du refus :</b> ${escTrunc(r.refus_motif,RAP_MOTIF_MAX)}</div>`:""}
      ${r.reviewed_at?`<div style="margin-top:.6rem;font-family:var(--fm);font-size:.74rem;color:var(--dm)">${st==="valide"?"Validé":"Refusé"} par ${esc(r.reviewer_name||"?")} le ${fmtDate(r.reviewed_at)}</div>`:""}`;
  }
  const f=document.getElementById("rapViewFoot");
  if(f){
    const acts=[`<button class="btn btn-ghost" onclick="closeModal('rapportViewModal')">Fermer</button>`];
    if(canReviewRapport()&&st==="en_attente"){
      acts.push(`<button class="btn btn-danger" onclick="rapReview('${escJs(r.id)}','refuse')">Refuser</button>`);
      acts.push(`<button class="btn btn-primary" onclick="rapReview('${escJs(r.id)}','valide')">Valider et publier</button>`);
    }
    if(canReviewRapport()&&st==="valide"&&!r.published_at){
      acts.push(`<button class="btn btn-primary" onclick="rapPublish('${escJs(r.id)}',false)">Publier sur Discord</button>`);
    }
    if(rapIsMine(r)&&st==="refuse"){
      acts.push(`<button class="btn btn-primary" onclick="closeModal('rapportViewModal');openRapportModal('${escJs(r.id)}')">Reprendre</button>`);
    }
    if(canDeleteRapport(r)){
      acts.splice(1,0,`<button class="btn btn-danger" onclick="rapDelete('${escJs(r.id)}')">Supprimer</button>`);
    }
    f.innerHTML=acts.join("");
  }
  document.getElementById("rapportViewModal").classList.add("show");
}

function renderRapports(){
  const write=canWriteRapport(), review=canReviewRapport(), voit=canSeeAllRapports();
  const show=(id,on)=>{const el=document.getElementById(id);if(el)el.style.display=on?"":"none";};
  show("rapWriteCards",write);
  show("rapMineSection",write);
  show("rapQueueSection",voit);
  show("rapHistSection",voit);
  show("rapStats",voit);
  show("rapTaskHint",rapOfficerWithoutTask());
  show("rapNoRight",!write&&!voit);
  show("rapHookWarn",review&&!state.discord.rapports);
  show("rapReadOnly",voit&&!review);
  const tag=document.getElementById("rapSalonTag");
  if(tag)tag.textContent=state.discord.rapports?"salon configuré":"aucun salon configuré";

  const all=rapList(), pend=rapPending();
  const g=id=>document.getElementById(id);
  const nVal=all.filter(r=>rapStatut(r)==="valide").length;
  const nRef=all.filter(r=>rapStatut(r)==="refuse").length;
  const nPub=all.filter(r=>rapStatut(r)==="valide"&&!r.published_at).length;
  if(g("rapStatPend"))g("rapStatPend").textContent=pend.length;
  if(g("rapStatVal"))g("rapStatVal").textContent=nVal;
  if(g("rapStatRef"))g("rapStatRef").textContent=nRef;
  if(g("rapStatPub"))g("rapStatPub").textContent=nPub;
  statTone("rapStatPend",pend.length?"warn":"ok",pend.length?"à relire":"rien en attente");
  statTone("rapStatVal",nVal?"ok":"mute",all.length?"sur "+all.length+" au total":"");
  statTone("rapStatRef",nRef?"crit":"mute",nRef?"à reprendre":"");
  statTone("rapStatPub",nPub?"warn":"ok",nPub?"à publier":"tout est publié");

  const q=g("rapQueue");
  if(q&&voit)q.innerHTML=pend.length?pend.map(r=>rapCardHtml(r,{review:review})).join("")
    :'<div class="empty"><p>Aucun compte rendu en attente</p></div>';
  const h=g("rapHist");
  if(h&&voit){
    const done=all.filter(r=>rapStatut(r)!=="en_attente").slice(0,40);
    h.innerHTML=done.length?done.map(r=>rapCardHtml(r,{review:review})).join("")
      :'<div class="empty"><p>Aucune décision pour le moment</p></div>';
  }
  const mn=g("rapMine");
  if(mn&&write){
    const m=rapMine();
    mn.innerHTML=m.length?m.map(r=>rapCardHtml(r,{mine:true})).join("")
      :'<div class="empty"><p>Aucun compte rendu soumis pour le moment</p></div>';
  }
}
