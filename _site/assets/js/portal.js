document.addEventListener("DOMContentLoaded", initPortal);

async function initPortal() {
  const appContent = document.getElementById("AppContent");
  if (!appContent) return;

  try {
    const viewTemplate = await loadTemplate("/portal/v2/partials/ViewProjectList/");
    appContent.innerHTML = viewTemplate;

    const itemTemplate = await loadTemplate("/portal/v2/partials/ItemProjectRow/");

    const sampleProjects = [
      {
        ProjectName: "Sample Project One",
        Status: "Active",
        LastActivityOn: "2026-04-15 08:00",
        ProjectUrl: "/portal/v2/?p=sample-project-one"
      },
      {
        ProjectName: "Sample Project Two",
        Status: "Paid",
        LastActivityOn: "2026-04-14 17:30",
        ProjectUrl: "/portal/v2/?p=sample-project-two"
      }
    ];

    const projectListItems = document.getElementById("ProjectListItems");
    if (!projectListItems) {
      throw new Error("ProjectListItems target not found.");
    }

    projectListItems.innerHTML = sampleProjects
      .map(function(project) {
        return renderTemplate(itemTemplate, project);
      })
      .join("");
  } catch (error) {
    appContent.innerHTML =
      "<h1>Portal V2</h1>" +
      "<p>Sample list load failed.</p>" +
      "<pre>" + escapeHtml(String(error && error.message ? error.message : error)) + "</pre>";
  }
}

async function loadTemplate(path) {
  const response = await fetch(path, { method: "GET", cache: "no-cache" });

  if (!response.ok) {
    throw new Error("Template load failed: " + path + " (" + response.status + ")");
  }

  return response.text();
}

function renderTemplate(template, data) {
  return String(template || "").replace(/\[\[\s*([A-Za-z0-9_]+)\s*\]\]/g, function(_, key) {
    return Object.prototype.hasOwnProperty.call(data, key) ? String(data[key] ?? "") : "";
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}