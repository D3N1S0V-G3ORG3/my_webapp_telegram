let currentStage = 1;
let selectedTool = null;
let transitionTimeout = null;

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
  const tg = window.Telegram.WebApp;

  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  document.getElementById("deepfakeTransition").style.display = "none";
  document.getElementById("neuralTransition").style.display = "none";

  document.getElementById(`stage${currentStage}`).classList.remove("active");

  currentStage = stage;
  document.getElementById(`stage${currentStage}`).classList.add("active");

  updateProgressBar();

  if (stage > 1) {
    tg.BackButton.show();
  } else {
    tg.BackButton.hide();
  }

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

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");

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

document.getElementById("fileInput").addEventListener("change", function (e) {
  if (e.target.files.length > 0) {
    goToStage(2);
  }
});

function selectTool(tool) {
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
  selectedTool = tool;
  goToStage(3);

  if (tool === "deepfake") {
    document.getElementById("deepfakeSettings").style.display = "block";
    document.getElementById("neuralSettings").style.display = "none";
  } else {
    document.getElementById("deepfakeSettings").style.display = "none";
    document.getElementById("neuralSettings").style.display = "block";
  }
}

function handleDeepfakeOption(option) {
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
  document.getElementById("deepfakeTransition").style.display = "block";

  const buttons = document.querySelectorAll(".setting-button");
  buttons.forEach((btn) => (btn.disabled = true));

  transitionTimeout = setTimeout(() => {
    goToStage(4);
  }, 2000);

  if (option === "upload") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {};
    input.click();
  }
}

function addPrompt(text) {
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
  const input = document.getElementById("promptInput");
  input.value = text;
  input.focus();

  document.getElementById("neuralTransition").style.display = "block";

  transitionTimeout = setTimeout(() => {
    goToStage(4);
  }, 2000);
}

document.getElementById("promptInput")?.addEventListener("input", function () {
  if (this.value.length > 10) {
    document.getElementById("neuralTransition").style.display = "block";

    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
    }

    transitionTimeout = setTimeout(() => {
      goToStage(4);
    }, 3000);
  } else {
    document.getElementById("neuralTransition").style.display = "none";
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
      transitionTimeout = null;
    }
  }
});

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

function downloadResult() {
  console.log("Скачивание результата");
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
}

function shareResult() {
  const tg = window.Telegram.WebApp;
  tg.HapticFeedback.impactOccurred("light");
  tg.openTelegramLink(
    "https://t.me/share/url?url=" +
      encodeURIComponent("https://your-backend-url.com/path-to-your-image.jpg"),
  );
}

function createDigitalRain() {
  const particles = document.querySelector(".digital-particles");
  if (!particles) return;
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
    const size = 12 + Math.random() * 8;
    digit.style.fontSize = `${size}px`;
    digit.style.opacity = 0.3 + Math.random() * 0.5;
    digit.style.animationDuration = `${10 + Math.random() * 5}s`;
    particles.appendChild(digit);

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

window.goToStage = goToStage;
window.selectTool = selectTool;
window.handleDeepfakeOption = handleDeepfakeOption;
window.addPrompt = addPrompt;
window.downloadResult = downloadResult;
window.shareResult = shareResult;
