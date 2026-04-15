const API_URL = "https://script.google.com/macros/s/AKfycby12TuuhZaJjy6_xWtbKfH3R6joBD22RpeoANAU6EPBokz7IrIAq8v022EQAVdclu-D3w/exec";
const TEMPLATE_BASE = "/portal-v2/";
const SESSION_TOKEN_KEY = "SessionToken";

const TEMPLATE_PATHS = {
  ViewSignedOut: "/portal-v2/ViewSignedOut/",
  ViewError: "/portal-v2/ViewError/",
  ViewProjectList: "/portal-v2/ViewProjectList/",
  ViewProjectDetail: "/portal-v2/ViewProjectDetail/",
  ItemProjectLink: "/portal-v2/ItemProjectLink/",
  ItemDocumentLink: "/portal-v2/ItemDocumentLink/",
  ItemTimeRow: "/portal-v2/ItemTimeRow/",
  ItemCostRow: "/portal-v2/ItemCostRow/",
  ItemPaymentRow: "/portal-v2/ItemPaymentRow/",
  ItemRefundRow: "/portal-v2/ItemRefundRow/",
};

const templateCache = {};

document.addEventListener("DOMContentLoaded", initPortal);

async function initPortal() {
  bindGlobalClicks();

  const TestMode = new URLSearchParams(window.location.search).get("test");
  if (TestMode === "1") {
    await runPortalTest();
    return;
  }

  const Token = getUrlToken();

  if (Token) {
    try {
      const Payload = await validateToken(Token);

      if (!Payload.Success || !Payload.SessionToken) {
        clearSessionToken();
        await renderSignedOutView(Payload.Message || "Access link is invalid or expired.");
        return;
      }

      setSessionToken(Payload.SessionToken);
      cleanEntryUrl();

      if (!window.location.hash || window.location.hash === "#") {
        window.location.hash = "#/projects";
      }

      startRouter();
      await handleRoute();
      return;
    } catch (error) {
      console.error("ValidateToken failed:", error);
      clearSessionToken();
      await renderSignedOutView("Access link is invalid or expired.");
      return;
    }
  }

  const SessionToken = getSessionToken();
  if (!SessionToken) {
    await renderSignedOutView("Access link required.");
    return;
  }

  startRouter();
  await handleRoute();
}

function bindGlobalClicks() {
  document.addEventListener("click", async function (event) {
    const Link = event.target.closest('[data-action="logout"]');
    if (!Link) return;

    event.preventDefault();
    await logout();
  });
}

function getUrlToken() {
  const Params = new URLSearchParams(window.location.search);
  return String(Params.get("t") || "").trim();
}

function getSessionToken() {
  return String(sessionStorage.getItem(SESSION_TOKEN_KEY) || "").trim();
}

function setSessionToken(SessionToken) {
  sessionStorage.setItem(SESSION_TOKEN_KEY, String(SessionToken || "").trim());
}

function clearSessionToken() {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

function cleanEntryUrl() {
  const CleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash || ""}`;
  window.history.replaceState({}, document.title, CleanUrl);
}

let routerStarted = false;

function startRouter() {
  if (routerStarted) return;
  routerStarted = true;
  window.addEventListener("hashchange", handleRoute);
}

async function handleRoute() {
  const SessionToken = getSessionToken();
  if (!SessionToken) {
    await renderSignedOutView("Access link required.");
    return;
  }

  const Hash = window.location.hash || "#/projects";

  if (Hash === "#/projects") {
    try {
      const Payload = await fetchProjectList();

      if (!Payload.Success) {
        await handleProtectedFailure(Payload);
        return;
      }

      await renderProjectListView(Payload);
    } catch (error) {
      console.error("GetProjectList failed:", error);
      await renderErrorView("Unable to load projects.");
    }
    return;
  }

  if (Hash.startsWith("#/project/")) {
    const ProjectID = getRouteProjectID();

    if (!ProjectID) {
      goToProjects();
      return;
    }

    try {
      const Payload = await fetchProjectDetail(ProjectID);

      if (!Payload.Success) {
        await handleProtectedFailure(Payload);
        return;
      }

      await renderProjectDetailView(Payload);
    } catch (error) {
      console.error("GetProjectDetail failed:", error);
      await renderErrorView("Unable to load project detail.");
    }
    return;
  }

  goToProjects();
}

function goToProjects() {
  window.location.hash = "#/projects";
}

function getRouteProjectID() {
  const Match = (window.location.hash || "").match(/^#\/project\/(.+)$/);
  return Match ? decodeURIComponent(Match[1]) : "";
}

async function validateToken(Token) {
  return postJson({
    Mode: "ValidateToken",
    Token
  });
}

async function fetchProjectList() {
  return postJson({
    Mode: "GetProjectList",
    SessionToken: getSessionToken()
  });
}

async function fetchProjectDetail(ProjectID) {
  return postJson({
    Mode: "GetProjectDetail",
    SessionToken: getSessionToken(),
    ProjectID
  });
}

async function logout() {
  const SessionToken = getSessionToken();

  try {
    if (SessionToken) {
      await postJson({
        Mode: "Logout",
        SessionToken
      });
    }
  } catch (error) {
    console.error("Logout failed:", error);
  }

  clearSessionToken();
  window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`);
  window.location.hash = "";
  await renderSignedOutView("You have been signed out.");
}

async function postJson(Payload) {
  const Response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(Payload)
  });

  if (!Response.ok) {
    throw new Error(`HTTP ${Response.status}`);
  }

  return Response.json();
}

async function loadTemplate(Path) {
  if (templateCache[Path]) {
    return templateCache[Path];
  }

  const Response = await fetch(Path, { cache: "no-cache" });

  if (!Response.ok) {
    throw new Error(`Template load failed: ${Path} (HTTP ${Response.status})`);
  }

  const Text = await Response.text();
  templateCache[Path] = Text;
  return Text;
}

function renderTemplate(TemplateText, Data) {
  return String(TemplateText || "").replace(/{{\s*([A-Za-z0-9_]+)\s*}}/g, function (_, Key) {
    const Value = Data && Object.prototype.hasOwnProperty.call(Data, Key) ? Data[Key] : "";
    return Value == null ? "" : String(Value);
  });
}

async function renderCollection(Items, ItemTemplatePath, EmptyMessage) {
  const ItemTemplate = await loadTemplate(ItemTemplatePath);
  const SafeItems = Array.isArray(Items) ? Items : [];

  if (!SafeItems.length) {
    return `<li>${escapeHtml(EmptyMessage)}</li>`;
  }

  return SafeItems.map(function (Item) {
    return renderTemplate(ItemTemplate, Item || {});
  }).join("");
}

async function renderProjectListView(Payload) {
  const ViewTemplate = await loadTemplate(TEMPLATE_PATHS.ViewProjectList);
  const ProjectItems = await renderCollection(
    Payload.Projects,
    TEMPLATE_PATHS.ItemProjectLink,
    "No projects found."
  );

  const Html = renderTemplate(ViewTemplate, {
    ClientName: Payload.Client && Payload.Client.ClientName ? Payload.Client.ClientName : "",
    ProjectItems
  });

  mountView(Html);
}

async function renderProjectDetailView(Payload) {
  const ViewTemplate = await loadTemplate(TEMPLATE_PATHS.ViewProjectDetail);
  const Collections = Payload.Collections || {};
  const Totals = Payload.Totals || {};
  const Project = Payload.Project || {};

  const DocumentItems = await renderCollection(
    Collections.Documents,
    TEMPLATE_PATHS.ItemDocumentLink,
    "No documents found."
  );

  const TimeItems = await renderCollection(
    Collections.TimeEntries,
    TEMPLATE_PATHS.ItemTimeRow,
    "No time entries found."
  );

  const CostItems = await renderCollection(
    Collections.CostItems,
    TEMPLATE_PATHS.ItemCostRow,
    "No cost items found."
  );

  const PaymentItems = await renderCollection(
    Collections.Payments,
    TEMPLATE_PATHS.ItemPaymentRow,
    "No payments found."
  );

  const RefundItems = await renderCollection(
    Collections.Refunds,
    TEMPLATE_PATHS.ItemRefundRow,
    "No refunds found."
  );

  const Html = renderTemplate(ViewTemplate, {
    ProjectLabel: Project.ProjectLabel || "",
    ProjectName: Project.ProjectName || "",
    Status: Project.Status || "",
    ProjectAddressText: Project.ProjectAddressText || "",
    LastActivityOnText: Project.LastActivityOnText || "",
    Description: Project.Description || "",
    DocumentItems,
    TimeItems,
    CostItems,
    PaymentItems,
    RefundItems,
    LaborTotalText: Totals.LaborTotalText || "",
    CostItemsTotalText: Totals.CostItemsTotalText || "",
    PaymentsTotalText: Totals.PaymentsTotalText || "",
    RefundsTotalText: Totals.RefundsTotalText || "",
    BalanceDueText: Totals.BalanceDueText || ""
  });

  mountView(Html);
}

async function renderSignedOutView(Message) {
  const ViewTemplate = await loadTemplate(TEMPLATE_PATHS.ViewSignedOut);
  const Html = renderTemplate(ViewTemplate, {
    Message: Message || "Access link required."
  });
  mountView(Html);
}

async function renderErrorView(Message) {
  const ViewTemplate = await loadTemplate(TEMPLATE_PATHS.ViewError);
  const Html = renderTemplate(ViewTemplate, {
    Message: Message || "An unexpected error occurred."
  });
  mountView(Html);
}

function mountView(ViewHtml) {
  const AppContent = document.getElementById("AppContent");
  if (!AppContent) return;
  AppContent.innerHTML = ViewHtml;
}

async function handleProtectedFailure(Payload) {
  const Code = String((Payload && Payload.Code) || "").trim();

  if (Code === "AUTH_REQUIRED" || Code === "INVALID_TOKEN" || Code === "PORTAL_EXPIRED") {
    clearSessionToken();
    await renderSignedOutView(Payload.Message || "Your session is missing, expired, or invalid.");
    return;
  }

  if (Code === "PROJECT_NOT_FOUND") {
    await renderErrorView(Payload.Message || "Project not found or not available.");
    return;
  }

  await renderErrorView(Payload.Message || "Unable to complete the request.");
}

function escapeHtml(Value) {
  return String(Value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function runPortalTest() {
  const Results = [];

  async function checkTemplate(Name, Path) {
    try {
      const Response = await fetch(Path, { cache: "no-cache" });
      Results.push({
        Name,
        Path,
        Ok: Response.ok,
        Status: Response.status
      });
    } catch (error) {
      Results.push({
        Name,
        Path,
        Ok: false,
        Status: "FETCH_FAILED"
      });
    }
  }

  await checkTemplate("ViewSignedOut", TEMPLATE_PATHS.ViewSignedOut);
  await checkTemplate("ViewError", TEMPLATE_PATHS.ViewError);
  await checkTemplate("ViewProjectList", TEMPLATE_PATHS.ViewProjectList);
  await checkTemplate("ViewProjectDetail", TEMPLATE_PATHS.ViewProjectDetail);
  await checkTemplate("ItemProjectLink", TEMPLATE_PATHS.ItemProjectLink);
  await checkTemplate("ItemDocumentLink", TEMPLATE_PATHS.ItemDocumentLink);
  await checkTemplate("ItemTimeRow", TEMPLATE_PATHS.ItemTimeRow);
  await checkTemplate("ItemCostRow", TEMPLATE_PATHS.ItemCostRow);
  await checkTemplate("ItemPaymentRow", TEMPLATE_PATHS.ItemPaymentRow);
  await checkTemplate("ItemRefundRow", TEMPLATE_PATHS.ItemRefundRow);

  const Passed = Results.every(function (Result) {
    return Result.Ok;
  });

  const Rows = Results.map(function (Result) {
    return `<li>${escapeHtml(Result.Name)} - ${escapeHtml(String(Result.Status))} - ${escapeHtml(Result.Path)}</li>`;
  }).join("");

  mountView(`
    <h1>Portal Template Test</h1>
    <p>${Passed ? "PASS" : "FAIL"}</p>
    <ul>${Rows}</ul>
  `);

  console.table(Results);
}