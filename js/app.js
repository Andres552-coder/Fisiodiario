/**
 * app.js - Enrutador SPA, renderizado dinámico de vistas y controladores de eventos para Fisiodiario
 */

// Inicializar almacenamiento al cargar
document.addEventListener('DOMContentLoaded', () => {
  StorageService.init();
  setupRouting();
  setupGlobalEvents();
  renderCurrentRoute();
});

// Configuración de rutas
function setupRouting() {
  window.addEventListener('hashchange', () => {
    renderCurrentRoute();
  });
}

function getActiveRoute() {
  const hash = window.location.hash.replace('#', '').trim();
  if (['pacientes-y-turno', 'nueva-sesion', 'historial-clinico', 'evolucion-eva'].includes(hash)) {
    return hash;
  }
  return 'pacientes-y-turno';
}

function navigateTo(route, patientId = null) {
  if (patientId) {
    StorageService.setSelectedPatientId(patientId);
  }
  window.location.hash = route;
}
window.navigateTo = navigateTo;

function updateNavActiveState(activeRoute) {
  const navLinks = document.querySelectorAll('header nav a[data-path]');
  navLinks.forEach(link => {
    const path = link.getAttribute('data-path');
    if (path === activeRoute) {
      link.className = "font-body-sm text-body-sm px-space-sm py-space-xs rounded-lg bg-primary-container text-on-primary-container font-semibold shadow-sm transition-all";
    } else {
      link.className = "font-body-sm text-body-sm px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all";
    }
  });
}

function renderCurrentRoute() {
  const route = getActiveRoute();
  updateNavActiveState(route);

  // Ocultar todas las vistas
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));

  const viewEl = document.getElementById(`view-${route}`);
  if (viewEl) {
    viewEl.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (route) {
      case 'pacientes-y-turno':
        renderPatientsView();
        break;
      case 'nueva-sesion':
        renderNewSessionView();
        break;
      case 'historial-clinico':
        renderHistoryView();
        break;
      case 'evolucion-eva':
        renderEvolutionView();
        break;
    }
  }
}

// ==========================================
// 1. VISTA: PACIENTES Y TURNO
// ==========================================
let currentFilterRegion = 'Todos';
let currentSearchQuery = '';

function setupGlobalEvents() {
  // Modal de alta nuevo paciente
  const btnOpenModal = document.getElementById('btn-open-create-patient');
  const btnCloseModal = document.getElementById('btn-close-patient-modal');
  const modal = document.getElementById('modal-create-patient');
  const form = document.getElementById('form-create-patient');

  if (btnOpenModal && modal) {
    btnOpenModal.addEventListener('click', () => {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      // Sugerir siguiente código
      const patients = StorageService.getPatients();
      const nextNum = patients.length + 1;
      const codeInput = document.getElementById('input-patient-code');
      if (codeInput) codeInput.value = `P-0${nextNum}`;
    });
  }

  if (btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('input-patient-code').value.trim();
      const zone = document.getElementById('input-patient-zone').value.trim();
      const diagnosis = document.getElementById('input-patient-diag').value.trim();
      const region = document.getElementById('input-patient-region').value;

      if (!code || !zone) {
        alert('Por favor indica al menos el código del paciente y la zona del cuerpo.');
        return;
      }

      // Validar que no se usen nombres personales ni datos sensibles según PRD
      const sensitivePattern = /(cédula|cedula|rut|dni|nombre|apellido|telefono|dirección)/i;
      if (sensitivePattern.test(code) || sensitivePattern.test(zone)) {
        alert('Recordatorio de privacidad: no registres nombres personales, cédulas ni teléfonos. Usa únicamente códigos identificadores (ej: P-05).');
        return;
      }

      const newPatient = {
        id: code.toUpperCase(),
        bodyZone: zone,
        diagnosis: diagnosis || 'Evaluación funcional',
        phase: 'Fase Inicial de Valoración',
        bodyRegion: region || 'Miembro Inferior',
        startDate: new Date().toISOString().split('T')[0],
        tutor: 'Lic. Ramírez',
        weekNumber: 1,
        recentTime: 'Hoy'
      };

      StorageService.savePatient(newPatient);
      StorageService.setSelectedPatientId(newPatient.id);

      modal.classList.add('hidden');
      modal.classList.remove('flex');
      form.reset();

      renderPatientsView();
    });
  }
}

function renderPatientsView() {
  const patients = StorageService.getPatients();
  const sessions = StorageService.getSessions();

  // Calcular métricas del banner de turno
  const activeCountEl = document.getElementById('metrics-active-patients');
  if (activeCountEl) activeCountEl.textContent = patients.length;

  const todaySessionsCountEl = document.getElementById('metrics-sessions-today');
  if (todaySessionsCountEl) todaySessionsCountEl.textContent = `${sessions.length} reg.`;

  // Calcular delta EVA promedio
  const deltaEvaAvgEl = document.getElementById('metrics-delta-eva');
  if (deltaEvaAvgEl && sessions.length > 0) {
    let totalDelta = 0;
    sessions.forEach(s => {
      totalDelta += (s.evaPost - s.evaPre);
    });
    const avg = (totalDelta / sessions.length).toFixed(1);
    deltaEvaAvgEl.textContent = `${avg > 0 ? '+' : ''}${avg} pts`;
  }

  // Renderizar filtros de región
  setupPatientFilters();

  // Renderizar lista de pacientes
  const container = document.getElementById('patients-grid-container');
  if (!container) return;

  let filtered = patients.filter(p => {
    const matchesFilter = (currentFilterRegion === 'Todos') || (p.bodyRegion === currentFilterRegion);
    const q = currentSearchQuery.toLowerCase();
    const matchesSearch = !q || p.id.toLowerCase().includes(q) || p.bodyZone.toLowerCase().includes(q) || (p.diagnosis && p.diagnosis.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/60">
        <span class="material-symbols-outlined text-[48px] text-outline mb-2">person_search</span>
        <h3 class="font-headline-sm text-on-surface font-semibold">No se encontraron pacientes</h3>
        <p class="font-body-sm text-on-surface-variant mt-1">Prueba con otro término de búsqueda o registra un nuevo código anónimo.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(patient => {
    const pSessions = StorageService.getSessions(patient.id);
    const sessionCount = pSessions.length;
    
    // Calcular evolución EVA
    let evaText = "Sin sesiones";
    let evaBadge = "";
    let sparklineColor = "#00685f";
    
    if (sessionCount > 0) {
      const firstS = pSessions[0];
      const lastS = pSessions[pSessions.length - 1];
      const delta = lastS.evaPost - firstS.evaPre;
      evaText = `${firstS.evaPre}/10 → ${lastS.evaPost}/10`;
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      const badgeBg = delta <= 0 ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-error-container text-on-error-container";
      evaBadge = `<span class="font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold ${badgeBg}">${sign} pts</span>`;
      sparklineColor = delta <= 0 ? "#00855b" : "#ba1a1a";
    }

    // Mini gráfico de curva SVG dinámico
    let svgPath = "M 0 18 Q 40 18 80 18";
    if (sessionCount > 1) {
      const points = pSessions.map((s, idx) => {
        const x = (idx / (sessionCount - 1)) * 140;
        const y = 30 - ((10 - s.evaPost) / 10) * 24; // Mapear EVA 0-10 a SVG
        return `${x.toFixed(1)} ${Math.max(4, Math.min(32, y)).toFixed(1)}`;
      });
      svgPath = `M ${points.join(' L ')}`;
    }

    return `
      <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 hover:border-primary/50 transition-all flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-2 mb-space-sm">
            <div class="flex items-center gap-space-xs">
              <span class="font-label-md text-label-md px-2.5 py-1 rounded-lg bg-primary-fixed text-on-primary-fixed font-bold tracking-wider">${patient.id}</span>
              <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors">${patient.bodyZone}</h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[200px]">${patient.diagnosis || 'Atención Fisioterapéutica'}</p>
              </div>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface-variant px-2 py-0.5 rounded bg-surface-container flex items-center gap-1 shrink-0">
              <span class="material-symbols-outlined text-[14px]">schedule</span>
              Sem. ${patient.weekNumber || 1}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 my-space-sm p-space-xs bg-surface-container-low rounded-lg">
            <div>
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Sesiones</span>
              <span class="font-label-md text-label-md font-bold text-on-surface">${sessionCount} registradas</span>
            </div>
            <div>
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Evolución EVA</span>
              <div class="flex items-center gap-1 font-label-sm text-label-sm font-semibold">
                <span>${evaText}</span>
                ${evaBadge}
              </div>
            </div>
          </div>

          <!-- Mini Curva de Dolor -->
          <div class="mt-2 mb-3">
            <div class="flex items-center justify-between text-[11px] text-on-surface-variant mb-1 font-label-sm">
              <span>Curva dinámica post-sesión</span>
              <span class="font-semibold" style="color: ${sparklineColor}">${sessionCount > 1 ? 'Evolución registrada' : 'Sesión única'}</span>
            </div>
            <div class="h-8 w-full bg-surface-container rounded px-2 flex items-center overflow-hidden">
              <svg class="w-full h-6" viewBox="0 0 140 36" preserveAspectRatio="none">
                <path d="${svgPath}" fill="none" stroke="${sparklineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="grid grid-cols-3 gap-1.5 pt-space-xs border-t border-outline-variant/30">
          <button onclick="navigateTo('nueva-sesion', '${patient.id}')" class="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-primary text-on-primary font-body-sm text-[12px] font-semibold hover:bg-primary-container transition-all">
            <span class="material-symbols-outlined text-[15px]">add</span>
            <span>+ Sesión</span>
          </button>
          <button onclick="navigateTo('historial-clinico', '${patient.id}')" class="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-surface-container text-on-surface font-body-sm text-[12px] font-semibold hover:bg-surface-container-high transition-all">
            <span class="material-symbols-outlined text-[15px]">history</span>
            <span>Historial</span>
          </button>
          <button onclick="navigateTo('evolucion-eva', '${patient.id}')" class="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-surface-container text-on-surface font-body-sm text-[12px] font-semibold hover:bg-surface-container-high transition-all">
            <span class="material-symbols-outlined text-[15px]">show_chart</span>
            <span>Ver EVA</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function setupPatientFilters() {
  const searchInput = document.getElementById('search-patient-input');
  if (searchInput && !searchInput.dataset.listening) {
    searchInput.dataset.listening = "true";
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderPatientsView();
    });
  }

  const filterButtons = document.querySelectorAll('.patient-region-filter');
  filterButtons.forEach(btn => {
    btn.onclick = () => {
      filterButtons.forEach(b => {
        b.className = "patient-region-filter font-label-sm text-label-sm px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-medium hover:bg-surface-container-high transition-all";
      });
      btn.className = "patient-region-filter font-label-sm text-label-sm px-3 py-1.5 rounded-full bg-primary text-on-primary font-bold shadow-sm transition-all";
      currentFilterRegion = btn.getAttribute('data-region') || 'Todos';
      renderPatientsView();
    };
  });
}

// ==========================================
// 2. VISTA: NUEVA SESIÓN
// ==========================================
let currentEvaPre = 7;
let currentEvaPost = 4;
let sessionExercises = [
  { name: "Sentadilla isométrica contra pared con fitball", dosage: "4 series x 30 seg", load: "Sin dolor agudo, 45° flexión" },
  { name: "Puente glúteo unilateral", dosage: "3 series x 12 repeticiones", load: "Peso corporal + banda elástica verde" },
  { name: "Extensiones de rodilla en cadena abierta terminal", dosage: "3 series x 15 repeticiones", load: "Tobillera 1.5 kg" },
  { name: "Crioterapia + Terapia manual rotuliana", dosage: "10 minutos", load: "Movilización grado II + hielo" }
];

function renderNewSessionView() {
  const patients = StorageService.getPatients();
  const selectedPatientId = StorageService.getSelectedPatientId();

  // Poblar selector de paciente
  const select = document.getElementById('session-patient-select');
  if (select) {
    select.innerHTML = patients.map(p => `
      <option value="${p.id}" ${p.id === selectedPatientId ? 'selected' : ''}>
        ${p.id}: ${p.bodyZone} (${p.diagnosis || 'Tratamiento'})
      </option>
    `).join('');

    select.onchange = (e) => {
      StorageService.setSelectedPatientId(e.target.value);
    };
  }

  // Sliders EVA interactivos
  setupEvaSliders();

  // Renderizar tabla de ejercicios
  renderExercisesTable();

  // Chips rápidos de notas SOAP
  setupQuickChips();

  // Manejador del botón Guardar
  const saveBtn = document.getElementById('btn-save-session');
  if (saveBtn) {
    saveBtn.onclick = handleSaveSession;
  }

  // Manejador de agregar ejercicio
  const addExBtn = document.getElementById('btn-add-exercise');
  if (addExBtn) {
    addExBtn.onclick = handleAddExercise;
  }
}

function setupEvaSliders() {
  const preSlider = document.getElementById('eva-pre-slider');
  const postSlider = document.getElementById('eva-post-slider');
  const preVal = document.getElementById('eva-pre-val');
  const postVal = document.getElementById('eva-post-val');
  const deltaBadge = document.getElementById('eva-delta-badge');

  function updateEvaUI() {
    if (preVal) preVal.textContent = `${currentEvaPre} / 10`;
    if (postVal) postVal.textContent = `${currentEvaPost} / 10`;

    if (deltaBadge) {
      const delta = currentEvaPost - currentEvaPre;
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      const percent = currentEvaPre > 0 ? Math.round((Math.abs(delta) / currentEvaPre) * 100) : 0;
      deltaBadge.innerHTML = `
        <span class="material-symbols-outlined text-[16px]">${delta <= 0 ? 'trending_down' : 'trending_up'}</span>
        <span>${sign} Puntos EVA</span>
        <span class="text-[11px] opacity-80">(${delta <= 0 ? 'Mejora' : 'Aumento'} ${percent}%)</span>
      `;
      if (delta <= 0) {
        deltaBadge.className = "flex items-center gap-1 px-3 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold shadow-sm";
      } else {
        deltaBadge.className = "flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold shadow-sm";
      }
    }

    // Actualizar botones numéricos rápidos 0-10
    document.querySelectorAll('.btn-eva-pre-num').forEach(btn => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      if (val === currentEvaPre) {
        btn.className = "btn-eva-pre-num w-8 h-8 rounded-lg bg-primary text-on-primary font-label-sm font-bold text-center";
      } else {
        btn.className = "btn-eva-pre-num w-8 h-8 rounded-lg bg-surface-container text-on-surface font-label-sm font-medium hover:bg-surface-container-high text-center";
      }
    });

    document.querySelectorAll('.btn-eva-post-num').forEach(btn => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      if (val === currentEvaPost) {
        btn.className = "btn-eva-post-num w-8 h-8 rounded-lg bg-tertiary text-on-tertiary font-label-sm font-bold text-center";
      } else {
        btn.className = "btn-eva-post-num w-8 h-8 rounded-lg bg-surface-container text-on-surface font-label-sm font-medium hover:bg-surface-container-high text-center";
      }
    });
  }

  if (preSlider) {
    preSlider.value = currentEvaPre;
    preSlider.oninput = (e) => {
      currentEvaPre = parseInt(e.target.value, 10);
      updateEvaUI();
    };
  }

  if (postSlider) {
    postSlider.value = currentEvaPost;
    postSlider.oninput = (e) => {
      currentEvaPost = parseInt(e.target.value, 10);
      updateEvaUI();
    };
  }

  // Botones de acceso directo 0 a 10
  const preButtonsRow = document.getElementById('eva-pre-numbers-row');
  if (preButtonsRow) {
    preButtonsRow.innerHTML = [0,1,2,3,4,5,6,7,8,9,10].map(n => `
      <button type="button" data-val="${n}" class="btn-eva-pre-num w-8 h-8 rounded-lg bg-surface-container text-on-surface font-label-sm font-medium text-center">${n}</button>
    `).join('');
    preButtonsRow.querySelectorAll('.btn-eva-pre-num').forEach(b => {
      b.onclick = () => {
        currentEvaPre = parseInt(b.getAttribute('data-val'), 10);
        if (preSlider) preSlider.value = currentEvaPre;
        updateEvaUI();
      };
    });
  }

  const postButtonsRow = document.getElementById('eva-post-numbers-row');
  if (postButtonsRow) {
    postButtonsRow.innerHTML = [0,1,2,3,4,5,6,7,8,9,10].map(n => `
      <button type="button" data-val="${n}" class="btn-eva-post-num w-8 h-8 rounded-lg bg-surface-container text-on-surface font-label-sm font-medium text-center">${n}</button>
    `).join('');
    postButtonsRow.querySelectorAll('.btn-eva-post-num').forEach(b => {
      b.onclick = () => {
        currentEvaPost = parseInt(b.getAttribute('data-val'), 10);
        if (postSlider) postSlider.value = currentEvaPost;
        updateEvaUI();
      };
    });
  }

  updateEvaUI();
}

function renderExercisesTable() {
  const tbody = document.getElementById('exercises-table-body');
  if (!tbody) return;

  tbody.innerHTML = sessionExercises.map((ex, idx) => `
    <tr class="hover:bg-surface-container/40 transition-colors border-b border-outline-variant/20">
      <td class="py-3 px-space-md">
        <input type="text" value="${ex.name}" onchange="updateExercise(${idx}, 'name', this.value)" class="w-full bg-transparent font-body-sm font-semibold text-on-surface focus:outline-none focus:border-b focus:border-primary" placeholder="Nombre del ejercicio">
      </td>
      <td class="py-3 px-space-md">
        <input type="text" value="${ex.dosage}" onchange="updateExercise(${idx}, 'dosage', this.value)" class="w-full bg-transparent font-label-sm font-medium text-primary focus:outline-none focus:border-b focus:border-primary" placeholder="Ej: 3 series x 12 rep">
      </td>
      <td class="py-3 px-space-md">
        <input type="text" value="${ex.load}" onchange="updateExercise(${idx}, 'load', this.value)" class="w-full bg-transparent font-body-sm text-on-surface-variant focus:outline-none focus:border-b focus:border-primary" placeholder="Carga / observación">
      </td>
      <td class="py-3 px-space-md text-right">
        <button type="button" onclick="removeExercise(${idx})" class="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-all">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

window.updateExercise = function(index, field, value) {
  if (sessionExercises[index]) {
    sessionExercises[index][field] = value;
  }
};

window.removeExercise = function(index) {
  sessionExercises.splice(index, 1);
  renderExercisesTable();
};

function handleAddExercise() {
  sessionExercises.push({
    name: "Nuevo ejercicio terapéutico",
    dosage: "3 series x 10 reps",
    load: "Carga progresiva tolerada"
  });
  renderExercisesTable();
}

function setupQuickChips() {
  const chips = document.querySelectorAll('.quick-descriptor-chip');
  chips.forEach(chip => {
    chip.onclick = () => {
      chip.classList.toggle('bg-primary-container');
      chip.classList.toggle('text-on-primary-container');
      chip.classList.toggle('border-primary');
    };
  });
}

function handleSaveSession() {
  const patientId = StorageService.getSelectedPatientId();
  if (!patientId) {
    alert('Por favor selecciona un paciente.');
    return;
  }

  const existingSessions = StorageService.getSessions(patientId);
  const nextSessionNum = existingSessions.length + 1;

  const notesInput = document.getElementById('session-notes-input');
  const romInput = document.getElementById('session-rom-input');

  const notesText = notesInput ? notesInput.value.trim() : "";
  const romValue = romInput ? parseInt(romInput.value, 10) || 120 : 120;

  const newSession = {
    patientId: patientId,
    sessionNumber: nextSessionNum,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: "presencial",
    title: `Sesión #${nextSessionNum} - Protocolo Clínico`,
    evaPre: currentEvaPre,
    evaPost: currentEvaPost,
    romFlexion: romValue,
    exercises: [...sessionExercises],
    notes: notesText || "Sesión ejecutada conforme a dosificación programada. Buena tolerancia al esfuerzo.",
    supervisorNote: "Registrado y Validado",
    validated: true
  };

  StorageService.saveSession(newSession);

  // Mostrar mensaje de confirmación y navegar al historial
  alert(`¡Sesión #${nextSessionNum} registrada exitosamente para el paciente ${patientId}!`);
  navigateTo('historial-clinico', patientId);
}

// ==========================================
// 3. VISTA: HISTORIAL CLÍNICO
// ==========================================
function renderHistoryView() {
  const patientId = StorageService.getSelectedPatientId();
  const patient = StorageService.getPatient(patientId) || StorageService.getPatients()[0];
  if (!patient) return;

  const sessions = StorageService.getSessions(patient.id);

  // Selector de paciente en historial
  const historySelector = document.getElementById('history-patient-selector');
  if (historySelector) {
    const patients = StorageService.getPatients();
    historySelector.innerHTML = patients.map(p => `
      <option value="${p.id}" ${p.id === patient.id ? 'selected' : ''}>
        ${p.id}: ${p.bodyZone}
      </option>
    `).join('');

    historySelector.onchange = (e) => {
      StorageService.setSelectedPatientId(e.target.value);
      renderHistoryView();
    };
  }

  // Título e información del paciente
  const titleEl = document.getElementById('history-patient-title');
  if (titleEl) {
    titleEl.textContent = `Historial Clínico: Paciente ${patient.id}`;
  }
  const badgeEl = document.getElementById('history-patient-badge');
  if (badgeEl) {
    badgeEl.textContent = `${patient.bodyZone} - ${patient.diagnosis}`;
  }

  // KPIs
  const kpiCount = document.getElementById('history-kpi-sessions');
  if (kpiCount) kpiCount.textContent = `${sessions.length} / ${sessions.length}`;

  const kpiEva = document.getElementById('history-kpi-eva');
  if (kpiEva && sessions.length > 0) {
    const init = sessions[0].evaPre;
    const curr = sessions[sessions.length - 1].evaPost;
    kpiEva.innerHTML = `${init} <span class="text-on-surface-variant font-normal text-body-md">inicial</span> → ${curr} <span class="text-on-surface-variant font-normal text-body-md">actual (/10)</span>`;
  }

  const kpiRom = document.getElementById('history-kpi-rom');
  if (kpiRom && sessions.length > 0) {
    const lastRom = sessions[sessions.length - 1].romFlexion || 128;
    kpiRom.textContent = `${lastRom}°`;
  }

  // Timeline de sesiones (la más reciente primero según PRD)
  const timeline = document.getElementById('history-sessions-timeline');
  if (!timeline) return;

  if (sessions.length === 0) {
    timeline.innerHTML = `
      <div class="p-8 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/60">
        <span class="material-symbols-outlined text-[40px] text-outline mb-2">event_busy</span>
        <p class="font-headline-sm font-semibold text-on-surface">No hay sesiones registradas para este paciente.</p>
        <p class="font-body-sm text-on-surface-variant mt-1">Haz clic en Registrar Sesión para crear la primera.</p>
        <button onclick="navigateTo('nueva-sesion', '${patient.id}')" class="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-body-sm font-semibold hover:bg-primary-container transition-all">
          Registrar Primera Sesión
        </button>
      </div>
    `;
    return;
  }

  // Invertir para mostrar la más reciente primero
  const reversedSessions = [...sessions].reverse();

  timeline.innerHTML = reversedSessions.map((s, idx) => {
    const isLatest = idx === 0;
    const delta = s.evaPost - s.evaPre;
    const sign = delta > 0 ? `+${delta}` : `${delta}`;

    return `
      <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border ${isLatest ? 'border-primary/40' : 'border-outline-variant/20'} relative">
        <div class="flex items-start justify-between gap-space-sm mb-3">
          <div class="flex items-center gap-space-sm">
            <span class="w-10 h-10 rounded-xl ${isLatest ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'} flex items-center justify-center font-label-md font-bold shrink-0">
              0${s.sessionNumber}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-headline-sm text-headline-sm font-bold text-on-surface">${s.title}</h4>
                ${isLatest ? '<span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">Última</span>' : ''}
              </div>
              <p class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                <span>${s.date}</span>
                <span>•</span>
                <span>${s.time} hrs</span>
                <span>•</span>
                <span>Tratante: Xarid Michel (Estudiante)</span>
              </p>
            </div>
          </div>
          <span class="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">verified</span>
            Validada por Tutor
          </span>
        </div>

        <!-- Comparativa EVA -->
        <div class="flex flex-wrap items-center gap-space-md p-space-sm bg-surface-container-low rounded-lg my-3">
          <div class="flex items-center gap-2">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Comparativa EVA:</span>
            <span class="font-label-md font-bold px-2 py-0.5 rounded bg-error-container text-on-error-container">Antes: ${s.evaPre}/10</span>
            <span class="material-symbols-outlined text-outline text-[16px]">arrow_forward</span>
            <span class="font-label-md font-bold px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed">Después: ${s.evaPost}/10</span>
          </div>
          <span class="font-label-sm font-bold ${delta <= 0 ? 'text-tertiary' : 'text-error'} flex items-center gap-0.5">
            <span class="material-symbols-outlined text-[16px]">${delta <= 0 ? 'south' : 'north'}</span>
            ${sign} Puntos de dolor
          </span>
          ${s.romFlexion ? `
            <div class="ml-auto font-label-sm text-on-surface-variant">
              <span>ROM Flexión: </span>
              <span class="font-bold text-on-surface">${s.romFlexion}°</span>
            </div>
          ` : ''}
        </div>

        <!-- Ejercicios ejecutados -->
        <div class="space-y-1.5 my-3">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider block">Ejercicios & Procedimientos Clínicos:</span>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            ${(s.exercises || []).map(ex => `
              <div class="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
                <span class="font-body-sm font-semibold text-on-surface block leading-tight">${ex.name}</span>
                <span class="font-label-sm text-primary font-medium block mt-1">${ex.dosage}</span>
                <span class="font-label-sm text-on-surface-variant text-[11px] block">${ex.load}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Observaciones SOAP -->
        ${s.notes ? `
          <div class="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-body-sm italic flex items-start gap-2 mt-3">
            <span class="material-symbols-outlined text-[18px] text-primary shrink-0">notes</span>
            <span>"${s.notes}"</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ==========================================
// 4. VISTA: EVOLUCIÓN EVA (GRÁFICAS)
// ==========================================
function renderEvolutionView() {
  const patientId = StorageService.getSelectedPatientId();
  const patient = StorageService.getPatient(patientId) || StorageService.getPatients()[0];
  if (!patient) return;

  const sessions = StorageService.getSessions(patient.id);

  // Selector en barra analítica
  const evoSelector = document.getElementById('evolution-patient-selector');
  if (evoSelector) {
    const patients = StorageService.getPatients();
    evoSelector.innerHTML = patients.map(p => `
      <option value="${p.id}" ${p.id === patient.id ? 'selected' : ''}>
        ${p.id}: ${p.bodyZone} (${p.diagnosis})
      </option>
    `).join('');

    evoSelector.onchange = (e) => {
      StorageService.setSelectedPatientId(e.target.value);
      renderEvolutionView();
    };
  }

  // KPIs analíticos
  const kpiCount = document.getElementById('evo-kpi-count');
  if (kpiCount) kpiCount.textContent = `${sessions.length} / ${sessions.length}`;

  const kpiEvaAcc = document.getElementById('evo-kpi-eva-acc');
  const kpiEvaSub = document.getElementById('evo-kpi-eva-sub');
  if (sessions.length > 0) {
    const firstS = sessions[0];
    const lastS = sessions[sessions.length - 1];
    if (kpiEvaAcc) kpiEvaAcc.innerHTML = `${lastS.evaPost} <span class="font-body-md text-body-md text-on-surface-variant font-normal">/ 10</span>`;
    
    if (kpiEvaSub) {
      const deltaTotal = lastS.evaPost - firstS.evaPre;
      const pct = firstS.evaPre > 0 ? Math.round((Math.abs(deltaTotal) / firstS.evaPre) * 100) : 0;
      kpiEvaSub.innerHTML = `
        <span class="font-label-md text-label-md ${deltaTotal <= 0 ? 'text-tertiary' : 'text-error'} font-bold flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">${deltaTotal <= 0 ? 'arrow_downward' : 'arrow_upward'}</span>
          ${deltaTotal <= 0 ? '-' : '+'}${pct}% de dolor
        </span>
        <span class="font-label-sm text-label-sm text-on-surface-variant">Inicial: ${firstS.evaPre}/10</span>
      `;
    }
  }

  // Renderizar Gráfica SVG interactiva
  renderEvolutionChart(sessions);

  // Renderizar Matriz Comparativa
  renderEvolutionMatrix(sessions);
}

function renderEvolutionChart(sessions) {
  const chartWrapper = document.getElementById('evolution-svg-container');
  if (!chartWrapper) return;

  if (sessions.length === 0) {
    chartWrapper.innerHTML = `
      <div class="h-64 flex flex-col items-center justify-center text-on-surface-variant">
        <span class="material-symbols-outlined text-[48px] text-outline mb-2">query_stats</span>
        <p class="font-headline-sm font-semibold text-on-surface">No hay datos suficientes para graficar</p>
        <p class="font-body-sm mt-1">Registra al menos 1 o 2 sesiones para visualizar la curva de dolor.</p>
      </div>
    `;
    return;
  }

  const svgWidth = 880;
  const svgHeight = 340;
  const startX = 140;
  const endX = 760;
  const availableWidth = endX - startX;

  const count = sessions.length;
  const stepX = count > 1 ? availableWidth / (count - 1) : availableWidth / 2;

  // Escala Y: EVA 10 = y 40, EVA 0 = y 280 (altura de 240px, cada punto EVA son 24px)
  function getY(evaScore) {
    const clamped = Math.max(0, Math.min(10, evaScore));
    return 280 - (clamped * 24);
  }

  function getX(index) {
    if (count === 1) return startX + availableWidth / 2;
    return startX + (index * stepX);
  }

  // Coordenadas pre y post
  const preCoords = sessions.map((s, i) => ({ x: getX(i), y: getY(s.evaPre), score: s.evaPre, session: s }));
  const postCoords = sessions.map((s, i) => ({ x: getX(i), y: getY(s.evaPost), score: s.evaPost, session: s }));

  const prePathD = `M ${preCoords.map(c => `${c.x} ${c.y}`).join(' L ')}`;
  const postPathD = `M ${postCoords.map(c => `${c.x} ${c.y}`).join(' L ')}`;

  // Polígono de área analgésica
  const areaPolygonPoints = [
    ...preCoords.map(c => `${c.x},${c.y}`),
    ...([...postCoords].reverse().map(c => `${c.x},${c.y}`))
  ].join(' ');

  chartWrapper.innerHTML = `
    <div class="min-w-[700px] w-full h-[360px] relative select-none">
      <svg class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 880 340">
        <defs>
          <linearGradient id="severe-zone" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#ffdad6" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#ffdad6" stop-opacity="0.08"/>
          </linearGradient>
          <linearGradient id="moderate-zone" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#fef3c7" stop-opacity="0.10"/>
          </linearGradient>
          <linearGradient id="mild-zone" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#d1fae5" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#d1fae5" stop-opacity="0.12"/>
          </linearGradient>
          <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15"/>
          </filter>
        </defs>

        <!-- Bandas de Severidad -->
        <rect x="70" y="40" width="770" height="72" fill="url(#severe-zone)" rx="4"/>
        <rect x="70" y="112" width="770" height="72" fill="url(#moderate-zone)" rx="4"/>
        <rect x="70" y="184" width="770" height="96" fill="url(#mild-zone)" rx="4"/>

        <!-- Líneas de cuadrícula horizontal -->
        ${[10, 8, 6, 4, 2, 0].map(val => {
          const y = getY(val);
          const color = val === 10 ? '#ba1a1a' : (val === 0 ? '#006947' : '#6d7a77');
          return `
            <line x1="70" y1="${y}" x2="840" y2="${y}" stroke="#bcc9c6" stroke-width="${val === 0 ? '1.5' : '1'}" stroke-dasharray="${val === 0 ? 'none' : '2,4'}" opacity="0.5"/>
            <text x="55" y="${y + 4}" fill="${color}" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="end">${val}</text>
          `;
        }).join('')}

        <!-- Etiquetas de severidad en el eje derecho -->
        <text x="846" y="78" fill="#ba1a1a" font-family="Manrope" font-size="10" font-weight="700">Dolor Severo (7-10)</text>
        <text x="846" y="150" fill="#92400e" font-family="Manrope" font-size="10" font-weight="700">Moderado (4-6)</text>
        <text x="846" y="234" fill="#006947" font-family="Manrope" font-size="10" font-weight="700">Leve (0-3)</text>

        <!-- Líneas guía verticales para cada sesión -->
        ${sessions.map((s, i) => {
          const x = getX(i);
          return `<line x1="${x}" y1="40" x2="${x}" y2="280" stroke="#bcc9c6" stroke-width="1" opacity="0.4"/>`;
        }).join('')}

        <!-- Sombreado de área intra-sesión (hipoalgesia terapéutica) -->
        ${count > 1 ? `<polygon points="${areaPolygonPoints}" fill="#6bd8cb" fill-opacity="0.22"/>` : ''}

        <!-- Línea Pre-Sesión (Teal primario) -->
        <path d="${prePathD}" fill="none" stroke="#00685f" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#soft-shadow)"/>

        <!-- Línea Post-Sesión (Verde esmeralda) -->
        <path d="${postPathD}" fill="none" stroke="#00855b" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#soft-shadow)"/>

        <!-- Puntos Pre-Sesión -->
        ${preCoords.map(c => `
          <g>
            <circle cx="${c.x}" cy="${c.y}" r="6" fill="#00685f" stroke="#ffffff" stroke-width="2" class="cursor-pointer"/>
            <rect x="${c.x - 18}" y="${c.y - 28}" width="36" height="20" rx="4" fill="#0d1c2e" fill-opacity="0.9"/>
            <text x="${c.x}" y="${c.y - 14}" fill="#ffffff" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">${c.score}/10</text>
          </g>
        `).join('')}

        <!-- Puntos Post-Sesión -->
        ${postCoords.map(c => `
          <g>
            <circle cx="${c.x}" cy="${c.y}" r="6" fill="#00855b" stroke="#ffffff" stroke-width="2" class="cursor-pointer"/>
            <rect x="${c.x - 18}" y="${c.y + 10}" width="36" height="20" rx="4" fill="#00855b" fill-opacity="0.95"/>
            <text x="${c.x}" y="${c.y + 24}" fill="#ffffff" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">${c.score}/10</text>
          </g>
        `).join('')}

        <!-- Etiquetas del Eje X -->
        ${sessions.map((s, i) => {
          const x = getX(i);
          const isLast = i === sessions.length - 1;
          return `
            <text x="${x}" y="304" fill="${isLast ? '#00685f' : '#0d1c2e'}" font-family="Manrope" font-size="12" font-weight="700" text-anchor="middle">Sesión ${s.sessionNumber}</text>
            <text x="${x}" y="320" fill="${isLast ? '#00685f' : '#6d7a77'}" font-family="JetBrains Mono" font-size="11" font-weight="${isLast ? '600' : '400'}" text-anchor="middle">${s.date}</text>
          `;
        }).join('')}
      </svg>
    </div>
  `;
}

function renderEvolutionMatrix(sessions) {
  const tbody = document.getElementById('evolution-matrix-tbody');
  const countEl = document.getElementById('evolution-matrix-count');
  if (countEl) countEl.textContent = `${sessions.length} Evaluaciones Consolidadas`;
  if (!tbody) return;

  tbody.innerHTML = sessions.map(s => {
    const delta = s.evaPost - s.evaPre;
    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    const pct = s.evaPre > 0 ? Math.round((delta / s.evaPre) * 100) : 0;
    const firstEx = s.exercises && s.exercises[0] ? s.exercises[0].name : 'Crioterapia + Ejercicios';

    return `
      <tr class="hover:bg-surface-container/50 transition-colors border-b border-outline-variant/20">
        <td class="py-3.5 px-space-lg font-semibold font-label-md text-label-md text-primary">Sesión ${s.sessionNumber}</td>
        <td class="py-3.5 px-space-md font-label-sm text-label-sm text-on-surface-variant">${s.date}</td>
        <td class="py-3.5 px-space-md">
          <span class="font-label-md text-label-md px-2 py-0.5 rounded bg-error-container text-on-error-container font-semibold">${s.evaPre} / 10</span>
        </td>
        <td class="py-3.5 px-space-md">
          <span class="font-label-md text-label-md px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-semibold">${s.evaPost} / 10</span>
        </td>
        <td class="py-3.5 px-space-md">
          <span class="font-label-sm text-label-sm font-semibold ${delta <= 0 ? 'text-tertiary' : 'text-error'}">${sign} pts (${pct}%)</span>
        </td>
        <td class="py-3.5 px-space-md font-label-md text-label-md font-semibold">${s.romFlexion || 120}°</td>
        <td class="py-3.5 px-space-md text-on-surface-variant truncate max-w-[200px]">${firstEx}</td>
        <td class="py-3.5 px-space-lg">
          <span class="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold">${s.supervisorNote || 'Validado'}</span>
        </td>
      </tr>
    `;
  }).join('');
}
