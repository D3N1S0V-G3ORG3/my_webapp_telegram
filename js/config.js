/**
 * F4TA Morgana Lab - GitHub Pages Configuration
 * Auto-generated: 2025-09-19T11:40:23.089224
 */

const NGROK_CONFIG = {
    WEBHOOK_URL: "https://1b80e71e04b6.ngrok-free.app",
    API_URL: "https://1b80e71e04b6.ngrok-free.app",
    LAST_UPDATE: "2025-09-19T11:40:23.089277"
};

const API_CONFIG = {
    baseURL: "https://1b80e71e04b6.ngrok-free.app/api",
    webhookURL: "https://1b80e71e04b6.ngrok-free.app",
    timeout: 30000,
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
        verifyPayment: "/payment/verify",
        botInfo: "/bot/info",
        health: "/health"
    }
};

// Export configuration
if (typeof window !== 'undefined') {
    window.F4TAConfig = {
        NGROK_CONFIG,
        API_CONFIG
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NGROK_CONFIG,
        API_CONFIG
    };
}

console.log('🧬 F4TA Morgana Lab Config Loaded:', {
    webhookURL: NGROK_CONFIG.WEBHOOK_URL,
    apiURL: NGROK_CONFIG.API_URL,
    lastUpdate: NGROK_CONFIG.LAST_UPDATE
});
