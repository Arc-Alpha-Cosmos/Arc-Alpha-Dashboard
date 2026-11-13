/* ARC ALPHA - Module admin. */
/* Réglage de l'effectif visé. Même niveau que l'organisation des menus :
   CMD, CMDM et administration. */
function renderCiblePanel(){
  const p=document.getElementById("ciblePanel");
  if(!p)return;
  if(!canEditNav()){p.style.display="none";return;}
  p.style.display="block";
  const i=document.getElementById("cibleInput");
  if(i&&document.activeElement!==i)i.value=effectifCible();
  const h=document.getElementById("cibleHint");
  if(h){
    const eff=(state.members||[]).filter(m=>(m.categorie||"effectif")==="effectif").length;
    const c=effectifCible(), d=eff-c;
    h.textContent="Effectif actuel : "+eff+" · "
      +(d>0?(d+" au-dessus de la cible"):(d<0?((-d)+" place"+(d<-1?"s":"")+" à pourvoir"):"cible atteinte"));
  }
}

async function saveEffectifCible(){
  if(!canEditNav()){toast("Réservé aux CMD, CMDM et à l'administration","error");return;}
  const i=document.getElementById("cibleInput");
  const n=parseInt(i&&i.value,10);
  if(!(n>0&&n<=999)){toast("Indique un nombre entre 1 et 999","error");return;}
  const avant=effectifCible();
  if(n===avant){toast("L'effectif cible est déjà à "+n,"info");return;}
  state.effectifCible=n;
  if(supaOK)await setConfig("effectifCible",String(n));
  else saveLS();
  renderCiblePanel();
  try{renderOverview();}catch(e){}
  toast("Effectif cible : "+n+" membres","success");
  await logActivity(`${session?.user} a fixé l'effectif cible à ${n} (était ${avant})`);
}


function openUserModal(type="member"){
  const isAdmin=Auth.ok()&&session.role==="admin";
  const adminRoleBtn=document.getElementById("roleBtn-admin");
  if(adminRoleBtn)adminRoleBtn.style.display=isAdmin?"":"none";
  if(type==="admin"&&!isAdmin)type="member";
  selectRoleType(type);
  ["nuUser","nuPass","nuPassConf"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
  const nuML=document.getElementById("nuMemberLink");
  if(nuML){
    nuML.innerHTML='<option value="">Aucun lien</option>'+
      sortMembers(state.members).map(m=>`<option value="${m.id}">${esc(m.matricule)} - ${esc(m.nom)||"?"} (${esc(m.grade)})</option>`).join("");
  }
  const err=document.getElementById("userModalErr");if(err)err.classList.remove("show");
  document.getElementById("userModal").classList.add("show");
}

function selectRoleType(type){
  document.getElementById("nuRole").value=type;
  const roleStyles={
    member:{color:"var(--ac)",bg:"rgba(0,229,255,.08)"},
    admin:{color:"var(--or)",bg:"rgba(255,138,61,.08)"},
    brs:{color:"#7c5cff",bg:"rgba(124,92,255,.08)"},
    amiraute:{color:"var(--ye)",bg:"rgba(255,210,61,.08)"},
  };
  ["member","admin","brs","amiraute"].forEach(r=>{
    const btn=document.getElementById("roleBtn-"+r);
    if(!btn)return;
    if(r===type){btn.style.border="2px solid "+roleStyles[r].color;btn.style.background=roleStyles[r].bg;}
    else{btn.style.border="2px solid var(--ln)";btn.style.background="transparent";}
  });
  const titles={member:"Nouveau compte Membre ARC",admin:"Nouveau compte Admin",brs:"Nouveau compte BRS",amiraute:"Nouveau compte Amirauté"};
  const t=document.getElementById("userModalTitle");
  if(t)t.textContent=titles[type]||"Nouveau compte";
  const memberLinkField=document.getElementById("nuMemberLink")?.closest(".field");
  if(memberLinkField)memberLinkField.style.display=(type==="member")?"block":"none";
}

function renderUsers(){
  const tbody=document.getElementById("usersBody");if(!tbody)return;
  if(!state.users.length){tbody.innerHTML='<tr><td colspan="4"><div class="empty"><p>Aucun compte</p></div></td></tr>';return;}
  const roleOrder={admin:0,amiraute:1,brs:2,member:3};
  const sorted=[...state.users].sort((a,b)=>{
    const ra=roleOrder[a.role]??9, rb=roleOrder[b.role]??9;
    if(ra!==rb)return ra-rb;
    return(a.display||"").localeCompare(b.display||"");
  });
  tbody.innerHTML=sorted.map(u=>{
    const isMe=session&&u.user_hash===session.userHash;
    const rc=ROLE_COLORS[u.role]||"var(--ac)";
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:.7rem">
        <div style="width:28px;height:28px;border-radius:var(--r1);background:linear-gradient(135deg,var(--ac),var(--vi));display:flex;align-items:center;justify-content:center;font-family:var(--fm);font-weight:700;font-size:.74rem;color:var(--bg)">${esc((u.display||"?")[0].toUpperCase())}</div>
        <div class="nm" style="font-size:.88rem">${esc(u.display)||"?"} ${isMe?'<span class="mono-xs">(vous)</span>':""}</div>
      </div></td>
      <td><span class="fbadge" style="--c:${rc}">${ROLE_BADGES[u.role]||"● MEMBRE"}</span></td>
      <td>${(()=>{
        const lm=u.member_id?state.members.find(m=>m.id==u.member_id):null;
        if(lm)return `<div style="display:flex;align-items:center;gap:.5rem"><span style="font-family:var(--fm);font-size:.74rem;color:var(--ac);background:rgba(0,229,255,.08);border:1px solid rgba(0,229,255,.25);padding:.12rem .4rem;border-radius:var(--r1)">${esc(lm.grade)||"?"}</span><span style="font-size:.78rem;color:var(--tx)">${esc(lm.matricule)}${lm.nom?" - "+esc(lm.nom):""}</span></div>`;
        return `<span style="font-size:.74rem;color:var(--dm);font-style:italic">Non lié</span>`;
      })()}</td>
      <td class="ta-r"><div class="row-end">
        <button class="sm sbtn" onclick="openEditUser('${escJs(u.id)}')"><i data-lucide="pencil"></i>Modifier</button>
        ${!isMe?`<button class="icon-btn del" onclick="deleteUser('${escJs(u.id)}')" title="Supprimer" aria-label="Supprimer"><i data-lucide="trash-2"></i></button>`:"<span style='width:30px;display:inline-block'></span>"}
      </div></td>
    </tr>`;
  }).join("");
  const uc=document.getElementById("userCount");
  if(uc)uc.textContent=`(${state.users.length} compte${state.users.length>1?"s":""})`;
}

function renderAdmin(){
  renderDiscordPanel();
  renderMissionAdmin();
  renderCiblePanel();
  if(!session)return;
  const isAdmin=Auth.ok()&&session.role==="admin";
  const canNav=canEditNav();
  const canRecruit=canAdminRecrut();
  const strictAdminPanels=["vitrinePanel","guidePanel","maintPanel","debugPanel"];
  strictAdminPanels.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.display=isAdmin?"block":"none";
  });
  updateDebugBtn();
  const rp=document.getElementById("recruitPanel");
  if(rp)rp.style.display=canRecruit?"block":"none";
  const np=document.getElementById("navEditorPanel");
  if(np)np.style.display=canNav?"block":"none";
  const adminTag=document.querySelector('[data-dtc="admin"] .sec-head .tag');
  if(adminTag)adminTag.textContent=isAdmin?"ADMIN ONLY"
    :(canNav?"GESTION"
    :(canManageUsers()?"GESTION DES COMPTES"
    :(canRecruit?"RECRUTEMENT ET MISSIONS":"MISSIONS")));
  const up=document.getElementById("usersPanel");
  if(up)up.style.display=canManageUsers()?"block":"none";
  const cab=document.getElementById("createAdminBtn");
  if(cab)cab.style.display=isAdmin?"":"none";
  const tp=document.getElementById("ticketsPanel");
  if(tp)tp.style.display=isAdmin?"block":"none";
  if(isAdmin)renderTickets();
  const mcp=document.getElementById("modChatPanel");
  if(mcp)mcp.style.display=isAdmin?"block":"none";
  if(canNav)renderNavEditor();
  if(canManageUsers())renderUsers();
}

async function saveUser(){
  if(!canManageUsers()){toast("Accès insuffisant","error");return;}
  const user=document.getElementById("nuUser").value.trim();
  const pass=document.getElementById("nuPass").value.trim();
  const passConf=document.getElementById("nuPassConf").value.trim();
  const role=document.getElementById("nuRole").value;
  if(role==="admin" && (!session||session.role!=="admin")){toast("Seul un administrateur peut créer un compte admin","error");return;}
  const err=document.getElementById("userModalErr");
  if(!user||!pass){toast("Remplis tous les champs","error");return;}
  if(pass!==passConf){err.textContent="Les mots de passe ne correspondent pas";err.classList.add("show");return;}
  if(pass.length<3){toast("Mot de passe trop court","error");return;}
  const uh=cyrb53(user),ph=cyrb53(pass);
  if(state.users.find(u=>u.display===user||u.user_hash===uh)){
    err.textContent=`L'identifiant "${user}" existe déjà`;err.classList.add("show");return;
  }
  const memberLinkId = document.getElementById("nuMemberLink")?.value||"";
  const linkedMember = state.members.find(m=>m.id==memberLinkId);
  const memberGrade = linkedMember?.grade||"";
  const obj={user_hash:uh,pass_hash:ph,role,display:user,member_id:memberLinkId||null,grade:memberGrade};
  if(supaOK){
    let r=await supaPost(T.users,obj);
    if(r===null&&obj.role){
      /* colonne role verrouillée en base : on crée un compte membre puis on
         pose le rôle par la fonction SQL */
      const base=Object.assign({},obj);delete base.role;
      r=await supaPost(T.users,base);
      if(r&&r.length>0&&role!=="member"){
        const rr=await setRoleServerSide(r[0].id,role);
        if(rr==="ok")r[0].role=role;
        else{toast("Compte créé en « membre » : le rôle doit être posé depuis Supabase","error");}
      }
    }
    if(r&&r.length>0)state.users.push(r[0]);else{toast("Erreur création","error");return;}
  }
  else{obj.id=Date.now().toString();state.users.push(obj);saveLS();}
  closeModal("userModal");renderUsers();
  toast(`Compte ${({admin:"admin",brs:"BRS",amiraute:"Amirauté"}[role])||"membre"} "${user}" créé`,"success");
  await logActivity(`${session?.user} a créé le compte "${user}" (rôle: ${ROLE_LABELS[role]||role})`);
}

function toggleProfileEdit(){
  const f=document.getElementById("profileEditForm");
  if(!f)return;
  const show=f.style.display==="none";
  f.style.display=show?"block":"none";
  if(show){
    document.getElementById("peUser").value="";
    document.getElementById("peUser").placeholder=session?.user||"Identifiant actuel";
    document.getElementById("pePass").value="";
    document.getElementById("pePassConf").value="";
    document.getElementById("peOldPass").value="";
    document.getElementById("profileEditErr").style.display="none";
  }
}

async function saveProfileEdit(){
  const err=document.getElementById("profileEditErr");
  const showErr=(msg)=>{err.textContent=msg;err.style.display="block";};
  err.style.display="none";

  if(!Auth.ok()){showErr("Session non vérifiée, reconnecte-toi.");return;}

  const newUser=document.getElementById("peUser").value.trim();
  const newPass=document.getElementById("pePass").value.trim();
  const newPassConf=document.getElementById("pePassConf").value.trim();
  const oldPass=document.getElementById("peOldPass").value.trim();

  if(!oldPass){showErr("Tu dois saisir ton mot de passe actuel.");return;}

  if(!newUser && !newPass){showErr("Indique un nouvel identifiant ou un nouveau mot de passe.");return;}

  const oldHash=cyrb53(oldPass);
  const acc=Auth.account();
  if(!acc){showErr("Compte introuvable.");return;}
  /* Le mot de passe actuel est vérifié par la base, pas par comparaison
     d'une empreinte lue côté navigateur. */
  const chk=await supaRpc("arc_login",{p_ident:null,p_user_hash:session.userHash,p_pass_hash:oldHash});
  if(chk.ok){
    const d=Array.isArray(chk.data)?(chk.data[0]||null):(chk.data||null);
    if(!d){showErr("Mot de passe actuel incorrect.");return;}
  }else if(chk.missing){
    const rows=await supaGet(T.users,`user_hash=eq.${encodeURIComponent(session.userHash)}`);
    const cu=(rows&&rows[0])||null;
    if(!cu){showErr("Compte introuvable.");return;}
    if(String(cu.pass_hash)!==String(oldHash)){showErr("Mot de passe actuel incorrect.");return;}
  }else{showErr("Vérification impossible, réessaie.");return;}

  if(newPass){
    if(newPass.length<3){showErr("Le nouveau mot de passe est trop court (3 caractères min).");return;}
    if(newPass!==newPassConf){showErr("Les nouveaux mots de passe ne correspondent pas.");return;}
  }

  if(newUser&&newUser!==acc.display){
    const exists=state.users.find(u=>u.display===newUser&&u.user_hash!==session.userHash);
    if(exists){showErr(`L'identifiant "${newUser}" est déjà pris.`);return;}
  }

  const updates={};
  if(newUser){updates.display=newUser;}

  if(supaOK){
    /* le mot de passe passe par sa propre fonction (l'ancien est déjà vérifié
       plus haut) ; une fois la base verrouillée, pass_hash n'est plus modifiable
       en écriture directe. */
    if(newPass){
      const pr=Auth.proof&&Auth.proof();
      const rc=pr?await supaRpc("arc_change_password",{p_auth_hash:pr.uh,p_auth_pass:pr.ph,p_new_pass:newPass}):{missing:true};
      if(rc.missing){ updates.pass_hash=cyrb53(newPass); }
      else if(!rc.ok){ showErr("Changement de mot de passe refusé."); return; }
    }
    if(Object.keys(updates).length){
      const r=await supaPatch(T.users,`user_hash=eq.${session.userHash}`,updates);
      if(!r){showErr("Erreur lors de la sauvegarde.");return;}
    }
  }else{
    if(newPass)updates.pass_hash=cyrb53(newPass);
  }
  const localU=state.users.find(u=>u.user_hash===session.userHash);
  if(localU)Object.assign(localU,updates);

  if(newUser&&localU)await syncUserNameCopies(localU);

  if(newUser)Auth.setRow({display:newUser});
  if(newPass)Auth.setPass(cyrb53(newPass));
  if(!supaOK)saveLS();

  updateNavUI();
  document.getElementById("profileEditForm").style.display="none";
  toast("Profil mis à jour avec succès","success");
  const pchanges=[];
  if(newUser)pchanges.push(`identifiant → "${newUser}"`);
  if(newPass)pchanges.push("mot de passe changé");
  await logActivity(`${session.user} a modifié son propre profil${pchanges.length?" ("+pchanges.join(", ")+")":""}`);
  if(typeof renderUsers==="function")renderUsers();
}

function openEditUser(id){
  const u=state.users.find(x=>x.id==id);
  if(!u){toast("Compte introuvable","error");return;}
  const isAdmin=Auth.ok()&&session.role==="admin";

  if(u.role==="admin"&&!isAdmin){toast("Seul un administrateur peut modifier un compte admin","error");return;}

  document.getElementById("euUserId").value=id;
  document.getElementById("euAvatar").textContent=(u.display||"?")[0].toUpperCase();
  document.getElementById("euCurrentName").textContent=u.display||"?";
  const roleEl=document.getElementById("euCurrentRole");
  roleEl.textContent=ROLE_BADGES[u.role]||"● MEMBRE";
  roleEl.style.color=ROLE_COLORS[u.role]||"var(--ac)";

  document.getElementById("euUser").value=u.display||"";
  document.getElementById("euPass").value="";
  document.getElementById("euRole").value=u.role||"member";
  document.getElementById("editUserTitle").textContent="Modifier "+(u.display||"compte");
  document.getElementById("editUserErr").style.display="none";

  const adminOpt=document.querySelector('#euRole option[value="admin"]');
  if(adminOpt)adminOpt.style.display=isAdmin?"":"none";
  document.getElementById("euRoleField").style.display=isAdmin?"block":(u.role==="admin"?"none":"block");

  const ml=document.getElementById("euMemberLink");
  if(ml){
    ml.innerHTML='<option value="">Aucun lien</option>'+
      sortMembers(state.members).map(m=>`<option value="${m.id}" ${u.member_id==m.id?"selected":""}>${esc(m.matricule)} - ${esc(m.nom)||"?"} (${esc(m.grade)})</option>`).join("");
  }
  document.getElementById("euMemberLinkField").style.display=(u.role==="member")?"block":"none";
  document.getElementById("euRole").onchange=function(){
    document.getElementById("euMemberLinkField").style.display=(this.value==="member")?"block":"none";
  };

  document.getElementById("editUserModal").classList.add("show");
}

async function saveEditUser(){
  const err=document.getElementById("editUserErr");
  const showErr=(m)=>{err.textContent=m;err.style.display="block";};
  err.style.display="none";
  if(!canManageUsers()){showErr("Accès insuffisant.");return;}

  const id=document.getElementById("euUserId").value;
  const u=state.users.find(x=>x.id==id);
  if(!u){showErr("Compte introuvable.");return;}

  const isAdmin=Auth.ok()&&session.role==="admin";
  if(u.role==="admin"&&!isAdmin){showErr("Seul un administrateur peut modifier un compte admin.");return;}

  const newUser=document.getElementById("euUser").value.trim();
  const newPass=document.getElementById("euPass").value.trim();
  let newRole=document.getElementById("euRole").value;
  const newMemberLink=document.getElementById("euMemberLink")?.value||"";

  if(!newUser){showErr("L'identifiant ne peut pas être vide.");return;}

  if(newRole==="admin"&&!isAdmin){showErr("Seul un administrateur peut attribuer le rôle admin.");return;}
  if(u.role==="admin"&&newRole!=="admin"&&!isAdmin){showErr("Seul un administrateur peut changer le rôle d'un admin.");return;}

  const updates={display:newUser};

  if(newUser!==u.display){
    const exists=state.users.find(x=>x.display===newUser&&x.id!=id);
    if(exists){showErr(`L'identifiant "${newUser}" est déjà pris.`);return;}
  }

  if(newPass){
    if(newPass.length<3){showErr("Le mot de passe est trop court (3 caractères min).");return;}
    updates.pass_hash=cyrb53(newPass);
  }

  if(newRole!==u.role){
    updates.role=newRole;
  }

  if(newRole==="member"){
    updates.member_id=newMemberLink||null;
    const linked=state.members.find(m=>m.id==newMemberLink);
    updates.grade=linked?.grade||"";
  }

  const _oldDisplay=u.display;
  const _isSelf=!!(session&&(
    (session.userId!=null&&String(u.id)===String(session.userId))||
    u.user_hash===session.userHash));
  if(supaOK){
    let r=await supaPatch(T.users,`id=eq.${id}`,updates);
    if(r===null&&updates.role){
      /* colonne role verrouillée en base : le rôle passe par la fonction SQL */
      const rr=await setRoleServerSide(id,updates.role);
      if(rr!=="ok"){showErr("Changement de rôle refusé par la base.");return;}
      const sans=Object.assign({},updates);delete sans.role;
      r=Object.keys(sans).length?await supaPatch(T.users,`id=eq.${id}`,sans):true;
    }
    if(!r){showErr("Erreur lors de la sauvegarde.");return;}
  }
  Object.assign(u,updates);
  if(!supaOK)saveLS();

  if(newUser!==_oldDisplay)await syncUserNameCopies(u);

  if(_isSelf){
    Auth.setRow(updates);
    if(updates.pass_hash)Auth.setPass(updates.pass_hash);
    updateNavUI();
  }

  closeModal("editUserModal");
  renderUsers();
  toast(`Compte "${newUser}" modifié`,"success");
  const changes=[];
  if(updates.user_hash)changes.push(`identifiant → "${newUser}"`);
  if(updates.pass_hash)changes.push("mot de passe réinitialisé");
  if(updates.role)changes.push(`rôle → ${ROLE_LABELS[updates.role]||updates.role}`);
  if("member_id" in updates)changes.push("lien membre modifié");
  const detail=changes.length?changes.join(", "):"aucun changement";
  await logActivity(`${session?.user} a modifié le compte "${u.display||newUser}" (${detail})`);
}

function openForgotModal(){
  document.getElementById("forgotUser").value="";
  document.getElementById("forgotMsg").value="";
  document.getElementById("forgotErr").classList.remove("show");
  document.getElementById("forgotSuccess").style.display="none";
  document.getElementById("forgotSendBtn").style.display="";
  closeModal("loginModal");
  document.getElementById("forgotModal").classList.add("show");
}

async function sendForgotRequest(){
  const err=document.getElementById("forgotErr");
  const user=document.getElementById("forgotUser").value.trim();
  const msg=document.getElementById("forgotMsg").value.trim();
  if(!user){err.textContent="Saisis ton identifiant.";err.classList.add("show");return;}
  const exists=findUserByIdent(user);
  const pending=(state.tickets||[]).find(t=>t.user_ident===user && t.status==="open");
  if(pending){err.textContent="Une demande est déjà en attente pour cet identifiant.";err.classList.add("show");return;}

  const obj={
    user_ident:user,
    message:msg||null,
    status:"open",
    created_at:new Date().toISOString(),
    account_exists:!!exists
  };
  if(supaOK){
    const r=await supaPost(T.tickets,obj);
    if(r&&r.length>0)state.tickets.unshift(r[0]);
    else state.tickets.unshift({...obj,id:Date.now()});
  }else{
    state.tickets.unshift({...obj,id:Date.now()});saveLS();
  }
  err.classList.remove("show");
  document.getElementById("forgotSuccess").style.display="block";
  document.getElementById("forgotSendBtn").style.display="none";
  await logActivity(`Demande de récupération de mot de passe pour "${user}"`);
}

function renderTickets(){
  const tbody=document.getElementById("ticketsBody");if(!tbody)return;
  const openCount=(state.tickets||[]).filter(t=>t.status==="open").length;
  const badge=document.getElementById("ticketCount");
  if(badge)badge.textContent=openCount>0?`(${openCount} en attente)`:"(aucune)";

  const list=(state.tickets||[]).slice().sort((a,b)=>{
    if(a.status!==b.status)return a.status==="open"?-1:1;
    return (b.created_at||"").localeCompare(a.created_at||"");
  });
  if(!list.length){tbody.innerHTML='<tr><td colspan="4"><div class="empty"><p>Aucune demande de récupération</p></div></td></tr>';return;}
  const fmtDT=(iso)=>{try{const d=new Date(iso);return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});}catch{return iso;}};
  tbody.innerHTML=list.map(t=>{
    const isOpen=t.status==="open";
    const notFound=t.account_exists===false;
    return `<tr style="${isOpen?"":"opacity:.5"}">
      <td><span style="font-family:var(--fm);font-size:.8rem;color:var(--tx)">${esc(t.user_ident)||"?"}</span>${notFound?'<span style="color:var(--rd);font-size:.74rem;margin-left:.4rem">compte introuvable</span>':''}</td>
      <td><span style="font-size:.78rem;color:var(--tx2)">${esc(t.message)||"-"}</span></td>
      <td><span style="font-family:var(--fm);font-size:.74rem;color:${isOpen?"var(--ye)":"var(--gr)"}">${isOpen?"⏳ En attente":"✓ Traité"}</span><br><span class="mono-xs">${fmtDT(t.created_at)}</span></td>
      <td class="ta-r"><div class="row-end">
        ${isOpen&&!notFound?`<button class="sm sbtn green" onclick="openResetTicket('${escJs(t.id)}')">Réinitialiser</button>`:""}
        ${isOpen?`<button class="sm sbtn" onclick="dismissTicket('${escJs(t.id)}')">Ignorer</button>`:""}
        <button class="icon-btn del" onclick="deleteTicket('${escJs(t.id)}')" title="Supprimer" aria-label="Supprimer"><i data-lucide="trash-2"></i></button>
      </div></td>
    </tr>`;
  }).join("");
}

function openResetTicket(ticketId){
  if(!Auth.ok()||session.role!=="admin"){toast("Réservé aux administrateurs","error");return;}
  const t=(state.tickets||[]).find(x=>x.id==ticketId);
  if(!t)return;
  document.getElementById("rtTicketId").value=ticketId;
  document.getElementById("rtUser").textContent=t.user_ident;
  document.getElementById("rtNewPass").value="";
  document.getElementById("rtErr").style.display="none";
  document.getElementById("resetTicketModal").classList.add("show");
}

function generateTempPassword(){
  const chars="ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let p="";for(let i=0;i<8;i++)p+=chars[Math.floor(Math.random()*chars.length)];
  document.getElementById("rtNewPass").value=p;
  document.getElementById("rtNewPass").type="text";
}

async function confirmResetTicket(){
  if(!Auth.ok()||session.role!=="admin"){toast("Réservé aux administrateurs","error");return;}
  const err=document.getElementById("rtErr");
  const ticketId=document.getElementById("rtTicketId").value;
  const t=(state.tickets||[]).find(x=>x.id==ticketId);
  if(!t){err.textContent="Ticket introuvable.";err.style.display="block";return;}
  const newPass=document.getElementById("rtNewPass").value.trim();
  if(newPass.length<3){err.textContent="Le mot de passe doit faire au moins 3 caractères.";err.style.display="block";return;}

  const acc=findUserByIdent(t.user_ident);
  if(!acc){err.textContent="Compte introuvable côté serveur.";err.style.display="block";return;}

  const newHash=cyrb53(newPass);
  if(supaOK){
    const pr=Auth.proof&&Auth.proof();
    const rr=pr?await supaRpc("arc_reset_password",{p_auth_hash:pr.uh,p_auth_pass:pr.ph,p_target_id:String(acc.id),p_new_pass:newPass}):{missing:true};
    if(rr.missing){
      const r=await supaPatch(T.users,`id=eq.${acc.id}`,{pass_hash:newHash});
      if(!r){err.textContent="Erreur lors de la réinitialisation.";err.style.display="block";return;}
    }else if(!rr.ok){
      err.textContent="Réinitialisation refusée (réservée à un administrateur).";err.style.display="block";return;
    }
  }
  acc.pass_hash=newHash;

  if(supaOK)await supaPatch(T.tickets,`id=eq.${ticketId}`,{status:"resolved"});
  t.status="resolved";
  if(!supaOK)saveLS();

  closeModal("resetTicketModal");
  renderTickets();
  toast(`Mot de passe de "${t.user_ident}" réinitialisé`,"success");
  await uiAlert({kicker:"// MOT DE PASSE RÉINITIALISÉ",title:t.user_ident,message:`Nouveau mot de passe : ${newPass}\n\nCommunique-le à l'utilisateur. Il pourra le changer dans son profil.`,okText:"Compris"});
  await logActivity(`${session.user} a réinitialisé le mot de passe de "${t.user_ident}" (ticket)`);
}

async function dismissTicket(ticketId){
  if(!Auth.ok()||session.role!=="admin")return;
  const t=(state.tickets||[]).find(x=>x.id==ticketId);if(!t)return;
  if(supaOK)await supaPatch(T.tickets,`id=eq.${ticketId}`,{status:"resolved"});
  t.status="resolved";if(!supaOK)saveLS();
  renderTickets();toast("Demande ignorée","info");
}

async function deleteTicket(ticketId){
  if(!Auth.ok()||session.role!=="admin")return;
  if(!await uiConfirm({title:"Supprimer la demande",message:"Supprimer cette demande ?",okText:"Supprimer",danger:true}))return;
  if(supaOK)await supaDelete(T.tickets,`id=eq.${ticketId}`);
  state.tickets=(state.tickets||[]).filter(x=>x.id!=ticketId);if(!supaOK)saveLS();
  renderTickets();toast("Demande supprimée","info");
}

async function deleteUser(id){
  if(!canManageUsers()){toast("Réservé à la gestion des comptes","error");return;}
  if(!await uiConfirm({title:"Supprimer l'accès",message:"Supprimer cet accès ?",okText:"Supprimer",danger:true}))return;
  const _delU=state.users.find(u=>u.id==id);
  if(supaOK)await supaDelete(T.users,`id=eq.${id}`);
  state.users=state.users.filter(u=>u.id!=id);if(!supaOK)saveLS();
  renderUsers();toast("Accès supprimé","info");
  await logActivity(`Compte "${_delU?.display||id}" supprimé par ${session?.user}`);
}


async function loadModConvList(){
  if(session?.role!=="admin")return;
  const box=document.getElementById("modConvList");
  box.innerHTML='<div class="empty"><p>Chargement…</p></div>';
  if(!supaOK){box.innerHTML='<div class="empty"><p>Supabase indisponible.</p></div>';return;}
  const rows=await supaGet(T.messages,"order=created_at.desc&limit=600");
  if(rows===null){box.innerHTML='<div class="empty"><p>Messages privés non lisibles : le verrouillage de la base empêche leur lecture par le tableau de bord. La confidentialité est préservée.</p></div>';return;}
  const pairs=new Map();
  for(const m of rows){
    const key=[m.from_hash,m.to_hash].sort().join("|");
    if(!pairs.has(key)){
      pairs.set(key,{a:m.from_hash,b:m.to_hash,last:m.content,time:m.created_at,count:0});
    }
    pairs.get(key).count++;
  }
  const list=[...pairs.values()];
  if(!list.length){box.innerHTML='<div class="empty"><p>Aucune conversation.</p></div>';return;}
  box.innerHTML='<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Participants</th><th>Dernier message</th><th class="ta-r">Messages</th></tr></thead><tbody>'+
    list.map(p=>{
      const na=userMetaByHash(p.a),nb=userMetaByHash(p.b);
      const t=chatSmartTime(p.time);
      const prev=(p.last||"").length>32?(p.last.slice(0,32)+"…"):(p.last||"");
      return`<tr class="ptr" onclick="openModThread('${escJs(p.a)}','${p.b}')">
        <td style="font-weight:600">${esc(na.name)} <span class="c-dm">↔</span> ${esc(nb.name)}</td>
        <td style="color:var(--tx2);font-size:.82rem">${esc(prev)}<div style="font-family:var(--fm);font-size:.74rem;color:var(--dm);margin-top:.15rem">${t}</div></td>
        <td style="text-align:right;font-family:var(--fm);color:var(--dm)">${p.count}</td>
      </tr>`;
    }).join("")+'</tbody></table></div>';
}
async function openModThread(a,b){
  if(session?.role!=="admin")return;
  const na=userMetaByHash(a),nb=userMetaByHash(b);
  document.getElementById("modChatTitle").textContent=`${na.name} ↔ ${nb.name}`;
  const thread=document.getElementById("modChatThread");
  thread.innerHTML='<div class="chat-empty">Chargement…</div>';
  document.getElementById("modChatModal").classList.add("show");
  const msgs=await supaGet(T.messages,`or=(and(from_hash.eq.${a},to_hash.eq.${b}),and(from_hash.eq.${b},to_hash.eq.${a}))&order=created_at.asc&limit=300`);
  if(msgs===null){thread.innerHTML='<div class="chat-empty">Conversation non lisible : le verrouillage de la base protège les messages privés des membres.</div>';return;}
  if(!msgs.length){thread.innerHTML='<div class="chat-empty">Aucun message.</div>';return;}
  thread.innerHTML='<div class="chat-msgs">'+msgs.map(m=>{
    const fromA=m.from_hash===a;
    const t=chatSmartTime(m.created_at);
    return`<div class="chat-bubble ${fromA?"them":"me"}">${esc(m.content)}<span class="cb-time">${esc(userLabel(m.from_hash,m.from_name))} · ${t}</span></div>`;
  }).join("")+'</div>';
  thread.scrollTop=thread.scrollHeight;
}
