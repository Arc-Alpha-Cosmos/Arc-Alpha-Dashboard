/* ARC ALPHA - Module overview. */
function renderOverview(){
  if(_cmdMode){ renderCmdMode(); try{renderOvCmdm();renderOvKpis();}catch(e){} return; }
  const effectif=state.members.filter(m=>(m.categorie||"effectif")==="effectif");
  const present=effectif.filter(m=>m.status==="present");
  const reserve=state.members.filter(m=>(m.categorie||"effectif")==="reserve");
  const activeBlames=state.blames.filter(b=>!b.resolved);
  const total=effectif.length;
  const ge=id=>document.getElementById(id);
  animateCount(ge("ovTotal"),total);
  animateCount(ge("ovPresent"),present.length);
  animateCount(ge("ovReserve"),reserve.length);
  animateCount(ge("ovBlames"),activeBlames.length);

  /* Chaque indicateur porte sa jauge et sa couleur. Zéro blâme est une bonne
     nouvelle : elle s'affiche en vert, plus en rouge comme avant. */
  const part=(a,b)=>b>0?Math.max(0,Math.min(100,Math.round(a/b*100))):0;
  const kpi=(id,cls,largeur)=>{
    const k=ge(id); if(!k)return;
    k.className="ov-kpi "+cls;
    const b=k.querySelector(".ov-kpi-g i");
    if(b)b.style.transform="scaleX("+(Math.max(0,Math.min(100,largeur))/100).toFixed(4)+")";
  };
  /* La cible reste affichée telle quelle, même si l'effectif la dépasse :
     masquer le dépassement cacherait justement ce qu'on veut voir. */
  const cible=effectifCible();
  const mx=ge("ovTotalMax"); if(mx)mx.textContent="/ "+cible;
  const ecart=total-cible;
  kpi("ovKpiTotal",total>=cible?"k-ok":"k-ac",part(Math.min(total,cible),cible));
  const tm=ge("ovTotalMax");
  if(tm)tm.title=ecart>0?(ecart+" au-dessus de la cible")
                :(ecart<0?((-ecart)+" place"+(ecart<-1?"s":"")+" à pourvoir"):"cible atteinte");

  const tauxPresence=part(present.length,total);
  const pp=ge("ovPresentPct");
  if(pp)pp.textContent=total?tauxPresence+" %":"";
  kpi("ovKpiPresent",!total?"k-mute":(tauxPresence>=70?"k-ok":(tauxPresence>=40?"k-warn":"k-crit")),tauxPresence);

  const rn=ge("ovReserveNote");
  if(rn)rn.textContent=reserve.length>1?"membres":(reserve.length?"membre":"");
  kpi("ovKpiReserve","k-mute",part(reserve.length,total+reserve.length));

  const nbBl=activeBlames.length;
  const bn=ge("ovBlamesNote");
  if(bn)bn.textContent=nbBl?("sur "+total+" membres"):"aucun en cours";
  kpi("ovKpiBlames",nbBl?"k-crit":"k-ok",nbBl?part(nbBl,total):100);
  const gc=ge("ovGrades");
  if(gc){
    const grades={};effectif.forEach(m=>grades[m.grade]=(grades[m.grade]||0)+1);
    if(!effectif.length)gc.innerHTML='<div class="empty"><p>Aucun membre</p></div>';
    else gc.innerHTML=GRADE_ORDER.filter(g=>grades[g]).map(g=>`
      <div style="display:flex;align-items:center;gap:.8rem;padding:.55rem 0;border-bottom:1px solid var(--ln)">
        <span class="grade-pill gp-${g.toLowerCase()}" style="color:${GRADE_COLORS[g]};border-color:${GRADE_COLORS[g]}44">${g}</span>
        <div style="flex:1;height:4px;background:var(--s3);border-radius:var(--r1);overflow:hidden">
          <div style="height:100%;background:${GRADE_COLORS[g]};width:${grades[g]/Math.max(...Object.values(grades))*100}%;border-radius:var(--r1)"></div>
        </div>
        <span style="font-family:var(--fm);font-size:.78rem;color:var(--tx2)">${grades[g]}</span>
      </div>`).join("");
  }
  renderQuickActions();
  try{renderOvCmdm();renderOvKpis();renderOvActivity();renderOvShortcuts();}catch(e){console.warn("overview refonte",e);}
  const rt=ge("ovRadarTag");
  if(rt)rt.textContent=total+(total>1?" unités":" unité");
  renderTodo();ovRenderDeadline();ovInitRadar();
}

/* Effectif visé par l'unité. Réglable dans l'Administration : il a été
   réduit à 12 le 2026-10-14, il changera encore. 15 n'est que le repli
   quand la configuration n'a rien dit. */
const EFFECTIF_CIBLE_DEFAUT=15;
function effectifCible(){
  const n=parseInt(state.effectifCible,10);
  return (n>0&&n<=999)?n:EFFECTIF_CIBLE_DEFAUT;
}

/* Position d'un membre sur le balayage : angle stable tire de son
   identifiant (il ne saute pas d'une image à l'autre), rayon donné par le
   grade. Le commandement est au centre, les ARC sur l'anneau extérieur. */
let _blipCache=[],_blipSig="~";
function ovBlips(){
  const ms=state.members||[];
  let sig=ms.length+"|";
  for(let i=0;i<ms.length;i++)sig+=ms[i].id+":"+(ms[i].grade||"")+":"+(ms[i].status||"")+":"+(ms[i].categorie||"")+",";
  if(sig===_blipSig)return _blipCache;
  const out=[];
  (state.members||[]).forEach(m=>{
    const cat=m.categorie||"effectif";
    if(cat==="blacklist")return;
    /* Empreinte numerique maison : cyrb53 rend une chaine hexadecimale,
       inutilisable telle quelle pour calculer un angle. */
    const clef=String(m.id)+"|"+String(m.matricule||"");
    let h=2166136261;
    for(let i=0;i<clef.length;i++)h=Math.imul(h^clef.charCodeAt(i),16777619)>>>0;
    const a=(h%3600)/3600*Math.PI*2;
    const lvl=GRADE_LEVEL[m.grade]||0;
    const r=0.24+0.70*(1-lvl/7);
    const c=cat==="reserve" ? "107,118,137"
          : (m.status==="present" ? "34,217,122" : "255,138,61");
    out.push({a,r,c});
  });
  _blipSig=sig;_blipCache=out;
  return out;
}

function canAssignTask(){ return canEdit("tasks"); }
function canCompleteTask(t){
  if(!Auth.ok()||!t)return false;
  const me=sessionMember();
  if(me&&t.assignee_member_id!=null&&String(t.assignee_member_id)===String(me.id))return true;
  return canEdit("tasks");
}
function hasSecondMission(id){
  return (state.cmdmissions||[]).some(c=>String(c.member_id)===String(id)&&String(c.role||"").toLowerCase()==="second");
}
function countRapportsAVerifier(){
  const wk=getWeekKey(0);let n=0;
  (state.members||[]).forEach(m=>{try{const s=reportWeekStatus(m,wk);if(s.due&&!s.done)n++;}catch(e){}});
  return n;
}
function countRetardsRapport(){
  let n=0;
  (state.members||[]).forEach(m=>{try{const e=reportEscalation(m);if(e&&!e.blamed)n++;}catch(err){}});
  return n;
}
function countEligiblesPromotion(){
  let n=0;
  (state.members||[]).forEach(m=>{
    if((m.categorie||"effectif")!=="effectif")return;
    try{if(getEligibility(m).eligible===true)n++;}catch(e){}
  });
  return n;
}
function todoDue(t){
  const d=String(t&&t.due_date||"").slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return null;
  const h=(new Date(d+"T23:59:59").getTime()-Date.now())/3600000;
  return{date:d,hours:h,late:h<0,soon:h>=0&&h<48};
}

function buildTodo(){
  const me=sessionMember();
  if(!Auth.ok())return[];
  if(session.role==="brs")return[];
  const lvl=(session.role==="admin"||session.role==="amiraute")?99:gradeLevel(getSessionGrade());
  const items=[];

  if(me)(state.tasks||[]).forEach(t=>{
    if(!t.active)return;
    if(t.assignee_member_id==null||String(t.assignee_member_id)!==String(me.id))return;
    const d=todoDue(t);
    items.push({kind:"task",task:t,what:t.title||"Tâche",by:t.assigned_by||"",due:d,
      rank:(t.priority==="haute"?0:60)-(d&&d.late?1:0)});
  });

  if(me&&REPORT_EXEMPT.indexOf(me.grade)===-1){
    const esc=reportEscalation(me);
    if(esc&&!esc.blamed){
      items.push({kind:"report",what:`Rendre ton rapport de la semaine du ${fmtDate(esc.weekKey)}`,
        hoursLeft:esc.hoursLeft,rank:esc.hoursLeft});
    }
  }

  const rule=me?PROMO_RULES[me.grade]:null;
  if(rule&&rule.cmd>0){
    const done=getCmdTotal(me.id);
    if(done<rule.cmd){
      items.push({kind:"cmd",rank:200,
        what:`Commandements de mission : ${done} / ${rule.cmd} pour passer ${GRADE_LABELS[rule.next]||rule.next||"?"}`});
    }
  }

  if(me&&me.grade==="LT"&&!hasSecondMission(me.id)){
    items.push({kind:"cmd",what:"Effectuer ton Second de mission",rank:210});
  }

  if(lvl>=GRADE_LEVEL.CPT){
    const n=countRapportsAVerifier();
    if(n)items.push({kind:"manage",goto:"reports",count:n,rank:100,
      what:`Vérifier ${n} rapport${n>1?"s":""} en attente`});
  }
  if(lvl>=GRADE_LEVEL.MAJ){
    const r=countRetardsRapport();
    if(r)items.push({kind:"manage",goto:"reports",count:r,rank:90,
      what:`${r} rapport${r>1?"s":""} en retard dans l'unité`});
    const p=countEligiblesPromotion();
    if(p)items.push({kind:"manage",goto:"roster",count:p,rank:120,
      what:`${p} membre${p>1?"s":""} éligible${p>1?"s":""} à une promotion`});
  }
  if(lvl>=GRADE_LEVEL.CMD){
    const eff=(state.members||[]).filter(m=>(m.categorie||"effectif")==="effectif").length;
    if(eff>=effectifCible()&&state.recOpen){
      items.push({kind:"manage",goto:"admin",rank:130,
        what:"Effectif au plafond ("+effectifCible()+"), le recrutement est encore ouvert"});
    }
  }

  items.sort((a,b)=>a.rank-b.rank);
  return items;
}

function todoRow(it){
  const me=sessionMember();
  if(it.kind==="manage"){
    return `<div class="ov-task go u-info" role="button" tabindex="0" onclick="dashTab('${escJs(it.goto)}')">
      <span class="ov-mat n">${it.count!=null?it.count:"!"}</span>
      <span class="ov-what" style="color:var(--tx)">${esc(it.what)}</span>
      <span class="ov-chip ac">Ouvrir</span>
      <span class="ov-go">&rsaquo;</span>
    </div>`;
  }
  const mat=me&&me.matricule?me.matricule:"-";
  const nom=me&&me.nom?me.nom:"";
  if(it.kind==="report"){
    const h=it.hoursLeft,crit=h<=12;
    return `<div class="ov-task u-${crit?"crit":"warn"}">
      <span class="ov-mat">${esc(mat)}</span>
      <span class="ov-name">${esc(nom)}</span>
      <span class="ov-what">${esc(it.what)}</span>
      <span class="ov-chip ${crit?"cr":"wn"}">${crit?`Blâme dans ${h} h`:`${h} h restantes`}</span>
    </div>`;
  }
  if(it.kind==="task"){
    const t=it.task,d=it.due;
    const prio=t.priority==="haute"?'<span class="ov-chip cr">Haute</span>':"";
    const due=d?`<span class="ov-chip ${d.late?"cr":(d.soon?"wn":"ac")}">${d.late?"En retard":fmtDate(d.date)}</span>`:"";
    const ok=canCompleteTask(t)?`<button class="ov-done" onclick="completeMyTask('${escJs(t.id)}')">Terminé</button>`:"";
    return `<div class="ov-task u-info">
      <span class="ov-mat">${esc(mat)}</span>
      <span class="ov-name">${esc(nom)}</span>
      <span class="ov-what">${esc(it.what)}${it.by?` · par ${esc(it.by)}`:""}</span>
      ${prio}${due}${ok}
    </div>`;
  }
  return `<div class="ov-task u-ok">
    <span class="ov-mat">${esc(mat)}</span>
    <span class="ov-name">${esc(nom)}</span>
    <span class="ov-what">${esc(it.what)}</span>
    <span class="ov-chip ok">En cours</span>
  </div>`;
}

function ovRenderDeadline(){
  const el=document.getElementById("ovDeadline");
  if(!el)return;
  const now=Date.now();
  const lastEnd=weekEndDate(getWeekKey(-1));
  const blameAt=new Date(lastEnd.getTime()+REPORT_BLAME_HOURS*36e5);
  let grace,target,span;
  if(now<blameAt.getTime()){grace=true;target=blameAt;span=REPORT_BLAME_HOURS*36e5;}
  else{grace=false;target=weekEndDate(getWeekKey(0));span=7*864e5;}
  let ms=target.getTime()-now;if(ms<0)ms=0;
  const d=Math.floor(ms/864e5),h=Math.floor((ms%864e5)/36e5);
  const pct=Math.max(0,Math.min(100,(1-ms/span)*100));
  const late=countRapportsAVerifier();
  let quand="";
  try{quand=target.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});}catch(e){}
  el.className="ov-dl"+(grace?" grace":"");
  el.innerHTML=`<div class="ov-dlb">
      <span class="ov-dl-k">${grace?"Blâmes automatiques dans":"Clôture des rapports dans"}</span>
      <span class="ov-dl-t">${d} j ${h<10?"0":""}${h} h</span>
      <span class="ov-dl-s">${esc(quand)} · 23 h 59</span>
    </div>
    <div class="ov-dl-track"><i style="transform:scaleX(${(Math.max(0,Math.min(100,pct))/100).toFixed(4)})"></i></div>
    <div class="ov-dl-side">
      <span class="n ${late?"warn":"ok"}">${late}</span>
      <span class="ov-dl-k">${late>1?"rapports attendus":"rapport attendu"}</span>
    </div>`;
}

let _ovRadar=null;
function ovInitRadar(){
  const c=document.getElementById("ovRadar");
  if(!c)return;
  if(_ovRadar){_ovRadar.resize();_ovRadar.start();return;}
  const ctx=c.getContext?c.getContext("2d"):null;
  if(!ctx)return;
  let angle=0,raf=null,w=0,h=0,reduce=false;
  try{reduce=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(e){}
  function resize(){
    const r=c.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,2);
    w=r.width;h=r.height;
    c.width=Math.max(1,Math.round(w*dpr));
    c.height=Math.max(1,Math.round(h*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  function draw(){
    if(!w||!h)return;
    const cx=w/2,cy=(h-18)/2,R=Math.min(w,h-18)/2-10;
    if(R<=0)return;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle="rgba(0,229,255,0.16)";ctx.lineWidth=1;
    for(let i=1;i<=4;i++){ctx.beginPath();ctx.arc(cx,cy,R*i/4,0,Math.PI*2);ctx.stroke();}
    ctx.strokeStyle="rgba(0,229,255,0.10)";
    ctx.beginPath();ctx.moveTo(cx-R,cy);ctx.lineTo(cx+R,cy);ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);ctx.stroke();
    if(ctx.createConicGradient){
      const g=ctx.createConicGradient(angle,cx,cy);
      g.addColorStop(0,"rgba(0,229,255,0.30)");
      g.addColorStop(.12,"rgba(0,229,255,0.00)");
      g.addColorStop(1,"rgba(0,229,255,0.00)");
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fill();
    }
    ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);
    ctx.strokeStyle="rgba(0,229,255,0.75)";ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R,0);ctx.stroke();ctx.restore();

    /* L'effectif, point par point. Le faisceau les rallume en passant : on
       voit d'un coup d'oeil la forme de l'unite et qui manque a l'appel. */
    const pts=(typeof ovBlips==="function")?ovBlips():[];
    for(let k=0;k<pts.length;k++){
      const b=pts[k];
      let d=angle-b.a;
      d=((d%(Math.PI*2))+(Math.PI*2))%(Math.PI*2);
      const vif=d<.38, eclat=Math.max(.25,1-d/1.6);
      const x=cx+Math.cos(b.a)*R*b.r, y=cy+Math.sin(b.a)*R*b.r;
      ctx.fillStyle="rgba("+b.c+","+(eclat*.92).toFixed(3)+")";
      ctx.beginPath();ctx.arc(x,y,vif?3.2:2.2,0,Math.PI*2);ctx.fill();
      if(vif){
        ctx.strokeStyle="rgba("+b.c+",0.32)";ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.stroke();
      }
    }
    ctx.fillStyle="rgba(0,229,255,0.9)";ctx.beginPath();ctx.arc(cx,cy,2,0,Math.PI*2);ctx.fill();
  }
  function tick(){
    if(c.offsetParent===null){stop();return;}
    angle+=0.006;if(angle>Math.PI*2)angle-=Math.PI*2;
    draw();raf=requestAnimationFrame(tick);
  }
  function start(){ if(!reduce&&raf==null&&!document.hidden&&c.offsetParent!==null)raf=requestAnimationFrame(tick); }
  function stop(){ if(raf!=null){cancelAnimationFrame(raf);raf=null;} }
  window.addEventListener("resize",resize);
  document.addEventListener("visibilitychange",function(){ if(document.hidden)stop(); else start(); });
  _ovRadar={start:start,stop:stop,resize:resize};
  resize();start();
}

function renderTodo(){
  const sec=document.getElementById("ovTodo");
  if(!sec)return;
  const btn=document.getElementById("ovAssignBtn");
  if(btn)btn.style.display=canAssignTask()?"":"none";
  const okTag=document.getElementById("ovTodoOk");
  const list=buildTodo();
  if(!list.length){
    sec.hidden=true;
    if(okTag)okTag.style.display="";
    return;
  }
  sec.hidden=false;
  if(okTag)okTag.style.display="none";
  const cnt=document.getElementById("ovTodoCount");
  if(cnt)cnt.textContent=list.length;
  const box=document.getElementById("ovTodoList");
  if(box)box.innerHTML=list.map(todoRow).join("");
}

function openAssignModal(){
  if(!canAssignTask()){toast("Réservé aux MAJ et plus","error");return;}
  const err=document.getElementById("asgErr");if(err)err.style.display="none";
  populateMemberSelect("asgMember","","");
  document.getElementById("asgTitle").value="";
  document.getElementById("asgDetail").value="";
  document.getElementById("asgDue").value="";
  const n=document.getElementById("asgPrioN");if(n)n.checked=true;
  document.getElementById("assignModal").classList.add("show");
}

async function saveAssignedTask(){
  if(!canAssignTask()){toast("Réservé aux MAJ et plus","error");return;}
  const err=document.getElementById("asgErr");
  const showErr=(m)=>{err.textContent=m;err.style.display="block";};
  const ref=readMemberSelect("asgMember","");
  const title=(document.getElementById("asgTitle").value||"").trim();
  const detail=(document.getElementById("asgDetail").value||"").trim();
  const due=document.getElementById("asgDue").value;
  const haute=!!(document.getElementById("asgPrioH")||{}).checked;
  if(!ref.chosen){showErr("Choisis un destinataire.");return;}
  if(!title){showErr("L'intitulé est requis.");return;}
  if(title.length>80){showErr("L'intitulé ne doit pas dépasser 80 caractères.");return;}
  const m=memberById(ref.id);
  const linked=(state.users||[]).find(u=>String(u.member_id)===String(ref.id));
  const obj={
    assignee_member_id:ref.id,
    assignee_name:m?`${m.matricule||"?"} ${m.nom||""}`.trim():"?",
    assignee_hash:(linked&&linked.user_hash)||(m&&m.user_hash)||"",
    type:"custom",
    title,
    description:detail,
    active:true,
    assigned_by:session?.user||"?",
    assigned_by_id:session?.userId??null,
    due_date:due||null,
    priority:haute?"haute":"normale"
  };
  if(supaOK){
    const r=await supaWriteOptional(T.tasks,null,obj,["assigned_by_id","due_date","priority"]);
    if(r===null){showErr("Erreur réseau.");return;}
    if(r&&r.length>0)state.tasks.push(r[0]);else{obj.id=Date.now().toString();state.tasks.push(obj);}
  }else{obj.id=Date.now().toString();state.tasks.push(obj);saveLS();}
  closeModal("assignModal");
  renderTodo();
  if(_activeTab==="tasks"&&typeof renderTasks==="function")renderTasks();
  toast(`Tâche attribuée à ${obj.assignee_name}`,"success");
  await logActivity(`${session?.user} a attribué la tâche '${title}' à ${obj.assignee_name}`);
}

async function completeMyTask(id){
  const t=(state.tasks||[]).find(x=>String(x.id)===String(id));
  if(!canCompleteTask(t)){toast("Réservé au destinataire ou aux MAJ et plus","error");return;}
  if(supaOK){
    const r=await supaWriteOptional(T.tasks,"id=eq."+id,{active:false,completed_at:new Date().toISOString()},["completed_at"]);
    if(r===null){toast("Erreur réseau","error");return;}
  }
  if(t)t.active=false;
  if(!supaOK)saveLS();
  renderTodo();
  if(_activeTab==="tasks"&&typeof renderTasks==="function")renderTasks();
  toast("Tâche terminée","success");
  await logActivity(`${session?.user} a terminé la tâche '${(t&&t.title)||"?"}'`);
}

function renderQuickActions(){
  const el=document.getElementById("ovQuickActions");
  if(!el)return;
  /* Refonte : ces cartes font double emploi avec les indicateurs cliquables
     du haut de page (renderOvKpis). Le bloc est conserve mais replie. */
  el.style.display="none";el.innerHTML="";return;
  const today=new Date().toISOString().slice(0,10);

  const activeAbs=state.absences.filter(a=>a.start_date<=today&&today<=a.end_date);

  const wk=getWeekKey(0);
  const missingReports=activeMembers().filter(m=>{const s=reportWeekStatus(m,wk);return s.due&&!s.done;});

  const openPolls=state.polls.filter(p=>p.active&&!isPollExpired(p));

  const eligible=activeMembers().filter(m=>{const e=getEligibility(m);return e.eligible===true;});

  const cards=[];

  if(canEdit("reports")&&missingReports.length>0){
    cards.push({
      count:missingReports.length,
      label:missingReports.length>1?"rapports manquants":"rapport manquant",
      color:"var(--rd)",
      icon:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',
      tab:"reports"
    });
  }

  if(activeAbs.length>0){
    cards.push({
      count:activeAbs.length,
      label:activeAbs.length>1?"absences en cours":"absence en cours",
      color:"var(--or)",
      icon:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      tab:"absences"
    });
  }

  if(openPolls.length>0){
    cards.push({
      count:openPolls.length,
      label:openPolls.length>1?"sondages ouverts":"sondage ouvert",
      color:"var(--ac)",
      icon:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
      tab:"polls"
    });
  }

  if(canEdit("roster")&&eligible.length>0){
    cards.push({
      count:eligible.length,
      label:eligible.length>1?"éligibles promotion":"éligible promotion",
      color:"var(--gr)",
      icon:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
      tab:"roster"
    });
  }

  if(!cards.length){
    el.innerHTML='';
    el.style.display="none";
    return;
  }
  el.style.display="grid";
  el.innerHTML=cards.map(c=>`
    <div onclick="dashTab('${escJs(c.tab)}')" style="cursor:pointer;background:var(--s2);border:1px solid var(--ln);border-left:3px solid ${c.color};padding:1rem;display:flex;align-items:center;gap:.9rem;transition:all .15s"
      onmouseover="this.style.background='var(--s3)';this.style.transform='translateX(2px)'"
      onmouseout="this.style.background='var(--s2)';this.style.transform='translateX(0)'">
      <svg viewBox="0 0 24 24" fill="none" stroke="${c.color}" stroke-width="2" style="width:26px;height:26px;flex-shrink:0">${c.icon}</svg>
      <div>
        <div style="font-family:var(--fs);font-size:1.6rem;font-weight:700;color:${c.color};line-height:1">${c.count}</div>
        <div style="font-size:.74rem;color:var(--tx2);text-transform:uppercase;letter-spacing:.05em">${c.label}</div>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--dm)" stroke-width="2" style="width:16px;height:16px;margin-left:auto;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`).join("");
}


let _cmdMode = false;

function toggleCmdMode(){
  _cmdMode = !_cmdMode;
  const btn = document.getElementById("cmdModeBtn");
  const normal = document.getElementById("cmdModeView");
  const existing = document.querySelector("[data-dtc='overview'] > .grid.g4");

  if(_cmdMode){
    if(btn){ btn.classList.add("active"); }
    if(normal) normal.style.display = "block";
    document.querySelectorAll("[data-dtc='overview'] > :not(#cmdModeView):not(.ov-top):not(#ovKpis):not(#ovCmdm)").forEach(el=>{
      el.dataset.wasVisible = "1";
      el.style.display = "none";
    });
    renderCmdMode();
  } else {
    if(btn){ btn.classList.remove("active"); }
    if(normal) normal.style.display = "none";
    document.querySelectorAll("[data-dtc='overview'] > :not(#cmdModeView)").forEach(el=>{
      if(el.dataset.wasVisible) el.style.display = "";
    });
  }
}

function renderCmdMode(){
  if(!_cmdMode) return;
  const today = new Date().toISOString().slice(0,10);
  const wk = getWeekKey(0);

  const total = activeMembers().length;
  const present = activeMembers().filter(m=>m.status==="present").length;
  const absent  = activeMembers().filter(m=>m.status==="absent").length;
  const reserve = state.members.filter(m=>(m.categorie||"effectif")==="reserve").length;
  const absActive = state.absences.filter(a=>a.start_date<=today&&today<=a.end_date);
  const blamesActive = state.blames.filter(b=>!b.resolved);
  const missing = activeMembers().filter(m=>{const s=reportWeekStatus(m,wk);return s.due&&!s.done;});
  const openPolls = state.polls.filter(p=>p.active&&!isPollExpired(p));
  const eligibles = activeMembers().filter(m=>getEligibility(m).eligible===true);

  const pct = total>0?Math.round(present/total*100):0;
  setBlock("cm-effectif","var(--ac)",`
    <div class="cmd-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      Effectif
    </div>
    <div class="cmd-value">${total}</div>
    <div class="cmd-sub">${present} présents · ${reserve} réserve · ${absent} absents</div>
    <div style="height:4px;background:var(--s3);border-radius:var(--r1);margin-top:.6rem;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:var(--ac);border-radius:var(--r1);transition:width 1s ease"></div>
    </div>
  `);

  const alertCount = blamesActive.length + missing.length + absActive.length;
  const alertColor = alertCount>0 ? "var(--rd)" : "var(--gr)";
  setBlock("cm-alertes", alertColor, `
    <div class="cmd-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
      Alertes
    </div>
    <div class="cmd-value" style="font-size:1.8rem">${alertCount>0?"⚠":"✓"}</div>
    <div style="display:flex;flex-direction:column;gap:.2rem;margin-top:.3rem">
      <div class="cmd-sub"><span style="color:${blamesActive.length>0?"var(--rd)":"var(--dm)"}">${blamesActive.length} blâme${blamesActive.length>1?"s":""} actif${blamesActive.length>1?"s":""}</span></div>
      <div class="cmd-sub"><span style="color:${missing.length>0?"var(--or)":"var(--dm)"}">${missing.length} rapport${missing.length>1?"s":""} manquant${missing.length>1?"s":""}</span></div>
      <div class="cmd-sub"><span style="color:${absActive.length>0?"var(--ye)":"var(--dm)"}">${absActive.length} absence${absActive.length>1?"s":""} en cours</span></div>
    </div>
  `);

  const eligColor = eligibles.length>0 ? "var(--gr)" : "var(--dm)";
  setBlock("cm-presences", eligColor, `
    <div class="cmd-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      Promotions
    </div>
    <div class="cmd-value">${eligibles.length}</div>
    <div class="cmd-sub">${eligibles.length>0?eligibles.slice(0,3).map(m=>`${esc(m.matricule)} → ${esc(PROMO_RULES[m.grade]?.next)||"?"}`).join(", "):"Aucun éligible"}</div>
  `);

  setBlock("cm-ops","var(--vi)",`
    <div class="cmd-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      Sondages
    </div>
    <div class="cmd-value">${openPolls.length}<span style="font-size:.8rem;color:var(--dm);margin-left:.3rem">sondage${openPolls.length>1?"s":""} ouvert${openPolls.length>1?"s":""}</span></div>
    <div class="cmd-sub">${openPolls.length>0?"Consultation en cours":"Aucun sondage actif"}</div>
  `);

  const sorted = sortMembers(activeMembers());
  setBlock("cm-roster","var(--ac)",`
    <div class="cmd-section-title">// EFFECTIF COMPLET</div>
    <ul class="cmd-list">
      ${sorted.map(m=>{
        const gc = GRADE_COLORS[m.grade]||"#00e5ff";
        const stc = {present:"var(--gr)",absent:"var(--rd)",reserve:"var(--dm)"}[m.status||"present"];
        const elig = getEligibility(m);
        return `<li>
          <span class="cmd-dot" style="background:${stc}"></span>
          <span style="color:${gc};font-family:var(--fm);font-size:.74rem;font-weight:700;min-width:60px">${esc(m.matricule)}</span>
          <span style="flex:1;color:var(--tx2);font-size:.78rem">${esc(m.nom)||"-"}</span>
          <span class="cmd-tag" style="background:color-mix(in srgb,${gc} 12%,transparent);color:${gc}">${esc(m.grade)}</span>
          ${elig.eligible===true?`<span style="color:var(--gr);font-size:.74rem" title="Éligible promotion">▲</span>`:""}
        </li>`;
      }).join("")}
    </ul>
  `);

  setBlock("cm-rapports","var(--or)",`
    <div class="cmd-section-title">// RAPPORTS SEMAINE</div>
    ${missing.length===0
      ? `<div style="color:var(--gr);font-family:var(--fm);font-size:.74rem;padding:.5rem 0">✓ Tous les rapports reçus</div>`
      : `<ul class="cmd-list">
          ${missing.slice(0,5).map(m=>`<li>
            <span class="cmd-dot" style="background:var(--rd)"></span>
            <span style="font-family:var(--fm);font-size:.74rem;color:var(--rd)">${esc(m.matricule)}</span>
            <span style="color:var(--tx2);font-size:.75rem">${esc(m.nom)||"-"}</span>
          </li>`).join("")}
          ${missing.length>5?`<li style="color:var(--dm);font-size:.74rem">+${missing.length-5} autres…</li>`:""}
        </ul>`
    }
  `);

  setBlock("cm-polls","var(--vi)",`
    <div class="cmd-section-title">// SONDAGES ACTIFS</div>
    ${openPolls.length===0
      ? `<div style="color:var(--dm);font-family:var(--fm);font-size:.74rem;padding:.5rem 0">Aucun sondage en cours</div>`
      : `<ul class="cmd-list">
          ${openPolls.slice(0,4).map(p=>{
            const votes = getPollVotes(p.id).length;
            return `<li>
              <span class="cmd-dot" style="background:var(--vi)"></span>
              <span style="flex:1;font-size:.75rem;color:var(--tx2)">${escTrunc(p.question,40)}</span>
              <span class="cmd-tag" style="background:rgba(124,92,255,.12);color:var(--vi)">${votes}v</span>
            </li>`;
          }).join("")}
        </ul>`
    }
  `);

  setBlock("cm-activity","var(--ac)",`
    <div class="cmd-section-title">// ACTIVITÉ RÉCENTE</div>
    <ul class="cmd-list">
      ${state.activity.filter(a=>!isSensitiveLog(a.text)).slice(0,6).map(a=>`<li>
        <span class="cmd-dot" style="background:var(--ac);opacity:.5"></span>
        <span style="flex:1;font-size:.75rem;color:var(--tx2)">${escTrunc(a.text,55)}</span>
        <span style="font-family:var(--fm);font-size:.74rem;color:var(--dm);flex-shrink:0">${fmtDate(a.created_at)}</span>
      </li>`).join("") || `<li class="c-dm">Aucune activité</li>`}
    </ul>
  `);

  setBlock("cm-absences","var(--ye)",`
    <div class="cmd-section-title">// ABSENCES EN COURS</div>
    ${absActive.length===0
      ? `<div style="color:var(--gr);font-family:var(--fm);font-size:.74rem;padding:.5rem 0">✓ Aucune absence signalée</div>`
      : `<ul class="cmd-list">
          ${absActive.slice(0,5).map(a=>`<li>
            <span class="cmd-dot" style="background:var(--ye)"></span>
            <span style="font-family:var(--fm);font-size:.74rem;color:var(--ye)">${esc(memberLabel(a.member_id,a.member_name).split(" ")[0])}</span>
            <span style="flex:1;color:var(--tx2);font-size:.74rem">${esc(a.reason)||"-"}</span>
            <span style="font-family:var(--fm);font-size:.74rem;color:var(--dm)">→ ${fmtDate(a.end_date)}</span>
          </li>`).join("")}
          ${absActive.length>5?`<li style="color:var(--dm);font-size:.74rem">+${absActive.length-5} autres…</li>`:""}
        </ul>`
    }
  `);
}

function setBlock(id, color, html){
  const el = document.getElementById(id);
  if(!el) return;
  el.style.setProperty("--block-color", color);
  el.innerHTML = html;
}


/* ============================================================
   Refonte 2026-11 : affichage compact / detaille, indicateurs,
   activite recente et raccourcis
   ============================================================ */
function setOverviewMode(mode){
  const compact=mode==="compact";
  uiPrefs.set("ovCompact",compact);
  if(compact!==_cmdMode)toggleCmdMode();
  const d=document.getElementById("ovSegDet"),c=document.getElementById("ovSegCmp");
  if(d)d.classList.toggle("on",!compact);
  if(c)c.classList.toggle("on",compact);
}
/* L'affichage compact reprend l'ancien mode commandant : meme reserve
   (administration, Amiraute, BRS, MAJ et plus). */
function canCompactOverview(){
  return Auth.ok()&&(session.role==="admin"||session.role==="brs"||session.role==="amiraute"||gradeLevel(getSessionGrade())>=4);
}
function applyOverviewPref(){
  const seg=document.getElementById("ovSeg");
  const ok=canCompactOverview();
  if(seg)seg.style.display=ok?"":"none";
  const compact=ok&&!!uiPrefs.get("ovCompact",false);
  const d=document.getElementById("ovSegDet"),c=document.getElementById("ovSegCmp");
  if(d)d.classList.toggle("on",!compact);
  if(c)c.classList.toggle("on",compact);
  if(compact!==_cmdMode)toggleCmdMode();
}

function renderOvKpis(){
  const el=document.getElementById("ovKpis");if(!el)return;
  const seg=document.getElementById("ovSeg");if(seg)seg.style.display=canCompactOverview()?"":"none";
  const eff=activeMembers(),total=eff.length,cible=effectifCible();
  const present=eff.filter(m=>m.status==="present").length;
  const wk=getWeekKey(0);
  let due=0,done=0;eff.forEach(m=>{try{const s=reportWeekStatus(m,wk);if(s.due){due++;if(s.done)done++;}}catch(e){}});
  const blames=(state.blames||[]).filter(b=>!b.resolved).length;
  const today=ymdLocal(new Date());
  const abs=(state.absences||[]).filter(a=>a.start_date<=today&&today<=a.end_date).length;
  const lvl=(session&&(session.role==="admin"||session.role==="amiraute"))?99:gradeLevel(getSessionGrade());
  const cards=[];
  const kpi=(o)=>cards.push(statCard({title:o.l,value:o.v,unit:o.small,sub:o.s,color:o.c,icon:o.ic,tab:o.tab,trend:o.trend}));
  const arrivees=countInWindow(eff,m=>m.date_arrivee,30,0);
  kpi({l:"Effectif",v:total,small:"/ "+cible,s:(total>=cible?"cible atteinte":(cible-total)+" place"+(cible-total>1?"s":"")+" à pourvoir")+((_res=>_res?" · "+_res+" en réserve":"")((state.members||[]).filter(m=>(m.categorie||"effectif")==="reserve").length)),c:total>=cible?"var(--gr)":"var(--ac)",ic:"users",tab:"roster",
    trend:{cur:arrivees,mode:"abs",neutral:true,ctx:arrivees>1?"arrivées en 30 j":"arrivée en 30 j",hint:"Membres de l'effectif dont la date d'arrivée tombe dans les 30 derniers jours"}});
  kpi({l:"Présents",v:present,small:total?Math.round(present/total*100)+" %":"",s:abs?abs+" absence"+(abs>1?"s":"")+" en cours":"aucune absence en cours",c:!total?"var(--dm)":(present/total>=.7?"var(--gr)":present/total>=.4?"var(--or)":"var(--rd)"),ic:"user-check",tab:"absences"});
  kpi({l:"Rapports de la semaine",v:done,small:"/ "+due,s:due?(due-done?(due-done)+" en attente":"tout est rendu"):"personne n'est attendu",c:due&&done<due?"var(--or)":"var(--gr)",ic:"file-check",tab:"reports"});
  kpi({l:"Blâmes actifs",v:blames,s:blames?"à suivre":"aucun en cours",c:blames?"var(--rd)":"var(--gr)",ic:"alert-triangle",tab:lvl>=GRADE_LEVEL.MAJ?"blames":null});
  try{
    if(canSeeAllRapports()){const p=rapPending().length;kpi({l:"Comptes rendus à relire",v:p,s:p?"en attente de validation":"rien en attente",c:p?"var(--ye)":"var(--gr)",ic:"file-text",tab:"rapports"});}
  }catch(e){}
  const openPolls=(state.polls||[]).filter(p=>p.active&&!isPollExpired(p)).length;
  if(openPolls)kpi({l:"Sondages ouverts",v:openPolls,s:"ton avis est attendu",c:"var(--vi)",ic:"vote",tab:"polls"});
  if(lvl>=GRADE_LEVEL.MAJ){const p=countEligiblesPromotion();kpi({l:"Éligibles promotion",v:p,s:p?"à examiner":"personne pour l'instant",c:p?"var(--gr)":"var(--dm)",ic:"trending-up",tab:"roster"});}
  el.innerHTML=cards.join("");
  lucideRefresh(el);
}

function renderOvActivity(){
  const el=document.getElementById("ovActivity");if(!el)return;
  const rows=(state.activity||[]).filter(a=>a&&a.text&&!isSensitiveLog(a.text)).slice(0,8);
  if(!rows.length){el.innerHTML='<div class="empty"><p>Aucune activité récente.</p></div>';return;}
  const cat=typeof histCat==="function"?histCat:()=>({icon:"circle",color:"var(--ac)"});
  el.innerHTML=`<div class="tl tl-lite">${rows.map(a=>{const c=cat(a.text);return `<div class="tl-item"><div class="tl-marker" style="--tc:${c.color}">${navIconHtml(c.icon)}</div>
    <div class="tl-content"><div class="tl-top"><span class="tl-title" style="font-weight:500">${esc(a.text)}</span><span class="tl-date">${esc(fmtRel(a.created_at))}</span></div></div></div>`;}).join("")}</div>`;
  lucideRefresh(el);
}

function renderOvShortcuts(){
  const el=document.getElementById("ovShortcuts");if(!el)return;
  const favs=favTabs().filter(t=>canViewTab(t));
  const base=["roster","reports","absences","calendrier","missions","rapports"].filter(t=>canViewTab(t)&&!favs.includes(t));
  const list=favs.concat(base).slice(0,8);
  el.innerHTML=`<div class="ov-short">${list.map(t=>`<button onclick="dashTab('${escJs(t)}')"><span class="ico">${tabIcon(t)}</span>${esc(TAB_META[t].label)}</button>`).join("")}
    <div class="hint">${favs.length?"Les favoris viennent en premier. ":"Aucun favori pour l'instant. "}Une étoile dans le menu de gauche épingle un onglet ici.</div></div>`;
  lucideRefresh(el);
}
