/**
 * Scrolly driver — sync left graphic with right narrative steps.
 */
(function () {
  const steps = document.querySelectorAll(".step");
  const panels = document.querySelectorAll(".chart-panel");
  if (!steps.length) return;

  let activeChart = "global";

  function activate(step) {
    const chartId = step.dataset.chart;
    const stepNum = parseInt(step.dataset.step, 10);
    activeChart = chartId;

    steps.forEach(s => s.classList.toggle("is-active", s === step));
    panels.forEach(p => p.classList.toggle("is-active", p.dataset.chart === chartId));

    if (window.ChartController) {
      window.ChartController.onStepChange(chartId, stepNum);
    }
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          activate(entry.target);
        }
      });
    },
    { root: null, rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.25, 0.5] }
  );

  steps.forEach(step => observer.observe(step));

  // Initial state
  activate(steps[0]);
})();
