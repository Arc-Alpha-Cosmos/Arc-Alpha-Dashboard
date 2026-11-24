/* ARC ALPHA - Module pantheon.
   Les Commandants-Marechaux de l'unite : celui en fonction, et ceux qui l'ont
   ete. Stockage dans arc_config, cle « pantheon » ({entries:[...]}), comme
   reportExempt ou regiments : aucune table ni colonne nouvelle. Ecriture par
   configMerge, qui relit la valeur distante avant d'ecrire.

   Une entree : {id, nom, matricule, member_id, debut, fin, discord, commentaire,
                 by, at}
     debut / fin : dates AAAA-MM-JJ ; fin vide = en fonction.

   Le CMDM en fonction : l'entree sans date de fin (la plus recente) ; a
   defaut, le membre de l'effectif au grade CMDM, avec sa date de promotion. */

if(!state.pantheon)state.pantheon={entries:[]};
const PANTHEON_COMMENT_MAX=500;
let _panEditId=null;

function canEditPantheon(){
  if(!Auth.ok())return false;
  if(session.role==="admin")return true;
  if(session.role==="brs"||session.role==="amiraute")return false;
  return gradeLevel(getSessionGrade())>=6;
}
function panEntries(){
  const p=state.pantheon;
  return (p&&Array.isArray(p.entries)?p.entries:[]).filter(e=>e&&e.id&&(e.nom||e.matricule));
}
function panById(id){ return panEntries().find(e=>String(e.id)===String(id))||null; }
/* Un ancien CMDM : une date de depart, ou seulement une duree en mois quand
   ses dates ne sont pas connues (joueurs d'avant le tableau de bord). */
function panMois(e){ const n=parseInt(e&&e.mois,10); return n>0?n:0; }
function panIsFormer(e){ return !!(e&&(e.fin||panMois(e))); }
/* ordre chronologique ; les commandements sans dates passent en premier
   (ils precedent le tableau de bord), dans l'ordre ou ils ont ete inscrits */
function panChrono(a,b){ return String(a.debut||"").localeCompare(String(b.debut||"")); }
function panFormer(){
  return panEntries().filter(panIsFormer).sort(panChrono);
}
function panMoisTxt(n){
  if(n<12)return n+" mois";
  const ans=Math.floor(n/12),r=n%12;
  return ans+(ans>1?" ans":" an")+(r?" et "+r+" mois":"");
}
function panDureeE(e){ return panMois(e)?panMoisTxt(panMois(e)):panDuree(e.debut,e.fin); }
function panJours(e){ return panMois(e)?Math.round(panMois(e)*30.44):Math.max(0,panDays(e.debut,e.fin)||0); }
/* Le CMDM en fonction. `source` dit d'ou vient l'information. */
function panCurrent(){
  const cur=panEntries().filter(e=>!panIsFormer(e)).sort((a,b)=>String(b.debut||"").localeCompare(String(a.debut||"")))[0];
  if(cur)return Object.assign({source:"pantheon"},cur);
  const m=(state.members||[]).find(x=>(x.categorie||"effectif")==="effectif"&&x.grade==="CMDM");
  if(!m)return null;
  return {source:"effectif",id:null,nom:m.nom||"",matricule:m.matricule||"",member_id:m.id,
    debut:m.date_promo||"",fin:null,discord:"",commentaire:""};
}
/* Libelle a jour : si l'entree est liee a un membre encore present, on prend
   son nom actuel (memes regles que memberLabel ailleurs). */
function panName(e){
  const m=e&&e.member_id!=null?memberById(e.member_id):null;
  return {mat:(m&&m.matricule)||e.matricule||"",nom:(m&&m.nom)||e.nom||""};
}

/* ---------- outils d'affichage ---------- */
function panRoman(n){
  const t=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let s="";for(const [v,r] of t)while(n>=v){s+=r;n-=v;}return s||"-";
}
function panDays(a,b){
  const pa=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(a||"")),pb=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(b||""));
  if(!pa||!pb)return null;
  return Math.round((new Date(+pb[1],+pb[2]-1,+pb[3])-new Date(+pa[1],+pa[2]-1,+pa[3]))/864e5);
}
function panDuree(a,b){
  const d=panDays(a,b);
  if(d===null||d<0)return "";
  if(d<31)return d+(d>1?" jours":" jour");
  const mois=Math.floor(d/30.44);
  if(mois<12)return mois+" mois";
  const ans=Math.floor(mois/12),r=mois%12;
  return ans+(ans>1?" ans":" an")+(r?" et "+r+" mois":"");
}
/* Au centre de la couronne : le matricule s'il est de la forme A-chiffres,
   sinon une couronne. Pas d'initiales : un nom vide les fabriquait a partir
   du matricule (« A-92 » devenait « A9 »). */
function panCrest(e){
  const n=panName(e), mm=/^A\s*-?\s*(\d{1,4})$/i.exec(String(n.mat||"").trim());
  if(mm)return `<span class="pan-crest-mat${mm[1].length>2?" long":""}">A-${mm[1]}</span>`;
  return `<span class="pan-crest-ico">${navIconHtml("crown")}</span>`;
}
/* Couronne de laurier dessinee en SVG : deux branches de feuilles en arc,
   degrade dore. Aucune image externe. */
function panLaurel(size,uid){
  const g="lg"+uid, R=34, rad=a=>a*Math.PI/180, out=[];
  const leaf=(r,deg,rot,s)=>{
    const x=50+r*Math.cos(rad(deg)), y=50+r*Math.sin(rad(deg));
    return {x,y,rot,s};
  };
  /* branche gauche : du bas (100 deg) vers le haut (250 deg), feuilles
     alternees dehors / dedans, inclinees le long du cercle */
  const left=[];
  for(let i=0;i<11;i++){
    const deg=104+i*13.5, s=1-i*0.045, tan=deg+90;
    left.push(leaf(R+3.6,deg,tan+38,s));
    left.push(leaf(R-3.6,deg+6,tan-38,s*0.9));
  }
  const draw=l=>`<ellipse cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" rx="${(5.4*l.s).toFixed(1)}" ry="${(2.2*l.s).toFixed(1)}" transform="rotate(${l.rot.toFixed(1)} ${l.x.toFixed(1)} ${l.y.toFixed(1)})"/>`;
  left.forEach(l=>{out.push(draw(l));out.push(draw({x:100-l.x,y:l.y,rot:180-l.rot,s:l.s}));});
  const p=deg=>[50+R*Math.cos(rad(deg)),50+R*Math.sin(rad(deg))].map(v=>v.toFixed(1));
  const [ax,ay]=p(100),[bx,by]=p(250);
  return `<svg class="pan-laurel" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#e8b923"/><stop offset="1" stop-color="#8a6512"/></linearGradient></defs>
    <g fill="none" stroke="url(#${g})" stroke-width="1.3" stroke-linecap="round" opacity=".85">
      <path d="M${ax} ${ay} A${R} ${R} 0 0 1 ${bx} ${by}"/>
      <path d="M${(100-ax).toFixed(1)} ${ay} A${R} ${R} 0 0 0 ${(100-bx).toFixed(1)} ${by}"/>
    </g>
    <g fill="url(#${g})">${out.join("")}</g>
    <path d="M44 86 L50 82 L56 86" fill="none" stroke="url(#${g})" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
function panDiscordHtml(d){
  const v=String(d||"").trim();
  if(!v)return "";
  return `<button type="button" class="pan-discord" onclick="panCopy(this,'${escJs(v)}')" title="Copier l'identifiant Discord" aria-label="Copier l'identifiant Discord ${esc(v)}">
    ${navIconHtml("message-circle")}<span>${esc(v)}</span>${navIconHtml("copy")}</button>`;
}
function panCopy(btn,v){
  const ok=()=>{toast("Identifiant Discord copié : "+v,"success");};
  try{navigator.clipboard.writeText(v).then(ok,()=>toast("Copie refusée par le navigateur","error"));}
  catch(e){toast("Copie impossible","error");}
}

/* ---------- vue d'ensemble : le CMDM en fonction ---------- */
function renderOvCmdm(){
  const el=document.getElementById("ovCmdm");
  if(!el)return;
  const c=panCurrent();
  if(!c){
    el.innerHTML=canEditPantheon()
      ?`<div class="pan-ov pan-ov-empty"><span class="pan-ov-k">${navIconHtml("crown")} Commandement</span>
         <span>Aucun Commandant-Maréchal n'est désigné dans l'effectif.</span>
         <button class="sbtn" onclick="openPantheonModal()">Renseigner le commandement</button></div>`:"";
    lucideRefresh(el);return;
  }
  const n=panName(c), today=ymdLocal(new Date());
  const depuis=c.debut?panDuree(c.debut,today):"";
  el.innerHTML=`<section class="pan-ov" aria-label="Commandant-Maréchal en fonction">
    <div class="pan-ov-crest">${panLaurel(84,"ov")}<span class="pan-ov-ini">${panCrest(c)}</span></div>
    <div class="pan-ov-main">
      <span class="pan-ov-k">${navIconHtml("crown")} Commandant-Maréchal en fonction</span>
      <div class="pan-ov-name">${n.mat?`<span class="pan-mat">${esc(n.mat)}</span>`:""}${esc(n.nom)}</div>
      <div class="pan-ov-meta">
        ${c.debut?`<span>${navIconHtml("calendar")}En poste depuis le ${esc(fmtDate(c.debut))}${depuis?` · ${esc(depuis)}`:""}</span>`:""}
        ${panDiscordHtml(c.discord)}
      </div>
      ${c.commentaire?`<p class="pan-ov-quote">« ${esc(c.commentaire)} »</p>`:""}
    </div>
    <div class="pan-ov-act">
      <button class="sbtn" onclick="dashTab('pantheon')">${navIconHtml("landmark")}Panthéon</button>
      ${canEditPantheon()&&c.source==="effectif"?`<button class="sbtn" onclick="openPantheonModal(null,true)">Compléter sa fiche</button>`:""}
    </div>
  </section>`;
  lucideRefresh(el);
}

/* ---------- onglet Pantheon ---------- */
function renderPantheon(){
  const root=document.getElementById("pantheonBody");
  if(!root)return;
  const edit=canEditPantheon();
  const addBtn=document.getElementById("panAddBtn");
  if(addBtn)addBtn.style.display=edit?"":"none";
  const former=panFormer(), cur=panCurrent(), today=ymdLocal(new Date());
  /* rang chronologique : I pour le premier CMDM de l'histoire de l'unite */
  const tous=panEntries().slice().sort((a,b)=>String(a.debut||"").localeCompare(String(b.debut||"")));
  const rang=e=>{const i=tous.findIndex(x=>String(x.id)===String(e.id));return i<0?tous.length+1:i+1;};
  const totalJours=former.reduce((s,e)=>s+panJours(e),0);
  const moy=former.length?panDuree("2000-01-01",addDaysYmd("2000-01-01",Math.round(totalJours/former.length))):"";
  /* l'annee du premier commandement n'a de sens que si tous les anciens sont dates */
  const premier=former.some(e=>!e.debut)?null:tous.find(e=>e.debut);

  let h=`<header class="pan-hero">
    <div class="pan-hero-crest">${panLaurel(150,"hero")}<span class="pan-hero-ico">${navIconHtml("landmark")}</span></div>
    <div class="pan-hero-k">ARC Alpha · Mémoire du commandement</div>
    <h2 class="pan-hero-t">Panthéon des Commandants-Maréchaux</h2>
    <p class="pan-hero-s">Ceux qui ont porté le commandement de l'unité. Leurs noms restent ici, dans l'ordre où ils ont servi.</p>
    <div class="pan-hero-stats">
      <div><b>${tous.length+(cur&&cur.source==="effectif"?1:0)}</b><span>Commandant${tous.length>1?"s":""} inscrit${tous.length>1?"s":""}</span></div>
      ${premier&&premier.debut?`<div><b>${esc(String(premier.debut).slice(0,4))}</b><span>Premier commandement</span></div>`:""}
      ${moy?`<div><b>${esc(moy)}</b><span>Durée moyenne</span></div>`:""}
    </div>
  </header>`;

  if(cur){
    const n=panName(cur);
    h+=`<section class="pan-current" aria-label="En fonction">
      <div class="pan-current-badge">${navIconHtml("crown")}En fonction</div>
      <div class="pan-current-crest">${panLaurel(132,"cur")}<span class="pan-current-ini">${panCrest(cur)}</span></div>
      <div class="pan-current-body">
        <div class="pan-rank">${cur.source==="pantheon"?panRoman(rang(cur))+" · ":""}Commandant-Maréchal</div>
        <div class="pan-current-name">${n.mat?`<span class="pan-mat">${esc(n.mat)}</span>`:""}${esc(n.nom)}</div>
        <div class="pan-meta">
          ${cur.debut?`<span>${navIconHtml("calendar")}Depuis le ${esc(fmtDate(cur.debut))} · ${esc(panDuree(cur.debut,today)||"aujourd'hui")}</span>`:""}
          ${panDiscordHtml(cur.discord)}
        </div>
        ${cur.commentaire?`<blockquote class="pan-quote">${esc(cur.commentaire)}</blockquote>`:""}
        ${edit?`<div class="pan-actions">${cur.source==="pantheon"
          ?`<button class="sbtn" onclick="openPantheonModal('${escJs(cur.id)}')">${navIconHtml("pencil")}Modifier</button>
             <button class="sbtn" onclick="panEndTerm('${escJs(cur.id)}')">${navIconHtml("flag")}Clore son commandement</button>`
          :`<button class="sbtn" onclick="openPantheonModal(null,true)">${navIconHtml("pencil")}Compléter sa fiche</button>
             <span class="mono-xs">Repris de l'effectif : ajoute son Discord et un mot.</span>`}</div>`:""}
      </div>
    </section>`;
  }

  h+=`<div class="pan-sec"><span class="pan-sec-line"></span><h3>Les anciens commandants</h3><span class="pan-sec-line"></span></div>`;
  if(!former.length){
    h+=`<div class="pan-empty">${panLaurel(90,"empty")}<p>Le panthéon attend son premier nom.</p>
      <span>Quand un Commandant-Maréchal quitte son poste, son commandement est inscrit ici.</span>
      ${edit?`<button class="btn btn-primary" onclick="openPantheonModal()">${navIconHtml("plus")}Inscrire un ancien CMDM</button>`:""}</div>`;
  }else{
    h+=`<ol class="pan-list">`+former.slice().reverse().map((e,i)=>{
      const n=panName(e);
      return `<li class="pan-plaque" style="--i:${Math.min(i,8)}">
        <div class="pan-plaque-num" aria-label="Rang ${rang(e)}">${panRoman(rang(e))}</div>
        <div class="pan-plaque-body">
          <div class="pan-plaque-name">${n.mat?`<span class="pan-mat">${esc(n.mat)}</span>`:""}${esc(n.nom)}</div>
          <div class="pan-meta">
            ${e.debut||e.fin?`<span>${navIconHtml("calendar")}${e.debut?esc(fmtDate(e.debut)):"?"} <span class="pan-arrow">→</span> ${e.fin?esc(fmtDate(e.fin)):"?"}</span>`:`<span>${navIconHtml("calendar")}Dates non connues</span>`}
            ${panDureeE(e)?`<span class="pan-chip">${esc(panDureeE(e))} de commandement</span>`:""}
            ${panDiscordHtml(e.discord)}
          </div>
          ${e.commentaire?`<blockquote class="pan-quote">${esc(e.commentaire)}</blockquote>`:""}
        </div>
        ${edit?`<div class="pan-plaque-act">
          <button class="icon-btn" onclick="openPantheonModal('${escJs(e.id)}')" title="Modifier" aria-label="Modifier ${esc(n.mat)}">${navIconHtml("pencil")}</button>
          <button class="icon-btn del" onclick="deletePantheonEntry('${escJs(e.id)}')" title="Retirer du panthéon" aria-label="Retirer ${esc(n.mat)} du panthéon">${navIconHtml("trash-2")}</button>
        </div>`:""}
      </li>`;
    }).join("")+`</ol>`;
  }
  root.innerHTML=h;
  lucideRefresh(root);
}

/* ---------- edition ---------- */
function openPantheonModal(id,fromRoster){
  if(!canEditPantheon()){toast("Réservé aux CMD, CMDM et à l'administration","error");return;}
  fieldsClear("pantheonModal");
  const e=id?panById(id):null;
  _panEditId=e?e.id:null;
  const g=k=>document.getElementById(k);
  /* liste des membres pour pre-remplir le nom et le matricule */
  const sel=g("panMember");
  if(sel){
    const ms=sortMembers((state.members||[]).filter(m=>(m.categorie||"effectif")!=="blacklist"));
    sel.innerHTML='<option value="">Aucun (ancien membre, hors effectif)</option>'+ms.map(m=>
      `<option value="${esc(m.id)}">${esc((m.matricule||"?")+" - "+(m.nom||"?")+" ("+(m.grade||"ARC")+")")}</option>`).join("");
  }
  let pre=e;
  if(!pre&&fromRoster){const c=panCurrent();if(c&&c.source==="effectif")pre=c;}
  g("panMember").value=pre&&pre.member_id!=null?String(pre.member_id):"";
  g("panNom").value=pre?pre.nom||"":"";
  g("panMat").value=pre?pre.matricule||"":"";
  g("panDebut").value=pre&&pre.debut?String(pre.debut).slice(0,10):"";
  g("panFin").value=pre&&pre.fin?String(pre.fin).slice(0,10):"";
  g("panDiscord").value=pre?pre.discord||"":"";
  g("panComment").value=pre?pre.commentaire||"":"";
  g("panNoDates").checked=!!(pre&&panMois(pre));
  g("panMois").value=pre&&panMois(pre)?String(panMois(pre)):"";
  panModeSync();
  panCount();
  g("panModalTitle").textContent=e?"Modifier l'inscription":(fromRoster?"Fiche du CMDM en fonction":"Inscrire au panthéon");
  g("pantheonModal").classList.add("show");
}
/* La duree seule n'est proposee que pour un ancien hors effectif : un membre
   de l'effectif a ses dates dans le tableau de bord. */
function panModeSync(){
  const g=k=>document.getElementById(k);
  const hors=!g("panMember").value, chk=g("panNoDates");
  g("panNoDatesRow").style.display=hors?"":"none";
  if(!hors)chk.checked=false;
  const sans=chk.checked;
  g("panDatesRow").style.display=sans?"none":"";
  g("panMoisRow").style.display=sans?"":"none";
}
function panMemberPick(v){
  panModeSync();
  const m=memberById(v);
  if(!m)return;
  const g=k=>document.getElementById(k);
  g("panNom").value=m.nom||"";g("panMat").value=m.matricule||"";
  if(!g("panDebut").value&&m.grade==="CMDM"&&m.date_promo)g("panDebut").value=String(m.date_promo).slice(0,10);
}
function panCount(){
  const t=document.getElementById("panComment"),c=document.getElementById("panCommentCount");
  if(t&&c)c.textContent=(t.value||"").length+" / "+PANTHEON_COMMENT_MAX;
}

async function savePantheonEntry(){
  if(!canEditPantheon()){toast("Réservé aux CMD, CMDM et à l'administration","error");return;}
  const g=k=>(document.getElementById(k)||{}).value||"";
  const mid=g("panMember").trim();
  const nom=g("panNom").trim().slice(0,60), mat=g("panMat").trim().slice(0,20);
  const debut=g("panDebut").trim(), fin=g("panFin").trim();
  const discord=g("panDiscord").trim().slice(0,40), commentaire=g("panComment").trim();
  const sansDates=!mid&&!!(document.getElementById("panNoDates")||{}).checked;
  const mois=parseInt(g("panMois"),10);
  if(!nom&&!mat)return fieldError("panNom","Indique au moins le nom RP ou le matricule.");
  if(sansDates){ if(!(mois>=1&&mois<=240))return fieldError("panMois","Indique combien de mois il a servi (entre 1 et 240)."); }
  else if(!debut)return fieldError("panDebut","Indique la date de prise de poste.");
  if(!sansDates&&fin&&fin<debut)return fieldError("panFin","Le départ doit être après la prise de poste.");
  if(!sansDates&&fin&&fin>ymdLocal(new Date()))return fieldError("panFin","Le départ ne peut pas être dans le futur. Laisse vide si le CMDM est toujours en poste.");
  if(commentaire.length>PANTHEON_COMMENT_MAX)return fieldError("panComment","Le commentaire dépasse "+PANTHEON_COMMENT_MAX+" caractères.");

  /* un seul CMDM en fonction : en inscrire un nouveau clot le precedent */
  const autreActuel=(!fin&&!sansDates)?panEntries().find(x=>!panIsFormer(x)&&String(x.id)!==String(_panEditId)):null;
  if(autreActuel){
    const n=panName(autreActuel);
    const ok=await uiConfirm({kicker:"// PANTHÉON",title:"Passation de commandement",
      message:`${n.mat} ${n.nom} est inscrit comme CMDM en fonction.\n\nSon commandement sera clos au ${fmtDate(debut)} et il rejoindra les anciens commandants.`,
      okText:"Confirmer la passation",cancelText:"Annuler"});
    if(!ok)return;
  }
  const entry={id:_panEditId||("p"+Date.now().toString(36)),nom,matricule:mat,
    member_id:mid||null,debut:sansDates?"":debut,fin:sansDates?null:(fin||null),mois:sansDates?mois:null,discord,commentaire,
    by:session?.user||"?",at:new Date().toISOString()};
  const next=await configMerge("pantheon",state.pantheon,o=>{
    const list=Array.isArray(o.entries)?o.entries.slice():[];
    if(autreActuel){
      const k=list.findIndex(x=>String(x.id)===String(autreActuel.id));
      if(k>=0)list[k]=Object.assign({},list[k],{fin:debut<list[k].debut?list[k].debut:debut});
    }
    const i=list.findIndex(x=>String(x.id)===String(entry.id));
    if(i>=0)list[i]=Object.assign({},list[i],entry);else list.push(entry);
    o.entries=list;
  });
  if(next===null){toast("Base injoignable : rien n'a été enregistré, ta saisie est conservée","error");return;}
  state.pantheon=next;
  closeModal("pantheonModal");
  renderPantheon();renderOvCmdm();
  const qui=(mat+" "+nom).trim();
  toast(_panEditId?"Inscription mise à jour":((fin||sansDates)?qui+" inscrit au panthéon":qui+" inscrit comme CMDM en fonction"),"success");
  await logActivity(`${session?.user} a ${_panEditId?"modifié l'inscription de":"inscrit"} ${qui} au panthéon des CMDM`);
}

async function panEndTerm(id){
  if(!canEditPantheon())return;
  const e=panById(id);if(!e)return;
  const n=panName(e), today=ymdLocal(new Date());
  const ok=await uiConfirm({kicker:"// PANTHÉON",title:"Clore le commandement",
    message:`${n.mat} ${n.nom} quitte le poste de Commandant-Maréchal aujourd'hui (${fmtDate(today)}) et rejoint les anciens commandants.\n\nTu pourras corriger la date ensuite.`,
    okText:"Clore le commandement"});
  if(!ok)return;
  const next=await configMerge("pantheon",state.pantheon,o=>{
    o.entries=(Array.isArray(o.entries)?o.entries:[]).map(x=>String(x.id)===String(id)?Object.assign({},x,{fin:today<x.debut?x.debut:today}):x);
  });
  if(next===null){toast("Base injoignable : rien n'a été enregistré","error");return;}
  state.pantheon=next;
  renderPantheon();renderOvCmdm();
  toast(`${n.mat} rejoint le panthéon`,"success");
  await logActivity(`${session?.user} a clos le commandement de ${n.mat} ${n.nom} (panthéon des CMDM)`);
}

async function deletePantheonEntry(id){
  if(!canEditPantheon())return;
  const e=panById(id);if(!e)return;
  const n=panName(e);
  const ok=await uiConfirm({kicker:"// PANTHÉON",title:"Retirer du panthéon",
    message:`Retirer ${n.mat} ${n.nom} du panthéon ? Son inscription, son Discord et le commentaire seront effacés.`,
    okText:"Retirer",danger:true});
  if(!ok)return;
  const next=await configMerge("pantheon",state.pantheon,o=>{
    o.entries=(Array.isArray(o.entries)?o.entries:[]).filter(x=>String(x.id)!==String(id));
  });
  if(next===null){toast("Base injoignable : rien n'a été supprimé","error");return;}
  state.pantheon=next;
  renderPantheon();renderOvCmdm();
  toast("Inscription retirée","info");
  await logActivity(`${session?.user} a retiré ${n.mat} ${n.nom} du panthéon des CMDM`);
}
