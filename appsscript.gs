// CS Portal — Payslip & Experience Letter Generator
// Deploy as Web App (Execute as: Me, Who has access: Anyone)
// Connected to Google Sheet for logging

var SHEET_ID = "1n6fDjRCi17yp0KQ9lP29ARtqJVg0V_YgV_l9m4FjiCw";

// ======== ENTRY POINTS ========
function doGet(e) {
  return ContentService.createTextOutput("CS Employee Portal API v1.0 — Operational")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var action = d.action || "";

    if (action === "generate_payslip") {
      return generatePayslip(d);
    }
    if (action === "generate_experience") {
      return generateExperience(d);
    }
    if (action === "get_employee_list") {
      return getEmployeeList();
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

// ======== LOGGING ========
function logRequest(type, empName, empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("RequestLog");
    if (!s) {
      s = ss.insertSheet("RequestLog");
      s.appendRow(["Timestamp", "Type", "EmployeeName", "EmployeeID", "IP"]);
    }
    s.appendRow([new Date(), type, empName, empId, ""]);
  } catch (e) { }
}

// ======== PAYSLIP PDF GENERATION ========
function generatePayslip(d) {
  var empName = String(d.employeeName || "").trim();
  var empId = String(d.employeeId || "").trim();
  var department = String(d.department || "").trim();
  var designation = String(d.designation || "").trim();
  var payPeriodFrom = String(d.payPeriodFrom || "").trim();
  var payPeriodTo = String(d.payPeriodTo || "").trim();
  var paymentDate = String(d.paymentDate || "").trim();
  var bankName = String(d.bankName || "").trim();
  var accountNumber = String(d.accountNumber || "").trim();

  // Earnings
  var basic = parseFloat(d.basicSalary) || 0;
  var allowance = parseFloat(d.allowance) || 0;
  var bonus = parseFloat(d.attendanceBonus) || 0;
  var overtime = parseFloat(d.overtime) || 0;
  var commission = parseFloat(d.commission) || 0;

  // Deductions
  var tax = parseFloat(d.tax) || 0;
  var epf = parseFloat(d.epfEtf) || 0;
  var insurance = parseFloat(d.insurance) || 0;
  var loan = parseFloat(d.loanDeduction) || 0;
  var otherDeduction = parseFloat(d.otherDeduction) || 0;

  var gross = basic + allowance + bonus + overtime + commission;
  var totalDeductions = tax + epf + insurance + loan + otherDeduction;
  var netPay = gross - totalDeductions;

  var months = parseInt(d.months) || 1;
  months = Math.max(1, Math.min(12, months));

  // Validate required fields
  if (!empName || !empId) {
    return json({ error: "Employee Name and Employee ID are required." });
  }

  // Build multi-month payslip pages
  var pagesHtml = "";
  for (var m = 0; m < months; m++) {
    var monthLabel = months > 1 ? " (Month " + (m + 1) + " of " + months + ")" : "";
    pagesHtml += buildPayslipPage({
      employeeName: empName,
      employeeId: empId,
      department: department,
      designation: designation,
      payPeriodFrom: payPeriodFrom,
      payPeriodTo: payPeriodTo,
      paymentDate: paymentDate,
      bankName: bankName,
      accountNumber: accountNumber,
      basic: basic,
      allowance: allowance,
      bonus: bonus,
      overtime: overtime,
      commission: commission,
      tax: tax,
      epf: epf,
      insurance: insurance,
      loan: loan,
      otherDeduction: otherDeduction,
      gross: gross,
      totalDeductions: totalDeductions,
      netPay: netPay,
      monthLabel: monthLabel,
      isLast: (m === months - 1)
    });
  }

  var fullHtml = buildPayslipShell(pagesHtml);

  try {
    var blob = HtmlService.createHtmlOutput(fullHtml)
      .setTitle("Payslip_" + empName.replace(/\s+/g, "_"))
      .getBlob()
      .setName("Payslip_" + empName.replace(/\s+/g, "_") + ".pdf");

    var pdfB64 = Utilities.base64Encode(blob.getBytes());
    logRequest("payslip", empName, empId);

    // Email PDF if requested
    var emailTo = String(d.emailTo || "").trim();
    if (emailTo && isValidEmail(emailTo)) {
      try {
        MailApp.sendEmail({
          to: emailTo,
          subject: "Your Payslip — Talent Nexus",
          body: "Dear " + empName + ",\n\nYour payslip for the period " + payPeriodFrom + " to " + payPeriodTo + " is attached.\n\nThis is an auto-generated document from Talent Nexus Employee Portal.\n\n— Talent Nexus HR",
          attachments: [blob]
        });
      } catch (e) { /* email failed silently, PDF still returned */ }
    }

    return json({ ok: true, pdf: pdfB64, filename: "Payslip_" + empName.replace(/\s+/g, "_") + ".pdf", emailed: !!emailTo });
  } catch (e) {
    return json({ error: "PDF generation failed: " + e.toString() });
  }
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
    '.contact { font-size: 7pt; color: #888; margin-top: 3px; }' +
    '</style></head><body>' + pagesHtml + '</body></html>';
}

function buildPayslipPage(d) {
  var fmt = function(n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  return '<div class="page-break">' +
    // Header
    '<div class="header">' +
    '<div class="company">TALENT NEXUS</div>' +
    '<div class="tagline">Connecting Talent. Creating Impact.</div>' +
    '</div>' +

    '<div class="title">PAYSLIP ' + d.monthLabel + '</div>' +

    // Employee Info
    '<div class="section-title">Employee Information</div>' +
    '<table class="info">' +
    '<tr><td class="label">Employee Name</td><td>' + esc(d.employeeName) + '</td><td class="label">Employee ID</td><td>' + esc(d.employeeId) + '</td></tr>' +
    '<tr><td class="label">Department</td><td>' + esc(d.department) + '</td><td class="label">Designation</td><td>' + esc(d.designation) + '</td></tr>' +
    '<tr><td class="label">Pay Period</td><td>' + esc(d.payPeriodFrom) + ' — ' + esc(d.payPeriodTo) + '</td><td class="label">Payment Date</td><td>' + esc(d.paymentDate) + '</td></tr>' +
    '<tr><td class="label">Bank Name</td><td>' + esc(d.bankName) + '</td><td class="label">Account Number</td><td>' + esc(d.accountNumber) + '</td></tr>' +
    '</table>' +

    // Salary Breakdown
    '<div class="section-title">Salary Breakdown</div>' +
    '<table class="salary">' +
    '<tr><th colspan="2">EARNINGS</th><th colspan="2">DEDUCTIONS</th></tr>' +
    '<tr><td>Basic Salary</td><td class="amount">$' + fmt(d.basic) + '</td><td>Tax</td><td class="amount">' + (d.tax > 0 ? '$' + fmt(d.tax) : '—') + '</td></tr>' +
    '<tr><td>Allowance</td><td class="amount">' + (d.allowance > 0 ? '$' + fmt(d.allowance) : '—') + '</td><td>EPF / ETF</td><td class="amount">' + (d.epf > 0 ? '$' + fmt(d.epf) : '—') + '</td></tr>' +
    '<tr><td>Attendance Bonus</td><td class="amount">' + (d.bonus > 0 ? '$' + fmt(d.bonus) : '—') + '</td><td>Insurance</td><td class="amount">' + (d.insurance > 0 ? '$' + fmt(d.insurance) : '—') + '</td></tr>' +
    '<tr><td>Overtime</td><td class="amount">' + (d.overtime > 0 ? '$' + fmt(d.overtime) : '—') + '</td><td>Loan Deduction</td><td class="amount">' + (d.loan > 0 ? '$' + fmt(d.loan) : '—') + '</td></tr>' +
    '<tr><td>Commission</td><td class="amount">' + (d.commission > 0 ? '$' + fmt(d.commission) : '—') + '</td><td>Other Deduction</td><td class="amount">' + (d.otherDeduction > 0 ? '$' + fmt(d.otherDeduction) : '—') + '</td></tr>' +
    '</table>' +

    // Pay Summary
    '<table class="summary" style="width:60%;float:right;">' +
    '<tr><td>Gross Salary</td><td style="text-align:right;">USD &nbsp;&nbsp; $' + fmt(d.gross) + '</td></tr>' +
    '<tr><td>Total Deductions</td><td style="text-align:right;">USD &nbsp;&nbsp; $' + fmt(d.totalDeductions) + '</td></tr>' +
    '<tr style="border-top:2px solid #1a1a2e;"><td>NET PAY</td><td class="net" style="text-align:right;">USD &nbsp;&nbsp; $' + fmt(d.netPay) + '</td></tr>' +
    '</table>' +

    '<div style="clear:both;"></div>' +

    // Footer
    '<div class="footer">' +
    'This is a computer-generated payslip and does not require a signature.<br>' +
    '<strong>TALENT NEXUS</strong> — Connecting Talent. Creating Impact.' +
    '</div>' +
    '</div>';
}

// ======== EXPERIENCE LETTER PDF GENERATION ========
function generateExperience(d) {
  var empName = String(d.employeeName || "").trim();
  var position = String(d.position || "").trim();
  var shift = String(d.shift || "").trim();
  var trainingStart = String(d.trainingStart || "").trim();
  var officialDate = String(d.officialDate || "").trim();
  var address = String(d.address || "").trim();
  var certDate = String(d.certDate || "").trim() || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  var bodyText = String(d.bodyText || "").trim();

  if (!empName || !position) {
    return json({ error: "Employee Name and Position are required." });
  }

  var defaultBody = "This is to certify that <b>" + esc(empName) + "</b> has been an employee of Talent Nexus. During their tenure, they displayed a high level of commitment, professionalism, and ethical conduct." +
    "<br><br>As a member of the " + esc(d.shift || "the") + " team, " + esc(empName.split(" ")[0]) + " was responsible for managing operational tasks, maintaining quality standards, and ensuring efficient workflow. They completed their service tenure with dedication and reliability." +
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

    '<div class="header">' +
    '<div class="company">TALENT NEXUS</div>' +
    '<div class="tagline">Connecting Talent. Creating Impact.</div>' +
    '</div>' +

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

    '<div class="signature">' +
    '<div class="line"></div>' +
    '<div class="name">Human Resources Department</div>' +
    '<div class="role">Authorized Signatory</div>' +
    '<div class="office">Talent Nexus — Suite 10 and 11, The Sanctuary, 23 Oak Hill Grove, Surbiton, Surrey KT6 6DU</div>' +
    '</div>' +

    '</body></html>';

  try {
    var blob = HtmlService.createHtmlOutput(html)
      .setTitle("Experience_Letter_" + empName.replace(/\s+/g, "_"))
      .getBlob()
      .setName("Experience_Letter_" + empName.replace(/\s+/g, "_") + ".pdf");

    var pdfB64 = Utilities.base64Encode(blob.getBytes());
    logRequest("experience", empName, "");

    // Email PDF if requested
    var emailTo = String(d.emailTo || "").trim();
    if (emailTo && isValidEmail(emailTo)) {
      try {
        MailApp.sendEmail({
          to: emailTo,
          subject: "Experience Certificate — Talent Nexus",
          body: "Dear " + empName + ",\n\nYour experience certificate is attached.\n\nThis is an auto-generated document from Talent Nexus Employee Portal.\n\n— Talent Nexus HR",
          attachments: [blob]
        });
      } catch (e) { /* email failed silently */ }
    }

    return json({ ok: true, pdf: pdfB64, filename: "Experience_Letter_" + empName.replace(/\s+/g, "_") + ".pdf", emailed: !!emailTo });
  } catch (e) {
    return json({ error: "PDF generation failed: " + e.toString() });
  }
}

// ======== EMPLOYEE LIST ========
function getEmployeeList() {
  return json({ employees: [] });
}

// ======== HELPERS ========
function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}
