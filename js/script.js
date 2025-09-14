// ========================================== //
// BIO-NEURAL LAB - FRONTEND v2.0
// ========================================== //

// API Configuration
const API_CONFIG = {
  baseURL: "https://mit-varied-slightly-context.trycloudflare.com/api/v1",
  
  endpoints: {
    uploadImage: "/upload/image",
    uploadVideo: "/upload/video",
    startGeneration: "/generation/start",
    getStatus: "/generation/status",
    getResult: "/generation/result",
    getUserProfile: "/user/profile",
    verifyPayment: "/payment/verify",
    checkFaceCount: "/analysis/faces"
  },
  
  wsURL: "wss://mit-varied-slightly-context.trycloudflare.com/ws"
};
  
// Определение платформы
const userAgent = navigator.userAgent || navigator.vendor || window.opera;
const isPlusMesenger = /Plus Messenger/i.test(userAgent);
const isTeleplus = /Teleplus/i.test(userAgent);
const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
const isAndroid = /Android/.test(userAgent);

// Telegram WebApp
const tg = window.Telegram ? window.Telegram.WebApp : null;
const isTelegramWebApp = !!(tg && tg.initData);

// ========================================== //
// ОСНОВНОЙ КЛАСС
// ========================================== //

class BioNeuralWorkflow {
  constructor() {
    // Состояние приложения
    this.currentStep = 1;
    this.selectedTool = null;
    this.uploadedImageFile = null;
    this.uploadedVideoFile = null;
    this.selectedPreset = null;
    this.selectedIntensity = "medium";
    this.processingTime = 0;
    this.generationId = null;
    this.wsConnection = null;

    // Данные пользователя из Telegram
    this.userData = this.getTelegramUserData();

    // Параметры жестов
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.minSwipeDistance = 50;

    this.init();
  }

  // Получение данных пользователя из Telegram
  getTelegramUserData() {
    if (isTelegramWebApp && tg.initDataUnsafe?.user) {
      const user = tg.initDataUnsafe.user;
      return {
        id: user.id,
        username: user.username || "user",
        firstName: user.first_name || "User",
        lastName: user.last_name || "",
        isPremium: user.is_premium || false,
        photoUrl: user.photo_url || null,
      };
    }

    // Тестовые данные для разработки
    return {
      id: 218079311,
      username: "test_user",
      firstName: "Test",
      lastName: "User",
      isPremium: false,
      photoUrl: null,
    };
  }

  async init() {
    this.initTelegramWebApp();
    this.cacheElements();
    this.setupEventListeners();
    this.createParticles();
    this.setupGestures();
    this.checkDevicePerformance();
    await this.loadUserProfile();
    this.setupWebSocket();
  }

  initTelegramWebApp() {
    if (!isTelegramWebApp) return;

    try {
      tg.ready();
      tg.expand();

      document.body.classList.add("telegram-webapp");
      if (isPlusMesenger) document.body.classList.add("plus-messenger");
      if (isTeleplus) document.body.classList.add("teleplus");
      if (isIOS) document.body.classList.add("ios-device");
      if (isAndroid) document.body.classList.add("android-device");

      if (tg.viewportHeight) {
        document.documentElement.style.setProperty(
          "--tg-viewport-height",
          tg.viewportHeight + "px",
        );
      }

      if (tg.onEvent) {
        tg.onEvent("viewportChanged", (viewport) => {
          if (viewport?.height) {
            document.documentElement.style.setProperty(
              "--tg-viewport-height",
              viewport.height + "px",
            );
          }
        });
      }

      if (isPlusMesenger && tg.setHeaderColor) {
        tg.setHeaderColor("#0a0f1b");
      }

      if (tg.BackButton) {
        tg.BackButton.onClick(() => this.handleBackNavigation());
      }

      if (tg.MainButton) {
        tg.MainButton.hide();
      }
    } catch (e) {
      console.error("Telegram WebApp init error:", e);
    }
  }

  // ========================================== //
  // API МЕТОДЫ
  // ========================================== //

  async apiRequest(endpoint, options = {}) {
    const url = API_CONFIG.baseURL + endpoint;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "X-Telegram-User-Id": this.userData.id.toString(),
          "X-Telegram-Init-Data": isTelegramWebApp ? tg.initData : "",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Request failed:", error);
      this.showError("Ошибка соединения с сервером");
      throw error;
    }
  }

  async loadUserProfile() {
    try {
      const profile = await this.apiRequest(
        API_CONFIG.endpoints.getUserProfile,
      );

      document.getElementById("userName").textContent = profile.name;
      document.getElementById("userId").textContent = `ID: #${profile.id}`;
      document.getElementById("generationsCount").textContent =
        profile.generationsCount;
      document.getElementById("freeGenerations").textContent =
        profile.freeGenerations;
      document.getElementById("starBalance").textContent = profile.starBalance;

      if (profile.avatar) {
        document.getElementById("userAvatar").src = profile.avatar;
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  }

  async uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const result = await this.apiRequest(API_CONFIG.endpoints.uploadImage, {
        method: "POST",
        body: formData,
      });

      if (result.success) {
        this.uploadedImageFile = result.fileId;
        return true;
      } else {
        this.showError(result.error || "Ошибка загрузки изображения");
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async uploadVideo(file) {
    const formData = new FormData();
    formData.append("video", file);

    try {
      const result = await this.apiRequest(API_CONFIG.endpoints.uploadVideo, {
        method: "POST",
        body: formData,
      });

      if (result.success) {
        this.uploadedVideoFile = result.fileId;

        // Проверяем количество лиц в видео
        if (result.facesDetected > 1) {
          await this.selectFaceToReplace(result.faces);
        }

        return true;
      } else {
        this.showError(result.error || "Ошибка загрузки видео");
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async startGeneration() {
    const payload = {
      tool: this.selectedTool,
      sourceImage: this.uploadedImageFile,
      targetVideo: this.uploadedVideoFile,
      preset: this.selectedPreset,
      prompt: document.getElementById("promptInput")?.value || "",
      intensity: this.selectedIntensity,
    };

    try {
      const result = await this.apiRequest(
        API_CONFIG.endpoints.startGeneration,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (result.success) {
        this.generationId = result.generationId;
        this.goToStep(4);
        this.trackGenerationProgress();
        return true;
      } else {
        if (result.error === "insufficient_balance") {
          this.showInsufficientBalanceDialog();
        } else {
          this.showError(result.error || "Ошибка запуска генерации");
        }
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  // ========================================== //
  // WEBSOCKET
  // ========================================== //

  setupWebSocket() {
    try {
      this.wsConnection = new WebSocket(
        API_CONFIG.wsURL + `/${this.userData.id}`,
      );

      this.wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };

      this.wsConnection.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.wsConnection.onclose = () => {
        // Переподключение через 3 секунды
        setTimeout(() => this.setupWebSocket(), 3000);
      };
    } catch (error) {
      console.error("Failed to setup WebSocket:", error);
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case "generation_progress":
        this.updateGenerationProgress(data.progress, data.status);
        break;
      case "generation_complete":
        this.onGenerationComplete(data.resultUrl);
        break;
      case "generation_error":
        this.onGenerationError(data.error);
        break;
      case "balance_updated":
        this.updateBalance(data.balance);
        break;
    }
  }

  async trackGenerationProgress() {
    if (!this.generationId) return;

    const checkStatus = async () => {
      try {
        const result = await this.apiRequest(
          `${API_CONFIG.endpoints.getStatus}/${this.generationId}`,
        );

        if (result.status === "processing") {
          this.updateGenerationProgress(result.progress, result.stage);
          setTimeout(checkStatus, 1000);
        } else if (result.status === "completed") {
          this.onGenerationComplete(result.resultUrl);
        } else if (result.status === "failed") {
          this.onGenerationError(result.error);
        }
      } catch (error) {
        console.error("Failed to check generation status:", error);
      }
    };

    checkStatus();
  }

  updateGenerationProgress(progress, status) {
    document.getElementById("progressFill").style.width = progress + "%";
    document.getElementById("progressPercent").textContent =
      Math.round(progress) + "%";
    document.getElementById("processStatus").textContent = status;

    // Обновляем стадии
    const stageNum = Math.floor(progress / 25) + 1;
    for (let i = 1; i <= 4; i++) {
      const stage = document.getElementById(`stage${i}`);
      if (stage) {
        stage.classList.toggle("active", i === stageNum);
      }
    }
  }

  async onGenerationComplete(resultUrl) {
    try {
      const result = await this.apiRequest(
        `${API_CONFIG.endpoints.getResult}/${this.generationId}`,
      );

      this.showResult(result.originalUrl, result.processedUrl);
      await this.loadUserProfile(); // Обновляем баланс
      this.hapticFeedback("success");
    } catch (error) {
      console.error("Failed to get result:", error);
    }
  }

  onGenerationError(error) {
    this.showError(error || "Ошибка генерации");
    this.goToStep(this.currentStep - 1);
    this.hapticFeedback("error");
  }

  // ========================================== //
  // UI МЕТОДЫ
  // ========================================== //

  cacheElements() {
    this.steps = {
      step1: document.getElementById("step1"),
      step2: document.getElementById("step2"),
      step3Deepfake: document.getElementById("step3-deepfake"),
      step3Neural: document.getElementById("step3-neural"),
      step4: document.getElementById("step4"),
      step5: document.getElementById("step5"),
    };

    this.uploadZone = document.getElementById("uploadZone");
    this.fileInput = document.getElementById("fileInput");
    this.uploadPreview = document.getElementById("uploadPreview");
    this.previewImage = document.getElementById("previewImage");
    this.profileBtn = document.getElementById("profileBtn");
    this.profileModal = document.getElementById("profileModal");
    this.closeProfile = document.getElementById("closeProfile");
    this.workspace = document.getElementById("workspace");
    this.swipeHint = document.getElementById("swipeHint");
    this.applyNeuralSettings = document.getElementById("applyNeuralSettings");
    this.downloadResult = document.getElementById("downloadResult");
    this.startOver = document.getElementById("startOver");
    this.progressSteps = document.querySelectorAll(".progress-step");
  }

  setupEventListeners() {
    // Профиль
    this.profileBtn.addEventListener("click", () => {
      this.openProfile();
      this.hapticFeedback("light");
    });

    this.closeProfile.addEventListener("click", () => {
      this.closeProfileModal();
      this.hapticFeedback("light");
    });

    this.profileModal.addEventListener("click", (e) => {
      if (e.target === this.profileModal) {
        this.closeProfileModal();
      }
    });

    // Загрузка изображения
    this.uploadZone.addEventListener("click", () => {
      this.fileInput.click();
      this.hapticFeedback("light");
    });

    this.fileInput.addEventListener("change", (e) => this.handleFileUpload(e));

    const changeImage = document.getElementById("changeImage");
    if (changeImage) {
      changeImage.addEventListener("click", () => {
        this.fileInput.click();
        this.hapticFeedback("light");
      });
    }

    this.setupDragAndDrop();

    // Выбор инструмента
    document.querySelectorAll(".tool-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.selectTool(card);
        this.hapticFeedback("light");
      });
    });

    // DeepFake опции
    document.querySelectorAll(".preset-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.selectPreset(card);
        this.hapticFeedback("light");
      });
    });

    const uploadVideoBtn = document.getElementById("uploadVideoBtn");
    if (uploadVideoBtn) {
      uploadVideoBtn.addEventListener("click", () => {
        document.getElementById("videoInput").click();
        this.hapticFeedback("light");
      });
    }

    const videoInput = document.getElementById("videoInput");
    if (videoInput) {
      videoInput.addEventListener("change", (e) => this.handleVideoUpload(e));
    }

    // Neural Editor опции
    document.querySelectorAll(".suggestion-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        this.applySuggestion(chip);
        this.hapticFeedback("light");
      });
    });

    document.querySelectorAll(".intensity-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.selectIntensity(card);
        this.hapticFeedback("light");
      });
    });

    const promptInput = document.getElementById("promptInput");
    if (promptInput) {
      promptInput.addEventListener("input", (e) => {
        this.applyNeuralSettings.disabled = !e.target.value.trim();
      });

      if (isIOS || isAndroid) {
        promptInput.addEventListener("focus", () => {
          document.body.classList.add("keyboard-open");
          setTimeout(() => {
            promptInput.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        });

        promptInput.addEventListener("blur", () => {
          document.body.classList.remove("keyboard-open");
          if (isIOS) window.scrollTo(0, 0);
        });
      }
    }

    this.applyNeuralSettings.addEventListener("click", async () => {
      const prompt = document.getElementById("promptInput").value.trim();
      if (prompt) {
        await this.startGeneration();
      }
    });

    // Результат
    this.downloadResult.addEventListener("click", () => {
      this.downloadGeneratedResult();
      this.hapticFeedback("medium");
    });

    this.startOver.addEventListener("click", () => {
      this.reset();
      this.hapticFeedback("light");
    });

    // Покупка звезд
    document.getElementById("buyStars").addEventListener("click", () => {
      this.showStarPackages();
      this.hapticFeedback("light");
    });

    document.querySelectorAll(".star-package").forEach((pack) => {
      pack.addEventListener("click", () => this.buyStars(pack));
    });
  }

  setupDragAndDrop() {
    this.uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.uploadZone.classList.add("dragging");
    });

    this.uploadZone.addEventListener("dragleave", () => {
      this.uploadZone.classList.remove("dragging");
    });

    this.uploadZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      this.uploadZone.classList.remove("dragging");

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        await this.processImageFile(files[0]);
      }
    });
  }

  async handleFileUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      await this.processImageFile(file);
    }
  }

  async processImageFile(file) {
    const reader = new FileReader();

    reader.onload = async (e) => {
      this.previewImage.src = e.target.result;
      this.uploadZone.querySelector(".upload-content").style.display = "none";
      this.uploadPreview.style.display = "block";

      // Показываем анимацию загрузки
      const loadingTransition = document.getElementById("loadingTransition1");
      loadingTransition.style.display = "block";

      // Загружаем на сервер
      const success = await this.uploadImage(file);

      loadingTransition.style.display = "none";

      if (success) {
        this.goToStep(2);
      } else {
        // Сбрасываем превью при ошибке
        this.uploadZone.querySelector(".upload-content").style.display =
          "block";
        this.uploadPreview.style.display = "none";
      }
    };

    reader.readAsDataURL(file);
  }

  async handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const videoPreview = document.getElementById("videoPreview");
    const uploadedVideo = document.getElementById("uploadedVideo");

    uploadedVideo.src = URL.createObjectURL(file);
    videoPreview.style.display = "block";

    // Загружаем на сервер
    const success = await this.uploadVideo(file);
    if (success) {
      setTimeout(() => this.startGeneration(), 1000);
    }
  }

  goToStep(stepNumber) {
    Object.values(this.steps).forEach((step) => {
      if (step) step.classList.remove("active");
    });

    switch (stepNumber) {
      case 1:
        this.steps.step1.classList.add("active");
        break;
      case 2:
        this.steps.step2.classList.add("active");
        break;
      case 3:
        if (this.selectedTool === "deepfake") {
          this.steps.step3Deepfake.classList.add("active");
        } else if (this.selectedTool === "neural-editor") {
          this.steps.step3Neural.classList.add("active");
        }
        break;
      case 4:
        this.steps.step4.classList.add("active");
        break;
      case 5:
        this.steps.step5.classList.add("active");
        this.initComparer();
        break;
    }

    this.currentStep = stepNumber;
    this.updateProgressIndicator(stepNumber);
    this.showSwipeHint();
  }

  updateProgressIndicator(step) {
    this.progressSteps.forEach((progressStep) => {
      const stepNum = parseInt(progressStep.getAttribute("data-step"));
      progressStep.classList.remove("active", "completed");

      if (stepNum === step) {
        progressStep.classList.add("active");
      } else if (stepNum < step) {
        progressStep.classList.add("completed");
      }
    });
  }

  selectTool(card) {
    document.querySelectorAll(".tool-card").forEach((c) => {
      c.classList.remove("selected");
    });

    card.classList.add("selected");
    this.selectedTool = card.getAttribute("data-tool");

    setTimeout(() => this.goToStep(3), 300);
  }

  selectPreset(card) {
    document.querySelectorAll(".preset-card").forEach((c) => {
      c.classList.remove("selected");
    });

    card.classList.add("selected");
    this.selectedPreset = card.getAttribute("data-preset");

    setTimeout(() => this.startGeneration(), 300);
  }

  selectIntensity(card) {
    document.querySelectorAll(".intensity-card").forEach((c) => {
      c.classList.remove("active");
    });

    card.classList.add("active");
    this.selectedIntensity = card.getAttribute("data-intensity");
  }

  applySuggestion(chip) {
    const prompt = chip.getAttribute("data-prompt");
    document.getElementById("promptInput").value = prompt;
    this.applyNeuralSettings.disabled = false;
  }

  showResult(originalUrl, processedUrl) {
    this.goToStep(5);

    document.getElementById("beforeImage").src = originalUrl;
    document.getElementById("afterImage").src = processedUrl;

    const toolName =
      this.selectedTool === "deepfake" ? "MetaMorph" : "Neural Editor";
    document.getElementById("usedTool").textContent = toolName;
    document.getElementById("processingTime").textContent =
      `${this.processingTime} сек`;
  }

  initComparer() {
    const wrapper = document.getElementById("comparerWrapper");
    const slider = document.getElementById("comparerSlider");
    const afterDiv = document.getElementById("comparerAfter");

    if (!wrapper || !slider || !afterDiv) return;

    let isDragging = false;

    const updateSliderPosition = (clientX) => {
      const rect = wrapper.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(100, ((clientX - rect.left) / rect.width) * 100),
      );

      slider.style.left = percentage + "%";
      afterDiv.style.width = percentage + "%";
    };

    // Mouse events
    slider.addEventListener("mousedown", (e) => {
      isDragging = true;
      e.preventDefault();
      this.hapticFeedback("light");
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        e.preventDefault();
        updateSliderPosition(e.clientX);
      }
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        this.hapticFeedback("light");
      }
    });

    // Touch events
    slider.addEventListener(
      "touchstart",
      (e) => {
        isDragging = true;
        e.preventDefault();
        this.hapticFeedback("light");
      },
      { passive: false },
    );

    document.addEventListener(
      "touchmove",
      (e) => {
        if (isDragging && e.touches[0]) {
          e.preventDefault();
          updateSliderPosition(e.touches[0].clientX);
        }
      },
      { passive: false },
    );

    document.addEventListener("touchend", () => {
      if (isDragging) {
        isDragging = false;
        this.hapticFeedback("light");
      }
    });
  }

  async downloadGeneratedResult() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}/generation/download/${this.generationId}`,
      );
      const blob = await response.blob();

      const link = document.createElement("a");
      link.download = `bio-neural-result-${Date.now()}.jpg`;
      link.href = URL.createObjectURL(blob);
      link.click();
    } catch (error) {
      console.error("Failed to download result:", error);
      this.showError("Ошибка скачивания результата");
    }
  }

  openProfile() {
    this.profileModal.classList.add("active");
    this.loadUserProfile();
  }

  closeProfileModal() {
    this.profileModal.classList.remove("active");
  }

  updateBalance(balance) {
    document.getElementById("starBalance").textContent = balance.stars;
    document.getElementById("freeGenerations").textContent =
      balance.freeGenerations;
  }

  showStarPackages() {
    document.querySelectorAll(".star-package").forEach((pack) => {
      pack.style.animation = "packagePulse 0.5s ease";
      setTimeout(() => (pack.style.animation = ""), 500);
    });
  }

  async buyStars(packageElement) {
    const stars = parseInt(packageElement.getAttribute("data-stars"));
    const itemId = packageElement.getAttribute("data-item-id");

    this.hapticFeedback("medium");

    if (isTelegramWebApp && tg.openInvoice) {
      tg.openInvoice(itemId, async (status) => {
        if (status === "paid" || status === "success") {
          await this.loadUserProfile();
          this.showSuccessAnimation();
          this.hapticFeedback("success");

          if (tg.showAlert) {
            tg.showAlert(`Успешно! +${stars} звезд добавлено на ваш баланс.`);
          }
        } else if (status === "failed") {
          this.hapticFeedback("error");
          if (tg.showAlert) {
            tg.showAlert("Ошибка при покупке. Попробуйте снова.");
          }
        }
      });
    } else {
      // Тестовый режим
      console.log(`Покупка ${stars} звезд`);
      this.showSuccessAnimation();
    }
  }

  showSuccessAnimation() {
    const balance = document.getElementById("starBalance");
    balance.classList.add("balance-updated");
    setTimeout(() => balance.classList.remove("balance-updated"), 1000);
  }

  showError(message) {
    if (isTelegramWebApp && tg.showAlert) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  }

  showInsufficientBalanceDialog() {
    if (isTelegramWebApp && tg.showPopup) {
      tg.showPopup(
        {
          title: "Недостаточно генераций",
          message:
            "У вас закончились бесплатные генерации. Купите звезды для продолжения.",
          buttons: [
            { id: "buy", type: "default", text: "Купить звезды" },
            { id: "cancel", type: "cancel" },
          ],
        },
        (buttonId) => {
          if (buttonId === "buy") {
            this.openProfile();
          }
        },
      );
    } else {
      if (confirm("Недостаточно генераций. Купить звезды?")) {
        this.openProfile();
      }
    }
  }

  async selectFaceToReplace(faces) {
    // Показываем диалог выбора лица для замены
    const buttons = faces.map((face, index) => ({
      id: `face_${index}`,
      type: "default",
      text: `Лицо ${index + 1}`,
    }));

    if (isTelegramWebApp && tg.showPopup) {
      tg.showPopup(
        {
          title: "Выберите лицо для замены",
          message: `Обнаружено ${faces.length} лиц. Какое заменить?`,
          buttons: buttons,
        },
        (buttonId) => {
          const faceIndex = parseInt(buttonId.split("_")[1]);
          this.selectedFaceIndex = faceIndex;
        },
      );
    }
  }

  setupGestures() {
    // Touch события для свайпов
    this.workspace.addEventListener(
      "touchstart",
      (e) => {
        if (this.currentStep === 5) return;
        this.touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );

    this.workspace.addEventListener(
      "touchend",
      (e) => {
        if (this.currentStep === 5) return;
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
      },
      { passive: true },
    );
  }

  handleSwipe() {
    const swipeDistance = this.touchStartX - this.touchEndX;

    if (swipeDistance < -this.minSwipeDistance && this.currentStep > 1) {
      this.handleBackNavigation();
    }
  }

  handleBackNavigation() {
    if (this.currentStep > 1) {
      if (this.currentStep === 3 && this.selectedTool) {
        this.goToStep(2);
      } else {
        this.goToStep(this.currentStep - 1);
      }
      this.hapticFeedback("light");
    }
  }

  showSwipeHint() {
    if (this.currentStep > 1 && this.currentStep < 4) {
      this.swipeHint.classList.add("visible");
      setTimeout(() => this.swipeHint.classList.remove("visible"), 2000);
    } else {
      this.swipeHint.classList.remove("visible");
    }
  }

  hapticFeedback(type) {
    if (isTelegramWebApp && tg.HapticFeedback) {
      switch (type) {
        case "light":
          tg.HapticFeedback.impactOccurred("light");
          break;
        case "medium":
          tg.HapticFeedback.impactOccurred("medium");
          break;
        case "success":
          tg.HapticFeedback.notificationOccurred("success");
          break;
        case "error":
          tg.HapticFeedback.notificationOccurred("error");
          break;
        default:
          tg.HapticFeedback.selectionChanged();
      }
    }
  }

  checkDevicePerformance() {
    let isLowEndDevice = false;

    if (isAndroid) {
      const match = userAgent.match(/Android\s([0-9.]*)/);
      if (match && parseFloat(match[1]) < 6) {
        isLowEndDevice = true;
      }
    }

    if (isIOS) {
      const match = userAgent.match(/OS\s([0-9_]*)/);
      if (match) {
        const version = match[1].split("_")[0];
        if (parseInt(version) < 10) {
          isLowEndDevice = true;
        }
      }
    }

    if (isLowEndDevice) {
      document.body.classList.add("low-performance");
    }
  }

  createParticles() {
    const container = document.querySelector(".organic-particles");
    if (!container) return;

    setInterval(() => {
      const particles = document.querySelectorAll(".particle");
      if (particles.length < 15) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.left = Math.random() * 100 + "%";
        particle.style.animationDuration = 5 + Math.random() * 5 + "s";
        particle.style.animationDelay = Math.random() * 2 + "s";
        container.appendChild(particle);

        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 10000);
      }
    }, 500);
  }

  reset() {
    this.currentStep = 1;
    this.selectedTool = null;
    this.uploadedImageFile = null;
    this.uploadedVideoFile = null;
    this.selectedPreset = null;
    this.selectedIntensity = "medium";
    this.generationId = null;

    // Сброс UI
    this.uploadZone.querySelector(".upload-content").style.display = "block";
    this.uploadPreview.style.display = "none";
    this.fileInput.value = "";

    const promptInput = document.getElementById("promptInput");
    if (promptInput) promptInput.value = "";

    document.querySelectorAll(".tool-card, .preset-card").forEach((card) => {
      card.classList.remove("selected");
    });

    document.querySelectorAll(".intensity-card").forEach((card) => {
      card.classList.remove("active");
    });

    document
      .querySelector('.intensity-card[data-intensity="medium"]')
      ?.classList.add("active");

    this.goToStep(1);
    this.hapticFeedback("light");
  }
}

// ========================================== //
// ИНИЦИАЛИЗАЦИЯ
// ========================================== //

document.addEventListener("DOMContentLoaded", () => {
  window.bioWorkflow = new BioNeuralWorkflow();
});
