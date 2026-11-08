# Fisiodiario (FisioTrack) 🩺

> **Aplicación web para estudiante de fisioterapia en práctica clínica (Xarid Michel Pinzón) · Universidad de Boyacá**  
> *Grupo: U · Responsable: Helman Andrés Bonilla Montaña · Integrantes: Denis Alejandra Silva Hernández, Melanie Yuliana Almeyda Martínez.*

---

## 📖 El Problema y la Solución

Durante las prácticas clínicas, los estudiantes de fisioterapia atienden a múltiples pacientes por turno y les dan seguimiento durante varias semanas. Al finalizar cada sesión suelen anotar el dolor y los ejercicios en cuadernos o chats informales, lo que dificulta comparar la evolución ante el docente supervisor.

**Fisiodiario** resuelve este problema permitiendo:
1. **Crear pacientes anónimos** identificados únicamente por código correlativo (ej: `P-01`, `P-02`) y zona del cuerpo tratada.
2. **Registrar sesiones en menos de 90 segundos** con dolor ANTES y DESPUÉS en la Escala Visual Analógica (**EVA 0 a 10**), ejercicios realizados con dosificación (series/repeticiones/carga) y notas clínicas.
3. **Consultar el historial longitudinal**, ordenado con la sesión más reciente primero.
4. **Visualizar la dinámica del dolor en gráficas SVG interactivas** comparando dolor de llegada vs. salida y corroborando el efecto analgésico.

---

## 🔒 Privacidad y Reglas de la Aplicación

- **Sin datos personales**: Por normativas de confidencialidad médica, la app no almacena nombres, cédulas ni historias clínicas oficiales; opera únicamente con identificadores de control interno.
- **Persistencia local (Offline-first)**: Funciona en el navegador mediante `localStorage`. No requiere backend, login ni contraseñas.
- **Sin diagnóstico automático**: La app es una herramienta de registro y seguimiento docente; las decisiones terapéuticas corresponden al estudiante junto a su docente supervisor.

---

## 🖥️ Módulos de la Aplicación (SPA)

1. **Pacientes y Turno (`#pacientes-y-turno`)**:
   - Resumen del turno clínico con métricas en tiempo real.
   - Filtros por región (*Miembro Inferior, Columna, Miembro Superior*) y buscador.
   - Modal para alta rápida de pacientes con código correlativo sugerido.
   - Curva de dolor dinâmica en cada tarjeta de paciente.

2. **Nueva Sesión (`#nueva-sesion`)**:
   - Selector de paciente.
   - Sliders táctiles EVA Pre y Post con indicador de delta analgésico.
   - Tabla interactiva para añadir, modificar o remover ejercicios y cargas.
   - Descriptores rápidos (un clic) y observaciones de progresión.

3. **Historial Clínico (`#historial-clinico`)**:
   - Selector directo para cambiar de paciente en cualquier momento.
   - Resumen de KPIs (asistencia, variación de dolor acumulada, goniometría de flexión).
   - Timeline con desglose de procedimientos y comparativa EVA de cada sesión.

4. **Evolución EVA (`#evolucion-eva`)**:
   - Gráfica SVG de dinámica nociceptiva con bandas de severidad (Severo, Moderado, Leve).
   - Matriz comparativa longitudinal con cálculo automático de porcentajes de mejora.
   - Opción para imprimir o exportar reporte docente.

---

## 🚀 Cómo Ejecutar el Proyecto

1. Clona el repositorio o descarga la carpeta:
   ```bash
   git clone https://github.com/Andres552-coder/Fisiodiario.git
   ```
2. Abre el archivo `index.html` en cualquier navegador web (Google Chrome, Edge, Firefox, Safari).
3. ¡Listo! Puedes comenzar a registrar pacientes y sesiones de inmediato.
