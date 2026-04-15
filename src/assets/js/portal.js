const API_URL = "https://script.google.com/macros/s/AKfycby12TuuhZaJjy6_xWtbKfH3R6joBD22RpeoANAU6EPBokz7IrIAq8v022EQAVdclu-D3w/exec";

document.addEventListener("DOMContentLoaded", initPortal);

async function initPortal() {
  const AppContent = document.getElementById("AppContent");
  if (!AppContent) return;

  const Params = new URLSearchParams(window.location.search);
  const Token = String(Params.get("t") || "").trim();

  if (!Token) {
    AppContent.innerHTML =
      "<h1>Project Center</h1>" +
      "<p>No token provided.</p>";
    return;
  }

  AppContent.innerHTML =
    "<h1>Project Center</h1>" +
    "<p>Validating token...</p>";

  try {
    const Payload = await validateToken(Token);

    AppContent.innerHTML =
      "<h1>Project Center</h1>" +
      "<p>ValidateToken request completed.</p>" +
      "<pre>" + escapeHtml(JSON.stringify(Payload, null, 2)) + "</pre>";
  } catch (error) {
    AppContent.innerHTML =
      "<h1>Project Center</h1>" +
      "<p>ValidateToken failed.</p>" +
      "<pre>" + escapeHtml(String(error)) + "</pre>";
  }
}

async function validateToken(Token) {
  const Url = API_URL + "?t=" + encodeURIComponent(Token);

  const Response = await fetch(Url, {
    method: "GET"
  });

  if (!Response.ok) {
    throw new Error("HTTP " + Response.status);
  }

  return Response.json();
}

function escapeHtml(Value) {
  return String(Value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}