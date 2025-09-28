let currentStage = 1;
let selectedTool = null;
let transitionTimeout = null;

// Переход между этапами
document.addEventListener("DOMContentLoaded", function () {
  const tg = window.Telegram.WebApp;
  tg.expand();

  tg.MainButton.setText("Выберите изображение");
  tg.MainButton.show();

  tg.onEvent("mainButtonClicked", function () {
    if (currentStage === 1) {
      document.getElementById("fileInput").click();
    }
  });

  tg.onEvent("backButtonClicked", function () {
    if (currentStage > 1) {
      goToStage(currentStage - 1);
    }
  });

  createDigitalRain();
  updateProgressBar();
});

function goToStage(stage) {
  // Очищаем таймауты если есть
  const tg = window.Telegram.WebApp;

  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  // Скрываем индикаторы перехода
  document.getElementById("deepfakeTransition").style.display = "none";
  document.getElementById("neuralTransition").style.display = "none";

  // Скрываем текущий этап
  document.getElementById(`stage${currentStage}`).classList.remove("active");

  // Показываем новый этап
  currentStage = stage;
  document.getElementById(`stage${currentStage}`).classList.add("active");

  // Обновляем прогресс-бар
  updateProgressBar();

  // Специальная логика для этапа 4 (синтез)
  if (stage === 4) {
    setTimeout(() => {
      goToStage(5);
    }, 5000); // Автоматический переход через 5 секунд
  if (stage > 1) {
    tg.BackButton.show();
  } else {
    tg.BackButton.hide();
  }

  // Сброс при переходе на первый этап
  if (stage === 1) {
    selectedTool = null;
  switch (stage) {
    case 1:
      tg.MainButton.setText("Выберите изображение");
      tg.MainButton.show();
      selectedTool = null;
      break;
    case 2:
      tg.MainButton.setText("Выберите инструмент");
      tg.MainButton.show();
      break;
    case 3:
      if (selectedTool === "deepfake") {
        tg.MainButton.setText("Загрузите файл или выберите из коллекции");
      } else {
        tg.MainButton.setText("Введите промпт");
      }
      tg.MainButton.show();
      break;
    case 4:
      tg.MainButton.hide();
      setTimeout(() => {
        goToStage(5);
      }, 5000);
      break;
    case 5:
      tg.MainButton.setText("Начать заново");
      tg.MainButton.show();
      tg.onEvent("mainButtonClicked", function () {
        if (currentStage === 5) {
          goToStage(1);
        }
      });
      break;
  }
}

// Обновление прогресс-бара
function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");

@@ -46,7 +93,6 @@
  } else {
    progressBar.classList.add("active");

    // Обновляем состояние кружков
    const circles = progressBar.querySelectorAll(".step-circle");
    const lines = progressBar.querySelectorAll(".step-line");

@@ -75,19 +121,18 @@
  }
}

// Обработка загрузки файла
document.getElementById("fileInput").addEventListener("change", function (e) {
  if (e.target.files.length > 0) {
    goToStage(2);
  }
});

// Выбор инструмента
function selectTool(tool) {
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
  selectedTool = tool;
  goToStage(3);

  // Показываем соответствующие настройки
  if (tool === "deepfake") {
    document.getElementById("deepfakeSettings").style.display = "block";
    document.getElementById("neuralSettings").style.display = "none";
@@ -97,65 +142,53 @@
  }
}

// Обработка выбора DeepFake опций
function handleDeepfakeOption(option) {
  // Показываем индикатор перехода
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
  document.getElementById("deepfakeTransition").style.display = "block";

  // Блокируем кнопки
  const buttons = document.querySelectorAll(".setting-button");
  buttons.forEach((btn) => (btn.disabled = true));

  // Автоматический переход через 2 секунды
  transitionTimeout = setTimeout(() => {
    goToStage(4);
  }, 2000);

  if (option === "upload") {
    // Можно добавить логику для загрузки файла
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      // Файл выбран, переход уже запланирован
    };
    input.onchange = () => {};
    input.click();
  }
}

// Добавление промпта для Neural Editor
function addPrompt(text) {
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
  const input = document.getElementById("promptInput");
  input.value = text;
  input.focus();

  // Показываем индикатор перехода
  document.getElementById("neuralTransition").style.display = "block";

  // Автоматический переход через 2 секунды
  transitionTimeout = setTimeout(() => {
    goToStage(4);
  }, 2000);
}

// Отслеживание ввода в поле Neural Editor
document.getElementById("promptInput")?.addEventListener("input", function () {
  if (this.value.length > 10) {
    // Если введено больше 10 символов
    // Показываем индикатор перехода
    document.getElementById("neuralTransition").style.display = "block";

    // Очищаем предыдущий таймаут если есть
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
    }

    // Автоматический переход через 3 секунды после остановки ввода
    transitionTimeout = setTimeout(() => {
      goToStage(4);
    }, 3000);
  } else {
    // Скрываем индикатор если текста мало
    document.getElementById("neuralTransition").style.display = "none";
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
@@ -164,7 +197,6 @@
  }
});

// Компарер функционал
const comparerContainer = document.getElementById("comparerContainer");
const comparerSlider = document.getElementById("comparerSlider");
const beforeImage = document.querySelector(".comparer-image.before");
@@ -196,7 +228,6 @@
    isResizing = false;
  });

  // Touch поддержка
  comparerSlider.addEventListener("touchstart", (e) => {
    isResizing = true;
    e.preventDefault();
@@ -221,39 +252,24 @@
  });
}

// Функции для результата
function downloadResult() {
  console.log("Скачивание результата");
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
}

function shareResult() {
  console.log("Поделиться результатом");
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
  tg.openTelegramLink(
    "https://t.me/share/url?url=" +
      encodeURIComponent("https://your-backend-url.com/path-to-your-image.jpg"),
  );
}

// Анимация частиц
const particlesContainer = document.querySelector(".organic-particles");
let particleInterval = setInterval(() => {
  if (currentStage !== 5) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = "0s";
    particle.style.animationDuration = 5 + Math.random() * 5 + "s";
    particlesContainer.appendChild(particle);

    setTimeout(() => particle.remove(), 10000);
  }
}, 500);

// Глобальные функции для использования в HTML
window.goToStage = goToStage;
window.selectTool = selectTool;
window.handleDeepfakeOption = handleDeepfakeOption;
window.addPrompt = addPrompt;
window.downloadResult = downloadResult;
window.shareResult = shareResult;
function createDigitalRain() {
  const particles = document.querySelector(".digital-particles");
  if (!particles) return;
  const symbols = [
    "0",
    "1",
@@ -277,45 +293,32 @@
  function createDigit() {
    const digit = document.createElement("div");
    digit.className = "digit";

    // Случайный символ
    digit.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    // Случайное начальное положение по горизонтали
    digit.style.left = Math.random() * 100 + "%";

    // Случайный размер
    const size = 12 + Math.random() * 8;
    digit.style.fontSize = `${size}px`;

    // Случайная прозрачность
    digit.style.opacity = 0.3 + Math.random() * 0.5;

    // Случайная длительность анимации
    digit.style.animationDuration = `${10 + Math.random() * 5}s`;

    particles.appendChild(digit);

    // Удаляем частицу после завершения анимации
    setTimeout(() => {
      digit.remove();
    }, 12000);
  }

  // Создаем меньше символов с большим интервалом
  function startRain() {
    for (let i = 0; i < 8; i++) {
      // Уменьшено с 20 до 8
      setTimeout(createDigit, i * 400); // Увеличен интервал
      setTimeout(createDigit, i * 400);
    }
  }

  // Реже запускаем дождь
  setInterval(startRain, 8000); // Увеличено с 5 до 8 секунд

  // Первый запуск
  setInterval(startRain, 8000);
  startRain();
}

// Запускаем после загрузки страницы
document.addEventListener("DOMContentLoaded", createDigitalRain);
window.goToStage = goToStage;
window.selectTool = selectTool;
window.handleDeepfakeOption = handleDeepfakeOption;
window.addPrompt = addPrompt;
window.downloadResult = downloadResult;
window.shareResult = shareResult;
