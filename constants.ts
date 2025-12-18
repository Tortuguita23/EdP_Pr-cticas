import { Trait, TraitId, ScenarioDef } from './types';

export const EDUCATIONAL_TRAITS: Trait[] = [
  {
    id: TraitId.Integrador,
    name: "Integrador y Abierto",
    description: "Conecta dimensiones (cognitiva, ética, relacional), vincula con la realidad y evita la fragmentación.",
    positiveIndicators: [
      "Conecta el problema con convivencia y aprendizaje",
      "Integra norma + motivo + impacto",
      "Abre perspectivas (¿cómo lo viven otros?)"
    ],
    negativeIndicators: [
      "Se reduce todo a disciplina o tarea",
      "No conecta con la vida del grupo",
      "Simplificación excesiva (bien/mal)"
    ]
  },
  {
    id: TraitId.Reflexivo,
    name: "Reflexivo y Crítico",
    description: "Genera conciencia del 'por qué' y 'para qué', evita el activismo sin sentido.",
    positiveIndicators: [
      "Pausas deliberadas para pensar",
      "Preguntas que piden razones y alternativas",
      "Se explicita el sentido de la decisión"
    ],
    negativeIndicators: [
      "Solo órdenes o sanciones",
      "Mucha acción sin pensamiento",
      "Preguntas cerradas ('¿entendido?')"
    ]
  },
  {
    id: TraitId.Singularizador,
    name: "Singularizador y Convivencial",
    description: "Cuida a cada persona sin romper el grupo; evita masificación e individualismo.",
    positiveIndicators: [
      "Atiende necesidades individuales y del grupo (doble foco)",
      "Reparte turnos, escucha voces menos presentes",
      "Protege el grupo sin invisibilizar a nadie"
    ],
    negativeIndicators: [
      "Etiquetado ('siempre los mismos')",
      "Foco solo en individuo o solo en masa",
      "Soluciones que humillan o expulsan"
    ]
  },
  {
    id: TraitId.Operante,
    name: "Operante y Creador",
    description: "Lleva a actuar con sentido, probar alternativas y producir algo propio.",
    positiveIndicators: [
      "Pasa de hablar a hacer (pactos, rutinas)",
      "Propone opciones y decide",
      "Crea producto simple (acuerdo, protocolo)"
    ],
    negativeIndicators: [
      "Solo charla moral o sermón",
      "Castigo sin alternativa practicable",
      "No hay ensayo de conducta nueva"
    ]
  },
  {
    id: TraitId.Exigente,
    name: "Exigente y Alegre",
    description: "Sostiene reto y esfuerzo con clima de confianza y alegría sobria.",
    positiveIndicators: [
      "Sostiene expectativa clara con trato digno",
      "Reconoce esfuerzo y avance",
      "Clima de confianza, firmeza sin dureza"
    ],
    negativeIndicators: [
      "Dureza/amenaza o permisividad excesiva",
      "Vergüenza pública o sarcasmo",
      "Exigencia sin acompañamiento"
    ]
  },
];

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "aula",
    title: "Situación 1: Gestión de aula",
    baseContext: "Una maestra de 5.º de Primaria está realizando una explicación y propone una actividad escrita individual. Se producen interrupciones, murmullos y preguntas cruzadas que dificultan el clima de trabajo. La docente busca reconducir la situación para favorecer el aprendizaje."
  }
];

// Textos predefinidos para la Fase 1
export const PHASE1_SCENARIOS: Record<string, Record<string, string>> = {
  "aula": {
    [TraitId.Exigente]: `La maestra detiene la explicación con serenidad y firmeza. Recuerda con claridad qué espera del grupo y por qué es importante el silencio en ese momento. Su tono es cercano, sin ironía ni reproche, y transmite confianza en que el grupo puede hacerlo mejor.

Introduce una breve pausa, propone retomar la tarea y anima explícitamente a concentrarse para terminarla bien. Mantiene una actitud positiva y accesible, pero no abre un espacio de diálogo ni modifica la estructura de la actividad.

El clima se ordena. El grupo trabaja con más calma, aunque sin profundizar en las causas de las interrupciones ni en la experiencia de quienes estaban desconectados.`,

    [TraitId.Reflexivo]: `La maestra interrumpe la actividad y propone pensar juntos qué está ocurriendo en el aula. Invita a observar lo que ha pasado, a poner palabras a las interrupciones y a reflexionar sobre cómo afectan al aprendizaje.

Escucha distintas intervenciones, reformula lo que dicen y ayuda a contrastar puntos de vista. No introduce normas nuevas ni cambios organizativos inmediatos, ni apela al clima emocional o al vínculo.

La sesión se convierte en un espacio de análisis y toma de conciencia, pero la actividad queda en suspenso y no se concretan decisiones prácticas.`,

    [TraitId.Singularizador]: `La maestra se centra en las personas implicadas en las interrupciones y en quienes parecen más afectadas por ellas. Se acerca, escucha y reconoce distintas maneras de estar en el aula.

Busca cuidar la relación y que nadie quede señalado, favoreciendo un clima de respeto mutuo. No analiza la situación de forma abstracta ni introduce criterios claros de exigencia o de organización del trabajo.

El grupo se siente más acompañado, pero la dinámica general del aula no se reestructura ni se clarifica qué se espera en ese momento de la actividad.`,

    [TraitId.Operante]: `La maestra propone un cambio inmediato en la dinámica: introduce una nueva forma de organizar la actividad para reducir las interrupciones. Da instrucciones claras y pone en marcha la acción sin detenerse a analizar lo ocurrido previamente.

El grupo pasa rápidamente a “hacer” de otra manera. La atención se centra en la tarea y en su ejecución, sin reflexión explícitamente ni cuidado del clima relacional o emocional.

La clase avanza, pero el sentido de la intervención queda ligado a la eficacia inmediata.`,

    [TraitId.Integrador]: `La maestra sitúa las interrupciones dentro de una reflexión más amplia sobre el aula como espacio compartido de aprendizaje. Conecta lo que ocurre con el sentido de aprender juntos, de respetar tiempos y de formar parte de un proyecto común.

Abre la mirada a distintas dimensiones de la situación, pero no entra en decisiones concretas ni en ajustes inmediatos de la actividad. Tampoco personaliza ni exige cambios específicos.

La intervención aporta sentido global, pero queda en un plano general.`
  }
};

// Casos predefinidos para la Fase 2 (Tríadas) - Actualizado a solo 2 casos
export const PHASE2_CASES = [
  {
    id: "caso_1",
    text: `Durante la explicación, la maestra se da cuenta de que el clima se está dispersando. Detiene la clase y dice con calma que necesitan recuperar el hilo porque lo que están trabajando les va a servir para la actividad final del proyecto. Les recuerda brevemente qué estaban intentando comprender y por qué es importante. Pide silencio durante dos minutos y les propone terminar la explicación para poder pasar después a la actividad. El tono es firme pero cercano; no eleva la voz, pero deja claro que espera atención y esfuerzo por parte de todos.`,
    dominantTraitIds: [TraitId.Integrador, TraitId.Reflexivo, TraitId.Exigente],
    absentTraitIds: [TraitId.Singularizador, TraitId.Operante]
  },
  {
    id: "caso_2",
    text: `Ante las interrupciones, el maestro interrumpe la explicación y propone un breve alto. Invita al grupo a pensar qué está pasando y cómo afecta a quienes intentan concentrarse. Da la palabra a dos o tres alumnos distintos, incluidos algunos que suelen participar poco, para que expresen cómo se sienten. A partir de lo que dicen, acuerdan retomar la actividad con una norma concreta que ayude a cuidarse mutuamente mientras trabajan.`,
    dominantTraitIds: [TraitId.Singularizador, TraitId.Reflexivo, TraitId.Operante], 
    absentTraitIds: [TraitId.Integrador, TraitId.Exigente]
  }
];

// Caso predefinido para la Fase 3 (Integración Total)
export const PHASE3_CASE = {
  id: "caso_final",
  text: `Durante una explicación breve, comienzan a producirse interrupciones: comentarios en voz alta, risas, preguntas fuera de turno. La maestra percibe que parte del grupo intenta seguir, mientras otras personas se desconectan.

Detiene la explicación sin elevar la voz y propone un momento de pausa. Recuerda brevemente qué estaban trabajando y para qué les va a servir dentro del proyecto que tienen entre manos, conectando la tarea con el sentido del aprendizaje. Les dice que necesitan un clima de atención para poder avanzar bien y que confía en que el grupo es capaz de lograrlo.

Invita a pensar qué está pasando en el aula y cómo esas interrupciones afectan tanto a quien explica como a quienes intentan concentrarse. Da la palabra a algunas personas distintas, incluidas algunas que no suelen intervenir, y escucha sus aportaciones sin juzgar. A partir de lo que aparece, acuerdan retomar la actividad con una consigna clara y compartida.

La maestra propone entonces una tarea breve y concreta para aplicar inmediatamente lo explicado. Mientras trabajan, se mueve por el aula, se acerca a quienes lo necesitan, refuerza los avances y recuerda con serenidad lo que espera del grupo. Mantiene un tono cercano y animado, sin perder la exigencia en el trabajo bien hecho.

Al finalizar, dedica un minuto a recoger cómo ha funcionado la reorganización y qué les ha ayudado a concentrarse mejor. Reconoce el esfuerzo del grupo y señala que lo aprendido hoy no es solo contenido, sino una forma de aprender y de convivir que podrán volver a usar.

La clase continúa en un clima más atento, donde cada alumno se siente parte del proceso y responsable del mismo.`,
  dominantTraitIds: [TraitId.Integrador, TraitId.Reflexivo, TraitId.Singularizador, TraitId.Operante, TraitId.Exigente],
  absentTraitIds: []
};