import type { Interview } from "./types";

export const interviews: Interview[] = [
  {
    id: "senior-backend-engineer-andrea-li",
    candidate: {
      name: "Andrea Li",
      headline: "Senior Backend Engineer · ex-Stripe · 7 años",
      avatarInitials: "AL",
    },
    date: "2026-06-04",
    durationMinutes: 52,
    status: "completed",
    overallRating: 4,
    overallSummary:
      "Perfil técnico muy sólido en sistemas distribuidos y AWS. Demuestra criterio de diseño y comunica trade-offs con claridad. Faltó profundizar en cómo prioriza work en un equipo pequeño y sin PM dedicado.",
    role: {
      title: "Senior Backend Engineer",
      seniority: "Senior · IC4",
      team: "Platform & Data",
      location: "Madrid · híbrido",
      focus: "technical",
      summary:
        "Ownership de la columna vertebral de la plataforma Nova: APIs públicas, pipelines de ingesta de eventos y servicios de matching. Trabaja codo a codo con Product y Growth, con autonomía total para tomar decisiones de arquitectura.",
      responsibilities: [
        "Diseñar y mantener servicios backend en Python (FastAPI) y Node (TypeScript).",
        "Liderar decisiones de arquitectura sobre PostgreSQL + Redis + colas (SQS/Kafka).",
        "Construir y operar pipelines de eventos hacia el data warehouse (BigQuery).",
        "Definir SLOs, observabilidad y on-call de los servicios que poseen.",
      ],
      requirements: [
        "5+ años construyendo backends en producción a escala (>100 req/s sostenido).",
        "Dominio de PostgreSQL y al menos una de Redis, Kafka, RabbitMQ.",
        "Experiencia operando en AWS (ECS/Fargate, RDS, IAM, VPC).",
        "Cultura de testing real (no solo unit) y comodidad con on-call.",
      ],
      niceToHave: [
        "Haber trabajado en producto B2C con métricas de engagement.",
        "Experiencia con event-sourcing o CQRS.",
        "Background en startups pre-series-B.",
      ],
    },
    transcript: [
      {
        speaker: "interviewer",
        text: "Para empezar, ¿puedes contarme un sistema que hayas diseñado de cero del que estés especialmente orgullosa?",
        timestamp: "00:00:32",
      },
      {
        speaker: "candidate",
        text: "En Stripe trabajé en un servicio que reemplazó un monolito de webhooks. Lo dividimos en un publisher, una capa de fan-out y workers idempotentes. El reto principal fue garantizar exactly-once desde la perspectiva del cliente sin perder throughput.",
        timestamp: "00:00:47",
      },
      {
        speaker: "interviewer",
        text: "¿Cómo resolvisteis la idempotencia entre el publisher y el worker?",
        timestamp: "00:03:18",
      },
      {
        speaker: "candidate",
        text: "Usamos un idempotency key generada en publisher, persistida en Postgres con una constraint única. Los workers hacían INSERT ... ON CONFLICT DO NOTHING antes de procesar. El trade-off: añadía un round trip extra, pero nos permitía retries agresivos.",
        timestamp: "00:03:35",
      },
      {
        speaker: "interviewer",
        text: "Imagina que Nova procesa 50k matches diarios y tenemos que enviar notificaciones. ¿Cómo lo diseñarías?",
        timestamp: "00:12:04",
      },
      {
        speaker: "candidate",
        text: "Empezaría simple: una tabla de eventos, un worker que lee y envía vía un proveedor como SES o Postmark. Añadiría una cola con visibility timeout para reintentos y separaría el rate por proveedor. Antes de complicar, mediría: 50k/día son ~0.6 req/s, no necesita Kafka.",
        timestamp: "00:12:25",
      },
    ],
    questions: [
      {
        id: "q1",
        question:
          "¿Puedes contarme un sistema que hayas diseñado de cero del que estés especialmente orgullosa?",
        candidateAnswer:
          "Reemplazó un monolito de webhooks en Stripe con un publisher + fan-out + workers idempotentes. Resolvieron exactly-once mediante idempotency keys persistidas en Postgres.",
        feedback: {
          rating: 4,
          strengths: [
            "Identifica el problema (exactly-once) antes de saltar a la solución.",
            "Cita números concretos y el trade-off del round trip extra.",
          ],
          improvements: [
            "La pregunta es genérica — invita a respuestas ensayadas. Anclar a la realidad de Nova ayudaría a evaluar fit, no solo skill.",
          ],
          note: "Buena pregunta de calentamiento, pero no discrimina entre senior y staff. Útil al principio, no al final.",
        },
      },
      {
        id: "q2",
        question: "¿Cómo resolvisteis la idempotencia entre el publisher y el worker?",
        candidateAnswer:
          "Idempotency key en publisher, constraint única en Postgres, INSERT ON CONFLICT DO NOTHING en worker. Acepta el coste del round trip extra a cambio de retries seguros.",
        feedback: {
          rating: 5,
          strengths: [
            "Pregunta de follow-up perfecta — fuerza profundidad real.",
            "La respuesta confirma criterio: nombra el trade-off, no lo esconde.",
          ],
          improvements: [
            "Ningún punto crítico. Se podría cerrar con un 'qué medirías en producción para saber si funciona' para evaluar pensamiento operativo.",
          ],
          note: "Este tipo de follow-up técnico es donde realmente se ve si el candidato ha implementado vs. ha leído sobre ello.",
        },
      },
      {
        id: "q3",
        question:
          "Imagina que Nova procesa 50k matches diarios y tenemos que enviar notificaciones. ¿Cómo lo diseñarías?",
        candidateAnswer:
          "Empieza simple: tabla de eventos + worker + proveedor (SES/Postmark). Añade cola para retries. Subraya que 0.6 req/s no justifica Kafka. Quiere medir antes de complicar.",
        feedback: {
          rating: 5,
          strengths: [
            "La respuesta correcta es 'esto es pequeño, no over-engineerees' — y la dio.",
            "Hace la cuenta en voz alta (50k/día → 0.6 req/s). Excelente señal de pragmatismo.",
          ],
          improvements: [
            "Podrías haber empujado más: '¿y si te dijera que el CEO quiere que sea instantáneo y en 3 canales?' para ver cómo escala su diseño bajo presión de producto.",
          ],
          note: "Pregunta excelente porque incluye un número específico de Nova. El número la convierte en discriminadora real.",
        },
      },
    ],
    agent: {
      killer: [
        "Cuéntame de un proyecto técnico que empezaste y luego paraste porque ya no tenía sentido. ¿Qué te llevó a parar?",
        "Si te dejara elegir tres servicios del stack actual para borrar, ¿cuáles serían y qué riesgo aceptas?",
        "¿Cuál es el peor incidente que has causado tú y qué cambió en tu forma de trabajar después?",
      ],
      technical: [
        "Diseña un sistema de matching que devuelva resultados en <200ms con 25k perfiles candidatos y 5 reglas de filtrado. ¿Postgres, in-memory, vector DB?",
        "¿Cómo migrarías una tabla de 200M filas a un esquema nuevo sin downtime?",
        "¿Cuándo elegirías cola con visibility timeout (SQS) vs. log durable (Kafka)? Dame un ejemplo de cada uno de tu carrera.",
        "Explica cómo depurarías un endpoint que pasa de p95 80ms a p95 2.4s en producción tras un deploy.",
      ],
      business: [
        "Si pudieras pasar 4 horas con cualquier persona del equipo de producto antes de empezar, ¿quién y qué le preguntarías?",
        "¿Cómo decides qué deuda técnica vale la pena pagar este trimestre vs. el siguiente?",
        "Imagínate que Nova decide entrar en un mercado nuevo (LatAm). ¿Qué cambiarías de la plataforma desde día 1?",
      ],
    },
    scorecard: {
      recommendation: "yes",
      competencies: [
        {
          name: "Profundidad técnica",
          score: 5,
          weight: 30,
          rationale:
            "Idempotencia, exactly-once y constraints en Postgres explicados con precisión. Habla como quien lo implementó, no como quien lo leyó.",
        },
        {
          name: "Diseño de sistemas",
          score: 4,
          weight: 25,
          rationale:
            "Dimensiona antes de complicar (50k/día → 0.6 req/s, no Kafka). No llegamos a ver cómo escala su diseño bajo presión de producto.",
        },
        {
          name: "Comunicación de trade-offs",
          score: 5,
          weight: 15,
          rationale:
            "Nombra el coste (round trip extra) en lugar de esconderlo. Comunica decisiones con claridad ejecutiva.",
        },
        {
          name: "Pensamiento operativo",
          score: 3,
          weight: 20,
          rationale:
            "El rol exige SLOs, observabilidad y on-call, pero no se exploró en la llamada. Señal pendiente, no negativa.",
        },
        {
          name: "Fit con equipo pequeño",
          score: 2,
          weight: 10,
          rationale:
            "Sin evidencia sobre cómo prioriza sin PM dedicado. Es el principal gap a cubrir en una segunda ronda.",
        },
      ],
    },
  },
  {
    id: "head-of-growth-marcos-de-la-vega",
    candidate: {
      name: "Marcos de la Vega",
      headline: "Head of Growth · ex-N26 · 9 años en B2C subscription",
      avatarInitials: "MV",
    },
    date: "2026-06-09",
    durationMinutes: 48,
    status: "pending-review",
    overallRating: 3,
    overallSummary:
      "Storytelling muy potente y experiencia real con paid + lifecycle. Le costó separar lo que hizo él de lo que hizo el equipo. Recomendado pasar a referencias antes de avanzar.",
    role: {
      title: "Head of Growth",
      seniority: "Lead · gestiona 4 personas",
      team: "Growth & Marketing",
      location: "Madrid · presencial",
      focus: "business",
      summary:
        "Liderar la estrategia de adquisición y activación de profesionales en Nova. Owner del funnel completo: paid, SEO, lifecycle, referrals. Reporta a CEO con presupuesto trimestral y libertad para mover canales.",
      responsibilities: [
        "Definir y ejecutar la estrategia de growth multicanal (paid, SEO, referrals, partnerships).",
        "Gestionar un equipo de 4 (1 paid, 1 SEO, 1 lifecycle, 1 content).",
        "Owner de las métricas norte: CAC, payback, activación a primer match.",
        "Trabajar con producto en experimentos de growth dentro del producto.",
      ],
      requirements: [
        "7+ años en growth de B2C subscription o marketplaces.",
        "Haber gestionado presupuesto de paid >300k€/mes en algún momento.",
        "Experiencia liderando equipos multidisciplinares (no solo paid).",
        "Cultura analítica fuerte: SQL básico, comodidad con dashboards.",
      ],
      niceToHave: [
        "Experiencia internacional (no solo España).",
        "Background previo en producto o consultoría estratégica.",
      ],
    },
    transcript: [
      {
        speaker: "interviewer",
        text: "Cuéntame el último canal de adquisición que abriste de cero. ¿Cómo decidiste invertir en él?",
        timestamp: "00:01:12",
      },
      {
        speaker: "candidate",
        text: "En N26 abrimos podcasts en UK. La hipótesis era que el targeting demográfico era muy bueno y el CPM se estaba pagando aún a precio bajo. Hicimos un test de 50k€ en 6 podcasts, medimos con códigos promo y un brand lift study.",
        timestamp: "00:01:30",
      },
      {
        speaker: "interviewer",
        text: "¿Qué métricas usaste para decidir si seguir invirtiendo?",
        timestamp: "00:05:45",
      },
      {
        speaker: "candidate",
        text: "Mirábamos CAC blended pero ajustado por un factor de halo, porque los podcasts contribuyen mucho a búsquedas branded que luego atribuyes a SEO. Sin ese ajuste habríamos matado el canal a las 4 semanas.",
        timestamp: "00:06:02",
      },
      {
        speaker: "interviewer",
        text: "Si te diera mañana 500k€ y la mitad del equipo de hoy, ¿en qué los pondrías?",
        timestamp: "00:18:21",
      },
      {
        speaker: "candidate",
        text: "Antes de gastar nada, me sentaba 2 semanas con el equipo de producto para entender el funnel de activación. Mucha gente da por sentado que el problema es CAC cuando el problema real es retención o tiempo a primer valor.",
        timestamp: "00:18:48",
      },
    ],
    questions: [
      {
        id: "q1",
        question:
          "Cuéntame el último canal de adquisición que abriste de cero. ¿Cómo decidiste invertir en él?",
        candidateAnswer:
          "Podcasts en UK desde N26. Hipótesis de targeting demográfico + CPM bajo. Test de 50k€ con códigos promo + brand lift study.",
        feedback: {
          rating: 4,
          strengths: [
            "Habla de hipótesis explícita antes de gastar, no de 'probemos'.",
            "Cita la cifra del test y los dos métodos de medición.",
          ],
          improvements: [
            "Falta el resultado: ¿funcionó? ¿escaló? Quedó en cómo lo midieron, no en qué decidieron después.",
          ],
          note: "Pregunta sólida para growth lead. Mejor que '¿qué canales has usado?' porque obliga a contar un caso concreto.",
        },
      },
      {
        id: "q2",
        question: "¿Qué métricas usaste para decidir si seguir invirtiendo?",
        candidateAnswer:
          "CAC blended ajustado por halo a búsquedas branded. Reconoce que sin ese ajuste habrían matado el canal a las 4 semanas.",
        feedback: {
          rating: 5,
          strengths: [
            "Esta respuesta es lo que separa un growth marketer de un buyer de medios. Entiende atribución, no solo last-click.",
          ],
          improvements: [
            "Habría sido oro pedirle el número exacto del factor de halo. Si lo sabe = lo hizo. Si dice 'depende' = lo oyó.",
          ],
          note: "Follow-up que discrimina muy bien. Mantener.",
        },
      },
      {
        id: "q3",
        question:
          "Si te diera mañana 500k€ y la mitad del equipo de hoy, ¿en qué los pondrías?",
        candidateAnswer:
          "No los gastaría inmediatamente. Pasaría 2 semanas con producto para entender activación, porque el problema percibido (CAC) suele ser realmente retención.",
        feedback: {
          rating: 3,
          strengths: [
            "Resiste la trampa de la pregunta. No salta a tácticas.",
            "Conecta growth con producto, no lo trata como silo.",
          ],
          improvements: [
            "La respuesta es correcta pero genérica. Cualquier head of growth senior diría algo parecido. Falta el siguiente nivel: '¿y después de esas 2 semanas, en qué probablemente lo gastarías?'.",
          ],
          note: "Pregunta hipotética de presupuesto: útil pero invita a respuestas de manual. Combinar con un caso concreto del negocio del candidato.",
        },
      },
    ],
    agent: {
      killer: [
        "Cuéntame un canal en el que invertiste fuerte y tuviste que cerrar. ¿Qué viste antes que el resto?",
        "¿Cuándo fue la última vez que estuviste en desacuerdo con tu CEO sobre presupuesto? ¿Cómo lo resolvisteis?",
        "¿De qué decisión de growth tuya te arrepientes más? No la mejor, la peor.",
      ],
      technical: [
        "Diseña el modelo de atribución que usarías en Nova con paid + SEO + referrals. ¿Qué te incomoda de ese modelo?",
        "Explícame qué métricas pondrías en un dashboard semanal para el CEO. Concretas, no categorías.",
        "Si tuvieras que escribir la query de SQL del CAC blended, ¿qué tablas necesitarías?",
      ],
      business: [
        "Nova es marketplace de dos lados (talento + empresas). ¿Qué lado prioriza un head of growth en sus primeros 90 días y por qué?",
        "¿Qué tres experimentos de pricing/oferta probarías en los primeros 6 meses?",
        "¿Cómo gestionas el conflicto natural entre growth (volumen) y producto (calidad de matches)?",
        "Cuéntame de una vez que paraste de invertir en un canal aunque el CAC era bueno. ¿Por qué?",
      ],
    },
    scorecard: {
      recommendation: "mixed",
      competencies: [
        {
          name: "Pensamiento analítico",
          score: 5,
          weight: 25,
          rationale:
            "CAC blended ajustado por halo a búsquedas branded. Entiende atribución de verdad, no se queda en last-click.",
        },
        {
          name: "Estrategia de canal",
          score: 4,
          weight: 15,
          rationale:
            "Hipótesis explícita antes de gastar (test de 50k€ con códigos + brand lift). Faltó cerrar con el resultado: ¿escaló o no?",
        },
        {
          name: "Liderazgo de equipo",
          score: 2,
          weight: 25,
          rationale:
            "Le costó separar lo que hizo él de lo que hizo el equipo. Es la bandera principal antes de avanzar.",
        },
        {
          name: "Visión de producto-growth",
          score: 3,
          weight: 20,
          rationale:
            "Conecta growth con producto (las 2 semanas con activación), pero la respuesta es de manual: cualquier head senior la diría.",
        },
        {
          name: "Ownership de métricas",
          score: 3,
          weight: 15,
          rationale:
            "Maneja las métricas norte, pero no dio cifras propias concretas que confirmen que las vivió en primera persona.",
        },
      ],
    },
  },
  {
    id: "product-manager-laura-fontecha",
    candidate: {
      name: "Laura Fontecha",
      headline: "Senior Product Manager · ex-Cabify, ex-Glovo",
      avatarInitials: "LF",
    },
    date: "2026-06-10",
    durationMinutes: 45,
    status: "drafting",
    overallRating: 4,
    overallSummary:
      "Mezcla bien técnica y negocio. Toma decisiones difíciles con datos y reconoce dónde se equivocó. Pendiente de profundizar en su relación con engineering.",
    role: {
      title: "Senior Product Manager",
      seniority: "Senior · gestiona 0 directos, lidera 2 squads",
      team: "Product",
      location: "Madrid · híbrido",
      focus: "mixed",
      summary:
        "Owner de la experiencia core de matching y discovery. Trabaja con un squad de 5 (3 eng, 1 designer, 1 data) y reporta a CPO. Decisiones de roadmap trimestral, métricas norte: activation, weekly active connections, retention D30.",
      responsibilities: [
        "Definir y priorizar el roadmap del squad de discovery & matching.",
        "Owner de las métricas D30 y de la calidad subjetiva de matches (NPS interno).",
        "Diseñar experimentos con data y traducir resultados en decisiones de roadmap.",
        "Comunicar trade-offs y decisiones a CEO/CPO con claridad ejecutiva.",
      ],
      requirements: [
        "5+ años como PM en producto B2C con métricas de engagement.",
        "Comodidad mínima con SQL y herramientas de experimentación.",
        "Track record claro de decisiones (no solo 'lancé features').",
        "Comunicación escrita fuerte — escribes specs y memos, no solo Jira.",
      ],
      niceToHave: [
        "Experiencia con producto en marketplaces o redes profesionales.",
        "Haber matado features tuyas y poder contarlo.",
      ],
    },
    transcript: [
      {
        speaker: "interviewer",
        text: "¿Cuál ha sido la última feature que mataste tú misma? ¿Por qué?",
        timestamp: "00:00:54",
      },
      {
        speaker: "candidate",
        text: "En Cabify lanzamos 'rides programados con descuento por anticipación'. A los 3 meses los datos decían que el descuento canibalizaba viajes que la gente habría hecho igual. La maté yo, contra el deseo del equipo comercial. Perder 2% de uso pero recuperar margen.",
        timestamp: "00:01:14",
      },
      {
        speaker: "interviewer",
        text: "¿Cómo lo demostraste, dado que comercial decía lo contrario?",
        timestamp: "00:05:30",
      },
      {
        speaker: "candidate",
        text: "Hicimos un holdout regional de 4 semanas: una ciudad sin la feature, contra una similar con ella. La diferencia en viajes totales fue de 1.1%, pero el descuento aplicaba al 18% de los viajes. La cuenta sale sola.",
        timestamp: "00:05:51",
      },
      {
        speaker: "interviewer",
        text: "¿Qué métrica usarías en Nova para saber si el matching mejora trimestre a trimestre?",
        timestamp: "00:22:00",
      },
      {
        speaker: "candidate",
        text: "No una. Dos: una de cantidad (matches mutuos por usuario activo) y una de calidad (% de matches que resultan en al menos un mensaje en 7 días). Sin la segunda, optimizas para spam.",
        timestamp: "00:22:18",
      },
    ],
    questions: [
      {
        id: "q1",
        question: "¿Cuál ha sido la última feature que mataste tú misma? ¿Por qué?",
        candidateAnswer:
          "Rides programados con descuento en Cabify. Lo mató contra comercial porque el descuento canibalizaba viajes orgánicos.",
        feedback: {
          rating: 5,
          strengths: [
            "Concreta: nombra feature, % de impacto, contraparte interna.",
            "La pregunta filtra ego — los buenos PMs matan cosas suyas.",
          ],
          improvements: [
            "Podrías cerrar con '¿cómo se lo comunicaste a comercial?' para evaluar habilidad política.",
          ],
          note: "Una de las preguntas más discriminadoras para PM senior. Mantenerla siempre.",
        },
      },
      {
        id: "q2",
        question: "¿Cómo lo demostraste, dado que comercial decía lo contrario?",
        candidateAnswer:
          "Holdout regional de 4 semanas. Compara ciudad con vs. sin la feature. Calcula que 1.1% de incremental sobre 18% de viajes con descuento no compensa.",
        feedback: {
          rating: 5,
          strengths: [
            "Demuestra rigor metodológico (holdout, no A/B simple).",
            "Hace la cuenta de cabeza, no la esconde.",
          ],
          improvements: [
            "Cero.",
          ],
          note: "El follow-up convierte una respuesta buena en respuesta excelente. La pregunta es genérica, el follow-up es lo que diferencia.",
        },
      },
      {
        id: "q3",
        question:
          "¿Qué métrica usarías en Nova para saber si el matching mejora trimestre a trimestre?",
        candidateAnswer:
          "Dos: matches mutuos por usuario activo (cantidad) + % matches con mensaje en 7d (calidad). Sin la segunda se optimiza para spam.",
        feedback: {
          rating: 4,
          strengths: [
            "Identifica el riesgo de optimizar una métrica sola — pensamiento de PM senior.",
            "Aplicó el contexto de Nova sin haber trabajado aquí.",
          ],
          improvements: [
            "No habló de horizonte temporal ni de cómo separar tendencia de ruido. Útil para preguntar.",
          ],
          note: "Pregunta excelente para PMs. Aplicable a casi cualquier producto, pero específica al contexto Nova.",
        },
      },
    ],
    agent: {
      killer: [
        "Cuéntame una decisión de producto que tomaste con datos y luego resultó equivocada. ¿Qué te enseñó?",
        "¿De qué feature actual de Nova prescindirías si pudieras y por qué? (Investiga el producto antes de responder).",
        "¿Cuál ha sido tu peor relación con un tech lead? ¿Qué harías distinto hoy?",
      ],
      technical: [
        "Diseña la métrica de 'calidad de match' que pondrías en el dashboard del CEO. Defiéndela contra dos críticas que se me ocurran.",
        "Si tu equipo de data te dice 'no podemos medir esto bien en menos de 2 semanas', ¿qué haces?",
        "Explica cómo distinguirías un incremento real de retención del ruido estadístico en una muestra de 3.000 usuarios/semana.",
      ],
      business: [
        "¿Qué priorizarías en tu primer trimestre en Nova: profundizar matching o abrir un nuevo segmento de talento?",
        "Si Nova fuera tu empresa y tuvieras que elegir entre crecer usuarios o crecer revenue por usuario, ¿qué eliges y cuándo cambia tu respuesta?",
        "Cuéntame cómo le venderías a tu CEO una iniciativa con ROI esperado bajo pero estratégica.",
      ],
    },
    scorecard: {
      recommendation: "yes",
      competencies: [
        {
          name: "Toma de decisiones con datos",
          score: 5,
          weight: 25,
          rationale:
            "Mató su propia feature contra comercial apoyándose en un holdout regional. Decide con datos, no con opinión.",
        },
        {
          name: "Rigor analítico",
          score: 5,
          weight: 20,
          rationale:
            "Holdout en vez de A/B simple y la cuenta de canibalización de cabeza (1.1% sobre 18% de viajes). Metodología sólida.",
        },
        {
          name: "Visión de métricas",
          score: 4,
          weight: 20,
          rationale:
            "Propone dos métricas (cantidad + calidad) para no optimizar spam. Faltó horizonte temporal y cómo separar tendencia de ruido.",
        },
        {
          name: "Comunicación ejecutiva",
          score: 4,
          weight: 15,
          rationale:
            "Concreta y estructurada: nombra feature, % de impacto y contraparte interna sin rodeos.",
        },
        {
          name: "Colaboración con engineering",
          score: 3,
          weight: 20,
          rationale:
            "Pendiente de profundizar. No se exploró su relación con tech leads — gap señalado en el resumen.",
        },
      ],
    },
  },
];

export function getInterviewById(id: string): Interview | undefined {
  return interviews.find((i) => i.id === id);
}

export function getAllInterviewIds(): string[] {
  return interviews.map((i) => i.id);
}
