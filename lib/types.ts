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

export interface TranscriptLine {
  speaker: "interviewer" | "candidate";
  text: string;
  timestamp: string;
}

export interface QuestionFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  strengths: string[];
  improvements: string[];
  note: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  candidateAnswer: string;
  feedback: QuestionFeedback;
}

export interface AgentSuggestions {
  killer: string[];
  technical: string[];
  business: string[];
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
  transcript: TranscriptLine[];
  questions: InterviewQuestion[];
  agent: AgentSuggestions;
}
