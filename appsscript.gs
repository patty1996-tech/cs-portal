// CS Portal — Payslip & Experience Letter Generator
// Deploy as Web App (Execute as: Me, Who has access: Anyone)

var SHEET_ID = "1n6fDjRCi17yp0KQ9lP29ARtqJVg0V_YgV_l9m4FjiCw";
var HR_NAME = "Hannah Cortez";
var HR_EMAIL = "hr@talentnexus.com";
var CO_WEBSITE = "www.talentnexus.com";
var CO_ADDRESS_UK = "Suite 10 & 11, The Sanctuary, 23 Oak Hill Grove, Surbiton, Surrey KT6 6DU, United Kingdom";
var CO_ADDRESS_TH = "The Offices at CentralWorld, 999/9 Rama I Road, 28th Floor, Pathum Wan, Bangkok 10330, Thailand";
var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwtcjR_XMIyZFixa3RymCqIymRP6csBSuVoGGb8UyDo69iIJaQtjwHYqce7tn-S-gjZ/exec";

function doGet(e) {
  var p = e.parameter || {};
  var token = str(p.token);

  // Token-based document retrieval (from email "Download" link)
  if (token) {
    return handleDocumentToken(token);
  }

  return ContentService.createTextOutput("CS Employee Portal API v3.0 — Operational");
}

function doPost(e) {
  try {
    var d = {};
    if (e.postData && e.postData.type === "application/json") {
      d = JSON.parse(e.postData.contents);
    } else {
      d = e.parameter || {};
    }
    var action = d.action || "";

    if (action === "generate_payslip") {
      var html = generatePayslipHtml(d);
      var startDt = parseDateFlex(str(d.payPeriodFrom));
      var periodName = startDt ? (monthName(startDt) + "_" + startDt.getFullYear()) : "Monthly";
      var filename = safeFilename(d.employeeName || "Employee") + "_" + periodName + "_Payslip.pdf";
      sendEmailIfRequested(d, html, filename, "payslip");
      return returnPdf(html, filename);
    }

    if (action === "generate_experience") {
      var html2 = generateExperienceHtml(d);
      var filename2 = safeFilename(d.employeeName || "Employee") + "_Experience_Letter.pdf";
      sendEmailIfRequested(d, html2, filename2, "experience");
      return returnPdf(html2, filename2);
    }

    return json({ error: "Unknown action: " + action });
  } catch (err) {
    return json({ error: err.toString() });
  }
}

// ==================== DOCUMENT TOKEN RETRIEVAL ====================

function handleDocumentToken(token) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("DocumentTokens");
    if (!s) return pdfError("Token not found or expired.");
    var data = s.getDataRange().getValues();
    var found = null;
    for (var i = 1; i < data.length; i++) {
      if (str(data[i][0]) === token) {
        found = { type: str(data[i][1]), payload: str(data[i][2]) };
        break;
      }
    }
    if (!found) return pdfError("Token not found or expired.");
    if (found.type === "payslip") {
      var d = JSON.parse(found.payload);
      var html = generatePayslipHtml(d);
      var startDt = parseDateFlex(str(d.payPeriodFrom));
      var periodName = startDt ? (monthName(startDt) + "_" + startDt.getFullYear()) : "Monthly";
      var filename = safeFilename(d.employeeName || "Employee") + "_" + periodName + "_Payslip.pdf";
      return returnPdf(html, filename);
    }
    if (found.type === "experience") {
      var d2 = JSON.parse(found.payload);
      var html2 = generateExperienceHtml(d2);
      var filename2 = safeFilename(d2.employeeName || "Employee") + "_Experience_Letter.pdf";
      return returnPdf(html2, filename2);
    }
    return pdfError("Unknown document type.");
  } catch (err) {
    return pdfError(err.toString());
  }
}

function pdfError(msg) {
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><body style="font-family:Arial;padding:40px;text-align:center">' +
    '<h3 style="color:#c0392b">Document Unavailable</h3>' +
    '<p style="color:#666">' + esc(msg) + '</p>' +
    '<p style="color:#999;font-size:12px">Tokens expire after 7 days.</p>' +
    '<a href="https://bit.ly/TNPortal" style="color:#c9a84c">Go to Talent Nexus Portal</a>' +
    '</body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== PAYSLIP GENERATION ====================

function generatePayslipHtml(d) {
  var empName = str(d.employeeName), empId = str(d.employeeId);
  var dept = str(d.department), desig = str(d.designation);
  var pFrom = str(d.payPeriodFrom), pTo = str(d.payPeriodTo), pDate = str(d.paymentDate);
  var bank = str(d.bankName), acct = str(d.accountNumber);
  var basic = num(d.basicSalary), allow = num(d.allowance), bonus = num(d.attendanceBonus);
  var ot = num(d.overtime), comm = num(d.commission);
  var tax = num(d.tax), epf = num(d.epfEtf), ins = num(d.insurance);
  var loan = num(d.loanDeduction), other = num(d.otherDeduction);
  var gross = basic + allow + bonus + ot + comm;
  var totalDed = tax + epf + ins + loan + other;
  var net = gross - totalDed;
  var months = Math.max(1, Math.min(12, parseInt(d.months) || 1));
  if (!empName || !empId) return "<h3>Error: Employee Name and Employee ID are required.</h3>";
  var startDate = parseDateFlex(pFrom), endDate = parseDateFlex(pTo), payDate = parseDateFlex(pDate);
  var pagesHtml = "";
  for (var m = 0; m < months; m++) {
    var mlbl = "", curFrom = pFrom, curTo = pTo, curPay = pDate;
    if (startDate && endDate && months > 1) {
      var s = new Date(startDate); s.setMonth(s.getMonth() + m);
      var e = new Date(endDate); e.setMonth(e.getMonth() + m);
      curFrom = fmtDate(s); curTo = fmtDate(e); mlbl = monthName(s) + " " + s.getFullYear();
    } else if (months > 1) { mlbl = "Month " + (m + 1) + " of " + months; }
    if (payDate && months > 1) { var p = new Date(payDate); p.setMonth(p.getMonth() + m); curPay = fmtDate(p); }
    pagesHtml += payslipPage(empName, empId, dept, desig, curFrom, curTo, curPay, bank, acct, basic, allow, bonus, ot, comm, tax, epf, ins, loan, other, gross, totalDed, net, mlbl);
  }
  logRequest("payslip", empName, empId, str(d.processedBy));
  return payslipShell(pagesHtml);
}

function payslipShell(pages) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page{size:A4;margin:8mm 10mm}body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:#1a1a2e;font-size:9pt;line-height:1.45;margin:0}' +
    '.pb{page-break-after:always}.pb:last-child{page-break-after:avoid}' +
    '.hdr{width:100%;background:#1a1a2e;padding:10px 0}.hdr-tbl{width:100%}.hdr-tbl td{padding:4px 12px}' +
    '.hdr-logo{width:34px;height:34px;background:#c9a84c;text-align:center;color:#fff;font-weight:900;font-size:15px}' +
    '.hdr-co{color:#fff;font-size:13pt;font-weight:700;}.hdr-tag{color:#c9a84c;font-size:6.5pt;text-transform:uppercase;letter-spacing:1.5px}' +
    '.hdr-label{text-align:right;color:#c9a84c;font-size:11pt;font-weight:700;text-transform:uppercase}.hdr-month{text-align:right;color:#999;font-size:7pt}' +
    '.ctn{padding:6px 12px}.sec{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8b6914;border-bottom:1.5px solid #1a1a2e;padding-bottom:2px;margin:10px 0 5px}' +
    '.itbl{width:100%;border-collapse:collapse;border:1px solid #ddd;margin-bottom:6px}.itbl td{padding:4px 8px;font-size:8pt;border:1px solid #eee}' +
    '.itbl td.lbl{background:#f8f8f8;font-weight:600;color:#555;width:22%;font-size:7pt}' +
    '.stbl{width:100%;border-collapse:collapse;margin-bottom:4px}.stbl th{background:#1a1a2e;color:#c9a84c;padding:5px 10px;font-size:7.5pt;text-transform:uppercase;text-align:left}' +
    '.stbl th.rt{text-align:right}.stbl td{padding:4px 10px;font-size:8pt;border-bottom:1px solid #eee}.stbl td.rt{text-align:right}' +
    '.stbl tr.sub td{font-weight:700;border-top:2px solid #1a1a2e}' +
    '.sbox{margin-top:8px;border:2px solid #1a1a2e;padding:6px 14px}.srow{padding:2px 0;font-size:8.5pt}' +
    '.srow.net{font-size:12pt;font-weight:700;border-top:2px solid #1a1a2e;margin-top:3px;padding-top:4px;color:#1a1a2e}.srow .val{float:right}' +
    '.words{font-size:7pt;color:#666;margin-top:4px}.ft{margin-top:14px;border-top:1px solid #ddd;padding:6px 12px;text-align:center;font-size:6.5pt;color:#999}.clear{clear:both}' +
    '</style></head><body>' + pages + '</body></html>';
}

function payslipPage(nm,id,dp,ds,pf,pt,pd,bk,ac,ba,al,bo,ot,cm,tx,ep,ins,ln,oh,gr,td,nt,mlbl) {
  var fmt = function(v){return v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});};
  var amt = function(v){return v>0?"$"+fmt(v):"—";};
  var row = function(l,v){return '<tr><td>'+esc(l)+'</td><td class="rt">'+v+'</td></tr>';};
  var nfo = function(l,v){return '<tr><td class="lbl">'+esc(l)+'</td><td>'+esc(v)+'</td></tr>';};
  return '<div class="pb"><table class="hdr-tbl"><tr>' +
    '<td width="40"><table><tr><td class="hdr-logo">TN</td></tr></table></td>' +
    '<td><div class="hdr-co">TALENT NEXUS</div><div class="hdr-tag">Connecting Talent. Creating Impact.</div></td>' +
    '<td align="right"><div class="hdr-label">PAYSLIP</div><div class="hdr-month">' + esc(mlbl||"") + '</div></td>' +
    '</tr></table><div class="ctn">' +
    '<div class="sec">Employee Information</div><table class="itbl">' +
    nfo('Employee Name',nm) + nfo('Employee ID',id) + nfo('Department',dp) + nfo('Designation',ds) +
    nfo('Pay Period',pf+' — '+pt) + nfo('Payment Date',pd) + nfo('Bank Name',bk) + nfo('Account Number',ac) +
    '</table><table width="100%"><tr><td width="50%" style="vertical-align:top;padding-right:6px">' +
    '<table class="stbl"><thead><tr><th>EARNINGS</th><th class="rt">AMOUNT (USD)</th></tr></thead><tbody>' +
    row('Basic Salary',amt(ba)) + row('Allowance',amt(al)) + row('Attendance Bonus',amt(bo)) +
    row('Overtime Pay',amt(ot)) + row('Commission',amt(cm)) +
    '<tr class="sub"><td>Gross Earnings</td><td class="rt">$'+fmt(gr)+'</td></tr></tbody></table>' +
    '</td><td width="50%" style="vertical-align:top;padding-left:6px">' +
    '<table class="stbl"><thead><tr><th>DEDUCTIONS</th><th class="rt">AMOUNT (USD)</th></tr></thead><tbody>' +
    row('Income Tax',amt(tx)) + row('EPF / ETF',amt(ep)) + row('Insurance',amt(ins)) +
    row('Loan Deduction',amt(ln)) + row('Other Deductions',amt(oh)) +
    '<tr class="sub"><td>Total Deductions</td><td class="rt">$'+fmt(td)+'</td></tr></tbody></table>' +
    '</td></tr></table><div class="sbox"><div class="srow"><span>Gross Salary</span><span class="val">USD &nbsp; $'+fmt(gr)+'</span></div><div class="clear"></div>' +
    '<div class="srow"><span>Total Deductions</span><span class="val">USD &nbsp; $'+fmt(td)+'</span></div><div class="clear"></div>' +
    '<div class="srow net"><span>NET PAY</span><span class="val">USD &nbsp; $'+fmt(nt)+'</span></div><div class="clear"></div></div>' +
    '<div class="words"><b>Amount in Words:</b> ' + numberToWords(nt) + ' only.</div></div>' +
    '<div class="ft">This is a computer-generated payslip.<br><b>Talent Nexus</b> &bull; ' + CO_WEBSITE + ' &bull; ' + HR_EMAIL + '</div></div>';
}

// ==================== EXPERIENCE LETTER GENERATION ====================

function generateExperienceHtml(d) {
  var empName = str(d.employeeName), position = str(d.position);
  var shift = str(d.shift), trainStart = str(d.trainingStart);
  var offDate = str(d.officialDate), address = str(d.address);
  var certDate = str(d.certDate) || new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  var bodyText = str(d.bodyText);
  var firstName = esc(empName.split(" ")[0]);
  if (!empName || !position) return "<h3>Error: Employee Name and Position are required.</h3>";
  var defaultBody = '<p>This is to certify that <b>' + esc(empName) + '</b> was employed with <b>Talent Nexus</b>. During their tenure as <b>' + esc(position) + '</b>, they demonstrated outstanding professionalism and commitment to excellence.</p>' +
    '<p>We confirm that ' + firstName + ' has satisfactorily discharged all duties and responsibilities. We recommend ' + firstName + ' for any future position and wish them continued success.</p>';
  var refNo = "TN/HR/EXP/" + new Date().getFullYear() + "/" + Math.floor(Math.random()*9000+1000);
  logRequest("experience", empName, "", str(d.processedBy));
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page{size:A4;margin:14mm 15mm}body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:#1a1a2e;font-size:10pt;line-height:1.7;margin:0}' +
    '.hdr{width:100%;background:#1a1a2e;padding:10px 16px}.hdr-tbl{width:100%}.hdr-tbl td{padding:2px 8px}' +
    '.hdr-logo{width:30px;height:30px;background:#c9a84c;text-align:center;color:#fff;font-weight:900;font-size:13px}' +
    '.hdr-co{color:#fff;font-size:12pt;font-weight:700}.hdr-tag{color:#c9a84c;font-size:6pt;text-transform:uppercase;letter-spacing:1.5px}' +
    '.title{text-align:center;font-size:13pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:14px 0 2px}' +
    '.line{width:50px;height:2px;background:#c9a84c;margin:0 auto 12px}' +
    '.ref{font-size:7pt;color:#999;margin-bottom:8px}.drow{text-align:right;font-size:8.5pt;margin-bottom:8px}' +
    '.to{font-size:8.5pt;font-weight:700;margin-bottom:10px}' +
    '.body-text{font-size:10pt;text-align:justify;margin-bottom:8px;line-height:1.9}.body-text p{margin:0 0 14px}' +
    '.dtbl{width:100%;border-collapse:collapse;border:1px solid #ddd;margin:12px 0}' +
    '.dtbl td{padding:4px 10px;font-size:8pt;border:1px solid #eee}.dtbl td.lbl{background:#f8f8f8;font-weight:600;color:#555;width:28%}' +
    '.sig{margin-top:26px}.sig-sign{font-family:"Segoe Script","Brush Script MT",cursive;font-size:16pt;color:#1a1a2e;margin-bottom:4px}' +
    '.sig-line{border-top:1.5px solid #1a1a2e;width:170px;margin-bottom:3px}.sig-name{font-weight:700;font-size:9.5pt}' +
    '.sig-role{font-size:7.5pt;color:#666}.sig-hr{font-size:7.5pt;color:#c9a84c;font-weight:600;margin-top:1px}' +
    '.ft{margin-top:20px;border-top:1px solid #ddd;padding-top:6px;text-align:center;font-size:6.5pt;color:#aaa}' +
    '</style></head><body>' +
    '<table class="hdr-tbl"><tr><td width="34"><table><tr><td class="hdr-logo">TN</td></tr></table></td>' +
    '<td><div class="hdr-co">TALENT NEXUS</div><div class="hdr-tag">Connecting Talent. Creating Impact.</div></td></tr></table>' +
    '<div class="title">EXPERIENCE CERTIFICATE</div><div class="line"></div>' +
    '<div class="ref">Ref: ' + refNo + '</div><div class="drow"><b>Date:</b> ' + esc(certDate) + '</div>' +
    '<div class="to">TO WHOM IT MAY CONCERN</div><div class="body-text">' + (bodyText || defaultBody) + '</div>' +
    '<table class="dtbl">' +
    '<tr><td class="lbl">Employee Name</td><td>' + esc(empName) + '</td></tr>' +
    '<tr><td class="lbl">Position Held</td><td>' + esc(position) + '</td></tr>' +
    '<tr><td class="lbl">Shift / Team</td><td>' + esc(shift) + '</td></tr>' +
    '<tr><td class="lbl">Training Start Date</td><td>' + esc(trainStart) + '</td></tr>' +
    '<tr><td class="lbl">Working Start Date</td><td>' + esc(offDate) + '</td></tr>' +
    '<tr><td class="lbl">Address on Record</td><td>' + esc(address) + '</td></tr></table>' +
    '<div class="sig"><div class="sig-sign">' + HR_NAME + '</div><div class="sig-line"></div>' +
    '<div class="sig-name">' + HR_NAME + '</div><div class="sig-role">Human Resources Representative</div><div class="sig-hr">TALENT NEXUS</div></div>' +
    '<div class="ft"><b>Talent Nexus</b> &bull; ' + CO_WEBSITE + ' &bull; ' + HR_EMAIL + '</div></body></html>';
}

// ==================== EMAIL ====================

function sendEmailIfRequested(d, htmlContent, filename, docType) {
  var emailTo = str(d.emailTo);
  if (!emailTo || !isValidEmail(emailTo)) return;
  var empName = str(d.employeeName) || "Employee";
  var today = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  var token = storeDocumentToken(docType, d);
  var docLink = APPS_SCRIPT_URL + "?token=" + encodeURIComponent(token);
  var docLabel = docType === "payslip" ? "Payslip" : "Experience Certificate";
  var docMsg = "Your " + docLabel.toLowerCase() + " is ready. Click Download to view, print, or save.";

  try {
    var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;border:1px solid #e2e2e2;border-radius:8px;background:#fff">' +
      '<div style="background:#1a1a2e;padding:22px 28px;text-align:center"><h1 style="color:#c9a84c;margin:0;font-size:20px">TALENT NEXUS</h1></div>' +
      '<div style="padding:24px 28px"><p style="font-size:14px;color:#333">Dear <b>' + esc(empName) + '</b>,</p>' +
      '<p style="font-size:13px;color:#555">' + docMsg + '</p>' +
      '<a href="' + docLink + '" style="display:inline-block;background:#c9a84c;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px">Download ' + docLabel + '</a>' +
      '<p style="font-size:11px;color:#999;margin-top:16px">For inquiries contact <a href="mailto:' + HR_EMAIL + '">' + HR_EMAIL + '</a></p></div>' +
      '<div style="background:#fafafa;padding:18px 28px;text-align:center;border-top:1px solid #eee">' +
      '<p style="font-size:12px;color:#555"><b>With Regards,</b></p><p style="font-size:13px;color:#1a1a2e">' + HR_NAME + '</p>' +
      '<p style="font-size:10px;color:#999">Human Resources &bull; Talent Nexus</p></div></div>';

    MailApp.sendEmail({
      to: emailTo.trim(),
      subject: docLabel + " — Talent Nexus",
      htmlBody: htmlBody,
      body: "Dear " + empName + ",\n\n" + docMsg + "\n\nView & Print: " + docLink,
      name: "Talent Nexus HR",
      replyTo: HR_EMAIL
    });

    try {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var s = ss.getSheetByName("RequestLog");
      if (s) s.appendRow([new Date(), "email_sent", empName, emailTo.trim(), str(d.processedBy)]);
    } catch(e2) {}
  } catch(e) {}
}

// ==================== TOKEN SYSTEM ====================

function storeDocumentToken(docType, formData) {
  var token = "TK-" + new Date().getTime().toString(36) + "-" + Math.random().toString(36).substring(2, 7);
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("DocumentTokens");
    if (!s) { s = ss.insertSheet("DocumentTokens"); s.appendRow(["Token","Type","Payload","CreatedAt"]); }
    s.appendRow([token, docType, JSON.stringify(formData), new Date()]);
    cleanupOldTokens(s);
  } catch(e) {}
  return token;
}

function cleanupOldTokens(sheet) {
  try {
    var data = sheet.getDataRange().getValues();
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    var rowsToDelete = [];
    for (var i = data.length - 1; i >= 1; i--) {
      if (new Date(data[i][3]) < cutoff) rowsToDelete.push(i + 1);
    }
    for (var j = 0; j < rowsToDelete.length; j++) { sheet.deleteRow(rowsToDelete[j]); }
  } catch(e) {}
}

// ==================== PDF RETURN ====================

function returnPdf(html, filename) {
  try {
    var cleanTitle = filename.replace(/\.pdf$/,"").replace(/_/g," ");
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + esc(cleanTitle) + '</title>' +
      '<style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:0}}' +
      'body{margin:0;padding:0;font-family:"Segoe UI",Arial,sans-serif;background:#f0f0f0}' +
      '.toolbar{position:fixed;top:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;z-index:999}' +
      '.toolbar span{font-size:13px;font-weight:600}' +
      '.toolbar button{background:#c9a84c;color:#fff;border:0;padding:8px 20px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;margin-left:8px}' +
      '.toolbar button.sec{background:transparent;border:1px solid #666;color:#ccc}' +
      '@media print{.toolbar{display:none}}' +
      '.preview{margin-top:44px;background:#fff;max-width:210mm;margin-left:auto;margin-right:auto;box-shadow:0 2px 20px rgba(0,0,0,0.15)}' +
      '</style></head><body>' +
      '<div class="toolbar"><span>Talent Nexus</span><div>' +
      '<button class="sec" onclick="window.close()">Close</button>' +
      '<button class="sec" onclick="downloadFile()">Download</button>' +
      '<button onclick="window.print()">Save as PDF</button></div></div>' +
      '<div class="preview">' + html + '</div>' +
      '<script>function downloadFile(){var b=new Blob([document.documentElement.outerHTML],{type:"text/html"});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="' + esc(cleanTitle) + '.html";a.click()}setTimeout(function(){window.print()},800)</script></body></html>'
    ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch(e) {
    return HtmlService.createHtmlOutput('<p>Error: ' + esc(e.toString()) + '</p>');
  }
}

// ==================== HELPERS ====================

function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function str(v) { return String(v||"").trim(); }
function num(v) { var n=parseFloat(v); return isNaN(n)?0:n; }
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim()); }
function safeFilename(s) { return String(s||"document").replace(/[^a-zA-Z0-9_\- ]/g,"").replace(/\s+/g,"_").substring(0,80); }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function logRequest(type, empName, empId, processedBy) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("RequestLog");
    if (!s) { s = ss.insertSheet("RequestLog"); s.appendRow(["Timestamp","Type","EmployeeName","EmployeeID","ProcessedBy"]); }
    s.appendRow([new Date(), type, empName, empId, processedBy || ""]);
  } catch(e) {}
}

function parseDateFlex(s) {
  if (!s) return null;
  s = String(s).trim().replace(/-/g,"/");
  var parts = s.split("/");
  if (parts.length < 2) return null;
  var a = parseInt(parts[0]), b = parseInt(parts[1]), c = parseInt(parts[2]||"0");
  if (isNaN(a) || isNaN(b)) return null;
  if (a > 31) return new Date(a, b-1, c || 1);
  var yr = c; if (yr < 100) yr += 2000;
  return new Date(yr, b-1, a);
}

function fmtDate(d) {
  if (!d) return "";
  var day = d.getDate(), mon = d.getMonth()+1, yr = d.getFullYear();
  return (day<10?"0":"")+day+"/"+(mon<10?"0":"")+mon+"/"+String(yr).slice(-2);
}

function monthName(d) {
  if (!d) return "";
  return ["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()];
}

function numberToWords(n) {
  var ones=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  var tens=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if(n===0)return"Zero";
  var d=Math.floor(n),c=Math.round((n-d)*100),r="";
  if(d>=1000){r+=ones[Math.floor(d/1000)]+" Thousand ";d%=1000;}
  if(d>=100){r+=ones[Math.floor(d/100)]+" Hundred ";d%=100;}
  if(d>=20){r+=tens[Math.floor(d/10)]+" ";d%=10;}
  if(d>0){r+=ones[d]+" ";}
  r=r.trim()||"Zero";
  if(c>0)r+=" and "+c+"/100";
  return r;
}
