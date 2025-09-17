// API Configuration
const API_CONFIG = {
  baseURL: window.location.origin + "/api/v1",
  
  endpoints: {
    uploadImage: "/upload/image",
    uploadVideo: "/upload/video", 
    startGeneration: "/generation/start",
    getStatus: "/generation/status",
    getResult: "/generation/result",
    getUserProfile: "/user/profile",
    updateProfile: "/user/update",
    getBalance: "/payment/balance",
    createInvoice: "/payment/create-invoice",
    verifyPayment: "/payment/verify"
  }
};

// Telegram WebApp
const tg = window.Telegram ? window.Telegram.WebApp : null;
const isTelegramWebApp = !!(tg && tg.initData);

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Bio-Neural Lab Initialized');
    
    // Инициализация Telegram WebApp
    if (isTelegramWebApp) {
        tg.ready();
        tg.expand();
        
        // Получаем данные пользователя
        const user = tg.initDataUnsafe?.user;
        if (user) {
            console.log('Telegram User:', user);
            document.getElementById('userName').textContent = user.first_name || 'User';
            document.getElementById('userId').textContent = `ID: ${user.id}`;
        }
    }
    
    // Проверяем подключение к API
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.status === 'healthy') {
            console.log('✅ API Connected:', data);
            showNotification('Система готова к работе', 'success');
        }
    } catch (error) {
        console.error('API Connection Error:', error);
        showNotification('Ошибка подключения к серверу', 'error');
    }
});

// Функция показа уведомлений
function showNotification(message, type = 'info') {
    // Если есть Telegram WebApp
    if (isTelegramWebApp && tg.showAlert) {
        tg.showAlert(message);
    } else {
        // Иначе используем обычный alert или создаем div с уведомлением
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// API клиент
class APIClient {
    async request(endpoint, options = {}) {
        const url = `${API_CONFIG.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return this.request(API_CONFIG.endpoints.uploadImage, {
            method: 'POST',
            body: formData,
            headers: {} // Не устанавливаем Content-Type для FormData
        });
    }
}

// Создаем экземпляр API клиента
const api = new APIClient();

// Экспортируем для использования
window.BioNeuralAPI = api;
