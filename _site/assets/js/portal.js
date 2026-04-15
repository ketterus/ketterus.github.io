const API_URL = "https://script.google.com/macros/s/AKfycby12TuuhZaJjy6_xWtbKfH3R6joBD22RpeoANAU6EPBokz7IrIAq8v022EQAVdclu-D3w/exec";

document.addEventListener("DOMContentLoaded", initPortal);

async function initPortal() {
  const AppContent = document.getElementById("AppContent");
  if (!AppContent) return;

  const Params = new URLSearchParams(window.location.search);
  const Token = String(Params.get("t") || "").trim();
  const ProjectID = String(Params.get("p") || "").trim();

  if (!Token) {
    AppContent.innerHTML =
      "<h1>Project Center</h1>" +
      "<p>No token provided.</p>";
    return;
  }

  AppContent.innerHTML =
    "<h1>Project Center</h1>" +
    "<p>Loading...</p>";

  try {
    if (ProjectID) {
      const Payload = await fetchProjectDetail(Token, ProjectID);
      AppContent.innerHTML =
        "<p><a href=\"/portal-v2/?t=" + encodeURIComponent(Token) + "\">Back to Projects</a></p>" +
        "<h1>Project Center</h1>" +
        "<pre>" + escapeHtml(JSON.stringify(Payload, null, 2)) + "</pre>";
      return;
    }

    const Payload = await fetchProjectList(Token);
    renderProjectList(AppContent, Payload, Token);
  } catch (error) {
    AppContent.innerHTML =
      "<h1>Project Center</h1>" +
      "<p>Request failed.</p>" +
      "<pre>" + escapeHtml(String(error)) + "</pre>";
  }
}

async function fetchProjectList(Token) {
  const Url = API_URL + "?t=" + encodeURIComponent(Token);
  const Response = await fetch(Url, { method: "GET" });

  if (!Response.ok) {
    throw new Error("HTTP " + Response.status);
  }

  return Response.json();
}

async function fetchProjectDetail(Token, ProjectID) {
  const Url =
    API_URL +
    "?t=" + encodeURIComponent(Token) +
    "&p=" + encodeURIComponent(ProjectID);

  const Response = await fetch(Url, { method: "GET" });

  if (!Response.ok) {
    throw new Error("HTTP " + Response.status);
  }

  return Response.json();
}

function renderProjectList(AppContent, Payload, Token) {
  const ClientName = Payload && Payload.client && Payload.client.clientName
    ? Payload.client.clientName
    : "";

  const Projects = Payload && Payload.data && Array.isArray(Payload.data.projects)
    ? Payload.data.projects
    : [];

  const ProjectItems = Projects.length
    ? Projects.map(function (Project) {
        const ProjectID = String(Project.projectId || "").trim();
        const Href =
          "/portal-v2/?t=" + encodeURIComponent(Token) +
          "&p=" + encodeURIComponent(ProjectID);

        return (
          "<li>" +
            "<a href=\"" + Href + "\"><strong>" + escapeHtml(Project.projectName || "") + "</strong></a><br>" +
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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}