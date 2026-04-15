const API_URL = "https://script.google.com/macros/s/AKfycbz58ThqBCcjZ5hLAbJrkRL6OQj4rKJPGMm5wrmui1JkdmwGEPrBKSAqTFpBP_685Zij/exec";

document.addEventListener("DOMContentLoaded", initPortal);

async function initPortal() {
  const appContent = document.getElementById("AppContent");
  if (!appContent) return;

  const params = new URLSearchParams(window.location.search);
  const token = String(params.get("t") || "").trim();
  const projectId = String(params.get("p") || "").trim();

  if (!token) {
    window.location.href = "/portal/v2/sign-in/";
    return;
  }

  try {
    if (projectId) {
      await renderLiveDetail(appContent, token, projectId);
      return;
    }

    await renderLiveList(appContent, token);
  } catch (error) {
    appContent.innerHTML =
      "<div class=\"portal-v2-shell portal-v2-page\">" +
        "<div class=\"portal-v2-content portal-v2-stack\">" +
          "<section class=\"portal-v2-card\">" +
            "<div class=\"portal-v2-card-header\">" +
              "<h1 class=\"portal-v2-card-title\">Project Center</h1>" +
            "</div>" +
            "<div class=\"portal-v2-card-body\">" +
              "<p class=\"portal-v2-empty\">Load failed.</p>" +
              "<pre>" + escapeHtml(String(error && error.message ? error.message : error)) + "</pre>" +
            "</div>" +
          "</section>" +
        "</div>" +
      "</div>";
  }
}

async function renderLiveList(appContent, token) {
  const payload = await fetchPortalList(token);

  if (!payload || payload.success !== true) {
    handleAccessFailure(payload);
    return;
  }

  const viewTemplate = await loadTemplate("/portal/v2/partials/ViewProjectList/");
  const itemTemplate = await loadTemplate("/portal/v2/partials/ItemProjectRow/");

  appContent.innerHTML = viewTemplate;
  injectLogoutButton(token);

  const projectListItems = document.getElementById("ProjectListItems");
  if (!projectListItems) {
    throw new Error("ProjectListItems target not found.");
  }

  const projects = Array.isArray(payload.Projects) ? payload.Projects : [];

  if (!projects.length) {
    projectListItems.innerHTML = "<li><p class=\"portal-v2-empty\">No projects found.</p></li>";
    return;
  }

  projectListItems.innerHTML = projects
    .map(function(project) {
      return renderTemplate(itemTemplate, {
        ProjectUrl:
          "/portal/v2/?t=" + encodeURIComponent(token) +
          "&p=" + encodeURIComponent(String(project.ProjectID || "").trim()),
        ProjectName: project.ProjectName || "",
        Status: project.Status || "",
        LastActivityOn: project.LastActivityOn || ""
      });
    })
    .join("");
}

async function renderLiveDetail(appContent, token, projectId) {
  const payload = await fetchPortalDetail(token, projectId);

  if (!payload || payload.success !== true) {
    handleAccessFailure(payload);
    return;
  }

  const viewTemplate = await loadTemplate("/portal/v2/partials/ViewProjectDetail/");
  const clientTemplate = await loadTemplate("/portal/v2/partials/ItemClientBlock/");
  const projectTemplate = await loadTemplate("/portal/v2/partials/ItemProjectBlock/");
  const projectSummaryTemplate = await loadTemplate("/portal/v2/partials/ItemProjectSummaryBlock/");
  const documentTemplate = await loadTemplate("/portal/v2/partials/ItemDocumentRow/");
  const timeEntryTemplate = await loadTemplate("/portal/v2/partials/ItemTimeEntryRow/");
  const expenseAllocationTemplate = await loadTemplate("/portal/v2/partials/ItemExpenseAllocationRow/");
  const projectProductTemplate = await loadTemplate("/portal/v2/partials/ItemProjectProductRow/");
  const paymentTemplate = await loadTemplate("/portal/v2/partials/ItemPaymentRow/");
  const refundTemplate = await loadTemplate("/portal/v2/partials/ItemRefundRow/");
  const serviceRequestTemplate = await loadTemplate("/portal/v2/partials/ItemServiceRequestRow/");

  appContent.innerHTML = viewTemplate;
  injectLogoutButton(token);

  const client = payload.Client || {};
  const project = payload.Project || {};
  const collections = payload.Collections || {};

  const clientBlock = document.getElementById("ClientBlock");
  const projectBlock = document.getElementById("ProjectBlock");
  const projectSummaryBlock = document.getElementById("ProjectSummaryBlock");

  if (!clientBlock) throw new Error("ClientBlock target not found.");
  if (!projectBlock) throw new Error("ProjectBlock target not found.");
  if (!projectSummaryBlock) throw new Error("ProjectSummaryBlock target not found.");

  clientBlock.innerHTML = renderTemplate(clientTemplate, {
    ClientName: client.ClientName || "",
    ContactName: client.ContactName || "",
    Email: client.Email || "",
    Phone: client.Phone || ""
  });

  projectBlock.innerHTML = renderTemplate(projectTemplate, {
    ProjectName: project.ProjectName || "",
    Status: project.Status || "",
    ComputedAddress: project._ComputedAddress || "",
    Description: project.Description || ""
  });

  projectSummaryBlock.innerHTML = renderTemplate(projectSummaryTemplate, {
    LaborAmount: project.LaborAmount || "",
    BillableExpenses: project.BillableExpenses || "",
    TotalExpenses: project.TotalExpenses || "",
    PaymentsTotal: project.PaymentsTotal || "",
    RefundsTotal: project.RefundsTotal || "",
    TotalDue: project.TotalDue || "",
    BalanceDue: project.BalanceDue || "",
    ProjectTotal: project.ProjectTotal || "",
    ExpenseAllocationsTotal: project.ExpenseAllocationsTotal || "",
    ProjectProductsTotal: project.ProjectProductsTotal || ""
  });

  renderListInto(
    "DocumentItems",
    documentTemplate,
    Array.isArray(collections.Documents) ? collections.Documents : [],
    function(item) {
      return {
        DisplayName: item.DisplayName || "",
        FileURL: item.FileURL || "",
        CreatedDateTime: item.CreatedDateTime || ""
      };
    }
  );

  renderListInto(
    "TimeEntryItems",
    timeEntryTemplate,
    Array.isArray(collections.TimeEntries) ? collections.TimeEntries : [],
    function(item) {
      return {
        WorkerName: item.WorkerName || "",
        TimeDate: item.TimeDate || "",
        HoursWorked: item.HoursWorked || "",
        Description: item.Description || ""
      };
    }
  );

  renderListInto(
    "ExpenseAllocationItems",
    expenseAllocationTemplate,
    Array.isArray(collections.ExpenseAllocations) ? collections.ExpenseAllocations : [],
    function(item) {
      return {
        Description: item.Description || "",
        AllocatedAmount: item.AllocatedAmount || "",
        CreatedDate: item.CreatedDate || ""
      };
    }
  );

  renderListInto(
    "ProjectProductItems",
    projectProductTemplate,
    Array.isArray(collections.ProjectProducts) ? collections.ProjectProducts : [],
    function(item) {
      return {
        Description: item.Description || "",
        Amount: item.Amount || "",
        ProductDate: item.ProductDate || ""
      };
    }
  );

  renderListInto(
    "PaymentItems",
    paymentTemplate,
    Array.isArray(collections.Payments) ? collections.Payments : [],
    function(item) {
      return {
        PaymentAmount: item.PaymentAmount || "",
        PaymentDate: item.PaymentDate || "",
        PaymentMethod: item.PaymentMethod || "",
        PaymentReference: item.PaymentReference || ""
      };
    }
  );

  renderListInto(
    "RefundItems",
    refundTemplate,
    Array.isArray(collections.Refunds) ? collections.Refunds : [],
    function(item) {
      return {
        RefundAmount: item.RefundAmount || "",
        RefundDate: item.RefundDate || "",
        RefundReason: item.RefundReason || ""
      };
    }
  );

  renderListInto(
    "ServiceRequestItems",
    serviceRequestTemplate,
    Array.isArray(collections.ServiceRequests) ? collections.ServiceRequests : [],
    function(item) {
      return {
        ServiceType: item.ServiceType || "",
        Status: item.Status || "",
        IssueDescription: item.IssueDescription || ""
      };
    }
  );
}

function injectLogoutButton(token) {
  const target = document.getElementById("PortalUtilityActions");
  if (!target) return;
  if (document.getElementById("PortalLogoutButton")) return;

  const button = document.createElement("button");
  button.id = "PortalLogoutButton";
  button.type = "button";
  button.className = "btn btn-outline-brand";
  button.textContent = "Sign Out";
  button.addEventListener("click", function() {
    logoutPortal(token);
  });

  target.appendChild(button);
}

async function logoutPortal(token) {
  try {
    const requestUrl =
      API_URL +
      "?mode=logout" +
      "&t=" + encodeURIComponent(token);

    const response = await fetch(requestUrl, { method: "GET" });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    await response.json();
  } catch (error) {
    // swallow logout failure and continue to sign-in
  }

  window.location.href = "/portal/v2/sign-in/";
}

function handleAccessFailure(payload) {
  const code = String((payload && payload.code) || "").trim();

  if (
    code === "MISSING_TOKEN" ||
    code === "INVALID_TOKEN" ||
    code === "PORTAL_EXPIRED" ||
    code === "PORTAL_DISABLED"
  ) {
    window.location.href = "/portal/v2/sign-in/";
    return;
  }

  throw new Error(payload && payload.message ? payload.message : "Unable to load portal.");
}

function renderListInto(targetId, template, items, mapper) {
  const target = document.getElementById(targetId);
  if (!target) {
    throw new Error(targetId + " target not found.");
  }

  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    target.innerHTML = "<li><p class=\"portal-v2-empty\">No items found.</p></li>";
    return;
  }

  target.innerHTML = safeItems
    .map(function(item) {
      const mapped = typeof mapper === "function" ? mapper(item || {}) : (item || {});
      return renderTemplate(template, mapped);
    })
    .join("");
}

async function fetchPortalList(token) {
  const requestUrl =
    API_URL +
    "?mode=list" +
    "&t=" + encodeURIComponent(token);

  const response = await fetch(requestUrl, { method: "GET" });

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  return response.json();
}

async function fetchPortalDetail(token, projectId) {
  const requestUrl =
    API_URL +
    "?mode=detail" +
    "&t=" + encodeURIComponent(token) +
    "&p=" + encodeURIComponent(projectId);

  const response = await fetch(requestUrl, { method: "GET" });

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  return response.json();
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