document.addEventListener("DOMContentLoaded", initPortal);

async function initPortal() {
  const appContent = document.getElementById("AppContent");
  if (!appContent) return;

  const params = new URLSearchParams(window.location.search);
  const projectId = String(params.get("p") || "").trim();

  try {
    if (projectId) {
      await renderSampleDetail(appContent);
      return;
    }

    await renderSampleList(appContent);
  } catch (error) {
    appContent.innerHTML =
      "<h1>Portal V2</h1>" +
      "<p>Sample load failed.</p>" +
      "<pre>" + escapeHtml(String(error && error.message ? error.message : error)) + "</pre>";
  }
}

async function renderSampleList(appContent) {
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
}

async function renderSampleDetail(appContent) {
  const viewTemplate = await loadTemplate("/portal/v2/partials/ViewProjectDetail/");
  appContent.innerHTML = viewTemplate;

  const clientTemplate = await loadTemplate("/portal/v2/partials/ItemClientBlock/");
  const projectTemplate = await loadTemplate("/portal/v2/partials/ItemProjectBlock/");
  const documentTemplate = await loadTemplate("/portal/v2/partials/ItemDocumentRow/");
  const timeEntryTemplate = await loadTemplate("/portal/v2/partials/ItemTimeEntryRow/");
  const expenseAllocationTemplate = await loadTemplate("/portal/v2/partials/ItemExpenseAllocationRow/");
  const projectProductTemplate = await loadTemplate("/portal/v2/partials/ItemProjectProductRow/");
  const paymentTemplate = await loadTemplate("/portal/v2/partials/ItemPaymentRow/");
  const refundTemplate = await loadTemplate("/portal/v2/partials/ItemRefundRow/");
  const serviceRequestTemplate = await loadTemplate("/portal/v2/partials/ItemServiceRequestRow/");

  const sampleClient = {
    ClientName: "Jensen, David",
    ContactName: "David Jensen",
    Email: "david@example.com",
    Phone: "8634461056"
  };

  const sampleProject = {
    ProjectName: "HA - Mini Split Service/Repairs",
    Status: "Paid",
    ComputedAddress: "900 County Road 950 Calhoun TN 37309",
    Description: "Sample project detail description."
  };

  const sampleDocuments = [
    {
      DisplayName: "Project Report",
      FileURL: "#",
      CreatedDateTime: "2026-04-15 07:29:56"
    }
  ];

  const sampleTimeEntries = [
    {
      WorkerName: "Robert Ketter",
      TimeDate: "2026-04-07",
      HoursWorked: "8.4",
      Description: "Recover refrigerant and complete service work."
    }
  ];

  const sampleExpenseAllocations = [
    {
      Description: "Heavy Duty Door Closer",
      AllocatedAmount: "90.00",
      CreatedDate: "2026-04-09"
    }
  ];

  const sampleProjectProducts = [
    {
      Description: "Filter / Dryer",
      Amount: "16.45",
      ProductDate: "2026-04-07"
    }
  ];

  const samplePayments = [
    {
      PaymentAmount: "970.45",
      PaymentDate: "2026-04-09",
      PaymentMethod: "Zelle",
      PaymentReference: "Sent to 3045820759"
    }
  ];

  const sampleRefunds = [
    {
      RefundAmount: "0.00",
      RefundDate: "",
      RefundReason: "No refunds"
    }
  ];

  const sampleServiceRequests = [
    {
      ServiceType: "General Repair",
      Status: "Closed",
      IssueDescription: "Mini split service and related work."
    }
  ];

  const clientBlock = document.getElementById("ClientBlock");
  const projectBlock = document.getElementById("ProjectBlock");

  if (!clientBlock) throw new Error("ClientBlock target not found.");
  if (!projectBlock) throw new Error("ProjectBlock target not found.");

  clientBlock.innerHTML = renderTemplate(clientTemplate, sampleClient);
  projectBlock.innerHTML = renderTemplate(projectTemplate, sampleProject);

  renderListInto("DocumentItems", documentTemplate, sampleDocuments);
  renderListInto("TimeEntryItems", timeEntryTemplate, sampleTimeEntries);
  renderListInto("ExpenseAllocationItems", expenseAllocationTemplate, sampleExpenseAllocations);
  renderListInto("ProjectProductItems", projectProductTemplate, sampleProjectProducts);
  renderListInto("PaymentItems", paymentTemplate, samplePayments);
  renderListInto("RefundItems", refundTemplate, sampleRefunds);
  renderListInto("ServiceRequestItems", serviceRequestTemplate, sampleServiceRequests);
}

function renderListInto(targetId, template, items) {
  const target = document.getElementById(targetId);
  if (!target) {
    throw new Error(targetId + " target not found.");
  }

  target.innerHTML = (Array.isArray(items) ? items : [])
    .map(function(item) {
      return renderTemplate(template, item);
    })
    .join("");
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