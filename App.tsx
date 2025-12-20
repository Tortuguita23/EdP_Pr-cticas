
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, ArrowRight, CheckCircle2, AlertCircle,
  BookOpen, Sparkles, Send, RefreshCw, Settings, X, Eye, Download, FileDown,
  Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { 
  generatePhase1Exercise, 
  generatePhase2Exercise, 
  generatePhase3Exercise, 
  evaluateSubmission 
} from './services/geminiService';
import { AppState, ScenarioDef, Phase, HistoryEntry } from './types';
import { EDUCATIONAL_TRAITS, SCENARIOS, PHASE1_SCENARIOS, PHASE2_CASES, PHASE3_CASE } from './constants';

const PH1_ATTEMPTS = 3;
const PH2_ATTEMPTS = 2;

const APP_TITLE = "Prácticas EdP: Rasgos del Estilo Educativo Personalizado";
const COURSE_NAME = "Educación personalizada: Fundamentos filosóficos, antropológicos y psicológicos";
const APP_CREDITS = "AI Studio y Graciela Cano Ramírez";
const LAST_UPDATE = "20 de diciembre de 2025";
const CREATION_NOTE = `Este recurso interactivo y su documentación han sido diseñados y creados por ${APP_CREDITS} para la asignatura "${COURSE_NAME}".`;

const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env?.API_KEY) || '';
  } catch {
    return '';
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    phase: 'SELECTION', 
    scenario: null,
    round: 1,
    currentExercise: null,
    loading: false,
    error: null,
    evaluation: null,
    history: [],
  });

  const [selectedDominant, setSelectedDominant] = useState<string[]>([]);
  const [selectedAbsent, setSelectedAbsent] = useState<string[]>([]);
  const [evidenceText, setEvidenceText] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  
  const isApiKeySet = !!getApiKey();

  const startScenario = (scenario: ScenarioDef) => {
    setState({
      phase: 'PHASE_1',
      scenario,
      round: 1,
      currentExercise: null,
      loading: true,
      error: null,
      evaluation: null,
      history: []
    });
    loadPhase1(scenario, 1);
  };

  const loadPhase1 = async (scenario: ScenarioDef, round: number) => {
    try {
      const shuffledTraits = shuffle(EDUCATIONAL_TRAITS);
      const exercise = await generatePhase1Exercise(scenario, shuffledTraits[0].id, shuffledTraits.slice(1).map(t => t.id));
      setState(prev => ({ ...prev, currentExercise: exercise, loading: false, round, phase: 'PHASE_1' }));
      resetForm();
    } catch (e) {
      setState(prev => ({ ...prev, loading: false, error: "Error de conexión." }));
    }
  };

  const loadPhase2 = async (scenario: ScenarioDef, round: number) => {
    try {
      setState(prev => ({ ...prev, loading: true, phase: 'PHASE_2', round, evaluation: null }));
      const exercise = await generatePhase2Exercise(scenario, round);
      setState(prev => ({ ...prev, currentExercise: exercise, loading: false }));
      resetForm();
    } catch (e) {
      setState(prev => ({ ...prev, loading: false, error: "Error al cargar Fase 2." }));
    }
  };

  const loadPhase3 = async (scenario: ScenarioDef) => {
    try {
      setState(prev => ({ ...prev, loading: true, phase: 'PHASE_3', round: 1, evaluation: null }));
      const exercise = await generatePhase3Exercise(scenario);
      setState(prev => ({ ...prev, currentExercise: exercise, loading: false }));
      resetForm();
    } catch (e) {
      setState(prev => ({ ...prev, loading: false, error: "Error al cargar caso final." }));
    }
  };

  const resetForm = () => {
    setSelectedDominant([]);
    setSelectedAbsent([]);
    setEvidenceText('');
    setShowSolution(false);
    setIsModalOpen(false);
    setState(prev => ({ ...prev, evaluation: null }));
  };

  const handleSubmit = async () => {
    if (!state.currentExercise) return;
    const reqDom = state.phase === 'PHASE_1' ? 1 : state.phase === 'PHASE_2' ? 3 : 5;
    const reqAbs = state.phase === 'PHASE_2' ? 2 : 0;
    if (selectedDominant.length < reqDom || selectedAbsent.length < reqAbs) {
      alert(`Por favor, selecciona los rasgos requeridos.`);
      return;
    }
    setState(prev => ({ ...prev, loading: true }));
    try {
      const result = await evaluateSubmission(state.currentExercise, selectedDominant, selectedAbsent, evidenceText, state.phase);
      const isPerfect = selectedDominant.length === state.currentExercise.dominantTraitIds.length &&
                        selectedDominant.every(id => state.currentExercise?.dominantTraitIds.includes(id)) &&
                        (state.phase !== 'PHASE_2' || (
                          selectedAbsent.length === state.currentExercise.absentTraitIds.length &&
                          selectedAbsent.every(id => state.currentExercise?.absentTraitIds.includes(id))
                        ));
      setState(prev => ({ ...prev, loading: false, evaluation: result }));
      if (isPerfect) { setShowSolution(true); setIsModalOpen(true); }
    } catch (e) {
      setState(prev => ({ ...prev, loading: false, error: "Error en evaluación." }));
    }
  };

  const handleNext = () => {
    if (!state.currentExercise || !state.evaluation) return;
    const newEntry: HistoryEntry = {
      phaseLabel: `${state.phase === 'PHASE_1' ? 'Fase 1' : state.phase === 'PHASE_2' ? 'Fase 2' : 'Fase 3'} - Caso ${state.round}`,
      text: state.currentExercise.text,
      userDominantTraits: selectedDominant.map(id => EDUCATIONAL_TRAITS.find(t => t.id === id)?.name || id),
      userAbsentTraits: selectedAbsent.map(id => EDUCATIONAL_TRAITS.find(t => t.id === id)?.name || id),
      feedback: state.evaluation.feedbackHtml.replace(/<[^>]*>?/gm, '')
    };
    const updatedHistory = [...state.history, newEntry];
    setIsModalOpen(false);
    if (!state.scenario) return;
    if (state.phase === 'PHASE_1') {
      if (state.round < PH1_ATTEMPTS) {
        setState(prev => ({ ...prev, history: updatedHistory }));
        loadPhase1(state.scenario, state.round + 1);
      } else {
        setState(prev => ({ ...prev, history: updatedHistory }));
        loadPhase2(state.scenario, 1);
      }
    } else if (state.phase === 'PHASE_2') {
      if (state.round < PH2_ATTEMPTS) {
        setState(prev => ({ ...prev, history: updatedHistory }));
        loadPhase2(state.scenario, state.round + 1);
      } else {
        setState(prev => ({ ...prev, history: updatedHistory }));
        loadPhase3(state.scenario);
      }
    } else if (state.phase === 'PHASE_3') {
      setState(prev => ({ ...prev, phase: 'COMPLETED', history: updatedHistory }));
    }
  };

  const addFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Recurso diseñado y creado por ${APP_CREDITS}. Última actualización: ${LAST_UPDATE}. Página ${i} de ${pageCount}`, 20, 285);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text(APP_TITLE, margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Informe de Sesión - Autores: ${APP_CREDITS}`, margin, y);
    y += 5;
    doc.setFontSize(8);
    const splitNote = doc.splitTextToSize(CREATION_NOTE, 170);
    doc.text(splitNote, margin, y);
    y += (splitNote.length * 4) + 10;
    
    state.history.forEach((entry) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text(entry.phaseLabel, margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(71, 85, 105);
      const splitText = doc.splitTextToSize(entry.text, 170);
      doc.text(splitText, margin, y);
      y += (splitText.length * 5) + 5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("Rasgos Identificados:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(entry.userDominantTraits.join(", "), margin + 45, y);
      y += 7;
      if (entry.userAbsentTraits.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(217, 119, 6);
        doc.text("Rasgos Ausentes:", margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(entry.userAbsentTraits.join(", "), margin + 45, y);
        y += 7;
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Devolución Pedagógica:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const splitFeedback = doc.splitTextToSize(entry.feedback, 170);
      doc.text(splitFeedback, margin, y);
      y += (splitFeedback.length * 5) + 15;
    });
    addFooter(doc);
    doc.save(`Sesion_EdP_${state.scenario?.id}.pdf`);
  };

  const generateFullGuidePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;
    const addNewPageIfNeeded = (neededHeight: number) => {
      if (y + neededHeight > 270) { doc.addPage(); y = 20; }
    };
    
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text("Guía de Formación Offline", margin, y);
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(APP_TITLE, margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Asignatura: ${COURSE_NAME}`, margin, y);
    y += 5;
    doc.text(`Última actualización: ${LAST_UPDATE}`, margin, y);
    y += 10;
    
    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 15;
    
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("1. Marco Teórico", margin, y);
    y += 10;
    EDUCATIONAL_TRAITS.forEach(trait => {
      addNewPageIfNeeded(40);
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.setFont("helvetica", "bold");
      doc.text(trait.name, margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "normal");
      const splitDesc = doc.splitTextToSize(trait.description, 170);
      doc.text(splitDesc, margin, y);
      y += (splitDesc.length * 5) + 5;
      doc.setFont("helvetica", "bold");
      doc.text("Indicadores positivos: ", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(trait.positiveIndicators.join(" / "), margin + 40, y, { maxWidth: 130 });
      y += 12;
    });
    
    doc.addPage(); y = 20;
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("2. Fase 1: Análisis Unitario", margin, y);
    y += 10;
    Object.entries(PHASE1_SCENARIOS["aula"]).forEach(([traitId, text]) => {
      const traitName = EDUCATIONAL_TRAITS.find(t => t.id === traitId)?.name || traitId;
      addNewPageIfNeeded(60);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(`Manifestación del rasgo: ${traitName}`, margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, margin, y);
      y += (splitText.length * 5) + 12;
    });
    
    doc.addPage(); y = 20;
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("3. Fase 2: Casos para Resolver (Tríadas)", margin, y);
    y += 10;
    PHASE2_CASES.forEach((c, i) => {
      addNewPageIfNeeded(100);
      doc.setFontSize(12);
      doc.text(`Caso Práctico ${i + 1}`, margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      const splitCase = doc.splitTextToSize(c.text, 170);
      doc.text(splitCase, margin, y);
      y += (splitCase.length * 5) + 10;
      doc.setFont("helvetica", "bold");
      doc.text("Identifica los 3 rasgos presentes:", margin, y);
      y += 6;
      doc.line(margin, y, 190, y); y += 6;
      doc.line(margin, y, 190, y); y += 6;
      doc.text("Identifica los 2 rasgos ausentes:", margin, y);
      y += 6;
      doc.line(margin, y, 190, y); y += 15;
    });
    
    doc.addPage(); y = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("4. Fase 3: Integración Total", margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const splitFinal = doc.splitTextToSize(PHASE3_CASE.text, 170);
    doc.text(splitFinal, margin, y);
    y += (splitFinal.length * 5) + 10;
    doc.setFont("helvetica", "bold");
    doc.text("Análisis global de la situación:", margin, y);
    y += 6;
    for(let k=0; k<8; k++) { doc.line(margin, y, 190, y); y += 8; }
    
    addFooter(doc);
    doc.save("Guia_Prácticas_Offline_EdP.pdf");
  };

  const jumpToPhase = (targetPhase: Phase) => {
    const sc = SCENARIOS[0];
    setState(prev => ({ ...prev, scenario: sc, phase: targetPhase, evaluation: null }));
    if (targetPhase === 'PHASE_1') loadPhase1(sc, 1);
    if (targetPhase === 'PHASE_2') loadPhase2(sc, 1);
    if (targetPhase === 'PHASE_3') loadPhase3(sc);
    setShowConfigMenu(false);
  };

  const toggleSelection = (id: string, type: 'dominant' | 'absent') => {
    if (state.evaluation && showSolution) return;
    if (type === 'dominant') {
      const limit = state.phase === 'PHASE_1' ? 1 : state.phase === 'PHASE_2' ? 3 : 5;
      setSelectedDominant(prev => {
        if (prev.includes(id)) return prev.filter(t => t !== id);
        if (prev.length >= limit) return prev;
        return [...prev, id];
      });
      setSelectedAbsent(prev => prev.filter(t => t !== id));
    } else {
      setSelectedAbsent(prev => {
        if (prev.includes(id)) return prev.filter(t => t !== id);
        if (prev.length >= 2) return prev;
        return [...prev, id];
      });
      setSelectedDominant(prev => prev.filter(t => t !== id));
    }
  };

  const isIncorrect = state.evaluation && (
    selectedDominant.length !== state.currentExercise?.dominantTraitIds.length ||
    !selectedDominant.every(id => state.currentExercise?.dominantTraitIds.includes(id)) ||
    (state.phase === 'PHASE_2' && (
      selectedAbsent.length !== state.currentExercise?.absentTraitIds.length ||
      !selectedAbsent.every(id => state.currentExercise?.absentTraitIds.includes(id))
    ))
  );

  const reqDom = state.phase === 'PHASE_1' ? 1 : state.phase === 'PHASE_2' ? 3 : 5;
  const reqAbs = state.phase === 'PHASE_2' ? 2 : 0;
  const isSelectionComplete = selectedDominant.length === reqDom && selectedAbsent.length === reqAbs;

  if (!isApiKeySet) return <div className="h-screen flex items-center justify-center font-bold text-red-600 bg-red-50 p-6 text-center">No se ha detectado la clave API.</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      {isModalOpen && state.evaluation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slide-up">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold text-xl">
                <Sparkles size={24} />
                Devolución
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="text-slate-700 leading-relaxed text-lg prose prose-indigo max-w-none mb-8" dangerouslySetInnerHTML={{ __html: state.evaluation.feedbackHtml }} />
              <button onClick={handleNext} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 text-lg">
                Siguiente situación <ArrowRight size={20}/>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-indigo-600" />
            <span className="font-bold text-lg hidden sm:inline">{APP_TITLE}</span>
            <span className="font-bold text-lg sm:hidden">Prácticas EdP</span>
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden md:block">
            Última actualización: {LAST_UPDATE}
          </div>
        </div>
      </nav>

      <main className="pt-8">
        {state.loading && (
          <div className="fixed inset-0 bg-white/80 z-[110] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-indigo-900 animate-pulse">Consultando con el mentor virtual...</p>
          </div>
        )}

        {state.phase === 'SELECTION' && (
          <div className="max-w-4xl mx-auto px-4 text-center py-12">
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-slate-900 leading-tight">{APP_TITLE}</h1>
            <p className="text-lg text-slate-600 mb-2 font-semibold">{COURSE_NAME}</p>
            <p className="text-sm text-slate-400 mb-6 italic">Diseñado y creado por {APP_CREDITS}</p>
            <p className="text-[10px] text-slate-300 mb-12 uppercase tracking-[0.2em] font-bold">Actualización: {LAST_UPDATE}</p>
            
            <div className="flex flex-col items-center gap-12">
              <div className="flex justify-center w-full">
                {SCENARIOS.map(s => (
                  <button key={s.id} onClick={() => startScenario(s)} className="bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-indigo-600 transition-all text-left shadow-sm hover:shadow-xl group max-w-lg">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-600 transition-colors">{s.title}</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">{s.baseContext}</p>
                    <span className="text-indigo-600 font-bold flex items-center gap-2">Iniciar experiencia interactiva <ArrowRight size={18}/></span>
                  </button>
                ))}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-3xl max-w-2xl w-full">
                <h4 className="font-bold text-indigo-900 text-xl mb-3 flex items-center justify-center gap-2">
                   <FileDown size={24}/> Guía para Trabajo Offline
                </h4>
                <p className="text-indigo-700/80 mb-6 text-sm">Si prefieres trabajar sin conexión, puedes descargar la guía completa con todos los casos y el marco teórico correspondiente para realizar los análisis en papel.</p>
                <button 
                  onClick={generateFullGuidePDF}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 mx-auto"
                >
                  Descargar Guía Completa (PDF)
                </button>
              </div>
            </div>
          </div>
        )}

        {(state.phase.startsWith('PHASE_')) && state.currentExercise && (
          <div className="max-w-4xl mx-auto px-4 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <span className="bg-slate-900 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.2em]">
                {state.phase === 'PHASE_1' ? 'Fase 1' : state.phase === 'PHASE_2' ? 'Fase 2' : 'Fase 3'} 
                {state.phase !== 'PHASE_3' ? ` - CASO ${state.round}` : ''}
              </span>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${selectedDominant.length === reqDom ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                  PRESENTES: {selectedDominant.length}/{reqDom}
                </span>
                {reqAbs > 0 && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${selectedAbsent.length === reqAbs ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                    AUSENTES: {selectedAbsent.length}/{reqAbs}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
              <p className="text-xl text-slate-800 leading-relaxed whitespace-pre-wrap">{state.currentExercise.text}</p>
            </div>

            <div className={`grid ${state.phase === 'PHASE_2' ? 'md:grid-cols-2' : 'grid-cols-1'} gap-8 mb-12`}>
              <div className="flex flex-col">
                <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-800"><CheckCircle2 size={18} className="text-green-600"/> Rasgos Presentes:</h4>
                <div className="grid gap-2">
                  {EDUCATIONAL_TRAITS.map(t => {
                    const isSelected = selectedDominant.includes(t.id);
                    const isActuallyDominant = state.currentExercise?.dominantTraitIds.includes(t.id);
                    const shouldShowCorrect = showSolution && isActuallyDominant;
                    const shouldShowError = state.evaluation && isSelected && !isActuallyDominant && !showSolution;
                    return (
                      <button key={t.id} onClick={() => toggleSelection(t.id, 'dominant')} disabled={!!state.evaluation && showSolution} className={`text-left p-4 rounded-xl border transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-200 hover:border-indigo-300'} ${shouldShowCorrect ? 'ring-2 ring-green-500 bg-green-50 !text-green-900 border-green-200 font-bold' : ''} ${shouldShowError ? 'ring-2 ring-red-400 bg-red-50 !text-red-900 border-red-200' : ''}`}>
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>
              {state.phase === 'PHASE_2' && (
                <div className="flex flex-col">
                  <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-800"><AlertCircle size={18} className="text-amber-600"/> Rasgos Ausentes:</h4>
                  <div className="grid gap-2">
                    {EDUCATIONAL_TRAITS.map(t => {
                      const isSelected = selectedAbsent.includes(t.id);
                      const isActuallyAbsent = state.currentExercise?.absentTraitIds.includes(t.id);
                      const shouldShowCorrect = showSolution && isActuallyAbsent;
                      const shouldShowError = state.evaluation && isSelected && !isActuallyAbsent && !showSolution;
                      return (
                        <button key={t.id} onClick={() => toggleSelection(t.id, 'absent')} disabled={!!state.evaluation && showSolution} className={`text-left p-4 rounded-xl border transition-all ${isSelected ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-white border-slate-200 hover:border-amber-300'} ${shouldShowCorrect ? 'ring-2 ring-amber-500 bg-amber-50 !text-amber-900 border-amber-200 font-bold' : ''} ${shouldShowError ? 'ring-2 ring-red-400 bg-red-50 !text-red-900 border-red-200' : ''}`}>
                          {t.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
              <label className="block font-bold text-slate-900 mb-4 text-lg">Justificación de evidencias:</label>
              <textarea value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} disabled={!!state.evaluation && showSolution} placeholder="¿Qué hechos apoyan tu elección?" className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none bg-slate-50 focus:bg-white text-slate-700" />
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 shadow-xl z-[100]">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-slate-400 text-sm font-medium">
                  {isSelectionComplete 
                    ? <span className="text-green-600 flex items-center gap-1 font-bold"><CheckCircle2 size={16}/> Selección lista</span>
                    : <span className="flex items-center gap-1"><Info size={16}/> Completa la selección para validar</span>
                  }
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  {!state.evaluation && (
                    <button onClick={handleSubmit} disabled={!isSelectionComplete} className={`flex-1 sm:flex-none px-10 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${isSelectionComplete ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                      Validar análisis <Send size={18}/>
                    </button>
                  )}
                  {state.evaluation && !showSolution && isIncorrect && (
                    <>
                      <button onClick={() => { setSelectedDominant([]); setSelectedAbsent([]); setEvidenceText(''); setState(prev => ({ ...prev, evaluation: null })); }} className="flex-1 sm:flex-none bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                        Reintentar
                      </button>
                      <button onClick={() => { setShowSolution(true); setIsModalOpen(true); }} className="flex-1 sm:flex-none bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg">
                        Ver solución
                      </button>
                    </>
                  )}
                  {state.evaluation && (showSolution || !isIncorrect) && (
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none bg-indigo-100 text-indigo-700 px-10 py-3 rounded-xl font-bold hover:bg-indigo-200 transition-all flex items-center justify-center gap-2">
                      Ver Devolución <Sparkles size={18}/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {state.phase === 'COMPLETED' && (
          <div className="max-w-3xl mx-auto text-center py-20 px-4 animate-fade-in">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <GraduationCap size={48} />
            </div>
            <h2 className="text-4xl font-extrabold mb-6">¡Formación Completada!</h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">Felicidades por finalizar tu recorrido de formación interactiva diseñado por {APP_CREDITS}.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={generatePDF} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg">
                <Download size={20}/> Descargar Informe Final
              </button>
              <button onClick={() => setState({ ...state, phase: 'SELECTION', history: [] })} className="bg-white border-2 border-slate-200 text-slate-600 px-8 py-4 rounded-xl font-bold hover:border-indigo-600 transition-all flex items-center justify-center gap-2">
                Reiniciar
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-12 text-slate-500 text-xs font-medium border-t border-slate-100 mt-12 space-y-2">
        <p>Recurso diseñado y creado por {APP_CREDITS}</p>
        <p className="text-slate-400">© 2025 | {COURSE_NAME} | Última actualización: {LAST_UPDATE}</p>
      </footer>
    </div>
  );
};

export default App;
