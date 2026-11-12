/* ARC ALPHA - Module recrutements. */
/* ============================================================
   COMPTES RENDUS DE RECRUTEMENT
   Reprend les questions des deux formulaires « Résultat Recrutement
   ARC Trooper » et « Résultat Recrutement ARC Alpha ». Rien n'est stocké
   en base : le compte rendu part dans le salon Discord prévu pour lui,
   après confirmation, comme tout le reste du site.
   ============================================================ */
/* Baremes par version du recrutement : valeurs de depart seulement. Ils
   vivent ensuite dans le formulaire lui-meme, champ « rcts », donc dans
   arc_config comme les questions et leur ordre. Ils s'editent depuis
   l'Administration, sans repasser par ce fichier.

   Une version ne declare que les maximums qui changent ; les autres epreuves
   gardent celui du formulaire. Ajouter une version tient donc a une ligne,
   ici comme dans l'editeur.

   Une liste, et non un objet indexe par le nom : l'editeur doit pouvoir
   renommer et reordonner, ce qu'une cle d'objet rend malcommode. */
const RCT_BAREMES=[
  {nom:"RCT 1",seuil:110,max:{}},
  {nom:"RCT 2",seuil:110,max:{}},
  {nom:"RCT 3",seuil:110,max:{}},
  {nom:"RCT 4",seuil:110,max:{}}
];

const REC_DEFAULTS={
  trooper:{
    cle:"recrutTrooper",
    titre:"Résultat Recrutement ARC Trooper",
    kicker:"// RECRUTEMENT ARC TROOPER",
    secInfos:"Informations des personnels 👥",
    secNotes:"Résultats 💹",
    secFin:"Conclusion 👀",
    infos:[
      {id:"date",     label:"Date du recrutement 📆",              type:"date"},
      {id:"formateur",label:"Matricule de l'Alpha formateur 👨‍🏫",   type:"text", ph:"ex : A-93"},
      {id:"presents", label:"ARC Alpha présents 🖐",               type:"text", ph:"ex : A-93, A-41, A-20"},
      {id:"eleve",    label:"Matricule du formé 🧑",               type:"text", ph:"ex : 4477"}
    ],
    notes:[
      {id:"questions", label:"Questions ❓",      max:10},
      {id:"tir",       label:"Moyenne de tir 🔫", max:10},
      {id:"grappin",   label:"Grappin 🌋",        max:10},
      {id:"cqb",       label:"CQB 🏠",            max:10},
      {id:"vehicule",  label:"Véhicule/Spé 🚁",   max:10},
      {id:"discipline",label:"Discipline 🎭",     max:10},
      {id:"citadelle", label:"Citadelle ⚡",       max:10}
    ],
    essais:true
  },
  alpha:{
    cle:"recrutAlpha",
    titre:"Résultat Recrutement ARC Alpha",
    kicker:"// RECRUTEMENT ARC ALPHA",
    secInfos:"Informations des personnels 👥",
    secNotes:"Résultats aux épreuves 💹",
    secFin:"Conclusion 👀",
    infos:[
      {id:"date",     label:"Date du recrutement 📆",                  type:"date"},
      {id:"formateur",label:"Matricule de l'Alpha formateur 👨‍🏫",       type:"text", ph:"ex : A-93"},
      {id:"presents", label:"ARC Alpha présents 🖐",                   type:"text", ph:"ex : A-93, A-41, A-20"},
      {id:"eleve",    label:"Régiment + Matricule + Nom du formé 🧑",  type:"text", ph:"ex : 501st 4477 Thire"}
    ],
    notes:[
      {id:"theorie",   label:"Questions sur l'ARC Alpha ❓", max:25},
      {id:"strategie", label:"Stratégie Militaire 🧠",      max:10},
      {id:"ordres",    label:"Ordres CMDM 📕",              max:20},
      {id:"leadership",label:"Leadership 📕",               max:15},
      {id:"grappin",   label:"Grappin 🌋",                  max:10},
      {id:"jetpack",   label:"Jetpack 🌋",                  max:10},
      {id:"cqb",       label:"CQB 🏠",                      max:15},
      {id:"precision", label:"Technique de Tir 🔫",         max:20},
      {id:"citadelle", label:"Citadelle ⚡",                 max:10},
      {id:"discipline",label:"Discipline 🎭",               max:10}
    ],
    essais:false,
    /* Le formulaire ARC Alpha a change de bareme en cours de route : la
       theorie, le CQB et le reste n'ont pas bouge, mais la strategie
       militaire et les ordres CMDM pesent plus lourd depuis le RCT 2.
       Une copie, pour que l'editeur ne modifie jamais la constante. */
    rcts:JSON.parse(JSON.stringify(RCT_BAREMES))
  }
};

/* Les deux formulaires sont modifiables depuis le site : les questions, leur
   ordre, leur barème et le titre vivent dans arc_config (clé « content »,
   champ recForms), comme l'organisation des menus. La clé du webhook et
   l'identifiant du formulaire ne sont jamais pris dans la configuration :
   ils restent ceux du code, pour qu'un formulaire ne puisse pas être
   détourné vers un autre salon. */
let REC_FORMS=JSON.parse(JSON.stringify(REC_DEFAULTS));
let _recDraft=null, _recEditKind="trooper";

function recNettoieSpec(base,s){
  if(!s||typeof s!=="object")return base;
  if(typeof s.titre==="string"&&s.titre.trim())base.titre=s.titre.trim().slice(0,80);
  if(Array.isArray(s.infos)){
    const l=s.infos.filter(f=>f&&f.id&&f.label).map(f=>({
      id:String(f.id).replace(/[^A-Za-z0-9_]/g,"").slice(0,24)||("f"+Math.random().toString(36).slice(2,7)),
      label:String(f.label).slice(0,120),
      type:f.type==="date"?"date":"text",
      ph:f.ph?String(f.ph).slice(0,80):""
    }));
    if(l.length)base.infos=l;
  }
  if(Array.isArray(s.notes)){
    const l=s.notes.filter(n=>n&&n.id&&n.label).map(n=>({
      id:String(n.id).replace(/[^A-Za-z0-9_]/g,"").slice(0,24)||("n"+Math.random().toString(36).slice(2,7)),
      label:String(n.label).slice(0,120),
      max:Math.max(1,Math.min(1000,parseFloat(n.max)||10))
    }));
    if(l.length)base.notes=l;
  }
  if("essais" in s)base.essais=!!s.essais;
  /* Les versions viennent d'arc_config, donc d'une base que l'on peut
     editer : on les assainit comme les questions. Une liste vide est une
     consigne valable, elle rend au formulaire son bareme unique. */
  if(Array.isArray(s.rcts)){
    const vus={}, l=[];
    s.rcts.forEach(v=>{
      if(!v||typeof v!=="object")return;
      const nom=String(v.nom||"").trim().slice(0,24);
      if(!nom||vus[nom])return;
      vus[nom]=1;
      const mx={};
      if(v.max&&typeof v.max==="object"){
        Object.keys(v.max).forEach(k=>{
          const id=String(k).replace(/[^A-Za-z0-9_]/g,"").slice(0,24);
          const n=parseFloat(v.max[k]);
          if(id&&!isNaN(n))mx[id]=Math.max(1,Math.min(1000,n));
        });
      }
      const seuil=parseFloat(v.seuil);
      l.push({nom:nom,seuil:isNaN(seuil)?0:Math.max(0,Math.min(100000,seuil)),max:mx});
    });
    base.rcts=l;
  }
  return base;
}
function recFormsLoad(){
  const base=JSON.parse(JSON.stringify(REC_DEFAULTS));
  try{
    const raw=state.content&&state.content.recForms;
    const saved=typeof raw==="string"?JSON.parse(raw):raw;
    if(saved&&typeof saved==="object"){
      ["trooper","alpha"].forEach(k=>{ base[k]=recNettoieSpec(base[k],saved[k]); });
    }
  }catch(e){console.warn("recFormsLoad",e);}
  REC_FORMS=base;
  return base;
}
function recFormsPourBase(){
  const out={};
  ["trooper","alpha"].forEach(k=>{
    const s=_recDraft[k];
    out[k]={titre:s.titre,essais:!!s.essais,
      infos:s.infos.map(f=>({id:f.id,label:f.label,type:f.type,ph:f.ph||""})),
      notes:s.notes.map(n=>({id:n.id,label:n.label,max:n.max})),
      rcts:recVersions(s).map(v=>({nom:v.nom,seuil:v.seuil,max:Object.assign({},v.max||{})}))};
  });
  return out;
}

function canEditRecForms(){
  if(!Auth.ok()) return false;
  if(session.role==="admin"||session.role==="amiraute") return true;
  if(session.role==="brs") return false;
  return gradeLevel(getSessionGrade())>=6;
}

function recEditorPick(kind){ if(REC_FORMS[kind]){_recEditKind=kind;renderRecEditor();} }
function recDraftInit(){ _recDraft=JSON.parse(JSON.stringify(REC_FORMS)); }
function recNouvelId(p){ return p+Math.random().toString(36).slice(2,7); }

function recDraftSet(sec,i,prop,val){
  const s=_recDraft[_recEditKind]; if(!s||!s[sec]||!s[sec][i])return;
  if(prop==="max"){ const v=parseFloat(val); s[sec][i].max=isNaN(v)?1:Math.max(1,Math.min(1000,v)); }
  else s[sec][i][prop]=String(val);
  if(prop==="max")renderRecEditor();
}
function recDraftAdd(sec){
  const s=_recDraft[_recEditKind]; if(!s)return;
  if(sec==="infos")s.infos.push({id:recNouvelId("f"),label:"Nouvelle information",type:"text",ph:""});
  else s.notes.push({id:recNouvelId("n"),label:"Nouvelle épreuve",max:10});
  renderRecEditor();
}
function recDraftDel(sec,i){
  const s=_recDraft[_recEditKind]; if(!s||!s[sec])return;
  if(s[sec].length<=1){toast("Il faut garder au moins une ligne","error");return;}
  const parti=s[sec][i];
  s[sec].splice(i,1);
  /* Retirer une epreuve doit retirer ses surcharges : sinon elles dormiraient
     en base et reviendraient si un jour un identifiant tombait sur le meme. */
  if(sec==="notes"&&parti)recVersions(s).forEach(v=>{ if(v.max)delete v.max[parti.id]; });
  renderRecEditor();
}
function recDraftMove(sec,i,dir){
  const s=_recDraft[_recEditKind]; if(!s||!s[sec])return;
  const j=i+dir; if(j<0||j>=s[sec].length)return;
  const t=s[sec][i]; s[sec][i]=s[sec][j]; s[sec][j]=t; renderRecEditor();
}
function recDraftEssais(v){ const s=_recDraft[_recEditKind]; if(s){s.essais=!!v;renderRecEditor();} }

/* ----- les versions du recrutement, dans l'editeur ----- */
function recNomVersionLibre(s){
  const pris={}; recVersions(s).forEach(v=>{pris[v.nom]=1;});
  for(let i=1;i<200;i++){ const n="RCT "+i; if(!pris[n])return n; }
  return "Nouvelle version";
}
function recDraftRctAdd(){
  const s=_recDraft[_recEditKind]; if(!s)return;
  if(!Array.isArray(s.rcts))s.rcts=[];
  /* La nouvelle version reprend le bareme de la precedente : c'est presque
     toujours ce qu'on veut, et il ne reste qu'a changer ce qui differe. */
  const der=s.rcts[s.rcts.length-1];
  s.rcts.push({nom:recNomVersionLibre(s),
               seuil:der?der.seuil:0,
               max:der?Object.assign({},der.max):{}});
  renderRecEditor();
}
function recDraftRctDel(i){
  const s=_recDraft[_recEditKind]; if(!s||!s.rcts||!s.rcts[i])return;
  s.rcts.splice(i,1);
  renderRecEditor();
}
function recDraftRctSet(i,prop,val){
  const s=_recDraft[_recEditKind]; if(!s||!s.rcts||!s.rcts[i])return;
  if(prop==="seuil"){ const v=parseFloat(val); s.rcts[i].seuil=isNaN(v)?0:Math.max(0,Math.min(100000,v)); }
  else s.rcts[i].nom=String(val).slice(0,24);
  renderRecEditor();
}
function recDraftRctMax(i,noteId,val){
  const s=_recDraft[_recEditKind]; if(!s||!s.rcts||!s.rcts[i])return;
  const note=(s.notes||[]).find(n=>n.id===noteId); if(!note)return;
  if(!s.rcts[i].max)s.rcts[i].max={};
  const v=parseFloat(val);
  /* Une valeur egale au bareme du formulaire n'est pas une exception : on
     retire la surcharge au lieu de la figer, pour qu'elle continue de suivre
     si ce bareme change plus tard. */
  if(isNaN(v)||v===note.max)delete s.rcts[i].max[noteId];
  else s.rcts[i].max[noteId]=Math.max(1,Math.min(1000,v));
  renderRecEditor();
}
function recDraftTitre(v){ const s=_recDraft[_recEditKind]; if(s)s.titre=String(v).slice(0,80); }

function renderRecEditor(){
  const p=document.getElementById("recEditorPanel");
  if(!p)return;
  if(!canEditRecForms()){p.style.display="none";return;}
  p.style.display="";
  if(!_recDraft)recDraftInit();
  const sel=document.getElementById("recEditKind");
  if(sel&&sel.value!==_recEditKind)sel.value=_recEditKind;
  const box=document.getElementById("recEditorBox");
  if(!box)return;
  const s=_recDraft[_recEditKind];
  const fleches=(sec,i,n)=>`
    <button class="sbtn" style="padding:.15rem .4rem" title="Monter" ${i===0?"disabled":""} onclick="recDraftMove('${esc(sec)}',${i},-1)">↑</button>
    <button class="sbtn" style="padding:.15rem .4rem" title="Descendre" ${i===n-1?"disabled":""} onclick="recDraftMove('${esc(sec)}',${i},1)">↓</button>
    <button class="sbtn danger" style="padding:.15rem .4rem" title="Retirer" onclick="recDraftDel('${esc(sec)}',${i})">✕</button>`;
  let h=`<div class="field"><label>Titre du formulaire</label>
    <input type="text" value="${esc(s.titre)}" maxlength="80" oninput="recDraftTitre(this.value)"></div>`;
  h+=`<div class="rec-sec">Informations des personnels</div>`;
  h+=s.infos.map((f,i)=>`<div class="rec-erow">
      <input type="text" class="inline-inp" value="${esc(f.label)}" maxlength="120" style="flex:1 1 190px;min-width:0"
        oninput="recDraftSet('infos',${i},'label',this.value)" title="Libellé de la question">
      <select class="inline-sel" style="flex:0 0 90px" onchange="recDraftSet('infos',${i},'type',this.value)" title="Type de réponse">
        <option value="text"${f.type!=="date"?" selected":""}>Texte</option>
        <option value="date"${f.type==="date"?" selected":""}>Date</option>
      </select>
      <input type="text" class="inline-inp" value="${esc(f.ph||"")}" maxlength="80" style="flex:1 1 150px;min-width:0"
        oninput="recDraftSet('infos',${i},'ph',this.value)" placeholder="Exemple affiché en gris" title="Aide de saisie">
      ${fleches("infos",i,s.infos.length)}
    </div>`).join("");
  h+=`<button class="sbtn" style="margin-top:.3rem" onclick="recDraftAdd('infos')">+ Information</button>`;
  const tot=s.notes.reduce((t,n)=>t+(parseFloat(n.max)||0),0);
  /* Avec des versions, annoncer un total unique serait faux. */
  let totTxt=`total sur ${tot}`;
  if(recAVersions(s)){
    const b=recVersions(s).map(v=>recTotalRct(s,v.nom));
    const lo=Math.min(...b), hi=Math.max(...b);
    totTxt=(lo===hi)?`total sur ${lo}`:`total sur ${lo} à ${hi} selon la version`;
  }
  h+=`<div class="rec-sec">Épreuves notées <span class="c-dm">· ${esc(totTxt)}</span></div>`;
  h+=s.notes.map((n,i)=>`<div class="rec-erow">
      <input type="text" class="inline-inp" value="${esc(n.label)}" maxlength="120" style="flex:1 1 190px;min-width:0"
        oninput="recDraftSet('notes',${i},'label',this.value)" title="Libellé de l'épreuve">
      <input type="number" class="inline-inp" value="${n.max}" min="1" max="1000" step="1" style="flex:0 0 80px"
        onchange="recDraftSet('notes',${i},'max',this.value)" title="Barème">
      ${fleches("notes",i,s.notes.length)}
    </div>`).join("");
  h+=`<button class="sbtn" style="margin-top:.3rem" onclick="recDraftAdd('notes')">+ Épreuve</button>`;
  /* Les versions, en tableau : epreuves en lignes, versions en colonnes.
     C'est la seule disposition ou l'on compare deux baremes d'un coup d'oeil,
     et elle reste courte meme avec six versions. */
  const vs=recVersions(s);
  h+=`<div class="rec-sec">Versions du recrutement <span class="c-dm">· barème par version</span></div>`;
  h+=`<p style="font-size:.76rem;color:var(--dm);margin:-.3rem 0 .7rem">`
    +(vs.length
      ? `Une version ne change que les épreuves qui diffèrent : les autres suivent le barème ci-dessus `
        +`<span class="c-ac">et s'affichent en cyan quand elles sont propres à la version</span>.`
      : `Aucune version : le formulaire garde un barème unique et ne demande pas de RCT.`)
    +`</p>`;
  if(vs.length){
    h+=`<div class="rec-bar-wrap"><table class="rec-bar"><thead><tr><th>Épreuve</th>`
      +vs.map((v,i)=>`<th><input type="text" class="inline-inp" value="${esc(v.nom)}" maxlength="24"
          style="width:80px;text-align:center" onchange="recDraftRctSet(${i},'nom',this.value)"
          title="Nom de la version"><button class="sbtn danger" style="padding:.1rem .3rem;margin-left:.25rem"
          title="Retirer cette version" onclick="recDraftRctDel(${i})">✕</button></th>`).join("")
      +`</tr></thead><tbody>`;
    s.notes.forEach(n=>{
      h+=`<tr><td>${esc(recLabelCourt(n.label))||"&nbsp;"}</td>`
        +vs.map((v,i)=>{
          const propre=!!(v.max&&v.max[n.id]!=null);
          const val=propre?v.max[n.id]:n.max;
          return `<td><input type="number" class="inline-inp${propre?" rec-bar-sur":""}" value="${val}"
            min="1" max="1000" step="1" style="width:64px;text-align:center"
            onchange="recDraftRctMax(${i},'${esc(n.id)}',this.value)"
            title="${propre?"Propre à cette version":"Hérité du barème du formulaire"}"></td>`;
        }).join("")+`</tr>`;
    });
    h+=`<tr class="rec-bar-tot"><td>Total</td>`
      +vs.map(v=>`<td>${recTotalRct(s,v.nom)}</td>`).join("")+`</tr>`;
    h+=`<tr><td>Admis à partir de</td>`
      +vs.map((v,i)=>`<td><input type="number" class="inline-inp" value="${v.seuil}" min="0" max="100000" step="1"
         style="width:64px;text-align:center" onchange="recDraftRctSet(${i},'seuil',this.value)"
         title="Seuil d'admission"></td>`).join("")+`</tr>`;
    h+=`</tbody></table></div>`;
  }
  h+=`<button class="sbtn" style="margin-top:.3rem" onclick="recDraftRctAdd()">+ Version</button>`;

  h+=`<div class="rec-sec">Conclusion</div>
    <label class="act-mrow" style="display:inline-flex">
      <input type="checkbox"${s.essais?" checked":""} onchange="recDraftEssais(this.checked)">
      <span>Demander le numéro d'essai</span></label>
    <p style="font-size:.76rem;color:var(--dm);margin-top:.5rem">
      Le commentaire est toujours présent et toujours obligatoire.</p>`;
  box.innerHTML=h;
}

async function saveRecForms(){
  if(!canEditRecForms()){toast("Réservé aux CMD+","error");return;}
  if(!_recDraft){toast("Rien à enregistrer","info");return;}
  const souci=[];
  ["trooper","alpha"].forEach(k=>{
    const s=_recDraft[k];
    if(!s.titre||!s.titre.trim())souci.push("un titre est vide");
    if(!s.infos.length)souci.push("un formulaire n'a plus d'information");
    if(!s.notes.length)souci.push("un formulaire n'a plus d'épreuve");
    s.infos.concat(s.notes).forEach(x=>{ if(!String(x.label||"").trim())souci.push("un libellé est vide"); });
    s.notes.forEach(n=>{ if(!(n.max>=1))souci.push("un barème est invalide"); });
    const nomsVus={};
    recVersions(s).forEach(v=>{
      const nom=String(v.nom||"").trim();
      if(!nom)souci.push("une version de recrutement n'a pas de nom");
      else if(nomsVus[nom])souci.push(`deux versions s'appellent « ${nom} »`);
      else nomsVus[nom]=1;
      if(!(v.seuil>=0))souci.push("un seuil d'admission est invalide");
    });
  });
  if(souci.length){toast(souci[0],"error");return;}
  const _fc=await contentMerge(o=>{o.recForms=JSON.stringify(recFormsPourBase());});
  if(_fc===null){toast("Base injoignable : les formulaires n'ont pas été enregistrés","error");return;}
  recFormsLoad();
  recDraftInit();
  renderRecEditor();
  renderRecrutements();
  toast("✓ Formulaires enregistrés","success");
  await logActivity(`${session?.user} a modifié les formulaires de recrutement`);
}

async function resetRecForms(){
  if(!canEditRecForms()){toast("Réservé aux CMD+","error");return;}
  const nom=REC_DEFAULTS[_recEditKind].titre;
  const ok=await uiConfirm({title:"Réinitialiser ce formulaire",
    message:`Les questions de « ${nom} » reviennent à leur version d'origine. L'autre formulaire n'est pas touché.`,
    okText:"Réinitialiser",danger:true});
  if(!ok)return;
  if(!_recDraft)recDraftInit();
  _recDraft[_recEditKind]=JSON.parse(JSON.stringify(REC_DEFAULTS[_recEditKind]));
  renderRecEditor();
  toast("Formulaire remis par défaut - pense à enregistrer","info");
}
const REC_ESSAIS=["1er","2ème","3ème","4ème","5ème","6ème","7ème","8ème","9ème","10ème"];

function recMax(spec){ return spec.notes.reduce((t,n)=>t+n.max,0); }

/* Un formulaire demande une version des lors qu'il en declare au moins une :
   pas de drapeau separe a tenir a jour, donc pas de risque qu'il contredise
   la liste. Vider la liste depuis l'editeur rend simplement au formulaire son
   bareme unique. */
function recVersions(s){ return (s&&Array.isArray(s.rcts))?s.rcts:[]; }
function recAVersions(s){ return recVersions(s).length>0; }
function recVersion(s,nom){
  const n=String(nom||"").trim();
  if(!n)return null;
  return recVersions(s).find(v=>v&&v.nom===n)||null;
}

/* Le formulaire tel qu'il est, mais avec les maximums de la version choisie.
   On rend une copie : REC_FORMS ne doit jamais etre modifie, c'est lui qui
   porte la configuration enregistree. Sans version choisie, ou sur un
   formulaire qui n'en declare pas, on rend la specification telle quelle.
   Le rattachement se fait par identifiant d'epreuve : si quelqu'un renomme
   l'identifiant « strategie » depuis l'Administration, le bareme ne s'y
   applique plus, ce qui vaut mieux qu'un bareme qui suivrait un champ
   devenu autre chose. */
function recSpecRct(base,rct){
  const v=recVersion(base,rct);
  if(!v)return base;
  const s=JSON.parse(JSON.stringify(base));
  (s.notes||[]).forEach(n=>{ if(v.max&&v.max[n.id]!=null)n.max=v.max[n.id]; });
  s.rctChoisi=v.nom;
  s.seuil=v.seuil;
  return s;
}
function recRctLu(){ const e=document.getElementById("rec_rct"); return e?String(e.value||"").trim():""; }
function recSpecCourant(kind){ return recSpecRct(REC_FORMS[kind],recRctLu()); }
function recTotalRct(base,rct){ return recMax(recSpecRct(base,rct)); }
function recUrl(kind){ const s=REC_FORMS[kind]; return s?(state.discord[s.cle]||""):""; }
function recColorCss(pct){ return pct>=70?"var(--gr)":(pct>=50?"var(--or)":"var(--rd)"); }
function recColorInt(pct){ return pct>=70?0x22d97a:(pct>=50?0xff8a3d:0xff3b5c); }

function renderRecrutements(){
  recFormsLoad();
  const droit=canEdit("recrutements");
  [["trooper","recTrooperBtn","recTrooperWarn","recTrooperTitle","recTrooperDesc"],
   ["alpha","recAlphaBtn","recAlphaWarn","recAlphaTitle","recAlphaDesc"]].forEach(([k,bid,wid,tid,did])=>{
    const s=REC_FORMS[k];
    const b=document.getElementById(bid), w=document.getElementById(wid),
          t=document.getElementById(tid), p=document.getElementById(did);
    if(b)b.style.display=droit?"":"none";
    if(w)w.style.display=(droit&&!recUrl(k))?"":"none";
    if(t)t.textContent=s.titre;
    /* Avec un bareme par RCT, annoncer un total unique serait faux. */
    let tot=`total sur ${recMax(s)}`;
    if(recAVersions(s)){
      const bornes=recVersions(s).map(v=>recTotalRct(s,v.nom));
      const lo=Math.min(...bornes), hi=Math.max(...bornes);
      tot=(lo===hi)?`total sur ${lo}`:`total sur ${lo} à ${hi} selon le RCT`;
    }
    if(p)p.textContent=`${s.infos.length} information${s.infos.length>1?"s":""} · `
      +`${s.notes.length} épreuve${s.notes.length>1?"s":""} · ${tot}`
      +(s.essais?" · numéro d'essai":"")+" · commentaire";
  });
  const nr=document.getElementById("recNoRight");
  if(nr)nr.style.display=droit?"none":"";
  const tag=document.getElementById("recSalonTag");
  if(tag){
    const n=["trooper","alpha"].filter(k=>recUrl(k)).length;
    tag.textContent=n===2?"2 salons configurés":(n===1?"1 salon sur 2 configuré":"aucun salon configuré");
  }
  renderRecEditor();
}

function recFieldHtml(f){
  const ph=f.ph?` placeholder="${esc(f.ph)}"`:"";
  return `<div class="field"><label>${esc(f.label)}</label>
    <input type="${f.type==="date"?"date":"text"}" id="rec_${esc(f.id)}" autocomplete="off"${ph}></div>`;
}
function recNoteHtml(n){
  /* Le maximum porte un identifiant : il change quand on change de RCT. */
  return `<div class="field"><label>${esc(n.label)} <span class="hint rec-nmax" id="recmax_${esc(n.id)}">/ ${n.max}</span></label>
    <input type="number" id="rec_${esc(n.id)}" min="0" max="${n.max}" step="0.5" inputmode="decimal" oninput="recTotal()" placeholder="0"></div>`;
}
function recBuild(kind){
  const s=REC_FORMS[kind];
  let h=`<div class="rec-sec">${esc(s.secInfos)}</div>`;
  /* Le RCT commande tout le reste du formulaire : il vient donc en premier. */
  if(recAVersions(s)){
    h+=`<div class="field"><label>RCT passé 🎖 <span style="color:var(--rd);font-weight:400">obligatoire</span></label>`
      +`<select id="rec_rct" onchange="recRctChange()">`
      +`<option value="">Sélectionner…</option>`
      +recVersions(s).map(v=>
        `<option value="${esc(v.nom)}">${esc(v.nom)} · sur ${recTotalRct(s,v.nom)} · admis à ${v.seuil}</option>`).join("")
      +`</select></div>`;
  }
  h+=`<div class="form-row fr2">${s.infos.slice(0,2).map(recFieldHtml).join("")}</div>`;
  h+=s.infos.slice(2).map(recFieldHtml).join("");
  h+=`<div class="rec-sec">${esc(s.secNotes)}</div>`;
  h+=`<div class="rec-tot"><span class="n" id="recTotN">0</span><span class="k" id="recTotMax">sur ${recMax(s)} points</span><span class="k" id="recTotPct"></span><span class="k" id="recAdmis"></span></div>`;
  h+=`<div class="rec-grid">${s.notes.map(recNoteHtml).join("")}</div>`;
  h+=`<div class="rec-sec">${esc(s.secFin)}</div>`;
  h+=`<div class="field"><label>Commentaire 💬</label><textarea id="rec_commentaire" rows="4" placeholder="Ce qui a marché, ce qui doit être retravaillé"></textarea></div>`;
  if(s.essais){
    h+=`<div class="field"><label>Combientième d'essais 📈</label><select id="rec_essais">`
      +`<option value="">Sélectionner…</option>`
      +REC_ESSAIS.map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join("")
      +`</select></div>`;
  }
  return h;
}

/* Changement de RCT : les maximums affiches, les bornes des champs, le total
   et le verdict suivent. Une note deja saisie qui depasse le nouveau maximum
   est signalee en rouge et laissee telle quelle : la corriger en silence
   ferait perdre au formateur la valeur qu'il avait notee. */
function recRctChange(){
  const ke=document.getElementById("recKind");
  if(!ke||!REC_FORMS[ke.value])return;
  const s=recSpecCourant(ke.value);
  (s.notes||[]).forEach(n=>{
    const lab=document.getElementById("recmax_"+n.id);
    if(lab)lab.textContent="/ "+n.max;
    const el=document.getElementById("rec_"+n.id);
    if(el)el.max=n.max;
  });
  const tm=document.getElementById("recTotMax");
  if(tm)tm.textContent="sur "+recMax(s)+" points";
  recTotal();
}

function recTotal(){
  const ke=document.getElementById("recKind");
  const base=ke?REC_FORMS[ke.value]:null;
  if(!base)return 0;
  const s=recSpecCourant(ke.value);
  let t=0,horsBornes=0;
  s.notes.forEach(n=>{
    const el=document.getElementById("rec_"+n.id);
    const v=el?parseFloat(el.value):NaN;
    if(!isNaN(v))t+=v;
    const faux=!isNaN(v)&&(v<0||v>n.max);
    if(faux)horsBornes++;
    if(el)el.classList.toggle("rec-depasse",faux);
  });
  t=Math.round(t*2)/2;
  const max=recMax(s), pct=max?Math.round(t/max*100):0;
  const n=document.getElementById("recTotN"), p=document.getElementById("recTotPct");
  if(n){n.textContent=String(t);n.style.color=recColorCss(pct);}
  if(p)p.textContent=pct+" %";
  const a=document.getElementById("recAdmis");
  if(a){
    if(recAVersions(base)&&!s.rctChoisi){ a.textContent="RCT à choisir"; a.className="k"; }
    /* Un verdict calcule sur des notes hors bareme ne veut rien dire : on
       dit ce qu'il faut corriger plutot que d'affirmer une admission. */
    else if(horsBornes){
      a.textContent=horsBornes+" note"+(horsBornes>1?"s":"")+" hors barème";
      a.className="k rec-refuse";
    }
    else if(s.seuil!=null){
      const admis=t>=s.seuil;
      a.textContent=(admis?"Admis":"Non admis")+" · seuil "+s.seuil;
      a.className="k "+(admis?"rec-admis":"rec-refuse");
    }
    else { a.textContent=""; a.className="k"; }
  }
  return t;
}

function openRecModal(kind){
  const s=REC_FORMS[kind];
  if(!s)return;
  if(!canEdit("recrutements")){toast("Réservé aux SGT et au-dessus","error");return;}
  if(!recUrl(kind)){toast("Le webhook de ce salon n'est pas configuré","error");return;}
  document.getElementById("recKind").value=kind;
  document.getElementById("recKicker").textContent=s.kicker;
  document.getElementById("recFormTitle").textContent=s.titre;
  document.getElementById("recBody").innerHTML=recBuild(kind);
  document.getElementById("recErr").style.display="none";
  const d=document.getElementById("rec_date");
  /* date locale, pas UTC : sinon le champ affiche la veille en soirée */
  if(d){const z=new Date();z.setMinutes(z.getMinutes()-z.getTimezoneOffset());d.value=z.toISOString().slice(0,10);}
  const me=sessionMember();
  const f=document.getElementById("rec_formateur");
  if(f&&me&&me.matricule)f.value=me.matricule;
  recTotal();
  document.getElementById("recModal").classList.add("show");
}

function recLire(kind){
  const s=REC_FORMS[kind];
  const val=(id)=>{const el=document.getElementById("rec_"+id);return el?String(el.value||"").trim():"";};
  const d={infos:{},notes:{},commentaire:val("commentaire"),essais:s.essais?val("essais"):"",
           rct:recAVersions(s)?val("rct"):""};
  s.infos.forEach(f=>{d.infos[f.id]=val(f.id);});
  s.notes.forEach(n=>{d.notes[n.id]=val(n.id);});
  return d;
}

async function saveRecrutement(){
  const ke=document.getElementById("recKind");
  const kind=ke?ke.value:"";
  const s=REC_FORMS[kind];
  const err=document.getElementById("recErr");
  const fail=(m)=>{err.textContent=m;err.style.display="block";};
  if(err)err.style.display="none";
  if(!s)return;
  if(!canEdit("recrutements")){fail("Réservé aux SGT et au-dessus.");return;}
  if(!recUrl(kind)){fail("Le webhook de ce salon n'est pas configuré.");return;}

  const d=recLire(kind);
  /* Le bareme depend du RCT : on valide les notes contre les maximums de la
     version choisie, pas contre ceux du formulaire au repos. */
  const sp=recSpecRct(s,d.rct);
  /* toutes les questions des formulaires d'origine sont obligatoires */
  const manque=[];
  if(recAVersions(s)&&!d.rct)manque.push("RCT passé");
  s.infos.forEach(f=>{ if(!d.infos[f.id])manque.push(f.label); });
  sp.notes.forEach(n=>{
    const v=parseFloat(d.notes[n.id]);
    if(d.notes[n.id]===""||isNaN(v)){manque.push(n.label);return;}
    if(v<0||v>n.max)manque.push(`${n.label} (entre 0 et ${n.max})`);
  });
  if(!d.commentaire)manque.push("Commentaire");
  if(s.essais&&!d.essais)manque.push("Combientième d'essais");
  if(manque.length){fail("À compléter : "+manque.join(", "));return;}

  const total=recTotal(), max=recMax(sp);
  const payload=discordRecrutPayload(kind,d,total,max,session?.user,sp);
  const envoye=await discordConfirmSend(s.cle,payload);
  if(!envoye)return;
  closeModal("recModal");
  await logActivity(`${session?.user} a déposé un compte rendu de recrutement ${kind==="trooper"?"ARC Trooper":"ARC Alpha"}`
    +`${d.rct?" "+d.rct:""} pour ${d.infos.eleve} (${total}/${max}`
    +`${sp.seuil!=null?(total>=sp.seuil?", admis":", non admis"):""})`);
}

/* Rôles mentionnés sur les comptes rendus de recrutement, et nulle part
   ailleurs. Les deux identifiants ont été donnés par le commandement le
   2026-10-20 ; ils ne servent que si le champ de l'Administration est vide,
   lequel reste prioritaire. Pour ne mentionner personne, mettre un mot dans
   ce champ ("aucun") : il ne contient alors aucun identifiant valide. */
const RECRUT_ROLES_DEFAUT="946321599542485022 806676615052525630";
function recMentionIds(){
  const raw=String(state.discord.recrutRoles||"").trim()||RECRUT_ROLES_DEFAUT;
  return [...new Set(raw.match(/[0-9]{15,25}/g)||[])];
}

/* Barre de progression en blocs pleins et vides. */
function recBarre(pct,n){
  const t=n||10;
  const v=Math.max(0,Math.min(100,pct));
  let p=Math.round(v/100*t);
  /* seul 100 % remplit la barre, sinon 99 % et 100 % se ressemblent ;
     et une note non nulle garde toujours au moins un bloc visible */
  if(v<100&&p>=t)p=t-1;
  if(v>0&&p===0)p=1;
  return "█".repeat(p)+"░".repeat(t-p);
}

/* Les libellés du formulaire portent la question et son emoji : utiles à
   l'écran, bruyants dans un message. On les nettoie à l'envoi, sans toucher au
   formulaire, pour que le message continue de suivre les questions posées. */
function recLabelCourt(s){
  return String(s||"")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE0E}\u{FE0F}\u{200D}]/gu,"")
    .replace(/\s+/g," ").trim();
}

function discordRecrutPayload(kind,d,total,max,author,spec){
  /* La specification effective est passee par l'appelant quand un bareme de
     RCT s'applique : sans elle on retomberait sur les maximums au repos et
     le detail des notes serait faux. */
  const s=spec||REC_FORMS[kind];
  const pct=max?Math.round(total/max*100):0;

  /* En-tête : qui, par qui, quand, et le score tout de suite. C'est ce qu'on
     veut lire en premier ; le détail vient après. */
  const sujet=String(d.infos.eleve||"").trim();
  const par=String(d.infos.formateur||"").trim();
  let quand="";
  if(d.infos.date){ try{ quand=fmtDate(d.infos.date); }catch(e){ quand=String(d.infos.date); } }
  const tete=[];
  if(sujet)tete.push("**"+sujet+"**");
  const sous=[];
  if(par)sous.push("évalué par **"+par+"**");
  if(quand)sous.push(quand);
  if(sous.length)tete.push(sous.join("  ·  "));
  tete.push("");
  tete.push("`"+recBarre(pct,20)+"`  **"+total+" / "+max+"**  ·  **"+pct+" %**");
  /* La version passee et le verdict, sur leur propre ligne : c'est ce qu'on
     cherche en premier quand on relit un compte rendu des mois plus tard. */
  if(s.rctChoisi){
    const verdict=(s.seuil!=null)?(total>=s.seuil?"Admis":"Non admis"):"";
    /* Le score est deja sur la ligne juste au-dessus : le repeter ici
       n'ajoutait rien et alourdissait l'en-tete. */
    tete.push("**"+s.rctChoisi+"**"
      +(verdict?"  ·  **"+verdict+"**":"")
      +(s.seuil!=null?"  _(seuil "+s.seuil+")_":""));
  }

  const fields=[];

  /* Les informations qui ne sont pas déjà dans l'en-tête. */
  const vus=["eleve","formateur","date"];
  const reste=(s.infos||[]).filter(f=>vus.indexOf(f.id)===-1).map(f=>{
    let v=String(d.infos[f.id]||"-");
    if(f.type==="date"&&d.infos[f.id]){ try{ v=fmtDate(d.infos[f.id]); }catch(e){} }
    return "**"+recLabelCourt(f.label)+"** · "+v;
  });
  if(reste.length)fields.push({name:recLabelCourt(s.secInfos)||"Informations",
    value:reste.join("\n").slice(0,1024),inline:false});

  /* Les notes dans un bloc à chasse fixe : les colonnes s'alignent, au lieu de
     partir en grille de trois où plus rien ne se compare. */
  const lg=(s.notes||[]).map(n=>{
    const v=parseFloat(d.notes[n.id])||0;
    const p=n.max?Math.round(v/n.max*100):0;
    let lab=recLabelCourt(n.label);
    if(lab.length>20)lab=lab.slice(0,19)+"…";
    return {lab:lab,sc:v+"/"+n.max,p:p};
  });
  if(lg.length){
    const wl=Math.max(4,...lg.map(l=>l.lab.length));
    const ws=Math.max(5,...lg.map(l=>l.sc.length));
    const lignes=lg.map(l=>
      l.lab.padEnd(wl)+"  "+l.sc.padStart(ws)+"  "+recBarre(l.p,9)+" "+(l.p+"%").padStart(4));
    let bloc=lignes.join("\n");
    /* on coupe sur une ligne entière : un bloc de code tronqué au milieu
       resterait ouvert et avalerait la suite du message */
    while(bloc.length>980&&lignes.length>1){ lignes.pop(); bloc=lignes.join("\n")+"\n…"; }
    fields.push({name:recLabelCourt(s.secNotes)||"Évaluation",
      value:"```\n"+bloc+"\n```",inline:false});
  }

  if(s.essais&&String(d.essais||"").trim())
    fields.push({name:"Essai",value:String(d.essais).slice(0,1024),inline:true});
  const com=String(d.commentaire||"").trim();
  if(com)fields.push({name:recLabelCourt(s.secFin)||"Commentaire",value:com.slice(0,1024),inline:false});

  const _m=recMentionIds();
  const _out={
    embeds:[{
      /* La version passe dans le titre : c'est la premiere chose lue dans le
         salon, et la seule que Discord reprend dans sa notification quand le
         message n'a pour contenu que des mentions. Une ligne de description
         se remarque beaucoup moins. */
      title:(recLabelCourt(s.titre||"Recrutement")
             +(s.rctChoisi?" · "+s.rctChoisi:"")).toUpperCase().slice(0,256),
      description:tete.join("\n").slice(0,4096),
      color:recColorInt(pct),
      fields:fields.slice(0,25),
      footer:{text:`Déposé par ${author||"?"} · Centre de Commandement`},
      timestamp:new Date().toISOString()
    }]};
  if(_m.length){ _out.content=_m.map(id=>"<@&"+id+">").join(" "); _out.allowed_mentions={roles:_m}; }
  return _out;
}

/* Jeu de valeurs pour le bouton « Tester » du panneau Discord. */
function recDemo(kind){
  const base=REC_FORMS[kind];
  /* Le test prend la derniere version declaree : c'est celle qu'on fait passer. */
  const vs=recVersions(base);
  const rct=vs.length?vs[vs.length-1].nom:"";
  const s=recSpecRct(base,rct);
  const d={infos:{},notes:{},commentaire:"Test de liaison : si tu lis ceci, le webhook fonctionne.",
           essais:s.essais?"1er":"",rct:rct};
  s.infos.forEach(f=>{
    d.infos[f.id]=f.id==="date"?new Date().toISOString().slice(0,10)
                 :f.id==="formateur"?"A-00"
                 :f.id==="presents"?"A-00, A-01"
                 :"0000 Test";
  });
  s.notes.forEach(n=>{ d.notes[n.id]=String(Math.round(n.max*0.8*2)/2); });
  return d;
}

/* Charge de démonstration pour le bouton « Tester » du panneau Discord. */
function recTestPayload(kind){
  const d=recDemo(kind), s=recSpecRct(REC_FORMS[kind],d.rct);
  let t=0; s.notes.forEach(n=>{ t+=parseFloat(d.notes[n.id])||0; });
  return discordRecrutPayload(kind,d,Math.round(t*2)/2,recMax(s),session?.user,s);
}
