const API_URL = "https://script.google.com/macros/s/AKfycbz58ThqBCcjZ5hLAbJrkRL6OQj4rKJPGMm5wrmui1JkdmwGEPrBKSAqTFpBP_685Zij/exec";

document.addEventListener("DOMContentLoaded", initPortal);

async function initPortal() {
  const AppContent = document.getElementById("AppContent");
  if (!AppContent) return;

  const PageParams = new URLSearchParams(window.location.search);
  const Token = String(PageParams.get("t") || "").trim();
  const ProjectID = String(PageParams.get("p") || "").trim();

  if (!Token) {
    AppContent.innerHTML =
      "<h1>Portal V2 Test</h1>" +
      "<p>No token provided in URL.</p>";
    return;
  }

  AppContent.innerHTML =
    "<h1>Portal V2 Test</h1>" +
    "<p>Token found.</p>" +
    "<p>Loading JSON response...</p>";

  try {
    const Payload = ProjectID
      ? await fetchPortalDetail(Token, ProjectID)
      : await fetchPortalList(Token);

    AppContent.innerHTML =
      "<h1>Portal V2 Test</h1>" +
      "<p>Token found.</p>" +
      "<p>JSON response received.</p>" +
      "<pre>" + escapeHtml(JSON.stringify(Payload, null, 2)) + "</pre>";
  } catch (error) {
    AppContent.innerHTML =
      "<h1>Portal V2 Test</h1>" +
      "<p>Token found.</p>" +
      "<p>Request failed.</p>" +
      "<pre>" + escapeHtml(String(error && error.message ? error.message : error)) + "</pre>";
  }
}

async function fetchPortalList(Token) {
  const RequestUrl =
    API_URL +
    "?mode=list" +
    "&t=" + encodeURIComponent(Token);

  const Response = await fetch(RequestUrl, { method: "GET" });

  if (!Response.ok) {
    throw new Error("HTTP " + Response.status);
  }

  return Response.json();
}

async function fetchPortalDetail(Token, ProjectID) {
  const RequestUrl =
    API_URL +
    "?mode=detail" +
    "&t=" + encodeURIComponent(Token) +
    "&p=" + encodeURIComponent(ProjectID);

  const Response = await fetch(RequestUrl, { method: "GET" });

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