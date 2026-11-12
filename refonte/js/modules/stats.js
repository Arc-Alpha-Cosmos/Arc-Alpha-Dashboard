/* ARC ALPHA - Module statistiques.
   Graphiques en SVG, sans bibliotheque, calcules sur les donnees deja en
   memoire. Les semaines figees (reportWeeks) servent de source quand elles
   existent, sinon le calcul en direct. Export CSV des series affichees. */

let _statsSeries={};

function statsWeeks(n){
  const out=[];for(let i=n-1;i>=0;i--)out.push(getWeekKey(-i));return out;
}
function statsReportRate(wk){
  let due=0,done=0;
  (state.members||[]).forEach(m=>{try{const s=reportWeekStatus(m,wk);if(s.due){due++;if(s.done)done++;}}catch(e){}});
  return {due,done,rate:due?Math.round(done/due*1000)/10:null};
}
function statsMonthKey(d){const s=String(d||"").slice(0,7);return /^\d{4}-\d{2}$/.test(s)?s:null;}
function statsMonths(n){
  const out=[],d=new Date();d.setDate(1);
  for(let i=n-1;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);out.push(x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0"));}
  return out;
}
function statsMonthLabel(k){const m=["jan","fév","mar","avr","mai","juin","juil","aoû","sep","oct","nov","déc"];return m[+k.slice(5,7)-1]+" "+k.slice(2,4);}

/* --- graphiques SVG --- */
function svgBars(series,opts){
  const o=opts||{},W=o.w||440,H=o.h||210,pl=34,pr=10,pt=16,pb=30;
  const max=Math.max(1,...series.map(s=>s.v));
  const iw=W-pl-pr,ih=H-pt-pb,n=series.length,bw=Math.max(4,Math.min(40,iw/n*0.62)),step=iw/n;
  let g="";
  for(let i=0;i<=4;i++){const y=pt+ih-ih*i/4;g+=`<line class="grid" x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}"/><text x="${pl-6}" y="${y+3}" text-anchor="end">${Math.round(max*i/4*10)/10}${o.unit||""}</text>`;}
  const bars=series.map((s,i)=>{
    const h=ih*(s.v/max),x=pl+step*i+(step-bw)/2,y=pt+ih-h;
    return `<rect class="bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${s.c||"var(--ac)"}" rx="2"><title>${esc(s.l)} : ${s.v}${o.unit||""}</title></rect>
      ${s.v>0&&n<=16?`<text class="val" x="${(x+bw/2).toFixed(1)}" y="${(y-4).toFixed(1)}" text-anchor="middle">${s.v}</text>`:""}
      ${(n<=16||i%Math.ceil(n/12)===0)?`<text x="${(x+bw/2).toFixed(1)}" y="${H-pb+14}" text-anchor="middle">${esc(s.l)}</text>`:""}`;
  }).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"graphique")}">${g}<line class="axis" x1="${pl}" x2="${W-pr}" y1="${pt+ih}" y2="${pt+ih}"/>${bars}</svg>`;
}
function svgLine(series,opts){
  const o=opts||{},W=o.w||440,H=o.h||210,pl=34,pr=10,pt=16,pb=30;
  const pts=series.filter(s=>s.v!==null&&s.v!==undefined);
  if(!pts.length)return `<div class="chart-empty">Pas encore de données sur cette période.</div>`;
  const max=o.max||Math.max(1,...pts.map(s=>s.v)),iw=W-pl-pr,ih=H-pt-pb,n=series.length;
  const X=i=>pl+(n>1?iw*i/(n-1):iw/2),Y=v=>pt+ih-ih*(v/max);
  let g="";
  for(let i=0;i<=4;i++){const y=pt+ih-ih*i/4;g+=`<line class="grid" x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}"/><text x="${pl-6}" y="${y+3}" text-anchor="end">${Math.round(max*i/4)}${o.unit||""}</text>`;}
  let path="",area="",dots="",labels="";
  series.forEach((s,i)=>{
    if(s.v===null||s.v===undefined)return;
    const x=X(i),y=Y(s.v);
    path+=(path?" L":"M")+x.toFixed(1)+" "+y.toFixed(1);
    dots+=`<circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"><title>${esc(s.l)} : ${s.v}${o.unit||""}</title></circle>`;
  });
  if(path){const f=series.findIndex(s=>s.v!=null),l=series.length-1-[...series].reverse().findIndex(s=>s.v!=null);area=`<path class="area" d="${path} L${X(l).toFixed(1)} ${pt+ih} L${X(f).toFixed(1)} ${pt+ih} Z"/>`;}
  series.forEach((s,i)=>{if(n<=7||i%Math.ceil(n/6)===0)labels+=`<text x="${X(i).toFixed(1)}" y="${H-pb+14}" text-anchor="middle">${esc(s.l)}</text>`;});
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"courbe")}">${g}<line class="axis" x1="${pl}" x2="${W-pr}" y1="${pt+ih}" y2="${pt+ih}"/>${area}<path class="line" d="${path}"/>${dots}${labels}</svg>`;
}
function svgDonut(parts,opts){
  const o=opts||{},R=52,r=34,C=2*Math.PI*((R+r)/2),tot=parts.reduce((s,p)=>s+p.v,0)||1;
  let off=0;
  const arcs=parts.map(p=>{const len=C*p.v/tot;const s=`<circle r="${(R+r)/2}" cx="70" cy="70" fill="none" stroke="${p.c}" stroke-width="${R-r}" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 70 70)"><title>${esc(p.l)} : ${p.v}</title></circle>`;off+=len;return s;}).join("");
  return `<div style="display:flex;align-items:center;gap:var(--sp6);flex-wrap:wrap"><svg class="chart" viewBox="0 0 140 140" style="width:140px;flex:0 0 140px" role="img" aria-label="${esc(o.aria||"répartition")}">${arcs}<text x="70" y="66" text-anchor="middle" style="font-size:20px;fill:var(--tx);font-weight:700">${tot===1&&!parts.some(p=>p.v)?0:parts.reduce((s,p)=>s+p.v,0)}</text><text x="70" y="82" text-anchor="middle">${esc(o.center||"")}</text></svg>
    <div class="chart-legend" style="flex-direction:column;gap:var(--sp2)">${parts.map(p=>`<span><i style="background:${p.c}"></i>${esc(p.l)} · <b style="color:var(--tx)">${p.v}</b></span>`).join("")}</div></div>`;
}

function renderStats(){
  const kp=document.getElementById("statsKpis"),ch=document.getElementById("statsCharts");
  if(!kp||!ch)return;
  const nW=parseInt((document.getElementById("statsRange")||{}).value||"12",10)||12;
  const weeks=statsWeeks(nW),months=statsMonths(Math.max(6,Math.round(nW/4)));
  const eff=activeMembers();
  _statsSeries={};

  /* taux de rapports par semaine (semaine courante exclue : elle n'est pas finie) */
  const rep=weeks.slice(0,-1).map(wk=>{const r=statsReportRate(wk);return {l:fmtDate(wk).replace(/ \d{4}$/,""),v:r.rate,due:r.due,done:r.done,wk};});
  _statsSeries.rapports=rep.map(x=>({semaine:x.wk,attendus:x.due,rendus:x.done,taux:x.rate}));
  const lastRates=rep.filter(x=>x.v!==null).slice(-4);
  const moy=lastRates.length?Math.round(lastRates.reduce((s,x)=>s+x.v,0)/lastRates.length*10)/10:null;

  /* par mois : formations, entrainements, CMD, blames */
  const cnt=(arr,field,test)=>months.map(k=>({l:statsMonthLabel(k),v:(arr||[]).filter(x=>statsMonthKey(x[field]||x.created_at)===k&&(!test||test(x))).length,k}));
  const sF=cnt(state.formations,"date"),sE=cnt(state.activites,"date"),sC=cnt(cmdVraiesMissions(),"date"),sB=cnt(state.blames,"created_at");
  _statsSeries.activite=months.map((k,i)=>({mois:k,formations:sF[i].v,entrainements:sE[i].v,cmd:sC[i].v,blames:sB[i].v}));

  /* repartition par grade et par statut */
  const grades=GRADE_ORDER.map(g=>({l:g,v:eff.filter(m=>m.grade===g).length,c:GRADE_COLORS[g]})).filter(x=>x.v);
  const statut=[{l:"Présents",v:eff.filter(m=>m.status==="present").length,c:"var(--gr)"},{l:"Absents",v:eff.filter(m=>m.status==="absent").length,c:"var(--or)"},
    {l:"Réserve",v:(state.members||[]).filter(m=>(m.categorie||"effectif")==="reserve").length,c:"var(--dm)"}];
  _statsSeries.effectif=grades.map(g=>({grade:g.l,membres:g.v}));

  const absAct=(state.absences||[]).filter(a=>{const t=ymdLocal(new Date());return a.start_date<=t&&t<=a.end_date;}).length;
  const kpi=(l,v,s,c,ic)=>`<div class="kpi" style="--kc:${c}"><span class="ic">${navIconHtml(ic)}</span><span class="v">${v}</span><span class="l">${esc(l)}</span><span class="s">${esc(s||"")}</span></div>`;
  kp.innerHTML=kpi("Effectif",eff.length,"cible "+effectifCible(),"var(--ac)","users")
    +kpi("Taux de rapports",moy===null?"-":moy+" %","moyenne 4 dernières semaines",moy===null?"var(--dm)":(moy>=90?"var(--gr)":moy>=60?"var(--or)":"var(--rd)"),"file-check")
    +kpi("Blâmes actifs",(state.blames||[]).filter(b=>!b.resolved).length,"sur "+(state.blames||[]).length+" au total","var(--rd)","alert-triangle")
    +kpi("Formations",(state.formations||[]).filter(f=>f.statut==="Validé").length,"validées depuis le début","var(--gr)","graduation-cap")
    +kpi("Entraînements",(state.activites||[]).length,"séances enregistrées","var(--ac)","target")
    +kpi("Absences en cours",absAct,"aujourd'hui",absAct?"var(--or)":"var(--gr)","clock");

  const panel=(t,inner,legend)=>`<section class="panel"><div class="panel-head"><h3><span class="pk">//</span> ${t}</h3></div><div class="panel-body">${inner}${legend||""}</div></section>`;
  ch.innerHTML=panel("Taux de rapports rendus par semaine",svgLine(rep,{unit:"%",max:100,aria:"taux de rapports par semaine"}))
    +panel("Répartition par grade",grades.length?svgDonut(grades,{center:"membres",aria:"répartition par grade"}):'<div class="chart-empty">Aucun membre dans l\'effectif.</div>')
    +panel("Formations par mois",svgBars(sF.map(x=>({...x,c:"var(--gr)"})),{aria:"formations par mois"}))
    +panel("Entraînements et tâches par mois",svgBars(sE.map(x=>({...x,c:"var(--ac)"})),{aria:"entraînements par mois"}))
    +panel("CMD de mission par mois",svgBars(sC.map(x=>({...x,c:"var(--vi)"})),{aria:"CMD par mois"}))
    +panel("Blâmes par mois",svgBars(sB.map(x=>({...x,c:"var(--rd)"})),{aria:"blâmes par mois"}))
    +panel("Disponibilité",svgDonut(statut,{center:"membres",aria:"présents, absents, réserve"}));
  lucideRefresh(ch);
}

function statsExport(){
  const lines=[];
  const push=(title,rows)=>{if(!rows||!rows.length)return;lines.push("# "+title);lines.push(Object.keys(rows[0]).join(";"));rows.forEach(r=>lines.push(Object.values(r).map(v=>v===null||v===undefined?"":String(v).replace(/;/g,",")).join(";")));lines.push("");};
  push("Rapports par semaine",_statsSeries.rapports);push("Activité par mois",_statsSeries.activite);push("Effectif par grade",_statsSeries.effectif);
  if(!lines.length){toast("Rien à exporter","info");return;}
  const blob=new Blob(["﻿"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="arc-alpha-statistiques-"+ymdLocal(new Date())+".csv";
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  toast("Export CSV téléchargé","success");
}
