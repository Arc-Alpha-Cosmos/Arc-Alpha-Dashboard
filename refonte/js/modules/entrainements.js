/* ARC ALPHA - Module entrainements. */
const ACTIVITE_TYPES=["Entraînement","Tâche"];
const ACTIVITE_COLORS={"Entraînement":"var(--ac)","Tâche":"var(--or)"};
let actFilterMember="",actFilterType="";
let _actSel=new Set();

function actJsonList(v){
  if(Array.isArray(v))return v.map(String);
  if(typeof v==="string"&&v.trim()){
    try{const p=JSON.parse(v);if(Array.isArray(p))return p.map(String);}catch(e){}
  }
  return [];
}
function actIds(a){return actJsonList(a&&a.member_ids);}
function actNames(a){return actJsonList(a&&a.member_names);}
function actMemberLabels(a){
  const ids=actIds(a),names=actNames(a);
  if(!ids.length)return names.slice();
  return ids.map((id,i)=>memberLabel(id,names[i],"?"));
}
function actTypeLabel(t){return t==="Tâche"?"une tâche":"un entraînement";}
let _actParts=[];
function actParts(a){
  const v=a&&a.participants;
  if(Array.isArray(v))return v.map(String);
  if(typeof v==="string"&&v.trim()){
    const s=v.trim();
    if(s.charAt(0)==="["){
      try{const p=JSON.parse(s);if(Array.isArray(p))return p.map(String);}catch(e){}
    }
    return s.split(",").map(x=>x.trim()).filter(Boolean);
  }
  return [];
}
function renderActChips(){
  const box=document.getElementById("actPartChips");
  if(!box)return;
  box.innerHTML=_actParts.map((p,i)=>`<span class="act-chip">${esc(p)}<button type="button" onclick="actPartRemove(${i})" title="Retirer">×</button></span>`).join("");
  const n=document.getElementById("actPartCount");
  if(n)n.textContent=_actParts.length?`${_actParts.length} ajouté${_actParts.length>1?"s":""}`:"aucun";
}
function actPartAdd(){
  const inp=document.getElementById("actParticipants");
  if(!inp)return;
  (inp.value||"").split(",").forEach(t=>{
    const v=t.trim().replace(/\s+/g," ");
    if(!v)return;
    if(_actParts.some(p=>p.toLowerCase()===v.toLowerCase()))return;
    _actParts.push(v);
  });
  inp.value="";
  renderActChips();
}
function actPartRemove(i){
  _actParts.splice(i,1);
  renderActChips();
}
function actPartKey(e){
  if(e.key==="Enter"||e.key===","){e.preventDefault();actPartAdd();}
  else if(e.key==="Backspace"&&!e.target.value&&_actParts.length){e.preventDefault();actPartRemove(_actParts.length-1);}
}
function populateMatriculeDatalist(listId){
  const dl=document.getElementById(listId);
  if(!dl)return;
  dl.innerHTML=sortMembers((state.members||[]).filter(m=>(m.categorie||"effectif")!=="blacklist"))
    .map(m=>`<option value="${esc(m.matricule||"")}">${esc(m.nom||"")}</option>`)
    .join("");
}

function populateActFilterMembers(){
  const sel=document.getElementById("actFMember");
  if(!sel)return;
  const cur=String(actFilterMember||"");
  const members=sortMembers((state.members||[]).filter(m=>(m.categorie||"effectif")!=="blacklist"));
  sel.innerHTML='<option value="">Tous les membres</option>'+members.map(m=>{
    const on=String(m.id)===cur?" selected":"";
    return `<option value="${esc(m.id)}"${on}>${esc(`${m.matricule||"?"} - ${m.nom||"?"}`)}</option>`;
  }).join("");
  sel.value=cur;
}

function renderEntrainements(){
  const tbody=document.getElementById("entrainementsBody");if(!tbody)return;
  const canEditA=canEdit("entrainements");
  const canDelA=canEdit("roster");
  const addBtn=document.getElementById("addEntrainementBtn");
  if(addBtn)addBtn.style.display=canEditA?"":"none";
  populateActFilterMembers();
  const tf=document.getElementById("actFType");if(tf)tf.value=actFilterType||"";
  let list=(state.activites||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  if(actFilterType)list=list.filter(a=>(a.type||"")===actFilterType);
  if(actFilterMember)list=list.filter(a=>actIds(a).includes(String(actFilterMember)));
  const cnt=document.getElementById("entrainementsCount");
  if(cnt)cnt.textContent=`${list.length} entrée${list.length>1?"s":""}`;

  /* Chiffres clés sur toutes les séances, filtres non compris. */
  const sea=(state.activites||[]);
  const qui=new Set();
  sea.forEach(a=>actIds(a).forEach(i=>qui.add(String(i))));
  const ilYa30=addDaysYmd(ymdLocal(new Date()),-30);
  const rec=sea.filter(a=>String(a.date||"")>=ilYa30).length;
  const der=sea.slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0];
  const ga=id=>document.getElementById(id);
  if(ga("actStatTot"))ga("actStatTot").textContent=sea.length;
  if(ga("actStatMem"))ga("actStatMem").textContent=qui.size;
  if(ga("actStat30"))ga("actStat30").textContent=rec;
  if(ga("actStatLast"))ga("actStatLast").textContent=der&&der.date?fmtDate(der.date):"-";
  statTone("actStatTot",sea.length?"ac":"mute","depuis le début");
  statTone("actStatMem",qui.size?"ok":"mute",qui.size?"ont participé":"");
  statTone("actStat30",rec?"ok":"warn",rec?"séances récentes":"rien ce mois-ci");
  statTone("actStatLast",der?"ac":"mute",der?(der.type||""):"");
  if(!list.length){
    const vide=(actFilterType||actFilterMember)?"Aucune entrée pour ce filtre":"Aucune entrée enregistrée";
    tbody.innerHTML=`<tr><td colspan="6"><div class="empty"><p>${vide}</p></div></td></tr>`;return;
  }
  tbody.innerHTML=list.map(a=>{
    const tc=ACTIVITE_COLORS[a.type]||"var(--dm)";
    const labels=actMemberLabels(a);
    const shown=labels.slice(0,3).map(esc).join(", ");
    const more=labels.length>3?` <span class="c-dm">+${labels.length-3}</span>`:"";
    const com=a.commentaire?` <span style="color:var(--dm);cursor:help" title="${esc(a.commentaire)}">💬</span>`:"";
    const pl=actParts(a);const part=pl.length?`<div style="color:var(--dm);font-size:.74rem;margin-top:.15rem">+ ${esc(pl.join(", "))}</div>`:"";
    return `<tr>
      <td><span style="font-family:var(--fm);font-size:.74rem;color:${tc};border:1px solid ${tc}44;background:${tc}11;padding:.15rem .5rem;border-radius:var(--r1)">${esc(a.type)||"-"}</span></td>
      <td><span style="font-size:.82rem;color:var(--tx)">${esc(a.intitule)||"-"}</span>${com}</td>
      <td><span style="font-size:.8rem;color:var(--tx)" title="${esc(labels.join(", "))}">${shown||"-"}${more}</span>${part}</td>
      <td><span class="mono-dm">${a.date?fmtDate(a.date):"-"}</span></td>
      <td><span style="font-size:.8rem;color:var(--tx)">${esc(memberLabel(a.officier_id,a.officier,"-"))}</span></td>
      <td class="ta-r"><div class="row-end">
        ${canEditA?`<button class="sm sbtn" onclick="openEntrainementModal('${escJs(a.id)}')">Modifier</button>`:""}
        ${canDelA?`<button class="icon-btn del" onclick="deleteEntrainement('${escJs(a.id)}')" title="Supprimer" aria-label="Supprimer"><i data-lucide="trash-2"></i></button>`:""}
      </div></td>
    </tr>`;
  }).join("");
}

function actMembersChanged(){
  const box=document.getElementById("actMembersBox");
  if(box)box.querySelectorAll("input[type=checkbox]").forEach(c=>{
    if(c.checked)_actSel.add(String(c.value));else _actSel.delete(String(c.value));
  });
  const n=document.getElementById("actMembersCount");
  if(n)n.textContent=_actSel.size?`${_actSel.size} sélectionné${_actSel.size>1?"s":""}`:"aucun sélectionné";
}
function populateActMembers(q){
  const box=document.getElementById("actMembersBox");
  if(!box)return;
  const ql=(q||"").trim().toLowerCase();
  const members=sortMembers((state.members||[]).filter(m=>(m.categorie||"effectif")!=="blacklist"))
    .filter(m=>!ql||[m.nom,m.matricule,m.grade].some(v=>v&&String(v).toLowerCase().includes(ql)));
  if(!members.length){box.innerHTML='<p style="color:var(--dm);font-size:.74rem;padding:.4rem;margin:0">Aucun membre</p>';actMembersChanged();return;}
  box.innerHTML=members.map(m=>{
    const on=_actSel.has(String(m.id))?" checked":"";
    return `<label class="act-mrow">
      <input type="checkbox" value="${esc(m.id)}"${on} onchange="actMembersChanged()">
      <span class="n">${esc(`${m.matricule||"?"} - ${m.nom||"?"}`)}</span><span class="g">${esc(m.grade||"ARC")}</span>
    </label>`;
  }).join("");
  actMembersChanged();
}
function populateActTypes(current){
  const sel=document.getElementById("actType");
  if(!sel)return;
  const list=ACTIVITE_TYPES.slice();
  if(current&&!list.includes(current))list.unshift(current);
  sel.innerHTML=list.map(t=>`<option value="${esc(t)}"${t===current?" selected":""}>${esc(t)}</option>`).join("");
  if(!current&&list.length)sel.value=list[0];
}

function openEntrainementModal(id){
  if(!canEdit("entrainements")){toast("Réservé aux SGT et plus","error");return;}
  const err=document.getElementById("entrainementErr");if(err)err.style.display="none";
  const q=document.getElementById("actMemberSearch");if(q)q.value="";
  if(id){
    const a=(state.activites||[]).find(x=>x.id==id);
    if(!a)return;
    document.getElementById("actId").value=a.id;
    _actSel=new Set(actIds(a));
    populateActTypes(a.type||"");
    document.getElementById("actIntitule").value=a.intitule||"";
    document.getElementById("actDate").value=String(a.date||"").slice(0,10);
    populateMemberSelect("actOfficier",a.officier_id,a.officier);
    document.getElementById("actCommentaire").value=a.commentaire||"";
    _actParts=actParts(a);
    document.getElementById("entrainementModalTitle").textContent="Modifier l'entrée";
  }else{
    document.getElementById("actId").value="";
    _actSel=new Set();
    populateActTypes("");
    document.getElementById("actIntitule").value="";
    document.getElementById("actDate").value=ymdLocal(new Date());
    populateMemberSelect("actOfficier",session?.memberId||"","");
    document.getElementById("actCommentaire").value="";
    _actParts=[];
    document.getElementById("entrainementModalTitle").textContent="Nouvelle entrée";
  }
  renderActChips();
  populateMatriculeDatalist("actParticipantsList");
  populateActMembers("");
  document.getElementById("entrainementModal").classList.add("show");
}

function writeActivite(id,obj){
  return supaWriteOptional(T.activites,id?("id=eq."+id):null,obj,["member_ids","member_names","officier_id","commentaire","participants"]);
}

async function saveEntrainement(){
  if(!canEdit("entrainements")){toast("Réservé aux SGT et plus","error");return;}
  const err=document.getElementById("entrainementErr");
  const showErr=(m)=>{err.textContent=m;err.style.display="block";};
  const id=document.getElementById("actId").value;
  const prev=id?(state.activites||[]).find(x=>x.id==id):null;
  const type=document.getElementById("actType").value;
  const intitule=(document.getElementById("actIntitule").value||"").trim();
  const date=document.getElementById("actDate").value;
  const oRef=readMemberSelect("actOfficier",prev?.officier);
  const commentaire=(document.getElementById("actCommentaire").value||"").trim();
  actPartAdd();
  const participants=_actParts.slice();
  const ids=[..._actSel].map(String);
  if(!intitule){showErr("L'intitulé est requis.");return;}
  if(!ids.length){showErr("Sélectionne au moins un membre concerné.");return;}
  if(!oRef.chosen){showErr("L'officier qui valide est requis.");return;}
  const names=ids.map(i=>memberLabel(i,"",""));
  const obj={type,intitule,date:date||null,
             member_ids:JSON.stringify(ids),member_names:JSON.stringify(names),
             officier_id:oRef.id,officier:oRef.name,commentaire:commentaire||null,participants:participants.length?JSON.stringify(participants):null};

  if(id){
    if(supaOK){const r=await writeActivite(id,obj);if(r===null){showErr("Erreur réseau.");return;}}
    const a=(state.activites||[]).find(x=>x.id==id);if(a)Object.assign(a,obj);
    if(!supaOK)saveLS();
  }else{
    if(supaOK){
      const r=await writeActivite(null,obj);
      if(r&&r.length>0)state.activites.unshift(r[0]);
      else{obj.id=Date.now().toString();state.activites.unshift(obj);}
    }else{obj.id=Date.now().toString();state.activites.unshift(obj);saveLS();}
    if(supaOK){const fresh=await supaGet(T.activites);if(fresh)state.activites=fresh;}
  }
  const creds=[];
  for(const mid of ids){
    const c=await autoReportForActivity(mid,obj.date);
    if(c)creds.push(c);
  }
  closeModal("entrainementModal");
  renderEntrainements();
  if(creds.length){renderReports();renderOverview();}
  const mot=actTypeLabel(type);
  toast(creds.length?`Entrée enregistrée. Rapport validé pour ${creds.length} membre${creds.length>1?"s":""}`:"Entrée enregistrée","success");
  await logActivity(`${session?.user} a enregistré ${mot} : ${intitule} (${names.filter(Boolean).join(", ")})`);
  for(const c of creds)await logActivity(`Rapport de ${c.name} validé automatiquement (sem. ${c.week}) suite à ${mot}`);
}

async function deleteEntrainement(id){
  if(!canEdit("roster")){toast("Réservé aux MAJ et plus","error");return;}
  const a=(state.activites||[]).find(x=>x.id==id);
  if(!await uiConfirm({title:"Supprimer l'entrée",message:"Supprimer cette entrée ? Les rapports déjà validés ne sont pas retirés.",okText:"Supprimer",danger:true}))return;
  if(supaOK)await supaDelete(T.activites,"id=eq."+id);
  state.activites=(state.activites||[]).filter(x=>x.id!=id);
  if(!supaOK)saveLS();
  renderEntrainements();
  toast("Entrée supprimée","info");
  await logActivity(`${a?.type==="Tâche"?"Tâche":"Entraînement"} supprimé (${a?.intitule||"?"}) par ${session?.user}`);
}
