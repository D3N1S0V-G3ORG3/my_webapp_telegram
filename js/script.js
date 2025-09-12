// Конфигурация API
const API_CONFIG = {
  // Замени на свой IP или домен
  baseURL: "http://localhost:8000/api/v1",

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

// Функция загрузки изображения на сервер
async function uploadImageToServer(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.uploadImage}`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    console.log("Upload successful:", data);
    return data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// Добавь эту функцию в свой script.js
