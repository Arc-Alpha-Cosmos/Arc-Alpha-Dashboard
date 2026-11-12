/* ARC ALPHA - Module polls. */
function canCreatePoll(){
  if(!Auth.ok())return false;
  if(session.role==="admin")return true;
  if(session.role==="brs")return false;
  if(session.role==="amiraute")return true;
  return gradeLevel(getSessionGrade())>=3;
}

function openPollModal(){
  if(!canCreatePoll()){toast("Réservé aux officiers CPT+","error");return;}
  document.getElementById("pollQuestion").value="";
  document.getElementById("pollOptions").value="";
  document.getElementById("pollModal").classList.add("show");
}

async function savePoll(){
  if(!canCreatePoll()){toast("Réservé aux CPT+","error");return;}
  const q=document.getElementById("pollQuestion").value.trim();
  const optsRaw=document.getElementById("pollOptions").value.trim();
  const dur=parseInt(document.getElementById("pollDuration").value);
  if(!q)return fieldError("pollQuestion","Pose une question.");
  const opts=optsRaw.split("\n").map(o=>o.trim()).filter(Boolean);
  if(opts.length<2||opts.length>6)return fieldError("pollOptions","Il faut entre 2 et 6 options, une par ligne.");
  const expiresAt=dur>0?new Date(Date.now()+dur*86400000).toISOString():null;
  const obj={question:q,options:JSON.stringify(opts),expires_at:expiresAt,
    created_by:session?.user||"?",created_by_id:session?.userId??null,active:true};
  if(supaOK){const r=await supaWriteOptional(T.polls,null,obj,["created_by_id"]);if(r&&r.length>0)state.polls.unshift(r[0]);else{toast("Enregistrement refusé par la base. Le sondage n'a pas été publié.","error");return;}}
  else{obj.id=Date.now().toString();state.polls.unshift(obj);saveLS();}
  closeModal("pollModal");
  renderPolls();
  toast("Sondage publié","success");
  await logActivity("Sondage \""+q+"\" publié par "+session?.user);
}

function getPollOptions(poll){
  try{return JSON.parse(poll.options);}catch{return[];}
}

function getPollVotes(pollId){
  return state.pollVotes.filter(v=>v.poll_id==pollId);
}

function getMyVote(pollId){
  if(!Auth.ok())return null;
  const v=state.pollVotes.find(v=>v.poll_id==pollId&&v.voter_hash===session.userHash);
  return v?v.option_index:null;
}

function isPollExpired(poll){
  if(!poll.expires_at)return false;
  return new Date(poll.expires_at)<new Date();
}

async function votePoll(pollId,optionIndex){
  if(!session){toast("Connecte-toi pour voter","error");return;}
  const poll=state.polls.find(p=>p.id==pollId);
  if(!poll||!poll.active||isPollExpired(poll)){toast("Sondage clos","error");return;}
  const existing=state.pollVotes.find(v=>v.poll_id==pollId&&v.voter_hash===session.userHash);
  if(existing){
    existing.option_index=optionIndex;
    if(supaOK)await supaPatch(T.pollvotes,"id=eq."+existing.id,{option_index:optionIndex});
    else saveLS();
  } else {
    const obj={poll_id:pollId,voter_hash:session.userHash,voter_name:session.user,option_index:optionIndex};
    if(supaOK){const r=await supaPost(T.pollvotes,obj);if(r&&r.length>0)state.pollVotes.push(r[0]);else{toast("Vote refusé par la base, réessaie.","error");return;}}
    else{obj.id=Date.now().toString();state.pollVotes.push(obj);saveLS();}
  }
  renderPolls();
  toast("Vote enregistré","success");
}

async function closePoll(pollId){
  if(!canCreatePoll()){toast("Réservé aux CPT+","error");return;}
  if(!await uiConfirm({title:"Clôturer le sondage",message:"Clôturer ce sondage ? Plus aucun vote ne sera possible.",okText:"Clôturer"}))return;
  if(supaOK)await supaPatch(T.polls,"id=eq."+pollId,{active:false});
  const p=state.polls.find(x=>x.id==pollId);
  if(p){p.active=false;if(!supaOK)saveLS();}
  renderPolls();
  toast("Sondage clos","info");
}

async function deletePoll(pollId){
  if(!canCreatePoll()){toast("Réservé aux CPT+","error");return;}
  if(!await uiConfirm({title:"Supprimer le sondage",message:"Supprimer ce sondage et tous ses votes ?",okText:"Supprimer",danger:true}))return;
  if(supaOK){
    await supaDelete(T.polls,"id=eq."+pollId);
    await supaDelete(T.pollvotes,"poll_id=eq."+pollId);
  }
  state.polls=state.polls.filter(p=>p.id!=pollId);
  state.pollVotes=state.pollVotes.filter(v=>v.poll_id!=pollId);
  if(!supaOK)saveLS();
  renderPolls();
  toast("Sondage supprimé","info");
}

function renderPolls(){
  const addBtn=document.getElementById("addPollBtn");
  if(addBtn)addBtn.style.display=canCreatePoll()?"":"none";
  const el=document.getElementById("pollsList");
  if(!el)return;
  if(!state.polls.length){el.innerHTML='<div class="empty"><p>Aucun sondage actif</p></div>';return;}
  const sorted=[...state.polls].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const canManage=canCreatePoll();
  el.innerHTML=sorted.map(poll=>{
    const opts=getPollOptions(poll);
    const votes=getPollVotes(poll.id);
    const total=votes.length;
    const myVote=getMyVote(poll.id);
    const expired=isPollExpired(poll);
    const closed=!poll.active||expired;
    const counts=opts.map((_,i)=>votes.filter(v=>v.option_index===i).length);
    const maxCount=Math.max(1,...counts);

    return `<div class="mb6 panel">
      <div class="panel-head">
        <h3><span class="pk">//</span> ${esc(poll.question)}</h3>
        <span style="font-family:var(--fm);font-size:.62rem;color:${closed?"var(--rd)":"var(--gr)"};letter-spacing:.08em">
          ${closed?"● CLOS":"● ACTIF"}
        </span>
      </div>
      <div class="panel-body">
        ${opts.map((opt,i)=>{
          const cnt=counts[i];
          const pct=total>0?Math.round(cnt/total*100):0;
          const barPct=maxCount>0?(cnt/maxCount*100):0;
          const isMine=myVote===i;
          return `<div style="margin-bottom:.7rem">
            <div onclick="${closed?"":"votePoll(\'"+escJs(poll.id)+"\',"+i+")"}"
              style="cursor:${closed?"default":"pointer"};padding:.6rem .8rem;border:1px solid ${isMine?"var(--ac)":"var(--ln)"};
              background:${isMine?"rgba(0,229,255,.06)":"var(--s2)"};position:relative;overflow:hidden;transition:all .2s">
              <div style="position:absolute;left:0;top:0;bottom:0;width:${barPct}%;background:rgba(0,229,255,.08);transition:width .4s"></div>
              <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:.85rem;color:${isMine?"var(--ac)":"var(--tx)"}">
                  ${isMine?"✓ ":""}${esc(opt)}
                </span>
                <span class="mono-dm">${cnt} vote${cnt>1?"s":""} (${pct}%)</span>
              </div>
            </div>
          </div>`;
        }).join("")}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.8rem;padding-top:.6rem;border-top:1px solid var(--ln)">
          <span style="font-family:var(--fm);font-size:.65rem;color:var(--dm)">
            ${total} vote${total>1?"s":""} · Par ${esc(userLabel(poll.created_by_id,poll.created_by))}${poll.expires_at?" · Expire le "+fmtDate(poll.expires_at):""}
          </span>
          ${canManage?`<div style="display:flex;gap:.4rem">
            ${!closed?`<button class="sbtn" style="padding:.2rem .5rem;font-size:.6rem" onclick="closePoll('${escJs(poll.id)}')">Clore</button>`:""}
            <button class="sbtn danger" style="padding:.2rem .5rem;font-size:.6rem" onclick="deletePoll('${escJs(poll.id)}')">Supprimer</button>
          </div>`:""}
        </div>
      </div>
    </div>`;
  }).join("");
}
