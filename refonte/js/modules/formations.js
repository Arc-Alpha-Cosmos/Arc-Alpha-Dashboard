/* ARC ALPHA - Module formations. */
let fmSearchQ="";
const fmSearchDebounced=debounce(v=>{fmSearchQ=v;renderFormations();},150);
function renderFormations(){
  const tbody=document.getElementById("formationsBody");if(!tbody)return;
  const canEditF=canEdit("formations");
  const canDelF=canEdit("roster");
  const addBtn=document.getElementById("addFormationBtn");
  if(addBtn)addBtn.style.display=canEditF?"":"none";
  const toutes=(state.formations||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  /* Les chiffres clés portent sur l'ensemble, pas sur le filtre en cours :
     sinon chercher un nom ferait croire que l'unité n'a que deux formations. */
  const nOk=toutes.filter(f=>f.statut==="Validé").length;
  const nRun=toutes.filter(f=>f.statut==="En cours").length;
  const nKo=toutes.filter(f=>f.statut==="Échoué").length;
  const gf=id=>document.getElementById(id);
  if(gf("fmStatTotal"))gf("fmStatTotal").textContent=toutes.length;
  if(gf("fmStatOk"))gf("fmStatOk").textContent=nOk;
  if(gf("fmStatRun"))gf("fmStatRun").textContent=nRun;
  if(gf("fmStatKo"))gf("fmStatKo").textContent=nKo;
  statTone("fmStatTotal",toutes.length?"ac":"mute","depuis le début");
  statTone("fmStatOk",nOk?"ok":"mute",toutes.length?Math.round(nOk/toutes.length*100)+" % des formations":"");
  statTone("fmStatRun",nRun?"warn":"ok",nRun?"à terminer":"rien en cours");
  statTone("fmStatKo",nKo?"crit":"ok",nKo?"à repasser":"aucun échec");

  const q=(fmSearchQ||"").trim().toLowerCase();
  const clr=gf("fmSearchClear");
  if(clr)clr.style.display=q?"":"none";
  let list=toutes;
  if(q)list=toutes.filter(f=>[
      memberLabel(f.formateur_id,f.formateur,""),memberLabel(f.eleve_id,f.eleve,""),
      f.formation||"",f.statut||"",f.date||""
    ].join(" ").toLowerCase().includes(q));
  const cf=gf("fmCount");
  if(cf)cf.textContent=list.length+(list.length>1?" formations":" formation")+(q?" trouvées":"");
  if(!list.length){
    tbody.innerHTML='<tr><td colspan="6"><div class="empty"><p>'
      +(q?("Aucune formation pour « "+esc(fmSearchQ)+" »"):"Aucune formation enregistrée")
      +'</p></div></td></tr>';
    return;
  }
  const stColors={"Validé":"var(--gr)","En cours":"var(--ye)","Échoué":"var(--rd)"};
  tbody.innerHTML=list.map(f=>{
    const sc=stColors[f.statut]||"var(--dm)";
    return `<tr>
      <td><span style="font-size:.82rem;color:var(--tx)">${esc(memberLabel(f.formateur_id,f.formateur,"-"))}</span></td>
      <td><span style="font-size:.82rem;color:var(--tx)">${esc(memberLabel(f.eleve_id,f.eleve,"-"))}</span></td>
      <td><span class="fbadge" style="--c:${FORMATION_TYPE_COLORS[f.formation]||"var(--ac)"}">${esc(f.formation)||"-"}</span></td>
      <td><span class="mono-dm">${f.date?fmtDate(f.date):"-"}</span></td>
      <td><span class="fbadge" style="--c:${sc}">${esc(f.statut)||"-"}</span></td>
      <td class="ta-r"><div class="row-end">
        ${canEditF&&canEditFormationType(f.formation)?`<button class="sm sbtn" onclick="openFormationModal('${escJs(f.id)}')">Modifier</button>
`:""}
        ${canDelF?`<button class="icon-btn del" onclick="deleteFormation('${escJs(f.id)}')" title="Supprimer" aria-label="Supprimer"><i data-lucide="trash-2"></i></button>`:""}
      </div></td>
    </tr>`;
  }).join("");
}

function populateMemberSelect(selectId,currentId,legacyText){
  const sel=document.getElementById(selectId);
  if(!sel)return;
  const members=sortMembers((state.members||[]).filter(m=>(m.categorie||"effectif")!=="blacklist"));
  const known=memberById(currentId);
  let html='<option value="">Sélectionner…</option>';
  const orphan=!known&&legacyText;
  if(orphan)html+=`<option value="${LEGACY_MEMBER_OPT}" selected>${esc(legacyText)} (ancienne saisie)</option>`;
  html+=members.map(m=>{
    const label=`${m.matricule||"?"} - ${m.nom||"?"} (${m.grade||"ARC"})`;
    const on=known&&String(known.id)===String(m.id)?" selected":"";
    return `<option value="${esc(m.id)}"${on}>${esc(label)}</option>`;
  }).join("");
  sel.innerHTML=html;
}
const LEGACY_MEMBER_OPT="__legacy__";

const MEMBER_SUGGEST_SEP=" - ";
function populateMemberDatalist(listId){
  const dl=document.getElementById(listId);
  if(!dl)return;
  dl.innerHTML=sortMembers((state.members||[]).filter(m=>(m.categorie||"effectif")!=="blacklist"))
    .map(m=>`<option value="${esc(`${m.matricule||"?"}${MEMBER_SUGGEST_SEP}${m.nom||"?"}`)}">${esc(m.grade||"ARC")}</option>`)
    .join("");
}
function resolveMemberFromText(txt){
  const s=(txt||"").trim();
  if(!s)return{id:null,name:"",chosen:false};
  const norm=v=>String(v||"").trim().toLowerCase().replace(/\s+/g," ");
  const t=norm(s);
  const list=state.members||[];
  const hit=list.find(m=>norm(m.matricule)===t)
         || list.find(m=>norm(`${m.matricule||""}${MEMBER_SUGGEST_SEP}${m.nom||""}`)===t)
         || list.find(m=>norm(`${m.matricule||""} ${m.nom||""}`)===t)
         || list.find(m=>m.nom&&norm(m.nom)===t);
  if(hit)return{id:hit.id,name:`${hit.matricule||"?"} ${hit.nom||""}`.trim(),chosen:true};
  return{id:null,name:s,chosen:true};
}

const FORMATION_TYPES=["ARC Alpha","ARC Trooper","CMD de mission","Bleu"];
const SGT_FORMATION_TYPES=["ARC Trooper","CMD de mission"];
function allowedFormationTypes(){
  if(!Auth.ok())return[];
  if(session.role==="brs")return[];
  if(session.role==="admin"||session.role==="amiraute")return FORMATION_TYPES.slice();
  return gradeLevel(getSessionGrade())<=1?SGT_FORMATION_TYPES.slice():FORMATION_TYPES.slice();
}
function canEditFormationType(type){
  if(!Auth.ok())return false;
  if(session.role==="brs")return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  if(gradeLevel(getSessionGrade())>1)return true;
  return !type||SGT_FORMATION_TYPES.includes(type);
}
function populateFormationTypes(current){
  const sel=document.getElementById("fmFormation");
  if(!sel)return;
  const list=allowedFormationTypes();
  if(current&&!list.includes(current))list.unshift(current);
  sel.innerHTML=list.map(t=>`<option value="${esc(t)}"${t===current?" selected":""}>${esc(t)}</option>`).join("");
  if(!current&&list.length)sel.value=list[0];
}

function openFormationModal(id){
  if(!canEdit("formations")){toast("Réservé aux SGT et plus","error");return;}
  const err=document.getElementById("formationErr");if(err)err.style.display="none";
  if(id){
    const f=(state.formations||[]).find(x=>x.id==id);
    if(!f)return;
    if(!canEditFormationType(f.formation)){toast(`Formation ${f.formation} : réservée aux LT et plus`,"error");return;}
    document.getElementById("fmId").value=f.id;
    populateMemberSelect("fmFormateur",f.formateur_id,f.formateur);
    populateMemberDatalist("fmEleveList");
    document.getElementById("fmEleve").value=memberLabel(f.eleve_id,f.eleve,"");
    populateFormationTypes(f.formation||"");
    document.getElementById("fmDate").value=f.date||"";
    document.getElementById("fmStatut").value=f.statut||"En cours";
    document.getElementById("formationModalTitle").textContent="Modifier la formation";
  }else{
    document.getElementById("fmId").value="";
    populateMemberSelect("fmFormateur","","");
    populateMemberDatalist("fmEleveList");
    document.getElementById("fmEleve").value="";
    populateFormationTypes("");
    document.getElementById("fmDate").value=ymdLocal(new Date());
    document.getElementById("fmStatut").value="En cours";
    document.getElementById("formationModalTitle").textContent="Nouvelle formation";
  }
  document.getElementById("formationModal").classList.add("show");
}

function readMemberSelect(selectId,legacyText){
  const v=(document.getElementById(selectId)||{}).value||"";
  if(v===LEGACY_MEMBER_OPT)return{id:null,name:legacyText||"",chosen:!!legacyText};
  const m=memberById(v);
  if(m)return{id:m.id,name:`${m.matricule||"?"} ${m.nom||""}`.trim(),chosen:true};
  return{id:null,name:"",chosen:false};
}
async function supaWriteOptional(table,filter,obj,optionalCols){
  const send=(body)=>filter?supaPatch(table,filter,body):supaPost(table,body);
  let r=await send(obj);
  if(r===null&&optionalCols.some(c=>c in obj)){
    const legacy={...obj};
    optionalCols.forEach(c=>delete legacy[c]);
    r=await send(legacy);
    if(r!==null)console.warn(`${table} : colonnes absentes (${optionalCols.join(", ")}) - écriture en mode compatible.`);
  }
  return r;
}
function writeFormation(id,obj){
  return supaWriteOptional(T.formations,id?("id=eq."+id):null,obj,["formateur_id","eleve_id"]);
}

async function saveFormation(){
  if(!canEdit("formations")){toast("Réservé aux SGT et plus","error");return;}
  const err=document.getElementById("formationErr");
  const showErr=(m)=>{err.textContent=m;err.style.display="block";};
  const id=document.getElementById("fmId").value;
  const prev=id?(state.formations||[]).find(x=>x.id==id):null;
  const fRef=readMemberSelect("fmFormateur",prev?.formateur);
  const eRef=resolveMemberFromText(document.getElementById("fmEleve").value);
  const formation=document.getElementById("fmFormation").value;
  const date=document.getElementById("fmDate").value;
  const statut=document.getElementById("fmStatut").value;
  if(!fRef.chosen||!eRef.chosen){showErr("Formateur et élève sont requis.");return;}
  const badType=!canEditFormationType(formation)?formation:(prev&&!canEditFormationType(prev.formation)?prev.formation:null);
  if(badType){showErr(`Les formations ${badType} sont réservées aux LT et plus.`);return;}

  const obj={formateur:fRef.name,eleve:eRef.name,formateur_id:fRef.id,eleve_id:eRef.id,
             formation,date:date||null,statut};

  if(id){
    if(supaOK){const r=await writeFormation(id,obj);if(r===null){showErr("Erreur réseau.");return;}}
    const f=(state.formations||[]).find(x=>x.id==id);if(f)Object.assign(f,obj);
    if(!supaOK)saveLS();
  }else{
    if(supaOK){
      const r=await writeFormation(null,obj);
      if(r&&r.length>0)state.formations.unshift(r[0]);
      else{obj.id=Date.now().toString();state.formations.unshift(obj);}
    }else{obj.id=Date.now().toString();state.formations.unshift(obj);saveLS();}
    if(supaOK){const fresh=await supaGet(T.formations);if(fresh)state.formations=fresh;}
  }
  /* Une formation Bleu validée rend l'élève « formé ». */
  if(formation==="Bleu"&&statut==="Validé"&&eRef.id){
    const _mb=memberById(eRef.id);
    if(_mb&&!_mb.f_bleu){
      _mb.f_bleu=true;
      if(supaOK){
        const _rb=await supaPatch(T.members,`id=eq.${eRef.id}`,{f_bleu:true});
        if(_rb===null)toast("Ajoute la colonne f_bleu dans Supabase (booléen)","error");
      }else saveLS();
      try{renderRoster();}catch(e){}
      await logActivity(`${eRef.name} est désormais formé (formation Bleu validée)`);
    }
  }
  const formateur=obj.formateur,eleve=obj.eleve;
  const autoRep=await autoReportForActivity(fRef.id,obj.date);
  closeModal("formationModal");
  renderFormations();
  if(autoRep){renderReports();renderOverview();}
  toast(autoRep?`Formation enregistrée. Rapport validé pour ${autoRep.name}`:"Formation enregistrée","success");
  await logActivity(`${session?.user} a enregistré une formation ${formation} : ${formateur} → ${eleve}`);
  if(autoRep)await logActivity(`Rapport de ${autoRep.name} validé automatiquement (sem. ${autoRep.week}) suite à une formation`);
  if(state.discord.formations){
    await discordConfirmSend("formation",discordFormationPayload(obj,session?.user,!!id));
  }
}

async function deleteFormation(id){
  if(!canEdit("roster")){toast("Réservé aux MAJ et plus, ou aux CPT chargés de l'effectif","error");return;}
  if(!await uiConfirm({title:"Supprimer la formation",message:"Supprimer cette formation ?",okText:"Supprimer",danger:true}))return;
  if(supaOK)await supaDelete(T.formations,"id=eq."+id);
  const _delF=(state.formations||[]).find(f=>f.id==id);
  state.formations=(state.formations||[]).filter(f=>f.id!=id);
  if(!supaOK)saveLS();
  renderFormations();
  toast("Formation supprimée","info");
  await logActivity(`Formation supprimée (${memberLabel(_delF?.formateur_id,_delF?.formateur)} → ${memberLabel(_delF?.eleve_id,_delF?.eleve)}) par ${session?.user}`);
}

/* Memes couleurs que les qualifications de l'onglet Effectif. */
const FORMATION_TYPE_COLORS={"ARC Alpha":FORMATION_COLORS.alpha,"ARC Trooper":FORMATION_COLORS.trooper,
  "CMD de mission":FORMATION_COLORS.cmd,"Bleu":FORMATION_COLORS.bleu,"Négociation":FORMATION_COLORS.nego};
