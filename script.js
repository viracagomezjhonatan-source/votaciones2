// Estado global de la aplicación
const appState = {
    students: [
        { carnet: '2023001', nombre: 'Juan Pérez', curso: '11-A' },
        { carnet: '2023002', nombre: 'María García', curso: '11-B' },
        { carnet: '2023003', nombre: 'Carlos López', curso: '10-A' },
        { carnet: '2023004', nombre: 'Ana Martínez', curso: '10-B' },
        { carnet: '2023005', nombre: 'Luis Rodríguez', curso: '9-A' }
    ],
    candidates: [
        {
            id: 1,
            nombre: 'Sofía Hernández',
            sigla: 'SH',
            foto: 'https://via.placeholder.com/150/667eea/ffffff?text=SH',
            propuestas: 'Mejores espacios recreativos y deportivos'
        },
        {
            id: 2,
            nombre: 'Diego Morales',
            sigla: 'DM',
            foto: 'https://via.placeholder.com/150/764ba2/ffffff?text=DM',
            propuestas: 'Tecnología en aulas y laboratorios modernos'
        },
        {
            id: 3,
            nombre: 'Camila Torres',
            sigla: 'CT',
            foto: 'https://via.placeholder.com/150/51cf66/ffffff?text=CT',
            propuestas: 'Actividades culturales y artísticas'
        }
    ],
    votes: { 1: 0, 2: 0, 3: 0 },
    votedStudents: new Set(),
    votingConfig: {
        startTime: null,
        endTime: null,
        isActive: false,
        isEnded: false
    },
    currentStudent: null,
    selectedCandidate: null
};

// Variables para los gráficos
let barChart = null;
let pieChart = null;

// Funciones de navegación
function showHomePage() {
    hideAllPages();
    document.getElementById('home-page').classList.add('active');
    resetVoting();
}

function showVotingPanel() {
    hideAllPages();
    document.getElementById('voting-page').classList.add('active');
    showVotingStep('student-login');
}

function showAdminLogin() {
    hideAllPages();
    document.getElementById('admin-page').classList.add('active');
    showAdminStep('admin-login');
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
}

function showVotingStep(stepId) {
    document.querySelectorAll('.voting-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

function showAdminStep(stepId) {
    document.querySelectorAll('.admin-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

// Funciones de votación
function loginStudent() {
    const carnet = document.getElementById('carnet-input').value.trim();
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.style.display = 'none';
    
    if (!carnet) {
        showError('login-error', 'Por favor ingresa tu número de carnet');
        return;
    }
    
    if (!isVotingActive()) {
        showError('login-error', 'La votación no está activa en este momento');
        return;
    }
    
    const student = appState.students.find(s => s.carnet === carnet);
    
    if (!student) {
        showError('login-error', 'Carnet no válido. No estás habilitado para votar.');
        return;
    }
    
    if (appState.votedStudents.has(carnet)) {
        showError('login-error', 'Ya has votado. No puedes votar nuevamente.');
        return;
    }
    
    appState.currentStudent = student;
    document.getElementById('student-name').textContent = student.nombre;
    document.getElementById('student-course').textContent = student.curso;
    
    renderCandidates();
    showVotingStep('candidate-selection');
}

function renderCandidates() {
    const candidatesList = document.getElementById('candidates-list');
    candidatesList.innerHTML = '';
    
    appState.candidates.forEach(candidate => {
        const candidateDiv = document.createElement('div');
        candidateDiv.className = 'candidate-card';
        candidateDiv.onclick = () => selectCandidate(candidate.id);
        
        candidateDiv.innerHTML = `
            <div class="candidate-photo placeholder">
                ${candidate.sigla}
            </div>
            <div class="candidate-info">
                <h3>${candidate.nombre}</h3>
                <p><strong>Sigla:</strong> ${candidate.sigla}</p>
                <p><strong>Propuesta:</strong> ${candidate.propuestas}</p>
            </div>
        `;
        
        candidatesList.appendChild(candidateDiv);
    });
}

function selectCandidate(candidateId) {
    appState.selectedCandidate = candidateId;
    
    // Actualizar UI
    document.querySelectorAll('.candidate-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    
    const confirmBtn = document.getElementById('confirm-vote-btn');
    confirmBtn.disabled = false;
    confirmBtn.style.opacity = '1';
}

function confirmVote() {
    if (!appState.selectedCandidate) {
        showError('voting-error', 'Debes seleccionar un candidato');
        return;
    }
    
    try {
        // Registrar el voto
        appState.votes[appState.selectedCandidate]++;
        appState.votedStudents.add(appState.currentStudent.carnet);
        
        // Guardar en localStorage
        saveAppState();
        
        // Mostrar confirmación
        const successMsg = `¡Gracias por votar, ${appState.currentStudent.nombre}! Tu voto ha sido registrado correctamente.`;
        document.getElementById('success-message').textContent = successMsg;
        
        showVotingStep('vote-confirmation');
        
    } catch (error) {
        showError('voting-error', 'Error al registrar el voto. Inténtalo nuevamente.');
    }
}

function resetVoting() {
    appState.currentStudent = null;
    appState.selectedCandidate = null;
    document.getElementById('carnet-input').value = '';
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('voting-error').style.display = 'none';
    showVotingStep('student-login');
}

// Funciones de administración
function loginAdmin() {
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('admin-error');
    
    errorDiv.style.display = 'none';
    
    if (password === '12345') {
        showAdminStep('admin-dashboard');
        updateAdminDashboard();
    } else {
        showError('admin-error', 'Contraseña incorrecta');
    }
}

function updateAdminDashboard() {
    // Actualizar estadísticas
    const totalVotes = Object.values(appState.votes).reduce((sum, count) => sum + count, 0);
    const remainingVoters = appState.students.length - appState.votedStudents.size;
    const votingStatus = isVotingActive() ? 'ACTIVA' : 'INACTIVA';
    
    document.getElementById('total-votes').textContent = totalVotes;
    document.getElementById('remaining-voters').textContent = remainingVoters;
    document.getElementById('voting-status').textContent = votingStatus;
    document.getElementById('voting-status').className = isVotingActive() ? 'voting-active' : 'voting-inactive';
    
    // Actualizar tabla de resultados
    updateResultsTable();
    
    // Actualizar gráficos
    updateCharts();
}

function updateResultsTable() {
    const tbody = document.getElementById('results-tbody');
    tbody.innerHTML = '';
    
    const results = getResults();
    
    results.forEach((candidate, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}. ${candidate.nombre}</td>
            <td>${candidate.sigla}</td>
            <td>${candidate.votes}</td>
            <td>${candidate.percentage}%</td>
        `;
        tbody.appendChild(row);
    });
}

function updateCharts() {
    const results = getResults();
    const totalVotes = Object.values(appState.votes).reduce((sum, count) => sum + count, 0);
    
    const colors = [
        'rgba(102, 126, 234, 0.8)',
        'rgba(118, 75, 162, 0.8)',
        'rgba(81, 207, 102, 0.8)',
        'rgba(255, 107, 107, 0.8)',
        'rgba(255, 195, 18, 0.8)',
    ];
    
    const borderColors = [
        'rgba(102, 126, 234, 1)',
        'rgba(118, 75, 162, 1)',
        'rgba(81, 207, 102, 1)',
        'rgba(255, 107, 107, 1)',
        'rgba(255, 195, 18, 1)',
    ];
    
    // Gráfico de barras
    const barCtx = document.getElementById('barChart').getContext('2d');
    
    if (barChart) {
        barChart.destroy();
    }
    
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: results.map(c => c.sigla),
            datasets: [{
                label: 'Votos',
                data: results.map(c => c.votes),
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Resultados de Votación - Total: ${totalVotes} votos`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Gráfico circular
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    
    if (pieChart) {
        pieChart.destroy();
    }
    
    if (totalVotes > 0) {
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: results.map(c => `${c.nombre} (${c.sigla})`),
                datasets: [{
                    data: results.map(c => c.votes),
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Votos'
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

function startVoting() {
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    
    appState.votingConfig = {
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : null,
        isActive: true,
        isEnded: false
    };
    
    saveAppState();
    updateAdminDashboard();
    alert('Votación iniciada correctamente');
}

function endVoting() {
    appState.votingConfig.isActive = false;
    appState.votingConfig.isEnded = true;
    
    saveAppState();
    updateAdminDashboard();
    alert('Votación terminada');
}

function clearAllVotes() {
    if (confirm('¿Estás seguro de que quieres borrar todos los votos? Esta acción no se puede deshacer.')) {
        appState.votes = { 1: 0, 2: 0, 3: 0 };
        appState.votedStudents.clear();
        
        saveAppState();
        updateAdminDashboard();
        alert('Todos los votos han sido borrados');
    }
}

// Funciones de exportación PDF
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    const results = getResults();
    const totalVotes = Object.values(appState.votes).reduce((sum, count) => sum + count, 0);
    const remainingVoters = appState.students.length - appState.votedStudents.size;
    const totalStudents = appState.students.length;
    
    // Título
    pdf.setFontSize(20);
    pdf.text('REPORTE DE VOTACIÓN ESTUDIANTIL', 20, 30);
    
    // Fecha y hora
    const now = new Date();
    pdf.setFontSize(12);
    pdf.text(`Fecha: ${now.toLocaleDateString()}`, 20, 45);
    pdf.text(`Hora: ${now.toLocaleTimeString()}`, 20, 55);
    
    // Estadísticas generales
    pdf.setFontSize(16);
    pdf.text('ESTADÍSTICAS GENERALES', 20, 75);
    
    pdf.setFontSize(12);
    pdf.text(`Total de estudiantes habilitados: ${totalStudents}`, 20, 90);
    pdf.text(`Total de votos emitidos: ${totalVotes}`, 20, 100);
    pdf.text(`Estudiantes que faltan por votar: ${remainingVoters}`, 20, 110);
    pdf.text(`Porcentaje de participación: ${totalStudents > 0 ? ((totalVotes / totalStudents) * 100).toFixed(1) : 0}%`, 20, 120);
    
    // Estado de la votación
    let status = 'Inactiva';
    if (appState.votingConfig.isActive && !appState.votingConfig.isEnded) {
        status = 'Activa';
    } else if (appState.votingConfig.isEnded) {
        status = 'Finalizada';
    }
    pdf.text(`Estado de la votación: ${status}`, 20, 130);
    
    // Resultados por candidato
    pdf.setFontSize(16);
    pdf.text('RESULTADOS POR CANDIDATO', 20, 150);
    
    let yPosition = 165;
    pdf.setFontSize(12);
    
    results.forEach((candidate, index) => {
        const position = index + 1;
        const line1 = `${position}. ${candidate.nombre} (${candidate.sigla})`;
        const line2 = `   Votos: ${candidate.votes} - Porcentaje: ${candidate.percentage}%`;
        
        pdf.text(line1, 20, yPosition);
        pdf.text(line2, 20, yPosition + 10);
        yPosition += 25;
    });
    
    // Información adicional
    pdf.setFontSize(16);
    pdf.text('INFORMACIÓN ADICIONAL', 20, yPosition + 20);
    yPosition += 40;
    
    pdf.setFontSize(12);
    if (appState.votingConfig.startTime) {
        pdf.text(`Inicio programado: ${new Date(appState.votingConfig.startTime).toLocaleString()}`, 20, yPosition);
        yPosition += 10;
    }
    if (appState.votingConfig.endTime) {
        pdf.text(`Fin programado: ${new Date(appState.votingConfig.endTime).toLocaleString()}`, 20, yPosition);
        yPosition += 10;
    }
    
    yPosition += 10;
    pdf.text('Este reporte fue generado automáticamente por el', 20, yPosition);
    pdf.text('Sistema de Votaciones del Colegio', 20, yPosition + 10);
    
    // Guardar el PDF
    const fileName = `reporte_votacion_${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.pdf`;
    pdf.save(fileName);
}

function exportChartPDF() {
    const canvas = document.getElementById('barChart');
    
    if (!canvas) {
        alert('No se encontró el gráfico para exportar');
        return;
    }
    
    html2canvas(canvas).then(canvas => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        pdf.setFontSize(20);
        pdf.text('GRÁFICO DE RESULTADOS', 20, 30);
        
        const now = new Date();
        pdf.setFontSize(12);
        pdf.text(`Generado: ${now.toLocaleString()}`, 20, 45);
        
        // Agregar la imagen del gráfico
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 20, 60, imgWidth, imgHeight);
        
        // Agregar tabla de resultados debajo
        const results = getResults();
        let yPos = 60 + imgHeight + 20;
        
        pdf.setFontSize(14);
        pdf.text('Resultados Detallados:', 20, yPos);
        yPos += 15;
        
        pdf.setFontSize(12);
        results.forEach((candidate, index) => {
            pdf.text(`${index + 1}. ${candidate.nombre} (${candidate.sigla}): ${candidate.votes} votos (${candidate.percentage}%)`, 20, yPos);
            yPos += 10;
        });
        
        pdf.save(`grafico_resultados_${now.getTime()}.pdf`);
    }).catch(error => {
        console.error('Error al exportar gráfico:', error);
        alert('Error al generar el PDF del gráfico');
    });
}

// Funciones auxiliares
function isVotingActive() {
    if (!appState.votingConfig.isActive || appState.votingConfig.isEnded) return false;
    
    const now = new Date();
    if (appState.votingConfig.startTime && now < new Date(appState.votingConfig.startTime)) return false;
    if (appState.votingConfig.endTime && now > new Date(appState.votingConfig.endTime)) return false;
    
    return true;
}

function getResults() {
    return appState.candidates.map(candidate => {
        const votes = appState.votes[candidate.id] || 0;
        const totalVotes = Object.values(appState.votes).reduce((sum, count) => sum + count, 0);
        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
        
        return {
            ...candidate,
            votes,
            percentage
        };
    }).sort((a, b) => b.votes - a.votes);
}

function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Funciones de persistencia
function saveAppState() {
    const stateToSave = {
        votes: appState.votes,
        votedStudents: Array.from(appState.votedStudents),
        votingConfig: appState.votingConfig
    };
    localStorage.setItem('votingAppState', JSON.stringify(stateToSave));
}

function loadAppState() {
    const savedState = localStorage.getItem('votingAppState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        appState.votes = parsed.votes || { 1: 0, 2: 0, 3: 0 };
        appState.votedStudents = new Set(parsed.votedStudents || []);
        appState.votingConfig = parsed.votingConfig || {
            startTime: null,
            endTime: null,
            isActive: false,
            isEnded: false
        };
    }
}

// Eventos del teclado
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        
        if (activeElement.id === 'carnet-input') {
            loginStudent();
        } else if (activeElement.id === 'admin-password') {
            loginAdmin();
        }
    }
});

// Funciones para Google Sheets
async function initializeGoogleSheets() {
    if (!googleSheets.isConfigured()) {
        console.log('Google Sheets no configurado, usando datos por defecto');
        return;
    }
    
    showSyncIndicator('Sincronizando datos...', 'syncing');
    
    try {
        // Usar getBothData para obtener todo de una vez (más eficiente)
        const data = await googleSheets.getBothData();
        
        // Actualizar datos de la aplicación
        appState.students = data.students;
        appState.candidates = data.candidates;
        
        // Reinicializar votos para nuevos candidatos
        const newVotes = {};
        data.candidates.forEach(candidate => {
            newVotes[candidate.id] = appState.votes[candidate.id] || 0;
        });
        appState.votes = newVotes;
        
        showSyncIndicator('✅ Datos sincronizados', 'success');
        setTimeout(hideSyncIndicator, 2000);
        
        console.log(`📚 Estudiantes cargados: ${data.students.length}`);
        console.log(`🗳️ Candidatos cargados: ${data.candidates.length}`);
        
    } catch (error) {
        console.error('Error al inicializar Google Sheets:', error);
        showSyncIndicator('❌ Error de sincronización', 'error');
        setTimeout(hideSyncIndicator, 3000);
    }
}

function showSyncIndicator(message, type = '') {
    let indicator = document.getElementById('sync-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'sync-indicator';
        indicator.className = 'sync-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = message;
    indicator.className = `sync-indicator ${type}`;
    indicator.style.display = 'block';
}

function hideSyncIndicator() {
    const indicator = document.getElementById('sync-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

function showConfigInstructions() {
    const instructions = `
✅ CONFIGURACIÓN COMPLETADA CON GOOGLE APPS SCRIPT

Tu sistema ya está configurado y funcionando con:
📊 Google Sheets ID: 12SJTWwSHeWeKN1dWQDQvue0YWFP4Qpw6qD9OeG5u1VU
🔗 Apps Script URL: Configurada correctamente

📋 FORMATO DE TUS HOJAS:

HOJA "Estudiantes":
| carnet   | nombre          | curso | habilitado |
|----------|-----------------|-------|------------|
| 2023001  | Juan Pérez      | 11-A  | SI         |
| 2023002  | María García    | 11-B  | SI         |

HOJA "Candidatos":
| id | nombre           | sigla | foto_url        | propuestas              |
|----|------------------|-------|-----------------|-------------------------|
| 1  | Sofía Hernández  | SH    | https://...     | Mejores espacios        |
| 2  | Diego Morales    | DM    | https://...     | Tecnología en aulas     |

🔄 FUNCIONALIDADES ACTIVAS:
• Sincronización automática cada 5 minutos
• Modo offline con caché
• Actualización en tiempo real
• Solo estudiantes con "SI" pueden votar

Para modificar datos, edita directamente tu Google Sheets.
Los cambios se reflejarán automáticamente en el sistema.
    `;
    
    alert(instructions);
}

async function testConnection() {
    if (!googleSheets.isConfigured()) {
        alert('❌ Google Apps Script no está configurado.');
        return;
    }
    
    showSyncIndicator('Probando conexión...', 'syncing');
    
    try {
        console.log('🔍 Probando URL:', GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL + '?action=getBoth');
        
        const response = await fetch(GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL + '?action=getBoth');
        console.log('📡 Respuesta HTTP:', response.status, response.statusText);
        
        const rawText = await response.text();
        console.log('📄 Respuesta cruda:', rawText);
        
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (parseError) {
            throw new Error(`Error al parsear JSON: ${parseError.message}\nRespuesta: ${rawText}`);
        }
        
        console.log('📊 Datos parseados:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Error desconocido del Apps Script');
        }
        
        const data = result.data;
        
        // Actualizar datos inmediatamente
        appState.students = data.students;
        appState.candidates = data.candidates;
        
        // Reinicializar votos
        const newVotes = {};
        data.candidates.forEach(candidate => {
            newVotes[candidate.id] = appState.votes[candidate.id] || 0;
        });
        appState.votes = newVotes;
        
        // Guardar en caché
        localStorage.setItem('cachedStudents', JSON.stringify(data.students));
        localStorage.setItem('cachedCandidates', JSON.stringify(data.candidates));
        localStorage.setItem('lastSync', new Date().toISOString());
        
        // Actualizar UI
        if (document.getElementById('admin-dashboard').classList.contains('active')) {
            updateAdminDashboard();
        }
        
        showSyncIndicator('✅ Datos sincronizados', 'success');
        
        if (data.students.length > 0 || data.candidates.length > 0) {
            alert(`✅ Conexión exitosa y datos actualizados!\n\n📚 Estudiantes habilitados: ${data.students.length}\n🗳️ Candidatos: ${data.candidates.length}\n\n${data.students.length > 0 ? 'Estudiantes:\n' + data.students.map(s => `• ${s.nombre} (${s.carnet})`).join('\n') + '\n\n' : ''}${data.candidates.length > 0 ? 'Candidatos:\n' + data.candidates.map(c => `• ${c.nombre} (${c.sigla})`).join('\n') : ''}`);
        } else {
            alert('⚠️ Conexión exitosa pero no se encontraron datos.\n\nVerifica:\n• Que tengas datos en las hojas\n• Que los estudiantes tengan "SI" en la columna habilitado\n• Que los candidatos tengan id, nombre y sigla');
        }
        
        setTimeout(hideSyncIndicator, 3000);
        
    } catch (error) {
        showSyncIndicator('❌ Error de conexión', 'error');
        console.error('❌ Error completo:', error);
        alert(`❌ Error de conexión:\n\n${error.message}\n\nRevisa la consola del navegador (F12) para más detalles.`);
        setTimeout(hideSyncIndicator, 3000);
    }
}

async function syncDataManually() {
    const success = await googleSheets.syncData();
    if (success) {
        updateAdminDashboard();
        alert('✅ Datos sincronizados correctamente');
    } else {
        alert('❌ Error al sincronizar datos');
    }
}

function updateConfigStatus() {
    const statusDiv = document.getElementById('config-status');
    if (!statusDiv) return;
    
    if (googleSheets.isConfigured()) {
        const lastSync = localStorage.getItem('lastSync');
        const syncDate = lastSync ? new Date(lastSync).toLocaleString() : 'Nunca';
        
        statusDiv.innerHTML = `
            <div class="config-step">
                ✅ <strong>Google Sheets configurado</strong><br>
                📅 Última sincronización: ${syncDate}<br>
                🌐 Estado: ${navigator.onLine ? 'En línea' : 'Sin conexión'}
            </div>
        `;
    } else {
        statusDiv.innerHTML = `
            <div class="config-step">
                ⚠️ <strong>Google Sheets no configurado</strong><br>
                Usando datos de ejemplo. Configura Google Sheets para datos reales.
            </div>
        `;
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    loadAppState();
    showHomePage();
    
    // Inicializar Google Sheets
    await initializeGoogleSheets();
    
    // Actualizar estado de configuración
    updateConfigStatus();
});

// Actualizar dashboard cada 30 segundos si está en la página de admin
setInterval(() => {
    if (document.getElementById('admin-dashboard').classList.contains('active')) {
        updateAdminDashboard();
        updateConfigStatus();
    }
}, 30000);

// Sincronizar datos cada 5 minutos si está configurado
setInterval(async () => {
    if (googleSheets.isConfigured() && navigator.onLine) {
        await googleSheets.syncData();
    }
}, 5 * 60 * 1000);