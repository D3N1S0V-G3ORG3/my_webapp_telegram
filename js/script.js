let currentStage = 1;
let selectedTool = null;
let transitionTimeout = null;

// Переход между этапами
function goToStage(stage) {
  // Очищаем таймауты если есть
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
  }

  // Сброс при переходе на первый этап
  if (stage === 1) {
    selectedTool = null;
  }
}

// Обновление прогресс-бара
function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");

  if (currentStage === 1) {
    progressBar.classList.remove("active");
  } else {
    progressBar.classList.add("active");

    // Обновляем состояние кружков
    const circles = progressBar.querySelectorAll(".step-circle");
    const lines = progressBar.querySelectorAll(".step-line");

    circles.forEach((circle, index) => {
      const stepNum = index + 1;

      if (stepNum < currentStage) {
        circle.classList.add("completed");
        circle.classList.remove("active");
      } else if (stepNum === currentStage) {
        circle.classList.add("active");
        circle.classList.remove("completed");
      } else {
        circle.classList.remove("active", "completed");
      }
    });

    lines.forEach((line, index) => {
      const stepNum = index + 2;
      if (stepNum <= currentStage) {
        line.classList.add("active");
      } else {
        line.classList.remove("active");
      }
    });
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
  selectedTool = tool;
  goToStage(3);

  // Показываем соответствующие настройки
  if (tool === "deepfake") {
    document.getElementById("deepfakeSettings").style.display = "block";
    document.getElementById("neuralSettings").style.display = "none";
  } else {
    document.getElementById("deepfakeSettings").style.display = "none";
    document.getElementById("neuralSettings").style.display = "block";
  }
}

// Обработка выбора DeepFake опций
function handleDeepfakeOption(option) {
  // Показываем индикатор перехода
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
    input.click();
  }
}

// Добавление промпта для Neural Editor
function addPrompt(text) {
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
      transitionTimeout = null;
    }
  }
});

// Компарер функционал
const comparerContainer = document.getElementById("comparerContainer");
const comparerSlider = document.getElementById("comparerSlider");
const beforeImage = document.querySelector(".comparer-image.before");
const afterImage = document.querySelector(".comparer-image.after");

let isResizing = false;

if (comparerSlider && comparerContainer) {
  comparerSlider.addEventListener("mousedown", (e) => {
    isResizing = true;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const rect = comparerContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));

    const percentage = (x / rect.width) * 100;

    comparerSlider.style.left = percentage + "%";
    beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    afterImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
  });

  // Touch поддержка
  comparerSlider.addEventListener("touchstart", (e) => {
    isResizing = true;
    e.preventDefault();
  });

  document.addEventListener("touchmove", (e) => {
    if (!isResizing) return;

    const rect = comparerContainer.getBoundingClientRect();
    let x = e.touches[0].clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));

    const percentage = (x / rect.width) * 100;

    comparerSlider.style.left = percentage + "%";
    beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    afterImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
  });

  document.addEventListener("touchend", () => {
    isResizing = false;
  });
}

// Функции для результата
function downloadResult() {
  console.log("Скачивание результата");
}

function shareResult() {
  console.log("Поделиться результатом");
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
  const symbols = [
    "0",
    "1",
    "#",
    "@",
    "$",
    "%",
    "&",
    "*",
    "{",
    "}",
    "<",
    ">",
    "01",
    "10",
    "∞",
    "≠",
    "±",
  ];

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
    }
  }

  // Реже запускаем дождь
  setInterval(startRain, 8000); // Увеличено с 5 до 8 секунд

  // Первый запуск
  startRain();
}

// Запускаем после загрузки страницы
document.addEventListener("DOMContentLoaded", createDigitalRain);
