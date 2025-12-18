import React, { useState } from 'react';
import { 
  GraduationCap, ArrowRight, CheckCircle2, AlertCircle,
  BookOpen, Sparkles, Send, RefreshCw, Settings, X, Eye
} from 'lucide-react';
import { 
  generatePhase1Exercise, 
  generatePhase2Exercise, 
  generatePhase3Exercise, 
  evaluateSubmission 
} from './services/geminiService';
import { AppState, ScenarioDef, Phase } from './types';
import { EDUCATIONAL_TRAITS, SCENARIOS } from './constants';

const PH1_ATTEMPTS = 3;
const PH2_ATTEMPTS = 2; // Actualizado a 2 casos según la solicitud

const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    phase: 'SELECTION', 
    scenario: null,
    round: 1,
    currentExercise: null,
    loading: false,
    error: null,
    evaluation: null,
  });

  const [selectedDominant, setSelectedDominant] = useState<string[]>([]);
  const [selectedAbsent, setSelectedAbsent] = useState<string[]>([]);
  const [evidenceText, setEvidenceText] = useState('');
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isApiKeySet] = useState<boolean>(!!process.env.API_KEY);

  const startScenario = (scenario: ScenarioDef) => {
    setState({
      phase: 'PHASE_1',
      scenario,
      round: 1,
      currentExercise: null,
      loading: true,
      error: null,
      evaluation: null
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
      setState(prev => ({ ...prev, loading: false, error: "Error en Fase 1." }));
    }
  };

  const loadPhase2 = async (scenario: ScenarioDef, round: number) => {
    try {
      setState(prev => ({ ...prev, loading: true, phase: 'PHASE_2', round, evaluation: null }));
      const exercise = await generatePhase2Exercise(scenario, round);
      setState(prev => ({ ...prev, currentExercise: exercise, loading: false }));
      resetForm();
    } catch (e) {
      setState(prev => ({ ...prev, loading: false, error: "Error en Fase 2." }));
    }
  };

  const loadPhase3 = async (scenario: ScenarioDef) => {
    try {
      setState(prev => ({ ...prev, loading: true, phase: 'PHASE_3', round: 1, evaluation: null }));
      const exercise = await generatePhase3Exercise(scenario);
      setState(prev => ({ ...prev, currentExercise: exercise, loading: false }));
      resetForm();
    } catch (e) {
      setState(prev => ({ ...prev, loading: false, error: "Error en Fase 3." }));
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
      
      if (isPerfect) {
        setShowSolution(true);
        setIsModalOpen(true);
      }
    } catch (e) {
      setState(prev => ({ ...prev, loading: false, error: "Error en evaluación." }));
    }
  };

  const handleNext = () => {
    setIsModalOpen(false);
    if (!state.scenario) return;
    if (state.phase === 'PHASE_1') {
      if (state.round < PH1_ATTEMPTS) loadPhase1(state.scenario, state.round + 1);
      else loadPhase2(state.scenario, 1);
    } else if (state.phase === 'PHASE_2') {
      if (state.round < PH2_ATTEMPTS) loadPhase2(state.scenario, state.round + 1);
      else loadPhase3(state.scenario);
    } else if (state.phase === 'PHASE_3') {
      setState(prev => ({ ...prev, phase: 'COMPLETED' }));
    }
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

  if (!isApiKeySet && !process.env.API_KEY) return <div className="h-screen flex items-center justify-center font-bold text-red-600">Falta la clave API</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      {/* Modal de Devolución */}
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
              <div 
                className="text-slate-700 leading-relaxed text-lg prose prose-indigo max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: state.evaluation.feedbackHtml }} 
              />
              <button 
                onClick={handleNext}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 text-lg"
              >
                Siguiente situación <ArrowRight size={20}/>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-indigo-600" />
            <span className="font-bold text-lg">Prácticas EdP</span>
          </div>
        </div>
      </nav>

      <main className="pt-8">
        {state.loading && (
          <div className="fixed inset-0 bg-white/60 z-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {state.phase === 'SELECTION' && (
          <div className="max-w-4xl mx-auto px-4 text-center py-12">
            <h1 className="text-4xl font-extrabold mb-6">Rasgos del Estilo Educativo Personalizado</h1>
            <p className="text-xl text-slate-600 mb-12">Te invito a analizar la siguiente situación para identificar las manifestaciones del estilo educativo personalizado.</p>
            <div className="flex justify-center">
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => startScenario(s)} className="bg-white p-8 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 transition-all text-left shadow-sm hover:shadow-md">
                  <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
                  <p className="text-slate-500 mb-6">{s.baseContext}</p>
                  <span className="text-indigo-600 font-bold flex items-center gap-2">Comenzar <ArrowRight size={18}/></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(state.phase.startsWith('PHASE_')) && state.currentExercise && (
          <div className="max-w-4xl mx-auto px-4 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <span className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">
                {state.phase === 'PHASE_1' ? 'Fase 1' : state.phase === 'PHASE_2' ? 'Fase 2' : 'Fase 3'} 
                {state.phase !== 'PHASE_3' ? ` - CASO ${state.round}` : ''}
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
              <p className="text-xl text-slate-800 leading-relaxed whitespace-pre-wrap">{state.currentExercise.text}</p>
            </div>

            <div className={`grid ${state.phase === 'PHASE_2' ? 'md:grid-cols-2' : 'grid-cols-1'} gap-8 mb-12`}>
              <div>
                <h4 className="font-bold mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-green-600"/> Rasgos Presentes:</h4>
                <div className="grid gap-2">
                  {EDUCATIONAL_TRAITS.map(t => {
                    const isSelected = selectedDominant.includes(t.id);
                    const isActuallyDominant = state.currentExercise?.dominantTraitIds.includes(t.id);
                    const shouldShowCorrect = showSolution && isActuallyDominant;
                    const shouldShowError = state.evaluation && isSelected && !isActuallyDominant && !showSolution;

                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleSelection(t.id, 'dominant')}
                        disabled={!!state.evaluation && showSolution}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        } ${shouldShowCorrect ? 'ring-2 ring-green-500 bg-green-50 !text-green-900 border-green-200 font-bold' : ''} 
                          ${shouldShowError ? 'ring-2 ring-red-400 bg-red-50 !text-red-900 border-red-200' : ''}`}
                      >
                        {t.name}
                        {shouldShowCorrect && <span className="ml-2 text-xs font-bold">(Correcto)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {state.phase === 'PHASE_2' && (
                <div>
                  <h4 className="font-bold mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-amber-600"/> Rasgos Ausentes:</h4>
                  <div className="grid gap-2">
                    {EDUCATIONAL_TRAITS.map(t => {
                      const isSelected = selectedAbsent.includes(t.id);
                      const isActuallyAbsent = state.currentExercise?.absentTraitIds.includes(t.id);
                      const shouldShowCorrect = showSolution && isActuallyAbsent;
                      const shouldShowError = state.evaluation && isSelected && !isActuallyAbsent && !showSolution;

                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleSelection(t.id, 'absent')}
                          disabled={!!state.evaluation && showSolution}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            isSelected 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
                              : 'bg-white border-slate-200 hover:border-amber-300'
                          } ${shouldShowCorrect ? 'ring-2 ring-amber-500 bg-amber-50 !text-amber-900 border-amber-200 font-bold' : ''}
                            ${shouldShowError ? 'ring-2 ring-red-400 bg-red-50 !text-red-900 border-red-200' : ''}`}
                        >
                          {t.name}
                          {shouldShowCorrect && <span className="ml-2 text-xs font-bold">(Ausente)</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
              <label className="block font-bold text-slate-900 mb-4 text-lg">
                ¿Qué acciones concretas de la maestra te han llevado a esta conclusión? <span className="text-slate-400 font-normal ml-1 text-sm">(Opcional)</span>
              </label>
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                disabled={!!state.evaluation && showSolution}
                placeholder="Escribe aquí las evidencias observadas..."
                className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none bg-slate-50 focus:bg-white text-slate-700"
              />
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 shadow-xl z-30">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div className="text-slate-400 text-sm font-medium">
                  {state.phase === 'PHASE_1' ? 'Identifica 1 rasgo' : state.phase === 'PHASE_2' ? 'Selecciona 3 presentes y 2 ausentes' : 'Identifica los 5 rasgos integrados'}
                </div>
                
                <div className="flex gap-4">
                  {!state.evaluation && (
                    <button 
                      onClick={handleSubmit}
                      disabled={selectedDominant.length === 0}
                      className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-200"
                    >
                      Validar <Send size={18}/>
                    </button>
                  )}

                  {state.evaluation && !showSolution && isIncorrect && (
                    <>
                      <button 
                        onClick={() => {
                          setSelectedDominant([]);
                          setSelectedAbsent([]);
                          setEvidenceText('');
                          setState(prev => ({ ...prev, evaluation: null }));
                        }}
                        className="bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2"
                      >
                        <RefreshCw size={18}/> Volver a intentarlo
                      </button>
                      <button 
                        onClick={() => {
                          setShowSolution(true);
                          setIsModalOpen(true);
                        }}
                        className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg"
                      >
                        <Eye size={18}/> Ver devolución y continuar
                      </button>
                    </>
                  )}

                  {state.evaluation && (showSolution || !isIncorrect) && (
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="bg-indigo-100 text-indigo-700 px-10 py-3 rounded-xl font-bold hover:bg-indigo-200 transition-all flex items-center gap-2"
                    >
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
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Gracias por utilizar este recurso. Deseo que te haya ofrecido oportunidades para integrar los cinco rasgos del estilo educativo personalizado. Si quieres tú ofrecerme alguna propuesta de mejora, estaré encantada de que revisemos juntas/os la herramienta. Hasta pronto.
            </p>
            <button onClick={() => setState({ ...state, phase: 'SELECTION' })} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto shadow-lg">
              <RefreshCw size={20}/> Reiniciar Experiencia
            </button>
          </div>
        )}
      </main>

      {/* --- MENÚ DE NAVEGACIÓN RÁPIDA (SOLO PARA CREADORES) --- */}
      <div className="fixed bottom-4 left-4 z-50">
        <button 
          onClick={() => setShowConfigMenu(!showConfigMenu)}
          className="p-3 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-900 transition-all opacity-30 hover:opacity-100"
          title="Menú de Navegación Rápida"
        >
          {showConfigMenu ? <X size={20}/> : <Settings size={20}/>}
        </button>
        
        {showConfigMenu && (
          <div className="absolute bottom-14 left-0 bg-white border border-slate-200 p-4 rounded-xl shadow-2xl w-64 animate-slide-up">
            <h5 className="font-bold text-xs uppercase text-slate-400 mb-3 tracking-widest">Navegación Rápida</h5>
            <div className="grid gap-2">
              <button onClick={() => { setState(p => ({...p, phase: 'SELECTION'})); setShowConfigMenu(false); }} className="text-left text-sm p-2 hover:bg-slate-100 rounded font-medium">0. Selección de Escenario</button>
              <button onClick={() => jumpToPhase('PHASE_1')} className="text-left text-sm p-2 hover:bg-indigo-50 text-indigo-700 rounded font-medium">1. Fase 1: Unitaria</button>
              <button onClick={() => jumpToPhase('PHASE_2')} className="text-left text-sm p-2 hover:bg-indigo-50 text-indigo-700 rounded font-medium">2. Fase 2: Parcial</button>
              <button onClick={() => jumpToPhase('PHASE_3')} className="text-left text-sm p-2 hover:bg-indigo-50 text-indigo-700 rounded font-medium">3. Fase 3: Total</button>
              <button onClick={() => jumpToPhase('COMPLETED')} className="text-left text-sm p-2 hover:bg-green-50 text-green-700 rounded font-medium">4. Pantalla de Cierre</button>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-12 text-slate-500 text-sm font-medium border-t border-slate-100 mt-12 space-y-2">
        <p>Recurso educativo creado por IA Studio y Graciela Cano Ramirez</p>
        <p className="text-xs text-slate-400">Última actualización: 18 de diciembre de 2025</p>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;