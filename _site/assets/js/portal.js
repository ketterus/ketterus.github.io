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
      renderProjectDetail(AppContent, Payload, Token);
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

  const Response = await fetch(Url, {
    method: "GET"
  });

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

  const Response = await fetch(Url, {
    method: "GET"
  });

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

function renderProjectDetail(AppContent, Payload, Token) {
  const ClientName = Payload && Payload.client && Payload.client.clientName
    ? Payload.client.clientName
    : "";

  const Project = Payload && Payload.project ? Payload.project : {};
  const Collections = Payload && Payload.collections ? Payload.collections : {};

  const Documents = Array.isArray(Collections.documents) ? Collections.documents : [];
  const TimeEntries = Array.isArray(Collections.timeEntries) ? Collections.timeEntries : [];
  const CostItems = Array.isArray(Collections.expenseAllocations) ? Collections.expenseAllocations : [];
  const Payments = Array.isArray(Collections.payments) ? Collections.payments : [];
  const Refunds = Array.isArray(Collections.refunds) ? Collections.refunds : [];

  const BackHref = "/portal-v2/?t=" + encodeURIComponent(Token);

  const DocumentItems = Documents.length
    ? Documents.map(function (Item) {
        return (
          "<li>" +
            "<a href=\"" + escapeHtml(Item.fileUrl || "#") + "\">" + escapeHtml(Item.displayName || "") + "</a>" +
          "</li>"
        );
      }).join("")
    : "<li>No documents found.</li>";

  const TimeItems = TimeEntries.length
    ? TimeEntries.map(function (Item) {
        return (
          "<li>" +
            escapeHtml(Item.timeDate || "") + " - " +
            escapeHtml(Item.workerName || "") + " - " +
            escapeHtml(Item.description || "") + " - " +
            escapeHtml(String(Item.hoursWorked || "")) +
          "</li>"
        );
      }).join("")
    : "<li>No time entries found.</li>";

  const CostItemsHtml = CostItems.length
    ? CostItems.map(function (Item) {
        return (
          "<li>" +
            escapeHtml(Item.costDate || Item.createdDate || "") + " - " +
            escapeHtml(Item.costType || Item.entryType || "") + " - " +
            escapeHtml(Item.description || "") + " - " +
            escapeHtml(String(Item.allocatedAmount || Item.amount || "")) +
          "</li>"
        );
      }).join("")
    : "<li>No cost items found.</li>";

  const PaymentItems = Payments.length
    ? Payments.map(function (Item) {
        return (
          "<li>" +
            escapeHtml(Item.paymentDate || "") + " - " +
            escapeHtml(Item.paymentMethod || "") + " - " +
            escapeHtml(Item.paymentReference || "") + " - " +
            escapeHtml(String(Item.paymentAmount || "")) +
          "</li>"
        );
      }).join("")
    : "<li>No payments found.</li>";

  const RefundItems = Refunds.length
    ? Refunds.map(function (Item) {
        return (
          "<li>" +
            escapeHtml(Item.refundDate || "") + " - " +
            escapeHtml(Item.vendorName || "") + " - " +
            escapeHtml(Item.refundReason || "") + " - " +
            escapeHtml(String(Item.refundAmount || "")) +
          "</li>"
        );
      }).join("")
    : "<li>No refunds found.</li>";

  AppContent.innerHTML =
    "<p><a href=\"" + BackHref + "\">Back to Projects</a></p>" +
    "<h1>Project Center</h1>" +
    "<p>" + escapeHtml(ClientName) + "</p>" +
    "<h2>" + escapeHtml(Project.projectName || "") + "</h2>" +
    "<p>Status: " + escapeHtml(Project.status || "") + "</p>" +
    "<p>" + escapeHtml(Project.description || "") + "</p>" +

    "<h3>Documents</h3>" +
    "<ul>" + DocumentItems + "</ul>" +

    "<h3>Time Entries</h3>" +
    "<ul>" + TimeItems + "</ul>" +

    "<h3>Cost Items</h3>" +
    "<ul>" + CostItemsHtml + "</ul>" +

    "<h3>Payments</h3>" +
    "<ul>" + PaymentItems + "</ul>" +

    "<h3>Refunds</h3>" +
    "<ul>" + RefundItems + "</ul>";
}

function escapeHtml(Value) {
  return String(Value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}