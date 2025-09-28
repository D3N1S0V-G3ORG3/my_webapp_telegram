let currentStage = 1;
let selectedTool = null;
let transitionTimeout = null;

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.expand();
    tg.MainButton.setText("Выберите изображение");
    tg.MainButton.show();
  }

  createDigitalRain();
  updateProgressBar();

  // Инициализация обработчиков
  initializeEventHandlers();
});

// Инициализация обработчиков событий
function initializeEventHandlers() {
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.onEvent("mainButtonClicked", function () {
      handleMainButtonClick();
    });

    tg.onEvent("backButtonClicked", function () {
      if (currentStage > 1) {
        goToStage(currentStage - 1);
      }
    });
  }

  // Обработчик загрузки файла на этапе 1
  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", handleFileUploadStage1);
  }

  // Обработчик ввода промпта
  const promptInput = document.getElementById("promptInput");
  if (promptInput) {
    promptInput.addEventListener("input", handlePromptInput);
  }

  // Инициализация компарера
  initializeComparer();
}

// Обработка клика по главной кнопке
function handleMainButtonClick() {
  switch (currentStage) {
    case 1:
      document.getElementById("fileInput").click();
      break;
    case 5:
      goToStage(1);
      break;
  }
}

// Обработка загрузки файла на этапе 1
function handleFileUploadStage1(e) {
  const file = e.target.files[0];
  if (file) {
    // Проверка типа файла для этапа 1
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.type)) {
      goToStage(2);
    } else {
      alert("На этом этапе разрешены только JPG и PNG файлы");
      e.target.value = "";
    }
  }
}

// Переход между этапами
function goToStage(stage) {
  const tg = window.Telegram?.WebApp;

  // Очищаем таймауты
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  // Скрываем индикаторы перехода
  const deepfakeTransition = document.getElementById("deepfakeTransition");
  const neuralTransition = document.getElementById("neuralTransition");
  if (deepfakeTransition) deepfakeTransition.style.display = "none";
  if (neuralTransition) neuralTransition.style.display = "none";

  // Скрываем текущий этап
  const currentStageElement = document.getElementById(`stage${currentStage}`);
  if (currentStageElement) {
    currentStageElement.classList.remove("active");
  }

  // Показываем новый этап
  currentStage = stage;
  const nextStageElement = document.getElementById(`stage${currentStage}`);
  if (nextStageElement) {
    nextStageElement.classList.add("active");
  }

  // Обновляем прогресс-бар
  updateProgressBar();

  // Управление кнопками Telegram
  if (tg) {
    updateTelegramButtons(stage);
  }

  // Логика для этапа 3
  if (stage === 3 && selectedTool) {
    if (selectedTool === "deepfake") {
      document.getElementById("deepfakeSettings").style.display = "block";
      document.getElementById("neuralSettings").style.display = "none";
    } else {
      document.getElementById("deepfakeSettings").style.display = "none";
      document.getElementById("neuralSettings").style.display = "block";
    }
  }

  // Автоматический переход с этапа 4 на этап 5
  if (stage === 4) {
    setTimeout(() => {
      goToStage(5);
    }, 5000);
  }

  // Сброс при переходе на первый этап
  if (stage === 1) {
    selectedTool = null;
    // Очищаем input файла
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
  }
}

// Обновление кнопок Telegram
function updateTelegramButtons(stage) {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  // Управление кнопкой "Назад"
  if (stage > 1) {
    tg.BackButton.show();
  } else {
    tg.BackButton.hide();
  }

  // Управление главной кнопкой
  switch (stage) {
    case 1:
      tg.MainButton.setText("Выберите изображение");
      tg.MainButton.show();
      break;
    case 2:
      tg.MainButton.setText("Выберите инструмент");
      tg.MainButton.hide();
      break;
    case 3:
      if (selectedTool === "deepfake") {
        tg.MainButton.setText("Загрузите файл или выберите из коллекции");
      } else {
        tg.MainButton.setText("Введите промпт");
      }
      tg.MainButton.hide();
      break;
    case 4:
      tg.MainButton.hide();
      break;
    case 5:
      tg.MainButton.setText("Начать заново");
      tg.MainButton.show();
      break;
  }
}

// Обновление прогресс-бара
function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;

  if (currentStage === 1) {
    progressBar.classList.remove("active");
  } else {
    progressBar.classList.add("active");

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

// Выбор инструмента
function selectTool(tool) {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
  }

  selectedTool = tool;
  goToStage(3);
}

// Обработка выбора DeepFake опций
function handleDeepfakeOption(option) {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
  }

  if (option === "upload") {
    // Создаем input для загрузки файла с расширенными типами
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      "image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/quicktime";

    input.onchange = function (e) {
      const file = e.target.files[0];
      if (file) {
        // Проверка типа файла для DeepFake
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "video/mp4",
          "video/quicktime",
        ];

        if (allowedTypes.includes(file.type)) {
          // Показываем индикатор перехода
          document.getElementById("deepfakeTransition").style.display = "block";

          // Автоматический переход через 2 секунды
          transitionTimeout = setTimeout(() => {
            goToStage(4);
          }, 2000);
        } else {
          alert("Разрешены только JPG, PNG, GIF, MP4 и MOV файлы");
        }
      }
    };

    input.click();
  } else if (option === "collection") {
    // Показываем индикатор перехода
    document.getElementById("deepfakeTransition").style.display = "block";

    // Автоматический переход через 2 секунды
    transitionTimeout = setTimeout(() => {
      goToStage(4);
    }, 2000);
  }
}

// Добавление промпта для Neural Editor
function addPrompt(text) {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
  }

  const input = document.getElementById("promptInput");
  if (input) {
    input.value = text;
    input.focus();

    // Показываем индикатор перехода
    document.getElementById("neuralTransition").style.display = "block";

    // Автоматический переход через 2 секунды
    transitionTimeout = setTimeout(() => {
      goToStage(4);
    }, 2000);
  }
}

// Обработка ввода промпта
function handlePromptInput(e) {
  const value = e.target.value;
  const neuralTransition = document.getElementById("neuralTransition");

  if (value.length > 10) {
    // Показываем индикатор перехода
    if (neuralTransition) neuralTransition.style.display = "block";

    // Очищаем предыдущий таймаут
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
    }

    // Автоматический переход через 3 секунды после остановки ввода
    transitionTimeout = setTimeout(() => {
      goToStage(4);
    }, 3000);
  } else {
    // Скрываем индикатор если текста мало
    if (neuralTransition) neuralTransition.style.display = "none";
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
      transitionTimeout = null;
    }
  }
}

// Инициализация компарера
function initializeComparer() {
  const comparerContainer = document.getElementById("comparerContainer");
  const comparerSlider = document.getElementById("comparerSlider");
  const beforeImage = document.querySelector(".comparer-image.before");
  const afterImage = document.querySelector(".comparer-image.after");

  if (!comparerSlider || !comparerContainer) return;

  let isResizing = false;

  // Mouse events
  comparerSlider.addEventListener("mousedown", (e) => {
    isResizing = true;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    updateComparer(e.clientX);
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
  });

  // Touch events
  comparerSlider.addEventListener("touchstart", (e) => {
    isResizing = true;
    e.preventDefault();
  });

  document.addEventListener("touchmove", (e) => {
    if (!isResizing) return;
    updateComparer(e.touches[0].clientX);
  });

  document.addEventListener("touchend", () => {
    isResizing = false;
  });

  function updateComparer(clientX) {
    const rect = comparerContainer.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));

    const percentage = (x / rect.width) * 100;

    comparerSlider.style.left = percentage + "%";
    beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    afterImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
  }
}

// Функции для результата
function downloadResult() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
  }
  console.log("Скачивание результата");
}

function shareResult() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
    tg.openTelegramLink(
      "https://t.me/share/url?url=" +
        encodeURIComponent(
          "https://your-backend-url.com/path-to-your-image.jpg",
        ),
    );
  }
  console.log("Поделиться результатом");
}

// Создание цифрового дождя
function createDigitalRain() {
  const particlesContainer = document.createElement("div");
  particlesContainer.className = "digital-particles";
  document.body.appendChild(particlesContainer);

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
    digit.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    digit.style.left = Math.random() * 100 + "%";
    digit.style.fontSize = `${12 + Math.random() * 8}px`;
    digit.style.opacity = 0.3 + Math.random() * 0.5;
    digit.style.animationDuration = `${10 + Math.random() * 5}s`;

    particlesContainer.appendChild(digit);

    setTimeout(() => {
      digit.remove();
    }, 12000);
  }

  function startRain() {
    for (let i = 0; i < 8; i++) {
      setTimeout(createDigit, i * 400);
    }
  }

  setInterval(startRain, 8000);
  startRain();
}

// Глобальные функции
window.goToStage = goToStage;
window.selectTool = selectTool;
window.handleDeepfakeOption = handleDeepfakeOption;
window.addPrompt = addPrompt;
window.downloadResult = downloadResult;
window.shareResult = shareResult;

// ============= ПРОФИЛЬ - ИСПРАВЛЕННАЯ ВЕРСИЯ =============

let profilePanelOpen = false;
let isDragging = false;
let startY = 0;
let currentY = 0;

document.addEventListener("DOMContentLoaded", function () {
  initializeProfile();
});

function initializeProfile() {
  const waveProfileTrigger = document.getElementById("waveProfileTrigger");
  const profilePanel = document.getElementById("profilePanel");
  const profileHandle = document.querySelector(".profile-handle");

  if (!waveProfileTrigger || !profilePanel) return;

  // Загрузка данных пользователя
  loadUserData();

  // УПРОЩЕННЫЙ ОБРАБОТЧИК - просто клик открывает профиль
  waveProfileTrigger.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!profilePanelOpen) {
      openProfilePanel();
    }
  });

  // Обработчик для закрытия панели - клик по ручке
  profileHandle.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (profilePanelOpen) {
      closeProfilePanel();
    }
  });

  // Свайп вниз для закрытия (touch)
  let touchStartY = 0;
  let touchEndY = 0;

  profileHandle.addEventListener(
    "touchstart",
    function (e) {
      touchStartY = e.touches[0].clientY;
    },
    { passive: true },
  );

  profileHandle.addEventListener(
    "touchmove",
    function (e) {
      touchEndY = e.touches[0].clientY;

      // Если свайп вниз больше 50px
      if (touchEndY - touchStartY > 50) {
        const deltaY = touchEndY - touchStartY;
        profilePanel.style.transform = `translateY(${Math.min(deltaY, 200)}px)`;
      }
    },
    { passive: true },
  );

  profileHandle.addEventListener(
    "touchend",
    function (e) {
      const deltaY = touchEndY - touchStartY;

      if (deltaY > 100) {
        // Закрываем если свайп больше 100px
        closeProfilePanel();
      } else {
        // Возвращаем на место
        profilePanel.style.transform = "";
      }

      touchStartY = 0;
      touchEndY = 0;
    },
    { passive: true },
  );

  // Закрытие по ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && profilePanelOpen) {
      closeProfilePanel();
    }
  });
}

// Функция открытия панели профиля
function openProfilePanel() {
  const profilePanel = document.getElementById("profilePanel");
  const waveProfileTrigger = document.getElementById("waveProfileTrigger");
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.HapticFeedback.impactOccurred("medium");
  }

  // Открываем панель
  profilePanel.classList.add("active");
  profilePanel.style.transform = "translateY(0)";

  // Скрываем волну
  waveProfileTrigger.style.transform = "translateY(100%)";
  waveProfileTrigger.style.opacity = "0";
  waveProfileTrigger.style.pointerEvents = "none";

  profilePanelOpen = true;

  // Обновляем статистику
  updateProfileStats();
}

// Функция закрытия панели профиля
function closeProfilePanel() {
  const profilePanel = document.getElementById("profilePanel");
  const waveProfileTrigger = document.getElementById("waveProfileTrigger");
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
  }

  // Закрываем панель
  profilePanel.classList.remove("active");
  profilePanel.style.transform = "translateY(100%)";

  // Показываем волну
  setTimeout(() => {
    waveProfileTrigger.style.transform = "translateY(0)";
    waveProfileTrigger.style.opacity = "1";
    waveProfileTrigger.style.pointerEvents = "all";
  }, 300);

  profilePanelOpen = false;
}

// Загрузка данных пользователя
function loadUserData() {
  const tg = window.Telegram?.WebApp;

  if (tg && tg.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;

    document.getElementById("profileName").textContent =
      `${user.first_name} ${user.last_name || ""}`.trim();
    document.getElementById("profileUsername").textContent = user.username
      ? `@${user.username}`
      : "Без username";
    document.getElementById("profileId").textContent = `ID: ${user.id}`;

    if (user.photo_url) {
      const profileAvatar = document.getElementById("profileAvatar");
      if (profileAvatar) {
        const img = document.createElement("img");
        img.src = user.photo_url;
        img.alt = "Avatar";
        profileAvatar.innerHTML = "";
        profileAvatar.appendChild(img);
      }
    }
  } else {
    // Тестовые данные
    document.getElementById("profileName").textContent = "Test User";
    document.getElementById("profileUsername").textContent = "@testuser";
    document.getElementById("profileId").textContent = "ID: 123456789";
  }
}

// Обновление статистики
function updateProfileStats() {
  const freeGenerations = document.getElementById("freeGenerations");
  const invitedUsers = document.getElementById("invitedUsers");

  animateValue(freeGenerations, 0, 10, 1000);
  animateValue(invitedUsers, 0, 3, 1000);
}

// Анимация чисел
function animateValue(element, start, end, duration) {
  if (!element) return;

  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (
      (increment > 0 && current >= end) ||
      (increment < 0 && current <= end)
    ) {
      element.textContent = end;
      clearInterval(timer);
    } else {
      element.textContent = Math.round(current);
    }
  }, 16);
}

// Функции для кнопок профиля
function inviteFriend() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
    const botUsername = "your_bot_username";
    const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}?start=ref_${tg.initDataUnsafe?.user?.id}&text=Попробуй%20F4TA%20Morgana%20AI%20Lab!`;
    tg.openTelegramLink(shareUrl);
  }
}

function buyMoreGenerations() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
    tg.showPopup({
      title: "Покупка генераций",
      message: "Выберите пакет генераций в боте",
      buttons: [{ id: "ok", type: "ok", text: "OK" }],
    });
  }
}

// Экспорт функций
window.inviteFriend = inviteFriend;
window.buyMoreGenerations = buyMoreGenerations;

// В функции initializeProfile() замените обработчик touchstart на:
profileHandle.addEventListener(
  "touchstart",
  function (e) {
    touchStartY = e.touches[0].clientY;
    e.preventDefault(); // Добавить эту строку
  },
  { passive: false },
); // Изменить на false

// Для Telegram Web App
if (window.Telegram && window.Telegram.WebApp) {
  Telegram.WebApp.expand();
  Telegram.WebApp.disableVerticalSwipes();
}
