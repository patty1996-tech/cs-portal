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
      // e.parameter (singular) returns strings; e.parameters (plural) returns arrays
      d = e.parameter || {};
    }
    var action = d.action || "";

    if (action === "debug") {
      return json({
        parameter: e.parameter,
        parameters: e.parameters,
        postDataType: e.postData ? e.postData.type : "none",
        postDataContents: e.postData ? String(e.postData.contents).substring(0, 300) : "none",
        parsed_d: d,
        parsed_action: action
      });
    }
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

// ======== RETURN PDF AS DIRECT DOWNLOAD (no Drive needed) ========
function returnPdf(html, filename) {
  try {
    // Generate PDF blob
    var blob = HtmlService.createHtmlOutput(html).getBlob()
      .setName(filename).setContentType("application/pdf");
    var b64 = Utilities.base64Encode(blob.getBytes());

    // Return an HTML page that downloads the PDF
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><title>Your Document</title>' +
      '<style>body{font-family:Arial,sans-serif;text-align:center;padding:40px;color:#333}' +
      '.btn{display:inline-block;padding:14px 28px;background:#c9a84c;color:#fff;border-radius:6px;' +
      'text-decoration:none;font-weight:700;font-size:16px;margin-top:10px}' +
      '.btn:hover{background:#a8882e}</style></head><body>' +
      '<h2>Talent Nexus</h2>' +
      '<p>Your document is ready.</p>' +
      '<p><a class="btn" href="data:application/pdf;base64,' + b64 + '" download="' + filename + '">Download PDF</a></p>' +
      '<p style="font-size:12px;color:#999;margin-top:20px">If download does not start, click the button above.</p>' +
      '<script>setTimeout(function(){document.querySelector(".btn").click()},500);</script>' +
      '</body></html>'
    );

  } catch (e) {
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><body><h3>Error generating PDF: ' + esc(e.toString()) + '</h3></body></html>'
    );
  }
}

// ======== EMAIL (Professional HTML email with PDF attachment) ========
function sendPdfEmail(to, subject, empName, htmlContent, filename, docType) {
  if (!to || !isValidEmail(String(to).trim())) return false;
  try {
    var cleanTo = String(to).trim();
    var blob = HtmlService.createHtmlOutput(htmlContent).getBlob()
      .setName(filename).setContentType("application/pdf");
    var today = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

    var messages = {
      payslip: "Please find your payslip attached. We encourage you to review the details carefully. Should you have any questions regarding your salary breakdown, do not hesitate to reach out to the HR department.",
      experience: "Please find your experience certificate attached. We appreciate your contributions and wish you the very best in all your future endeavors. Should you require any further documentation, please contact the HR department."
    };
    var docMsg = messages[docType] || "Please find your document attached. For any inquiries, contact the HR department.";

    var htmlBody = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px"><tr><td align="center">' +
      '<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">' +
      // Header
      '<tr><td style="background:#1a1a2e;padding:24px 30px;text-align:center">' +
      '<h1 style="color:#c9a84c;margin:0;font-size:22px;font-weight:800;letter-spacing:1px">TALENT NEXUS</h1>' +
      '<p style="color:#888;margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px">Human Resources Department</p></td></tr>' +
      // Body
      '<tr><td style="padding:24px 30px">' +
      '<p style="font-size:14px;color:#333;margin:0 0 8px">Dear <b>' + esc(empName) + '</b>,</p>' +
      '<p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 12px">' + docMsg + '</p>' +
      '<table cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #eee;border-radius:6px;padding:12px 16px;margin:12px 0"><tr><td>' +
      '<p style="font-size:12px;color:#888;margin:0 0 4px"><b>Document:</b> ' + esc(filename) + '</p>' +
      '<p style="font-size:12px;color:#888;margin:0 0 4px"><b>Date Issued:</b> ' + today + '</p>' +
      '<p style="font-size:12px;color:#888;margin:0"><b>Issued By:</b> HR Department, Talent Nexus</p>' +
      '</td></tr></table>' +
      '<p style="font-size:12px;color:#aaa;line-height:1.6;margin:0">For any assistance, please contact the <b>HR Department</b> at <a href="mailto:hr@talentnexus.com" style="color:#c9a84c">hr@talentnexus.com</a>.</p>' +
      '</td></tr>' +
      // Footer
      '<tr><td style="background:#fafafa;padding:20px 30px;border-top:1px solid #eee;text-align:center">' +
      '<p style="font-size:12px;color:#666;margin:0 0 8px"><b>With Regards,</b></p>' +
      '<p style="font-size:13px;color:#333;margin:0 0 2px;font-weight:700">HR Department</p>' +
      '<p style="font-size:11px;color:#999;margin:0 0 12px">Talent Nexus</p>' +
      '<p style="font-size:10px;color:#bbb;margin:0">Suite 10 & 11, The Sanctuary, 23 Oak Hill Grove, Surbiton, Surrey KT6 6DU</p>' +
      '<p style="font-size:10px;color:#bbb;margin:4px 0 0">This is an auto-generated email. Please do not reply directly.</p></td></tr>' +
      '</table></td></tr></table></body></html>';

    MailApp.sendEmail({
      to: cleanTo,
      subject: subject,
      htmlBody: htmlBody,
      attachments: [blob]
    });

    try {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var s = ss.getSheetByName("RequestLog");
      if (s) s.appendRow([new Date(), "email_sent", empName, cleanTo]);
    } catch (e2) {}

    return true;
  } catch (e) {
    try {
      var ss2 = SpreadsheetApp.openById(SHEET_ID);
      var s2 = ss2.getSheetByName("RequestLog");
      if (s2) s2.appendRow([new Date(), "email_failed", empName, e.toString()]);
    } catch (e3) {}
    return false;
  }
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
    sendPdfEmail(emailTo, "Your Payslip — Talent Nexus", empName,
      buildPayslipShell(pagesHtml), "Payslip_" + empName.replace(/\s+/g, "_") + ".pdf", "payslip");
  }

  return buildPayslipShell(pagesHtml);
}

function buildPayslipShell(pagesHtml) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page { size: A4; margin: 10mm 12mm; }' +
    'body { font-family: "Segoe UI","Helvetica Neue",Arial,sans-serif; color: #1a1a2e; font-size: 9.5pt; line-height: 1.5; }' +
    '.page-break { page-break-after: always; }' +
    '.page-break:last-child { page-break-after: avoid; }' +
    // Top bar
    '.top-bar { background: #1a1a2e; color: #fff; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; }' +
    '.logo-box { display: flex; align-items: center; gap: 8px; }' +
    '.logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg,#c9a84c,#a8882e); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 900; }' +
    '.logo-text .co-name { font-size: 14pt; font-weight: 800; letter-spacing: 0.5px; color: #fff; }' +
    '.logo-text .co-tag { font-size: 6pt; color: #c9a84c; text-transform: uppercase; letter-spacing: 2px; }' +
    '.payslip-label { text-align: right; }' +
    '.payslip-label .ps-title { font-size: 12pt; font-weight: 800; color: #c9a84c; letter-spacing: 2px; text-transform: uppercase; }' +
    '.payslip-label .ps-month { font-size: 7pt; color: #aaa; }' +
    // Main content
    '.content { padding: 10px 14px; }' +
    // Section headers
    '.sec-title { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #c9a84c; border-bottom: 2px solid #1a1a2e; padding-bottom: 3px; margin: 12px 0 6px; }' +
    // Info grid
    '.info-grid { display: flex; flex-wrap: wrap; border: 1px solid #ddd; }' +
    '.info-item { width: 50%; display: flex; border-bottom: 1px solid #eee; }' +
    '.info-item:nth-child(odd) { border-right: 1px solid #eee; }' +
    '.info-lbl { width: 35%; background: #f8f8f8; padding: 5px 8px; font-size: 7.5pt; font-weight: 600; color: #555; }' +
    '.info-val { width: 65%; padding: 5px 8px; font-size: 8.5pt; }' +
    // Salary table
    'table.salary { width: 100%; border-collapse: collapse; margin: 6px 0; }' +
    'table.salary th { background: #1a1a2e; color: #c9a84c; padding: 6px 10px; font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; text-align: left; }' +
    'table.salary th.amt { text-align: right; }' +
    'table.salary td { padding: 5px 10px; font-size: 8.5pt; border-bottom: 1px solid #eee; }' +
    'table.salary td.amt { text-align: right; font-weight: 500; }' +
    'table.salary tr.subtotal td { font-weight: 700; border-top: 2px solid #1a1a2e; border-bottom: none; }' +
    // Summary box
    '.summary-box { margin-top: 10px; border: 2px solid #1a1a2e; padding: 8px 12px; }' +
    '.sum-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 9pt; }' +
    '.sum-row.net { font-size: 13pt; font-weight: 800; color: #1a1a2e; border-top: 2px solid #1a1a2e; margin-top: 4px; padding-top: 6px; }' +
    '.sum-row.net .sum-val { color: #1a6b3c; }' +
    // Footer
    '.footer { margin-top: 16px; padding: 8px 14px; border-top: 1px solid #ddd; text-align: center; font-size: 6.5pt; color: #999; }' +
    '.footer .disc { margin-bottom: 2px; }' +
    '.footer .contact { color: #bbb; }' +
    // Watermark
    '.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 80pt; color: rgba(201,168,76,0.03); font-weight: 900; pointer-events: none; white-space: nowrap; }' +
    '</style></head><body>' +
    '<div class="watermark">TALENT NEXUS</div>' +
    pagesHtml + '</body></html>';
}

function buildPayslipPage(d) {
  var fmt = function(n) { return n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); };
  var infoItem = function(lbl,val) {
    return '<div class="info-item"><div class="info-lbl">' + esc(lbl) + '</div><div class="info-val">' + esc(val) + '</div></div>';
  };
  var earnRow = function(lbl,amt) {
    return '<tr><td>' + esc(lbl) + '</td><td class="amt">' + (amt > 0 ? '$' + fmt(amt) : '—') + '</td></tr>';
  };
  var dedRow = function(lbl,amt) {
    return '<tr><td>' + esc(lbl) + '</td><td class="amt">' + (amt > 0 ? '$' + fmt(amt) : '—') + '</td></tr>';
  };

  return '<div class="page-break">' +
    // TOP BAR with logo
    '<div class="top-bar">' +
    '<div class="logo-box">' +
    '<div class="logo-icon">TN</div>' +
    '<div class="logo-text"><div class="co-name">TALENT NEXUS</div><div class="co-tag">Connecting Talent. Creating Impact.</div></div>' +
    '</div>' +
    '<div class="payslip-label"><div class="ps-title">Payslip</div><div class="ps-month">' + esc(d.monthLabel) + '</div></div>' +
    '</div>' +

    '<div class="content">' +

    // Employee Information
    '<div class="sec-title">Employee Information</div>' +
    '<div class="info-grid">' +
    infoItem('Employee Name', d.employeeName) +
    infoItem('Employee ID', d.employeeId) +
    infoItem('Department', d.department) +
    infoItem('Designation', d.designation) +
    infoItem('Pay Period', d.payPeriodFrom + ' — ' + d.payPeriodTo) +
    infoItem('Payment Date', d.paymentDate) +
    infoItem('Bank Name', d.bankName) +
    infoItem('Account Number', d.accountNumber) +
    '</div>' +

    // Salary Breakdown — side by side
    '<div style="display:flex;gap:12px;margin-top:8px;">' +

    // Earnings
    '<div style="flex:1;">' +
    '<table class="salary"><thead><tr><th>EARNINGS</th><th class="amt">AMOUNT (USD)</th></tr></thead><tbody>' +
    earnRow('Basic Salary', d.basic) +
    earnRow('Allowance', d.allowance) +
    earnRow('Attendance Bonus', d.bonus) +
    earnRow('Overtime Pay', d.overtime) +
    earnRow('Commission', d.commission) +
    '<tr class="subtotal"><td>Gross Earnings</td><td class="amt" style="color:#c9a84c;">$' + fmt(d.gross) + '</td></tr>' +
    '</tbody></table></div>' +

    // Deductions
    '<div style="flex:1;">' +
    '<table class="salary"><thead><tr><th>DEDUCTIONS</th><th class="amt">AMOUNT (USD)</th></tr></thead><tbody>' +
    dedRow('Income Tax', d.tax) +
    dedRow('EPF / ETF', d.epf) +
    dedRow('Insurance', d.insurance) +
    dedRow('Loan Deduction', d.loan) +
    dedRow('Other Deductions', d.otherDeduction) +
    '<tr class="subtotal"><td>Total Deductions</td><td class="amt" style="color:#c9a84c;">$' + fmt(d.totalDeductions) + '</td></tr>' +
    '</tbody></table></div>' +

    '</div>' +

    // Net Pay Summary
    '<div class="summary-box">' +
    '<div class="sum-row"><span>Gross Salary</span><span>USD &nbsp; $' + fmt(d.gross) + '</span></div>' +
    '<div class="sum-row"><span>Total Deductions</span><span>USD &nbsp; $' + fmt(d.totalDeductions) + '</span></div>' +
    '<div class="sum-row net"><span>NET PAY</span><span class="sum-val">USD &nbsp; $' + fmt(d.netPay) + '</span></div>' +
    '</div>' +

    // Amount in words
    '<div style="margin-top:6px;font-size:7.5pt;color:#666;">' +
    '<b>Amount in Words:</b> ' + numberToWords(d.netPay) + ' only.</div>' +

    '</div>' +

    // Footer
    '<div class="footer">' +
    '<div class="disc">This is a computer-generated payslip and does not require a signature.</div>' +
    '<div class="contact">Talent Nexus &bull; Suite 10 & 11, The Sanctuary, 23 Oak Hill Grove, Surbiton, Surrey KT6 6DU &bull; hello@talentnexus.com</div>' +
    '</div>' +

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

  var firstName = esc(empName.split(" ")[0]);
  var defaultBody = '<p>This is to certify that <b>' + esc(empName) + '</b> has been employed with <b>Talent Nexus</b> from <b>' + esc(trainingStart || officialDate) + '</b>. During their tenure, they demonstrated exceptional professionalism, dedication, and integrity in all assigned responsibilities.</p>' +
    '<p>As a <b>' + esc(position) + '</b> within the ' + esc(shift || "operations") + ' team, ' + firstName + ' consistently met performance expectations, collaborated effectively with colleagues, and contributed positively to the organizational goals. Their conduct and work ethic have been exemplary throughout their service period.</p>' +
    '<p>We confirm that ' + firstName + ' has satisfactorily completed all responsibilities and obligations during their employment. There are no outstanding matters or dues pending from their side.</p>' +
    '<p>We wish ' + firstName + ' the very best in all future endeavors and have no hesitation in recommending them for any position they may seek.</p>';

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page { size: A4; margin: 15mm 16mm; }' +
    'body { font-family: "Segoe UI","Helvetica Neue",Arial,sans-serif; color: #1a1a2e; font-size: 10pt; line-height: 1.8; }' +
    // Top bar
    '.top-bar { background: #1a1a2e; padding: 10px 0; margin-bottom: 16px; }' +
    '.top-bar .inner { text-align: center; }' +
    '.top-bar .logo-icon { display: inline-block; width: 32px; height: 32px; background: linear-gradient(135deg,#c9a84c,#a8882e); border-radius: 4px; color: #fff; font-size: 14px; font-weight: 900; line-height: 32px; vertical-align: middle; margin-right: 6px; }' +
    '.top-bar .co { display: inline-block; vertical-align: middle; text-align: left; }' +
    '.top-bar .co-name { font-size: 14pt; font-weight: 800; color: #fff; letter-spacing: 0.5px; }' +
    '.top-bar .co-tag { font-size: 6pt; color: #c9a84c; text-transform: uppercase; letter-spacing: 2px; }' +
    // Title
    '.cert-title { text-align: center; font-size: 14pt; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin: 14px 0 4px; }' +
    '.cert-line { width: 60px; height: 2px; background: #c9a84c; margin: 0 auto 14px; }' +
    // Content
    '.ref-no { font-size: 7.5pt; color: #999; margin-bottom: 10px; }' +
    '.date-row { text-align: right; font-size: 9pt; margin-bottom: 10px; }' +
    '.to-line { font-size: 9pt; font-weight: 700; margin-bottom: 12px; }' +
    '.letter-body { font-size: 10pt; text-align: justify; margin-bottom: 10px; }' +
    '.letter-body p { margin: 0 0 8px; }' +
    // Info table
    'table.details { width: 100%; border-collapse: collapse; margin: 14px 0; border: 1px solid #ddd; }' +
    'table.details td { padding: 5px 10px; font-size: 8.5pt; border: 1px solid #eee; }' +
    'table.details td.lbl { background: #f8f8f8; font-weight: 600; width: 30%; color: #555; }' +
    // Signature block
    '.sig-block { margin-top: 30px; }' +
    '.sig-block .line { border-top: 1.5px solid #1a1a2e; width: 180px; margin-bottom: 4px; }' +
    '.sig-block .sig-name { font-weight: 700; font-size: 10pt; }' +
    '.sig-block .sig-role { font-size: 7.5pt; color: #666; }' +
    '.sig-block .sig-dept { font-size: 8pt; color: #c9a84c; font-weight: 600; margin-top: 2px; }' +
    // Footer bar
    '.ft-bar { margin-top: 24px; padding: 8px 0; border-top: 1px solid #ddd; text-align: center; font-size: 6.5pt; color: #999; }' +
    '</style></head><body>' +

    // Top bar
    '<div class="top-bar"><div class="inner">' +
    '<div class="logo-icon">TN</div>' +
    '<div class="co"><div class="co-name">TALENT NEXUS</div><div class="co-tag">Connecting Talent. Creating Impact.</div></div>' +
    '</div></div>' +

    '<div class="cert-title">EXPERIENCE CERTIFICATE</div>' +
    '<div class="cert-line"></div>' +

    '<div class="ref-no">Ref: TN/HR/EXP/' + new Date().getFullYear() + '/' + Math.floor(Math.random()*9000+1000) + '</div>' +
    '<div class="date-row"><b>Date:</b> ' + esc(certDate) + '</div>' +
    '<div class="to-line">TO WHOM IT MAY CONCERN</div>' +

    '<div class="letter-body">' + (bodyText ? '<p>' + esc(bodyText) + '</p>' : defaultBody) + '</div>' +

    '<table class="details">' +
    '<tr><td class="lbl">Employee Name</td><td>' + esc(empName) + '</td></tr>' +
    '<tr><td class="lbl">Position Held</td><td>' + esc(position) + '</td></tr>' +
    '<tr><td class="lbl">Shift / Team</td><td>' + esc(shift) + '</td></tr>' +
    '<tr><td class="lbl">Training Start Date</td><td>' + esc(trainingStart) + '</td></tr>' +
    '<tr><td class="lbl">Official Working Date</td><td>' + esc(officialDate) + '</td></tr>' +
    '<tr><td class="lbl">Address on Record</td><td>' + esc(address) + '</td></tr>' +
    '</table>' +

    '<div class="sig-block">' +
    '<div class="line"></div>' +
    '<div class="sig-name">HR Department</div>' +
    '<div class="sig-role">Human Resources Representative</div>' +
    '<div class="sig-dept">TALENT NEXUS</div>' +
    '</div>' +

    '<div class="ft-bar">' +
    '<b>Talent Nexus</b> &bull; Suite 10 & 11, The Sanctuary, 23 Oak Hill Grove, Surbiton, Surrey KT6 6DU &bull; hr@talentnexus.com &bull; This is a computer-generated document.' +
    '</div>' +

    '</body></html>';

  logRequest("experience", empName, "");

  // Send email asynchronously
  if (emailTo && isValidEmail(emailTo)) {
    sendPdfEmail(emailTo, "Experience Certificate — Talent Nexus", empName,
      html, "Experience_Letter_" + empName.replace(/\s+/g, "_") + ".pdf", "experience");
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

function numberToWords(n) {
  var ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  var tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n === 0) return "Zero";
  var dollars = Math.floor(n);
  var cents = Math.round((n - dollars) * 100);
  var result = "";
  if (dollars >= 1000) { result += ones[Math.floor(dollars/1000)] + " Thousand "; dollars %= 1000; }
  if (dollars >= 100) { result += ones[Math.floor(dollars/100)] + " Hundred "; dollars %= 100; }
  if (dollars >= 20) { result += tens[Math.floor(dollars/10)] + " "; dollars %= 10; }
  if (dollars > 0) { result += ones[dollars] + " "; }
  result = result.trim() || "Zero";
  if (cents > 0) result += " and " + cents + "/100";
  return result;
}
