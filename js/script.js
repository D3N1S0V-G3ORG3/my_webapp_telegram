// Ждем полной загрузки DOM
document.addEventListener("DOMContentLoaded", function () {
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
    const deepfakeTransition = document.getElementById("deepfakeTransition");
    const neuralTransition = document.getElementById("neuralTransition");

    if (deepfakeTransition) deepfakeTransition.style.display = "none";
    if (neuralTransition) neuralTransition.style.display = "none";

    // Скрываем текущий этап
    const currentStageEl = document.getElementById(`stage${currentStage}`);
    if (currentStageEl) {
      currentStageEl.classList.remove("active");
    }

    // Показываем новый этап
    currentStage = stage;
    const newStageEl = document.getElementById(`stage${currentStage}`);
    if (newStageEl) {
      newStageEl.classList.add("active");
    }

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
      // Разблокируем кнопки
      const buttons = document.querySelectorAll(".setting-button");
      buttons.forEach((btn) => (btn.disabled = false));
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
  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      if (e.target.files && e.target.files.length > 0) {
        console.log("Файл загружен, переход на этап 2");
        setTimeout(() => {
          goToStage(2);
        }, 500); // Небольшая задержка для визуального эффекта
      }
    });
  }

  // Выбор инструмента
  function selectTool(tool) {
    console.log("Выбран инструмент:", tool);
    selectedTool = tool;
    goToStage(3);

    // Показываем соответствующие настройки
    const deepfakeSettings = document.getElementById("deepfakeSettings");
    const neuralSettings = document.getElementById("neuralSettings");

    if (tool === "deepfake") {
      if (deepfakeSettings) deepfakeSettings.style.display = "block";
      if (neuralSettings) neuralSettings.style.display = "none";
    } else {
      if (deepfakeSettings) deepfakeSettings.style.display = "none";
      if (neuralSettings) neuralSettings.style.display = "block";
    }
  }

  // Обработка выбора DeepFake опций
  function handleDeepfakeOption(option) {
    console.log("DeepFake опция:", option);

    // Показываем индикатор перехода
    const deepfakeTransition = document.getElementById("deepfakeTransition");
    if (deepfakeTransition) {
      deepfakeTransition.style.display = "block";
    }

    // Блокируем кнопки
    const buttons = document.querySelectorAll(".setting-button");
    buttons.forEach((btn) => (btn.disabled = true));

    // Автоматический переход через 2 секунды
    transitionTimeout = setTimeout(() => {
      console.log("Автопереход на этап 4");
      goToStage(4);
    }, 2000);

    if (option === "upload") {
      // Логика для загрузки файла
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        console.log("Файл для deepfake выбран");
        // Файл выбран, переход уже запланирован
      };
      input.click();
    }
  }

  // Добавление промпта для Neural Editor
  function addPrompt(text) {
    console.log("Добавлен промпт:", text);
    const input = document.getElementById("promptInput");
    if (input) {
      input.value = text;
      input.focus();

      // Показываем индикатор перехода
      const neuralTransition = document.getElementById("neuralTransition");
      if (neuralTransition) {
        neuralTransition.style.display = "block";
      }

      // Очищаем предыдущий таймаут если есть
      if (transitionTimeout) {
        clearTimeout(transitionTimeout);
      }

      // Автоматический переход через 2 секунды
      transitionTimeout = setTimeout(() => {
        console.log("Автопереход на этап 4 после промпта");
        goToStage(4);
      }, 2000);
    }
  }

  // Отслеживание ввода в поле Neural Editor
  const promptInput = document.getElementById("promptInput");
  if (promptInput) {
    promptInput.addEventListener("input", function () {
      console.log("Ввод в поле:", this.value.length, "символов");

      if (this.value.length > 10) {
        // Если введено больше 10 символов
        // Показываем индикатор перехода
        const neuralTransition = document.getElementById("neuralTransition");
        if (neuralTransition) {
          neuralTransition.style.display = "block";
        }

        // Очищаем предыдущий таймаут если есть
        if (transitionTimeout) {
          clearTimeout(transitionTimeout);
        }

        // Автоматический переход через 3 секунды после остановки ввода
        transitionTimeout = setTimeout(() => {
          console.log("Автопереход на этап 4 после ввода текста");
          goToStage(4);
        }, 3000);
      } else {
        // Скрываем индикатор если текста мало
        const neuralTransition = document.getElementById("neuralTransition");
        if (neuralTransition) {
          neuralTransition.style.display = "none";
        }
        if (transitionTimeout) {
          clearTimeout(transitionTimeout);
          transitionTimeout = null;
        }
      }
    });
  }

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
      if (beforeImage)
        beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
      if (afterImage) afterImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
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
      if (beforeImage)
        beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
      if (afterImage) afterImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    });

    document.addEventListener("touchend", () => {
      isResizing = false;
    });
  }

  // Функции для результата
  function downloadResult() {
    console.log("Скачивание результата");
    alert("Функция скачивания будет реализована");
  }

  function shareResult() {
    console.log("Поделиться результатом");
    alert("Функция sharing будет реализована");
  }

  // Анимация частиц
  const particlesContainer = document.querySelector(".organic-particles");
  if (particlesContainer) {
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
  }

  // Эффект следования за курсором для карточек инструментов
  const toolCards = document.querySelectorAll(".tool-card");

  toolCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      card.style.transform = `
            perspective(1000px)
            rotateY(${(x - 0.5) * 10}deg)
            rotateX(${(y - 0.5) * -10}deg)
            translateY(-10px)
            scale(1.05)
        `;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "perspective(1000px) rotateY(0) rotateX(0) translateY(0) scale(1)";
    });
  });

  // Делаем функции глобальными для использования в HTML
  window.goToStage = goToStage;
  window.selectTool = selectTool;
  window.handleDeepfakeOption = handleDeepfakeOption;
  window.addPrompt = addPrompt;
  window.downloadResult = downloadResult;
  window.shareResult = shareResult;

  // Логирование для отладки
  console.log("F4TA-Morgana AI Lab инициализирован");
  console.log("Текущий этап:", currentStage);
});
