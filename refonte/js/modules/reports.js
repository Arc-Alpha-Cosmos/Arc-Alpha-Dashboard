/* ARC ALPHA - Module reports. */
function prevWeek(){reportWeekOffset--;renderReports();}
function nextWeek(){if(reportWeekOffset<0){reportWeekOffset++;renderReports();}}

async function resetWeek(){
  if(!canEdit("reports")){toast("Accès insuffisant","error");return;}
  if(!await uiConfirm({title:"Réinitialiser les rapports",message:"Réinitialiser tous les rapports de cette semaine ?",okText:"Réinitialiser",danger:true}))return;
  const wk=getWeekKey(reportWeekOffset);
  for(const r of state.reports.filter(r=>r.week_key===wk))
    if(supaOK)await supaDelete(T.reports,`id=eq.${r.id}`);
  state.reports=state.reports.filter(r=>r.week_key!==wk);if(!supaOK)saveLS();
  renderReports();toast("Rapports réinitialisés","info");
}

async function toggleReport(memberId,weekKey){
  if(!canEdit("reports")){toast("Accès insuffisant","error");return;}
  const existing=state.reports.find(r=>r.member_id==memberId&&r.week_key===weekKey);
  if(existing){
    if(supaOK)await supaDelete(T.reports,`id=eq.${existing.id}`);
    state.reports=state.reports.filter(r=>!(r.member_id==memberId&&r.week_key===weekKey));
    if(!supaOK)saveLS();toast("Rapport décoché","info");
  }else{
    const m=state.members.find(x=>x.id==memberId);
    const obj={member_id:memberId,member_name:m?`${m.matricule} ${m.nom||""}`.trim():"?",week_key:weekKey};
    if(supaOK){const r=await supaPost(T.reports,obj);if(r&&r.length>0)state.reports.push(r[0]);}
    else{obj.id=Date.now().toString();state.reports.push(obj);saveLS();}
    toast("Rapport validé ✓","success");
    await logActivity(`${session?.user} a validé le rapport de ${obj.member_name} (sem. ${weekKey})`);
  }
  renderReports();
}

async function autoReportForActivity(memberId,dateStr){
  if(memberId===null||memberId===undefined||memberId==="")return null;
  const m=memberById(memberId);
  if(!m)return null;
  if((m.categorie||"effectif")!=="effectif")return null;
  const wk=weekKeyOf(dateStr);
  if(wk<REPORT_RULES_SINCE||frozenWeek(wk))return null;
  if(!state.reports)state.reports=[];
  const st=reportWeekStatus(m,wk);
  if(!st.due||st.row)return null;
  const obj={member_id:m.id,member_name:`${m.matricule||"?"} ${m.nom||""}`.trim(),week_key:wk};
  if(supaOK){
    const r=await supaPost(T.reports,obj);
    if(!r||!r.length)return null;
    state.reports.push(r[0]);
  }else{
    obj.id=Date.now().toString();state.reports.push(obj);saveLS();
  }
  return{name:obj.member_name,week:wk};
}

async function writeReportExempt(mutate){
  let base=state.reportExempt||{};
  if(supaOK){
    const rows=await supaGet(T.config,"key=eq.reportExempt");
    if(rows&&rows.length){
      try{const p=JSON.parse(rows[0].value);if(p&&typeof p==="object")base=p;}catch(e){}
    }
  }
  const next={...base};
  mutate(next);
  state.reportExempt=next;
  if(supaOK)await setConfig("reportExempt",next);
  else saveLS();
  renderReports();renderOverview();
  if(typeof checkMyReportStatus==="function")checkMyReportStatus();
}

async function exemptReport(memberId){
  if(!canExemptReport()){toast("Réservé aux MAJ et plus","error");return;}
  if(reportWeekOffset!==0){toast("Une dispense se pose sur la semaine courante","info");return;}
  const m=memberById(memberId);
  if(!m)return;
  if(REPORT_EXEMPT.includes(m.grade)){toast("Ce grade est déjà dispensé de rapport","info");return;}
  const wk=getWeekKey(0);
  if(manualReportExemptFor(m.id,wk)){toast("Déjà dispensé cette semaine","info");return;}
  const who=`${m.matricule||"?"} ${m.nom||""}`.trim();
  const reason=await uiPrompt({
    kicker:"// DISPENSE DE RAPPORT",
    title:"Motif requis",
    message:`${who} ne rendra plus de rapport hebdomadaire et ne recevra plus de blâme automatique pour rapport manquant.\n\nLa dispense court à partir de la semaine du ${fmtDate(wk)} et reste active tant qu'un officier ne la retire pas. Les semaines passées ne sont pas touchées.`,
    placeholder:"ex : indisponibilité longue durée, rôle particulier…",
    okText:"Dispenser"});
  if(reason===null)return;
  const motif=String(reason).trim();
  if(motif.length<3){toast("Motif trop court","error");return;}
  const entry={from:wk,until:null,reason:motif,by:session?.user||"?",
    by_id:session?.userId??null,at:new Date().toISOString()};
  const key=String(m.id);
  await writeReportExempt(o=>{const list=normPeriods(o[key]);list.push(entry);o[key]=list;});
  toast(`${who} dispensé de rapport`,"success");
  await logActivity(`${session?.user} a dispensé ${who} de rapport hebdomadaire à partir de la semaine du ${fmtDate(wk)} - ${motif}`);
}

async function liftReportExempt(memberId){
  if(!canExemptReport()){toast("Réservé aux MAJ et plus","error");return;}
  if(reportWeekOffset!==0){toast("Une dispense se retire sur la semaine courante","info");return;}
  const m=memberById(memberId);
  const wk=getWeekKey(0);
  const ex=manualReportExemptFor(memberId,wk);
  if(!m||!ex)return;
  const who=`${m.matricule||"?"} ${m.nom||""}`.trim();
  const ok=await uiConfirm({
    kicker:"// DISPENSE DE RAPPORT",
    title:"Rétablir le rapport",
    message:`${who} devra de nouveau rendre un rapport à partir de la semaine du ${fmtDate(wk)}. Les semaines déjà couvertes par la dispense la gardent.\n\nDispense posée par ${ex.by||"?"} le ${fmtDate(ex.at)}${ex.reason?` : ${ex.reason}`:""}`,
    okText:"Rétablir"});
  if(!ok)return;
  const key=String(memberId),now=new Date().toISOString(),by=session?.user||"?";
  await writeReportExempt(o=>{
    const list=normPeriods(o[key]);
    let idx=-1;
    list.forEach((p,i)=>{if(p.from<=wk&&(!p.until||wk<p.until))idx=i;});
    if(idx<0)return;
    if(list[idx].from>=wk)list.splice(idx,1);
    else{list[idx].until=wk;list[idx].lifted_by=by;list[idx].lifted_at=now;}
    if(list.length)o[key]=list;else delete o[key];
  });
  toast(`${who} de nouveau soumis au rapport`,"info");
  await logActivity(`${session?.user} a retiré la dispense de rapport de ${who} à partir de la semaine du ${fmtDate(wk)}`);
}

function renderReports(){
  applyAutoReportUI();
  const wk=getWeekKey(reportWeekOffset);
  const lbl=document.getElementById("repWeekLabel");
  const frozen=!!frozenWeek(wk);
  if(lbl)lbl.textContent=`Semaine du ${fmtDate(wk)} au ${fmtDate(addDaysYmd(wk,6))}${reportWeekOffset===0?" (courante)":""}${frozen?" · historique figé":""}`;
  const wkStatus=new Map();
  sortMembers(state.members).forEach(m=>{const s=reportWeekStatus(m,wk);if(s.listed)wkStatus.set(String(m.id),s);});
  const eligible=sortMembers(state.members).filter(m=>wkStatus.has(String(m.id)));
  const st=m=>wkStatus.get(String(m.id));
  const exempt=eligible.filter(m=>st(m).off);
  const required=eligible.filter(m=>!st(m).off);
  const canEx=canExemptReport()&&reportWeekOffset===0;
  const done=required.filter(m=>st(m).done).length;
  const ge=id=>document.getElementById(id);
  const attendus=required.length, restants=attendus-done;
  const taux=attendus>0?Math.round(done/attendus*100):null;
  if(ge("repDone"))ge("repDone").textContent=done;
  if(ge("repPending"))ge("repPending").textContent=restants;
  if(ge("repExempt"))ge("repExempt").textContent=exempt.length;
  if(ge("repRate"))ge("repRate").textContent=taux===null?"-":taux+"%";
  statTone("repDone",attendus&&done===attendus?"ok":"ac",attendus?"sur "+attendus+" attendus":"");
  statTone("repPending",restants===0?"ok":"warn",restants===0?"tout est rendu":"");
  statTone("repExempt","mute",exempt.length?"non concernés":"");
  statTone("repRate",taux===null?"mute":(taux>=90?"ok":(taux>=60?"warn":"crit")),
           attendus?"sur "+attendus+" membres":"");
  const tbody=document.getElementById("repBody");if(!tbody)return;
  if(!state.members.length){tbody.innerHTML='<tr><td colspan="5"><div class="empty"><p>Aucun membre</p></div></td></tr>';return;}
  tbody.innerHTML=[...required,...exempt].map(m=>{
    const s=st(m);
    const manEx=s.manEx,absEx=s.absEx,isEx=s.off,hasDone=s.done;
    const exLabel=s.gradeEx?"Dispensé":(manEx?"Dispensé (manuel)":"Absent");
    const exColor=s.gradeEx?"var(--dm)":(manEx?"var(--ac)":"var(--ye)");
    const exTitle=manEx
      ?`Dispensé par ${manEx.by||"?"} le ${fmtDate(manEx.at)}${manEx.reason?" : "+manEx.reason:""}`
      :(absEx?`Absence du ${fmtDate(absEx.start_date)} au ${fmtDate(absEx.end_date)}${absEx.days?`, ${absEx.days} jour${absEx.days>1?"s":""} sur cette semaine`:""}${absEx.reason?" : "+absEx.reason:""}`:"");
    const creditOnly=!isEx&&!s.row&&!!s.credit;
    const creditLbl=CREDIT_SHORT[s.credit]||"Validé (activité)";
    const hist=state.reports.filter(r=>r.member_id==m.id).length;
    return `<tr style="opacity:${s.gradeEx?".45":(isEx?".7":"1")}">
      <td><div style="display:flex;align-items:center;gap:.6rem">
        <span class="grade-avatar" style="--gc:${GRADE_COLORS[m.grade||'ARC']}">${(m.matricule||'?').replace(/[^A-Z0-9]/gi,'').slice(-2).toUpperCase()}</span>
        <span class="mat">${esc(m.matricule)||"-"}</span>
      </div></td>
      <td class="nm nm-link" tabindex="0" role="button" onkeydown="if(event.key==='Enter')this.click()" onclick="openMemberProfile('${escJs(m.id)}')" title="Voir la fiche complète">${esc(m.nom)||"-"}</td>
      <td><span class="grade-pill gp-${esc((m.grade||"arc").toLowerCase())}" style="color:${GRADE_COLORS[m.grade||"ARC"]}">${esc(m.grade||"ARC")}</span></td>
      <td><div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">${isEx?
        `<span style="font-family:var(--fm);font-size:.74rem;color:${exColor}"${exTitle?` title="${esc(exTitle)}"`:""}>${exLabel}</span>
         ${manEx&&canEx?`<button class="sm sbtn" onclick="liftReportExempt('${escJs(m.id)}')">Rétablir</button>`:""}`:
        creditOnly?`<span style="display:inline-flex;align-items:center;gap:.5rem;padding:.38rem .8rem;border:1px solid var(--gr);background:rgba(34,217,122,.12);color:var(--gr);font-family:var(--fm);font-size:.74rem" title="Compté automatiquement : ${CREDIT_LONG[s.credit]||"activité"} pendant cette semaine"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>${creditLbl}</span>`:
        `<button onclick="toggleReport('${escJs(m.id)}','${wk}')"
          style="display:inline-flex;align-items:center;gap:.5rem;padding:.38rem .8rem;border:1px solid ${hasDone?"var(--gr)":"var(--ln)"};
          background:${hasDone?"rgba(34,217,122,.12)":"transparent"};color:${hasDone?"var(--gr)":"var(--dm)"};
          font-family:var(--fm);font-size:.74rem;cursor:pointer;transition:all .2s">
          ${hasDone?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>Validé':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>À valider'}
        </button>
        ${canEx?`<button class="sm sbtn" onclick="exemptReport('${escJs(m.id)}')" title="Dispenser durablement de rapport hebdomadaire">Dispenser</button>`:""}`}</div></td>
      <td style="font-family:var(--fm);font-size:.74rem;color:var(--ac)">${hist}</td>
    </tr>`;
  }).join("");
}


function checkMyReportStatus(){
  try{rapBadge();}catch(e){}
  try{updateNavPulses();}catch(e){}
  const badge=document.getElementById("reportPulseBadge");
  if(!badge)return;
  if(!session){badge.style.display="none";return;}
  const myMember=state.members.find(m=>m.id==session.memberId);
  if(!myMember){badge.style.display="none";return;}
  const st=reportWeekStatus(myMember,getWeekKey(0));
  badge.style.display=(st.due&&!st.done)?"block":"none";
}

function canManageAutoReport(){
  if(!Auth.ok())return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  if(session.role==="brs")return false;
  return gradeLevel(getSessionGrade())>=5;
}
function weekEndDate(weekKey){
  const d=new Date(weekKey+"T00:00:00");
  d.setDate(d.getDate()+6);d.setHours(23,59,59,999);
  return d;
}
function weekClosed(weekKey){
  return (Date.now()-weekEndDate(weekKey).getTime())/3600000>=REPORT_BLAME_HOURS;
}
function absenceCoveringWeek(memberId, weekKey, graceDays, capToday){
  const list=state.absences||[];
  if(!list.length) return null;
  const start=weekKey;
  const d=new Date(weekKey+"T00:00:00");
  d.setDate(d.getDate()+6+(graceDays||0));
  let end=ymdLocal(d);
  if(capToday){const t=ymdLocal(new Date());if(t<end)end=t;}
  if(end<start) return null;
  for(let i=0;i<list.length;i++){
    const a=list[i];
    if(a.member_id!=memberId) continue;
    if(!a.start_date || !a.end_date) continue;
    if(a.start_date<=end && a.end_date>=start) return a;
  }
  return null;
}

let _reportFreezeRunning=false;
async function freezeReportWeeks(){
  if(!session||!supaOK||!canEdit("reports")||_reportFreezeRunning)return false;
  const firstRep=(state.reports||[]).reduce((m,r)=>r.week_key&&r.week_key<m?r.week_key:m,REPORT_RULES_SINCE);
  const todo=[];
  for(let off=-1;off>=-REPORT_FREEZE_WEEKS;off--){
    const wk=getWeekKey(off);
    if(wk<firstRep)break;
    if(!frozenWeek(wk)&&weekClosed(wk))todo.push(wk);
  }
  if(!todo.length||!(state.members||[]).length)return false;
  _reportFreezeRunning=true;
  try{
    const built={};
    todo.forEach(wk=>{
      const w={};
      state.members.forEach(m=>{
        const s=reportWeekStatus(m,wk);
        if(!s.listed)return;
        const e={s:s.gradeEx?"g":(s.manEx?"m":(s.absEx?"a":"r"))};
        if(s.gradeEx)e.g=m.grade||"";
        if(s.manEx){e.r=s.manEx.reason||"";e.by=s.manEx.by||"?";}
        if(s.absEx){e.a=[s.absEx.start_date,s.absEx.end_date,s.absEx.days||0];if(s.absEx.reason)e.r=s.absEx.reason;}
        if(s.credit)e.c=s.credit;
        w[String(m.id)]=e;
      });
      built[wk]=w;
    });
    const next=await configMerge("reportWeeks",state.reportWeeks,o=>{
      Object.keys(built).forEach(wk=>{if(!o[wk])o[wk]=built[wk];});
    });
    if(next===null)return false;
    state.reportWeeks=next;
    return true;
  }finally{ _reportFreezeRunning=false; }
}
async function runWeeklyReportJobs(){
  let froze=false;
  try{froze=await freezeReportWeeks();}catch(e){console.warn("rapports : figeage des semaines",e);}
  await processReportAutomation();
  if(froze){
    if(_activeTab==="reports")renderReports();
    else if(_activeTab==="overview")renderOverview();
  }
}

function reportEscalation(m){
  if(!state.autoReport)return null;
  if(!m)return null;
  const lastWk=getWeekKey(-1);
  if(state.autoReportSince && lastWk<state.autoReportSince)return null;
  const st=reportWeekStatus(m,lastWk);
  if(!st.due||st.done)return null;
  const end=weekEndDate(lastWk);
  const hoursLate=(Date.now()-end.getTime())/3600000;
  if(hoursLate<0)return null;
  const blamed=hoursLate>=REPORT_BLAME_HOURS;
  const hoursLeft=Math.max(0,Math.ceil(REPORT_BLAME_HOURS-hoursLate));
  return{blamed,hoursLate,hoursLeft,weekKey:lastWk};
}
let _reportAutoRunning=false;
async function processReportAutomation(){
  if(!state.autoReport)return;
  if(!session)return;
  if(!canManageAutoReport())return;
  if(_reportAutoRunning)return;
  _reportAutoRunning=true;
  try{
  if(!state.autoReportSince){
    state.autoReportSince=getWeekKey(0);
    if(supaOK)await setConfig("autoReportSince",state.autoReportSince);
  }
  let applied=0;
  for(let off=-1;off>=-6;off--){
    const wk=getWeekKey(off);
    if(wk<state.autoReportSince)break;
    if(!weekClosed(wk))continue;
    const dateLabel=fmtDate(wk);
    for(const m of state.members){
      const st=reportWeekStatus(m,wk);
      if(!st.due||st.done)continue;
      const marker=`${REPORT_AUTO_MARK} ${wk}]`;
      if(state.blames.some(b=>b.member_id==m.id&&(b.reason||"").includes(marker)))continue;
      const reason=`${marker} Absence de rapport hebdomadaire (semaine du ${dateLabel}) - blâme automatique (règlement 3.4)`;
      const obj={member_id:m.id,member_name:`${m.matricule} ${m.nom||""}`.trim(),
        level:nextBlameLevel(m.id),reason,resolved:false};
      if(supaOK){const r=await supaPost(T.blames,obj);if(r&&r.length>0)state.blames.unshift(r[0]);}
      else{obj.id=Date.now().toString()+Math.random().toString(36).slice(2,6);state.blames.unshift(obj);saveLS();}
      applied++;
      await logActivity(`Blâme automatique appliqué à ${obj.member_name} - absence de rapport (semaine du ${dateLabel})`);
    }
  }
  if(applied>0){
    renderBlames&&renderBlames();renderOverview&&renderOverview();
    toast(`${applied} blâme(s) automatique(s) appliqué(s) pour absence de rapport`,"info");
  }
  }finally{ _reportAutoRunning=false; }
}
async function toggleAutoReport(){
  if(!canManageAutoReport()){toast("Réservé aux VCMD+","error");return;}
  state.autoReport=!state.autoReport;
  if(supaOK)await setConfig("autoReport",state.autoReport);else saveLS();
  if(state.autoReport){
    state.autoReportSince=getWeekKey(0);
    if(supaOK)await setConfig("autoReportSince",state.autoReportSince);else saveLS();
  }
  applyAutoReportUI();
  const from=state.autoReport?` à partir de la semaine du ${fmtDate(state.autoReportSince)}`:"";
  toast(state.autoReport?`Automatisation des rapports activée${from}`:"Automatisation des rapports désactivée",state.autoReport?"success":"info");
  await logActivity(`Automatisation des rapports ${state.autoReport?"activée":"désactivée"}${from} par ${session.user}`);
  if(state.autoReport)await processReportAutomation();
  if(typeof renderReports==="function")renderReports();
}
function applyAutoReportUI(){
  const row=document.getElementById("autoReportRow");
  const tg=document.getElementById("autoReportToggle");
  const lbl=document.getElementById("autoReportLbl");
  if(row)row.style.display=canManageAutoReport()?"":"none";
  if(tg)tg.classList.toggle("on",!!state.autoReport);
  if(lbl)lbl.textContent=state.autoReport?"Automatisation activée":"Automatisation désactivée";
}

/* Pastilles de la barre laterale et de la barre basse, recalculees sans
   redessiner tout le menu. */
function updateNavPulses(){
  document.querySelectorAll(".side-item[data-tab]").forEach(b=>{
    const p=b.querySelector(".pulse");if(p)p.classList.toggle("show",tabPulse(b.dataset.tab));
    const c=b.querySelector(".cnt"),v=tabCount(b.dataset.tab);
    if(c){c.hidden=!v;c.textContent=v?v.n:"";c.classList.toggle("hot",!!(v&&v.hot));}
  });
}
