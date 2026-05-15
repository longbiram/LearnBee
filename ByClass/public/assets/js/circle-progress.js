/*---------------------------------------------------------------------
  Circle Progress Animation
-----------------------------------------------------------------------*/
  document.addEventListener("DOMContentLoaded", function () {
    const circle = document.getElementById("circle-progress-24");
    const min = parseInt(circle.getAttribute("data-min-value")) || 0;
    const max = parseInt(circle.getAttribute("data-max-value")) || 100;
    const value = parseInt(circle.getAttribute("data-value")) || 0;
    const textSpan = circle.querySelector(".progress-text");

    const percentage = ((value - min) / (max - min)) * 100;

    // Animate progress
    let current = 0;
    const duration = 1000; // in ms
    const intervalTime = 10;
    const steps = duration / intervalTime;
    const increment = percentage / steps;

    const interval = setInterval(() => {
      current += increment;
      if (current >= percentage) {
        current = percentage;
        clearInterval(interval);
      }

      // Update visual progress
      circle.style.background = `conic-gradient(#28a745 0% ${current}%, #ddd ${current}% 100%)`;

      // Update text
      textSpan.textContent = Math.round(current) + '%';
    }, intervalTime);
  });