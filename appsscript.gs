// CS Portal — Payslip & Experience Letter Generator
// Deploy as Web App (Execute as: Me, Who has access: Anyone)

var SHEET_ID = "1n6fDjRCi17yp0KQ9lP29ARtqJVg0V_YgV_l9m4FjiCw";

function doGet(e) {
  return ContentService.createTextOutput("CS Employee Portal API v1.1 — Operational")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    // Accept both form-encoded (from website) and JSON (for testing)
    var d = {};
    if (e.postData && e.postData.type === "application/json") {
      d = JSON.parse(e.postData.contents);
    } else {
      d = e.parameters || {};
    }
    var action = d.action || "";

    if (action === "generate_payslip") {
      return returnPdf(generatePayslipHtml(d), "Payslip_" + safeFilename(d.employeeName || "Employee") + ".pdf");
    }
    if (action === "generate_experience") {
      return returnPdf(generateExperienceHtml(d), "Experience_Letter_" + safeFilename(d.employeeName || "Employee") + ".pdf");
    }
    return json({ error: "Unknown action: " + action });
  } catch (err) {
    return json({ error: err.toString() });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ======== RETURN PDF VIA DRIVE (reliable, no size limits, bypasses CORS) ========
function returnPdf(html, filename) {
  try {
    // Generate PDF
    var blob = HtmlService.createHtmlOutput(html).getBlob()
      .setName(filename).setContentType("application/pdf");

    // Save to Drive with public link
    var folder = getOrCreateFolder("CS_Portal_PDFs");
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var downloadUrl = "https://drive.google.com/uc?export=download&id=" + file.getId();

    // Auto-cleanup old files after 10 minutes
    ScriptApp.newTrigger("cleanupOldPdfs")
      .timeBased()
      .after(10 * 60 * 1000)
      .create();

    // Return redirect to the Drive download URL (triggers browser download in iframe)
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=' + downloadUrl + '"></head><body></body></html>'
    ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (e) {
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><body><h3>Error generating PDF: ' + esc(e.toString()) + '</h3></body></html>'
    ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

function cleanupOldPdfs() {
  try {
    var folder = getOrCreateFolder("CS_Portal_PDFs");
    var files = folder.getFiles();
    var cutoff = new Date(Date.now() - 15 * 60 * 1000); // 15 min ago
    while (files.hasNext()) {
      var f = files.next();
      if (f.getDateCreated() < cutoff) f.setTrashed(true);
    }
  } catch (e) { }
}

// ======== EMAIL (called after PDF generation) ========
function sendPdfEmail(to, subject, body, htmlContent, filename) {
  if (!to || !isValidEmail(String(to).trim())) return false;
  try {
    var blob = HtmlService.createHtmlOutput(htmlContent).getBlob()
      .setName(filename).setContentType("application/pdf");
    MailApp.sendEmail({
      to: String(to).trim(),
      subject: subject,
      body: body,
      attachments: [blob]
    });
    return true;
  } catch (e) { return false; }
}

// ======== PAYSLIP HTML ========
function generatePayslipHtml(d) {
  var empName = str(d.employeeName);
  var empId = str(d.employeeId);
  var department = str(d.department);
  var designation = str(d.designation);
  var payPeriodFrom = str(d.payPeriodFrom);
  var payPeriodTo = str(d.payPeriodTo);
  var paymentDate = str(d.paymentDate);
  var bankName = str(d.bankName);
  var accountNumber = str(d.accountNumber);
  var emailTo = str(d.emailTo);

  var basic = num(d.basicSalary);
  var allowance = num(d.allowance);
  var bonus = num(d.attendanceBonus);
  var overtime = num(d.overtime);
  var commission = num(d.commission);
  var tax = num(d.tax);
  var epf = num(d.epfEtf);
  var insurance = num(d.insurance);
  var loan = num(d.loanDeduction);
  var otherDeduction = num(d.otherDeduction);

  var gross = basic + allowance + bonus + overtime + commission;
  var totalDeductions = tax + epf + insurance + loan + otherDeduction;
  var netPay = gross - totalDeductions;

  var months = Math.max(1, Math.min(12, parseInt(d.months) || 1));

  if (!empName || !empId) {
    return "<h3>Error: Employee Name and Employee ID are required.</h3>";
  }

  // Build multi-month pages
  var pagesHtml = "";
  for (var m = 0; m < months; m++) {
    var monthLabel = months > 1 ? " (Month " + (m + 1) + " of " + months + ")" : "";
    pagesHtml += buildPayslipPage({
      employeeName: empName, employeeId: empId,
      department: department, designation: designation,
      payPeriodFrom: payPeriodFrom, payPeriodTo: payPeriodTo,
      paymentDate: paymentDate, bankName: bankName, accountNumber: accountNumber,
      basic: basic, allowance: allowance, bonus: bonus, overtime: overtime,
      commission: commission, tax: tax, epf: epf, insurance: insurance,
      loan: loan, otherDeduction: otherDeduction,
      gross: gross, totalDeductions: totalDeductions, netPay: netPay,
      monthLabel: monthLabel, isLast: (m === months - 1)
    });
  }

  logRequest("payslip", empName, empId);

  // Send email asynchronously
  if (emailTo && isValidEmail(emailTo)) {
    var payPeriod = payPeriodFrom + " to " + payPeriodTo;
    sendPdfEmail(emailTo, "Your Payslip — Talent Nexus",
      "Dear " + empName + ",\n\nYour payslip for " + payPeriod + " is attached.\n\n— Talent Nexus HR",
      buildPayslipShell(pagesHtml), "Payslip_" + empName.replace(/\s+/g, "_") + ".pdf");
  }

  return buildPayslipShell(pagesHtml);
}

function buildPayslipShell(pagesHtml) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page { size: A4; margin: 12mm; }' +
    'body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #1a1a2e; font-size: 10pt; line-height: 1.4; }' +
    '.page-break { page-break-after: always; }' +
    '.page-break:last-child { page-break-after: avoid; }' +
    '.header { text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 8px; margin-bottom: 14px; }' +
    '.header .company { font-size: 18pt; font-weight: 800; letter-spacing: 1px; color: #1a1a2e; }' +
    '.header .tagline { font-size: 7pt; color: #666; text-transform: uppercase; letter-spacing: 2px; }' +
    '.title { text-align: center; font-size: 13pt; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin: 10px 0 6px; padding: 5px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; }' +
    '.section-title { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #555; margin: 12px 0 5px; border-bottom: 1px solid #e0e0e0; padding-bottom: 2px; }' +
    'table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }' +
    'table.info td { padding: 3px 6px; font-size: 9pt; border: 1px solid #e8e8e8; }' +
    'table.info td.label { background: #f5f5f5; font-weight: 600; width: 25%; font-size: 8pt; }' +
    'table.salary th { background: #1a1a2e; color: #fff; padding: 5px 8px; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; }' +
    'table.salary td { padding: 4px 8px; font-size: 9pt; border: 1px solid #e8e8e8; }' +
    'table.salary td.amount { text-align: right; font-weight: 500; }' +
    'table.summary td { padding: 5px 10px; font-size: 10pt; font-weight: 700; }' +
    'table.summary td.net { font-size: 13pt; color: #1a6b3c; }' +
    '.footer { margin-top: 20px; text-align: center; font-size: 7pt; color: #999; border-top: 1px solid #e0e0e0; padding-top: 8px; }' +
    '</style></head><body>' + pagesHtml + '</body></html>';
}

function buildPayslipPage(d) {
  var fmt = function(n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  return '<div class="page-break">' +
    '<div class="header"><div class="company">TALENT NEXUS</div><div class="tagline">Connecting Talent. Creating Impact.</div></div>' +
    '<div class="title">PAYSLIP ' + esc(d.monthLabel) + '</div>' +
    '<div class="section-title">Employee Information</div>' +
    '<table class="info">' +
    '<tr><td class="label">Employee Name</td><td>' + esc(d.employeeName) + '</td><td class="label">Employee ID</td><td>' + esc(d.employeeId) + '</td></tr>' +
    '<tr><td class="label">Department</td><td>' + esc(d.department) + '</td><td class="label">Designation</td><td>' + esc(d.designation) + '</td></tr>' +
    '<tr><td class="label">Pay Period</td><td>' + esc(d.payPeriodFrom) + ' — ' + esc(d.payPeriodTo) + '</td><td class="label">Payment Date</td><td>' + esc(d.paymentDate) + '</td></tr>' +
    '<tr><td class="label">Bank Name</td><td>' + esc(d.bankName) + '</td><td class="label">Account Number</td><td>' + esc(d.accountNumber) + '</td></tr>' +
    '</table>' +
    '<div class="section-title">Salary Breakdown</div>' +
    '<table class="salary">' +
    '<tr><th colspan="2">EARNINGS</th><th colspan="2">DEDUCTIONS</th></tr>' +
    '<tr><td>Basic Salary</td><td class="amount">$' + fmt(d.basic) + '</td><td>Tax</td><td class="amount">' + val(d.tax) + '</td></tr>' +
    '<tr><td>Allowance</td><td class="amount">' + val(d.allowance) + '</td><td>EPF / ETF</td><td class="amount">' + val(d.epf) + '</td></tr>' +
    '<tr><td>Attendance Bonus</td><td class="amount">' + val(d.bonus) + '</td><td>Insurance</td><td class="amount">' + val(d.insurance) + '</td></tr>' +
    '<tr><td>Overtime</td><td class="amount">' + val(d.overtime) + '</td><td>Loan Deduction</td><td class="amount">' + val(d.loan) + '</td></tr>' +
    '<tr><td>Commission</td><td class="amount">' + val(d.commission) + '</td><td>Other Deduction</td><td class="amount">' + val(d.otherDeduction) + '</td></tr>' +
    '</table>' +
    '<table class="summary" style="width:60%;float:right;">' +
    '<tr><td>Gross Salary</td><td style="text-align:right;">USD &nbsp;&nbsp; $' + fmt(d.gross) + '</td></tr>' +
    '<tr><td>Total Deductions</td><td style="text-align:right;">USD &nbsp;&nbsp; $' + fmt(d.totalDeductions) + '</td></tr>' +
    '<tr style="border-top:2px solid #1a1a2e;"><td>NET PAY</td><td class="net" style="text-align:right;">USD &nbsp;&nbsp; $' + fmt(d.netPay) + '</td></tr>' +
    '</table><div style="clear:both;"></div>' +
    '<div class="footer">This is a computer-generated payslip and does not require a signature.<br><strong>TALENT NEXUS</strong> — Connecting Talent. Creating Impact.</div>' +
    '</div>';
}

// ======== EXPERIENCE LETTER HTML ========
function generateExperienceHtml(d) {
  var empName = str(d.employeeName);
  var position = str(d.position);
  var shift = str(d.shift);
  var trainingStart = str(d.trainingStart);
  var officialDate = str(d.officialDate);
  var address = str(d.address);
  var certDate = str(d.certDate) || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  var bodyText = str(d.bodyText);
  var emailTo = str(d.emailTo);

  if (!empName || !position) {
    return "<h3>Error: Employee Name and Position are required.</h3>";
  }

  var defaultBody = "This is to certify that <b>" + esc(empName) + "</b> has been an employee of Talent Nexus. During their tenure, they displayed a high level of commitment, professionalism, and ethical conduct." +
    "<br><br>As a member of the " + esc(shift || "the") + " team, " + esc(empName.split(" ")[0]) + " was responsible for managing operational tasks, maintaining quality standards, and ensuring efficient workflow. They completed their service tenure with dedication and reliability." +
    "<br><br>We found them to be hardworking, dedicated, and a reliable team member. Their character and conduct remained exemplary throughout their stay with us." +
    "<br><br>We wish them every success in their future professional endeavors.";

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page { size: A4; margin: 20mm 18mm; }' +
    'body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #1a1a2e; font-size: 10.5pt; line-height: 1.7; }' +
    '.header { text-align: center; border-bottom: 3px double #1a1a2e; padding-bottom: 12px; margin-bottom: 20px; }' +
    '.header .company { font-size: 20pt; font-weight: 800; letter-spacing: 2px; }' +
    '.header .tagline { font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }' +
    '.title { text-align: center; font-size: 14pt; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; margin: 18px 0; }' +
    '.date { text-align: right; font-size: 9pt; margin-bottom: 14px; }' +
    '.salutation { font-size: 9pt; font-weight: 700; margin-bottom: 8px; }' +
    '.body-text { font-size: 10pt; margin-bottom: 14px; text-align: justify; }' +
    'table.info { width: 100%; border-collapse: collapse; margin: 14px 0; }' +
    'table.info td { padding: 4px 8px; font-size: 9pt; border: 1px solid #e8e8e8; }' +
    'table.info td.label { background: #f5f5f5; font-weight: 600; width: 30%; }' +
    '.signature { margin-top: 40px; }' +
    '.signature .line { border-top: 1px solid #1a1a2e; width: 200px; margin-bottom: 4px; }' +
    '.signature .name { font-weight: 700; font-size: 10pt; }' +
    '.signature .role { font-size: 8pt; color: #666; }' +
    '.office { margin-top: 6px; font-size: 7.5pt; color: #888; }' +
    '</style></head><body>' +
    '<div class="header"><div class="company">TALENT NEXUS</div><div class="tagline">Connecting Talent. Creating Impact.</div></div>' +
    '<div class="title">EXPERIENCE CERTIFICATE</div>' +
    '<div class="date">Date: ' + esc(certDate) + '</div>' +
    '<div class="salutation">TO WHOM IT MAY CONCERN</div>' +
    '<div class="body-text">' + (bodyText || defaultBody) + '</div>' +
    '<table class="info">' +
    '<tr><td class="label">Position</td><td>' + esc(position) + '</td></tr>' +
    '<tr><td class="label">Shift</td><td>' + esc(shift) + '</td></tr>' +
    '<tr><td class="label">Training Start</td><td>' + esc(trainingStart) + '</td></tr>' +
    '<tr><td class="label">Official Working Date</td><td>' + esc(officialDate) + '</td></tr>' +
    '<tr><td class="label">Address</td><td>' + esc(address) + '</td></tr>' +
    '</table>' +
    '<div class="signature"><div class="line"></div><div class="name">Human Resources Department</div><div class="role">Authorized Signatory</div>' +
    '<div class="office">Talent Nexus — Suite 10 and 11, The Sanctuary, 23 Oak Hill Grove, Surbiton, Surrey KT6 6DU</div></div>' +
    '</body></html>';

  logRequest("experience", empName, "");

  // Send email asynchronously
  if (emailTo && isValidEmail(emailTo)) {
    sendPdfEmail(emailTo, "Experience Certificate — Talent Nexus",
      "Dear " + empName + ",\n\nYour experience certificate is attached.\n\n— Talent Nexus HR",
      html, "Experience_Letter_" + empName.replace(/\s+/g, "_") + ".pdf");
  }

  return html;
}

// ======== LOGGING ========
function logRequest(type, empName, empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("RequestLog");
    if (!s) {
      s = ss.insertSheet("RequestLog");
      s.appendRow(["Timestamp", "Type", "EmployeeName", "EmployeeID"]);
    }
    s.appendRow([new Date(), type, empName, empId]);
  } catch (e) { }
}

// ======== HELPERS ========
function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function str(v) { return String(v || "").trim(); }
function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
function val(n) { return n > 0 ? ("$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : "—"; }
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()); }
function safeFilename(s) { return String(s || "document").replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_").substring(0, 80); }
