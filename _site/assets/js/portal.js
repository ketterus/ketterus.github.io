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
    "<p>Loading projects...</p>";

  try {
    const Payload = await validateToken(Token);
    renderProjectList(AppContent, Payload);
  } catch (error) {
    AppContent.innerHTML =
      "<h1>Project Center</h1>" +
      "<p>Request failed.</p>" +
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

function renderProjectList(AppContent, Payload) {
  const ClientName = Payload && Payload.client && Payload.client.clientName
    ? Payload.client.clientName
    : "";

  const Projects = Payload && Payload.data && Array.isArray(Payload.data.projects)
    ? Payload.data.projects
    : [];

  const ProjectItems = Projects.length
    ? Projects.map(function (Project) {
        return (
          "<li>" +
            "<strong>" + escapeHtml(Project.projectName || "") + "</strong><br>" +
            "Status: " + escapeHtml(Project.status || "") + "<br>" +
            "Last Activity: " + escapeHtml(Project.lastActivityOn || "") +
          "</li>"
        );
      }).join("")
    : "<li>No projects found.</li>";

  AppContent.innerHTML =
    "<h1>Project Center</h1>" +
    "<p>" + escapeHtml(ClientName) + "</p>" +
    "<ul>" + ProjectItems + "</ul>";
}

function escapeHtml(Value) {
  return String(Value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}