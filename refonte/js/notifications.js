/* ARC ALPHA - centre de notifications.
   Rien n'est stocke en base : les notifications sont deduites des donnees deja
   chargees (taches, rapports, comptes rendus, messages, annonces, promotions),
   avec les memes regles de droits que les onglets. L'etat « lu » vit dans le
   navigateur (uiPrefs), par identifiant stable de notification. */

let _notifOpen=false,_notifCache=[];

function notifReadSet(){ const l=uiPrefs.get("notifRead",[]); return new Set(Array.isArray(l)?l:[]); }
function notifSaveRead(set){ uiPrefs.set("notifRead",[...set].slice(-400)); }

/* Construit la liste. Chaque entree : {id, cat, title, sub, when, tab, color, icon}. */
function buildNotifications(){
  if(!Auth.ok())return [];
  const out=[], me=sessionMember(), now=Date.now();
  const lvl=(session.role==="admin"||session.role==="amiraute")?99:gradeLevel(getSessionGrade());
  const push=o=>out.push(o);

  if(me)(state.tasks||[]).forEach(t=>{
    if(!t.active)return;
    if(!((t.assignee_member_id!=null&&String(t.assignee_member_id)===String(me.id))||(t.assignee_hash&&t.assignee_hash===session.userHash)))return;
    const d=todoDue(t);
    push({id:"task:"+t.id,cat:"Tâches",title:t.title||"Tâche",sub:(t.assigned_by?"par "+t.assigned_by:"")+(d?(d.late?" · en retard":" · échéance "+fmtDate(d.date)):""),
      when:t.created_at,tab:"tasks",color:d&&d.late?"var(--rd)":"var(--vi)",icon:"check-square"});
  });

  if(me&&REPORT_EXEMPT.indexOf(me.grade)===-1){
    const esc_=reportEscalation(me);
    if(esc_&&!esc_.blamed)push({id:"rep:late:"+esc_.weekKey,cat:"Rapports",title:"Rapport de la semaine passée non rendu",
      sub:`${esc_.hoursLeft} h avant le blâme automatique`,when:new Date().toISOString(),tab:"reports",color:"var(--rd)",icon:"file-warning"});
    else{
      const wk=getWeekKey(0),st=reportWeekStatus(me,wk);
      if(st.due&&!st.done)push({id:"rep:due:"+wk,cat:"Rapports",title:"Rapport hebdomadaire à rendre",
        sub:"semaine du "+fmtDate(wk),when:wk,tab:"reports",color:"var(--or)",icon:"file-check"});
    }
  }

  try{
    if(canReviewRapport())rapPending().forEach(r=>push({id:"rap:p:"+r.id,cat:"Comptes rendus",title:"À valider : "+(r.titre||"compte rendu"),
      sub:"de "+(r.author_name||"?"),when:r.created_at,tab:"rapports",color:"var(--ye)",icon:"file-text"}));
    if(canWriteRapport())rapMine().filter(r=>rapStatut(r)==="refuse").forEach(r=>push({id:"rap:r:"+r.id+":"+(r.reviewed_at||""),cat:"Comptes rendus",
      title:"Refusé : "+(r.titre||"compte rendu"),sub:r.refus_motif?String(r.refus_motif).slice(0,80):"à reprendre",when:r.reviewed_at||r.created_at,tab:"rapports",color:"var(--rd)",icon:"file-x"}));
  }catch(e){}

  (state.announces||[]).filter(a=>a.pinned&&a.created_at&&now-new Date(a.created_at).getTime()<30*864e5)
    .forEach(a=>push({id:"ann:"+a.id,cat:"Annonces",title:a.title||"Annonce",sub:String(a.content||"").slice(0,80),when:a.created_at,tab:"announce",color:"var(--or)",icon:"megaphone"}));

  if(lvl>=GRADE_LEVEL.CPT){
    const n=countRapportsAVerifier();
    if(n)push({id:"unit:rep:"+getWeekKey(0)+":"+n,cat:"Unité",title:`${n} rapport${n>1?"s":""} en attente cette semaine`,sub:"semaine du "+fmtDate(getWeekKey(0)),when:getWeekKey(0),tab:"reports",color:"var(--or)",icon:"users"});
  }
  if(lvl>=GRADE_LEVEL.MAJ){
    const p=countEligiblesPromotion();
    if(p)push({id:"unit:promo:"+p,cat:"Unité",title:`${p} membre${p>1?"s":""} éligible${p>1?"s":""} à une promotion`,sub:"voir l'Effectif",when:ymdLocal(new Date()),tab:"roster",color:"var(--gr)",icon:"trending-up"});
  }

  const badge=document.getElementById("chatUnreadBadge");
  const unread=badge&&badge.style.display!=="none"?parseInt(badge.textContent||"0",10)||0:0;
  if(unread>0)push({id:"chat:"+unread,cat:"Messagerie",title:`${unread} message${unread>1?"s":""} non lu${unread>1?"s":""}`,sub:"ouvrir la messagerie",when:new Date().toISOString(),tab:"__chat",color:"var(--ac)",icon:"message-circle"});

  out.sort((a,b)=>String(b.when||"").localeCompare(String(a.when||"")));
  return out;
}

function notifUnreadCount(list){
  const read=notifReadSet();
  return (list||_notifCache).filter(n=>!read.has(n.id)).length;
}

function refreshNotifications(){
  const btn=document.getElementById("notifBtn"),cnt=document.getElementById("notifCount");
  if(!btn)return;
  if(!session){btn.style.display="none";if(_notifOpen)toggleNotifPanel(false);return;}
  btn.style.display="";
  _notifCache=buildNotifications();
  const n=notifUnreadCount(_notifCache);
  if(cnt){cnt.textContent=n>9?"9+":String(n);cnt.classList.toggle("show",n>0);}
  btn.setAttribute("aria-label",n?`Notifications, ${n} non lue${n>1?"s":""}`:"Notifications");
  if(_notifOpen)renderNotifPanel();
}

function renderNotifPanel(){
  const body=document.getElementById("notifBody"),foot=document.getElementById("notifFootTxt");
  if(!body)return;
  const read=notifReadSet(),list=_notifCache;
  if(!list.length){
    body.innerHTML=`<div class="notif-empty">${navIconHtml("bell-off")}<br>Rien à signaler. Tout est à jour.</div>`;
    if(foot)foot.textContent="";
    lucideRefresh(body);return;
  }
  const cats=[];const by={};
  list.forEach(n=>{if(!by[n.cat]){by[n.cat]=[];cats.push(n.cat);}by[n.cat].push(n);});
  body.innerHTML=cats.map(c=>`<div class="notif-cat">${esc(c)} <span style="opacity:.6">· ${by[c].length}</span></div>`+
    by[c].map(n=>`<button class="notif-item${read.has(n.id)?"":" unread"}" style="--nc:${n.color}" onclick="openNotif('${escJs(n.id)}')">
      <span class="ico">${navIconHtml(n.icon||"bell")}</span>
      <span class="w"><div class="notif-t">${esc(n.title)}</div><div class="notif-s">${esc(n.sub||"")}${n.when?" · "+esc(fmtRel(n.when)):""}</div></span>
    </button>`).join("")).join("");
  const n=notifUnreadCount(list);
  if(foot)foot.textContent=`${list.length} notification${list.length>1?"s":""} · ${n} non lue${n>1?"s":""}`;
  lucideRefresh(body);
}

function toggleNotifPanel(force){
  const p=document.getElementById("notifPanel");if(!p)return;
  _notifOpen=typeof force==="boolean"?force:!_notifOpen;
  p.classList.toggle("open",_notifOpen);
  const b=document.getElementById("notifBtn");
  if(b)b.setAttribute("aria-expanded",_notifOpen?"true":"false");
  if(_notifOpen){_notifCache=buildNotifications();renderNotifPanel();}
}

function openNotif(id){
  const n=_notifCache.find(x=>x.id===id);
  const read=notifReadSet();read.add(id);notifSaveRead(read);
  toggleNotifPanel(false);
  refreshNotifications();
  if(!n)return;
  if(n.tab==="__chat"){if(typeof toggleChatPanel==="function"&&!_chatOpen)toggleChatPanel();return;}
  goToTab(n.tab);
}

function markAllNotifRead(){
  const read=notifReadSet();
  _notifCache.forEach(n=>read.add(n.id));
  notifSaveRead(read);
  refreshNotifications();
  toast("Notifications marquées comme lues","info");
}

document.addEventListener("click",e=>{
  if(!_notifOpen)return;
  const p=document.getElementById("notifPanel"),b=document.getElementById("notifBtn");
  if(p&&!p.contains(e.target)&&b&&!b.contains(e.target))toggleNotifPanel(false);
});
