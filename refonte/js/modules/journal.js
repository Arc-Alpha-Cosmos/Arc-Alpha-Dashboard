/* ARC ALPHA - Module journal. */
function renderJournal(){
  const tbody=document.getElementById("journalBody");if(!tbody)return;
  const logs=(state.activity||[]).slice().sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||""));
  if(!logs.length){tbody.innerHTML='<tr><td colspan="2"><div class="empty"><p>Aucune activité enregistrée</p></div></td></tr>';return;}
  const fmtDateTime=(iso)=>{
    if(!iso)return "-";
    try{
      const d=new Date(iso);
      return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})+" "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
    }catch{return iso;}
  };
  tbody.innerHTML=logs.map(l=>`<tr>
    <td><span style="font-family:var(--fm);font-size:.7rem;color:var(--dm)">${fmtDateTime(l.created_at)}</span></td>
    <td><span style="font-size:.82rem;color:var(--tx2)">${esc(l.text)||"-"}</span></td>
  </tr>`).join("");
}
