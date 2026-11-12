/* ARC ALPHA - Module tasks. */
const TASK_LABELS={effectif:"📋 Gérer l'effectif",presences:"✅ Gérer les présences",
  absences:"🕐 Gérer les absences",rapports:"📝 Gérer les rapports",
  missions:"🎯 Gérer les missions",custom:"⚡ Tâche personnalisée"};
const TASK_PERMDESC={effectif:"Débloque la modification de l'effectif",
  presences:"Débloque la gestion des présences",
  absences:"Débloque la gestion des absences",
  rapports:"Débloque la validation des rapports",
  missions:"Débloque la gestion des missions",custom:""};

function openTaskModal(){
  if(!canEdit("tasks")){toast("Accès insuffisant","error");return;}
  const sel=document.getElementById("taskAssignee");
  const officers=sortMembers(activeMembers()).filter(m=>(GRADE_LEVEL[m.grade]||0)>=3);
  sel.innerHTML='<option value="">Sélectionner…</option>'+
    officers.map(m=>`<option value="${m.id}">${esc(m.matricule)} - ${esc(m.nom)||"?"} (${esc(m.grade)})</option>`).join("");
  document.getElementById("taskModal").classList.add("show");
}
async function saveTask(){
  if(!canEdit("tasks")){toast("Réservé aux MAJ+","error");return;}
  const assigneeId=document.getElementById("taskAssignee").value;
  const type=document.getElementById("taskType").value;
  const customTitle=document.getElementById("taskCustomTitle").value.trim();
  const desc=document.getElementById("taskDesc").value.trim();
  if(!assigneeId)return fieldError("taskAssignee","Choisis l'officier concerné.");
  if(type==="custom"&&!customTitle)return fieldError("taskCustomTitle","Donne un titre à la tâche personnalisée.");
  const m=state.members.find(x=>x.id==assigneeId);
  const linkedUser=state.users.find(u=>u.member_id==assigneeId);
  const obj={
    assignee_member_id:assigneeId,
    assignee_name:m?m.matricule+" "+(m.nom||""):"?",
    assignee_hash:linkedUser?.user_hash||m?.user_hash||"",
    type,title:type==="custom"?customTitle:(TASK_LABELS[type]||type),
    description:desc||(TASK_PERMDESC[type]||""),
    active:true,assigned_by:session?.user||"?",assigned_by_id:session?.userId??null
  };
  if(supaOK){const r=await supaWriteOptional(T.tasks,null,obj,["assigned_by_id"]);if(r&&r.length>0)state.tasks.push(r[0]);else{toast("Enregistrement refusé par la base. La tâche n'a pas été assignée.","error");return;}}
  else{obj.id=Date.now().toString();state.tasks.push(obj);saveLS();}
  closeModal("taskModal");renderTasks();
  toast("Tâche assignée","success");
  await logActivity((session?.user||"?")+" a assigné la tâche '"+obj.title+"' à "+obj.assignee_name);
}
function renderTasks(){
  const addBtn=document.getElementById("addTaskBtn");
  if(addBtn)addBtn.style.display=canEdit("tasks")?"":"none";
  const g=getSessionGrade();const lvl=gradeLevel(g);
  const mySection=document.getElementById("myTasksSection");
  const myList=document.getElementById("myTasksList");
  if(mySection)mySection.style.display=lvl>=3||session?.role==="admin"?"block":"none";
  if(myList){
    const mine=state.tasks.filter(t=>
      (session?.memberId!=null&&t.assignee_member_id!=null&&String(t.assignee_member_id)===String(session.memberId))
      ||(session?.userHash&&t.assignee_hash===session.userHash));
    if(!mine.length){myList.innerHTML='<div class="empty"><p>Aucune tâche assignée</p></div>';}
    else myList.innerHTML=mine.map(t=>`<div class="ann" style="border-left-color:var(--ac)">
      <div class="c-ac ann-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
      <div class="ann-c"><div class="ann-t">${esc(t.title)}</div>
        <div class="ann-d">${esc(t.description)}</div>
        <div class="ann-meta">Assigné par ${esc(userLabel(t.assigned_by_id,t.assigned_by))} · ${fmtDate(t.created_at)}</div>
      </div></div>`).join("");
  }
  const allSection=document.getElementById("allTasksSection");
  const allList=document.getElementById("allTasksList");
  if(allSection)allSection.style.display=canEdit("tasks")?"block":"none";
  if(allList&&canEdit("tasks")){
    if(!state.tasks.length){allList.innerHTML='<div class="empty"><p>Aucune tâche créée</p></div>';}
    else{
      const byMember=new Map();
      state.tasks.forEach(t=>{
        const k=memberKey(t.assignee_member_id,t.assignee_name);
        if(!byMember.has(k))byMember.set(k,{id:t.assignee_member_id,stored:t.assignee_name,tasks:[]});
        byMember.get(k).tasks.push(t);
      });
      allList.innerHTML=[...byMember.values()].map(({id,stored,tasks})=>`
        <div class="mb6">
          <div style="font-family:var(--fs);font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tx);margin-bottom:.5rem;padding-bottom:.3rem;border-bottom:1px solid var(--ln)">${esc(memberLabel(id,stored))}</div>
          ${tasks.map(t=>`<div class="ann">
            <div class="ann-ico" style="color:${t.active?"var(--ac)":"var(--fd)"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
            <div class="ann-c">
              <div class="ann-t">${esc(t.title)} ${!t.active?"<span style='color:var(--dm);font-size:.75rem'>(terminée)</span>":""}</div>
              <div class="ann-d">${esc(t.description)}</div>
              <div class="ann-meta">${fmtDate(t.created_at)}
                ${t.active?`<button class="sbtn" style="margin-left:.8rem;padding:.2rem .5rem;font-size:.62rem" onclick="completeTask('${escJs(t.id)}')">Terminer</button>`:""}
                <button class="sbtn danger" style="margin-left:.4rem;padding:.2rem .5rem;font-size:.62rem" onclick="deleteTask('${escJs(t.id)}')">Supprimer</button>
              </div>
            </div></div>`).join("")}
        </div>`).join("");
    }
  }
}
async function completeTask(id){
  const _ct=(state.tasks||[]).find(x=>String(x.id)===String(id));if(!canCompleteTask(_ct)){toast("Réservé au destinataire ou aux MAJ et plus","error");return;}
  if(supaOK)await supaPatch(T.tasks,"id=eq."+id,{active:false});
  const t=state.tasks.find(x=>x.id==id);if(t){t.active=false;if(!supaOK)saveLS();}
  renderTasks();toast("Tâche terminée","success");
}
async function deleteTask(id){
  if(!canEdit("tasks")){toast("Réservé aux MAJ+","error");return;}
  if(!await uiConfirm({title:"Supprimer la tâche",message:"Supprimer cette tâche ?",okText:"Supprimer",danger:true}))return;
  if(supaOK)await supaDelete(T.tasks,"id=eq."+id);
  state.tasks=state.tasks.filter(t=>t.id!=id);if(!supaOK)saveLS();
  renderTasks();toast("Tâche supprimée","info");
}
