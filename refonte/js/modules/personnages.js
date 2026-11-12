/* ARC ALPHA - Module personnages. */
const PERSO_GRADE_COLORS={MJR:"#ff8a3d",CPT:"#ff3b5c",LTN:"#6f9bff"};
const PERSO_GRADE_RANK={MJR:3,CPT:2,LTN:1};
const PERSONNAGES=[
  {mat:"A-58",nom:"Trantos",grade:"MJR",
   rp:"Autoritaire et direct, il décide vite et assume seul. Il ne supporte pas l'hésitation en pleine opération et coupe court aux débats. Dur mais juste : il ne demande jamais à ses hommes ce qu'il ne ferait pas lui-même. À jouer comme celui qui tranche quand personne d'autre n'ose.",
   lore:"Monté en grade sur le terrain plutôt que par la formation. Il a repris le commandement d'unités décapitées en pleine bataille plus d'une fois, et en a gardé l'habitude de décider sans attendre l'aval du haut commandement."},
  {mat:"A-26",nom:"Maze",grade:"CPT",
   rp:"Le plus insubordonné des Alphas. Il obéit, mais fait sentir ce qu'il pense. Sarcastique, direct, allergique aux ordres mal justifiés. Il respecte la compétence, pas le grade. À jouer sur la tension permanente, jamais sur la révolte ouverte.",
   lore:"Affecté à la protection rapprochée d'officiers Jedi, une mission qu'il vit comme une punition. Sa relation avec sa hiérarchie est une friction constante : il fait le travail, impeccablement, tout en refusant de prétendre que ça lui plaît."},
  {mat:"A-77",nom:"Fordo",grade:"CPT",
   rp:"Calme absolu sous le feu. Il ne hausse jamais le ton, sa voix reste égale même quand tout s'effondre autour. Protecteur envers ses hommes, respectueux envers les Jedi. C'est le modèle que les autres cherchent à devenir.",
   lore:"Meneur de l'assaut sur Muunilinst. Il est surtout connu pour être arrivé en extraction sur Hypori et avoir sorti d'une mort certaine des Jedi encerclés par les droïdes. Sa réputation le précède sur tous les fronts."},
  {mat:"A-98",nom:"Jangotat",grade:"CPT",
   rp:"Réservé, grave, tourné vers les autres. Il s'interroge sur ce qu'il est au-delà de son matricule, sans jamais en faire un fardeau pour son escouade. Loyal jusqu'au sacrifice - et à jouer comme tel.",
   lore:"Envoyé en infiltration longue durée sur Ord Cestus, il a vécu parmi des civils et y a entrevu une vie qui n'était pas la sienne. Il a fini par choisir de mourir pour que sa mission réussisse plutôt que de rentrer."},
  {mat:"A-17",nom:"Alpha",grade:"LTN",
   rp:"Froid, cassant, sans patience pour l'approximation. Il parle peu et chaque mot est un ordre ou un reproche. Il ne félicite jamais : chez lui, le silence vaut déjà approbation. Méfiant envers les Jedi, qu'il juge trop tendres pour la guerre. Une autorité qu'on ne discute pas.",
   lore:"Entraîné directement par Jango Fett, il a survécu à sa captivité et aux interrogatoires d'Asajj Ventress. C'est lui qui a formé la majorité des ARC en service. Sa doctrine : un ARC réfléchit seul et n'attend l'ordre de personne pour faire ce qui doit être fait."},
  {mat:"A-38",nom:"Aven",grade:"LTN",
   rp:"Posé, méthodique, difficile à faire sortir de ses gonds. Il écoute avant de parler et tempère les fortes têtes. C'est la voix de la raison du groupe - celui vers qui on se tourne quand un plan part en morceaux.",
   lore:"Réputé pour avoir ramené son escouade d'opérations que personne ne donnait gagnables, en faisant systématiquement passer le retour de ses hommes avant l'objectif."},
  {mat:"A-49",nom:"Stec",grade:"LTN",
   rp:"Bruyant, enthousiaste, franchement trop content de faire sauter des choses. Il détend l'ambiance et se moque de tout, y compris de lui-même. Mais dès que ça tourne mal, l'humour s'arrête net et le professionnel prend le relais.",
   lore:"Spécialiste des charges et du déminage. Sa réputation tient autant à son travail qu'aux histoires qu'il raconte à la caserne, dont la véracité diminue à chaque répétition."},
  {mat:"A-30",nom:"Sull",grade:"LTN",
   rp:"Silencieux, observateur, mal à l'aise dans le rôle qu'on lui a assigné. Il pose les questions que les autres évitent : pourquoi on se bat, pour qui, jusqu'à quand. À jouer comme quelqu'un qui doute sans jamais se plaindre.",
   lore:"Ses interrogations sur la guerre et sur la condition des clones l'ont mené à quitter les rangs en pleine campagne. Son nom reste un sujet sensible : pour les uns un déserteur, pour les autres le seul qui soit allé au bout de sa pensée."},
  {mat:"A-66",nom:"Muzzle",grade:"",
   rp:"Économe en mots au point d'en être déroutant. Il répond par monosyllabes et observe plus qu'il ne participe. Rien ne semble l'atteindre. Quand il parle enfin, tout le monde écoute - parce que ça n'arrive presque jamais pour rien.",
   lore:"Son surnom lui vient d'une opération entière conduite sans un mot à la radio, sa position tenue pendant des heures. Il ne raconte jamais ses propres missions."}
];

function renderPersonnages(){
  const el=document.getElementById("persoList");
  if(!el)return;
  const sorted=[...PERSONNAGES].sort((a,b)=>
    (PERSO_GRADE_RANK[b.grade]||0)-(PERSO_GRADE_RANK[a.grade]||0)
    || a.mat.localeCompare(b.mat,"fr",{numeric:true}));
  el.innerHTML=sorted.map(p=>{
    const c=PERSO_GRADE_COLORS[p.grade]||"var(--dm)";
    return `<div class="perso" style="--pc:${c}">
    <div class="perso-h"><span class="perso-mat">${esc(p.mat)}</span><span class="perso-nm">${esc(p.nom)}</span>
      ${p.grade?`<span class="perso-gr" style="color:${c};border-color:${c}">${esc(p.grade)}</span>`:""}</div>
    <div class="perso-k">Comportement</div>
    <div class="perso-t">${esc(p.rp)}</div>
    <div class="perso-k">Contexte</div>
    <div class="perso-t">${esc(p.lore)}</div>
  </div>`;}).join("");
}
