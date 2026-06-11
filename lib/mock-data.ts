import type { Interview } from "./types";

export const DEMO_INTERVIEW_ID = "senior-backend-engineer-andrea-li";

export const interviews: Interview[] = [
  {
    id: DEMO_INTERVIEW_ID,
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
    pitchFeedback: {
      strengths: [
        "Subrayaste autonomía y ownership desde el minuto uno: justo lo que motiva a un perfil senior real.",
        "Diste números concretos del scope (>100 req/s, on-call) que ayudan al candidato a autofiltrarse antes de invertir tiempo.",
        "Conectaste backend con producto y growth, no lo vendiste como rol aislado.",
      ],
      improvements: [
        "No explicaste con qué equipo trabajará el candidato en su día 1 (cuántos engineers, qué squads).",
        "Saltaste por encima de los problemas técnicos reales que tenéis hoy — ahí está el verdadero gancho de un rol senior.",
        "No mencionaste techo de carrera ni proyección hacia Staff o Lead.",
      ],
      agentReadings: {
        positive: [
          "El pitch sonó honesto y específico, no a folleto corporativo.",
          "Abriste a preguntas a media presentación: la candidata pudo redirigir el foco a lo que le interesaba.",
        ],
        negative: [
          "Dedicaste casi 40 segundos a explicar el stack — un senior ya sabe qué es FastAPI; ese tiempo rinde más describiendo retos.",
          "No vendiste el problema técnico actual del equipo; sin eso el rol parece intercambiable con cualquier scale-up.",
        ],
      },
    },
    questions: [
      {
        id: "q1",
        question:
          "¿Puedes contarme un sistema que hayas diseñado de cero del que estés especialmente orgullosa?",
        feedback: {
          rating: 4,
          strengths: [
            "Identifica el problema (exactly-once) antes de saltar a la solución.",
            "Cita números concretos y el trade-off del round trip extra.",
          ],
          improvements: [
            "La pregunta es genérica — invita a respuestas ensayadas. Anclarla al contexto de Nova ayudaría a evaluar fit, no solo skill.",
          ],
          agentReadings: {
            positive: [
              "Cumple como warm-up: pone al candidato cómodo sin perder tiempo.",
              "Permite calibrar storytelling técnico, útil para entender cómo comunicará al resto del equipo.",
            ],
            negative: [
              "No discrimina entre senior y staff — casi cualquier candidato tiene una historia lista para esto.",
              "Su sitio es al inicio; usada al final es desperdicio de minutos valiosos.",
            ],
          },
        },
      },
      {
        id: "q2",
        question:
          "¿Cómo resolvisteis la idempotencia entre el publisher y el worker?",
        feedback: {
          rating: 5,
          strengths: [
            "Pregunta de follow-up perfecta — fuerza profundidad real, no permite respuestas ensayadas.",
            "La respuesta confirma criterio: nombra el trade-off, no lo esconde.",
          ],
          improvements: [
            "Se podría cerrar con un 'qué medirías en producción para saber si funciona' para evaluar pensamiento operativo.",
          ],
          agentReadings: {
            positive: [
              "Este tipo de follow-up discrimina muy bien a quien ha implementado de quien solo ha leído sobre el tema.",
              "La pregunta sobre idempotencia es una mina de información sobre cómo razona en concurrencia.",
            ],
            negative: [
              "Cerraste sin pedir cómo lo medirían en producción — perdiste señal operativa importante.",
              "Faltó preguntarle qué cambiaría si lo rediseñara hoy: revela aprendizaje real vs. ortodoxia.",
            ],
          },
        },
      },
      {
        id: "q3",
        question:
          "Imagina que Nova procesa 50k matches diarios y tenemos que enviar notificaciones. ¿Cómo lo diseñarías?",
        feedback: {
          rating: 5,
          strengths: [
            "La respuesta correcta es 'esto es pequeño, no over-engineerees' — y la dio sin titubear.",
            "Hace la cuenta en voz alta (50k/día → 0.6 req/s). Excelente señal de pragmatismo.",
          ],
          improvements: [
            "Podrías haber empujado más: '¿y si el CEO quiere que sea instantáneo y en tres canales?' para ver cómo escala su diseño bajo presión.",
          ],
          agentReadings: {
            positive: [
              "Anclas la pregunta con un número real de Nova (50k/día): la convierte en discriminadora, no en hipotética.",
              "Permite ver pensamiento de capacidad sin necesidad de pizarra ni stack específico.",
            ],
            negative: [
              "Te quedaste corto presionando: faltó subir la apuesta para ver cómo se rompe su diseño bajo restricciones nuevas.",
              "No pediste prioridades de coste vs. latencia — clave en una decisión real de infraestructura.",
            ],
          },
        },
      },
    ],
    agent: {
      killer: [
        "Cuéntame un proyecto técnico que empezaste y luego paraste porque ya no tenía sentido. ¿Qué te llevó a parar?",
        "Si te dejara borrar tres servicios del stack actual, ¿cuáles serían y qué riesgo aceptas a cambio?",
        "¿Cuál es el peor incidente que has causado tú y qué cambió en tu forma de trabajar después?",
      ],
      technical: [
        "Diseña un sistema de matching que devuelva resultados en menos de 200 ms con 25k perfiles y cinco reglas de filtrado. ¿Postgres, in-memory o vector DB?",
        "¿Cómo migrarías una tabla de 200 millones de filas a un esquema nuevo sin downtime?",
        "¿Cuándo elegirías cola con visibility timeout (SQS) frente a log durable (Kafka)? Dame un ejemplo de cada uno en tu carrera.",
        "Explica cómo depurarías un endpoint que pasa de p95 80 ms a p95 2.4 s en producción tras un deploy.",
      ],
      business: [
        "Si pudieras pasar cuatro horas con cualquier persona del equipo de producto antes de empezar, ¿con quién y qué le preguntarías?",
        "¿Cómo decides qué deuda técnica vale la pena pagar este trimestre y cuál puede esperar al siguiente?",
        "Imagínate que Nova decide entrar en LatAm. ¿Qué cambiarías de la plataforma desde el día uno?",
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
