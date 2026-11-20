"""Contenu du site R'ExoIA — source unique, quatre langues.

Chaque chaîne est écrite quatre fois : français (langue de travail), anglais,
portugais brésilien et chinois simplifié. Le générateur produit le HTML français
avec les clés `data-t`, puis `i18n.js` avec les trois autres langues.

Règle tenue partout : pas de traduction automatique déguisée. Les textes longs
(le récit de l'Architecte) sont intégraux en français — c'est le texte de
l'auteur — et fidèlement condensés dans les trois autres langues.
"""


def T(fr, en, pt, zh):
    return {"fr": fr, "en": en, "pt": pt, "zh": zh}


# ---------------------------------------------------------------------------
# Navigation et éléments communs
# ---------------------------------------------------------------------------
NAV = {
    "nav.accueil":  T("Accueil", "Home", "Início", "首页"),
    "nav.virtuel":  T("Labo virtuel", "Virtual Lab", "Laboratório virtual", "虚拟实验室"),
    "nav.neuroexo": T("R'ExoIA", "R'ExoIA", "R'ExoIA", "R'ExoIA"),
    "nav.devkit":   T("RealiDevKit", "RealiDevKit", "RealiDevKit", "RealiDevKit"),
    "nav.realia":   T("RealiaStation", "RealiaStation", "RealiaStation", "RealiaStation"),
    "nav.luna":     T("LunaGalaxie", "LunaGalaxie", "LunaGalaxie", "LunaGalaxie"),
    "nav.app":      T("R'Statio", "R'Statio", "R'Statio", "R'Statio"),
    "nav.social":   T("Projet social", "Social project", "Projeto social", "社会项目"),
    "nav.blueprint": T("Blueprint", "Blueprint", "Blueprint", "蓝图"),
    "nav.archi":    T("L'Architecte", "The Architect", "O Arquiteto", "建筑师"),
    "nav.cabinet":  T("Cabinet & Services", "Cabinet & Services", "Gabinete & Serviços", "工作室与服务"),
    "nav.wishlist": T("Wishlist", "Wishlist", "Lista de desejos", "心愿单"),
    "nav.boutique": T("Boutique", "Shop", "Loja", "商店"),

    "commun.soutenir": T("Soutenir", "Support", "Apoiar", "支持"),
    "commun.retour":   T("← Accueil", "← Home", "← Início", "← 首页"),
    "commun.suivant":  T("Tiroir suivant", "Next drawer", "Próxima gaveta", "下一个抽屉"),
    "commun.dernier":  T("Dernier tiroir", "Last drawer", "Última gaveta", "最后一个抽屉"),
    "commun.nonmed":   T("projet open source · prototype de recherche, non dispositif médical",
                         "open-source project · research prototype, not a medical device",
                         "projeto aberto · protótipo de pesquisa, não é dispositivo médico",
                         "开源项目 · 研究原型，非医疗器械"),
    "commun.pied_liens": T("Équipements", "Equipment", "Equipamentos", "设备"),
    "commun.bientot":  T("Bientôt", "Coming soon", "Em breve", "即将推出"),

    "audio.titre":     T("Luna · bande-son", "Luna · soundtrack", "Luna · trilha sonora", "Luna · 原声"),
    "audio.jouer":     T("Écouter Luna", "Play Luna", "Ouvir Luna", "播放 Luna"),
    "audio.pause":     T("Mettre en pause", "Pause", "Pausar", "暂停"),
}

# ---------------------------------------------------------------------------
# 1. Accueil
# ---------------------------------------------------------------------------
ACCUEIL = {
    "index.slogan1": T("On capte, on stimule, on simule.",
                 "We sense, we stimulate, we simulate.",
                 "Captamos, estimulamos, simulamos.",
                 "我们采集，我们刺激，我们仿真。"),
    "index.slogan2": T("Le chemin est là, c'est le parcourir qui va l'élargir.",
                 "The path is there; walking it is what will widen it.",
                 "O caminho está lá; é percorrê-lo que vai alargá-lo.",
                 "路就在那里，走上去，它才会变宽。"),
    "index.badge": T("🚧 EN CHANTIER — WEBSITE ÉVOLUTIF",
                     "🚧 WORK IN PROGRESS — EVOLVING WEBSITE",
                     "🚧 EM OBRAS — SITE EM EVOLUÇÃO",
                     "🚧 建设中 — 第一阶段 Beta 发布"),
    "index.bienvenue": T("Bienvenue dans l'aventure !",
                         "Welcome to the adventure!",
                         "Bem-vindo à aventura!",
                         "欢迎来到这场冒险！"),
    "index.titre_1": T("De l'étincelle à l'impulsion",
                       "From the spark to the impulse",
                       "Da faísca ao impulso",
                       "从火花到冲动"),
    "index.titre_2": T("un exosquelette pour l'avenir",
                       "an exoskeleton for the future",
                       "um exoesqueleto para o futuro",
                       "一台面向未来的外骨骼"),
    "index.cta_music": T("Play music", "Play music", "Play music", "Play music"),
    "index.banniere": T("De l'étincelle à l'impulsion, un exosquelette pour l'avenir",
                        "From the spark to the impulse, an exoskeleton for the future",
                        "Da faísca ao impulso, um exoesqueleto para o futuro",
                        "从火花到冲动，一台面向未来的外骨骼"),
    "index.sous": T("Neuro-robotique open-source, IA agentique et solidarité internationale. Un prototype de recherche, publié au fur et à mesure.",
                    "Open-source neuro-robotics, agentic AI and international solidarity. A research prototype, published as it goes.",
                    "Neuro-robótica aberta, IA agêntica e solidariedade internacional. Um protótipo de pesquisa, publicado à medida que avança.",
                    "开源神经机器人、智能体人工智能与国际团结。一个逐步公开的研究原型。"),
    "index.cta1": T("Activer l'expérience & écouter Luna",
                    "Start the experience & listen to Luna",
                    "Ativar a experiência e ouvir Luna",
                    "开启体验并聆听 Luna"),
    "index.cta2": T("Lire le manifeste", "Read the manifesto", "Ler o manifesto", "阅读宣言"),

    "index.titre": T("De l'étincelle à l'impulsion",
                     "From the spark to the impulse",
                     "Da faísca ao impulso",
                     "从火花到冲动"),
    "index.lead": T("Une lésion C6-C7 incomplète n'efface pas tout : l'ordre de mouvement part encore, et l'influx se fait sentir. Ce projet est né d'une image vue à la télévision, et il avance depuis, un composant à la fois.",
                    "An incomplete C6-C7 injury does not erase everything: the command to move still leaves, and the impulse can be felt. This project was born from an image seen on television, and it has been moving forward ever since, one component at a time.",
                    "Uma lesão C6-C7 incompleta não apaga tudo: a ordem de movimento ainda parte, e o impulso é sentido. Este projeto nasceu de uma imagem vista na televisão e avança desde então, um componente por vez.",
                    "不完全的 C6-C7 损伤并没有抹去一切：运动的指令依然发出，冲动依然能被感知。这个项目诞生于电视上看到的一个画面，并从此一步步向前。"),

    "index.reboot_titre": T("2006 — le reboot", "2006 — the reboot",
                            "2006 — o reboot", "2006 — 重启"),
    "index.reboot_txt": T("Un accident. Une vie s'arrête, une autre commence. Huit ans plus tard, une image vue à la télévision lui donnera sa direction.",
                          "An accident. One life stops, another begins. Eight years later, an image seen on television will give it a direction.",
                          "Um acidente. Uma vida termina, outra começa. Oito anos depois, uma imagem vista na televisão vai dar-lhe uma direção.",
                          "一场事故。一种生活结束，另一种开始。八年后，电视上的一个画面为它指明了方向。"),
    "index.histoire_titre": T("Le déclic : 12 juin 2014", "The trigger: 12 June 2014", "O estalo: 12 de junho de 2014", "那一刻：2014 年 6 月 12 日"),
    "index.histoire_1": T("Coupe du monde, São Paulo. Un patient paraplégique se lève de son fauteuil et donne le coup d'envoi, porté par l'exosquelette du Dr Miguel Nicolelis. Des millions de personnes voient la scène ; une seule décide que ce sera sa vie.",
                         "World Cup, São Paulo. A paraplegic patient rises from his wheelchair and kicks off the tournament, supported by Dr Miguel Nicolelis's exoskeleton. Millions see it; one person decides this will be his life.",
                         "Copa do mundo, São Paulo. Um paciente paraplégico se levanta da cadeira e dá o pontapé inicial, sustentado pelo exoesqueleto do Dr. Miguel Nicolelis. Milhões veem a cena; uma pessoa decide que será a sua vida.",
                         "世界杯，圣保罗。一位截瘫患者从轮椅上站起，在 Miguel Nicolelis 博士的外骨骼支撑下开球。数百万人看到了这一幕；其中一个人决定，这就是他的一生。"),
    "index.histoire_2": T("L'idée mûrit pendant des années, sans laboratoire ni budget — juste une conviction et un carnet. Puis l'IA arrive, la machine de calcul se monte, et l'acte 3 rejoint la phase 1 : un banc d'essai mesurable, ouvert, publié.",
                         "The idea matures for years, with no lab and no budget — just a conviction and a notebook. Then AI arrives, the compute machine gets built, and act 3 joins phase 1: a measurable, open, published test bench.",
                         "A ideia amadurece por anos, sem laboratório nem orçamento — só uma convicção e um caderno. Depois chega a IA, a máquina de cálculo é montada, e o ato 3 junta-se à fase 1: uma bancada de testes mensurável, aberta, publicada.",
                         "这个想法酝酿多年，没有实验室，也没有预算——只有一份信念和一本笔记。然后人工智能到来，计算主机搭起，第一阶段成为可能：一个可测量、开放、公开的试验台。"),

    "index.orient_titre": T("Le chemin, étape par étape", "The path, step by step", "O caminho, passo a passo", "这条路，一步一步"),
    "index.orient_lead": T("Chaque tiroir du site correspond à une étape du projet. Tu peux les lire dans l'ordre, ou sauter à celle qui t'intéresse.",
                           "Each drawer of the site is a step of the project. Read them in order, or jump to the one you care about.",
                           "Cada gaveta do site é uma etapa do projeto. Leia em ordem, ou vá direto à que interessa.",
                           "网站的每个抽屉都是项目的一个阶段。你可以按顺序读，也可以直接跳到感兴趣的那一个。"),
}

# Cartes d'orientation : clé de page → (titre, description)
ORIENT = [
    ("virtuel.html", "virtuel.carte", T("Labo virtuel", "Virtual Lab", "Laboratório virtual", "虚拟实验室"),
     T("Le corps avant le métal : simuler pour ne pas usiner à l'aveugle.", "Body before metal: simulate instead of machining blind.", "O corpo antes do metal: simular em vez de usinar às cegas.", "先有身体，后有金属：先仿真，而不是盲目加工。")),
    ("rexoia.html", "neuroexo.carte", T("Harnais R'ExoIA", "R'ExoIA harness", "Arnês R'ExoIA", "R'ExoIA 束具"),
     T("La boucle dure : sEMG, FES et sécurité sous 20 ms.", "The hard loop: sEMG, FES and safety under 20 ms.", "O laço duro: sEMG, FES e segurança abaixo de 20 ms.", "硬实时回路：20 毫秒内的 sEMG、FES 与安全。")),
    ("devkit.html", "devkit.carte", T("Harnais RealiDevKit", "RealiDevKit harness", "Arnês RealiDevKit", "RealiDevKit 背具"),
     T("L'usine logicielle qui construit tout le reste.", "The software factory that builds everything else.", "A fábrica de software que constrói todo o resto.", "构建其他一切的软件工厂。")),
    ("realiastation.html", "realia.carte", T("RealiaStation", "RealiaStation", "RealiaStation", "RealiaStation"),
     T("Le cabinet d'étude où se pilotent les sous-agents.", "The study where sub-agents are orchestrated.", "O gabinete onde os subagentes são orquestrados.", "指挥子智能体的工作室。")),
    ("lunagalaxie.html", "luna.carte", T("LunaGalaxie", "LunaGalaxie", "LunaGalaxie", "LunaGalaxie"),
     T("La voix du projet, à bord du GhostSheller.", "The voice of the project, aboard the GhostSheller.", "A voz do projeto, a bordo do GhostSheller.", "项目的声音，乘坐 GhostSheller。")),
    ("meta-projet-social.html", "social.carte", T("Projet social — l'Îlot Intégré", "Social project — the Integrated Isle", "Projeto social — a Ilha Integrada", "社会项目——综合之岛"),
     T("Le modèle d'ONG réplicable, première pierre à Madagascar.", "The replicable NGO model, first stone in Madagascar.", "O modelo de ONG replicável, primeira pedra em Madagascar.", "可复制的非政府组织模式，第一站在马达加斯加。")),
    ("architecte.html", "archi.carte", T("L'Architecte", "The Architect", "O Arquiteto", "建筑师"),
     T("Une renaissance, une cause, une mission.", "A rebirth, a cause, a mission.", "Um renascimento, uma causa, uma missão.", "一次重生，一项事业，一个使命。")),
    ("wishlist.html", "wish.carte", T("Wishlist matériel", "Hardware wishlist", "Lista de material", "设备心愿单"),
     T("Financer un composant précis, pas un pot commun.", "Fund one precise component, not a pool.", "Financiar um componente exato, não um bolo.", "资助一个具体的部件，而不是一笔糊涂账。")),
    ("boutique.html", "boutique.carte", T("Boutique de Noël", "Christmas shop", "Loja de Natal", "圣诞商店"),
     T("Acheter comme d'habitude, financer le projet sans surcoût.", "Shop as usual, fund the project at no extra cost.", "Comprar como sempre, financiar o projeto sem custo extra.", "照常购物，零额外成本地资助项目。")),
]
