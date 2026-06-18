export type InterviewStatus = "completed" | "pending-review" | "drafting";

export type RoleFocus = "technical" | "business" | "mixed";

export interface RolePresentation {
  title: string;
  seniority: string;
  team: string;
  location: string;
  focus: RoleFocus;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
}

export interface AgentReadings {
  positive: string[];
  negative: string[];
}

export interface PitchFeedback {
  strengths: string[];
  improvements: string[];
  agentReadings: AgentReadings;
}

export interface QuestionFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  strengths: string[];
  improvements: string[];
  agentReadings: AgentReadings;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  feedback: QuestionFeedback;
}

export interface AgentSuggestions {
  killer: string[];
  technical: string[];
  business: string[];
}

export interface SidebarInterview {
  id: string;
  candidateName: string;
  date: string;
  overallRating: number;
}

export interface SidebarPosition {
  id: string;
  name: string;
  interviews: SidebarInterview[];
}

// Card del dashboard de entrevistas (home). Aplana lo que la card necesita del
// análisis JSON para no arrastrar todo el objeto Interview al cliente.
export interface RecentInterview {
  id: string;
  candidateName: string;
  positionId: string;
  positionName: string;
  date: string;
  overallRating: number;
  status: InterviewStatus | string;
  headline: string;
  avatarInitials: string;
  summary: string;
  durationMinutes: number;
}

export type Recommendation = "strong-yes" | "yes" | "mixed" | "no";

export interface CompetencyScore {
  name: string;
  score: 1 | 2 | 3 | 4 | 5;
  /** Peso relativo en %. Las competencias de un scorecard suman 100. */
  weight: number;
  rationale: string;
}

export interface Scorecard {
  recommendation: Recommendation;
  competencies: CompetencyScore[];
}

export interface Interview {
  id: string;
  candidate: {
    name: string;
    headline: string;
    avatarInitials: string;
  };
  date: string;
  durationMinutes: number;
  status: InterviewStatus;
  overallRating: number;
  overallSummary: string;
  role: RolePresentation;
  pitchFeedback: PitchFeedback;
  questions: InterviewQuestion[];
  agent: AgentSuggestions;
  // Opcional: las entrevistas analizadas antes de incorporar el scorecard no lo
  // tienen. La UI debe tolerar su ausencia (ver app/interview/[id]/page.tsx).
  scorecard?: Scorecard;
}
