import fs from "node:fs";
import path from "node:path";

// AIC-665: load localized landing + blog-index meta/OG copy (from
// marketing/multilingual/<locale>/content-pack.md "Meta Tags & OG") into the
// next-intl message catalogs under a structured `meta` namespace.
const META = {
  en: {
    landing: {
      title: "AICareerPivot — Your AI-Powered Career Transition Strategist",
      description:
        "AICareerPivot builds personalized career transition roadmaps by analyzing your skills, financial situation, and family constraints. Get a custom 6-month, 1-year, and 2-year career pivot plan.",
      ogTitle: "AICareerPivot — Your AI-Powered Career Transition Strategist",
      ogDescription:
        "Personalized AI-powered career pivot roadmaps for professionals who need to account for skills, finances, and family constraints.",
      ogHeadline: "Stop feeling trapped. Start your pivot.",
      ogSub: "Personalized roadmaps built around your skills, finances, and family.",
    },
    blogIndex: {
      title: "Blog | AICareerPivot",
      description:
        "Practical, data-backed guides on changing careers into AI: what to learn, how to start, and how to position your experience for AI roles.",
      ogTitle: "AI Career Change: practical, honest guides",
      ogDescription:
        "Data-backed articles on transitioning into AI roles — without starting from scratch.",
      ogHeadline: "AI CAREER CHANGE",
      ogSub: "Practical, data-backed guides",
    },
  },
  es: {
    landing: {
      title: "Pivota tu carrera hacia la IA | AICareerPivot",
      description:
        "Descubre qué habilidades tuyas se traducen a roles de IA bien pagados. Análisis con IA y hoja de ruta clara. Empieza gratis, sin empezar de cero.",
      ogTitle: "Pivota tu carrera hacia la IA, sin empezar de cero",
      ogDescription:
        "Análisis de tu perfil con IA + hoja de ruta a los roles de IA mejor pagados de tu país. Gratis para empezar.",
      ogHeadline: "TU EXPERIENCIA + IA = TU PRÓXIMO ROL",
      ogSub: "Análisis gratis en minutos",
    },
    blogIndex: {
      title: "Blog de IA y carrera | AICareerPivot",
      description:
        "Guías prácticas y sin hype para hacer un cambio de carrera con IA: qué aprender, cómo empezar y cómo posicionar tu perfil para roles globales.",
      ogTitle: "Cambio de carrera con IA: guías prácticas y honestas",
      ogDescription:
        "Artículos basados en datos sobre cómo hacer la transición laboral hacia la inteligencia artificial, sin empezar de cero.",
      ogHeadline: "CAMBIO DE CARRERA CON IA",
      ogSub: "Guías sin hype, basadas en datos",
    },
  },
  hi: {
    landing: {
      title: "AI Career Change India | AICareerPivot",
      description:
        "Apni skills ka free AI-readiness test lein. India ke liye personalized roadmap, resume & job plan. Job chhode bina AI career shuru karein.",
      ogTitle: "AI me career kaise banaye — apka data-backed plan",
      ogDescription:
        "5-min assessment. Skill-gap analysis. Personalized roadmap. India ke IT & non-tech professionals ke liye.",
      ogHeadline: "Aapki skills + AI = agla career move",
      ogSub: "Free assessment →",
    },
    blogIndex: {
      title: "AI Career Blog India | AICareerPivot",
      description:
        "AI career change, upskilling & AI me career kaise banaye — practical, data-backed guides Hindi & Hinglish mein. Freshers se experienced tak.",
      ogTitle: "AICareerPivot Blog — AI Career Guides (Hindi)",
      ogDescription:
        "Hinglish + Hindi guides on AI career change, skills, salary & roadmaps for India's workforce.",
      ogHeadline: "AI Career Guides — Hindi & Hinglish",
      ogSub: "AICareerPivot",
    },
  },
  "pt-BR": {
    landing: {
      title: "Mudança de carreira com IA | AICareerPivot Brasil",
      description:
        "Diagnóstico gratuito das suas lacunas de habilidades e um plano personalizado para você migrar para uma carreira em IA no mercado brasileiro.",
      ogTitle: "Descubra o caminho real para uma carreira em IA",
      ogDescription:
        "Diagnóstico gratuito, mapa de lacunas e plano de transição feito para o Brasil. Sem hype — só os próximos passos.",
      ogHeadline: "Sua carreira em IA, guiada por dados.",
      ogSub: "Diagnóstico gratuito",
    },
    blogIndex: {
      title: "Blog AICareerPivot | Carreira em IA no Brasil",
      description:
        "Guias práticos sobre transição de carreira, habilidades de IA e o mercado de tecnologia brasileiro. Conteúdo direto, sem promessas vazias.",
      ogTitle: "Guias de transição de carreira para IA — Brasil",
      ogDescription:
        "Como entrar na área de IA, quais habilidades priorizar e o que o mercado brasileiro realmente pede. Atualizado toda semana.",
      ogHeadline: "Blog · Carreira em IA para brasileiros",
      ogSub: "AICareerPivot",
    },
  },
  fr: {
    landing: {
      title: "Reconversion vers l'IA : bilan et feuille de route",
      description:
        "Bilan de compétences IA, analyse des écarts et feuille de route personnalisée pour réussir votre reconversion vers un métier de l'IA. Commencez gratuitement.",
      ogTitle: "Réussir sa reconversion vers un métier de l'IA",
      ogDescription:
        "Des données, pas des promesses : bilan, écarts de compétences et plan d'action pour votre transition vers l'IA.",
      ogHeadline: "RECONVERSION IA",
      ogSub: "Votre bilan gratuit en 10 minutes",
    },
    blogIndex: {
      title: "Blog — Réussir sa transition vers l'IA",
      description:
        "Guides concrets et données pour votre reconversion vers les métiers de l'IA : compétences, formations, CV, marché de l'emploi en France et Afrique francophone.",
      ogTitle: "Le blog AICareerPivot — carrières dans l'IA",
      ogDescription:
        "Conseils fondés sur les données pour changer de carrière vers l'intelligence artificielle.",
      ogHeadline: "BLOG",
      ogSub: "Reconversion & métiers de l'IA",
    },
  },
  de: {
    landing: {
      title: "KI-Karrierewechsel: Ihr datenbasierter Fahrplan",
      description:
        "Analysieren Sie Ihre Kompetenzlücken und starten Sie datenbasiert in einen KI-Beruf. Kostenlose Analyse, realistischer Lernpfad, DACH-taugliche Unterlagen.",
      ogTitle: "Der datenbasierte Weg in einen KI-Beruf",
      ogDescription:
        "Kompetenzlücken erkennen, Lernpfad erhalten, Bewerbung vorbereiten — ohne Hype.",
      ogHeadline: "KI-KARRIEREWECHSEL — DATENBASIERT, NICHT GERATEN",
      ogSub: "Kostenlose Kompetenzanalyse",
    },
    blogIndex: {
      title: "KI-Karriere Blog | Fundierte Berufswechsel-Tipps",
      description:
        "Fundierte Artikel zu Karrierewechsel mit KI: Kompetenzlücken, Lernpfade, Bewerbung und Arbeitsmarkt im DACH-Raum. Ehrliche Analysen statt Hype.",
      ogTitle: "KI-Karriere Blog von AICareerPivot",
      ogDescription:
        "Ehrliche, datenbasierte Analysen zum Berufswechsel in KI-Rollen.",
      ogHeadline: "WISSEN FÜR IHREN KI-KARRIEREWECHSEL",
      ogSub: "AICareerPivot",
    },
  },
  ja: {
    landing: {
      title: "AI未経験から転職｜スキルギャップをAI診断 - AICareerPivot",
      description:
        "AIがあなたの職務経歴を分析し、AI職種へのスキルギャップ・学習ロードマップ・職務経歴書までを提案。未経験からのAI転職を、感覚ではなくデータで設計します。",
      ogTitle: "AI未経験からのキャリア設計 - AICareerPivot",
      ogDescription:
        "職務経歴の分析からスキルギャップ診断、書類作成まで。AI転職をデータで支援。",
      ogHeadline: "AI未経験でも、キャリアは設計できる。",
      ogSub: "無料スキルギャップ診断",
    },
    blogIndex: {
      title: "AI転職ガイド｜未経験・スキルギャップ・学習法 - AICareerPivot",
      description:
        "AI業界への転職を目指す方へ。未経験からの始め方、スキルギャップの埋め方、職務経歴書のコツを、データと実例ベースで解説する記事一覧です。",
      ogTitle: "AI転職ガイド - AICareerPivot ブログ",
      ogDescription:
        "AI未経験からの転職・リスキリングの実践知を、非誇張・データ重視でお届け。",
      ogHeadline: "AI転職、次の一手を。",
      ogSub: "実践ガイド一覧",
    },
  },
};

const dir = path.join(process.cwd(), "messages");
for (const [loc, meta] of Object.entries(META)) {
  const file = path.join(dir, `${loc}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  json.meta = meta;
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`updated ${loc}.json meta namespace`);
}
