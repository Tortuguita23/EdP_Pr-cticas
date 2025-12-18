import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExerciseContent, EvaluationResult, TraitId, ScenarioDef } from "../types";
import { EDUCATIONAL_TRAITS, PHASE1_SCENARIOS, PHASE2_CASES, PHASE3_CASE } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

// --- MARCO TEÓRICO AMPLIADO ---
const THEORETICAL_BASIS = `
MARCO DEL ESTILO EDUCATIVO PERSONALIZADO (EEP):

1. INTEGRADOR Y ABIERTO: Conecta dimensiones (cognitiva, ética, relacional). Evita la fragmentación. Vincula la norma con el motivo y el impacto en el proyecto común del grupo.
2. REFLEXIVO Y CRÍTICO: Genera conciencia del 'por qué' y 'para qué'. Evita el activismo (acción por la acción). Busca que el alumno comprenda el sentido de sus actos.
3. SINGULARIZADOR Y CONVIVENCIAL: El "doble foco". Atiende la singularidad de cada persona sin invisibilizar al grupo. Reparte la voz y protege la intimidad.
4. OPERANTE Y CREADOR: La formación culmina en la acción con sentido. Propone alternativas, pactos y rutinas donde el alumno es protagonista de su mejora.
5. EXIGENTE Y ALEGRE: Sostiene altas expectativas y esfuerzo en un clima de confianza. Firmeza en los objetivos sin dureza en el trato. La alegría nace del trabajo bien hecho.
`;

const DEVOLUCION_CRITERIA = `
REGLAS PARA LA DEVOLUCIÓN (EdP_Lab):
1. NO es feedback motivacional: No felicites, no digas "¡bien!", no animes.
2. ES una explicación pedagógica: Debes explicar POR QUÉ los rasgos "${EDUCATIONAL_TRAITS.map(t=>t.name).join(', ')}" están presentes en el texto analizado.
3. BASADA EN EVIDENCIAS: Si el alumno ha identificado una acción de la maestra, conéctala con el rasgo.
4. EXCLUSIVIDAD: Explica solo los rasgos presentes. Nunca menciones lo que falta o lo que el alumno no vio.
5. TONO: Sobrio, intelectual y con tacto pedagógico.
`;

const evaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Puntuación técnica 0-100." },
    feedbackHtml: { type: Type.STRING, description: "Devolución pedagógica sobria en HTML." }
  },
  required: ["score", "feedbackHtml"]
};

const TEACHER_PERSONA = `
  ERES UN MENTOR EN FORMACIÓN DOCENTE EXPERTO EN EDUCACIÓN PERSONALIZADA.
  TU MISIÓN: Ayudar al estudiante a comprender la raíz pedagógica de las situaciones de aula.
  ESTILO: Breve, denso en contenido, intelectualmente estimulante.
`;

export const generatePhase1Exercise = async (scenario: ScenarioDef, dominantId: string, absentIds: string[]): Promise<ExerciseContent> => {
  const preDefinedText = PHASE1_SCENARIOS[scenario.id]?.[dominantId];
  return {
    text: preDefinedText || "Error",
    dominantTraitIds: [dominantId],
    absentTraitIds: absentIds,
    explanation: "Fase 1"
  };
};

export const generatePhase2Exercise = async (scenario: ScenarioDef, round: number): Promise<ExerciseContent> => {
  const caseIndex = (round - 1) % PHASE2_CASES.length;
  const selectedCase = PHASE2_CASES[caseIndex];
  return {
    text: selectedCase.text,
    dominantTraitIds: selectedCase.dominantTraitIds,
    absentTraitIds: selectedCase.absentTraitIds,
    explanation: "Fase 2"
  };
};

export const generatePhase3Exercise = async (scenario: ScenarioDef): Promise<ExerciseContent> => {
  return {
    text: PHASE3_CASE.text,
    dominantTraitIds: PHASE3_CASE.dominantTraitIds,
    absentTraitIds: PHASE3_CASE.absentTraitIds,
    explanation: "Fase 3"
  };
};

export const evaluateSubmission = async (
    exercise: ExerciseContent, 
    userDominant: string[], 
    userAbsent: string[], 
    userEvidence: string,
    phase: string
): Promise<EvaluationResult> => {
    
    const correctDomNames = exercise.dominantTraitIds.map(id => EDUCATIONAL_TRAITS.find(t => t.id === id)?.name).join(', ');

    const prompt = `
      ${TEACHER_PERSONA}
      
      MARCO CONCEPTUAL: ${THEORETICAL_BASIS}
      CRITERIOS DE DEVOLUCIÓN: ${DEVOLUCION_CRITERIA}
      
      SITUACIÓN A ANALIZAR: "${exercise.text}"
      RASGOS CORRECTOS: ${correctDomNames}
      EVIDENCIAS APORTADAS POR EL ALUMNO: "${userEvidence}"

      TAREA: Escribe una DEVOLUCIÓN de máximo 80 palabras.
      1. Explica la lógica pedagógica de la maestra en esta situación.
      2. Conecta específicamente el rasgo "${correctDomNames}" con las acciones descritas en el texto.
      3. No juzgues al alumno ni uses lenguaje emocional. 
      4. Termina con una pregunta que invite a pensar cómo esta decisión afecta a la libertad o singularidad del alumno.

      FORMATO: HTML con <p> y <strong>. Evita introducciones como "En esta situación...". Ve directo al grano pedagógico.
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: evaluationSchema },
    });

    return JSON.parse(response.text || "{}");
};