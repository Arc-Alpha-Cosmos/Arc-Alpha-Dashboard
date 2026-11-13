/* ARC ALPHA - Module blames. */
const BLAME_MAX_LEVEL=3;
function activeBlameCount(memberId){
  if(memberId===null||memberId===undefined||memberId==="")return 0;
  return state.blames.filter(b=>!b.resolved&&String(b.member_id)===String(memberId)).length;
}
function nextBlameLevel(memberId){
  return Math.min(BLAME_MAX_LEVEL,activeBlameCount(memberId)+1);
}
function blameLevelLabel(lvl){
  return lvl===1?"1er blâme":lvl===2?"2ème blâme":"3ème blâme - Exclusion";
}
function updateBlameLevelPreview(){
  const sel=document.getElementById("bMember"),box=document.getElementById("bLevelTxt");
  if(!sel||!box)return;
  const mid=sel.value;
  if(!mid){
    box.textContent="Sélectionne un membre";
    box.style.color="var(--dm)";
    return;
  }
  const already=activeBlameCount(mid);
  const lvl=nextBlameLevel(mid);
  box.textContent=blameLevelLabel(lvl)+(already?` · ${already} blâme${already>1?"s":""} en cours`:"");
  box.style.color=lvl===1?"var(--or)":"var(--rd)";
  if(already>=BLAME_MAX_LEVEL)box.textContent=`Déjà ${already} blâmes actifs - exclusion déjà atteinte`;
}

function openBlameModal(){
  if(!canEdit("blames")){toast("Accès insuffisant","error");return;}
  const s=document.getElementById("bMember");
  s.innerHTML=`<option value="">Sélectionner…</option>`+
    sortMembers(activeMembers()).map(m=>`<option value="${m.id}">${esc(m.matricule)} - ${esc(m.nom)||"?"}</option>`).join("");
  const r=document.getElementById("bReason");if(r)r.value="";
  updateBlameLevelPreview();
  document.getElementById("blameModal").classList.add("show");
}

function renderBlames(){
  const el=document.getElementById("blamesList");if(!el)return;
  const active=state.blames.filter(b=>!b.resolved),resolved=state.blames.filter(b=>b.resolved);

  /* Chiffres clés : aucun blâme actif est une bonne nouvelle, elle se voit. */
  const touches=new Set(state.blames.map(b=>memberKey(b.member_id,b.member_name)));
  const gb=id=>document.getElementById(id);
  if(gb("blStatAct"))gb("blStatAct").textContent=active.length;
  if(gb("blStatRes"))gb("blStatRes").textContent=resolved.length;
  if(gb("blStatTot"))gb("blStatTot").textContent=state.blames.length;
  if(gb("blStatMem"))gb("blStatMem").textContent=state.blames.length?touches.size:0;
  statTone("blStatAct",active.length?"crit":"ok",active.length?"à traiter":"aucun en cours");
  statTone("blStatRes",resolved.length?"ok":"mute",resolved.length?"classés":"");
  statTone("blStatTot","mute",state.blames.length?"depuis le début":"");
  const effB=state.members.filter(m=>(m.categorie||"effectif")==="effectif").length;
  statTone("blStatMem",touches.size?"warn":"ok",
    state.blames.length?("sur "+effB+" membres"):"personne n'est concerné");

  if(!state.blames.length){el.innerHTML='<div class="empty"><p>Aucun blâme</p></div>';return;}
  const lc={1:"var(--or)",2:"var(--rd)",3:"var(--rd)"};
  const canManageBlames=canEdit("blames");
  const rg=(list,title)=>list.length===0?"":
    `<div class="sec-head" style="margin-top:1rem"><h2>${title}</h2><span class="line"></span></div>`+
    list.map(b=>`<div class="ann" style="border-left-color:${lc[b.level]||"var(--rd)"}">
      <div class="ann-ico" style="color:${lc[b.level]||"var(--rd)"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg></div>
      <div class="ann-c">
        <div class="ann-t">${esc(memberLabel(b.member_id,b.member_name))} - ${esc(blameLevelLabel(b.level||1))}</div>
        <div class="ann-d">${blameReasonHtml(b)}</div>
        ${b.resolved&&b.resolve_reason?`<div class="ann-d" style="color:var(--gr);font-size:.76rem;margin-top:.25rem">↳ Levé : ${esc(b.resolve_reason)}${b.resolved_by?` - par ${esc(userLabel(b.resolved_by_id,b.resolved_by))}`:""}${b.resolved_at?` le ${fmtDate(b.resolved_at)}`:""}</div>`:""}
        <div class="ann-meta">${fmtDate(b.created_at)}${b.resolved?" · Levé":""}
          ${canManageBlames&&!b.resolved?`<button class="sbtn green" style="margin-left:.8rem;padding:.2rem .5rem;font-size:.74rem" onclick="resolveBlame('${escJs(b.id)}')">Résoudre</button>`:""}
          ${canManageBlames?`<button class="sbtn danger" style="margin-left:.5rem;padding:.2rem .5rem;font-size:.74rem" onclick="deleteBlame('${escJs(b.id)}')">Supprimer</button>`:""}
        </div>
      </div>
    </div>`).join("");
  el.innerHTML=rg(active,"Blâmes actifs")+rg(resolved,"Blâmes levés");
}

async function saveBlame(){
  if(!canEdit("blames")){toast("Accès insuffisant","error");return;}
  const mid=document.getElementById("bMember").value;
  const reason=document.getElementById("bReason").value.trim();
  if(!mid)return fieldError("bMember","Choisis le membre concerné.");
  if(reason.length<3)return fieldError("bReason","Indique le motif du blâme (3 caractères minimum).");
  const m=state.members.find(x=>x.id==mid);
  const lvl=nextBlameLevel(mid);
  const already=activeBlameCount(mid);
  const who=m?`${m.matricule} ${m.nom||""}`.trim():"?";
  const ok=await uiConfirm({
    kicker:"// DISCIPLINE",
    title:blameLevelLabel(lvl),
    message:already>=BLAME_MAX_LEVEL
      ? `${who} a déjà ${already} blâmes actifs.\n\nAjouter un blâme supplémentaire au niveau ${BLAME_MAX_LEVEL} ?`
      : `Appliquer le ${blameLevelLabel(lvl).toLowerCase()} à ${who} ?`,
    okText:"Appliquer",cancelText:"Annuler",danger:lvl>=2});
  if(!ok)return;
  const obj={member_id:mid,member_name:who,level:lvl,reason,resolved:false};
  if(supaOK){const r=await supaPost(T.blames,obj);if(r&&r.length>0)state.blames.unshift(r[0]);else{toast("Enregistrement refusé par la base. Le blâme n'a pas été appliqué.","error");return;}}
  else{obj.id=Date.now().toString();state.blames.unshift(obj);saveLS();}
  closeModal("blameModal");renderBlames();renderOverview();
  toast("Blâme enregistré","info");
  await logActivity(`${session?.user} a donné un ${blameLevelLabel(lvl).toLowerCase()} à ${obj.member_name}`);
}

async function resolveBlame(id){
  if(!canEdit("blames")){toast("Accès insuffisant","error");return;}
  const b=state.blames.find(x=>x.id==id);
  if(!b)return;
  const who=memberLabel(b.member_id,b.member_name);
  const restant=Math.max(0,activeBlameCount(b.member_id)-1);
  const reason=await uiPrompt({
    kicker:"// LEVÉE DE BLÂME",
    title:"Justificatif requis",
    message:`Pourquoi lever ce blâme de ${who} ?\n\nAprès la levée, il lui restera ${restant} blâme${restant>1?"s":""} actif${restant>1?"s":""} : son prochain blâme sera donc un ${blameLevelLabel(restant+1).toLowerCase()}.`,
    placeholder:"ex : bonne conduite, délai de purge écoulé…",
    okText:"Lever le blâme"});
  if(reason===null)return;
  const motif=String(reason).trim();
  if(motif.length<3){toast("Justificatif trop court","error");return;}

  const patch={resolved:true,resolve_reason:motif,
    resolved_by:session?.user||"?",resolved_by_id:session?.userId??null,
    resolved_at:new Date().toISOString()};
  if(supaOK){
    const r=await supaWriteOptional(T.blames,`id=eq.${id}`,patch,
      ["resolve_reason","resolved_by","resolved_by_id","resolved_at"]);
    if(r===null){toast("Erreur réseau - réessaie","error");return;}
  }
  Object.assign(b,patch);
  if(!supaOK)saveLS();
  renderBlames();renderOverview();refreshMemberViews();
  toast("Blâme levé","success");
  await logActivity(`${session?.user} a levé un blâme de ${who} - ${motif}`);
}

async function deleteBlame(id){
  if(!canEdit("blames")){toast("Accès insuffisant","error");return;}
  if(!await uiConfirm({title:"Supprimer le blâme",message:"Supprimer ce blâme ?",okText:"Supprimer",danger:true}))return;
  if(supaOK)await supaDelete(T.blames,`id=eq.${id}`);
  state.blames=state.blames.filter(b=>b.id!=id);if(!supaOK)saveLS();
  renderBlames();renderOverview();toast("Blâme supprimé","info");
}

/* Le marqueur [AUTO-RAPPORT semaine] sert au dedoublonnage : il reste dans la
   donnee, mais a l'ecran il devient une pastille « Automatique ». */
function blameReasonHtml(b){
  const r=String((b&&b.reason)||"");
  const m=r.match(/^\[AUTO-RAPPORT [^\]]*\]\s*/);
  if(!m)return esc(r)||"Aucun motif";
  return `<span class="badge warn" style="margin-right:var(--sp3)">Automatique</span>${esc(r.slice(m[0].length))}`;
}
