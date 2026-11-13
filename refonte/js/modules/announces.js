/* ARC ALPHA - Module announces. */
function openAnnounceModal(){
  const _f=document.getElementById("anDiscordField");
  if(_f) _f.style.display=state.discord.annonces?"":"none";document.getElementById("announceModal").classList.add("show");}


function renderAnnounces(){
  const el=document.getElementById("announceList");if(!el)return;
  if(!state.announces.length){el.innerHTML='<div class="empty"><p>Aucune annonce</p></div>';return;}
  const canDel=canEdit("announces");
  el.innerHTML=[...state.announces].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)).map(a=>`
    <div class="ann ${a.pinned?"pin":""}">
      <div class="ann-ico">
        ${a.pinned?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20z"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>'}
      </div>
      <div class="ann-c">
        <div class="ann-t">${esc(a.title)||"Sans titre"}${a.pinned?'<span class="ann-pinbadge">ÉPINGLÉ</span>':""}</div>
        <div class="ann-d">${esc(a.content)||""}</div>
        <div class="ann-meta">${fmtDate(a.created_at)}
          ${canDel?`<button class="sbtn danger" style="margin-left:.8rem;padding:.2rem .5rem;font-size:.74rem" onclick="deleteAnnounce('${escJs(a.id)}')">Supprimer</button>`:""}
        </div>
      </div>
    </div>`).join("");
}

async function saveAnnounce(){
  if(!canEdit("announces")){toast("Accès insuffisant","error");return;}
  const title=document.getElementById("anTitle").value.trim();
  const content=document.getElementById("anContent").value.trim();
  const pinned=document.getElementById("anType").value==="pin";
  if(!title)return fieldError("anTitle","Donne un titre à l'annonce.");
  if(!content)return fieldError("anContent","Le contenu est vide.");
  const obj={title,content,pinned};
  if(supaOK){const r=await supaPost(T.announce,obj);if(r&&r.length>0)state.announces.unshift(r[0]);else{toast("Enregistrement refusé par la base. L'annonce n'a pas été publiée.","error");return;}}
  else{obj.id=Date.now().toString();state.announces.unshift(obj);saveLS();}
  closeModal("announceModal");["anTitle","anContent"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});renderAnnounces();toast("Annonce publiée","success");
  await logActivity(`${session?.user} a publié l'annonce "${title}"`);
  const _dsc=document.getElementById("anDiscord");
  if(state.discord.annonces && _dsc && _dsc.checked){
    await discordConfirmSend("annonces",discordAnnoncePayload(title,content,pinned,session?.user));
  }
}

async function deleteAnnounce(id){
  if(!canEdit("announces")){toast("Accès insuffisant","error");return;}
  if(!await uiConfirm({title:"Supprimer l'annonce",message:"Supprimer cette annonce ?",okText:"Supprimer",danger:true}))return;
  if(supaOK)await supaDelete(T.announce,`id=eq.${id}`);
  state.announces=state.announces.filter(a=>a.id!=id);if(!supaOK)saveLS();
  renderAnnounces();toast("Annonce supprimée","info");
}
