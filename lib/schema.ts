import { z } from "zod";

const ratingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const agentReadingsSchema = z.object({
  positive: z
    .array(z.string().min(1))
    .min(1)
    .max(4)
    .describe("Lecturas positivas del agente sobre este aspecto."),
  negative: z
    .array(z.string().min(1))
    .min(1)
    .max(4)
    .describe("Lecturas negativas o de mejora del agente sobre este aspecto."),
});

const pitchFeedbackSchema = z.object({
  strengths: z
    .array(z.string().min(1))
    .min(1)
    .max(5)
    .describe(
      "Lo que el entrevistador hizo bien al presentar la posición al candidato."
    ),
  improvements: z
    .array(z.string().min(1))
    .min(1)
    .max(5)
    .describe("Cosas concretas que el entrevistador puede mejorar del pitch."),
  agentReadings: agentReadingsSchema.describe(
    "Lecturas del agente sobre el pitch, separadas en bueno y malo."
  ),
});

const questionFeedbackSchema = z.object({
  rating: ratingSchema.describe(
    "Valoración 1-5 de la calidad de la PREGUNTA del entrevistador (no de la respuesta del candidato)."
  ),
  strengths: z.array(z.string().min(1)).min(1).max(5),
  improvements: z.array(z.string().min(1)).min(1).max(5),
  agentReadings: agentReadingsSchema,
});

const interviewQuestionSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe("Identificador único de la pregunta. Ej: 'q1', 'q2'..."),
  question: z
    .string()
    .min(1)
    .describe("Texto literal de la pregunta tal como la formuló el entrevistador."),
  feedback: questionFeedbackSchema,
});

const rolePresentationSchema = z.object({
  title: z
    .string()
    .min(1)
    .describe(
      "Nombre del ROL BASE, SIN el nivel de seniority. Ej: 'Backend Engineer' (no 'Senior Backend Engineer'), 'Product Manager' (no 'Junior PM'). Normaliza sinónimos al término más estándar."
    ),
  seniority: z
    .string()
    .min(1)
    .describe(
      "Seniority tal como se presentó, en texto libre para mostrar (ej. 'Senior · IC4', 'Mid-level')."
    ),
  // Bucket canónico para agrupar entrevistas por nivel dentro de un mismo rol.
  seniorityLevel: z
    .enum(["intern", "junior", "mid", "senior", "lead", "unspecified"])
    .describe(
      "Nivel canónico para agrupar: intern, junior, mid, senior, lead. Usa 'unspecified' solo si el transcript no permite inferirlo. 'lead' cubre lead/staff/principal."
    ),
  team: z.string().min(1),
  location: z.string().min(1),
  focus: z.enum(["technical", "business", "mixed"]),
  summary: z.string().min(1),
  responsibilities: z.array(z.string().min(1)).min(1).max(8),
  requirements: z.array(z.string().min(1)).min(1).max(8),
  niceToHave: z.array(z.string()).max(8),
});

const agentSuggestionsSchema = z.object({
  killer: z
    .array(z.string().min(1))
    .min(3)
    .max(5)
    .describe(
      "Preguntas filtro de alto impacto, diseñadas para distinguir a un senior real de uno nominal."
    ),
  technical: z
    .array(z.string().min(1))
    .min(3)
    .max(5)
    .describe(
      "Preguntas técnicas profundas calibradas al rol, sobre arquitectura, decisiones o herramientas."
    ),
  business: z
    .array(z.string().min(1))
    .min(3)
    .max(5)
    .describe(
      "Preguntas que evalúan criterio de negocio, prioridades y comunicación ejecutiva."
    ),
});

const competencyScoreSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe(
      "Nombre de la competencia evaluada, calibrada al rol. Ej: 'Profundidad técnica', 'Comunicación ejecutiva'."
    ),
  score: ratingSchema.describe(
    "Puntuación 1-5 del CANDIDATO en esta competencia, basada en la evidencia del transcript."
  ),
  weight: z
    .number()
    .int()
    .min(5)
    .max(60)
    .describe(
      "Peso relativo de la competencia en %. Los pesos de TODAS las competencias deben sumar exactamente 100."
    ),
  rationale: z
    .string()
    .min(1)
    .describe(
      "Justificación breve anclada a evidencia concreta del transcript, no genérica."
    ),
});

export const scorecardSchema = z.object({
  recommendation: z
    .enum(["strong-yes", "yes", "mixed", "no"])
    .describe(
      "Recomendación de avance del candidato según el conjunto de competencias."
    ),
  competencies: z
    .array(competencyScoreSchema)
    .min(3)
    .max(6)
    .describe(
      "3-6 competencias clave para el rol detectado, con pesos que sumen 100."
    ),
});

export const interviewSchema = z.object({
  candidate: z.object({
    name: z
      .string()
      .min(1)
      .describe(
        "Nombre del candidato si aparece en el transcript. Si no, usa 'Candidato anónimo'."
      ),
    headline: z
      .string()
      .min(1)
      .describe(
        "Una línea con seniority, empresa previa y años de experiencia. Si no está claro, infiere."
      ),
    avatarInitials: z
      .string()
      .min(1)
      .max(3)
      .describe("Iniciales del candidato en mayúsculas. Ej: 'AL'."),
  }),
  date: z
    .string()
    .describe(
      "Fecha de la entrevista en formato YYYY-MM-DD. Si no está clara, usa una razonable."
    ),
  durationMinutes: z
    .number()
    .int()
    .min(5)
    .max(240)
    .describe("Duración estimada en minutos según la extensión del transcript."),
  status: z.enum(["completed", "pending-review", "drafting"]),
  overallRating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("Valoración global 1-5 del rendimiento del CANDIDATO."),
  overallSummary: z
    .string()
    .min(20)
    .describe(
      "Resumen ejecutivo en 2-3 frases del rendimiento del candidato y la calidad de la entrevista."
    ),
  role: rolePresentationSchema.describe(
    "Reconstrucción de la posición ofertada según se infiere del pitch del entrevistador y del contexto."
  ),
  pitchFeedback: pitchFeedbackSchema.describe(
    "Feedback al entrevistador sobre cómo presentó la posición."
  ),
  questions: z
    .array(interviewQuestionSchema)
    .min(2)
    .max(40)
    .describe(
      "TODAS las preguntas que hizo el entrevistador, en orden cronológico. No omitas ninguna pregunta real; solo descarta muletillas o confirmaciones triviales ('¿me oyes?', '¿vale?')."
    ),
  agent: agentSuggestionsSchema,
  scorecard: scorecardSchema.describe(
    "Scorecard de competencias del candidato: evaluación ponderada por competencia y recomendación de avance."
  ),
});

export type InterviewSchema = z.infer<typeof interviewSchema>;
