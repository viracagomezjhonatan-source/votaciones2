// Configuración para Google Sheets usando Apps Script
const GOOGLE_SHEETS_CONFIG = {
    // URL de tu Google Apps Script
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyJZhiRbB9FNe9rKpUkrCLAPZHwv9FjMcfewqzxt9YndqWmRMLOKbg1LNPGzlAYcypeEQ/exec',
    
    // Configuración (ya no necesitamos API Key ni SPREADSHEET_ID)
    USE_APPS_SCRIPT: true,
    
    // Nombres de las hojas (pestañas) en tu Google Sheets
    SHEETS: {
        STUDENTS: 'Estudiantes',
        CANDIDATES: 'Candidatos'
    }
};

// Clase para manejar la integración con Google Sheets
class GoogleSheetsIntegration {
    constructor() {
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
        this.isOnline = navigator.onLine;
        this.lastSync = localStorage.getItem('lastSync');
        
        // Escuchar cambios de conectividad
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }
    
    // Obtener datos desde Google Apps Script
    async fetchFromAppsScript(action) {
        const url = `${GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL}?action=${action}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error desconocido');
        }
        
        return result.data;
    }
    
    // Obtener estudiantes desde Google Sheets
    async getStudents() {
        try {
            if (!this.isOnline) {
                return this.getOfflineStudents();
            }
            
            const students = await this.fetchFromAppsScript('getStudents');
            
            // Guardar en localStorage para uso offline
            localStorage.setItem('cachedStudents', JSON.stringify(students));
            localStorage.setItem('lastSync', new Date().toISOString());
            
            return students;
            
        } catch (error) {
            console.error('Error al obtener estudiantes:', error);
            
            // Intentar usar datos en caché
            const cachedStudents = this.getOfflineStudents();
            if (cachedStudents.length > 0) {
                this.showOfflineWarning();
                return cachedStudents;
            }
            
            // Si no hay caché, usar datos por defecto
            return this.getDefaultStudents();
        }
    }
    
    // Obtener candidatos desde Google Sheets
    async getCandidates() {
        try {
            if (!this.isOnline) {
                return this.getOfflineCandidates();
            }
            
            const candidates = await this.fetchFromAppsScript('getCandidates');
            
            // Guardar en localStorage para uso offline
            localStorage.setItem('cachedCandidates', JSON.stringify(candidates));
            localStorage.setItem('lastSync', new Date().toISOString());
            
            return candidates;
            
        } catch (error) {
            console.error('Error al obtener candidatos:', error);
            
            // Intentar usar datos en caché
            const cachedCandidates = this.getOfflineCandidates();
            if (cachedCandidates.length > 0) {
                this.showOfflineWarning();
                return cachedCandidates;
            }
            
            // Si no hay caché, usar datos por defecto
            return this.getDefaultCandidates();
        }
    }
    
    // Obtener ambos datos de una vez (más eficiente)
    async getBothData() {
        try {
            if (!this.isOnline) {
                console.log('📱 Modo offline - usando datos en caché');
                return {
                    students: this.getOfflineStudents(),
                    candidates: this.getOfflineCandidates()
                };
            }
            
            console.log('🌐 Obteniendo datos desde Google Apps Script...');
            const data = await this.fetchFromAppsScript('getBoth');
            
            console.log('📊 Datos recibidos:', data);
            
            // Validar que los datos tengan la estructura correcta
            if (!data.students || !data.candidates) {
                throw new Error('Estructura de datos inválida recibida del Apps Script');
            }
            
            // Guardar en localStorage para uso offline
            localStorage.setItem('cachedStudents', JSON.stringify(data.students));
            localStorage.setItem('cachedCandidates', JSON.stringify(data.candidates));
            localStorage.setItem('lastSync', new Date().toISOString());
            
            console.log(`✅ Datos guardados en caché - Estudiantes: ${data.students.length}, Candidatos: ${data.candidates.length}`);
            
            return data;
            
        } catch (error) {
            console.error('❌ Error al obtener datos:', error);
            
            // Usar datos en caché
            const cachedStudents = this.getOfflineStudents();
            const cachedCandidates = this.getOfflineCandidates();
            
            if (cachedStudents.length > 0 || cachedCandidates.length > 0) {
                console.log('📱 Usando datos en caché debido al error');
                this.showOfflineWarning();
                return {
                    students: cachedStudents,
                    candidates: cachedCandidates
                };
            }
            
            // Si no hay caché, usar datos por defecto
            console.log('🔄 Usando datos por defecto');
            return {
                students: this.getDefaultStudents(),
                candidates: this.getDefaultCandidates()
            };
        }
    }
    
    // Los datos ya vienen procesados desde Apps Script, no necesitamos parsear
    
    // Obtener estudiantes desde caché
    getOfflineStudents() {
        const cached = localStorage.getItem('cachedStudents');
        return cached ? JSON.parse(cached) : [];
    }
    
    // Obtener candidatos desde caché
    getOfflineCandidates() {
        const cached = localStorage.getItem('cachedCandidates');
        return cached ? JSON.parse(cached) : [];
    }
    
    // Datos por defecto de estudiantes
    getDefaultStudents() {
        return [
            { carnet: '2023001', nombre: 'Juan Pérez', curso: '11-A', habilitado: true },
            { carnet: '2023002', nombre: 'María García', curso: '11-B', habilitado: true },
            { carnet: '2023003', nombre: 'Carlos López', curso: '10-A', habilitado: true },
            { carnet: '2023004', nombre: 'Ana Martínez', curso: '10-B', habilitado: true },
            { carnet: '2023005', nombre: 'Luis Rodríguez', curso: '9-A', habilitado: true }
        ];
    }
    
    // Datos por defecto de candidatos
    getDefaultCandidates() {
        return [
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
        ];
    }
    
    // Sincronizar datos
    async syncData() {
        if (!this.isOnline) return false;
        
        try {
            const [students, candidates] = await Promise.all([
                this.getStudents(),
                this.getCandidates()
            ]);
            
            // Actualizar el estado de la aplicación
            if (window.appState) {
                window.appState.students = students;
                window.appState.candidates = candidates;
                
                // Reinicializar votos si cambiaron los candidatos
                const newVotes = {};
                candidates.forEach(candidate => {
                    newVotes[candidate.id] = window.appState.votes[candidate.id] || 0;
                });
                window.appState.votes = newVotes;
                
                // Actualizar UI si estamos en el dashboard
                if (typeof updateAdminDashboard === 'function') {
                    updateAdminDashboard();
                }
            }
            
            this.hideOfflineWarning();
            return true;
            
        } catch (error) {
            console.error('Error en sincronización:', error);
            return false;
        }
    }
    
    // Mostrar advertencia de modo offline
    showOfflineWarning() {
        let warning = document.getElementById('offline-warning');
        if (!warning) {
            warning = document.createElement('div');
            warning.id = 'offline-warning';
            warning.className = 'offline-warning';
            warning.innerHTML = `
                <div class="offline-content">
                    <span>⚠️ Usando datos en caché - Sin conexión a Google Sheets</span>
                    <button onclick="googleSheets.syncData()" class="btn-small">Reintentar</button>
                </div>
            `;
            document.body.appendChild(warning);
        }
        warning.style.display = 'block';
    }
    
    // Ocultar advertencia de modo offline
    hideOfflineWarning() {
        const warning = document.getElementById('offline-warning');
        if (warning) {
            warning.style.display = 'none';
        }
    }
    
    // Verificar configuración
    isConfigured() {
        return GOOGLE_SHEETS_CONFIG.USE_APPS_SCRIPT && 
               GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL && 
               GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL !== '';
    }
    
    // Mostrar estado de configuración
    showConfigStatus() {
        if (!this.isConfigured()) {
            console.warn('Google Sheets no configurado. Usando datos por defecto.');
            return false;
        }
        
        console.log('Google Sheets configurado correctamente.');
        return true;
    }
}

// Instancia global
const googleSheets = new GoogleSheetsIntegration();