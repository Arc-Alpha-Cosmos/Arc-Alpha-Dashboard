/* ARC ALPHA - Module reglement. */
function renderReglement(){
  const el=document.getElementById("reglementDisplay");
  const btn=document.getElementById("reglementEditBtn");
  if(!el)return;
  const lvl=gradeLevel(getSessionGrade());
  const ok=Auth.ok()&&(session.role==="admin"||session.role==="amiraute"||(session.role!=="brs"&&lvl>=6));
  if(btn)btn.style.display=ok?"":"none";
  const html=state.reglement||"";
  if(!html.trim()){el.innerHTML='<div class="empty"><p>Aucun règlement défini.</p></div>';return;}
  el.innerHTML=sanitizeHtml(html);
}
function openReglementEditor(){
  const ed=document.getElementById("reglementEditor");
  if(ed)ed.innerHTML=sanitizeHtml(state.reglement||"");
  document.getElementById("reglementModal").classList.add("show");
  setTimeout(()=>{if(ed){ed.focus();try{document.execCommand("defaultParagraphSeparator",false,"p");}catch{}}},120);
}
async function saveReglement(){
  const lvl=gradeLevel(getSessionGrade());
  const ok=Auth.ok()&&(session.role==="admin"||session.role==="amiraute"||(session.role!=="brs"&&lvl>=6));
  if(!ok){toast("Accès réservé aux CMD+","error");return;}
  const html=sanitizeHtml(document.getElementById("reglementEditor").innerHTML);
  state.reglement=html;
  if(supaOK)await setConfig("reglement",html);
  closeModal("reglementModal");
  renderReglement();
  toast("Règlement enregistré","success");
  await logActivity(`${session?.user} a modifié le règlement`);
}
function rteExec(cmd,val){
  const ed=document.getElementById("reglementEditor");
  if(ed)ed.focus();
  try{document.execCommand(cmd,false,val||null);}catch{}
}
function rteColor(cmd,val){
  const ed=document.getElementById("reglementEditor");
  if(!ed)return;
  ed.focus();
  try{document.execCommand(cmd,false,val);}catch{}
}
function rteFontSize(px){
  const ed=document.getElementById("reglementEditor");
  if(!ed)return;
  ed.focus();
  try{
    document.execCommand("fontSize",false,"7");
    ed.querySelectorAll("font[size='7']").forEach(f=>{
      const sp=document.createElement("span");
      sp.style.fontSize=px+"px";
      sp.innerHTML=f.innerHTML;
      f.parentNode.replaceChild(sp,f);
    });
  }catch{}
}
