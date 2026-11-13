/* ARC ALPHA - Module documents. */
function openDocModal(){
  if(!canEdit("documents")){toast("Accès insuffisant","error");return;}
  document.getElementById("docModal").classList.add("show");
}
async function saveDoc(){
  if(!canEdit("documents")){toast("Réservé aux MAJ+","error");return;}
  const title=document.getElementById("docTitle").value.trim();
  const url=document.getElementById("docUrl").value.trim();
  const cat=document.getElementById("docCat").value;
  const access=document.getElementById("docAccess").value;
  const desc=document.getElementById("docDesc").value.trim();
  if(!title)return fieldError("docTitle","Le titre est requis.");
  if(!url)return fieldError("docUrl","Le lien est requis.");
  try{ if(["http:","https:"].indexOf(new URL(url).protocol)===-1)throw 0; }catch(e){ return fieldError("docUrl","Le lien doit commencer par http:// ou https://."); }
  const obj={title,url,category:cat,min_grade:access,description:desc,
    added_by:session?.user||"?",added_by_id:session?.userId??null};
  if(supaOK){const r=await supaWriteOptional(T.documents,null,obj,["added_by_id"]);if(r&&r.length>0)state.documents.unshift(r[0]);else{toast("Enregistrement refusé par la base. Le document n'a pas été ajouté.","error");return;}}
  else{obj.id=Date.now().toString();state.documents.unshift(obj);saveLS();}
  closeModal("docModal");
  ["docTitle","docUrl","docDesc"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
  renderDocuments();
  toast("Document ajouté","success");
  await logActivity((session?.user||"?")+" a ajouté le document '"+title+"'");
}
function canSeeDoc(doc){
  if(!Auth.ok())return false;
  if(session.role==="admin")return true;
  if(session.role==="brs"||session.role==="amiraute")return true;
  const g=getSessionGrade();
  const minLvl=GRADE_LEVEL[doc.min_grade]||0;
  return gradeLevel(g)>=minLvl;
}
function openDocUrl(id){
  const d=state.documents.find(x=>String(x.id)===String(id));
  if(!d||!d.url){toast("Lien indisponible","error");return;}
  let ok=false;
  try{ ok=["http:","https:"].includes(new URL(d.url,location.href).protocol); }catch{}
  if(!ok){toast("Lien invalide ou non sécurisé","error");return;}
  window.open(d.url,"_blank","noopener,noreferrer");
}


function renderDocuments(){
  const el=document.getElementById("docCategories");if(!el)return;
  const addBtn=document.getElementById("addDocBtn");
  if(addBtn)addBtn.style.display=canEdit("documents")?"":"none";
  const visible=state.documents.filter(d=>canSeeDoc(d));
  if(!visible.length){el.innerHTML='<div class="empty"><p>Aucun document disponible</p></div>';return;}
  const cats={};
  visible.forEach(d=>{if(!cats[d.category])cats[d.category]=[];cats[d.category].push(d);});
  const ci={"Formation":"📚","Règlement":"📋","Rapports":"📄","Missions":"🎯","Divers":"📁"};
  el.innerHTML=Object.entries(cats).map(([cat,docs])=>`
    <div class="mb7">
      <div class="sec-head" style="margin-top:0"><h2>${ci[cat]||"📁"} ${esc(cat)}</h2><span class="line"></span></div>
      <div class="grid g3">
        ${docs.map(d=>`<div class="ptr card" onclick="openDocUrl('${escJs(d.id)}')">
          <div class="card-k" style="display:flex;justify-content:space-between;gap:var(--sp3)"><span>${d.min_grade==="ARC"?"Tous les membres":esc(d.min_grade)+"+"}</span><span class="doc-type">${docTypeHtml(d.url)}</span></div>
          <div class="card-t" style="font-size:.82rem">${esc(d.title)}</div>
          ${d.description?`<div class="card-b" style="font-size:.8rem;margin-top:.3rem">${esc(d.description)}</div>`:""}
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.8rem;padding-top:.6rem;border-top:1px solid var(--ln)">
            <span style="font-family:var(--fm);font-size:.74rem;color:var(--ac)">↗ Ouvrir</span>
            ${canEdit("documents")?`<button class="icon-btn del" onclick="event.stopPropagation();deleteDoc('${escJs(d.id)}')" title="Supprimer" aria-label="Supprimer" style="width:24px;height:24px"><i data-lucide="trash-2"></i></button>`:""}
          </div>
        </div>`).join("")}
      </div>
    </div>`).join("");
}
async function deleteDoc(id){
  if(!canEdit("documents")){toast("Accès insuffisant","error");return;}
  if(!await uiConfirm({title:"Supprimer le document",message:"Supprimer ce document ?",okText:"Supprimer",danger:true}))return;
  if(supaOK)await supaDelete(T.documents,"id=eq."+id);
  state.documents=state.documents.filter(d=>d.id!=id);
  if(!supaOK)saveLS();
  renderDocuments();toast("Document supprimé","info");
}

/* Type de lien, pour savoir avant de cliquer si c'est un Google Doc, un PDF,
   une image ou une page. Lecture de l'adresse seulement. */
function docTypeHtml(url){
  const u=String(url||"").toLowerCase();
  const k=u.includes("docs.google.com/document")?["file-text","Google Doc"]
    :u.includes("docs.google.com/spreadsheets")?["table","Google Sheet"]
    :u.includes("docs.google.com/presentation")?["presentation","Google Slides"]
    :u.includes("drive.google.com")?["hard-drive","Drive"]
    :/\.pdf(\?|$)/.test(u)?["file-type","PDF"]
    :/\.(png|jpe?g|gif|webp)(\?|$)/.test(u)?["image","Image"]
    :u.includes("discord")?["message-square","Discord"]
    :u.includes("youtu")?["video","Vidéo"]:["link","Lien"];
  return navIconHtml(k[0])+" "+esc(k[1]);
}
