/**
 * GitHub Pages Integration Script for F4TA Morgana Lab
 * Интеграция фронтенда на GitHub Pages с локальным API через Ngrok
 */

class GitHubIntegration {
    constructor() {
        this.config = null;
        this.apiClient = null;
        this.telegramApp = null;
        this.connected = false;
        this.user = null;
        this.currentGeneration = null;

        // Состояние приложения
        this.state = {
            loading: false,
            error: null,
            apiHealth: false,
            botConnected: false
        };

        // Привязываем методы к контексту
        this.init = this.init.bind(this);
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.startGeneration = this.startGeneration.bind(this);
        this.checkGenerationStatus = this.checkGenerationStatus.bind(this);
    }

    /**
     * Инициализация интеграции
     */
    async init() {
        console.log('🔄 Initializing GitHub Pages Integration...');

        try {
            // Загружаем конфигурацию
            await this.loadConfig();

            // Инициализируем Telegram WebApp
            this.initTelegramApp();

            // Создаем API клиент
            this.createApiClient();

            // Проверяем подключение
            await this.checkConnection();

            // Настраиваем UI
            this.setupUI();

            // Запускаем мониторинг
            this.startHealthMonitoring();

            console.log('✅ GitHub Pages Integration initialized successfully');
            this.updateStatus('Система готова к работе', 'success');

        } catch (error) {
            console.error('❌ Integration initialization failed:', error);
            this.updateStatus('Ошибка инициализации', 'error');
            this.enableFallbackMode();
        }
    }

    /**
     * Загрузка конфигурации
     */
    async loadConfig() {
        // Проверяем наличие глобальной конфигурации
        if (window.F4TAConfig) {
            this.config = window.F4TAConfig;
            return;
        }

        // Пытаемся загрузить из отдельного файла
        try {
            const response = await fetch('./js/config.json');
            if (response.ok) {
                this.config = await response.json();
                return;
            }
        } catch (error) {
            console.warn('Config file not found, using defaults');
        }

        // Fallback конфигурация
        this.config = this.getDefaultConfig();
    }

    /**
     * Конфигурация по умолчанию
     */
    getDefaultConfig() {
        return {
            NGROK_CONFIG: {
                WEBHOOK_URL: "",
                API_URL: "",
                LAST_UPDATE: new Date().toISOString()
            },
            API_CONFIG: {
                baseURL: "/api/v1",
                timeout: 30000,
                endpoints: {
                    uploadImage: "/upload/image",
                    uploadVideo: "/upload/video",
                    startGeneration: "/generation/start",
                    getStatus: "/generation/status",
                    getUserProfile: "/user/profile",
                    health: "/health"
                }
            }
        };
    }

    /**
     * Инициализация Telegram WebApp
     */
    initTelegramApp() {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();

            // Получаем данные пользователя
            this.user = tg.initDataUnsafe?.user;

            if (this.user) {
                console.log('👤 Telegram User:', this.user);
                this.updateUserInfo();
            }

            this.telegramApp = tg;
            console.log('✅ Telegram WebApp initialized');
        } else {
            console.warn('⚠️ Telegram WebApp not available');
        }
    }

    /**
     * Создание API клиента
     */
    createApiClient() {
        const baseURL = this.config.NGROK_CONFIG.API_URL || this.config.API_CONFIG.baseURL;

        this.apiClient = {
            baseURL,

            async request(endpoint, options = {}) {
                const url = `${baseURL}${endpoint}`;

                const defaultOptions = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };

                // Добавляем Telegram данные
                if (window.Telegram?.WebApp?.initData) {
                    defaultOptions.headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
                }

                const requestOptions = { ...defaultOptions, ...options };

                try {
                    const response = await fetch(url, requestOptions);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    return await response.json();
                } catch (error) {
                    console.error(`API Error for ${endpoint}:`, error);
                    throw error;
                }
            }
        };
    }

    /**
     * Проверка подключения
     */
    async checkConnection() {
        try {
            // Проверяем API здоровье
            const health = await this.apiClient.request('/api/health');
            this.state.apiHealth = health.status === 'healthy';

            // Проверяем бота
            if (this.config.NGROK_CONFIG.WEBHOOK_URL) {
                const botInfo = await fetch(`${this.config.NGROK_CONFIG.WEBHOOK_URL}/bot/info`);
                this.state.botConnected = botInfo.ok;
            }

            this.connected = this.state.apiHealth;

        } catch (error) {
            console.error('Connection check failed:', error);
            this.connected = false;
            this.state.apiHealth = false;
            this.state.botConnected = false;
        }
    }

    /**
     * Настройка пользовательского интерфейса
     */
    setupUI() {
        // Обновляем информацию о пользователе
        this.updateUserInfo();

        // Настраиваем обработчики событий
        this.setupEventListeners();

        // Обновляем статус подключения
        this.updateConnectionStatus();
    }

    /**
     * Обновление информации о пользователе
     */
    updateUserInfo() {
        if (this.user) {
            const userNameElement = document.getElementById('userName');
            const userIdElement = document.getElementById('userId');

            if (userNameElement) {
                userNameElement.textContent = this.user.first_name || 'User';
            }

            if (userIdElement) {
                userIdElement.textContent = `ID: ${this.user.id}`;
            }
        }
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Файловая загрузка
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', this.handleFileUpload);
        });

        // Кнопки генерации
        const generateButtons = document.querySelectorAll('.generate-btn');
        generateButtons.forEach(button => {
            button.addEventListener('click', this.startGeneration);
        });

        // Drag & Drop
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', this.handleDragOver);
            zone.addEventListener('drop', this.handleDrop);
        });
    }

    /**
     * Обработка загрузки файлов
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('📁 File selected:', file.name);

        try {
            this.updateStatus('Загрузка файла...', 'loading');

            // Проверяем размер файла
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                throw new Error('Файл слишком большой. Максимальный размер: 50MB');
            }

            // Проверяем тип файла
            if (!this.isSupportedFile(file)) {
                throw new Error('Неподдерживаемый тип файла');
            }

            // Загружаем файл
            const uploadResult = await this.uploadFile(file);

            if (uploadResult.success) {
                this.updateStatus('Файл загружен успешно', 'success');
                this.displayUploadedFile(file, uploadResult.data);
            } else {
                throw new Error(uploadResult.message || 'Ошибка загрузки файла');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.updateStatus(`Ошибка загрузки: ${error.message}`, 'error');
        }
    }

    /**
     * Загрузка файла на сервер
     */
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        // Добавляем метаданные пользователя
        if (this.user) {
            formData.append('user_id', this.user.id.toString());
            formData.append('user_name', this.user.first_name);
        }

        const endpoint = file.type.startsWith('image/') ? '/upload/image' : '/upload/video';

        try {
            const response = await this.apiClient.request(endpoint, {
                method: 'POST',
                body: formData,
                headers: {} // Убираем Content-Type для multipart
            });

            return response;
        } catch (error) {
            throw new Error(`Ошибка загрузки файла: ${error.message}`);
        }
    }

    /**
     * Запуск генерации
     */
    async startGeneration(event) {
        const button = event.target;
        const toolType = button.dataset.tool || 'metamorf';

        try {
            this.updateStatus('Запуск генерации...', 'loading');

            // Получаем параметры генерации
            const params = this.getGenerationParams(toolType);

            // Запускаем генерацию
            const result = await this.apiClient.request('/generation/start', {
                method: 'POST',
                body: JSON.stringify({
                    tool: toolType,
                    params,
                    user_id: this.user?.id
                })
            });

            if (result.success) {
                this.currentGeneration = result.generation_id;
                this.updateStatus('Генерация запущена...', 'processing');
                this.startStatusPolling();
            } else {
                throw new Error(result.message || 'Ошибка запуска генерации');
            }

        } catch (error) {
            console.error('Generation error:', error);
            this.updateStatus(`Ошибка генерации: ${error.message}`, 'error');
        }
    }

    /**
     * Получение параметров генерации
     */
    getGenerationParams(toolType) {
        const params = {
            quality: 'high',
            preserve_original: true
        };

        // Специфичные параметры для разных инструментов
        switch (toolType) {
            case 'metamorf':
                params.face_enhancer = 'gfpgan';
                params.frame_processor = 'face_swapper';
                break;
            case 'neural_editor':
                params.model = 'stable-diffusion';
                params.steps = 20;
                break;
        }

        return params;
    }

    /**
     * Мониторинг статуса генерации
     */
    startStatusPolling() {
        if (!this.currentGeneration) return;

        const pollInterval = setInterval(async () => {
            try {
                const status = await this.checkGenerationStatus();

                if (status.completed) {
                    clearInterval(pollInterval);
                    this.handleGenerationComplete(status);
                } else if (status.failed) {
                    clearInterval(pollInterval);
                    this.handleGenerationError(status);
                } else {
                    this.updateGenerationProgress(status);
                }

            } catch (error) {
                console.error('Status polling error:', error);
                clearInterval(pollInterval);
                this.updateStatus('Ошибка получения статуса', 'error');
            }
        }, 2000);
    }

    /**
     * Проверка статуса генерации
     */
    async checkGenerationStatus() {
        if (!this.currentGeneration) return null;

        return await this.apiClient.request(`/generation/status/${this.currentGeneration}`);
    }

    /**
     * Обработка завершения генерации
     */
    handleGenerationComplete(status) {
        console.log('✅ Generation completed:', status);
        this.updateStatus('Генерация завершена!', 'success');

        if (status.result_url) {
            this.displayResult(status.result_url);
        }

        this.currentGeneration = null;
    }

    /**
     * Обработка ошибки генерации
     */
    handleGenerationError(status) {
        console.error('❌ Generation failed:', status);
        this.updateStatus(`Ошибка генерации: ${status.error || 'Неизвестная ошибка'}`, 'error');
        this.currentGeneration = null;
    }

    /**
     * Обновление прогресса генерации
     */
    updateGenerationProgress(status) {
        const progress = status.progress || 0;
        const message = status.message || 'Обработка...';

        this.updateStatus(`${message} (${Math.round(progress)}%)`, 'processing');

        // Обновляем прогресс-бар если есть
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    /**
     * Отображение результата
     */
    displayResult(resultUrl) {
        const resultContainer = document.getElementById('result-container');
        if (!resultContainer) return;

        const img = document.createElement('img');
        img.src = resultUrl;
        img.alt = 'Generated Result';
        img.className = 'result-image';

        resultContainer.innerHTML = '';
        resultContainer.appendChild(img);

        // Показываем контейнер результата
        resultContainer.style.display = 'block';
    }

    /**
     * Проверка поддержки файла
     */
    isSupportedFile(file) {
        const supportedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/bmp',
            'video/mp4',
            'video/avi',
            'video/quicktime'
        ];

        return supportedTypes.includes(file.type);
    }

    /**
     * Обновление статуса
     */
    updateStatus(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);

        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
        }

        // Уведомление в Telegram
        if (type === 'error' && this.telegramApp) {
            this.telegramApp.showAlert(`Ошибка: ${message}`);
        }
    }

    /**
     * Обновление статуса подключения
     */
    updateConnectionStatus() {
        const connectionElement = document.getElementById('connection-status');
        if (!connectionElement) return;

        if (this.connected) {
            connectionElement.innerHTML = '🟢 Подключено';
            connectionElement.className = 'connection-status connected';
        } else {
            connectionElement.innerHTML = '🔴 Отключено';
            connectionElement.className = 'connection-status disconnected';
        }
    }

    /**
     * Мониторинг состояния системы
     */
    startHealthMonitoring() {
        setInterval(async () => {
            await this.checkConnection();
            this.updateConnectionStatus();
        }, 30000); // Каждые 30 секунд
    }

    /**
     * Включение fallback режима
     */
    enableFallbackMode() {
        console.warn('🔄 Enabling fallback mode');

        this.updateStatus('Работа в автономном режиме', 'warning');

        // Показываем demo интерфейс
        const demoNotice = document.createElement('div');
        demoNotice.className = 'demo-notice';
        demoNotice.innerHTML = `
            <h3>🔧 Демо режим</h3>
            <p>API сервер недоступен. Некоторые функции ограничены.</p>
            <p>Для полной функциональности запустите локальный сервер.</p>
        `;

        document.body.insertBefore(demoNotice, document.body.firstChild);
    }

    /**
     * Drag & Drop обработчики
     */
    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileUpload({ target: { files } });
        }
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧬 F4TA Morgana Lab - GitHub Pages Integration Loading...');

    // Создаем и инициализируем интеграцию
    window.F4TAIntegration = new GitHubIntegration();
    window.F4TAIntegration.init();
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubIntegration;
}
