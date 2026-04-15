document.addEventListener("DOMContentLoaded", initPortal);

function initPortal() {
  const AppContent = document.getElementById("AppContent");
  if (!AppContent) return;

  const Params = new URLSearchParams(window.location.search);
  const Token = String(Params.get("t") || "").trim();

  AppContent.innerHTML =
    "<h1>Project Center</h1>" +
    "<p>Portal JS Loaded</p>" +
    "<p>Token Present: " + (Token ? "Yes" : "No") + "</p>" +
    "<p>Token Value: " + escapeHtml(Token || "(none)") + "</p>";
}

function escapeHtml(Value) {
  return String(Value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}