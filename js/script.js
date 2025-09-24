// Инициализация Telegram WebApp
let tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Переменные состояния
let currentStage = 1;
let selectedTool = null;
let transitionTimeout = null;
let isTransitioning = false;

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", function () {
  console.log("App initialized");

  // Настройка темы Telegram если доступна
  if (tg && tg.themeParams) {
    document.documentElement.style.setProperty(
      "--tg-theme-bg-color",
      tg.themeParams.bg_color || "#0a0f1b",
    );
    document.documentElement.style.setProperty(
      "--tg-theme-text-color",
      tg.themeParams.text_color || "#ffffff",
    );
  }

  // Инициализация обработчиков
  initializeEventHandlers();

  // Инициализация свайпов
  initSwipeNavigation();

  // Показываем первый этап
  showStage(1);
});

// Инициализация обработчиков событий
function initializeEventHandlers() {
  // Обработка загрузки файла
  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", handleFileUpload);
  }

  // Обработка ввода промпта
  const promptInput = document.getElementById("promptInput");
  if (promptInput) {
    let inputTimeout;
    promptInput.addEventListener("input", function () {
      clearTimeout(inputTimeout);
      if (this.value.length > 5) {
        inputTimeout = setTimeout(() => {
          goToStage(4);
        }, 2000);
      }
    });
  }
}

// Показать этап без анимации (для инициализации)
function showStage(stage) {
  // Скрываем все этапы
  document.querySelectorAll(".stage").forEach((s) => {
    s.classList.remove("active");
  });

  // Показываем нужный этап
  const stageEl = document.getElementById(`stage${stage}`);
  if (stageEl) {
    stageEl.classList.add("active");
    currentStage = stage;
  }

  updateUI();
}

// Переход между этапами с анимацией
function goToStage(stage) {
  if (isTransitioning || stage === currentStage) return;

  console.log(`Transitioning from stage ${currentStage} to stage ${stage}`);
  isTransitioning = true;

  // Очищаем таймауты
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  // Скрываем текущий этап
  const currentStageEl = document.getElementById(`stage${currentStage}`);
  if (currentStageEl) {
    currentStageEl.classList.remove("active");
  }

  // Небольшая задержка для анимации
  setTimeout(() => {
    // Показываем новый этап
    currentStage = stage;
    const newStageEl = document.getElementById(`stage${currentStage}`);
    if (newStageEl) {
      newStageEl.classList.add("active");
    }

    // Обновляем UI элементы
    updateUI();

    // Специальная логика для этапов
    handleStageLogic(stage);

    isTransitioning = false;
  }, 200);
}

// Обработка логики для конкретных этапов
function handleStageLogic(stage) {
  switch (stage) {
    case 1:
      // Сброс состояния
      selectedTool = null;
      resetSettings();
      break;

    case 3:
      // Показываем настройки выбранного инструмента
      showToolSettings();
      break;

    case 4:
      // Автопереход на результат
      transitionTimeout = setTimeout(() => {
        goToStage(5);
      }, 3000);
      break;

    case 5:
      // Показываем результат
      if (tg) {
        tg.MainButton.setText("Сохранить результат");
        tg.MainButton.show();
        tg.MainButton.onClick(downloadResult);
      }
      break;
  }
}

// Показать настройки инструмента
function showToolSettings() {
  const deepfakeSettings = document.getElementById("deepfakeSettings");
  const neuralSettings = document.getElementById("neuralSettings");

  if (selectedTool === "deepfake") {
    if (deepfakeSettings) deepfakeSettings.style.display = "block";
    if (neuralSettings) neuralSettings.style.display = "none";
  } else if (selectedTool === "neural") {
    if (deepfakeSettings) deepfakeSettings.style.display = "none";
    if (neuralSettings) neuralSettings.style.display = "block";
  }
}

// Обновление UI элементов
function updateUI() {
  updateProgressBar();
  updateBackButton();
  updateTelegramMainButton();
}

// Навигация назад
function goBack() {
  if (currentStage === 2 || currentStage === 3) {
    goToStage(currentStage - 1);
  }
}

// Обновление прогресс-бара
function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;

  // Показываем/скрываем прогресс-бар
  if (currentStage > 1) {
    progressBar.classList.add("active");
  } else {
    progressBar.classList.remove("active");
  }

  // Обновляем состояние шагов
  const circles = progressBar.querySelectorAll(".step-circle");
  circles.forEach((circle, index) => {
    const stepNum = index + 1;

    circle.classList.remove("active", "completed");

    if (stepNum < currentStage) {
      circle.classList.add("completed");
    } else if (stepNum === currentStage) {
      circle.classList.add("active");
    }
  });
}

// Обновление кнопки назад
function updateBackButton() {
  const backButton = document.getElementById("backButton");
  if (!backButton) return;

  if (currentStage === 2 || currentStage === 3) {
    backButton.classList.add("visible");
  } else {
    backButton.classList.remove("visible");
  }
}

// Обновление главной кнопки Telegram
function updateTelegramMainButton() {
  if (!tg) return;

  switch (currentStage) {
    case 3:
      tg.MainButton.setText("Продолжить");
      tg.MainButton.show();
      tg.MainButton.onClick(() => goToStage(4));
      break;

    case 5:
      tg.MainButton.setText("Сохранить");
      tg.MainButton.show();
      tg.MainButton.onClick(downloadResult);
      break;

    default:
      tg.MainButton.hide();
  }
}

// Обработка загрузки файла
function handleFileUpload(e) {
  if (e.target.files && e.target.files.length > 0) {
    console.log("File uploaded");

    // Вибрация при загрузке
    if (window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }

    // Переход на выбор инструмента
    setTimeout(() => {
      goToStage(2);
    }, 300);
  }
}

// Выбор инструмента
function selectTool(tool) {
  console.log(`Tool selected: ${tool}`);
  selectedTool = tool;

  // Вибрация при выборе
  if (window.navigator.vibrate) {
    window.navigator.vibrate(20);
  }

  // Переход к настройкам
  goToStage(3);
}

// Обработка опций DeepFake
function handleDeepfakeOption(option) {
  console.log(`DeepFake option: ${option}`);

  if (option === "upload") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      setTimeout(() => goToStage(4), 500);
    };
    input.click();
  } else {
    // Переход к синтезу
    setTimeout(() => goToStage(4), 500);
  }
}

// Добавление промпта
function addPrompt(text) {
  const input = document.getElementById("promptInput");
  if (input) {
    input.value = text;

    // Переход к синтезу
    setTimeout(() => goToStage(4), 1000);
  }
}

// Скачивание результата
function downloadResult() {
  console.log("Downloading result");

  if (tg) {
    tg.showAlert("Результат сохранен!");
  } else {
    alert("Результат сохранен!");
  }
}

// Сброс настроек
function resetSettings() {
  // Скрываем все настройки
  const deepfakeSettings = document.getElementById("deepfakeSettings");
  const neuralSettings = document.getElementById("neuralSettings");

  if (deepfakeSettings) deepfakeSettings.style.display = "none";
  if (neuralSettings) neuralSettings.style.display = "none";

  // Очищаем поля
  const promptInput = document.getElementById("promptInput");
  if (promptInput) promptInput.value = "";

  // Разблокируем кнопки
  const buttons = document.querySelectorAll(".setting-button-webapp");
  buttons.forEach((btn) => (btn.disabled = false));
}

// Инициализация свайп-навигации
function initSwipeNavigation() {
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  document.addEventListener(
    "touchstart",
    function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    function (e) {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    },
    { passive: true },
  );

  function handleSwipe() {
    const swipeThreshold = 50;
    const diffX = touchEndX - touchStartX;
    const diffY = Math.abs(touchEndY - touchStartY);

    // Проверяем что свайп горизонтальный
    if (Math.abs(diffX) > swipeThreshold && diffY < 100) {
      // Свайп вправо (назад) - только для этапов 2 и 3
      if (diffX > 0 && (currentStage === 2 || currentStage === 3)) {
        goBack();
      }
    }
  }
}

// Делаем функции глобальными для HTML
window.goToStage = goToStage;
window.goBack = goBack;
window.selectTool = selectTool;
window.handleDeepfakeOption = handleDeepfakeOption;
window.addPrompt = addPrompt;
window.downloadResult = downloadResult;

// Обработка кнопки "Назад" в Telegram
if (tg) {
  tg.BackButton.onClick(() => {
    if (currentStage > 1) {
      goBack();
    } else {
      tg.close();
    }
  });
}

// Логирование для отладки
console.log("F4TA-Morgana AI Lab WebApp loaded");
