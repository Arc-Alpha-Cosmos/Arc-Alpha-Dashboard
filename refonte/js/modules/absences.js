/* ARC ALPHA - Module absences. */
let _absReconcileRunning=false,_lastReconcileDay=null,_lastWeeklyJobsHour=Math.floor(Date.now()/3600000);
async function reconcileAbsenceStatus(){
  const today=new Date().toISOString().slice(0,10);
  const byMember=new Map();
  (state.absences||[]).forEach(a=>{
    if(!a.start_date||!a.end_date)return;
    if(a.member_id===null||a.member_id===undefined||a.member_id==="")return;
    const k=String(a.member_id);
    const e=byMember.get(k)||{active:false,any:false};
    e.any=true;
    if(a.start_date<=today&&today<=a.end_date)e.active=true;
    byMember.set(k,e);
  });
  const pending=[];
  (state.members||[]).forEach(m=>{
    if((m.categorie||"effectif")!=="effectif")return;
    if(m.status==="reserve")return;
    const e=byMember.get(String(m.id));
    const active=!!(e&&e.active);
    let target=null;
    if(active&&m.status!=="absent")target="absent";
    else if(!active&&m.status==="absent"&&e&&e.any)target="present";
    if(target){m.status=target;pending.push([m,target]);}
  });
  if(!pending.length)return false;
  if(supaOK){
    if((canEdit("roster")||canEdit("absences"))&&!_absReconcileRunning){
      _absReconcileRunning=true;
      try{
        for(const [m,st] of pending)
          await supaPatch(T.members,`id=eq.${encodeURIComponent(m.id)}`,{status:st});
      }catch(e){console.warn("reconcile absences",e);}
      finally{_absReconcileRunning=false;}
    }
  }else saveLS();
  return true;
}

function openAbsModal(){
  if(!canEdit("absences")){toast("Accès insuffisant","error");return;}
  const sel=document.getElementById("absMember");
  sel.innerHTML=`<option value="">Sélectionner…</option>`+
    sortMembers(activeMembers()).map(m=>`<option value="${m.id}">${esc(m.matricule)} - ${esc(m.nom)||"?"}</option>`).join("");
  const today=new Date().toISOString().slice(0,10);
  document.getElementById("absStart").value=today;document.getElementById("absEnd").value=today;
  document.getElementById("absModal").classList.add("show");
}

async function saveAbsence(){
  if(!canEdit("absences")){toast("Accès insuffisant","error");return;}
  const mid=document.getElementById("absMember").value;
  const start=document.getElementById("absStart").value,end=document.getElementById("absEnd").value;
  const reason=document.getElementById("absReason").value.trim();
  if(!mid)return fieldError("absMember","Choisis le membre concerné.");
  if(!start)return fieldError("absStart","Indique la date de début.");
  if(!end)return fieldError("absEnd","Indique la date de fin.");
  if(end<start)return fieldError("absEnd","La fin doit être après le début.");
  const m=state.members.find(x=>x.id==mid);
  const diff=Math.round((new Date(end)-new Date(start))/(1000*60*60*24))+1;
  const obj={member_id:mid,member_name:m?`${m.matricule} ${m.nom||""}`.trim():"?",start_date:start,end_date:end,reason,duration_days:diff};
  if(supaOK){const r=await supaPost(T.absences,obj);if(r&&r.length>0)state.absences.unshift(r[0]);else{toast("Enregistrement refusé par la base. L'absence n'a pas été ajoutée.","error");return;}}
  else{obj.id=Date.now().toString();state.absences.unshift(obj);saveLS();}
  await reconcileAbsenceStatus();
  closeModal("absModal");renderAbsences();renderOverview();renderRoster();
  toast(`Absence de ${obj.member_name} enregistrée`,"success");
  await logActivity(`${session?.user} a déclaré une absence de ${obj.member_name} du ${fmtDate(start)} au ${fmtDate(end)}`);
}

function renderAbsences(){
  renderAbsCalendar();
  const today=new Date().toISOString().slice(0,10);
  const active=state.absences.filter(a=>a.start_date<=today&&today<=a.end_date);
  const ge=id=>document.getElementById(id);
  const absEditable=canEdit("absences");
  if(ge("absTotalAct"))ge("absTotalAct").textContent=active.length;
  if(ge("absTotalHist"))ge("absTotalHist").textContent=state.absences.length;
  const effTot=state.members.filter(m=>(m.categorie||"effectif")==="effectif").length;
  statTone("absTotalAct",active.length?"warn":"ok",
           active.length?("sur "+effTot+" membres"):"personne n'est absent");
  statTone("absTotalHist","ac",state.absences.length?"depuis le début":"");
  const cnt=new Map();
  state.absences.forEach(a=>{
    const k=memberKey(a.member_id,a.member_name);
    const cur=cnt.get(k)||{n:0,id:a.member_id,stored:a.member_name};
    cur.n++;cnt.set(k,cur);
  });
  const most=[...cnt.values()].sort((x,y)=>y.n-x.n)[0];
  if(ge("absMostAbs"))ge("absMostAbs").textContent=most?memberLabel(most.id,most.stored).split(" ")[0]:"-";
  if(ge("absCurrent"))ge("absCurrent").textContent=active.length?active.map(a=>memberLabel(a.member_id,a.member_name).split(" ")[0]).join(", "):"Personne";
  statTone("absMostAbs","mute",most?(most.n+(most.n>1?" absences":" absence")):"");
  statTone("absCurrent",active.length?"warn":"ok",
           active.length>1?(active.length+" personnes"):"");
  const ael=ge("absActiveList");
  if(ael){
    if(!active.length){ael.innerHTML='<div class="empty"><p>Aucune absence en cours</p></div>';}
    else ael.innerHTML=active.map(a=>{
      const dl=Math.round((new Date(a.end_date)-new Date())/(1000*60*60*24))+1;
      return `<div class="ann" style="border-left-color:var(--or)">
        <div class="c-or ann-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        <div class="ann-c"><div class="ann-t">${esc(memberLabel(a.member_id,a.member_name))}</div><div class="ann-d">${esc(a.reason)||"-"}</div>
          <div class="ann-meta">Du <strong>${fmtDate(a.start_date)}</strong> au <strong>${fmtDate(a.end_date)}</strong> - <span class="c-or">${dl} j restant(s)</span>
          ${absEditable?`<button class="sbtn danger" style="margin-left:.8rem;padding:.2rem .5rem;font-size:.62rem" onclick="deleteAbsence('${escJs(a.id)}')">Supprimer</button>`:""}</div>
        </div></div>`;
    }).join("");
  }
  const tbody=ge("absHistBody");if(!tbody)return;
  if(!state.absences.length){tbody.innerHTML='<tr><td colspan="6"><div class="empty"><p>Aucune absence</p></div></td></tr>';return;}
  tbody.innerHTML=state.absences.map(a=>`<tr>
    <td class="nm">${esc(memberLabel(a.member_id,a.member_name))}</td>
    <td style="font-family:var(--fm);font-size:.72rem">${fmtDate(a.start_date)}</td>
    <td style="font-family:var(--fm);font-size:.72rem">${fmtDate(a.end_date)}</td>
    <td style="color:var(--tx2);font-size:.82rem">${esc(a.reason)||"-"}</td>
    <td style="font-family:var(--fm);font-size:.72rem;color:var(--ac)">${esc(a.duration_days||"?")} j</td>
    <td class="ta-r">${absEditable?`<button class="icon-btn del" onclick="deleteAbsence('${escJs(a.id)}')" title="Supprimer" aria-label="Supprimer">
      <i data-lucide="trash-2"></i></button>`:""}</td>
  </tr>`).join("");
}

async function deleteAbsence(id){
  if(!canEdit("absences")){toast("Accès insuffisant","error");return;}
  if(!await uiConfirm({title:"Supprimer l'absence",message:"Supprimer cette absence ?",okText:"Supprimer",danger:true}))return;
  if(supaOK)await supaDelete(T.absences,`id=eq.${id}`);
  state.absences=state.absences.filter(a=>a.id!=id);if(!supaOK)saveLS();
  await reconcileAbsenceStatus();
  renderAbsences();renderRoster();renderOverview();toast("Absence supprimée","info");
}


let _absCalMonth=new Date().getMonth(),_absCalYear=new Date().getFullYear(),_absCalSelDay=null;

function absCalPrev(){
  _absCalMonth--;_absCalSelDay=null;
  if(_absCalMonth<0){_absCalMonth=11;_absCalYear--;}
  renderAbsCalendar();
}
function absCalNext(){
  _absCalMonth++;_absCalSelDay=null;
  if(_absCalMonth>11){_absCalMonth=0;_absCalYear++;}
  renderAbsCalendar();
}
function absCalSelectDay(day){
  _absCalSelDay=(_absCalSelDay===day)?null:day;
  renderAbsCalendar();
}

function renderAbsCalendar(){
  const el=document.getElementById("absCalendar");
  const lbl=document.getElementById("absCalLabel");
  if(!el)return;
  const monthNames=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  if(lbl)lbl.textContent=monthNames[_absCalMonth]+" "+_absCalYear;

  const firstDay=new Date(_absCalYear,_absCalMonth,1);
  const lastDay=new Date(_absCalYear,_absCalMonth+1,0);
  const daysInMonth=lastDay.getDate();
  let startWeekday=firstDay.getDay();
  startWeekday=startWeekday===0?6:startWeekday-1;

  const dayMap={};
  state.absences.forEach(a=>{
    if(!a.start_date||!a.end_date)return;
    const s=new Date(a.start_date),e=new Date(a.end_date);
    for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){
      if(d.getMonth()===_absCalMonth&&d.getFullYear()===_absCalYear){
        const key=d.getDate();
        if(!dayMap[key])dayMap[key]=[];
        dayMap[key].push(memberLabel(a.member_id,a.member_name));
      }
    }
  });

  const today=new Date();
  const isCurrentMonth=today.getMonth()===_absCalMonth&&today.getFullYear()===_absCalYear;
  const todayDate=today.getDate();

  let html='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:.3rem;margin-bottom:.5rem">';
  ["L","M","M","J","V","S","D"].forEach(d=>{
    html+=`<div style="text-align:center;font-family:var(--fm);font-size:.62rem;color:var(--dm);padding:.3rem 0">${d}</div>`;
  });
  html+="</div>";
  html+='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:.3rem">';
  for(let i=0;i<startWeekday;i++)html+="<div></div>";
  for(let day=1;day<=daysInMonth;day++){
    const names=dayMap[day]||[];
    const has=names.length>0;
    const isToday=isCurrentMonth&&day===todayDate;
    const isSel=_absCalSelDay===day;
    html+=`<div ${has?`onclick="absCalSelectDay(${day})"`:""} title="${esc(names.join(", ")||"")}"
      style="min-height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;
      border:1px solid ${isSel?"var(--ye)":isToday?"var(--ac)":"var(--ln)"};background:${isSel?"rgba(255,210,61,.12)":has?"rgba(255,59,92,.08)":"var(--s2)"};
      cursor:${has?"pointer":"default"};position:relative;padding:.2rem">
      <span style="font-family:var(--fm);font-size:.7rem;color:${isToday?"var(--ac)":has?"var(--rd)":"var(--tx2)"}">${day}</span>
      ${has?`<span style="font-size:.6rem;color:var(--rd);font-family:var(--fm)">${names.length}</span>`:""}
    </div>`;
  }
  html+="</div>";

  const monthStart=new Date(_absCalYear,_absCalMonth,1);
  const monthEnd=new Date(_absCalYear,_absCalMonth+1,0);
  const todayStr=new Date().toISOString().slice(0,10);
  const monthAbs=state.absences
    .filter(a=>a.start_date&&a.end_date&&new Date(a.start_date)<=monthEnd&&new Date(a.end_date)>=monthStart)
    .sort((a,b)=>String(a.start_date).localeCompare(String(b.start_date)));

  html+='<div class="abs-cal-list">';
  if(_absCalSelDay!==null){
    const dn=dayMap[_absCalSelDay]||[];
    const dstr=`${String(_absCalSelDay).padStart(2,"0")} ${monthNames[_absCalMonth].toLowerCase()}`;
    html+=`<div class="abs-cal-sel">
      <div class="abs-cal-sel-h">📅 Absents le ${dstr} <button onclick="absCalSelectDay(${_absCalSelDay})" title="Fermer">✕</button></div>
      ${dn.length?dn.map(n=>`<span class="abs-cal-chip">${esc(n)}</span>`).join(""):'<span style="color:var(--dm);font-size:.8rem">Personne</span>'}
    </div>`;
  }
  html+=`<div class="abs-cal-list-h">Absents en ${monthNames[_absCalMonth].toLowerCase()} ${_absCalYear} ${monthAbs.length?`<span>(${monthAbs.length})</span>`:""}</div>`;
  if(!monthAbs.length){
    html+='<div style="color:var(--dm);font-size:.82rem;padding:.4rem 0">Aucune absence ce mois-ci.</div>';
  }else{
    html+=monthAbs.map(a=>{
      const active=a.start_date<=todayStr&&todayStr<=a.end_date;
      return `<div class="abs-cal-row">
        <span class="abs-cal-dot ${active?"active":""}"></span>
        <span class="abs-cal-nm">${esc(memberLabel(a.member_id,a.member_name))}</span>
        <span class="abs-cal-dates">${fmtDate(a.start_date)} → ${fmtDate(a.end_date)}</span>
        ${active?'<span class="abs-cal-badge">En cours</span>':""}
      </div>`;
    }).join("");
  }
  html+='</div>';
  el.innerHTML=html;
}
