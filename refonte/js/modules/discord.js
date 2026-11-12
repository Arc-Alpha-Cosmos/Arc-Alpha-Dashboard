/* ARC ALPHA - Module discord. */
function discordIdentity(payload){
  const n=(state.discord.botName||"").trim(), a=(state.discord.botAvatar||"").trim();
  if(n) payload.username=n;
  if(a) payload.avatar_url=a;
  return payload;
}

function canConfigDiscord(){
  if(!Auth.ok()) return false;
  if(session.role==="admin"||session.role==="amiraute") return true;
  if(session.role==="brs") return false;
  return gradeLevel(getSessionGrade())>=6;
}

/* ------------------------------------------------------------------
   Les webhooks Discord ne sont plus lisibles par tout le monde : une fois
   securite.sql execute, arc_config ne rend plus les cles discord* a la cle
   publique, et seule arc_discord_config les donne a un compte verifie
   (SGT et plus). Tant que la fonction n'existe pas, ils arrivent avec le
   reste de la configuration et rien ne change. ------------------------- */
const DISCORD_KEYS={discordAnnonces:"annonces",discordPromo:"promo",
  discordFormations:"formations",discordRecrutTrooper:"recrutTrooper",
  discordRecrutAlpha:"recrutAlpha",discordRecrutRoles:"recrutRoles",
  discordRapports:"rapports",discordStyle:"style",discordBotName:"botName",
  discordBotAvatar:"botAvatar"};
let _dscRpc=null;
async function discordConfigLoad(){
  if(_dscRpc===false)return false;
  const pr=(Auth.ok()&&Auth.proof)?Auth.proof():null;
  if(!pr)return false;
  const r=await supaRpc("arc_discord_config",{p_auth_hash:pr.uh,p_auth_pass:pr.ph});
  if(r.missing){_dscRpc=false;return false;}
  if(!r.ok||!r.data||typeof r.data!=="object")return false;
  _dscRpc=true;
  Object.keys(DISCORD_KEYS).forEach(k=>{
    if(!(k in r.data))return;
    const v=cfgStr(r.data[k]), dest=DISCORD_KEYS[k];
    state.discord[dest]=(dest==="style")?(v||"detaille"):v;
  });
  try{renderDiscordPanel();}catch(e){}
  return true;
}
async function discordPersist(vals){
  const pr=(Auth.ok()&&Auth.proof)?Auth.proof():null;
  if(pr){
    const r=await supaRpc("arc_discord_set",{p_auth_hash:pr.uh,p_auth_pass:pr.ph,p_values:vals});
    if(!r.missing)return !!r.ok;
  }
  for(const k of Object.keys(vals))await setConfig(k,vals[k]);
  return true;
}

async function discordSend(url,payload,applyIdentity){
  if(!url) return false;
  try{
    if(applyIdentity!==false) discordIdentity(payload);
    const r=await fetch(url,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    return r.ok || r.status===204;
  }catch(e){
    console.warn("Discord: envoi impossible",e);
    return false;
  }
}

function discordAnnoncePayload(title,content,pinned,author){
  return {
        embeds:[{
      title:(pinned?"📌 ":"")+title,
      description:content||"",
      color:0x00e5ff,
      footer:{text:`Publié par ${author||"?"} · Centre de Commandement`},
      timestamp:new Date().toISOString()
    }]
  };
}

function discordPromoPayload(m,oldGrade,newGrade,author){
  const up=(GRADE_LEVEL[newGrade]||0)>(GRADE_LEVEL[oldGrade]||0);
  const who=`${m.matricule||""} ${m.nom||""}`.trim()||"?";
  const oldL=gradeLabel(oldGrade), newL=gradeLabel(newGrade);
  const style=state.discord.style||"detaille";

  if(style==="compact"){
    return {      content:`${up?"▲":"▼"} **${who}** · ${oldL} → **${newL}**`};
  }

  if(style==="rp"){
    return {      embeds:[{
        title:"📡 TRANSMISSION - COMMANDEMENT ARC ALPHA",
        description: up
          ? `Par décision du Commandement, **${who}** accède au grade de **${newL}**.\n\nFélicitations, soldat. 🫡`
          : `Par décision du Commandement, **${who}** est ramené au grade de **${newL}**.`,
        color:gradeColorInt(newGrade),
        footer:{text:`Validé par ${author||"?"} · Centre de Commandement`},
        timestamp:new Date().toISOString()
      }]};
  }

  const fields=[
    {name:"Ancien grade",value:oldL,inline:true},
    {name:"Nouveau grade",value:newL,inline:true}
  ];
  if(m.regiment_rct) fields.push({name:"Régiment",value:String(m.regiment_rct),inline:true});
  return {    embeds:[{
      title:up?"▲ PROMOTION":"▼ RÉTROGRADATION",
      description:up
        ? `**${who}** est promu au grade de **${newL}**.`
        : `**${who}** est rétrogradé au grade de **${newL}**.`,
      color:gradeColorInt(newGrade),
      fields,
      footer:{text:`Validé par ${author||"?"} · Centre de Commandement`},
      timestamp:new Date().toISOString()
    }]};
}

const MOUVEMENTS={
  depart   :{title:"✖ DÉPART",             color:0x6b7689, verb:"quitte les rangs de l'ARC Alpha"},
  reserve  :{title:"⏸ MISE EN RÉSERVE",    color:0xffd23d, verb:"passe en réserve"},
  blacklist:{title:"⛔ BLACKLIST",          color:0xff3b5c, verb:"est placé en blacklist"},
  effectif :{title:"▣ RETOUR EN EFFECTIF", color:0x22d97a, verb:"réintègre l'effectif actif"}
};

function discordMouvementPayload(m,kind,raison,author){
  const cfg=MOUVEMENTS[kind]||MOUVEMENTS.depart;
  const who=`${m.matricule||""} ${m.nom||""}`.trim()||"?";
  const fields=[{name:"Grade",value:gradeLabel(m.grade),inline:true}];
  if(m.regiment_rct) fields.push({name:"Régiment",value:String(m.regiment_rct),inline:true});
  if(raison) fields.push({name:"Motif",value:String(raison).slice(0,1000),inline:false});
  return {
    embeds:[{
      title:cfg.title,
      description:`**${who}** ${cfg.verb}.`,
      color:cfg.color,
      fields,
      footer:{text:`Enregistré par ${author||"?"} · Centre de Commandement`},
      timestamp:new Date().toISOString()
    }]};
}

function discordCmdPayload(entry,m,author){
  const who=memberLabel(entry.member_id,entry.member_name);
  const pts=parseFloat(entry.points||0);
  let total=0;
  state.cmdmissions.forEach(c=>{
    const same = (entry.member_id && c.member_id==entry.member_id) || (!entry.member_id && c.member_name===who);
    if(same) total+=parseFloat(c.points||0);
  });
  total=Math.round(total*100)/100;
  const fields=[
    {name:"Rôle",value:entry.role||(pts===1?"Chef":"Second"),inline:true},
    {name:"Points",value:`+${pts}`,inline:true},
    {name:"Total dans le grade",value:String(total),inline:true}
  ];
  if(entry.mission_name) fields.unshift({name:"Mission",value:String(entry.mission_name).slice(0,200),inline:false});
  const rule=m&&PROMO_RULES[m.grade];
  if(rule&&rule.cmd){
    fields.push({name:`Seuil ${gradeLabel(rule.next)}`,value:`${total} / ${rule.cmd} CMD`,inline:false});
  }
  return {
    embeds:[{
      title:"◈ CMD DE MISSION",
      description:`**${who}** a commandé une mission${entry.role?` en tant que **${entry.role}**`:""}.`,
      color:0x7c5cff,
      fields,
      footer:{text:`Enregistré par ${author||"?"} · Centre de Commandement`},
      timestamp:new Date().toISOString()
    }]};
}

const FORMATION_STATUTS={
  "Validé"  :{color:0x22d97a, icon:"✅"},
  "En cours":{color:0xffd23d, icon:"⏳"},
  "Échoué"  :{color:0xff3b5c, icon:"✖"}
};

function discordFormationPayload(f,author,maj){
  const st=FORMATION_STATUTS[f.statut]||{color:0x00e5ff,icon:"•"};
  let dateTxt="-";
  if(f.date){ try{ dateTxt=fmtDate(f.date); }catch(e){ dateTxt=String(f.date); } }
  return {
    embeds:[{
      title: maj ? "🎓 FORMATION MISE À JOUR" : "🎓 FORMATION",
      description:`**${memberLabel(f.formateur_id,f.formateur)}** a formé **${memberLabel(f.eleve_id,f.eleve)}**.`,
      color:st.color,
      fields:[
        {name:"Formation",value:String(f.formation||"-"),inline:true},
        {name:"Statut",value:`${st.icon} ${f.statut||"-"}`,inline:true},
        {name:"Date",value:dateTxt,inline:true}
      ],
      footer:{text:`Enregistré par ${author||"?"} · Centre de Commandement`},
      timestamp:new Date().toISOString()
    }]};
}


/* Un aperçu n'est pas le message : au-delà d'une certaine longueur il rend le
   dialogue illisible, et c'est ce dialogue qui porte les boutons. Ce qui part
   sur Discord, lui, n'est jamais raccourci. */
function _dpCap(txt,lim){
  const s=String(txt||"").trim();
  if(s.length<=lim)return s;
  return s.slice(0,lim).trim()+`

[...] aperçu raccourci - le message part en entier sur Discord`;
}
function discordPreview(payload,max){
  const lim=(max>0)?max:1200;
  const e=(payload.embeds||[])[0];
  const strip=s=>String(s||"").split("**").join("");
  const head=payload.content?("Mention : "+payload.content.replace(/<@&[0-9]+>/g,"@role").trim()+"\n"):"";
  if(!e) return _dpCap(strip(payload.content),lim);
  let out=head+(e.title||"")+"\n"+strip(e.description);
  (e.fields||[]).forEach(f=>{out+="\n"+f.name+" : "+f.value;});
  return _dpCap(out,lim);
}

async function discordConfirmSend(kind,payload){
  const url = kind==="annonces"      ? state.discord.annonces
            : kind==="formation"     ? state.discord.formations
            : kind==="recrutTrooper" ? state.discord.recrutTrooper
            : kind==="recrutAlpha"   ? state.discord.recrutAlpha
            : kind==="rapports"      ? state.discord.rapports
            : state.discord.promo;
  const salon = kind==="annonces"      ? "le salon des annonces"
              : kind==="formation"     ? "le salon des rapports"
              : kind==="recrutTrooper" ? "le salon des recrutements ARC Trooper"
              : kind==="recrutAlpha"   ? "le salon des recrutements ARC Alpha"
              : kind==="rapports"      ? "le salon des comptes rendus"
              : "le salon de l'unité";
  if(!url) return false;
  const useIdentity = kind!=="formation"&&kind!=="rapports";
  const ok=await uiConfirm({
    kicker:"// DISCORD",
    title:`Envoyer dans ${salon} ?`,
    message:discordPreview(payload),
    okText:"Envoyer"
  });
  if(!ok) return false;
  const sent=await discordSend(url,payload,useIdentity);
  toast(sent?`Envoyé dans ${salon} ✓`:`Échec de l'envoi vers ${salon}`,sent?"success":"error");
  return sent;
}

function renderDiscordPanel(){
  const p=document.getElementById("discordPanel");
  if(!p) return;
  if(!canConfigDiscord()){ p.style.display="none"; return; }
  p.style.display="block";
  const a=document.getElementById("dscAnnonces"), b=document.getElementById("dscPromo"),
        st=document.getElementById("dscStyle");
  if(a) a.value=state.discord.annonces||"";
  if(b) b.value=state.discord.promo||"";
  const fo=document.getElementById("dscFormations");
  if(fo) fo.value=state.discord.formations||"";
  const rt=document.getElementById("dscRecrutTrooper"), ra=document.getElementById("dscRecrutAlpha");
  if(rt) rt.value=state.discord.recrutTrooper||"";
  if(ra) ra.value=state.discord.recrutAlpha||"";
  const rr=document.getElementById("dscRecrutRoles");
  if(rr) rr.value=state.discord.recrutRoles||"";
  const rp=document.getElementById("dscRapports");
  if(rp) rp.value=state.discord.rapports||"";
  if(st) st.value=state.discord.style||"detaille";
  const bn=document.getElementById("dscBotName"),
        ba=document.getElementById("dscBotAvatar");
  if(bn) bn.value=state.discord.botName||"";
  if(ba) ba.value=state.discord.botAvatar||"";
}

async function saveDiscordConfig(){
  if(!canConfigDiscord()){toast("Réservé aux CMD+","error");return;}
  const a=(document.getElementById("dscAnnonces").value||"").trim();
  const b=(document.getElementById("dscPromo").value||"").trim();
  const fo=(document.getElementById("dscFormations").value||"").trim();
  const rt=(document.getElementById("dscRecrutTrooper").value||"").trim();
  const ra=(document.getElementById("dscRecrutAlpha").value||"").trim();
  const rr=(document.getElementById("dscRecrutRoles").value||"").trim();
  const rp=(document.getElementById("dscRapports").value||"").trim();
  const st=document.getElementById("dscStyle").value||"detaille";
  const bn=(document.getElementById("dscBotName").value||"").trim();
  const ba=(document.getElementById("dscBotAvatar").value||"").trim();
  const bad=[a,b,fo,rt,ra,rp].filter(u=>u&&!/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(u));
  if(bad.length){toast("Ce n'est pas une URL de webhook Discord","error");return;}
  if(ba&&!/^https:\/\//.test(ba)){toast("L'avatar doit être une URL en https","error");return;}
  state.discord.annonces=a; state.discord.promo=b; state.discord.formations=fo; state.discord.recrutTrooper=rt; state.discord.recrutAlpha=ra; state.discord.recrutRoles=rr; state.discord.rapports=rp;
  state.discord.style=st; state.discord.botName=bn; state.discord.botAvatar=ba;
  if(supaOK){
    /* Les webhooks passent par arc_discord_set quand il existe : la cle
       publique n'a plus le droit de les ecrire en direct. */
    const ecrit=await discordPersist({discordAnnonces:a,discordPromo:b,discordFormations:fo,
      discordRecrutTrooper:rt,discordRecrutAlpha:ra,discordRecrutRoles:rr,discordRapports:rp,
      discordStyle:st,discordBotName:bn,discordBotAvatar:ba});
    if(!ecrit){toast("La base a refusé la configuration Discord","error");return;}
  } else saveLS();
  toast("Configuration Discord enregistrée","success");
  await logActivity(`${session?.user} a modifié la configuration des webhooks Discord`);
}

async function testDiscord(kind){
  const url = kind==="annonces"      ? state.discord.annonces
            : kind==="formation"     ? state.discord.formations
            : kind==="recrutTrooper" ? state.discord.recrutTrooper
            : kind==="recrutAlpha"   ? state.discord.recrutAlpha
            : kind==="rapports"      ? state.discord.rapports
            : state.discord.promo;
  if(!url){toast("Colle d'abord l'URL du webhook","error");return;}
  const demo={matricule:"A-00",nom:"Test",grade:"CPT",regiment_rct:"501st"};
  const payload = kind==="promo"    ? discordPromoPayload(demo,"LT","CPT",session?.user)
                : kind==="mouvements"? discordMouvementPayload(demo,"reserve","Test de liaison",session?.user)
                : kind==="cmd"       ? discordCmdPayload({member_name:"A-00 Test",points:1,role:"Chef",mission_name:"Test de liaison"},demo,session?.user)
                : kind==="formation" ? discordFormationPayload({formateur:"A-93 Karma",eleve:"4477 Thire",formation:"CMD de mission",statut:"Validé",date:new Date().toISOString().slice(0,10)},session?.user,false)
                : kind==="recrutTrooper" ? recTestPayload("trooper")
                : kind==="recrutAlpha"   ? recTestPayload("alpha")
                : kind==="rapports"  ? discordRapportPayload({titre:"Test de liaison",type:"Autre",
                    author_name:"A-00 Test",author_grade:"ARC",
                    contenu:"Si tu lis ceci, le salon des comptes rendus fonctionne."},session?.user)
                : discordAnnoncePayload("Test de liaison","Si tu lis ceci, le webhook fonctionne.",false,session?.user);
  const sent=await discordSend(url,payload,kind!=="formation"&&kind!=="rapports");
  toast(sent?"Message de test envoyé ✓":"Échec - vérifie l'URL",sent?"success":"error");
}
