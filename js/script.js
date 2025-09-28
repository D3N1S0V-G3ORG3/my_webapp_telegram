let currentStage = 1;
let selectedTool = null;
let transitionTimeout = null;
let profilePanelOpen = false;
let touchStartY = 0;
let touchEndY = 0;

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.expand();
    tg.disableVerticalSwipes();
    tg.MainButton.setText("Выберите изображение");
    tg.MainButton.show();
  }

  updateProgressBar();
  initializeEventHandlers();
  initializeProfile();
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

  // Очищаем все таймауты
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  // Скрываем все индикаторы переходов
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

  updateProgressBar();

  if (tg) {
    updateTelegramButtons(stage);
  }

  // Настройки для 3 этапа
  if (stage === 3 && selectedTool) {
    if (selectedTool === "deepfake") {
      document.getElementById("deepfakeSettings").style.display = "block";
      document.getElementById("neuralSettings").style.display = "none";
    } else {
      document.getElementById("deepfakeSettings").style.display = "none";
      document.getElementById("neuralSettings").style.display = "block";
    }
  }

  // Автопереход с 4 этапа на 5
  if (stage === 4) {
    transitionTimeout = setTimeout(() => {
      goToStage(5);
    }, 5000);
  }

  // Очистка при возврате на 1 этап
  if (stage === 1) {
    selectedTool = null;
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";

    const promptInput = document.getElementById("promptInput");
    if (promptInput) promptInput.value = "";
  }
}

// Обновление кнопок Telegram
function updateTelegramButtons(stage) {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  if (stage > 1) {
    tg.BackButton.show();
  } else {
    tg.BackButton.hide();
  }

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

  // Показываем прогресс-бар только начиная со 2 этапа
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
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      "image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/quicktime";

    input.onchange = function (e) {
      const file = e.target.files[0];
      if (file) {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "video/mp4",
          "video/quicktime",
        ];

        if (allowedTypes.includes(file.type)) {
          document.getElementById("deepfakeTransition").style.display = "block";
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
    document.getElementById("deepfakeTransition").style.display = "block";
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
    document.getElementById("neuralTransition").style.display = "block";
    transitionTimeout = setTimeout(() => {
      goToStage(4);
    }, 2000);
  }
}

// Обработка ввода промпта
function handlePromptInput(e) {
  const value = e.target.value.trim();
  const neuralTransition = document.getElementById("neuralTransition");

  // Очищаем предыдущий таймаут
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  if (value.length > 10) {
    if (neuralTransition) neuralTransition.style.display = "block";
    transitionTimeout = setTimeout(() => {
      goToStage(4);
    }, 3000);
  } else {
    if (neuralTransition) neuralTransition.style.display = "none";
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

// ============= ПРОФИЛЬ =============
function initializeProfile() {
  const waveProfileTrigger = document.getElementById("waveProfileTrigger");
  const profilePanel = document.getElementById("profilePanel");
  const profileHandle = document.getElementById("profileHandle");

  if (!waveProfileTrigger || !profilePanel || !profileHandle) return;

  loadUserData();

  // Клик по волне для открытия профиля
  waveProfileTrigger.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!profilePanelOpen) {
      openProfilePanel();
    }
  });

  // Клик по хендлу для закрытия профиля
  profileHandle.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (profilePanelOpen) {
      closeProfilePanel();
    }
  });

  // Touch события для хендла
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
      if (!profilePanelOpen) return;

      touchEndY = e.touches[0].clientY;
      const deltaY = touchEndY - touchStartY;

      if (deltaY > 0) {
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
        closeProfilePanel();
      } else {
        profilePanel.style.transform = "";
      }

      touchStartY = 0;
      touchEndY = 0;
    },
    { passive: true },
  );

  // Закрытие по Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && profilePanelOpen) {
      closeProfilePanel();
    }
  });

  // Закрытие при клике вне панели
  document.addEventListener("click", function (e) {
    if (
      profilePanelOpen &&
      !profilePanel.contains(e.target) &&
      !waveProfileTrigger.contains(e.target)
    ) {
      closeProfilePanel();
    }
  });
}

function openProfilePanel() {
  const profilePanel = document.getElementById("profilePanel");
  const waveProfileTrigger = document.getElementById("waveProfileTrigger");
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.HapticFeedback.impactOccurred("medium");
  }

  profilePanel.classList.add("active");
  profilePanel.style.transform = "translateY(0)";

  waveProfileTrigger.classList.add("hidden");

  profilePanelOpen = true;
  updateProfileStats();
}

function closeProfilePanel() {
  const profilePanel = document.getElementById("profilePanel");
  const waveProfileTrigger = document.getElementById("waveProfileTrigger");
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
  }

  profilePanel.classList.remove("active");
  profilePanel.style.transform = "translateY(100%)";

  setTimeout(() => {
    waveProfileTrigger.classList.remove("hidden");
  }, 300);

  profilePanelOpen = false;
}

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
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "50%";
        profileAvatar.innerHTML = "";
        profileAvatar.appendChild(img);
      }
    }
  } else {
    document.getElementById("profileName").textContent = "Test User";
    document.getElementById("profileUsername").textContent = "@testuser";
    document.getElementById("profileId").textContent = "ID: 123456789";
  }
}

function updateProfileStats() {
  const freeGenerations = document.getElementById("freeGenerations");
  const invitedUsers = document.getElementById("invitedUsers");

  if (freeGenerations) animateValue(freeGenerations, 0, 10, 1000);
  if (invitedUsers) animateValue(invitedUsers, 0, 3, 1000);
}

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

function inviteFriend() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.HapticFeedback.impactOccurred("light");
    const botUsername = "your_bot_username";
    const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}?start=ref_${tg.initDataUnsafe?.user?.id}&text=Попробуй%20F4TA%20Morgana%20AI%20Lab!`;
    tg.openTelegramLink(shareUrl);
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
        encodeURIComponent("https://your-app-url.com"),
    );
  }
}

// Глобальные функции
window.goToStage = goToStage;
window.selectTool = selectTool;
window.handleDeepfakeOption = handleDeepfakeOption;
window.addPrompt = addPrompt;
window.downloadResult = downloadResult;
window.shareResult = shareResult;
window.inviteFriend = inviteFriend;

// Добавьте в script.js
function animateProgress() {
  const progressElement = document.getElementById("progress");
  if (!progressElement) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      setTimeout(() => {
        progress = 0;
        progressElement.textContent = "0";
      }, 1000);
    }
    progressElement.textContent = Math.floor(progress);

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(animateProgress, 2000);
    }
  }, 200);
}

// Запускаем анимацию при переходе на 4 этап
if (currentStage === 4) {
  setTimeout(animateProgress, 500);
}
