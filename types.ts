

export interface Trait {
  id: string;
  name: string;
  description: string;
  positiveIndicators: string[]; // Señales típicas
  negativeIndicators: string[]; // Señales de ausencia
}

// Added UserReflection interface to fix error in TraitReflector.tsx
export interface UserReflection {
  selectedVersion: 'A' | 'B' | null;
  notes: string;
}

export type Phase = 'LANDING' | 'SELECTION' | 'PHASE_1' | 'PHASE_2' | 'PHASE_3' | 'COMPLETED';

export interface ScenarioDef {
  id: string;
  title: string;
  baseContext: string; // Contexto neutro inicial
}

export interface ExerciseContent {
  text: string;
  dominantTraitIds: string[]; // Phase 1: 1 trait, Phase 2: 3 traits, Phase 3: 5 traits
  absentTraitIds: string[];   // Phase 1: 2 traits, Phase 2: 2 traits, Phase 3: 0 traits
  explanation: string; // Internal explanation for validation
}

export interface EvaluationResult {
  score: number;
  feedbackHtml: string; // Formatted feedback (4 movements)
}

export enum TraitId {
  Integrador = 'integrador',
  Reflexivo = 'reflexivo',
  Singularizador = 'singularizador',
  Operante = 'operante',
  Exigente = 'exigente',
}

export interface HistoryEntry {
  phaseLabel: string;
  text: string;
  userDominantTraits: string[];
  userAbsentTraits: string[];
  feedback: string;
}

export interface AppState {
  phase: Phase;
  scenario: ScenarioDef | null;
  round: number; 
  currentExercise: ExerciseContent | null;
  loading: boolean;
  error: string | null;
  evaluation: EvaluationResult | null;
  history: HistoryEntry[];
}