import { baseHtml, p, h1, cta, sig, utmLink, SITE } from "./email-html";
import type { EmailTemplate, EmailOpts } from "./email-drip";

type TemplateGetter = (
  firstName: string,
  locale: string,
  opts?: EmailOpts
) => EmailTemplate;

const hiTemplates: Partial<Record<number, TemplateGetter>> = {
  1: (firstName, locale, opts) => {
    const name = firstName || "दोस्त";
    const referralLink = opts?.referralCode
      ? `${SITE}?ref=${opts.referralCode}`
      : null;
    return {
      subject: "आप सूची में हैं। यहाँ बताया गया है कि हम अलग कैसे हैं।",
      previewText:
        "सामान्य करियर सलाह के विपरीत, हम आपके वास्तविक अनुभव को पढ़ते हैं।",
      html: baseHtml(
        `
        ${h1(`आप सूची में हैं, ${name}।`)}
        ${p("AICareerPivot वेटलिस्ट में शामिल होने के लिए धन्यवाद।")}
        ${p("यहाँ बताया गया है कि हम क्या बना रहे हैं — और यह हर दूसरे करियर टूल से अलग क्यों है:")}
        ${p("अधिकतर करियर सलाह उन लोगों के लिए बेकार है जिनकी असली ज़िम्मेदारियाँ हैं। यह कहती है \"6 महीने की बचत करो और छलांग लगाओ\" — बिना आपके होम लोन के बारे में पूछे। यह कहती है \"बूटकैंप करो\" — बिना आपके बच्चों की डेकेयर के बारे में पूछे।")}
        ${p("<strong style=\"color:#f1f5f9;\">लेकिन एक गहरी समस्या है: सामान्य सलाह आपकी असली पृष्ठभूमि को नज़रअंदाज़ करती है।</strong>")}
        ${p("ChatGPT किसी भी सॉफ्टवेयर इंजीनियर को \"प्रोडक्ट मैनेजमेंट में जाओ\" कहेगा। उसे पता नहीं कि आपने 3 साल क्रॉस-फंक्शनल टीमों का नेतृत्व किया है, या आपके पास हेल्थकेयर में विशेषज्ञता है।")}
        ${p("AICareerPivot कुछ अलग करता है। कोई भी सिफारिश करने से पहले, हम आपकी असली पृष्ठभूमि का विश्लेषण करते हैं:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>हम आपकी LinkedIn प्रोफाइल का विश्लेषण करते हैं — जॉब हिस्ट्री, स्किल्स, करियर ट्रैजेक्टरी</li>
          <li>हम आपका रिज्यूमे पार्स करते हैं — उपलब्धियाँ, टूल्स, सर्टिफिकेशन</li>
          <li>अगर आपके पास पोर्टफोलियो या पर्सनल साइट है तो उसकी भी समीक्षा करते हैं</li>
        </ul>
        ${p("फिर हम <em>आपके असली अनुभव</em> से आपका रोडमैप बनाते हैं — कोई टेम्पलेट नहीं।")}
        ${p("<strong style=\"color:#f1f5f9;\">एक सवाल:</strong> अब तक आपको करियर बदलने से सबसे बड़ी चीज़ किसने रोका है?")}
        ${p("रिप्लाई करें — हम हर जवाब पढ़ते हैं।")}
        ${referralLink
          ? `
        <div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:32px 0;">
          <p style="color:#2dd4bf;font-weight:700;font-size:17px;margin:0 0 8px 0;">सूची में आगे बढ़ना चाहते हैं?</p>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 12px 0;">अपना पर्सनल लिंक शेयर करें और कतार में आगे बढ़ें।</p>
          <p style="color:#f1f5f9;font-size:14px;margin:0 0 16px 0;word-break:break-all;">→ <a href="${referralLink}" style="color:#2dd4bf;">${referralLink}</a></p>
          <p style="color:#64748b;font-size:13px;margin:0;">1 रेफरल = 50 स्थान आगे &nbsp;·&nbsp; 5 रेफरल = पहला कोहोर्ट + 1 महीना मुफ्त</p>
        </div>`
          : ""}
        ${sig()}
        <div style="margin-top:32px;">
          ${cta("AICareerPivot एक्सप्लोर करें →", utmLink("/", "welcome_cta", locale))}
        </div>
      `,
        locale
      ),
    };
  },

  2: (firstName, locale) => {
    const name = firstName || "दोस्त";
    return {
      subject: "करियर सलाह बार-बार विफल होने का असली कारण",
      previewText:
        "यह आपकी गलती नहीं है। सलाह कभी आपकी स्थिति के लिए बनी ही नहीं थी।",
      html: baseHtml(
        `
        ${h1("करियर सलाह बार-बार विफल होने का असली कारण")}
        ${p(`नमस्ते ${name},`)}
        ${p("मैं कुछ बताना चाहता हूँ जो हमने सैकड़ों लोगों से बात करके सीखा है जो अपने करियर में फँसे हुए हैं।")}
        ${p("उनमें से लगभग कोई भी आलसी होने, महत्वाकांक्षा की कमी, या यह न जानने की वजह से नहीं फँसा है कि वे क्या चाहते हैं।")}
        ${p("वे फँसे हैं क्योंकि <strong style=\"color:#f1f5f9;\">हर करियर चेंज फ्रेमवर्क किसी ऐसे व्यक्ति के लिए बनाया गया था जो मौजूद ही नहीं है।</strong>")}
        ${p("काल्पनिक \"पिवट करने वाले प्रोफेशनल\" के पास:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>कोई होम लोन नहीं (या पार्टनर जो अकेले कवर कर सके)</li>
          <li>कोई आश्रित नहीं जिन्हें रूटीन और स्थिरता चाहिए</li>
          <li>12-18 महीने की बचत जो खर्च कर सकें</li>
          <li>एक पार्टनर जो ट्रांज़िशन में सहयोग दे सके</li>
          <li>2-3 साल के लिए बड़ी सैलरी कट लेने की क्षमता</li>
        </ul>
        ${p("अधिकांश लोगों के लिए जो करियर बदलने पर विचार कर रहे हैं, इनमें से कुछ भी सच नहीं है।")}
        ${p("तो वे वही करते हैं जो कोई भी समझदार व्यक्ति करेगा: इंतज़ार। \"जब समय बेहतर होगा।\" \"बच्चों के स्कूल जाने के बाद।\"")}
        ${p("और साल बीत जाते हैं।")}
        ${p("लेकिन एक दूसरी समस्या है: <strong style=\"color:#f1f5f9;\">जब लोग कार्रवाई के लिए तैयार होते हैं, तब भी जो सलाह मिलती है वह उनकी असली पहचान को नज़रअंदाज़ करती है।</strong>")}
        ${p("सामान्य टूल्स पूछते हैं \"किस फील्ड में जाना चाहते हैं?\" वे नहीं पूछते कि आपने एक दशक में किसमें महारत हासिल की है। वे आपकी जॉब हिस्ट्री में छिपे ट्रांसफरेबल स्किल्स नहीं पहचानते।")}
        ${p("इसीलिए हमने किसी भी सिफारिश से पहले एक रिसर्च फेज बनाया। हम पहले आपका असली अनुभव पढ़ते हैं।")}
        ${p("कुछ दिनों में इसकी पूरी जानकारी।")}
        ${sig()}
        ${p("<strong style=\"color:#f1f5f9;\">P.S.</strong> — हर दूसरे करियर टूल के विपरीत, हम आपकी असली पृष्ठभूमि पढ़ते हैं। कोई क्विज़ नहीं। आपका असली रिज्यूमे। आपकी असली LinkedIn।")}
      `,
        locale
      ),
    };
  },

  3: (firstName, locale) => {
    const name = firstName || "दोस्त";
    return {
      subject:
        "हम आपकी योजना कैसे बनाते हैं (यह आपकी पृष्ठभूमि पढ़ने से शुरू होती है)",
      previewText:
        "कोई भी सिफारिश करने से पहले हम आपके वास्तविक अनुभव का विश्लेषण करते हैं।",
      html: baseHtml(
        `
        ${h1("हम आपकी योजना कैसे बनाते हैं — आप कौन हैं, वहाँ से शुरू करके")}
        ${p(`नमस्ते ${name},`)}
        ${p("पिछली बार मैंने बताया था कि करियर सलाह अधिकांश लोगों के लिए क्यों विफल होती है। आज मैं दिखाना चाहता हूँ कि हम इसे अलग कैसे करते हैं।")}
        <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">चरण 1 — रिसर्च फेज (यही हमें अलग बनाता है)</p>
        ${p("कोई भी सिफारिश करने से पहले, हम आपकी असली पृष्ठभूमि पर एक व्यक्तिगत रिसर्च फेज चलाते हैं। आप अपना LinkedIn URL देते हैं, रिज्यूमे अपलोड करते हैं, और वैकल्पिक रूप से अपना पोर्टफोलियो शेयर करते हैं।")}
        ${p("फिर हमारा AI यह सब पढ़ता है:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>जॉब हिस्ट्री, करियर ट्रैजेक्टरी, टेन्योर पैटर्न</li>
          <li>स्किल्स, एंडोर्समेंट, सर्टिफिकेशन</li>
          <li>रिज्यूमे से विशिष्ट उपलब्धियाँ और प्रमाणित प्रभाव</li>
          <li>पोर्टफोलियो से साइड प्रोजेक्ट्स और तकनीकी गहराई</li>
        </ul>
        <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">चरण 2 — अपनी बाधाओं को मैप करें (सिर्फ लक्ष्य नहीं)</p>
        ${p("हम यह भी पूछते हैं कि आपके आसपास क्या है: मासिक दायित्व, आपकी वित्तीय सीमा, पारिवारिक स्थिति, और जोखिम सहनशीलता।")}
        <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">चरण 3 — आपके असली डेटा से चरणबद्ध रोडमैप बनाएं</p>
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li><strong style="color:#f1f5f9;">6 महीने:</strong> बिना नौकरी छोड़े आप क्या कर सकते हैं</li>
          <li><strong style="color:#f1f5f9;">12 महीने:</strong> ट्रांज़िशन पॉइंट — जब गणित समझ आने लगता है</li>
          <li><strong style="color:#f1f5f9;">24 महीने:</strong> आप कहाँ पहुँचना चाहते हैं, आपकी स्थिति के अनुसार चेकपॉइंट्स के साथ</li>
        </ul>
        ${p("हर सिफारिश आपके असली अनुभव और वास्तविक बाधाओं पर आधारित है। कोई टेम्पलेट नहीं। कोई सामान्य सलाह नहीं।")}
        ${p("हम जल्द ही अपने पहले कोहोर्ट के लिए अर्ली एक्सेस खोल रहे हैं। आप सूची में हैं — आपको सबसे पहले पता चलेगा।")}
        ${sig()}
      `,
        locale
      ),
    };
  },

  7: (firstName, locale) => {
    const name = firstName || "दोस्त";
    return {
      subject: "आपका व्यक्तिगत करियर विश्लेषण तैयार है जब आप हों",
      previewText:
        "आपने अपना इंटेक शुरू किया था — इसे पूरा करें और हम आपका रोडमैप बनाएँगे।",
      html: baseHtml(
        `
        ${h1(`आपका रोडमैप इंतज़ार कर रहा है, ${name}।`)}
        ${p("आपने कुछ दिन पहले अपना करियर इंटेक शुरू किया था लेकिन पूरा नहीं किया। कोई दबाव नहीं — लेकिन हम आपको बताना चाहते थे कि आपका विश्लेषण पूरा होने के लिए तैयार है।")}
        ${p("जब आप पूरा करेंगे तो क्या होगा:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>हम ट्रांसफरेबल स्किल्स की पहचान के लिए आपकी LinkedIn प्रोफाइल और रिज्यूमे का विश्लेषण करते हैं</li>
          <li>हम उन स्किल्स को आपकी स्थिति के लिए यथार्थवादी पिवट पथों से मैप करते हैं</li>
          <li>हम आपके असली डेटा से 6 महीने, 1 साल, और 2 साल का व्यक्तिगत रोडमैप बनाते हैं</li>
        </ul>
        ${p("यही AICareerPivot को अलग बनाता है: हम सामान्य सलाह से शुरू नहीं करते। हम आप कौन हैं, वहाँ से शुरू करते हैं।")}
        <div style="margin:32px 0;">
          ${cta("मेरा करियर इंटेक पूरा करें →", utmLink("/intake", "reengagement_cta", locale))}
        </div>
        ${p("लगभग 3 मिनट लगते हैं। बाकी हम संभाल लेंगे।")}
        ${sig()}
      `,
        locale
      ),
    };
  },

  14: (firstName, locale, opts) => {
    const name = firstName || "दोस्त";
    const roadmapLink = opts?.reportId
      ? utmLink(
          `/report/${opts.reportId}?plan=${opts.planIndex ?? 0}`,
          "milestone_nudge",
          locale
        )
      : utmLink("/dashboard", "milestone_nudge", locale);
    return {
      subject: `${name}, आपका करियर रोडमैप इंतज़ार कर रहा है`,
      previewText:
        "कुछ समय हो गया — जब आप तैयार हों, आपका रोडमैप यहाँ है।",
      html: baseHtml(
        `
        ${h1(`अभी भी अपने अगले कदम के बारे में सोच रहे हैं, ${name}?`)}
        ${p("आपने अपने करियर रोडमैप को आखिरी बार चेक किए हुए कुछ समय हो गया है। ज़िंदगी व्यस्त हो जाती है — हम समझते हैं।")}
        ${p("लेकिन आपका रोडमैप समाप्त नहीं होता। आपके माइलस्टोन, स्किल गैप्स, और एक्शन आइटम्स सब वहाँ हैं, आपकी पृष्ठभूमि और बाधाओं के अनुसार व्यक्तिगत।")}
        ${p("10 मिनट भी मदद कर सकते हैं:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>जो पहले से कर चुके हैं उसे मार्क करें</li>
          <li>अगर स्थिति बदली है तो टाइमलाइन एडजस्ट करें</li>
          <li>अपना अगला वीक-वन एक्शन रिव्यू करें</li>
        </ul>
        <div style="margin:32px 0;">
          ${cta("जहाँ छोड़ा था वहाँ से शुरू करें →", roadmapLink)}
        </div>
        ${p("छोटे कदम बड़ा असर करते हैं। जब आप तैयार हों, हम यहाँ हैं।")}
        ${sig()}
      `,
        locale
      ),
    };
  },
};

const esTemplates: Partial<Record<number, TemplateGetter>> = {
  1: (firstName, locale, opts) => {
    const name = firstName || "amigo";
    const referralLink = opts?.referralCode
      ? `${SITE}?ref=${opts.referralCode}`
      : null;
    return {
      subject: "Estás en la lista. Esto es lo que nos hace diferentes.",
      previewText:
        "A diferencia de los consejos genéricos, leemos tu experiencia real.",
      html: baseHtml(
        `
        ${h1(`Estás en la lista, ${name}.`)}
        ${p("Gracias por unirte a la lista de espera de AICareerPivot.")}
        ${p("Esto es lo que estamos construyendo — y por qué es diferente a cualquier otra herramienta de carrera que hayas probado:")}
        ${p("La mayoría de los consejos de carrera son inútiles para personas con responsabilidades reales. Te dicen \"ahorra 6 meses de gastos y da el salto\" — sin preguntar por tu hipoteca. Te dicen \"haz un bootcamp\" — sin preguntar por la guardería de tus hijos.")}
        ${p("<strong style=\"color:#f1f5f9;\">Pero hay un problema más profundo: los consejos genéricos ignoran tu experiencia real.</strong>")}
        ${p("ChatGPT le dirá a cualquier ingeniero de software que \"pase a gestión de producto.\" No sabe que lideraste equipos multifuncionales durante 3 años, que tienes experiencia en salud, o que tu proyecto personal ya tiene usuarios de pago.")}
        ${p("AICareerPivot hace algo diferente. Antes de generar una sola recomendación, analizamos tu experiencia real:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>Analizamos tu perfil de LinkedIn — historial laboral, habilidades, trayectoria profesional</li>
          <li>Parseamos tu currículum — logros, herramientas, certificaciones</li>
          <li>Revisamos tu portafolio o sitio personal si lo tienes</li>
        </ul>
        ${p("Luego construimos tu hoja de ruta desde <em>tu experiencia real</em> — no una plantilla.")}
        ${p("<strong style=\"color:#f1f5f9;\">Una pregunta:</strong> ¿Cuál es la cosa más grande que te ha impedido hacer un cambio de carrera hasta ahora?")}
        ${p("Responde — leemos cada respuesta.")}
        ${referralLink
          ? `
        <div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:32px 0;">
          <p style="color:#2dd4bf;font-weight:700;font-size:17px;margin:0 0 8px 0;">¿Quieres avanzar en la lista?</p>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 12px 0;">Comparte tu enlace personal y salta la cola.</p>
          <p style="color:#f1f5f9;font-size:14px;margin:0 0 16px 0;word-break:break-all;">→ <a href="${referralLink}" style="color:#2dd4bf;">${referralLink}</a></p>
          <p style="color:#64748b;font-size:13px;margin:0;">1 referido = salta 50 puestos &nbsp;·&nbsp; 5 referidos = primer grupo + 1 mes gratis</p>
        </div>`
          : ""}
        ${sig()}
        <div style="margin-top:32px;">
          ${cta("Explorar AICareerPivot →", utmLink("/", "welcome_cta", locale))}
        </div>
      `,
        locale
      ),
    };
  },

  2: (firstName, locale) => {
    const name = firstName || "amigo";
    return {
      subject:
        "La verdadera razón por la que los consejos de carrera siguen fallándote",
      previewText:
        "No es tu culpa. Los consejos nunca fueron diseñados para tu situación.",
      html: baseHtml(
        `
        ${h1("La verdadera razón por la que los consejos de carrera siguen fallándote")}
        ${p(`Hola ${name},`)}
        ${p("Quiero compartir algo que hemos aprendido hablando con cientos de personas que están estancadas en sus carreras.")}
        ${p("Casi ninguna está estancada porque sea perezosa, le falte ambición, o no sepa lo que quiere.")}
        ${p("Están estancadas porque <strong style=\"color:#f1f5f9;\">cada framework de cambio de carrera fue diseñado para alguien que no existe.</strong>")}
        ${p("El mítico \"profesional pivotable\" tiene:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>Sin hipoteca (o una pareja que pueda cubrirla sola)</li>
          <li>Sin dependientes que necesiten rutina y estabilidad</li>
          <li>12–18 meses de ahorros para gastar</li>
          <li>Una pareja que pueda flexibilizar su carrera para apoyar la transición</li>
          <li>La capacidad de aceptar una reducción salarial significativa durante 2–3 años</li>
        </ul>
        ${p("Para la mayoría de las personas que consideran un cambio de carrera, nada de esto es verdad.")}
        ${p("Así que hacen lo que cualquier persona racional haría: esperar. \"Cuando el momento sea mejor.\" \"Después de que los niños entren a la escuela.\"")}
        ${p("Y pasan los años.")}
        ${p("Pero hay un segundo problema: <strong style=\"color:#f1f5f9;\">incluso cuando las personas están listas para actuar, los consejos que reciben ignoran quiénes realmente son.</strong>")}
        ${p("Las herramientas genéricas preguntan \"¿en qué campo quieres entrar?\" No preguntan en qué te has vuelto realmente bueno en una década. No identifican las habilidades transferibles en tu historial laboral.")}
        ${p("Por eso creamos una fase de investigación antes de cualquier recomendación. Primero leemos tu experiencia real.")}
        ${p("Más detalles sobre cómo funciona en unos días.")}
        ${sig()}
        ${p("<strong style=\"color:#f1f5f9;\">P.D.</strong> — A diferencia de cualquier otra herramienta de carrera, realmente leemos tu historial. No un cuestionario. Tu currículum real. Tu LinkedIn real.")}
      `,
        locale
      ),
    };
  },

  3: (firstName, locale) => {
    const name = firstName || "amigo";
    return {
      subject:
        "Cómo construimos tu plan (empieza leyendo tu experiencia)",
      previewText:
        "Analizamos tu experiencia real antes de generar una sola recomendación.",
      html: baseHtml(
        `
        ${h1("Cómo construimos tu plan — empezando por quién eres realmente")}
        ${p(`Hola ${name},`)}
        ${p("La última vez hablé de por qué los consejos de carrera fallan. Hoy quiero mostrarte cómo lo hacemos diferente — desde el primer paso.")}
        <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Paso 1 — La fase de investigación (esto es lo que nos hace diferentes)</p>
        ${p("Antes de generar una sola recomendación, ejecutamos una fase de investigación personalizada sobre tu experiencia real. Proporcionas tu URL de LinkedIn, subes tu currículum, y opcionalmente compartes tu portafolio.")}
        ${p("Luego nuestro AI lo lee todo:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>Historial laboral, trayectoria profesional, patrones de permanencia</li>
          <li>Habilidades, certificaciones, recomendaciones</li>
          <li>Logros específicos e impacto cuantificado de tu currículum</li>
          <li>Proyectos personales y profundidad técnica de tu portafolio</li>
        </ul>
        <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Paso 2 — Mapear tus restricciones (no solo tus metas)</p>
        ${p("También preguntamos sobre lo que te rodea: obligaciones mensuales, tu piso financiero, situación familiar y tolerancia al riesgo.")}
        <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Paso 3 — Construir la hoja de ruta desde tus datos reales</p>
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li><strong style="color:#f1f5f9;">6 meses:</strong> Lo que puedes hacer sin dejar tu trabajo</li>
          <li><strong style="color:#f1f5f9;">12 meses:</strong> El punto de transición — cuando los números empiezan a cuadrar</li>
          <li><strong style="color:#f1f5f9;">24 meses:</strong> Tu objetivo, con checkpoints adaptados a tu situación</li>
        </ul>
        ${p("Cada recomendación está basada en tu experiencia real y tus restricciones reales. Sin plantillas. Sin consejos genéricos.")}
        ${p("Pronto abriremos acceso anticipado para nuestro primer grupo. Estás en la lista — serás el primero en enterarte.")}
        ${sig()}
      `,
        locale
      ),
    };
  },

  7: (firstName, locale) => {
    const name = firstName || "amigo";
    return {
      subject:
        "Tu análisis de carrera personalizado está listo cuando tú lo estés",
      previewText:
        "Empezaste tu registro — termínalo y construiremos tu hoja de ruta.",
      html: baseHtml(
        `
        ${h1(`Tu hoja de ruta te espera, ${name}.`)}
        ${p("Empezaste tu registro de carrera hace unos días pero no lo terminaste. Sin presión — pero queríamos avisarte que tu análisis está listo para completarse.")}
        ${p("Esto es lo que pasa cuando lo terminas:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>Analizamos tu perfil de LinkedIn y currículum para identificar habilidades transferibles</li>
          <li>Mapeamos esas habilidades contra rutas de cambio realistas para tu situación</li>
          <li>Construimos una hoja de ruta personalizada a 6 meses, 1 año y 2 años desde tus datos reales</li>
        </ul>
        ${p("Esto es lo que hace diferente a AICareerPivot: no empezamos con consejos genéricos. Empezamos con quién eres realmente y construimos desde ahí.")}
        <div style="margin:32px 0;">
          ${cta("Completar mi registro →", utmLink("/intake", "reengagement_cta", locale))}
        </div>
        ${p("Toma unos 3 minutos. Nosotros nos encargamos del resto.")}
        ${sig()}
      `,
        locale
      ),
    };
  },

  14: (firstName, locale, opts) => {
    const name = firstName || "amigo";
    const roadmapLink = opts?.reportId
      ? utmLink(
          `/report/${opts.reportId}?plan=${opts.planIndex ?? 0}`,
          "milestone_nudge",
          locale
        )
      : utmLink("/dashboard", "milestone_nudge", locale);
    return {
      subject: `${name}, tu hoja de ruta profesional te espera`,
      previewText:
        "Ha pasado un tiempo — tu hoja de ruta está lista cuando tú lo estés.",
      html: baseHtml(
        `
        ${h1(`¿Sigues pensando en tu próximo paso, ${name}?`)}
        ${p("Ha pasado un tiempo desde que revisaste tu hoja de ruta profesional. La vida se pone ocupada — lo entendemos.")}
        ${p("Pero tu hoja de ruta no expira. Tus hitos, brechas de habilidades y elementos de acción siguen ahí, personalizados según tu experiencia y restricciones.")}
        ${p("Incluso 10 minutos pueden ayudar:")}
        <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
          <li>Marca lo que ya hayas completado</li>
          <li>Ajusta los plazos si tu situación ha cambiado</li>
          <li>Revisa tu próxima acción de la primera semana</li>
        </ul>
        <div style="margin:32px 0;">
          ${cta("Continuar donde lo dejé →", roadmapLink)}
        </div>
        ${p("Los pequeños pasos se acumulan. Estamos aquí cuando estés listo.")}
        ${sig()}
      `,
        locale
      ),
    };
  },
};

const localeTemplates: Record<
  string,
  Partial<Record<number, TemplateGetter>>
> = {
  hi: hiTemplates,
  es: esTemplates,
};

export function getLocalizedEmailTemplate(
  step: number,
  locale: string,
  firstName: string,
  opts?: EmailOpts
): EmailTemplate | null {
  if (locale === "en") return null;
  const templates = localeTemplates[locale];
  if (!templates) return null;
  const getter = templates[step];
  if (!getter) return null;
  return getter(firstName, locale, opts);
}
