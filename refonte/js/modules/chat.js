/* ARC ALPHA - Module chat. */
let _chatOpen=false,_chatWith=null,_chatPollTimer=null,_chatBadgeTimer=null,_chatLastCount=-1,_chatPrevUnread=0;
function chatSmartTime(dateStr){
  if(!dateStr)return"";
  const d=new Date(dateStr),now=new Date(),diff=(now-d)/1000;
  if(diff<60)return"à l'instant";
  if(diff<3600)return"il y a "+Math.floor(diff/60)+" min";
  const sameDay=d.toDateString()===now.toDateString();
  const y=new Date(now);y.setDate(y.getDate()-1);
  const isYest=d.toDateString()===y.toDateString();
  const hm=d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  if(sameDay)return hm;
  if(isYest)return"hier "+hm;
  return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})+" "+hm;
}
function chatSoundOn(){return localStorage.getItem("chatSoundOff")!=="1";}
function toggleChatSound(){
  localStorage.setItem("chatSoundOff",chatSoundOn()?"1":"0");
  applyChatSoundBtn();
  if(chatSoundOn())playChatSound();
}
function applyChatSoundBtn(){
  const b=document.getElementById("chatSoundBtn");
  if(!b)return;
  const on=chatSoundOn();
  b.title=on?"Son activé":"Son coupé";
  b.textContent=on?"🔔":"🔕";
}
function playChatSound(){
  if(!chatSoundOn())return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const ctx=new AC();const o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.type="sine";o.frequency.setValueAtTime(880,ctx.currentTime);
    o.frequency.setValueAtTime(1320,ctx.currentTime+.08);
    g.gain.setValueAtTime(.0001,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.14,ctx.currentTime+.02);
    g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.28);
    o.start();o.stop(ctx.currentTime+.3);
    setTimeout(()=>{try{ctx.close();}catch{}},400);
  }catch{}
}

function userMetaByHash(hash){
  const u=state.users.find(x=>x.user_hash===hash);
  if(!u)return{hash,name:"?",role:"",grade:"",mat:""};
  const m=state.members.find(x=>x.id==u.member_id);
  return{hash,name:u.display||"?",role:u.role,grade:m?.grade||u.grade||"",mat:m?.matricule||""};
}
function chatOtherUsers(){
  if(!Auth.ok())return[];
  return state.users.filter(u=>u.user_hash!==session.userHash)
    .map(u=>userMetaByHash(u.user_hash))
    .sort((a,b)=>a.name.localeCompare(b.name));
}
function toggleChatPanel(){
  const p=document.getElementById("chatPanel");
  _chatOpen=!_chatOpen;
  p.classList.toggle("open",_chatOpen);
  if(_chatOpen){chatShowList();}
  else{_chatWith=null;clearInterval(_chatPollTimer);_chatPollTimer=null;}
}
async function chatShowList(){
  _chatWith=null;clearInterval(_chatPollTimer);_chatPollTimer=null;
  document.getElementById("chatBackBtn").style.display="none";
  document.getElementById("chatInputRow").style.display="none";
  const _del=document.getElementById("chatDeleteBtn");if(_del)_del.style.display="none";
  document.getElementById("chatKicker").textContent="// MESSAGERIE";
  document.getElementById("chatTitle").textContent="Conversations";
  const body=document.getElementById("chatBody");
  const newBtn=`<div class="chat-newconv" onclick="chatShowNewDiscussion()">
    <i data-lucide="plus"></i>
    Nouvelle discussion</div>`;
  body.innerHTML=newBtn+'<div class="chat-empty">Chargement…</div>';
  let convs=[];
  if(supaOK){
    const rows=await chatMine();
    if(rows){
      const seen=new Map();
      for(const m of rows){
        const other=m.from_hash===session.userHash?m.to_hash:m.from_hash;
        if(!seen.has(other)){
          seen.set(other,{hash:other,last:m.content,time:m.created_at,fromMe:m.from_hash===session.userHash,unread:0});
        }
        if(m.to_hash===session.userHash&&m.from_hash===other&&!m.read)seen.get(other).unread++;
      }
      convs=[...seen.values()];
    }
  }
  if(!convs.length){
    body.innerHTML=newBtn+'<div class="chat-empty">Aucune conversation pour le moment.<br>Clique sur « Nouvelle discussion » pour en démarrer une. 🫡</div>';
    return;
  }
  body.innerHTML=newBtn+convs.map(c=>{
    const u=userMetaByHash(c.hash);
    const t=c.time?new Date(c.time).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})+" "+new Date(c.time).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):"";
    const preview=(c.fromMe?"Toi : ":"")+(c.last||"");
    return`<div class="chat-user" onclick="openConversation('${escJs(c.hash)}')">
      <div class="chat-user-av" style="background:${roleAvatarColor(u.role,u.grade)}">${esc((u.name[0]||"?").toUpperCase())}</div>
      <div class="chat-user-info">
        <div class="chat-user-name">${esc(u.name)}${c.unread?`<span class="chat-unread-pill">${c.unread>9?"9+":c.unread}</span>`:""}</div>
        <div class="chat-user-preview ${c.unread?"unread":""}">${escTrunc(preview,38)}</div>
      </div>
      <div class="chat-user-time">${t}</div>
      <button class="chat-user-del" title="Supprimer la conversation"
        aria-label="Supprimer la conversation" onclick="event.stopPropagation();deleteConversation('${escJs(c.hash)}')"><i data-lucide="trash-2"></i></button>
    </div>`;
  }).join("");
}
function chatShowNewDiscussion(){
  _chatWith=null;clearInterval(_chatPollTimer);_chatPollTimer=null;
  document.getElementById("chatBackBtn").style.display="";
  document.getElementById("chatInputRow").style.display="none";
  document.getElementById("chatKicker").textContent="// NOUVELLE DISCUSSION";
  document.getElementById("chatTitle").textContent="Choisir un membre";
  renderChatPicker("");
  setTimeout(()=>{try{document.getElementById("chatPickerSearch").focus();}catch{}},60);
}
function renderChatPicker(q){
  const body=document.getElementById("chatBody");
  const ql=(q||"").trim().toLowerCase();
  let others=chatOtherUsers();
  if(ql)others=others.filter(u=>[u.name,u.mat,u.grade].some(v=>v&&String(v).toLowerCase().includes(ql)));
  const searchBar=`<div class="chat-picker-search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input type="text" id="chatPickerSearch" placeholder="Rechercher un membre…" value="${esc(q||"")}" oninput="renderChatPicker(this.value)">
  </div>`;
  if(!others.length){body.innerHTML=searchBar+'<div class="chat-empty">Aucun membre trouvé.</div>';return;}
  body.innerHTML=searchBar+others.map(u=>`
    <div class="chat-user" onclick="openConversation('${escJs(u.hash)}')">
      <div class="chat-user-av" style="background:${roleAvatarColor(u.role,u.grade)}">${esc((u.name[0]||"?").toUpperCase())}</div>
      <div class="chat-user-info">
        <div class="chat-user-name">${esc(u.name)}</div>
        <div class="chat-user-sub">${u.mat?esc(u.mat)+" · ":""}${u.grade?esc(u.grade):({admin:"ADMIN",amiraute:"AMIRAUTÉ",brs:"BRS"}[u.role]||"")}</div>
      </div>
    </div>`).join("");
}
async function openConversation(hash){
  const u=userMetaByHash(hash);
  if(!u||u.name==="?")return;
  _chatWith=hash;
  document.getElementById("chatBackBtn").style.display="";
  document.getElementById("chatInputRow").style.display="";
  const _del=document.getElementById("chatDeleteBtn");if(_del)_del.style.display="";
  document.getElementById("chatKicker").textContent="// CONVERSATION";
  document.getElementById("chatTitle").textContent=u.name+(u.mat?" · "+u.mat:"");
  document.getElementById("chatBody").innerHTML='<div class="chat-empty">Chargement…</div>';
  await loadConversation(true);
  clearInterval(_chatPollTimer);
  _chatPollTimer=setInterval(()=>{if(_chatWith)loadConversation(false);},4000);
  setTimeout(()=>{try{document.getElementById("chatInput").focus();}catch{}},80);
}
async function loadConversation(scrollForce){
  if(!session||!_chatWith)return;
  const me=session.userHash,other=_chatWith;
  let msgs=null;
  if(supaOK){
    const _all=await chatMine();
    msgs=_all===null?null:_all.filter(m=>(m.from_hash===me&&m.to_hash===other)||(m.from_hash===other&&m.to_hash===me)).sort((a,b)=>(a.created_at||"").localeCompare(b.created_at||""));
  }
  if(msgs===null)return;
  const body=document.getElementById("chatBody");
  const wasAtBottom=body.scrollHeight-body.scrollTop-body.clientHeight<40;
  if(!msgs.length){
    body.innerHTML='<div class="chat-empty">Aucun message pour le moment.<br>Lance la conversation ! 🫡</div>';
  }else{
    if(msgs.length!==_chatLastCount||scrollForce){
      _chatLastCount=msgs.length;
      body.innerHTML='<div class="chat-msgs">'+msgs.map(m=>{
        const mine=m.from_hash===me;
        const t=chatSmartTime(m.created_at);
        const seen=mine?`<span class="cb-seen ${m.read?"read":""}">${m.read?"✓✓":"✓"}</span>`:"";
        return`<div class="chat-bubble ${mine?"me":"them"}">${esc(m.content)}<span class="cb-time">${mine?"Toi":esc(userLabel(m.from_hash,m.from_name))} · ${t}${seen}</span></div>`;
      }).join("")+'</div>';
      if(wasAtBottom||scrollForce)body.scrollTop=body.scrollHeight;
    }
  }
  if(supaOK)chatMarkRead(other);
  refreshChatBadge();
}
/* ------------------------------------------------------------------
   Messages privés. Une fois la base verrouillée, on ne peut plus lire
   que ses propres conversations (arc_dms) et l'expéditeur est posé EN
   BASE (arc_send_message) : impossible de lire les messages d'autrui
   ni de se faire passer pour quelqu'un. Repli direct tant que les
   fonctions ne sont pas installées. ------------------------------ */
let _dmRpc=null; // null inconnu, true installé, false absent
async function chatMine(){
  if(_dmRpc!==false){
    const pr=(typeof Auth!=="undefined"&&Auth.proof)?Auth.proof():null;
    if(pr){
      const r=await supaRpc("arc_dms",{p_auth_hash:pr.uh,p_auth_pass:pr.ph});
      if(r.missing){_dmRpc=false;}
      else{_dmRpc=true;return (r.ok&&Array.isArray(r.data))?r.data:(r.ok?[]:null);}
    }
  }
  return await supaGet(T.messages,`or=(from_hash.eq.${session.userHash},to_hash.eq.${session.userHash})&order=created_at.desc&limit=400`);
}
async function chatSend(toHash,toName,content){
  if(_dmRpc!==false){
    const pr=(typeof Auth!=="undefined"&&Auth.proof)?Auth.proof():null;
    if(pr){
      const r=await supaRpc("arc_send_message",{p_auth_hash:pr.uh,p_auth_pass:pr.ph,
        p_to_hash:toHash,p_to_name:toName,p_content:content});
      if(!r.missing){_dmRpc=true;return !!r.ok;}
      _dmRpc=false;
    }
  }
  const obj={from_hash:session.userHash,from_name:session.user,to_hash:toHash,to_name:toName,content:content,read:false};
  return (await supaPost(T.messages,obj))!==null;
}
async function chatMarkRead(other){
  if(_dmRpc!==false){
    const pr=(typeof Auth!=="undefined"&&Auth.proof)?Auth.proof():null;
    if(pr){
      const r=await supaRpc("arc_mark_read",{p_auth_hash:pr.uh,p_auth_pass:pr.ph,p_other:other});
      if(!r.missing){_dmRpc=true;return;}
      _dmRpc=false;
    }
  }
  await supaPatch(T.messages,`to_hash=eq.${session.userHash}&from_hash=eq.${other}&read=eq.false`,{read:true});
}
async function sendChatMessage(){
  const inp=document.getElementById("chatInput");
  const txt=(inp.value||"").trim();
  if(!txt||!session||!_chatWith)return;
  const u=chatOtherUsers().find(x=>x.hash===_chatWith);
  inp.value="";
  if(supaOK){
    const sent=await chatSend(_chatWith,u?.name||"?",txt);
    if(!sent){toast("Message non envoyé (réseau)","error");inp.value=txt;return;}
  }
  _chatLastCount=-1;
  await loadConversation(true);
}
async function deleteConversation(hash){
  if(!session||!hash)return;
  const other=userMetaByHash(hash);
  const ok=await uiConfirm({
    kicker:"// MESSAGERIE",
    title:"Supprimer la conversation",
    message:`Supprimer tous les messages échangés avec ${other.name} ?\n\nIls disparaîtront aussi chez votre interlocuteur. Cette action est définitive.`,
    okText:"Supprimer",cancelText:"Annuler",danger:true});
  if(!ok)return;
  const me=session.userHash;
  if(supaOK){
    const filter=`or=(and(from_hash.eq.${me},to_hash.eq.${hash}),and(from_hash.eq.${hash},to_hash.eq.${me}))`;
    const done=await supaDelete(T.messages,filter);
    if(!done){toast("Suppression impossible - réessaie","error");return;}
  }
  if(_chatWith===hash){_chatWith=null;}
  _chatLastCount=-1;
  clearInterval(_chatPollTimer);_chatPollTimer=null;
  await chatShowList();
  refreshChatBadge(true);
  toast("Conversation supprimée","info");
}

async function refreshChatBadge(silent){
  if(!session||!supaOK)return;
  const _mine=await chatMine();
  const rows=_mine===null?null:_mine.filter(m=>m.to_hash===session.userHash&&!m.read);
  if(rows===null)return;
  const relevant=rows.filter(r=>r.from_hash!==_chatWith);
  const count=relevant.length;
  const b=document.getElementById("chatUnreadBadge");
  if(b){b.textContent=count>9?"9+":count;b.style.display=count>0?"flex":"none";}
  if(!silent&&count>_chatPrevUnread&&_chatPrevUnread>=0){
    const senders=[...new Set(relevant.map(r=>r.from_hash))];
    const who=senders.length===1?userMetaByHash(senders[0]).name:senders.length+" personnes";
    playChatSound();
    toast(`💬 Nouveau message de ${who}`,"info");
  }
  _chatPrevUnread=count;
}
function startChat(){
  const fab=document.getElementById("chatFab");
  if(!session){if(fab)fab.style.display="none";return;}
  if(fab)fab.style.display="flex";
  _chatPrevUnread=-1;
  applyChatSoundBtn();
  refreshChatBadge(true);
  clearInterval(_chatBadgeTimer);
  _chatBadgeTimer=setInterval(refreshChatBadge,15000);
}
function stopChat(){
  const fab=document.getElementById("chatFab");
  if(fab)fab.style.display="none";
  const p=document.getElementById("chatPanel");
  if(p)p.classList.remove("open");
  _chatOpen=false;_chatWith=null;
  clearInterval(_chatPollTimer);clearInterval(_chatBadgeTimer);
  _chatPollTimer=null;_chatBadgeTimer=null;
}
