/**
 * storage.js - Capa de persistencia local (localStorage) para Fisiodiario
 */

const STORAGE_KEYS = {
  PATIENTS: 'fisiodiario_patients',
  SESSIONS: 'fisiodiario_sessions',
  SETTINGS: 'fisiodiario_settings',
  SELECTED_PATIENT: 'fisiodiario_selected_patient_id'
};

const INITIAL_PATIENTS = [
  {
    id: "P-01",
    bodyZone: "Rodilla derecha",
    diagnosis: "Tendinopatía rotuliana",
    phase: "Reeducación Excén. & Control Motor",
    bodyRegion: "Miembro Inferior",
    startDate: "2025-02-24",
    tutor: "Lic. Ramírez",
    weekNumber: 4,
    recentTime: "Hoy, 11:30"
  },
  {
    id: "P-02",
    bodyZone: "Columna Lumbar",
    diagnosis: "Lumbalgia mecánica inespecífica",
    phase: "Fase subaguda",
    bodyRegion: "Columna",
    startDate: "2025-03-01",
    tutor: "Lic. Ramírez",
    weekNumber: 2,
    recentTime: "Ayer"
  },
  {
    id: "P-03",
    bodyZone: "Hombro izquierdo",
    diagnosis: "Tendinopatía supraespinoso - Pinzamiento",
    phase: "Ganancia ROM en abducción (+35°)",
    bodyRegion: "Miembro Superior",
    startDate: "2025-02-15",
    tutor: "Lic. Ramírez",
    weekNumber: 5,
    recentTime: "12 Mar"
  },
  {
    id: "P-04",
    bodyZone: "Tobillo derecho",
    diagnosis: "Esguince Grado II - Ligamento LPAA",
    phase: "Control de edema y propiocepción",
    bodyRegion: "Miembro Inferior",
    startDate: "2025-03-10",
    tutor: "Lic. Ramírez",
    weekNumber: 1,
    recentTime: "Hoy, 09:15"
  }
];

const INITIAL_SESSIONS = [
  {
    id: "s-1",
    patientId: "P-01",
    sessionNumber: 1,
    date: "2025-02-24",
    time: "09:30",
    type: "presencial",
    title: "Valoración Inicial & Diagnóstico Fisioterapéutico",
    evaPre: 8,
    evaPost: 8,
    romFlexion: 105,
    exercises: [
      { name: "Test de Clarke (Zohlen)", dosage: "Evaluación exploratoria", load: "Positivo (+)" },
      { name: "Movilización articular grado I", dosage: "2 series x 10 rep", load: "Carga axial 0 kg" }
    ],
    notes: "Paciente deportista aficionado (baloncesto) con dolor punzante en polo inferior de rótula tras salto. Inicio de protocolo excéntrico/isométrico pautado.",
    supervisorNote: "Ingreso Inicial Validado",
    validated: true
  },
  {
    id: "s-2",
    patientId: "P-01",
    sessionNumber: 2,
    date: "2025-03-03",
    time: "11:00",
    type: "presencial",
    title: "Terapia Manual & Descompresión",
    evaPre: 8,
    evaPost: 6,
    romFlexion: 112,
    exercises: [
      { name: "Movilización pasiva rótula", dosage: "Grado II (Kaltenborn)", load: "Caudal/medial" },
      { name: "Activación VMO con toalla", dosage: "3 series x 12 rep", load: "Presión poplítea" },
      { name: "Crioterapia local", dosage: "10 minutos", load: "Compresa húmedo-fría" }
    ],
    notes: "Buen alivio post-terapia manual. Se observa mejor deslizamiento en plano retinacular externo.",
    supervisorNote: "Respuesta Favorable",
    validated: true
  },
  {
    id: "s-3",
    patientId: "P-01",
    sessionNumber: 3,
    date: "2025-03-10",
    time: "10:00",
    type: "presencial",
    title: "Carga Isométrica & TENS",
    evaPre: 7,
    evaPost: 5,
    romFlexion: 122,
    exercises: [
      { name: "Isométricos de cuádriceps", dosage: "3 series x 10 rep", load: "Decúbito supino" },
      { name: "Elevación de talones bipodal", dosage: "3 series x 15 rep", load: "Sin peso adicional" },
      { name: "Electroterapia TENS", dosage: "15 min", load: "Convencional 100Hz" }
    ],
    notes: "Refiere leve rigidez matutina previa que cede tras calor superficial. Se ajusta volumen de sentadilla a favor de isométricos analíticos.",
    supervisorNote: "Adaptación Concluida",
    validated: true
  },
  {
    id: "s-4",
    patientId: "P-01",
    sessionNumber: 4,
    date: "2025-03-14",
    time: "15:40",
    type: "presencial",
    title: "Readaptación Funcional & Carga",
    evaPre: 7,
    evaPost: 4,
    romFlexion: 130,
    exercises: [
      { name: "Sentadilla isométrica contra pared con fitball", dosage: "4 series x 30 seg", load: "Sin dolor agudo, 45° flexión" },
      { name: "Puente glúteo unilateral", dosage: "3 series x 12 repeticiones", load: "Peso corporal + banda elástica verde" },
      { name: "Extensión terminal rodilla", dosage: "3 series x 15 repeticiones", load: "Tobillera 1.5 kg" },
      { name: "Crioterapia + Terapia manual rotuliana", dosage: "10 minutos", load: "Movilización grado II + hielo" }
    ],
    notes: "Excelente control motor sin dolor femororrotuliano agudo. Toleró carga isométrica con buena alineación de valgo dinámico.",
    supervisorNote: "Apta para Pliometría",
    validated: true
  },
  {
    id: "s-p2-1",
    patientId: "P-02",
    sessionNumber: 1,
    date: "2025-03-01",
    time: "08:30",
    type: "presencial",
    title: "Evaluación Lumbar & Descompresión",
    evaPre: 8,
    evaPost: 7,
    romFlexion: 60,
    exercises: [
      { name: "Báscula pélvica en supino", dosage: "3 series x 10 rep", load: "Sin resistencia" },
      { name: "Cat-Camel lumbar", dosage: "2 series x 8 rep", load: "Rango no doloroso" }
    ],
    notes: "Contractura paravertebral bilateral. Limitación al inclinarse.",
    supervisorNote: "Fase Aguda",
    validated: true
  },
  {
    id: "s-p2-2",
    patientId: "P-02",
    sessionNumber: 2,
    date: "2025-03-08",
    time: "08:30",
    type: "presencial",
    title: "Control de Espasmo & Movilidad",
    evaPre: 7,
    evaPost: 5,
    romFlexion: 75,
    exercises: [
      { name: "Puente glúteo bipodal", dosage: "3 series x 12 rep", load: "Isométrico 5s" },
      { name: "Bird-dog modificado", dosage: "3 series x 8 rep/lado", load: "Control de core" }
    ],
    notes: "Mejoría notable en transferencias de sedente a bípedo.",
    supervisorNote: "Respuesta Favorable",
    validated: true
  },
  {
    id: "s-p3-1",
    patientId: "P-03",
    sessionNumber: 1,
    date: "2025-02-15",
    time: "10:30",
    type: "presencial",
    title: "Valoración de Manguito Rotador",
    evaPre: 9,
    evaPost: 8,
    romFlexion: 90,
    exercises: [
      { name: "Péndulo de Codman", dosage: "3 series x 1 min", load: "Gravedad" }
    ],
    notes: "Dolor nocturno y arco doloroso entre 60° y 120°.",
    supervisorNote: "Ingreso Inicial",
    validated: true
  },
  {
    id: "s-p3-2",
    patientId: "P-03",
    sessionNumber: 2,
    date: "2025-03-12",
    time: "10:30",
    type: "presencial",
    title: "Fortalecimiento Periescapular",
    evaPre: 6,
    evaPost: 4,
    romFlexion: 135,
    exercises: [
      { name: "Rotación externa con elástico amarillo", dosage: "3 series x 12 rep", load: "Codo a 90°" },
      { name: "Retracción escapular en prono", dosage: "3 series x 15 rep", load: "Isométrico 3s" }
    ],
    notes: "Ganancia de 35° de abducción sin dolor agudo.",
    supervisorNote: "Evolución Positiva",
    validated: true
  },
  {
    id: "s-p4-1",
    patientId: "P-04",
    sessionNumber: 1,
    date: "2025-03-10",
    time: "09:15",
    type: "presencial",
    title: "Control de Edema & Carga Parcial",
    evaPre: 7,
    evaPost: 6,
    romFlexion: 15,
    exercises: [
      { name: "Drenaje circulatorio y bombeo tricipital", dosage: "10 minutos", load: "Elevación 30°" },
      { name: "Eversión isométrica suave", dosage: "3 series x 10 seg", load: "Contra resistencia manual" }
    ],
    notes: "Edema perimaleolar moderado, apoyo tolerado con muleta canadiense.",
    supervisorNote: "Ingreso Reciente",
    validated: true
  }
];

const INITIAL_SETTINGS = {
  studentName: "Xarid Michel",
  role: "Docente",
  clinicCenter: "Centro Clínico Docente",
  shiftName: "Turno Tarde - Hospital Clínico Docente",
  shiftLocation: "Box 03 & 04 - Docente a cargo: Lic. Xaird Michel",
  tutorRound: "16:45 hrs"
};

const StorageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SELECTED_PATIENT)) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_PATIENT, "P-01");
    }
  },

  getPatients() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS)) || [];
    } catch (e) {
      return INITIAL_PATIENTS;
    }
  },

  getPatient(id) {
    const list = this.getPatients();
    return list.find(p => p.id.toUpperCase() === (id || '').toUpperCase()) || null;
  },

  savePatient(patient) {
    const list = this.getPatients();
    const existingIndex = list.findIndex(p => p.id.toUpperCase() === patient.id.toUpperCase());
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...patient };
    } else {
      list.push(patient);
    }
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(list));
    return patient;
  },

  getSessions(patientId = null) {
    this.init();
    let sessions = [];
    try {
      sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS)) || [];
    } catch (e) {
      sessions = INITIAL_SESSIONS;
    }
    if (patientId) {
      return sessions.filter(s => s.patientId.toUpperCase() === patientId.toUpperCase());
    }
    return sessions;
  },

  saveSession(sessionData) {
    const list = this.getSessions();
    const newSession = {
      id: sessionData.id || 's-' + Date.now(),
      ...sessionData,
      createdAt: sessionData.createdAt || new Date().toISOString()
    };
    list.push(newSession);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list));
    return newSession;
  },

  getSelectedPatientId() {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_PATIENT) || "P-01";
  },

  setSelectedPatientId(id) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PATIENT, id);
  },

  getSettings() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || INITIAL_SETTINGS;
    } catch (e) {
      return INITIAL_SETTINGS;
    }
  }
};

window.StorageService = StorageService;
