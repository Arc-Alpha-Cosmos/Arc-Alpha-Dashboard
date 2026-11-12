/* ARC ALPHA - Module monespace. */
function renderMonEspace(){
  const el=document.getElementById("monEspaceContent");
  if(!el)return;
  if(!session){el.innerHTML='<div class="empty"><p>Connecte-toi pour accéder à ton espace.</p></div>';return;}

  const me=state.members.find(m=>m.id==session.memberId);
  const roleLabels={admin:"Administrateur",brs:"BRS",amiraute:"Amirauté"};
  const roleTxt=roleLabels[session.role]||"Membre ARC Alpha";

  const roleAvColor = roleAvatarColor(session.role, me?.grade);
  let html=`<div class="me-hero panel" style="margin-bottom:1.2rem">
    <div class="me-hero-av" style="--gc:${roleAvColor}">${esc((session.user[0]||'?').toUpperCase())}</div>
    <div>
      <div class="me-hero-name">${esc(session.user)}</div>
      <div class="me-hero-sub">${me?esc(me.matricule)+' · '+(me.grade||'-'):roleTxt}${me&&me.regiment_rct?` · <span style="color:${REGIMENT_COLORS[me.regiment_rct]||'var(--ac)'}">${esc(me.regiment_rct)}</span>`:''}</div>
    </div>
  </div>`;

  if(!me){
    html+=`<div class="panel"><div class="panel-body"><p style="color:var(--tx2);line-height:1.7">Ton compte (<strong>${roleTxt}</strong>) n'est pas lié à une fiche membre de l'effectif. Les statistiques personnelles (rapport, progression, blâmes) s'affichent uniquement pour les comptes liés à un membre.</p></div></div>`;
    el.innerHTML=html;
    return;
  }

  html+='<div class="me-grid">';

  const wk=getWeekKey(0);
  const meSt=reportWeekStatus(me,wk);
  const exempt=meSt.gradeEx||!!meSt.manEx;
  const absExempt=!exempt&&!!meSt.absEx;
  const done=meSt.done;
  const esc_=reportEscalation(me);
  let repInner;
  if(!meSt.listed){
    repInner=`<div class="me-badge" style="--c:var(--dm)">Hors effectif</div><p class="me-note">Le rapport hebdomadaire ne concerne que les membres de l'effectif.</p>`;
  }else if(exempt){
    const manEx=meSt.manEx;
    repInner=`<div class="me-badge" style="--c:var(--ac)">Dispensé</div><p class="me-note">${manEx
      ?`Un officier t'a dispensé du rapport hebdomadaire${manEx.reason?` : ${esc(manEx.reason)}`:""}.`
      :"À partir du grade de Capitaine, tu es dispensé du rapport hebdomadaire."}</p>`;
  }else if(absExempt){
    repInner=`<div class="me-badge" style="--c:var(--ac)">Dispensé - absence</div><p class="me-note">Ton absence couvre ${meSt.absEx.days||"au moins la moitié des"} jours de cette semaine : aucun rapport n'est attendu et aucun blâme ne sera appliqué.</p>`;
  }else if(esc_){
    const stageLbl=esc_.blamed?"Blâme appliqué":"Avertissement";
    const col=esc_.blamed?"var(--rd)":esc_.hoursLeft<=12?"var(--or)":"var(--ye)";
    const sub=esc_.blamed
      ? "Le délai de 48h est dépassé : un blâme automatique a été appliqué pour la semaine passée."
      : `Ton rapport de la semaine passée n'est pas validé. Il te reste <strong>${esc_.hoursLeft}h</strong> pour le rendre, sans quoi un blâme automatique sera appliqué.`;
    repInner=`<div class="me-badge" style="--c:${col}">${stageLbl}</div><p class="me-note">${sub}</p>`;
    if(!done)repInner+=`<p class="me-note" style="margin-top:.5rem;color:var(--ye)">⚠️ Ton rapport de la semaine en cours n'est pas encore validé non plus.</p>`;
  }else if(done){
    repInner=`<div class="me-badge" style="--c:var(--gr)">✓ Rendu</div><p class="me-note">${!meSt.row&&meSt.credit?`Ton rapport de la semaine est validé par ${CREDIT_MINE[meSt.credit]||"ton activité"}.`:"Ton rapport de la semaine est validé."} Beau travail !</p>`;
  }else{
    repInner=`<div class="me-badge" style="--c:var(--rd)">Non rendu</div><p class="me-note">Ton rapport hebdomadaire n'est pas encore validé (lundi → dimanche 23h59).</p>`;
  }
  html+=`<div class="panel me-card"><div class="panel-head"><h3><span class="pk">//</span> Rapport de la semaine</h3></div><div class="panel-body">${repInner}</div></div>`;

  const elig=getEligibility(me);
  let progInner;
  if(!elig.progress){
    progInner=`<p class="me-note">Promotion manuelle à ce grade - pas de critères automatiques.</p>`;
  }else{
    const p=elig.progress;
    const bar=(label,cur,need,pct,unit)=>`
      <div class="me-prog">
        <div class="me-prog-top"><span>${label}</span><span class="me-prog-val">${cur}/${need}${unit}</span></div>
        <div class="me-prog-track"><div class="me-prog-fill" style="transform:scaleX(${(Math.max(0,Math.min(100,pct))/100).toFixed(4)});background:${pct>=100?'var(--gr)':'var(--ac)'}"></div></div>
      </div>`;
    progInner=`<div class="me-next">Prochain grade : <strong style="color:${GRADE_COLORS[p.nextGrade]||'var(--ac)'}">${p.nextGrade||'-'}</strong></div>`;
    progInner+=bar("Ancienneté",p.days,p.needDays,p.daysPct," j");
    if(p.hasCmd)progInner+=bar("CMD de mission",p.cmd,p.needCmd,p.cmdPct,"");
    progInner+=`<div class="me-elig ${elig.eligible?'ok':'no'}">${elig.eligible?'✅ Éligible à la promotion':'⏳ '+esc(elig.reason)}</div>`;
  }
  html+=`<div class="panel me-card"><div class="panel-head"><h3><span class="pk">//</span> Progression</h3></div><div class="panel-body">${progInner}</div></div>`;

  const myTasks=state.tasks.filter(t=>t.active&&((t.assignee_hash&&t.assignee_hash===session.userHash)||(t.assignee_member_id&&session.memberId&&t.assignee_member_id==session.memberId)));
  let tasksInner;
  if(!myTasks.length)tasksInner=`<p class="me-note">Aucune tâche assignée pour le moment.</p>`;
  else tasksInner=myTasks.map(t=>`<div class="me-item"><div class="me-item-dot" style="background:var(--ac)"></div><div><div class="me-item-t">${esc(t.title)}</div>${t.description?`<div class="me-item-d">${esc(t.description)}</div>`:''}</div></div>`).join("");
  html+=`<div class="panel me-card"><div class="panel-head"><h3><span class="pk">//</span> Mes tâches</h3></div><div class="panel-body">${tasksInner}</div></div>`;

  const myBlames=state.blames.filter(b=>b.member_id==me.id&&!b.resolved);
  let blInner;
  if(!myBlames.length)blInner=`<p class="me-note" style="color:var(--gr)">Aucun blâme actif. Continue comme ça !</p>`;
  else blInner=myBlames.map(b=>`<div class="me-item"><div class="me-item-dot" style="background:var(--rd)"></div><div><div class="me-item-t">${esc(blameLevelLabel(b.level||1))}</div><div class="me-item-d">${esc(b.reason)||"Sans motif"}</div></div></div>`).join("");
  html+=`<div class="panel me-card"><div class="panel-head"><h3><span class="pk">//</span> Mes blâmes actifs</h3></div><div class="panel-body">${blInner}</div></div>`;

  const myMedals=getMemberMedals(me);
  let medInner;
  if(!myMedals.length)medInner=`<p class="me-note">Aucune médaille pour le moment. Distingue-toi en mission ! 🎖️</p>`;
  else medInner='<div class="medal-grid">'+myMedals.map(id=>{
    const md=MEDAL_BY_ID[id];if(!md)return"";
    return`<div class="medal-card owned" style="--mc:${md.color}" title="${esc(md.desc)}">
      <div class="medal-ic">${md.icon}</div>
      <div class="medal-meta"><div class="medal-nm">${esc(md.name)}</div><div class="medal-scope">${esc(md.scope)}</div></div>
    </div>`;
  }).join("")+'</div>';
  html+=`<div class="panel me-card"><div class="panel-head"><h3><span class="pk">//</span> Mes médailles</h3></div><div class="panel-body">${medInner}</div></div>`;

  html+='</div>';
  el.innerHTML=html;
}
