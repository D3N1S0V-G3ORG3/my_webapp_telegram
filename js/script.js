// Этот код нужно добавить в начало твоего script.js

// API Configuration
const API_CONFIG = {
  // Для локального тестирования
  baseURL: "http://localhost:8000/api/v1",

  // Для продакшена (когда разместишь на сервере)
  // baseURL: 'https://your-domain.com/api/v1',

  endpoints: {
    uploadImage: "/upload/image",
    uploadVideo: "/upload/video",
    startGeneration: "/generation/start",
    getStatus: "/generation/status",
    getResult: "/generation/result",
    getUserProfile: "/user/profile",
    verifyPayment: "/payment/verify",
  },
};

// Получаем данные пользователя из Telegram WebApp
let userData = null;
if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  userData = {
    id: tg.initDataUnsafe?.user?.id || 218079311,
    username: tg.initDataUnsafe?.user?.username || "test_user",
    first_name: tg.initDataUnsafe?.user?.first_name || "Test",
  };
}
