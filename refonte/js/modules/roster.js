/* ARC ALPHA - Module roster. */
function renderCategorieTable(categorie,bodyId){
  const tbody=document.getElementById(bodyId);if(!tbody)return;
  const canManage=canMoveCategorie();
  const list=sortMembers(state.members.filter(m=>(m.categorie||"effectif")===categorie));
  if(!list.length){tbody.innerHTML=`<tr><td colspan="6"><div class="empty"><p>Aucun membre</p></div></td></tr>`;return;}
  tbody.innerHTML=list.map(m=>{
    const gc=GRADE_COLORS[m.grade||"ARC"]||"#e9eef7";
    return `<tr>
      <td><span class="grade-pill" style="color:${gc}">${esc(m.grade||"ARC")}</span></td>
      <td><span class="mat">${esc(m.matricule)||"-"}</span></td>
      <td class="nm nm-link" tabindex="0" role="button" onkeydown="if(event.key==='Enter')this.click()" onclick="openMemberProfile('${escJs(m.id)}')" title="Voir la fiche complète">${esc(m.nom)||"-"}</td>
      <td><span class="mono-dm">${m.cat_date?fmtDate(m.cat_date):"-"}</span></td>
      <td><span style="font-size:.78rem;color:var(--tx2)">${esc(m.cat_raison)||"-"}</span></td>
      <td class="ta-r"><div class="row-end">
        ${canManage?`<button class="sm sbtn" onclick="moveToCategorie('${escJs(m.id)}','effectif')"><i data-lucide="undo-2"></i> Réintégrer</button>
        <button class="icon-btn del" onclick="deleteMember('${escJs(m.id)}')" title="Supprimer définitivement" aria-label="Supprimer définitivement"><i data-lucide="trash-2"></i></button>`:""}
      </div></td>
    </tr>`;
  }).join("");
}
function renderReserve(){renderCategorieTable("reserve","reserveBody");}
function renderBlacklist(){
  const btn=document.getElementById("blAddBtn");
  if(btn)btn.style.display=canMoveCategorie()?"":"none";
  renderCategorieTable("blacklist","blacklistBody");
}

function openCatModal(memberId,target){
  if(!canMoveCategorie()){toast("Réservé aux officiers CPT+","error");return;}
  const m=state.members.find(x=>x.id==memberId);if(!m)return;
  document.getElementById("catMemberId").value=memberId;
  document.getElementById("catTarget").value=target;
  document.getElementById("catDate").value=new Date().toISOString().slice(0,10);
  document.getElementById("catRaison").value=m.cat_raison||"";
  const isBL=target==="blacklist";
  document.getElementById("catModalKind").textContent=isBL?"// BLACKLIST":"// RÉSERVE";
  document.getElementById("catModalTitle").textContent=isBL?"Passer en blacklist":"Passer en réserve";
  document.getElementById("catModalDesc").textContent=`${m.matricule||"?"} ${m.nom?"- "+m.nom:""} va être déplacé vers ${isBL?"la blacklist":"les réservistes"}.`;
  const btn=document.getElementById("catConfirmBtn");
  btn.textContent=isBL?"Blacklister":"Mettre en réserve";
  document.getElementById("catModal").classList.add("show");
}

async function saveCategorieChange(){
  const memberId=document.getElementById("catMemberId").value;
  const target=document.getElementById("catTarget").value;
  const date=document.getElementById("catDate").value;
  const raison=document.getElementById("catRaison").value.trim();
  await applyCategorie(memberId,target,date,raison);
  closeModal("catModal");
}

async function moveToCategorie(memberId,target){
  if(!canMoveCategorie()){toast("Réservé aux officiers CPT+","error");return;}
  if(target==="effectif"){
    await applyCategorie(memberId,"effectif","","");
  }
}

async function applyCategorie(memberId,target,date,raison){
  if(!canEdit("roster")){toast("Accès insuffisant","error");return;}
  const m=state.members.find(x=>x.id==memberId);if(!m)return;
  const patch={categorie:target,cat_date:date||null,cat_raison:raison||null};
  if(supaOK){
    let r=await supaPatch(T.members,"id=eq."+memberId,patch);
    if(r===null){toast("Erreur réseau - réessaie","error");return;}
  }
  Object.assign(m,patch);
  if(!supaOK)saveLS();
  renderRoster();renderReserve();renderBlacklist();renderOverview();refreshMemberViews();
  const labels={effectif:"l'effectif",reserve:"la réserve",blacklist:"la blacklist"};
  toast(`${m.matricule} déplacé vers ${labels[target]}`,"success");
  await logActivity(`${session?.user} a déplacé ${m.matricule} vers ${labels[target]}`);
  if(state.discord.promo && MOUVEMENTS[target]){
    await discordConfirmSend("mouvements",discordMouvementPayload(m,target,raison,session?.user));
  }
}

let rosterSearchQ="",rosterFilterGrade="",rosterFilterStatus="";
const rosterSearchDebounced=debounce(v=>{rosterSearchQ=v;renderRoster();},150);
/* Places par grade, telles que le commandement les a fixees. Confirmees sans
   changement le 2026-10-14 : le corps d'officiers garde ses 8 postes. Les
   grades absents de cette table sont sans limite (LT, SGT, ARC).
   Tout est informatif : rien ici ne refuse une promotion. */
const GRADE_PLACES={CMDM:1,CMD:1,VCMD:1,MAJ:2,CPT:3};

function gradePlaces(g){
  const n=GRADE_PLACES[g];
  return (n>0)?n:null;
}

/* Compte les titulaires d'un grade dans l'effectif. `saufId` ecarte la fiche en
   cours de modification : promouvoir un CPT au grade de MAJ ne doit pas compter
   sa place de depart. Reserve et blacklist n'occupent aucune place. */
function gradeOccupe(g,saufId){
  return (state.members||[]).filter(m=>
    (m.categorie||"effectif")==="effectif" && m.grade===g &&
    (saufId===undefined||saufId===null||String(m.id)!==String(saufId))
  ).length;
}

function renderRosterPlaces(){
  const band=document.getElementById("rosterPlaces");
  if(!band)return;
  const chips=GRADE_ORDER.filter(g=>gradePlaces(g)).map(g=>{
    const max=gradePlaces(g), occ=gradeOccupe(g);
    const reste=max-occ;
    const cls=reste>0?"p-libre":(reste===0?"p-plein":"p-over");
    const mot=reste>0?(reste+" libre"+(reste>1?"s":""))
             :(reste===0?"complet":("+"+(-reste)+" hors place"+(reste<-1?"s":"")));
    const tenus=(state.members||[]).filter(m=>(m.categorie||"effectif")==="effectif"&&m.grade===g)
      .map(m=>m.matricule||m.nom||"?");
    const bulle=gradeLabel(g)+" : "+occ+" sur "+max+" place"+(max>1?"s":"")
      +(tenus.length?" ("+tenus.join(", ")+")":"");
    return `<span class="plc ${cls}" title="${esc(bulle)}">`
      +`<span class="grade-pill gp-${g.toLowerCase()}" style="color:${GRADE_COLORS[g]};border-color:${GRADE_COLORS[g]}44">${g}</span>`
      +`<b>${occ} / ${max}</b><i>${esc(mot)}</i></span>`;
  });
  const libres=GRADE_ORDER.filter(g=>!gradePlaces(g));
  if(libres.length)chips.push(`<span class="plc p-open" title="Ces grades n'ont pas de place limitee"><b>${libres.join(" · ")}</b><i>sans limite</i></span>`);
  band.innerHTML=chips.join("");
}

/* Avertissement, jamais un refus : la place peut etre depassee en connaissance
   de cause, par exemple une promotion juste avant un depart. Repond true quand
   on continue, false quand l'officier annule. */
async function placeAlerte(grade,mat,saufId){
  const max=gradePlaces(grade);
  if(!max)return true;
  const occ=gradeOccupe(grade,saufId);
  if(occ<max)return true;
  const tenus=(state.members||[]).filter(m=>
    (m.categorie||"effectif")==="effectif" && m.grade===grade &&
    (saufId===undefined||saufId===null||String(m.id)!==String(saufId))
  ).map(m=>m.matricule||m.nom||"?");
  const lib=gradeLabel(grade);
  const tete=max===1?("La place de "+lib+" est deja tenue")
            :(occ>max?("Les "+max+" places de "+lib+" sont deja depassees")
                     :("Les "+max+" places de "+lib+" sont deja tenues"));
  return await uiConfirm({
    kicker:"// PLACES",
    title:lib+" : "+occ+" / "+max,
    message:tete+(tenus.length?" par "+tenus.join(", "):"")+".\n\n"
      +(mat||"Ce membre")+" occuperait une place en trop. Tu peux passer outre : "
      +"le bandeau de l'onglet Effectif signalera le depassement.",
    okText:"Continuer quand meme",cancelText:"Annuler",danger:true});
}

function renderRoster(){
  const tbody=document.getElementById("rosterBody");if(!tbody)return;
  renderRosterPlaces();
  let list=state.members.filter(m=>(m.categorie||"effectif")==="effectif");
  const q=(rosterSearchQ||"").trim().toLowerCase();
  if(q){
    list=list.filter(m=>[m.nom,m.matricule,m.grade,m.regiment,m.regiment_rct]
      .some(v=>v&&String(v).toLowerCase().includes(q)));
  }
  if(rosterFilterGrade)list=list.filter(m=>(m.grade||"ARC")===rosterFilterGrade);
  if(rosterFilterStatus)list=list.filter(m=>(m.status||"present")===rosterFilterStatus);
  const clearBtn=document.getElementById("rosterSearchClear");
  if(clearBtn)clearBtn.style.display=q?"":"none";
  const filtre=!!(q||rosterFilterGrade||rosterFilterStatus);
  const countEl=document.getElementById("rosterCount");
  const totalActive=state.members.filter(m=>(m.categorie||"effectif")==="effectif").length;
  if(countEl)countEl.textContent=filtre?`${list.length} / ${totalActive}`:`${totalActive} membre${totalActive>1?"s":""}`;
  const sorted=sortMembers(list);
  if(!sorted.length){tbody.innerHTML=`<tr><td colspan="11"><div class="empty"><p>${filtre?"Aucun membre ne correspond à ces critères":"Aucun membre"}</p></div></td></tr>`;return;}
  const stColors={present:"var(--gr)",absent:"var(--rd)",reserve:"var(--dm)"};
  const editable=canEdit("roster");
  const _todayR=new Date().toISOString().slice(0,10);
  const absNowBy=new Map();
  (state.absences||[]).forEach(a=>{
    if(!a.start_date||!a.end_date)return;
    if(a.start_date<=_todayR&&_todayR<=a.end_date)absNowBy.set(String(a.member_id),a);
  });
  tbody.innerHTML=sorted.map(m=>{
    const cmdTotal=getCmdTotal(m.id);
    const elig=getEligibility(m);
    const daysSince=m.date_promo?Math.floor((new Date()-new Date(m.date_promo))/(1000*60*60*24)):null;
    const gradeOpts=GRADE_ORDER.map(g=>`<option value="${g}" style="color:${GRADE_COLORS[g]};background:var(--s2)" ${m.grade===g?"selected":""}>${g}</option>`).join("");

    const gradeCell=editable
      ? `<select class="inline-sel" data-grade="${esc(m.grade)}" style="color:${GRADE_COLORS[m.grade]||"#e9eef7"}"
          onchange="rosterSetGrade('${escJs(m.id)}',this.value,this)">${gradeOpts}</select>`
      : `<span class="grade-pill gp-${esc((m.grade||"arc").toLowerCase())}" style="color:${GRADE_COLORS[m.grade||"ARC"]}">${esc(m.grade||"ARC")}</span>`;

    const regCell=editable
      ? `<input class="inline-inp" value="${esc(m.regiment||"")}" placeholder="-" style="width:70px" onchange="updateField('${escJs(m.id)}','regiment',this.value)">`
      : `<span style="color:var(--tx2);font-size:.82rem">${esc(m.regiment||"-")}</span>`;

    const rctCol=m.regiment_rct?(REGIMENT_COLORS[m.regiment_rct]||"var(--ac)"):"var(--dm)";
    const rctCell=`<span style="font-family:var(--fm);font-size:.72rem;font-weight:${m.regiment_rct?"700":"400"};color:${rctCol}">${esc(m.regiment_rct||"-")}</span>`;

    const formBadge=(on,label,color)=>on?`<span style="display:inline-flex;align-items:center;padding:1px 6px;border-radius:var(--r3);font-family:var(--fm);font-size:.6rem;font-weight:600;letter-spacing:.02em;white-space:nowrap;background:${color}1f;color:${color};border:1px solid ${color}55">${label}</span>`:"";
    const _isCpt=(GRADE_LEVEL[m.grade]||0)>=3;
    const _forms=`${formBadge(m.f_arc_alpha,"Alpha",FORMATION_COLORS.alpha)}${formBadge(m.f_arc_trooper,"Trooper",FORMATION_COLORS.trooper)}${formBadge(m.f_cmd_mission,"CMD",FORMATION_COLORS.cmd)}${formBadge(m.f_bleu,"Bleu",FORMATION_COLORS.bleu)}${_isCpt?formBadge(m.f_negociation,"Négo",FORMATION_COLORS.nego):""}`;
    const formCell=`<div style="display:flex;gap:3px;flex-wrap:wrap;align-items:center">${_forms||'<span style="color:var(--dm);font-size:.6rem">-</span>'}</div>`;

    const _absNow=absNowBy.get(String(m.id));
    const statCell=_absNow
      ? `<span class="st-badge st-absent" title="Absence enregistrée jusqu'au ${fmtDate(_absNow.end_date)} - retour automatique à Présent à son terme"><span class="d"></span>${stLabel("absent")} <span class="mono-xs">→ ${fmtDate(_absNow.end_date)}</span></span>`
      : editable
      ? `<select class="inline-sel" style="color:${stColors[m.status||"present"]}"
          onchange="updateField('${escJs(m.id)}','status',this.value);this.style.color=({present:'var(--gr)',absent:'var(--rd)',reserve:'var(--dm)'})[this.value]">
          <option value="present" style="color:var(--gr)" ${m.status==="present"?"selected":""}>● Présent</option>
          <option value="absent" style="color:var(--rd)" ${m.status==="absent"?"selected":""}>● Absent</option>
          <option value="reserve" class="c-dm" ${m.status==="reserve"?"selected":""}>◌ Réserve</option>
        </select>`
      : `<span class="st-badge st-${esc(m.status||"present")}"><span class="d"></span>${esc(stLabel(m.status))}</span>`;

    const promoCell=editable
      ? `<input type="date" class="inline-inp" value="${esc(m.date_promo||"")}" style="width:105px;font-family:var(--fm);font-size:.7rem"
          onchange="savePromoDate('${escJs(m.id)}',this.value)" title="${daysSince!==null?daysSince+" j depuis la dernière promo":""}">`
      : `<span class="mono-dm">${m.date_promo?fmtDate(m.date_promo):"-"}</span>`;

    const canMove=canMoveCategorie();
    const moveBtns=canMove
      ? `<button class="sbtn" style="padding:.18rem .45rem;font-size:.6rem" onclick="openCatModal('${escJs(m.id)}','reserve')" title="Passer en réserve"><i data-lucide="shield"></i> Réserve</button>
         <button class="sbtn" style="padding:.18rem .45rem;font-size:.6rem;border-color:rgba(255,59,92,.4);color:var(--rd)" onclick="openCatModal('${escJs(m.id)}','blacklist')" title="Passer en blacklist"><i data-lucide="ban"></i> BL</button>`
      : "";
    const delBtn=editable
      ? `<button class="icon-btn del" onclick="deleteMember('${escJs(m.id)}')" title="Supprimer" aria-label="Supprimer">
          <i data-lucide="trash-2"></i></button>`
      : "";
    const delCell=moveBtns+delBtn;

    return `<tr>
      <td>${gradeCell}</td>
      <td><div style="display:flex;align-items:center;gap:.6rem">
        <span class="grade-avatar" style="--gc:${GRADE_COLORS[m.grade||'ARC']}">${(m.matricule||'?').replace(/[^A-Z0-9]/gi,'').slice(-2).toUpperCase()}</span>
        <span class="mat">${esc(m.matricule)||"-"}</span>
      </div></td>
      <td class="nm nm-link" tabindex="0" role="button" onkeydown="if(event.key==='Enter')this.click()" onclick="openMemberProfile('${escJs(m.id)}')" title="Voir la fiche complète">${esc(m.nom)||"-"}</td>
      <td>${regCell}</td>
      <td>${rctCell}</td>
      <td>${formCell}</td>
      <td>${statCell}</td>
      <td>${promoCell}</td>
      <td style="font-family:var(--fm);font-size:.82rem;color:var(--ac);text-align:center" title="${cmdTotal} CMD de mission">${cmdTotal}</td>
      <td style="text-align:center;font-size:1rem" title="${esc(elig.reason)}">${elig.eligible===null?"-":elig.eligible?"✅":"⛔"}</td>
      <td class="ta-r"><div style="display:flex;justify-content:flex-end;gap:.3rem;align-items:center;flex-wrap:nowrap">${delCell}</div></td>
    </tr>`;
  }).join("");
}


function populateRegimentSelect(selectId,currentVal){
  const sel=document.getElementById(selectId);
  if(!sel)return;
  const regs=state.regiments||[];
  sel.innerHTML='<option value="">Aucun</option>'+
    regs.map(r=>`<option value="${esc(r)}" style="color:${REGIMENT_COLORS[r]||'var(--tx)'}" ${currentVal===r?"selected":""}>${esc(r)}</option>`).join("")+
    '<option value="__add__">➕ Ajouter un régiment...</option>';
  sel.onchange=async function(){
    if(this.value==="__add__"){
      if(!canEdit("roster")){toast("Accès insuffisant","error");this.value=currentVal||"";return;}
      const name=await uiPrompt({kicker:"// NOUVEAU RÉGIMENT",title:"Ajouter un régiment RCT",message:"Nom du nouveau régiment de RCT :",placeholder:"ex: 91st",okText:"Ajouter"});
      if(name&&name.trim()){
        const clean=name.trim();
        if(!state.regiments.includes(clean)){
          state.regiments.push(clean);
          if(supaOK)await setConfig("regiments",state.regiments);
          else saveLS();
          toast(`Régiment "${clean}" ajouté`,"success");
        }
        populateRegimentSelect(selectId,clean);
      }else{
        this.value=currentVal||"";
      }
    }
  };
}

function openMemberModal(mode){
  window._memberModalMode = mode||"effectif";
  const isbl = mode==="blacklist";
  const kSpan=document.querySelector("#memberModal .k");
  const h3=document.querySelector("#memberModal .modal-h h3");
  if(kSpan) kSpan.textContent = isbl ? "// BLACKLIST" : "// EFFECTIF";
  if(h3) h3.textContent = isbl ? "Ajouter en blacklist" : "Ajouter un membre";
  document.getElementById("mPromo").value=new Date().toISOString().slice(0,10);
  document.getElementById("mArrivee").value=new Date().toISOString().slice(0,10);
  populateRegimentSelect("mRegRct","");
  ["mMat","mNom","mReg","mRemarque"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
  ["mFArc","mFTrooper","mFCmd","mFNego"].forEach(id=>{const e=document.getElementById(id);if(e)e.checked=false;});
  document.getElementById("mStat").value="present";
  document.getElementById("mGrade").value="ARC";
  const updateNego=()=>{
    const g=document.getElementById("mGrade").value;
    const lbl=document.getElementById("mFNegoLabel");
    if(lbl)lbl.style.display=((GRADE_LEVEL[g]||0)>=3)?"flex":"none";
  };
  document.getElementById("mGrade").onchange=updateNego;
  updateNego();
  const rf=document.getElementById("mRemarqueField");
  if(rf)rf.style.display=canSeeRemarque()?"block":"none";
  const rt=document.getElementById("mRemarque");
  if(rt)rt.readOnly=!canWriteRemarque();
  document.getElementById("memberModal").classList.add("show");
}

async function saveMember(){
  if(!canEdit("roster")){toast("Accès insuffisant","error");return;}
  const mat=document.getElementById("mMat").value.trim();
  const nom=document.getElementById("mNom").value.trim();
  const grade=document.getElementById("mGrade").value;
  const reg=document.getElementById("mReg").value.trim();
  const stat=document.getElementById("mStat").value;
  const promo=document.getElementById("mPromo")?document.getElementById("mPromo").value:"";
  const arrivee=document.getElementById("mArrivee")?document.getElementById("mArrivee").value:"";
  const regRct=document.getElementById("mRegRct")?document.getElementById("mRegRct").value:"";
  const fArc=document.getElementById("mFArc")?.checked||false;
  const fTrooper=document.getElementById("mFTrooper")?.checked||false;
  const fCmd=document.getElementById("mFCmd")?.checked||false;
  const fNego=document.getElementById("mFNego")?.checked||false;
  const remarque=(canWriteRemarque()&&document.getElementById("mRemarque"))?document.getElementById("mRemarque").value.trim():"";
  if(!mat)return fieldError("mMat","Le matricule est requis.");
  if((state.members||[]).some(x=>String(x.matricule||"").trim().toLowerCase()===mat.toLowerCase()))return fieldError("mMat","Ce matricule existe déjà dans la liste.");
  const categorie=window._memberModalMode||"effectif";
  if(categorie==="effectif"&&!await placeAlerte(grade,mat,null))return;

  let obj={matricule:mat,nom,grade,regiment:reg,status:stat,categorie,
    regiment_rct:regRct,date_arrivee:arrivee||null,
    f_arc_alpha:fArc,f_arc_trooper:fTrooper,f_cmd_mission:fCmd,
    f_negociation:((GRADE_LEVEL[grade]||0)>=3?fNego:false),remarque};
  if(promo) obj.date_promo=promo;

  if(supaOK){
    let r=await supaPost(T.members,obj);
    if(!r||r.length===0){
      const minimal={matricule:mat,nom,grade,regiment:reg,status:stat};
      r=await supaPost(T.members,minimal);
    }
    if(r&&r.length>0){
      state.members.unshift(r[0]);
    } else {
      /* rien n'a ete ecrit : on le dit et on garde la fenetre et la saisie */
      toast("Enregistrement refusé par la base. Rien n'a été ajouté, ta saisie est conservée.","error");
      return;
    }
  } else {
    obj.id=Date.now().toString();
    state.members.unshift(obj);
    saveLS();
  }
  closeModal("memberModal");
  if(supaOK){
    const fresh=await supaGet(T.members);
    if(fresh)state.members=fresh;
  }
  renderRoster();renderOverview();refreshMemberViews();
  if(categorie==="blacklist"){renderBlacklist();}
  const catLabel=categorie==="blacklist"?"la blacklist":"l'effectif";
  toast(`${mat} ajouté à ${catLabel}`,"success");
  await logActivity(`${session?.user} a ajouté ${mat} à ${catLabel}`);
}

async function deleteMember(id){
  if(!canEdit("roster")){toast("Accès insuffisant","error");return;}
  if(!await uiConfirm({title:"Supprimer le membre",message:"Supprimer ce membre ? Cette action est définitive.",okText:"Supprimer",danger:true}))return;
  const _delM=state.members.find(m=>m.id==id);
  const _delSnap=_delM?{..._delM}:null;
  if(supaOK)await supaDelete(T.members,`id=eq.${id}`);
  state.members=state.members.filter(m=>m.id!=id);if(!supaOK)saveLS();
  renderRoster();renderOverview();toast("Membre supprimé","info");
  await logActivity(`Membre ${_delM?.matricule||id} supprimé par ${session?.user}`);
  if(state.discord.promo && _delSnap){
    await discordConfirmSend("mouvements",discordMouvementPayload(_delSnap,"depart","",session?.user));
  }
}

async function savePromoDate(id, value){
  if(!canEdit("roster")){toast("Accès insuffisant","error");return;}
  if(!value) return;
  const m = state.members.find(x=>x.id==id);
  if(!m) return;
  m.date_promo = value;
  if(supaOK){
    /* passe par le portier comme updateField : plus d'écriture directe */
    const r=await supaPatch(T.members,`id=eq.${id}`,{date_promo:value});
    if(r===null){toast("Erreur sauvegarde date","error");return;}
    const fresh=await supaGet(T.members,`id=eq.${id}`);
    if(fresh&&fresh.length>0)m.date_promo=fresh[0].date_promo||value;
    toast("Date de promotion sauvegardée ✓","success");
  } else {
    saveLS();
  }
  renderRoster();
  refreshMemberViews();
}

/* Changement de grade depuis le tableau. Un seul point d'entree, parce que
   l'avertissement de place doit pouvoir tout annuler, date de promotion
   comprise : avant, les deux appels etaient enchaines dans le `onchange` et la
   date partait meme si le grade ne changeait pas. */
async function rosterSetGrade(id,value,sel){
  const ok=await updateField(id,"grade",value);
  if(ok===false){return;}
  await savePromoDate(id,new Date().toISOString().slice(0,10));
  if(sel&&sel.isConnected)colorGradeSelect(sel);
}

async function updateField(id,field,value){
  if(!canEdit("roster")){toast("Accès insuffisant","error");return;}
  const m=state.members.find(x=>x.id==id);if(!m)return;
  if(field==="date_promo"&&!value)return;
  let _promo=null,_gradeChange=null;
  if(field==="grade"&&value!==m.grade){
    if(!await placeAlerte(value,m.matricule,m.id)){renderRoster();return false;}
    const oldLvl=GRADE_LEVEL[m.grade]||0, newLvl=GRADE_LEVEL[value]||0;
    if(newLvl>oldLvl)_promo={old:m.grade,new:value};
    _gradeChange={old:m.grade,new:value};
  }
  m[field]=value;
  if(supaOK){
    const patch={};patch[field]=value;
    const r=await supaPatch(T.members,`id=eq.${id}`,patch);
    if(r===null){
      await new Promise(res=>setTimeout(res,300));
      await supaPatch(T.members,`id=eq.${id}`,patch);
    }
  } else saveLS();
  if(_promo)await resetCmdOnPromotion(m,_promo.old,_promo.new);
  if(_gradeChange && state.discord.promo){
    await discordConfirmSend("promo",discordPromoPayload(m,_gradeChange.old,_gradeChange.new,session?.user));
  }
  if(field==="grade"||field==="date_promo")setTimeout(()=>renderRoster(),500);
  renderOverview();
  refreshMemberViews();
  if(field==="matricule"||field==="nom")syncMemberNameCopies(m);
}


let _mpCurrentId=null,_mpEditMode=false;

function canEditMemberProfile(){
  if(!Auth.ok())return false;
  if(session.role==="admin")return true;
  if(session.role==="brs")return false;
  if(session.role==="amiraute")return true;
  const lvl=gradeLevel(getSessionGrade());
  return lvl>=4 || (lvl>=3 && getMyTasks().includes("effectif"));
}

function canSeeRemarque(){
  if(!Auth.ok())return false;
  if(session.role==="admin"||session.role==="amiraute"||session.role==="brs")return true;
  return gradeLevel(getSessionGrade())>=3;
}
function canWriteRemarque(){
  if(!Auth.ok())return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  if(session.role==="brs")return false;
  return gradeLevel(getSessionGrade())>=3;
}

function canSeeInfo(){
  return !!session;
}
function canWriteInfo(){
  if(!Auth.ok())return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  if(session.role==="brs")return false;
  return gradeLevel(getSessionGrade())>=3;
}

function canMoveCategorie(){
  if(!Auth.ok())return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  if(session.role==="brs")return false;
  const lvl=gradeLevel(getSessionGrade());
  return lvl>=4 || (lvl>=3 && getMyTasks().includes("effectif"));
}

function toggleInfoEdit(){
  const zone=document.getElementById("mpInfoEditZone");
  const txt=document.getElementById("mpInfoViewText");
  const btn=document.getElementById("mpInfoEditBtn");
  if(!zone)return;
  const opening=zone.style.display==="none";
  if(opening){
    const m=state.members.find(x=>x.id==_mpCurrentId);
    document.getElementById("mpInfoInline").value=m?.infos_perso||"";
    zone.style.display="block";txt.style.display="none";if(btn)btn.style.display="none";
  }else{
    zone.style.display="none";txt.style.display="block";if(btn)btn.style.display=canWriteInfo()?"":"none";
  }
}

async function saveInfoOnly(){
  if(!canWriteInfo()){toast("Accès insuffisant","error");return;}
  const m=state.members.find(x=>x.id==_mpCurrentId);
  if(!m)return;
  const val=document.getElementById("mpInfoInline").value.trim();
  if(supaOK){
    const r=await supaPatch(T.members,"id=eq."+_mpCurrentId,{infos_perso:val});
    if(r===null){toast("Erreur réseau - réessaie","error");return;}
  }
  m.infos_perso=val;
  if(!supaOK)saveLS();
  document.getElementById("mpInfoViewText").textContent=val||"Aucune information renseignée.";
  toggleInfoEdit();
  toast("Informations enregistrées","success");
  await logActivity(`${session?.user} a modifié les infos perso de ${m.matricule}`);
}

function toggleRemarqueEdit(){
  const zone=document.getElementById("mpRemarqueEditZone");
  const txt=document.getElementById("mpRemarqueViewText");
  const btn=document.getElementById("mpRemarqueEditBtn");
  if(!zone)return;
  const opening=zone.style.display==="none";
  if(opening){
    const m=state.members.find(x=>x.id==_mpCurrentId);
    document.getElementById("mpRemarqueInline").value=m?.remarque||"";
    zone.style.display="block";txt.style.display="none";if(btn)btn.style.display="none";
  }else{
    zone.style.display="none";txt.style.display="block";if(btn)btn.style.display=canWriteRemarque()?"":"none";
  }
}

async function saveRemarqueOnly(){
  if(!canWriteRemarque()){toast("Accès insuffisant","error");return;}
  const m=state.members.find(x=>x.id==_mpCurrentId);
  if(!m)return;
  const val=document.getElementById("mpRemarqueInline").value.trim();
  if(supaOK){
    const r=await supaPatch(T.members,"id=eq."+_mpCurrentId,{remarque:val});
    if(r===null){toast("Erreur réseau - réessaie","error");return;}
  }
  m.remarque=val;
  if(!supaOK)saveLS();
  document.getElementById("mpRemarqueViewText").textContent=val||"Aucune remarque pour le moment.";
  toggleRemarqueEdit();
  toast("Remarque enregistrée","success");
  await logActivity(`${session?.user} a modifié la remarque de ${m.matricule}`);
}

function buildMemberTimeline(m){
  const ev=[];
  const nom=(m.nom||"").toLowerCase(), mat=(m.matricule||"").toLowerCase();
  if(m.date_arrivee)ev.push({date:m.date_arrivee,color:"var(--gr)",icon:"➜",title:"Arrivé dans l'unité",sub:""});
  if(m.date_promo)ev.push({date:m.date_promo,color:GRADE_COLORS[m.grade]||"var(--ac)",icon:"▲",title:`Promu ${m.grade||""}`.trim(),sub:"Dernière promotion"});
  state.blames.filter(b=>b.member_id==m.id).forEach(b=>{
    ev.push({date:b.created_at,color:b.resolved?"var(--gr)":"var(--rd)",icon:"⚑",title:`${blameLevelLabel(b.level||1)}${b.resolved?" (levé)":""}`,sub:b.reason||"Sans motif"});
    if(b.resolved&&b.resolved_at){
      ev.push({date:b.resolved_at,color:"var(--gr)",icon:"✓",
        title:`Blâme levé${b.resolved_by?` par ${userLabel(b.resolved_by_id,b.resolved_by)}`:""}`,
        sub:b.resolve_reason||"Sans justificatif"});
    }
  });
  state.cmdmissions.filter(c=>c.member_id==m.id).forEach(c=>{
    /* Un ajustement peut retirer des points : ecrire « + » devant serait faux. */
    const aj=cmdEstAjust(c), p=parseFloat(c.points)||0;
    ev.push({date:c.date||c.created_at,color:aj?"var(--ye)":"var(--or)",icon:aj?"⇄":"◈",
      title:aj?(c.mission_name||"Ajustement des points"):`CMD : ${c.mission_name||"Mission"}`,
      sub:`${cmdSigne(p)} pt${Math.abs(p)>1?"s":""}`});
  });
  (state.formations||[]).forEach(f=>{
    const byId=f.eleve_id!==null&&f.eleve_id!==undefined&&f.eleve_id!==""
      ? String(f.eleve_id)===String(m.id)
      : null;
    let match=byId;
    if(match===null){
      const e=(f.eleve||"").toLowerCase();
      match=!!(e&&((nom&&e.includes(nom))||(mat&&e.includes(mat))));
    }
    if(!match)return;
    ev.push({date:f.date,color:"var(--vi)",icon:"✦",title:`Formation : ${f.formation||"?"}`,
             sub:`Par ${memberLabel(f.formateur_id,f.formateur)}${f.statut?" · "+f.statut:""}`});
  });
  (state.activites||[]).forEach(a=>{
    if(!actIds(a).includes(String(m.id)))return;
    const tache=a.type==="Tâche";
    ev.push({date:a.date,color:tache?"var(--or)":"var(--ac)",icon:tache?"▣":"✧",
             title:`${a.type||"Entraînement"} : ${a.intitule||"?"}`,
             sub:`Validé par ${memberLabel(a.officier_id,a.officier)}${actParts(a).length?" · avec "+actParts(a).join(", "):""}${a.commentaire?" · "+a.commentaire:""}`});
  });
  ev.sort((a,b)=>{
    if(!a.date&&!b.date)return 0;
    if(!a.date)return 1;
    if(!b.date)return -1;
    return String(b.date).localeCompare(String(a.date));
  });
  return ev;
}
function renderMemberTimeline(m,el){
  const ev=buildMemberTimeline(m);
  if(!ev.length){el.innerHTML='<div class="empty"><p>Aucun événement à afficher pour ce membre.</p></div>';return;}
  el.innerHTML='<div class="tl">'+ev.map(e=>`
    <div class="tl-item">
      <div class="tl-marker" style="--tc:${e.color}"><span>${e.icon}</span></div>
      <div class="tl-content">
        <div class="tl-top"><span class="tl-title">${esc(e.title)}</span><span class="tl-date">${e.date?fmtDate(e.date):"-"}</span></div>
        ${e.sub?`<div class="tl-sub">${esc(e.sub)}</div>`:""}
      </div>
    </div>`).join("")+'</div>';
}

function medalBadgesHTML(m,size){
  const ids=getMemberMedals(m);
  if(!ids.length)return"";
  return ids.map(id=>{
    const md=MEDAL_BY_ID[id];if(!md)return"";
    return`<span class="medal-badge" title="${esc(md.name)} - ${esc(md.desc)}" style="--mc:${md.color};${size==="sm"?"font-size:.9rem;width:26px;height:26px":""}">${md.icon}</span>`;
  }).join("");
}
function renderMpMedals(m,el){
  const owned=getMemberMedals(m);
  const canAward=canAwardMedals();
  let html="";
  if(canAward){
    html+='<p class="card-b" style="margin-bottom:.8rem;font-size:.78rem">Clique sur une médaille pour l\'attribuer ou la retirer. <span class="c-dm">Réservé MAJ+.</span></p>';
    html+='<div class="medal-grid">'+MEDALS.map(md=>{
      const has=owned.includes(md.id);
      return`<div class="medal-card ${has?"owned":""}" style="--mc:${md.color}" onclick="toggleMedal('${escJs(md.id)}')" title="${esc(md.desc)}">
        <div class="medal-ic">${md.icon}</div>
        <div class="medal-meta"><div class="medal-nm">${esc(md.name)}</div><div class="medal-scope">${esc(md.scope)}</div></div>
        <div class="medal-check">${has?"✓":""}</div>
      </div>`;
    }).join("")+'</div>';
  }else{
    if(!owned.length){html='<div class="empty"><p>Aucune médaille pour le moment.</p></div>';}
    else{
      html='<div class="medal-grid">'+owned.map(id=>{
        const md=MEDAL_BY_ID[id];if(!md)return"";
        return`<div class="medal-card owned" style="--mc:${md.color}" title="${esc(md.desc)}">
          <div class="medal-ic">${md.icon}</div>
          <div class="medal-meta"><div class="medal-nm">${esc(md.name)}</div><div class="medal-scope">${esc(md.scope)}</div></div>
        </div>`;
      }).join("")+'</div>';
    }
  }
  el.innerHTML=html;
}
async function toggleMedal(medalId){
  if(!canAwardMedals()){toast("Réservé aux MAJ+","error");return;}
  const m=state.members.find(x=>x.id==_mpCurrentId);
  if(!m)return;
  const md=MEDAL_BY_ID[medalId];if(!md)return;
  let owned=getMemberMedals(m);
  const had=owned.includes(medalId);
  owned=had?owned.filter(x=>x!==medalId):[...owned,medalId];
  m.medals=JSON.stringify(owned);
  if(supaOK){
    const r=await supaPatch(T.members,"id=eq."+m.id,{medals:m.medals});
    if(r===null){toast("Échec de l'enregistrement (réseau)","error");m.medals=JSON.stringify(had?[...owned,medalId]:owned.filter(x=>x!==medalId));return;}
  }else saveLS();
  const el=document.getElementById("mpTabMedals");if(el)renderMpMedals(m,el);
  const hdr=document.getElementById("mpMedalRow");if(hdr)hdr.innerHTML=medalBadgesHTML(m);
  toast(had?`Médaille retirée : ${md.name}`:`🎖️ Médaille attribuée : ${md.name}`,had?"info":"success");
  await logActivity(`${session.user} a ${had?"retiré":"attribué"} la médaille « ${md.name} » ${had?"à":"à"} ${m.matricule} ${m.nom||""}`.trim());
}

/* Statut « forme » d'un CT. Pose automatiquement par une formation Bleu
   validee, et basculable a la main depuis la fiche par un LT et plus. */
function canSetForme(){
  if(!Auth.ok())return false;
  if(session.role==="brs")return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  return gradeLevel(getSessionGrade())>=2;
}
function mpRenderBleu(m){
  const box=document.getElementById("mpBleuBox");
  if(!box||!m)return;
  box.style.display="";
  const on=!!m.f_bleu;
  const st=document.getElementById("mpBleuState");
  const hint=document.getElementById("mpBleuHint");
  const btn=document.getElementById("mpBleuBtn");
  if(st){st.textContent=on?"✅ Formé":"⛔ Non formé";st.style.color=on?"var(--gr)":"var(--dm)";}
  if(hint)hint.textContent=on?"Formation Bleu validée.":"Une formation Bleu validée le rendra formé.";
  if(btn){
    btn.style.display=canSetForme()?"":"none";
    btn.textContent=on?"Marquer non formé":"Marquer formé";
    btn.className=on?"sbtn danger":"sbtn green";
  }
}
async function toggleBleu(){
  if(!canSetForme()){toast("Réservé aux LT et plus","error");return;}
  const m=state.members.find(x=>x.id==_mpCurrentId);
  if(!m)return;
  const next=!m.f_bleu;
  if(supaOK){
    const r=await supaPatch(T.members,`id=eq.${m.id}`,{f_bleu:next});
    if(r===null){toast("Ajoute la colonne f_bleu dans Supabase (booléen)","error");return;}
  }
  m.f_bleu=next;
  if(!supaOK)saveLS();
  mpRenderBleu(m);
  try{renderRoster();}catch(e){}
  toast(next?"Marqué formé":"Marqué non formé","success");
  await logActivity(`${session?.user} a marqué ${m.matricule||""} ${next?"formé":"non formé"} (formation Bleu)`);
}

function openMemberProfile(memberId){
  const m=state.members.find(x=>x.id==memberId);
  if(!m)return;
  _mpCurrentId=memberId;
  _mpEditMode=false;

  document.getElementById("mpName").textContent=`${m.matricule} - ${m.nom||"?"}`;
  const mpMedalRow=document.getElementById("mpMedalRow");
  if(mpMedalRow)mpMedalRow.innerHTML=medalBadgesHTML(m);
  document.getElementById("mpEditSection").style.display="none";
  const _editBtn=document.getElementById("mpEditToggleBtn");
  if(_editBtn)_editBtn.textContent="Modifier la fiche";

  const cmdTotal=getCmdTotal(m.id);
  const blameCount=state.blames.filter(b=>b.member_id==m.id).length;
  const absCount=state.absences.filter(a=>a.member_id==m.id).length;
  const elig=getEligibility(m);
  document.getElementById("mpCmdTotal").textContent=cmdTotal;
  document.getElementById("mpBlameCount").textContent=blameCount;
  document.getElementById("mpAbsCount").textContent=absCount;
  statTone("mpCmdTotal",cmdTotal>0?"ac":"mute");
  statTone("mpBlameCount",blameCount?"crit":"ok");
  statTone("mpAbsCount",absCount?"warn":"mute");
  document.getElementById("mpEligStatus").textContent=elig.eligible===null?"-":elig.eligible?"✅":"⛔";
  renderPromoProgress(m, elig);
  mpRenderBleu(m);

  document.getElementById("mpMat").value=m.matricule||"";
  document.getElementById("mpNom").value=m.nom||"";
  document.getElementById("mpGrade").value=m.grade||"ARC";
  document.getElementById("mpReg").value=m.regiment||"";
  document.getElementById("mpStat").value=m.status||"present";
  document.getElementById("mpPromo").value=m.date_promo||"";
  populateRegimentSelect("mpRegRct",m.regiment_rct||"");
  document.getElementById("mpArrivee").value=m.date_arrivee||"";
  document.getElementById("mpFArc").checked=!!m.f_arc_alpha;
  document.getElementById("mpFTrooper").checked=!!m.f_arc_trooper;
  document.getElementById("mpFCmd").checked=!!m.f_cmd_mission;
  const mpNegoLabel=document.getElementById("mpFNegoLabel");
  const isCptPlus=(GRADE_LEVEL[m.grade]||0)>=3;
  if(mpNegoLabel)mpNegoLabel.style.display=isCptPlus?"flex":"none";
  document.getElementById("mpFNego").checked=!!m.f_negociation;
  const mpRf=document.getElementById("mpRemarqueField");
  if(mpRf)mpRf.style.display=canSeeRemarque()?"block":"none";
  const mpRt=document.getElementById("mpRemarque");
  if(mpRt){mpRt.value=m.remarque||"";mpRt.readOnly=!canWriteRemarque();}
  const ivBox=document.getElementById("mpInfoView");
  const ivTxt=document.getElementById("mpInfoViewText");
  if(ivBox&&ivTxt){
    if(canSeeInfo()){
      ivBox.style.display="block";
      ivTxt.textContent=(m.infos_perso&&m.infos_perso.trim())?m.infos_perso:"Aucune information renseignée.";
      ivTxt.style.display="block";
      const ieb=document.getElementById("mpInfoEditBtn");
      if(ieb)ieb.style.display=canWriteInfo()?"":"none";
      const iez=document.getElementById("mpInfoEditZone");
      if(iez)iez.style.display="none";
    }else{
      ivBox.style.display="none";
    }
  }
  const rvBox=document.getElementById("mpRemarqueView");
  const rvTxt=document.getElementById("mpRemarqueViewText");
  if(rvBox&&rvTxt){
    if(canSeeRemarque()){
      rvBox.style.display="block";
      rvTxt.textContent=(m.remarque&&m.remarque.trim())?m.remarque:"Aucune remarque pour le moment.";
      rvTxt.style.display="block";
      const reb=document.getElementById("mpRemarqueEditBtn");
      if(reb)reb.style.display=canWriteRemarque()?"":"none";
      const rez=document.getElementById("mpRemarqueEditZone");
      if(rez)rez.style.display="none";
    }else{
      rvBox.style.display="none";
    }
  }

  const editBtn=document.getElementById("mpEditToggleBtn");
  if(editBtn)editBtn.style.display=canEditMemberProfile()?"":"none";

  mpTab("missions");
  document.getElementById("memberProfileModal").classList.add("show");
}

function toggleMpEdit(){
  _mpEditMode=!_mpEditMode;
  document.getElementById("mpEditSection").style.display=_mpEditMode?"block":"none";
  document.getElementById("mpEditToggleBtn").textContent=_mpEditMode?"Annuler":"Modifier la fiche";
}

async function saveMemberProfile(){
  if(!canEdit("roster")){toast("Accès insuffisant","error");return;}
  if(!_mpCurrentId)return;
  const m=state.members.find(x=>x.id==_mpCurrentId);
  if(!m)return;
  const _oldGrade=m.grade;
  const _oldMat=m.matricule,_oldNom=m.nom;
  const mat=document.getElementById("mpMat").value.trim();
  const nom=document.getElementById("mpNom").value.trim();
  const grade=document.getElementById("mpGrade").value;
  const reg=document.getElementById("mpReg").value.trim();
  const stat=document.getElementById("mpStat").value;
  const promo=document.getElementById("mpPromo").value;
  const regRct=document.getElementById("mpRegRct")?document.getElementById("mpRegRct").value:"";
  const arrivee=document.getElementById("mpArrivee")?document.getElementById("mpArrivee").value:"";
  const fArc=document.getElementById("mpFArc")?.checked||false;
  const fTrooper=document.getElementById("mpFTrooper")?.checked||false;
  const fCmd=document.getElementById("mpFCmd")?.checked||false;
  const fNego=document.getElementById("mpFNego")?.checked||false;
  if(!mat)return fieldError("mpMat","Le matricule est requis.");
  if(grade!==_oldGrade&&(m.categorie||"effectif")==="effectif"
     &&!await placeAlerte(grade,mat,m.id))return;

  const patch={matricule:mat,nom,grade,regiment:reg,status:stat,
    regiment_rct:regRct,date_arrivee:arrivee||null,
    f_arc_alpha:fArc,f_arc_trooper:fTrooper,f_cmd_mission:fCmd,
    f_negociation:((GRADE_LEVEL[grade]||0)>=3?fNego:false)};
  if(promo)patch.date_promo=promo;
  if(canWriteRemarque()&&document.getElementById("mpRemarque")){
    patch.remarque=document.getElementById("mpRemarque").value.trim();
  }

  if(supaOK){
    let r=await supaPatch(T.members,"id=eq."+_mpCurrentId,patch);
    if(r===null){
      const minimal={matricule:mat,nom,grade,regiment:reg,status:stat};
      if(promo)minimal.date_promo=promo;
      r=await supaPatch(T.members,"id=eq."+_mpCurrentId,minimal);
      if(r===null){toast("Erreur réseau - réessaie","error");return;}
    }
  }
  Object.assign(m,patch);
  if(!supaOK)saveLS();

  toast(`✓ Fiche de ${mat} enregistrée`,"success");
  await logActivity(`Fiche de ${mat} modifiée par ${session?.user}`);

  if(grade!==_oldGrade&&(GRADE_LEVEL[grade]||0)>(GRADE_LEVEL[_oldGrade]||0)){
    await resetCmdOnPromotion(m,_oldGrade,grade);
  }
  if(grade!==_oldGrade && state.discord.promo){
    await discordConfirmSend("promo",discordPromoPayload(m,_oldGrade,grade,session?.user));
  }

  _mpEditMode=false;
  document.getElementById("mpEditSection").style.display="none";
  const eb=document.getElementById("mpEditToggleBtn");
  if(eb)eb.textContent="Modifier la fiche";
  document.getElementById("mpName").textContent=`${mat} - ${nom||"?"}`;

  renderRoster();
  renderOverview();
  refreshMemberViews();
  if(mat!==_oldMat||nom!==_oldNom)syncMemberNameCopies(m);
}

function mpTab(tab){
  document.querySelectorAll("[data-mpt]").forEach(b=>b.classList.toggle("on",b.dataset.mpt===tab));
  document.querySelectorAll(".mp-tab-content").forEach(t=>t.style.display="none");
  const m=state.members.find(x=>x.id==_mpCurrentId);
  if(!m)return;

  if(tab==="missions"){
    const el=document.getElementById("mpTabMissions");el.style.display="block";
    const mine=state.cmdmissions.filter(c=>c.member_id==_mpCurrentId);
    if(!mine.length){el.innerHTML='<div class="empty"><p>Aucun CMD de mission</p></div>';return;}
    el.innerHTML=mine.map(c=>`<div class="log-item"><div class="log-dot"${cmdEstAjust(c)?' style="background:var(--ye)"':""}></div>
      <div class="log-txt">${esc(c.role)||"Chef"} - ${esc(c.mission_name)||"Mission"} (${esc(cmdSigne(c.points))} pt${Math.abs(parseFloat(c.points)||0)>1?"s":""})</div>
      <div class="log-time">${fmtDate(c.date||c.created_at)}</div></div>`).join("");
  }
  if(tab==="medals"){
    const el=document.getElementById("mpTabMedals");el.style.display="block";
    renderMpMedals(m,el);
  }
  if(tab==="timeline"){
    const el=document.getElementById("mpTabTimeline");el.style.display="block";
    renderMemberTimeline(m,el);
  }
  if(tab==="blames"){
    const el=document.getElementById("mpTabBlames");el.style.display="block";
    const mine=state.blames.filter(b=>b.member_id==_mpCurrentId);
    if(!mine.length){el.innerHTML='<div class="empty"><p>Aucun blâme</p></div>';return;}
    el.innerHTML=mine.map(b=>`<div class="log-item"><div class="log-dot" style="background:${b.resolved?"var(--gr)":"var(--rd)"}"></div>
      <div class="log-txt">${esc(blameLevelLabel(b.level||1))} - ${esc(b.reason)||"Sans motif"}${b.resolved?` <span style="color:var(--gr)">(levé${b.resolve_reason?" : "+esc(b.resolve_reason):""})</span>`:""}</div>
      <div class="log-time">${fmtDate(b.created_at)}</div></div>`).join("");
  }
  if(tab==="absences"){
    const el=document.getElementById("mpTabAbsences");el.style.display="block";
    const mine=state.absences.filter(a=>a.member_id==_mpCurrentId);
    if(!mine.length){el.innerHTML='<div class="empty"><p>Aucune absence</p></div>';return;}
    el.innerHTML=mine.map(a=>`<div class="log-item"><div class="log-dot"></div>
      <div class="log-txt">Du ${fmtDate(a.start_date)} au ${fmtDate(a.end_date)} (${esc(a.duration_days)}j) - ${esc(a.reason)||"-"}</div>
      <div class="log-time">${fmtDate(a.created_at)}</div></div>`).join("");
  }
  if(tab==="reports"){
    const el=document.getElementById("mpTabReports");el.style.display="block";
    const mine=state.reports.filter(r=>r.member_id==_mpCurrentId);
    if(!mine.length){el.innerHTML='<div class="empty"><p>Aucun rapport soumis</p></div>';return;}
    el.innerHTML=mine.map(r=>`<div class="log-item"><div class="log-dot" style="background:var(--gr)"></div>
      <div class="log-txt">Rapport validé - semaine du ${fmtDate(r.week_key)}</div>
      <div class="log-time">${fmtDate(r.created_at)}</div></div>`).join("");
  }
}


function renderPromoProgress(m, elig){
  const el=document.getElementById("mpPromoProgress");
  if(!el)return;
  const p=elig.progress;
  if(!p||!p.nextGrade){
    el.innerHTML=`<div style="padding:1rem;background:var(--s2);border:1px solid var(--ln);text-align:center">
      <span class="mono-dm">Promotion manuelle - décidée par le commandement</span>
    </div>`;
    return;
  }
  const nextColor=GRADE_COLORS[p.nextGrade]||"#00e5ff";
  const daysColor=p.daysPct>=100?"var(--gr)":"var(--ac)";
  const cmdColor=p.cmdPct>=100?"var(--gr)":"var(--ye)";

  let bars=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.7rem">
      <span style="font-family:var(--fm);font-size:.7rem;color:var(--dm);letter-spacing:.08em">PROGRESSION VERS</span>
      <span class="grade-pill" style="color:${nextColor};font-family:var(--fs);font-weight:700;font-size:.8rem;letter-spacing:.05em">${p.nextGrade}</span>
    </div>`;

  bars+=`
    <div style="margin-bottom:.6rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:.3rem">
        <span style="font-size:.72rem;color:var(--tx2)">Temps de service</span>
        <span style="font-family:var(--fm);font-size:.72rem;color:${daysColor}">${p.days}/${p.needDays} j ${p.daysPct>=100?"✓":""}</span>
      </div>
      <div style="height:8px;background:var(--s3);border-radius:var(--r1);overflow:hidden;position:relative">
        <div class="promo-bar-fill" style="height:100%;width:100%;background:${daysColor};border-radius:var(--r1);transform-origin:left center;transform:scaleX(0);transition:transform var(--t4) var(--e-io)" data-target="${p.daysPct}"></div>
      </div>
    </div>`;

  if(p.hasCmd){
    bars+=`
    <div style="margin-bottom:.3rem">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--sp2);margin-bottom:.3rem">
        <span style="font-size:.72rem;color:var(--tx2)">Points CMD de mission</span>
        <span style="display:inline-flex;align-items:center;gap:var(--sp3)">
          <span style="font-family:var(--fm);font-size:.72rem;color:${cmdColor}">${p.cmd}/${p.needCmd} ${p.cmdPct>=100?"✓":""}</span>
          ${canAjusterCmd()?`<button class="sbtn" style="padding:var(--sp1) var(--sp3);font-size:.6rem"
            title="Corriger le total sans supprimer de mission"
            onclick="ajusterCmdPoints('${escJs(m.id)}')">Ajuster</button>`:""}
        </span>
      </div>
      <div style="height:8px;background:var(--s3);border-radius:var(--r1);overflow:hidden;position:relative">
        <div class="promo-bar-fill" style="height:100%;width:100%;background:${cmdColor};border-radius:var(--r1);transform-origin:left center;transform:scaleX(0);transition:transform var(--t4) var(--e-io)" data-target="${p.cmdPct}"></div>
      </div>
    </div>`;
  }

  if(elig.eligible===true){
    bars+=`<div style="margin-top:.8rem;padding:.6rem;background:color-mix(in srgb,var(--gr) 12%,transparent);border:1px solid color-mix(in srgb,var(--gr) 35%,transparent);text-align:center">
      <span style="color:var(--gr);font-family:var(--fm);font-size:.74rem;font-weight:700">✓ ÉLIGIBLE À LA PROMOTION</span>
    </div>`;
  }

  el.innerHTML=`<div style="padding:1rem;background:var(--s2);border:1px solid var(--ln)">${bars}</div>`;

  requestAnimationFrame(()=>{
    el.querySelectorAll(".promo-bar-fill").forEach(bar=>{
      requestAnimationFrame(()=>{
        bar.style.transform="scaleX("+(Math.max(0,Math.min(100,parseFloat(bar.dataset.target)||0))/100).toFixed(4)+")";
      });
    });
  });
}
