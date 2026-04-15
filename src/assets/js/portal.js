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
  const Response = await fetch(Url, { method: "GET" });

  if (!Response.ok) {
    throw new Error("HTTP " + Response.status);
  }

  return Response.json();
}

async function fetchProjectDetail(Token, ProjectID) {
  const Url =
    API_URL +
    "?mode=project_detail_min" +
    "&t=" + encodeURIComponent(Token) +
    "&p=" + encodeURIComponent(ProjectID);

  const Response = await fetch(Url, { method: "GET" });

  if (!Response.ok) {
    throw new Error("HTTP " + Response.status);
  }

  return Response.json();
}

function renderProjectList(AppContent, Payload, Token) {
  const Success = Payload && Payload.success === true;
  const Client = Payload && Payload.client ? Payload.client : {};
  const Data = Payload && Payload.data ? Payload.data : {};
  const Projects = Array.isArray(Data.projects) ? Data.projects : [];

  if (!Success) {
    AppContent.innerHTML =
      "<h1>Project Center</h1>" +
      "<p>" + escapeHtml(Payload && Payload.message ? Payload.message : "Unable to load projects.") + "</p>";
    return;
  }

  const ProjectItems = Projects.length
    ? Projects.map(function(Project) {
        const Href =
          "/portal-v2/?t=" + encodeURIComponent(Token) +
          "&p=" + encodeURIComponent(String(Project.projectId || "").trim());

        return (
          "<li>" +
            "<a href=\"" + Href + "\">" + escapeHtml(Project.projectName || "") + "</a><br>" +
            "<span>Status: " + escapeHtml(Project.status || "") + "</span><br>" +
            "<span>LastActivityOn: " + escapeHtml(Project.lastActivityOn || "") + "</span>" +
          "</li>"
        );
      }).join("")
    : "<li>No projects found.</li>";

  AppContent.innerHTML =
    "<h1>Project Center</h1>" +
    "<p>" + escapeHtml(Client.clientName || "") + "</p>" +
    "<ul>" + ProjectItems + "</ul>";
}

function renderProjectDetail(AppContent, Payload, Token) {
  const Success = Payload && Payload.success === true;
  const Client = Payload && Payload.Client ? Payload.Client : {};
  const Project = Payload && Payload.Project ? Payload.Project : {};
  const Collections = Payload && Payload.Collections ? Payload.Collections : {};

  const Documents = Array.isArray(Collections.Documents) ? Collections.Documents : [];
  const TimeEntries = Array.isArray(Collections.TimeEntries) ? Collections.TimeEntries : [];
  const CostItems = Array.isArray(Collections.CostItems) ? Collections.CostItems : [];
  const Payments = Array.isArray(Collections.Payments) ? Collections.Payments : [];
  const Refunds = Array.isArray(Collections.Refunds) ? Collections.Refunds : [];

  if (!Success) {
    AppContent.innerHTML =
      "<h1>Project Center</h1>" +
      "<p>" + escapeHtml(Payload && Payload.message ? Payload.message : "Unable to load project.") + "</p>";
    return;
  }

  const BackHref = "/portal-v2/?t=" + encodeURIComponent(Token);

  const DocumentItems = Documents.length
    ? Documents.map(function(Item) {
        return (
          "<li>" +
            "DocumentID: " + escapeHtml(Item.DocumentID || "") + "<br>" +
            "DisplayName: <a href=\"" + escapeHtml(Item.FileURL || "#") + "\">" + escapeHtml(Item.DisplayName || "") + "</a><br>" +
            "FileURL: " + escapeHtml(Item.FileURL || "") + "<br>" +
            "CreatedDateTime: " + escapeHtml(Item.CreatedDateTime || "") +
          "</li>"
        );
      }).join("")
    : "<li>No documents found.</li>";

  const TimeItems = TimeEntries.length
    ? TimeEntries.map(function(Item) {
        return (
          "<li>" +
            "TimeID: " + escapeHtml(Item.TimeID || "") + "<br>" +
            "TimeDate: " + escapeHtml(Item.TimeDate || "") + "<br>" +
            "ProjectID: " + escapeHtml(Item.ProjectID || "") + "<br>" +
            "WorkerName: " + escapeHtml(Item.WorkerName || "") + "<br>" +
            "HoursWorked: " + escapeHtml(String(Item.HoursWorked || "")) + "<br>" +
            "Description: " + escapeHtml(Item.Description || "") + "<br>" +
            "Billable: " + escapeHtml(String(Item.Billable || "")) + "<br>" +
            "HourlyRate: " + escapeHtml(String(Item.HourlyRate || "")) + "<br>" +
            "CreatedDate: " + escapeHtml(Item.CreatedDate || "") + "<br>" +
            "CreatedBy: " + escapeHtml(Item.CreatedBy || "") +
          "</li>"
        );
      }).join("")
    : "<li>No time entries found.</li>";

  const CostItemsHtml = CostItems.length
    ? CostItems.map(function(Item) {
        return (
          "<li>" +
            "EntryType: " + escapeHtml(Item.EntryType || "") + "<br>" +
            "CostType: " + escapeHtml(Item.CostType || "") + "<br>" +
            "ExpenseAllocationID: " + escapeHtml(Item.ExpenseAllocationID || "") + "<br>" +
            "ExpenseID: " + escapeHtml(Item.ExpenseID || "") + "<br>" +
            "ProjectID: " + escapeHtml(Item.ProjectID || "") + "<br>" +
            "AllocatedAmount: " + escapeHtml(String(Item.AllocatedAmount || "")) + "<br>" +
            "Description: " + escapeHtml(Item.Description || "") + "<br>" +
            "Notes: " + escapeHtml(Item.Notes || "") + "<br>" +
            "CreatedDate: " + escapeHtml(Item.CreatedDate || "") + "<br>" +
            "CreatedBy: " + escapeHtml(Item.CreatedBy || "") + "<br>" +
            "CostDate: " + escapeHtml(Item.CostDate || "") + "<br>" +
            "ProjectProductID: " + escapeHtml(Item.ProjectProductID || "") + "<br>" +
            "ProductDate: " + escapeHtml(Item.ProductDate || "") + "<br>" +
            "Amount: " + escapeHtml(String(Item.Amount || "")) +
          "</li>"
        );
      }).join("")
    : "<li>No cost items found.</li>";

  const PaymentItems = Payments.length
    ? Payments.map(function(Item) {
        return (
          "<li>" +
            "PaymentID: " + escapeHtml(Item.PaymentID || "") + "<br>" +
            "PaymentDate: " + escapeHtml(Item.PaymentDate || "") + "<br>" +
            "ProjectID: " + escapeHtml(Item.ProjectID || "") + "<br>" +
            "PaymentAmount: " + escapeHtml(String(Item.PaymentAmount || "")) + "<br>" +
            "PaymentMethod: " + escapeHtml(Item.PaymentMethod || "") + "<br>" +
            "PaymentReference: " + escapeHtml(Item.PaymentReference || "") + "<br>" +
            "Notes: " + escapeHtml(Item.Notes || "") + "<br>" +
            "CreatedDateTime: " + escapeHtml(Item.CreatedDateTime || "") + "<br>" +
            "CreatedBy: " + escapeHtml(Item.CreatedBy || "") +
          "</li>"
        );
      }).join("")
    : "<li>No payments found.</li>";

  const RefundItems = Refunds.length
    ? Refunds.map(function(Item) {
        return (
          "<li>" +
            "RefundID: " + escapeHtml(Item.RefundID || "") + "<br>" +
            "RefundDate: " + escapeHtml(Item.RefundDate || "") + "<br>" +
            "ProjectID: " + escapeHtml(Item.ProjectID || "") + "<br>" +
            "PaymentAccountID: " + escapeHtml(Item.PaymentAccountID || "") + "<br>" +
            "VendorID: " + escapeHtml(Item.VendorID || "") + "<br>" +
            "VendorName: " + escapeHtml(Item.VendorName || "") + "<br>" +
            "RefundAmount: " + escapeHtml(String(Item.RefundAmount || "")) + "<br>" +
            "RefundReason: " + escapeHtml(Item.RefundReason || "") + "<br>" +
            "Notes: " + escapeHtml(Item.Notes || "") + "<br>" +
            "CreatedDate: " + escapeHtml(Item.CreatedDate || "") + "<br>" +
            "CreatedBy: " + escapeHtml(Item.CreatedBy || "") +
          "</li>"
        );
      }).join("")
    : "<li>No refunds found.</li>";

  AppContent.innerHTML =
    "<p><a href=\"" + BackHref + "\">Back to Projects</a></p>" +
    "<h1>Project Center</h1>" +

    "<h2>Client</h2>" +
    "<ul>" +
      "<li>ClientID: " + escapeHtml(Client.ClientID || "") + "</li>" +
      "<li>ClientName: " + escapeHtml(Client.ClientName || "") + "</li>" +
      "<li>ContactName: " + escapeHtml(Client.ContactName || "") + "</li>" +
    "</ul>" +

    "<h2>Project</h2>" +
    "<ul>" +
      "<li>ProjectID: " + escapeHtml(Project.ProjectID || "") + "</li>" +
      "<li>ProjectName: " + escapeHtml(Project.ProjectName || "") + "</li>" +
      "<li>Status: " + escapeHtml(Project.Status || "") + "</li>" +
      "<li>Description: " + escapeHtml(Project.Description || "") + "</li>" +
      "<li>Street1: " + escapeHtml(Project.Street1 || "") + "</li>" +
      "<li>Street2: " + escapeHtml(Project.Street2 || "") + "</li>" +
      "<li>City: " + escapeHtml(Project.City || "") + "</li>" +
      "<li>State: " + escapeHtml(Project.State || "") + "</li>" +
      "<li>Zip: " + escapeHtml(String(Project.Zip || "")) + "</li>" +
      "<li>LastActivityOn: " + escapeHtml(Project.LastActivityOn || "") + "</li>" +
    "</ul>" +

    "<h2>Documents</h2>" +
    "<ul>" + DocumentItems + "</ul>" +

    "<h2>TimeEntries</h2>" +
    "<ul>" + TimeItems + "</ul>" +

    "<h2>CostItems</h2>" +
    "<ul>" + CostItemsHtml + "</ul>" +

    "<h2>Payments</h2>" +
    "<ul>" + PaymentItems + "</ul>" +

    "<h2>Refunds</h2>" +
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