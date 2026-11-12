/* ARC ALPHA - Module calendrier.
   Un seul calendrier pour ce que les autres onglets datent deja : absences,
   fin de semaine des rapports (dimanche) et blame automatique (mardi), missions
   de la semaine, taches a echeance, formations et entrainements. Aucune
   saisie ici, aucune table nouvelle. */

let _calView="month",_calCursor=new Date(),_calSelDay=null;
const CAL_COLORS={absence:"var(--or)",rapport:"var(--rd)",mission:"var(--ac)",tache:"var(--vi)",formation:"var(--gr)",entrainement:"var(--gr)"};

function calSetView(v){_calView=v;["Month","Week","Day"].forEach(k=>{const b=document.getElementById("calV"+k);if(b)b.classList.toggle("on",k.toLowerCase()===v);});renderCalendrier();}
function calToday(){_calCursor=new Date();_calSelDay=ymdLocal(new Date());renderCalendrier();}
function calMove(k){
  const d=new Date(_calCursor);
  if(_calView==="month")d.setMonth(d.getMonth()+k);
  else if(_calView==="week")d.setDate(d.getDate()+7*k);
  else d.setDate(d.getDate()+k);
  _calCursor=d;_calSelDay=null;renderCalendrier();
}
function calSelect(ymd){_calSelDay=(_calSelDay===ymd)?null:ymd;renderCalendrier();}

/* Tous les evenements datables, sous forme {date, type, title, sub, tab}. */
function calEvents(from,to){
  const ev=[];
  const inR=d=>d&&d>=from&&d<=to;
  (state.absences||[]).forEach(a=>{
    if(!a.start_date||!a.end_date)return;
    const s=String(a.start_date).slice(0,10),e=String(a.end_date).slice(0,10);
    for(let d=(s>from?s:from);d<=e&&d<=to;d=addDaysYmd(d,1))
      ev.push({date:d,type:"absence",title:memberLabel(a.member_id,a.member_name),sub:(a.reason||"absence")+(d===s?" · début":d===e?" · fin":""),tab:"absences"});
  });
  /* semaines de rapports : dimanche = cloture, mardi = blame automatique */
  let wk=weekKeyOf(from);
  for(let i=0;i<60&&wk<=to;i++){
    if(wk>=REPORT_RULES_SINCE){
      const dim=addDaysYmd(wk,6),mar=addDaysYmd(wk,8);
      if(inR(dim))ev.push({date:dim,type:"rapport",title:"Clôture des rapports",sub:"semaine du "+fmtDate(wk)+" · 23 h 59",tab:"reports"});
      if(inR(mar)&&state.autoReport)ev.push({date:mar,type:"rapport",title:"Blâmes automatiques",sub:"48 h après la clôture",tab:"reports"});
    }
    wk=addDaysYmd(wk,7);
  }
  /* missions de la semaine : une entree le lundi de chaque semaine */
  try{
    let w=weekKeyOf(from);
    for(let i=0;i<60&&w<=to;i++){
      if(inR(w))misSemaine(w).forEach(m=>ev.push({date:w,type:"mission",title:m.nom||"Mission",sub:(m.categorie||"")+(m.duree?" · "+m.duree:""),tab:"missions"}));
      w=addDaysYmd(w,7);
    }
  }catch(e){}
  (state.tasks||[]).forEach(t=>{
    const d=String(t.due_date||"").slice(0,10);
    if(t.active&&inR(d))ev.push({date:d,type:"tache",title:t.title||"Tâche",sub:"pour "+memberLabel(t.assignee_member_id,t.assignee_name),tab:"tasks"});
  });
  (state.formations||[]).forEach(f=>{
    const d=String(f.date||"").slice(0,10);
    if(inR(d))ev.push({date:d,type:"formation",title:"Formation "+(f.formation||""),sub:memberLabel(f.formateur_id,f.formateur)+" → "+memberLabel(f.eleve_id,f.eleve),tab:"formations"});
  });
  (state.activites||[]).forEach(a=>{
    const d=String(a.date||"").slice(0,10);
    if(inR(d))ev.push({date:d,type:"entrainement",title:(a.type||"Entraînement")+" : "+(a.intitule||""),sub:actMemberLabels(a).slice(0,3).join(", "),tab:"entrainements"});
  });
  ev.sort((a,b)=>a.date.localeCompare(b.date)||a.type.localeCompare(b.type));
  return ev;
}

function calEvHtml(e,full){
  return `<div class="cal-ev" style="--ec:${CAL_COLORS[e.type]||"var(--ac)"}" title="${esc(e.title)}${e.sub?" - "+esc(e.sub):""}" onclick="event.stopPropagation();goToTab('${escJs(e.tab)}')">${esc(e.title)}${full&&e.sub?`<small>${esc(e.sub)}</small>`:""}</div>`;
}

function renderCalendrier(){
  const body=document.getElementById("calBody"),title=document.getElementById("calTitle"),tag=document.getElementById("calTag");
  if(!body)return;
  const today=ymdLocal(new Date());
  const monthNames=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const dow=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  let from,to,cells=[];
  if(_calView==="month"){
    const y=_calCursor.getFullYear(),m=_calCursor.getMonth();
    const first=new Date(y,m,1),last=new Date(y,m+1,0);
    let start=first.getDay();start=start===0?6:start-1;
    const gridStart=new Date(y,m,1-start);
    const n=Math.ceil((start+last.getDate())/7)*7;
    for(let i=0;i<n;i++){const d=new Date(gridStart);d.setDate(gridStart.getDate()+i);cells.push({ymd:ymdLocal(d),out:d.getMonth()!==m});}
    from=cells[0].ymd;to=cells[cells.length-1].ymd;
    if(title)title.textContent=monthNames[m]+" "+y;
  }else if(_calView==="week"){
    const wk=weekKeyOf(ymdLocal(_calCursor));
    for(let i=0;i<7;i++)cells.push({ymd:addDaysYmd(wk,i),out:false});
    from=cells[0].ymd;to=cells[6].ymd;
    if(title)title.textContent="Semaine du "+fmtDate(from)+" au "+fmtDate(to);
  }else{
    from=to=ymdLocal(_calCursor);
    if(title)title.textContent=new Date(from+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  }
  const events=calEvents(from,to);
  const byDay={};events.forEach(e=>{(byDay[e.date]=byDay[e.date]||[]).push(e);});
  if(tag)tag.textContent=events.length+(events.length>1?" événements":" événement");

  if(_calView==="day"){
    const l=byDay[from]||[];
    body.innerHTML=l.length?`<div class="cal-dayview">${l.map(e=>calEvHtml(e,true)).join("")}</div>`
      :'<div class="empty"><p>Rien de prévu ce jour-là.</p></div>';
  }else{
    const max=_calView==="week"?8:3;
    body.innerHTML=`<div class="cal-dow">${dow.map(d=>`<span>${d}</span>`).join("")}</div>
      <div class="cal-grid ${_calView}">${cells.map(c=>{
        const l=byDay[c.ymd]||[];
        return `<div class="cal-day${c.out?" out":""}${c.ymd===today?" today":""}${c.ymd===_calSelDay?" sel":""}" onclick="calSelect('${c.ymd}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter')calSelect('${c.ymd}')" aria-label="${fmtDate(c.ymd)}, ${l.length} événement${l.length>1?"s":""}">
          <span class="n">${+c.ymd.slice(8,10)}</span>
          ${l.slice(0,max).map(e=>calEvHtml(e)).join("")}${l.length>max?`<span class="cal-more">+${l.length-max}</span>`:""}
          <span class="dots">${l.slice(0,6).map(e=>`<i style="--ec:${CAL_COLORS[e.type]}"></i>`).join("")}</span>
        </div>`;}).join("")}</div>`;
  }
  const sel=document.getElementById("calSel");
  if(sel){
    if(_calSelDay&&_calView!=="day"){
      const l=byDay[_calSelDay]||[];
      sel.innerHTML=`<div class="panel"><div class="panel-head"><h3><span class="pk">//</span> ${esc(new Date(_calSelDay+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}))}</h3>
        <button class="icon-btn" onclick="calSelect('${_calSelDay}')" title="Fermer" aria-label="Fermer">${navIconHtml("x")}</button></div>
        <div class="panel-body">${l.length?`<div class="cal-dayview">${l.map(e=>calEvHtml(e,true)).join("")}</div>`:'<p class="card-b">Rien de prévu ce jour-là.</p>'}</div></div>`;
    }else sel.innerHTML="";
  }
  lucideRefresh(body);
}
