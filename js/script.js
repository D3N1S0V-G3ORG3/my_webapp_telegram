// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Переменные состояния
let currentStage = 1;
let selectedTool = null;
let touchStartX = 0;
let touchStartY = 0;

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", function () {
  // Настройка цветовой схемы Telegram
  document.documentElement.style.setProperty(
    "--tg-theme-bg-color",
    tg.themeParams.bg_color || "#0a0f1b",
  );
  document.documentElement.style.setProperty(
    "--tg-theme-text-color",
    tg.themeParams.text_color || "#ffffff",
  );

  // Инициализация свайпов для навигации
  initSwipeNavigation();

  // Обработка загрузки файла
  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", handleFileUpload);
  }

  // Показать главную кнопку Telegram для определенных этапов
  updateTelegramMainButton();
});

// Переход между этапами
function goToStage(stage) {
  // Скрываем текущий этап
  document.getElementById(`stage${currentStage}`)?.classList.remove("active");

  // Показываем новый этап
  currentStage = stage;
  document.getElementById(`stage${currentStage}`)?.classList.add("active");

  // Обновляем UI элементы
  updateProgressBar();
  updateBackButton();
  updateTelegramMainButton();

  // Автопереход для этапа синтеза
  if (stage === 4) {
    setTimeout(() => goToStage(5), 3000);
  }

  // Сброс при возврате на первый этап
  if (stage === 1) {
    selectedTool = null;
    resetSettings();
  }
}

// Навигация назад
function goBack() {
  if (currentStage > 1 && currentStage <= 3) {
    goToStage(currentStage - 1);
  }
}

// Обновление прогресс-бара
function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;

  progressBar.classList.toggle("active", currentStage > 1);

  // Обновляем состояние кружков
  const circles = progressBar.querySelectorAll(".step-circle");
  circles.forEach((circle, index) => {
    const stepNum = index + 1;
    circle.classList.toggle("completed", stepNum < currentStage);
    circle.classList.toggle("active", stepNum === currentStage);
  });
}

// Обновление кнопки назад
function updateBackButton() {
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.classList.toggle(
      "visible",
      currentStage >= 2 && currentStage <= 3,
    );
  }
}

// Обновление главной кнопки Telegram
function updateTelegramMainButton() {
  if (currentStage === 3) {
    tg.MainButton.setText("Продолжить");
    tg.MainButton.show();
    tg.MainButton.onClick(() => goToStage(4));
  } else if (currentStage === 5) {
    tg.MainButton.setText("Сохранить результат");
    tg.MainButton.show();
    tg.MainButton.onClick(downloadResult);
  } else {
    tg.MainButton.hide();
  }
}

// Обработка загрузки файла
function handleFileUpload(e) {
  if (e.target.files && e.target.files.length > 0) {
    // Вибрация при загрузке (если поддерживается)
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    setTimeout(() => goToStage(2), 300);
  }
}

// Выбор инструмента
function selectTool(tool) {
  selectedTool = tool;

  // Вибрация при выборе
  if (window.navigator.vibrate) {
    window.navigator.vibrate(30);
  }

  goToStage(3);

  // Показываем соответствующие настройки
  const deepfakeSettings = document.getElementById("deepfakeSettings");
  const neuralSettings = document.getElementById("neuralSettings");

  if (tool === "deepfake") {
    deepfakeSettings.style.display = "block";
    neuralSettings.style.display = "none";
  } else {
    deepfakeSettings.style.display = "none";
    neuralSettings.style.display = "block";
  }
}

// Обработка опций DeepFake
function handleDeepfakeOption(option) {
  if (option === "upload") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      setTimeout(() => goToStage(4), 500);
    };
    input.click();
  } else {
    setTimeout(() => goToStage(4), 500);
  }
}

// Добавление промпта
function addPrompt(text) {
  const input = document.getElementById("promptInput");
  if (input) {
    input.value = text;

    // Автопереход через 1.5 секунды
    setTimeout(() => goToStage(4), 1500);
  }
}

// Скачивание результата
function downloadResult() {
  tg.showAlert("Результат сохранен!");
  // Здесь будет логика сохранения
}

// Сброс настроек
function resetSettings() {
  const deepfakeSettings = document.getElementById("deepfakeSettings");
  const neuralSettings = document.getElementById("neuralSettings");
  if (deepfakeSettings) deepfakeSettings.style.display = "none";
  if (neuralSettings) neuralSettings.style.display = "none";

  const promptInput = document.getElementById("promptInput");
  if (promptInput) promptInput.value = "";
}

// Инициализация свайп-навигации
function initSwipeNavigation() {
  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener(
    "touchstart",
    function (e) {
      touchStartX = e.changedTouches[0].screenX;
    },
    false,
  );

  document.addEventListener(
    "touchend",
    function (e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    },
    false,
  );

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;

    // Свайп вправо (назад) - только для этапов 2 и 3
    if (diff > swipeThreshold && (currentStage === 2 || currentStage === 3)) {
      goBack();
    }
  }
}

// Делаем функции глобальными
window.goToStage = goToStage;
window.goBack = goBack;
window.selectTool = selectTool;
window.handleDeepfakeOption = handleDeepfakeOption;
window.addPrompt = addPrompt;
window.downloadResult = downloadResult;

// Обработка кнопки "Назад" в Telegram
tg.BackButton.onClick(() => {
  if (currentStage > 1) {
    goBack();
  } else {
    tg.close();
  }
});
