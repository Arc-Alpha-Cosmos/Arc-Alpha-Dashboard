/* ARC ALPHA - Module cmd. */
function getCmdTotal(memberId){
  return state.cmdmissions.filter(c=>c.member_id==memberId).reduce((s,c)=>s+parseFloat(c.points||0),0);
}

/* Un ajustement n'est pas une mission : il corrige un total sans rien effacer
   de ce qui a ete fait. Il se reconnait a son role, et lui seul peut porter
   des points negatifs. Il compte dans le total, jamais dans le decompte des
   missions ni dans l'activite de la semaine. */
function cmdEstAjust(c){ return String((c&&c.role)||"").toLowerCase()==="ajustement"; }
function cmdVraiesMissions(){ return (state.cmdmissions||[]).filter(c=>!cmdEstAjust(c)); }
function cmdSigne(n){ const v=Math.round((parseFloat(n)||0)*100)/100; return (v>0?"+":"")+v; }

/* Corriger ce compteur decide des promotions : cela ne regarde que le
   commandement. CMD et CMDM, plus l'administration. */
function canAjusterCmd(){
  if(!Auth.ok()) return false;
  if(session.role==="admin") return true;
  if(session.role==="brs"||session.role==="amiraute") return false;
  return gradeLevel(getSessionGrade())>=6;
}

async function ajusterCmdPoints(memberId){
  if(!canAjusterCmd()){toast("Réservé aux CMD et CMDM","error");return;}
  const m=(state.members||[]).find(x=>String(x.id)===String(memberId));
  if(!m){toast("Membre introuvable","error");return;}
  const actuel=Math.round(getCmdTotal(m.id)*100)/100;
  const rep=await uiPrompt({
    kicker:"// POINTS CMD DE MISSION",
    title:`${m.matricule} ${m.nom||""}`.trim(),
    message:`Total actuel : ${actuel} point${Math.abs(actuel)>1?"s":""}.\n\n`
      +"Indique le nouveau total. Aucune mission n'est supprimée : la correction "
      +"s'enregistre comme un ajustement, visible dans l'onglet CMD Mission.",
    defaultValue:String(actuel),
    placeholder:"ex : 1.5",
    okText:"Ajuster"
  });
  if(rep===null||rep===undefined)return;
  const brut=String(rep).trim().replace(",",".");
  const cible=Math.round(parseFloat(brut)*100)/100;
  if(brut===""||isNaN(cible)||cible<0||cible>999){
    toast("Entre un nombre entre 0 et 999","error");return;
  }
  if(cible===actuel){toast("Total inchangé","info");return;}
  const delta=Math.round((cible-actuel)*100)/100;
  const obj={member_id:m.id,
    member_name:`${m.matricule} ${m.nom||""}`.trim(),
    points:delta,
    mission_name:`Ajustement : ${actuel} → ${cible}`,
    date:ymdLocal(new Date()),
    role:"Ajustement"};
  let enregistre=true;
  if(supaOK){
    const r=await supaPost(T.cmdmissions,obj);
    if(r&&r.length>0)state.cmdmissions.unshift(r[0]); else enregistre=false;
  }else{
    obj.id=Date.now().toString();state.cmdmissions.unshift(obj);saveLS();
  }
  if(!enregistre){toast("Erreur réseau : ajustement non enregistré","error");return;}
  toast(`Points CMD de ${m.matricule} : ${actuel} → ${cible}`,"success");
  await logActivity(`${session?.user} a ajusté les points CMD de ${obj.member_name} : `
    +`${actuel} → ${cible} (${cmdSigne(delta)}), sans supprimer de mission`);
  renderRoster();renderOverview();
  if(typeof renderCmd==="function")renderCmd();
  /* La fiche reste ouverte : on la redessine pour qu'elle montre le nouveau
     total plutot que celui d'avant. */
  if(_mpCurrentId!=null&&String(_mpCurrentId)===String(m.id))openMemberProfile(m.id);
}

async function resetCmdOnPromotion(m,oldGrade,newGrade){
  if(!canEdit("roster")){return;}
  if(!m)return;
  const total=getCmdTotal(m.id);
  if(total<=0)return;
  const ok=await uiConfirm({kicker:"// PROMOTION",title:`${oldGrade} → ${newGrade}`,message:`${m.matricule} possède actuellement ${total} CMD de mission.\n\nRemettre son compteur à 0 ? (recommandé après une promotion)`,okText:"Remettre à 0",cancelText:"Conserver",danger:true});
  if(!ok)return;
  if(supaOK)await supaDelete(T.cmdmissions,`member_id=eq.${m.id}`);
  state.cmdmissions=state.cmdmissions.filter(c=>c.member_id!=m.id);
  if(!supaOK)saveLS();
  toast(`CMD de ${m.matricule} remis à 0 (promotion)`,"success");
  await logActivity(`${session?.user} - CMD de mission de ${m.matricule} remis à 0 suite à la promotion ${oldGrade} → ${newGrade}`);
  renderRoster();renderOverview();
  if(typeof renderCmd==="function")renderCmd();
}


function openCmdModal(){
  if(!canEdit("cmd")){toast("Réservé aux officiers LT+","error");return;}
  const sel=document.getElementById("cmdMember");
  sel.innerHTML=`<option value="">Sélectionner…</option>`+
    sortMembers(activeMembers()).map(m=>`<option value="${m.id}">${esc(m.matricule)} - ${esc(m.nom)||"?"}</option>`).join("");
  document.getElementById("cmdDate").value=ymdLocal(new Date());
  document.getElementById("cmdModal").classList.add("show");
}

async function saveCmdMission(){
  if(!canEdit("cmd")){toast("Accès insuffisant","error");return;}
  const mid=document.getElementById("cmdMember").value;
  const pts=parseFloat(document.getElementById("cmdRole").value);
  const date=document.getElementById("cmdDate").value;
  const mname=document.getElementById("cmdMissionName").value.trim();
  if(!mid)return fieldError("cmdMember","Choisis le membre concerné.");
  if(!date)return fieldError("cmdDate","Indique la date de la mission.");
  const m=state.members.find(x=>x.id==mid);
  const obj={member_id:mid,member_name:m?`${m.matricule} ${m.nom||""}`.trim():"?",points:pts,mission_name:mname,date,role:pts===1?"Chef":"Second"};
  let saved=true;
  if(supaOK){const r=await supaPost(T.cmdmissions,obj);if(r&&r.length>0)state.cmdmissions.unshift(r[0]);else saved=false;}
  else{obj.id=Date.now().toString();state.cmdmissions.unshift(obj);saveLS();}
  if(!saved){toast("Erreur réseau : CMD non enregistré","error");return;}
  const autoRep=await autoReportForActivity(mid,date);
  closeModal("cmdModal");renderCmd();renderRoster();
  if(autoRep){renderReports();renderOverview();}
  toast(autoRep?`CMD enregistré. Rapport validé pour ${autoRep.name}`:`CMD enregistré pour ${obj.member_name}`,"success");
  await logActivity(`${session?.user} a ajouté un CMD ${pts===1?"chef":"second"} à ${obj.member_name}`);
  if(autoRep)await logActivity(`Rapport de ${autoRep.name} validé automatiquement (sem. ${autoRep.week}) suite à un CMD de mission`);
  if(state.discord.promo){
    await discordConfirmSend("cmd",discordCmdPayload(obj,m,session?.user));
  }
}

function renderCmd(){
  const ranking=new Map();
  state.cmdmissions.forEach(c=>{
    const k=memberKey(c.member_id,c.member_name);
    const cur=ranking.get(k)||{pts:0,id:c.member_id,stored:c.member_name};
    cur.pts+=parseFloat(c.points||0);
    ranking.set(k,cur);
  });
  const sorted=[...ranking.values()].sort((a,b)=>b.pts-a.pts);

  /* Chiffres clés du tableau de chasse. */
  const totPts=state.cmdmissions.reduce((s,c)=>s+parseFloat(c.points||0),0);
  const gc2=id=>document.getElementById(id);
  const nbMissions=cmdVraiesMissions().length;
  if(gc2("cmdStatMis"))gc2("cmdStatMis").textContent=nbMissions;
  if(gc2("cmdStatPts"))gc2("cmdStatPts").textContent=Math.round(totPts*10)/10;
  if(gc2("cmdStatMem"))gc2("cmdStatMem").textContent=sorted.length;
  if(gc2("cmdStatTop"))gc2("cmdStatTop").textContent=sorted.length?memberLabel(sorted[0].id,sorted[0].stored):"-";
  statTone("cmdStatMis",nbMissions?"ac":"mute","enregistrées");
  statTone("cmdStatPts",totPts?"ok":"mute",nbMissions?"chefs et seconds":"");
  statTone("cmdStatMem",sorted.length?"ac":"mute",sorted.length?"au classement":"");
  statTone("cmdStatTop",sorted.length?"ok":"mute",
    sorted.length?(Math.round(sorted[0].pts*10)/10+(sorted[0].pts>1?" points":" point")):"");

  const rc=document.getElementById("cmdRanking");
  if(rc){
    if(!sorted.length)rc.innerHTML='<div class="empty"><p>Aucun CMD enregistré</p></div>';
    else rc.innerHTML=sorted.map((e,i)=>`
      <div class="cmd-rank">
        <div class="cmd-rank-pos">#${i+1}</div>
        <div class="cmd-rank-nm">${esc(memberLabel(e.id,e.stored))}</div>
        <div class="cmd-rank-pts">${e.pts} pt${e.pts>1?"s":""}</div>
      </div>`).join("");
  }
  const tbody=document.getElementById("cmdBody");if(!tbody)return;
  if(!state.cmdmissions.length){tbody.innerHTML='<tr><td colspan="6"><div class="empty"><p>Aucun CMD enregistré</p></div></td></tr>';return;}
  const cmdEditable=canEdit("cmd");
  tbody.innerHTML=state.cmdmissions.map(c=>`<tr>
    <td class="nm">${esc(memberLabel(c.member_id,c.member_name))}</td>
    <td><span style="font-family:var(--fm);font-size:.74rem;color:${cmdEstAjust(c)?"var(--or)":(c.points===1?"var(--ac)":"var(--vi)")}">${esc(c.role)||"Chef"}</span></td>
    <td style="font-family:var(--fm);font-size:.82rem;color:${cmdEstAjust(c)?"var(--or)":"var(--ac)"}">${cmdEstAjust(c)?esc(cmdSigne(c.points)):(c.points||"-")}</td>
    <td style="color:var(--tx2);font-size:.82rem">${esc(c.mission_name)||"-"}</td>
    <td class="mono-dm">${fmtDate(c.date||c.created_at)}</td>
    <td class="ta-r">${cmdEditable?`<button class="icon-btn del" onclick="deleteCmdMission('${escJs(c.id)}')" title="Supprimer" aria-label="Supprimer">
      <i data-lucide="trash-2"></i></button>`:""}</td>
  </tr>`).join("");
}

async function deleteCmdMission(id){
  if(!canEdit("cmd")){toast("Accès insuffisant","error");return;}
  if(!await uiConfirm({title:"Supprimer le CMD",message:"Supprimer ce CMD de mission ?",okText:"Supprimer",danger:true}))return;
  if(supaOK)await supaDelete(T.cmdmissions,`id=eq.${id}`);
  state.cmdmissions=state.cmdmissions.filter(c=>c.id!=id);
  if(!supaOK)saveLS();renderCmd();renderRoster();toast("CMD supprimé","info");
}
