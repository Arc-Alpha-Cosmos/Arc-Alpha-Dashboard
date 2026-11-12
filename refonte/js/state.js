/* ARC ALPHA - Etat en memoire, index des membres, droits, regles metier (rapports, promotions). */
let _midxRef=null,_midxLen=-1,_midx=new Map();
function memberIndex(){
  const arr=state.members||[];
  if(_midxRef!==arr||_midxLen!==arr.length){
    _midxRef=arr;_midxLen=arr.length;
    _midx=new Map(arr.map(m=>[String(m.id),m]));
  }
  return _midx;
}
function memberById(id){
  if(id===null||id===undefined||id==="")return null;
  return memberIndex().get(String(id))||null;
}
function memberLabel(id,stored,fallback){
  const m=memberById(id);
  if(m)return `${m.matricule||"?"} ${m.nom||""}`.trim();
  return (stored==null?"":String(stored))||(fallback===undefined?"?":fallback);
}
function userById(id){
  if(id===null||id===undefined||id==="")return null;
  return (state.users||[]).find(x=>String(x.id)===String(id))||null;
}
function userByHash(hash){
  if(!hash)return null;
  return (state.users||[]).find(x=>x.user_hash===hash)||null;
}
function findUserByIdent(ident){
  if(!ident)return null;
  const list=state.users||[];
  return list.find(u=>u.display===ident)||list.find(u=>u.user_hash===cyrb53(ident))||null;
}
function userLabel(ref,stored){
  const u=userById(ref)||userByHash(ref);
  return (u&&u.display)||stored||"?";
}
function memberKey(id,stored){
  return (id===null||id===undefined||id==="")?("nom:"+(stored||"?")):("id:"+String(id));
}
function refreshMemberViews(){
  _midxRef=null;_midxLen=-1;
  syncSessionGrade();
  const meta=(typeof TAB_RENDER!=="undefined")&&TAB_RENDER[_activeTab];
  if(meta){
    const fn=window[meta.fn];
    if(typeof fn==="function"){try{fn();}catch(e){console.warn("refresh: "+meta.fn,e);}}
  }
}

const NAME_COPIES=[
  {table:T.blames,      arr:"blames",      idField:"member_id",          nameField:"member_name"},
  {table:T.absences,    arr:"absences",    idField:"member_id",          nameField:"member_name"},
  {table:T.reports,     arr:"reports",     idField:"member_id",          nameField:"member_name"},
  {table:T.cmdmissions, arr:"cmdmissions", idField:"member_id",          nameField:"member_name"},
  {table:T.tasks,       arr:"tasks",       idField:"assignee_member_id", nameField:"assignee_name"},
  {table:T.formations,  arr:"formations",  idField:"formateur_id",       nameField:"formateur"},
  {table:T.formations,  arr:"formations",  idField:"eleve_id",           nameField:"eleve"},
];
const USER_NAME_COPIES_BY_ID=[
  {table:T.tasks,     arr:"tasks",     idField:"assigned_by_id", nameField:"assigned_by"},
  {table:T.polls,     arr:"polls",     idField:"created_by_id",  nameField:"created_by"},
  {table:T.documents, arr:"documents", idField:"added_by_id",    nameField:"added_by"},
];
const USER_NAME_COPIES_BY_HASH=[
  {table:T.messages,  arr:"messages",  idField:"from_hash",  nameField:"from_name"},
  {table:T.messages,  arr:"messages",  idField:"to_hash",    nameField:"to_name"},
  {table:T.pollvotes, arr:"pollVotes", idField:"voter_hash", nameField:"voter_name"},
];
async function propagateCopies(specs,matchValue,label){
  if(matchValue===undefined||matchValue===null||matchValue==="")return;
  for(const c of specs){
    (state[c.arr]||[]).forEach(row=>{
      const v=row[c.idField];
      if(v!==null&&v!==undefined&&v!==""&&String(v)===String(matchValue))row[c.nameField]=label;
    });
    if(supaOK){
      try{ await supaPatch(c.table,`${c.idField}=eq.${encodeURIComponent(matchValue)}`,{[c.nameField]:label}); }
      catch(e){ /* colonne absente ou réseau : sans effet sur l'affichage */ }
    }
  }
}
function syncMemberNameCopies(m){
  if(!m||m.id===undefined||m.id===null)return Promise.resolve();
  return propagateCopies(NAME_COPIES,m.id,`${m.matricule||"?"} ${m.nom||""}`.trim());
}
async function syncUserNameCopies(user){
  if(!user)return;
  const label=user.display||"?";
  await propagateCopies(USER_NAME_COPIES_BY_ID,user.id,label);
  await propagateCopies(USER_NAME_COPIES_BY_HASH,user.user_hash,label);
}
const GRADE_LEVEL = {CMDM:7,CMD:6,VCMD:5,MAJ:4,CPT:3,LT:2,SGT:1,ARC:0};

function sessionMember(){
  if(!Auth.ok())return null;
  if(session.memberId!==null&&session.memberId!==undefined&&session.memberId!==""){
    const m=memberById(session.memberId);
    if(m)return m;
  }
  return (state.members||[]).find(m=>(m.user_hash&&m.user_hash===session.userHash)||(m.linked_user&&m.linked_user===session.userHash))||null;
}
function getSessionGrade(){
  if(!Auth.ok()) return null;
  if(session.role==="admin") return "ADMIN";
  const m=sessionMember();
  if(m&&m.grade) return m.grade;
  return session.grade||null;
}
function syncSessionGrade(){
  if(!Auth.ok())return false;
  return Auth.syncGrade();
}

function gradeLevel(g){
  if(g==="ADMIN") return 99;
  return GRADE_LEVEL[g]||0;
}

function canEdit(tab){
  if(!Auth.ok()) return false;
  if(session.role==="admin") return true;
  if(session.role==="brs") return false;
  if(session.role==="amiraute") return true;
  const g = getSessionGrade();
  const lvl = gradeLevel(g);

  const myTasks = getMyTasks();

  if(tab==="formations") return lvl>=1;
  if(tab==="entrainements") return lvl>=1;
  if(tab==="recrutements") return lvl>=2;

  if(lvl<2) return false;

  if(lvl===2){
    return tab==="cmd";
  }

  switch(tab){
    case "roster":
      return lvl>=4 || (lvl>=3 && myTasks.includes("effectif"));
    case "absences":
      return lvl>=3;
    case "reports":
      return lvl>=3;
    case "rapports":
      /* agir sur les comptes rendus tient à la tâche, pas au grade seul */
      return lvl>=3 && myTasks.includes("rapports");
    case "cmd":
      return lvl>=3;
    case "missions":
      /* le capitaine gère les missions sans avoir besoin d'une tâche :
         c'est lui qui anime le terrain */
      return lvl>=3;
    case "blames":
      return lvl>=4;
    case "announce":
    case "announces":
      return lvl>=3;
    case "documents":
      return lvl>=4;
    case "tasks":
      return lvl>=4;
    case "admin":
      return session.role==="admin";
    default:
      return false;
  }
}

function getMyTasks(){
  if(!session) return [];
  return state.tasks
    .filter(t=>t.active && (
      (t.assignee_hash && t.assignee_hash===session.userHash) ||
      (t.assignee_member_id && session.memberId && t.assignee_member_id==session.memberId)
    ))
    .map(t=>t.type);
}

const PROMO_RULES={
  ARC:  {days:10, cmd:0,   next:"SGT"},
  SGT:  {days:17, cmd:0,   next:"LT"},
  LT:   {days:20, cmd:1.5, next:"CPT"},
  CPT:  {days:25, cmd:3,   next:"MAJ"},
  MAJ:  {days:30, cmd:5,   next:"VCMD"},
  VCMD: {days:30, cmd:8,   next:"CMD"},
  CMD:  {days:null, cmd:null},
  CMDM: {days:null, cmd:null},
};

const REPORT_EXEMPT=["CMDM","CMD","VCMD","MAJ","CPT"];
function exemptPeriods(memberId){
  if(memberId===null||memberId===undefined||memberId==="")return[];
  return normPeriods((state.reportExempt||{})[String(memberId)]);
}
function normPeriods(raw){
  if(!raw)return[];
  const arr=Array.isArray(raw)?raw:[raw];
  return arr.filter(p=>p&&typeof p==="object").map(p=>({
    from:p.from||weekKeyOf(p.at||""),until:p.until||null,
    reason:p.reason||"",by:p.by||"?",by_id:p.by_id===undefined?null:p.by_id,
    at:p.at||null,lifted_by:p.lifted_by||null,lifted_at:p.lifted_at||null}));
}
function manualReportExemptFor(memberId,weekKey){
  const w=weekKey||getWeekKey(0);
  const list=exemptPeriods(memberId);
  for(let i=list.length-1;i>=0;i--){
    const p=list[i];
    if(p.from<=w&&(!p.until||w<p.until))return p;
  }
  return null;
}
const REPORT_RULES_SINCE="2026-09-14";
const ABSENCE_MIN_DAYS=4;
const REPORT_FREEZE_WEEKS=12;
function addDaysYmd(ymd,n){
  const d=new Date(String(ymd).slice(0,10)+"T00:00:00");
  d.setDate(d.getDate()+n);
  return ymdLocal(d);
}
function absenceForWeek(memberId,weekKey){
  if(weekKey<REPORT_RULES_SINCE)return absenceCoveringWeek(memberId,weekKey,0,true);
  const end=addDaysYmd(weekKey,6),id=String(memberId),days=new Set();
  let best=null,bestN=0;
  (state.absences||[]).forEach(a=>{
    if(String(a.member_id)!==id||!a.start_date||!a.end_date)return;
    const s=String(a.start_date).slice(0,10),e=String(a.end_date).slice(0,10);
    const from=s>weekKey?s:weekKey,to=e<end?e:end;
    if(from>to)return;
    let n=0;
    for(let d=from;d<=to;d=addDaysYmd(d,1)){days.add(d);n++;}
    if(n>bestN){best=a;bestN=n;}
  });
  if(days.size<ABSENCE_MIN_DAYS)return null;
  return{start_date:best.start_date,end_date:best.end_date,reason:best.reason||"",days:days.size};
}
function activityDay(row){
  const d=String(row&&row.date||"").slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(d))return d;
  if(row&&row.created_at){const c=new Date(row.created_at);if(!isNaN(c.getTime()))return ymdLocal(c);}
  return "";
}
function activityCreditFor(memberId,weekKey){
  if(weekKey<REPORT_RULES_SINCE)return null;
  const end=addDaysYmd(weekKey,6),id=String(memberId);
  const inWeek=r=>{const d=activityDay(r);return !!d&&d>=weekKey&&d<=end;};
  if((state.formations||[]).some(f=>f.formateur_id!=null&&String(f.formateur_id)===id&&inWeek(f)))return "formation";
  /* On ne credite que de vraies missions : un ajustement de compteur ne vaut
     pas presence sur le terrain, et validerait sinon le rapport de la semaine. */
  if(cmdVraiesMissions().some(c=>String(c.member_id)===id&&inWeek(c)))return "cmd";
  if((state.activites||[]).some(a=>actIds(a).includes(id)&&inWeek(a)))return "entrainement";
  return null;
}
const CREDIT_SHORT={cmd:"Validé (CMD)",formation:"Validé (formation)",entrainement:"Validé (entraînement)"};
const CREDIT_LONG={cmd:"CMD de mission",formation:"formation donnée",entrainement:"entraînement suivi"};
const CREDIT_MINE={cmd:"ton CMD de mission",formation:"ta formation",entrainement:"ton entraînement"};
function frozenWeek(weekKey){
  const w=(state.reportWeeks||{})[weekKey];
  return w&&typeof w==="object"?w:null;
}
function reportWeekStatus(m,weekKey){
  const id=String(m.id);
  const row=(state.reports||[]).some(r=>String(r.member_id)===id&&r.week_key===weekKey);
  const snap=frozenWeek(weekKey);
  let listed,gradeEx,manEx,absEx,credit;
  if(snap){
    const f=snap[id]||null;
    listed=!!f;
    gradeEx=!!f&&f.s==="g";
    manEx=f&&f.s==="m"?(manualReportExemptFor(id,weekKey)||{by:f.by||"?",reason:f.r||"",at:null}):null;
    absEx=f&&f.s==="a"&&Array.isArray(f.a)?{start_date:f.a[0],end_date:f.a[1],days:f.a[2]||0,reason:f.r||""}:null;
    credit=f&&f.c||null;
  }else{
    listed=(m.categorie||"effectif")==="effectif";
    gradeEx=REPORT_EXEMPT.includes(m.grade);
    manEx=gradeEx?null:manualReportExemptFor(id,weekKey);
    absEx=(gradeEx||manEx)?null:absenceForWeek(id,weekKey);
    credit=activityCreditFor(id,weekKey);
  }
  const off=gradeEx||!!manEx||!!absEx;
  return{listed,frozen:!!snap,gradeEx,manEx,absEx,credit,row,off,due:listed&&!off,done:row||!!credit};
}
function reportDue(m,weekKey){
  return !!m&&reportWeekStatus(m,weekKey).due;
}
function canExemptReport(){
  if(!Auth.ok())return false;
  if(session.role==="brs")return false;
  if(session.role==="admin"||session.role==="amiraute")return true;
  return gradeLevel(getSessionGrade())>=4;
}
const REPORT_BLAME_HOURS=48;
const REPORT_AUTO_MARK="[AUTO-RAPPORT";


let session=null;
let supaOK=false;
let editMode=false;
let reportWeekOffset=0;
let pollCount=0;
let state={
  recOpen:true,maintenance:false,effectifCible:15,
  autoReport:true,autoReportSince:null,reportExempt:{},reportWeeks:{},manualTests:{},
  members:[],blames:[],missions:[],announces:[],users:[],activity:[],
  absences:[],reports:[],cmdmissions:[],documents:[],tasks:[],content:{},
  formations:[],activites:[],tickets:[],rapports:[],
  missionLib:[],missionRot:[],
  polls:[],pollVotes:[],
  discord:{annonces:"",promo:"",formations:"",recrutTrooper:"",recrutAlpha:"",recrutRoles:"",rapports:"",style:"detaille",botName:"",botAvatar:""},
  regiments:["501st","212th","327th","41st","104th","408th","65th"],
  reglement:"",
};


function activeMembers(){
  return state.members.filter(m=>(m.categorie||"effectif")==="effectif");
}
function sortMembers(arr){
  return[...arr].sort((a,b)=>{
    const ia=GRADE_ORDER.indexOf(a.grade),ib=GRADE_ORDER.indexOf(b.grade);
    return(ia===-1?99:ia)-(ib===-1?99:ib);
  });
}


function getEligibility(m){
  const rule=PROMO_RULES[m.grade];
  if(!rule||rule.days===null)return{eligible:null,reason:"Promotion manuelle",progress:null};
  const days=m.date_promo?Math.floor((new Date()-new Date(m.date_promo))/(1000*60*60*24)):null;
  const cmd=getCmdTotal(m.id);
  const needDays=rule.days,needCmd=rule.cmd;
  const okDays=days!==null&&days>=needDays;
  const okCmd=needCmd===0||cmd>=needCmd;
  const progress={
    days:days||0, needDays, daysPct:days!==null?Math.min(100,Math.round(days/needDays*100)):0,
    cmd, needCmd, cmdPct:needCmd>0?Math.min(100,Math.round(cmd/needCmd*100)):100,
    hasCmd:needCmd>0, nextGrade:rule.next||null
  };
  if(days===null)return{eligible:false,reason:`Date de promotion non renseignée`,progress};
  let reasons=[];
  if(!okDays)reasons.push(`${needDays-days}j restants (${days}/${needDays} jours)`);
  if(!okCmd)reasons.push(`${(needCmd-cmd).toFixed(1)} CMD manquants (${cmd}/${needCmd})`);
  return{eligible:okDays&&okCmd,reason:reasons.length?reasons.join(" | "):"Éligible à la promotion ✅",progress};
}

function isSensitiveLog(text){
  if(!text)return false;
  /* « compte rendu » n'est pas un compte utilisateur : on le neutralise avant
     de chercher les mots sensibles, sinon toute l'activité des comptes rendus
     disparaîtrait de la vue d'ensemble. */
  const t=text.toLowerCase().split("comptes rendus").join("~").split("compte rendu").join("~");
  const sensitive=["compte","mot de passe","rôle","role","blâme","blame","supprim",
    "promu","rétrograd","retrograd","remarque","blacklist","réserve","reserve",
    "profil","fiche","administrateur","menus","maintenance","dispens","assistant"];
  return sensitive.some(k=>t.includes(k));
}
