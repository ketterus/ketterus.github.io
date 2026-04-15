document.addEventListener("DOMContentLoaded", initPortal);

function initPortal() {
  const AppContent = document.getElementById("AppContent");
  if (!AppContent) return;

  AppContent.innerHTML = `
    <h1>Project Center</h1>
    <p>Portal JS Loaded</p>
  `;
}