function buildProjectDetailMinimalResponse_(token, projectId) {
  const context = getPortalContext_(token);
  if (!context.success) return context;

  const project = context.projects.find(function(item) {
    return String(item.ProjectID || item.projectId || "").trim() === String(projectId || "").trim();
  });

  if (!project) {
    return {
      success: false,
      code: "PROJECT_NOT_FOUND",
      message: "The selected project is not available in your Project Center."
    };
  }

  const resolvedProjectId = String(project.ProjectID || project.projectId || "").trim();
  const ss = openPortalSpreadsheet_();

  const client = getPortalClientForProject_(ss, project);
  const documents = getPortalDocuments_(ss, resolvedProjectId);
  const timeEntries = getPortalTimeEntries_(ss, resolvedProjectId);
  const costItems = getPortalProjectCostItems_(ss, resolvedProjectId);
  const payments = getPortalPayments_(ss, resolvedProjectId);
  const refunds = getPortalRefunds_(ss, resolvedProjectId, getVendorLookup_(ss));

  return {
    success: true,
    code: "ACCESS_GRANTED",
    Client: client || {},
    Project: project || {},
    Collections: {
      Documents: Array.isArray(documents) ? documents : [],
      TimeEntries: Array.isArray(timeEntries) ? timeEntries : [],
      CostItems: Array.isArray(costItems) ? costItems : [],
      Payments: Array.isArray(payments) ? payments : [],
      Refunds: Array.isArray(refunds) ? refunds : []
    }
  };
}