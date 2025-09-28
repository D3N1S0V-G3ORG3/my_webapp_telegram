document.addEventListener("DOMContentLoaded", function () {
  createDigitalRain();
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
