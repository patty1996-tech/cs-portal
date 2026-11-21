// CS Portal — Payslip & Experience Letter Generator
// Deploy as Web App (Execute as: Me, Who has access: Anyone)

var SHEET_ID = "1n6fDjRCi17yp0KQ9lP29ARtqJVg0V_YgV_l9m4FjiCw";
var HR_NAME = "Hannah Cortez";
var HR_EMAIL = "HannahCortezofficial@gmail.com";
var HR_REPLY_TO = "HannahCortezofficial@gmail.com";
var HR_SENDER_NAME = "Human Resources Department";
var HR_SIG_PHOTO = "data:image/png;base64,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";
var CO_WEBSITE = "www.talentnexus.com";
var CO_ADDRESS_UK = "Suite 10 & 11, The Sanctuary, 23 Oak Hill Grove, Surbiton, Surrey KT6 6DU, United Kingdom";
var CO_ADDRESS_TH = "The Offices at CentralWorld, 999/9 Rama I Road, 28th Floor, Pathum Wan, Bangkok 10330, Thailand";

var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzxfuyE7aoQRVu01b4ycoFGyJdI2nIjJfg_cbyZ5kRaTN09BhD-F34xKmXmQEDIeess/exec";

function doGet(e) {
  var p = e.parameter || {};
  var token = str(p.token);

  if (token) {
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
      if (found.type === "coe") {
        var d3 = JSON.parse(found.payload);
        var html3 = generateCoeHtml(d3);
        var filename3 = safeFilename(d3.employeeName || "Employee") + "_Certificate_of_Employment.pdf";
        return returnPdf(html3, filename3);
      }
      return pdfError("Unknown document type.");
    } catch (err) {
      return pdfError(err.toString());
    }
  }

  return ContentService.createTextOutput("CS Employee Portal API v2.1 — Operational")
    .setMimeType(ContentService.MimeType.TEXT);
}

function pdfError(msg) {
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzFhMWEyZSIvPjx0ZXh0IHg9IjE2IiB5PSIyMi41IiBmb250LWZhbWlseT0iQXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIuNSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNjOWE4NGMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlROPC90ZXh0Pjwvc3ZnPg=="></head><body style="font-family:Arial;padding:40px;text-align:center">' +
    '<h3 style="color:#c0392b">Document Unavailable</h3>' +
    '<p style="color:#666">' + esc(msg) + '</p>' +
    '<p style="color:#999;font-size:12px">Tokens expire after 7 days. Please generate a new document from the portal.</p>' +
    '<a href="https://bit.ly/TNPortal" style="color:#c9a84c">Go to Talent Nexus Portal</a>' +
    '</body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
    if (action === "generate_coe") {
      var html3 = generateCoeHtml(d);
      var filename3 = safeFilename(d.employeeName || "Employee") + "_Certificate_of_Employment.pdf";
      sendEmailIfRequested(d, html3, filename3, "coe");
      return returnPdf(html3, filename3);
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

function returnPdf(html, filename) {
  try {
    var cleanTitle = filename.replace(/\.pdf$/,"").replace(/_/g," ");
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzFhMWEyZSIvPjx0ZXh0IHg9IjE2IiB5PSIyMi41IiBmb250LWZhbWlseT0iQXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIuNSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNjOWE4NGMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlROPC90ZXh0Pjwvc3ZnPg=="><title>' + esc(cleanTitle) + '</title>' +
      '<style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:0}}' +
      'body{margin:0;padding:0;font-family:"Segoe UI",Arial,sans-serif;background:#f0f0f0}' +
      '.toolbar{position:fixed;top:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,0.3)}' +
      '.toolbar span{font-size:13px;font-weight:600}' +
      '.toolbar button{background:#c9a84c;color:#fff;border:0;padding:8px 20px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;margin-left:8px}' +
      '.toolbar button:hover{background:#d4b85e}' +
      '.toolbar button.sec{background:transparent;border:1px solid #666;color:#ccc}' +
      '.toolbar button.sec:hover{background:rgba(255,255,255,0.05)}' +
      '@media print{.toolbar{display:none}}' +
      '.preview{margin-top:44px;background:#fff;max-width:210mm;margin-left:auto;margin-right:auto;box-shadow:0 2px 20px rgba(0,0,0,0.15)}' +
      '</style></head><body>' +
      '<div class="toolbar"><span>Talent Nexus — Document Preview</span><div>' +
      '<button class="sec" onclick="window.close()">Close</button>' +
      '<button class="sec" onclick="downloadFile()">Download</button>' +
      '<button onclick="window.print()">Save as PDF</button></div></div>' +
      '<div class="preview">' + html + '</div>' +
      '<script>var fname="' + esc(cleanTitle.replace(/\s+/g,"_")) + '.html";' +
      'function downloadFile(){var b=new Blob([document.documentElement.outerHTML],{type:"text/html"});var u=URL.createObjectURL(b);var a=document.createElement("a");a.href=u;a.download=fname;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u)}' +
      'setTimeout(function(){window.print()},800);</script>' +
      '</body></html>'
    ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><body style="font-family:Arial;padding:30px;text-align:center">' +
      '<h3>Error</h3><p>' + esc(e.toString()) + '</p></body></html>'
    );
  }
}

function sendEmailIfRequested(d, htmlContent, filename, docType) {
  var emailTo = str(d.emailTo);
  if (!emailTo || !isValidEmail(emailTo)) return;
  var empName = str(d.employeeName) || "Employee";
  var today = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

  var token = storeDocumentToken(docType, d);
  var docLink = APPS_SCRIPT_URL + "?token=" + encodeURIComponent(token);

  var docLabel = docType === "payslip" ? "Payslip" : (docType === "coe" ? "Certificate of Employment" : "Experience Certificate");
  var docMsg = docType === "payslip"
    ? "Your payslip is ready. Click the Download button below to view, print, or save your document. For inquiries, contact the HR department."
    : (docType === "coe"
      ? "Your Certificate of Employment is ready. Click the Download button below to view, print, or save your document. For inquiries, contact the HR department."
      : "Your experience certificate is ready. Click the Download button below to view, print, or save your document. For inquiries, contact the HR department.");

  try {
    var cleanTo = emailTo.trim();

    var docContent = "";
    if (docType === "payslip") {
      var basic = num(d.basicSalary), allow = num(d.allowance), bonus = num(d.attendanceBonus);
      var otAmt = num(d.overtime), comm = num(d.commission);
      var taxAmt = num(d.tax), epfAmt = num(d.epfEtf), insAmt = num(d.insurance);
      var loanAmt = num(d.loanDeduction), otherAmt = num(d.otherDeduction);
      var gross = basic + allow + bonus + otAmt + comm;
      var totalDed = taxAmt + epfAmt + insAmt + loanAmt + otherAmt;
      var net = gross - totalDed;
      var fmt2 = function(v){return v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});};
      var amt2 = function(v){return v>0?"$"+fmt2(v):"—";};

      var earnRows = '';
      if (basic > 0) earnRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">Basic Salary</td><td style="padding:2px 14px;font-size:10px;text-align:right">' + amt2(basic) + '</td></tr>';
      if (allow > 0) earnRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">Allowance</td><td style="padding:2px 14px;font-size:10px;text-align:right">' + amt2(allow) + '</td></tr>';
      if (bonus > 0) earnRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">Attendance Bonus</td><td style="padding:2px 14px;font-size:10px;text-align:right">' + amt2(bonus) + '</td></tr>';
      if (otAmt > 0) earnRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">Overtime</td><td style="padding:2px 14px;font-size:10px;text-align:right">' + amt2(otAmt) + '</td></tr>';
      if (comm > 0) earnRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">Commission</td><td style="padding:2px 14px;font-size:10px;text-align:right">' + amt2(comm) + '</td></tr>';
      var dedRows = '';
      if (taxAmt > 0) dedRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">Tax</td><td style="padding:2px 14px;font-size:10px;text-align:right;color:#c0392b">—' + amt2(taxAmt) + '</td></tr>';
      if (epfAmt > 0) dedRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">EPF/ETF</td><td style="padding:2px 14px;font-size:10px;text-align:right;color:#c0392b">—' + amt2(epfAmt) + '</td></tr>';
      if (insAmt > 0) dedRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">Insurance</td><td style="padding:2px 14px;font-size:10px;text-align:right;color:#c0392b">—' + amt2(insAmt) + '</td></tr>';
      if (loanAmt > 0) dedRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">Loan</td><td style="padding:2px 14px;font-size:10px;text-align:right;color:#c0392b">—' + amt2(loanAmt) + '</td></tr>';
      if (otherAmt > 0) dedRows += '<tr><td style="padding:2px 14px;font-size:10px;color:#666">Other</td><td style="padding:2px 14px;font-size:10px;text-align:right;color:#c0392b">—' + amt2(otherAmt) + '</td></tr>';

      docContent = '<table cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #eee;border-radius:5px;width:100%;margin:10px 0">' +
        '<tr><td style="padding:10px 0">' +
        '<p style="font-size:12px;color:#555;margin:0 14px 8px"><b>' + esc(docLabel) + '</b> &bull; ' + today + '</p>' +
        '<table style="width:100%;border-collapse:collapse"><tr><td style="width:50%;vertical-align:top">' +
        '<p style="font-size:10px;font-weight:700;color:#1a1a2e;margin:0 14px 4px;text-transform:uppercase">Earnings</p>' +
        earnRows +
        '<tr style="border-top:1px solid #ddd"><td style="padding:4px 14px;font-size:10px;font-weight:700">Gross</td><td style="padding:4px 14px;font-size:10px;text-align:right;font-weight:700">' + amt2(gross) + '</td></tr>' +
        '</td><td style="width:50%;vertical-align:top">' +
        '<p style="font-size:10px;font-weight:700;color:#1a1a2e;margin:0 14px 4px;text-transform:uppercase">Deductions</p>' +
        (dedRows || '<tr><td style="padding:2px 14px;font-size:10px;color:#999" colspan="2">None</td></tr>') +
        '<tr style="border-top:1px solid #ddd"><td style="padding:4px 14px;font-size:10px;font-weight:700">Total Ded.</td><td style="padding:4px 14px;font-size:10px;text-align:right;font-weight:700">' + amt2(totalDed) + '</td></tr>' +
        '</td></tr></table>' +
        '<table style="width:100%;border-collapse:collapse;margin-top:6px;border-top:2px solid #1a1a2e">' +
        '<tr><td style="padding:6px 14px;font-size:13px;font-weight:700;color:#1a1a2e">NET PAY</td><td style="padding:6px 14px;font-size:15px;font-weight:700;color:#1a6b3c;text-align:right">USD $' + fmt2(net) + '</td></tr>' +
        '</table>' +
        '</td></tr></table>';
    } else if (docType === "experience") {
      var expP = str(d.position), expS = str(d.shift);
      var expT = str(d.trainingStart), expO = str(d.officialDate), expL = str(d.lastWorkDate), expA = str(d.address);
      docContent = '<table cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #eee;border-radius:5px;width:100%;margin:10px 0"><tr><td style="padding:10px 14px">' +
        '<p style="font-size:12px;color:#555;margin:0 0 6px"><b>' + esc(docLabel) + '</b> &bull; ' + today + '</p>' +
        '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
        '<tr><td style="padding:3px 0;color:#888">Employee:</td><td style="padding:3px 0"><b>' + esc(empName) + '</b></td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Position:</td><td style="padding:3px 0">' + esc(expP) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Shift:</td><td style="padding:3px 0">' + esc(expS) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Training Start:</td><td style="padding:3px 0">' + esc(expT) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Working Start:</td><td style="padding:3px 0">' + esc(expO) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Last Working Date:</td><td style="padding:3px 0">' + esc(expL) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Address:</td><td style="padding:3px 0">' + esc(expA) + '</td></tr>' +
        '</table></td></tr></table>';
    } else {
      var coeP = str(d.position), coeD = str(d.department);
      var coeS = str(d.startDate), coeA = str(d.address);
      var coeBasic = num(d.basicSalary), coeAtt = num(d.attendanceBonus), coePerf = num(d.performanceBonus);
      var coeTotal = coeBasic + coeAtt + coePerf;
      var coeCur = currencyInfo(d.currency);
      var fmt3 = function(v){return v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});};
      docContent = '<table cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #eee;border-radius:5px;width:100%;margin:10px 0"><tr><td style="padding:10px 14px">' +
        '<p style="font-size:12px;color:#555;margin:0 0 6px"><b>' + esc(docLabel) + '</b> &bull; ' + today + '</p>' +
        '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
        '<tr><td style="padding:3px 0;color:#888">Employee:</td><td style="padding:3px 0"><b>' + esc(empName) + '</b></td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Position:</td><td style="padding:3px 0">' + esc(coeP) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Department:</td><td style="padding:3px 0">' + esc(coeD) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Start Date:</td><td style="padding:3px 0">' + esc(coeS) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Address:</td><td style="padding:3px 0">' + esc(coeA) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Basic Salary:</td><td style="padding:3px 0">' + coeCur + ' ' + fmt3(coeBasic) + '</td></tr>' +
        (coeAtt > 0 ? '<tr><td style="padding:3px 0;color:#888">Attendance Bonus:</td><td style="padding:3px 0">' + coeCur + ' ' + fmt3(coeAtt) + '</td></tr>' : '') +
        (coePerf > 0 ? '<tr><td style="padding:3px 0;color:#888">Performance Bonus:</td><td style="padding:3px 0">' + coeCur + ' ' + fmt3(coePerf) + '</td></tr>' : '') +
        '<tr style="border-top:1px solid #ddd"><td style="padding:3px 0;color:#1a1a2e;font-weight:700">Total Compensation:</td><td style="padding:3px 0;font-weight:700;color:#1a6b3c">' + coeCur + ' ' + fmt3(coeTotal) + '</td></tr>' +
        '</table></td></tr></table>';
    }

    var htmlBody = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;border:1px solid #e2e2e2;border-radius:8px;overflow:hidden;background:#fff">' +
      '<div style="background:#1a1a2e;padding:22px 28px;text-align:center">' +
      '<h1 style="color:#c9a84c;margin:0;font-size:20px;font-weight:700;letter-spacing:1px">TALENT NEXUS</h1>' +
      '<p style="color:#aaa;margin:4px 0 0;font-size:10px;letter-spacing:2px;text-transform:uppercase">Human Resources Department</p></div>' +
      '<div style="padding:24px 28px">' +
      '<p style="font-size:14px;color:#333;margin:0 0 8px">Dear <b>' + esc(empName) + '</b>,</p>' +
      '<p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 8px">' + docMsg + '</p>' +
      '<table cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;width:100%;margin:10px 0"><tr>' +
      '<td style="width:90px;background:#1a1a2e;text-align:center;vertical-align:middle;padding:16px 0;border-radius:6px 0 0 6px">' +
      '<span style="color:#c9a84c;font-size:28px;font-weight:900">TN</span></td>' +
      '<td style="padding:14px 16px;vertical-align:middle">' +
      '<p style="font-size:12px;font-weight:700;color:#1a1a2e;margin:0 0 4px">' + esc(docLabel) + ' Ready</p>' +
      '<p style="font-size:11px;color:#888;margin:0 0 8px">' + esc(empName) + ' &bull; ' + today + '</p>' +
      '<a href="' + docLink + '" style="display:inline-block;background:#c9a84c;color:#fff;padding:6px 18px;border-radius:4px;text-decoration:none;font-size:11px;font-weight:600">Download</a>' +
      '</td></tr></table>' +
      docContent +
      '<p style="font-size:12px;color:#555;line-height:1.6;margin:8px 0 4px"><b>Download:</b> <a href="' + docLink + '" style="color:#c9a84c">View & Print Document</a></p>' +
      '<p style="font-size:12px;color:#999;line-height:1.6;margin:0">For inquiries, contact <a href="mailto:' + HR_EMAIL + '" style="color:#c9a84c;text-decoration:none"><b>' + HR_EMAIL + '</b></a>.</p>' +
      '</div>' +
      '<div style="background:#fafafa;padding:18px 28px;border-top:1px solid #eee;text-align:center">' +
      '<p style="font-size:12px;color:#555;margin:0 0 4px"><b>With Regards,</b></p>' +
      '<p style="font-size:13px;color:#1a1a2e;margin:0 0 1px;font-weight:700">' + HR_NAME + '</p>' +
      '<p style="font-size:10px;color:#999;margin:0 0 8px">Human Resources Representative &bull; Talent Nexus</p>' +
      '<p style="font-size:9px;color:#bbb;margin:0">' + CO_WEBSITE + '</p>' +
      '<p style="font-size:9px;color:#bbb;margin:0">UK: ' + CO_ADDRESS_UK + '</p>' +
      '<p style="font-size:9px;color:#bbb;margin:0">Thailand: ' + CO_ADDRESS_TH + '</p></div>' +
      '</div>';

    var plainBody = "Dear " + empName + ",\n\n" + docMsg + "\n\nView & Print: " + docLink + "\n\nDocument: " + docLabel + "\nDate: " + today + "\nIssued By: " + HR_NAME + ", HR Department\n\nFor inquiries, contact " + HR_EMAIL + "\n\nWith Regards,\n" + HR_NAME + "\nHuman Resources Representative\nTalent Nexus\n" + CO_WEBSITE + "\nUK: " + CO_ADDRESS_UK + "\nThailand: " + CO_ADDRESS_TH;

    var mailSubject = docLabel + " — Talent Nexus";
    try {
      GmailApp.sendEmail(cleanTo, mailSubject, plainBody, {
        htmlBody: htmlBody,
        name: HR_SENDER_NAME,
        replyTo: HR_REPLY_TO,
        from: HR_EMAIL
      });
    } catch (sendErr) {
      MailApp.sendEmail({
        to: cleanTo,
        subject: mailSubject,
        htmlBody: htmlBody,
        body: plainBody,
        name: HR_SENDER_NAME,
        replyTo: HR_REPLY_TO
      });
    }

    try {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var s = ss.getSheetByName("RequestLog");
      if (s) s.appendRow([new Date(), "email_sent", empName, cleanTo]);
    } catch (e2) {}
  } catch (e) {
    try {
      var ss2 = SpreadsheetApp.openById(SHEET_ID);
      var s2 = ss2.getSheetByName("RequestLog");
      if (s2) s2.appendRow([new Date(), "email_FAILED", empName, e.toString()]);
    } catch (e3) {}
  }
}

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

  var startDate = parseDateFlex(pFrom);
  var endDate = parseDateFlex(pTo);
  var payDate = parseDateFlex(pDate);

  var pagesHtml = "";
  for (var m = 0; m < months; m++) {
    var mlbl = "";
    var curFrom = pFrom, curTo = pTo, curPay = pDate;

    if (startDate && endDate && months > 1) {
      var s = new Date(startDate); s.setMonth(s.getMonth() + m);
      var e = new Date(endDate); e.setMonth(e.getMonth() + m);
      curFrom = fmtDate(s);
      curTo = fmtDate(e);
      mlbl = monthName(s) + " " + s.getFullYear();
    } else if (months > 1) {
      mlbl = "Month " + (m+1) + " of " + months;
    }

    if (payDate && months > 1) {
      var p = new Date(payDate); p.setMonth(p.getMonth() + m);
      curPay = fmtDate(p);
    }

    pagesHtml += payslipPage(empName, empId, dept, desig, curFrom, curTo, curPay, bank, acct, basic, allow, bonus, ot, comm, tax, epf, ins, loan, other, gross, totalDed, net, mlbl);
  }

  logRequest("payslip", empName, empId);
  return payslipShell(pagesHtml);
}

function payslipShell(pages) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page{size:A4;margin:8mm 10mm}' +
    'body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:#1a1a2e;font-size:9pt;line-height:1.45;margin:0}' +
    '.pb{page-break-after:always}.pb:last-child{page-break-after:avoid}' +
    '.hdr{width:100%;background:#1a1a2e;padding:10px 0}' +
    '.hdr-tbl{width:100%}.hdr-tbl td{padding:4px 12px}' +
    '.hdr-logo{width:34px;height:34px;background:#c9a84c;text-align:center;color:#fff;font-weight:900;font-size:15px}' +
    '.hdr-co{color:#fff;font-size:13pt;font-weight:700;letter-spacing:0.5px}' +
    '.hdr-tag{color:#c9a84c;font-size:6.5pt;text-transform:uppercase;letter-spacing:1.5px}' +
    '.hdr-label{text-align:right;color:#c9a84c;font-size:11pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase}' +
    '.hdr-month{text-align:right;color:#999;font-size:7pt}' +
    '.ctn{padding:6px 12px}' +
    '.sec{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8b6914;border-bottom:1.5px solid #1a1a2e;padding-bottom:2px;margin:10px 0 5px}' +
    '.itbl{width:100%;border-collapse:collapse;border:1px solid #ddd;margin-bottom:6px}' +
    '.itbl td{padding:4px 8px;font-size:8pt;border:1px solid #eee}' +
    '.itbl td.lbl{background:#f8f8f8;font-weight:600;color:#555;width:22%;font-size:7pt}' +
    '.stbl{width:100%;border-collapse:collapse;margin-bottom:4px}' +
    '.stbl th{background:#1a1a2e;color:#c9a84c;padding:5px 10px;font-size:7.5pt;text-transform:uppercase;letter-spacing:0.5px;text-align:left}' +
    '.stbl th.rt{text-align:right}' +
    '.stbl td{padding:4px 10px;font-size:8pt;border-bottom:1px solid #eee}' +
    '.stbl td.rt{text-align:right}' +
    '.stbl tr.sub td{font-weight:700;border-top:2px solid #1a1a2e;border-bottom:0}' +
    '.sbox{margin-top:8px;border:2px solid #1a1a2e;padding:6px 14px}' +
    '.srow{padding:2px 0;font-size:8.5pt}' +
    '.srow.net{font-size:12pt;font-weight:700;border-top:2px solid #1a1a2e;margin-top:3px;padding-top:4px;color:#1a1a2e}' +
    '.srow .val{float:right}' +
    '.words{font-size:7pt;color:#666;margin-top:4px}' +
    '.ft{margin-top:14px;border-top:1px solid #ddd;padding:6px 12px;text-align:center;font-size:6.5pt;color:#999}' +
    '.clear{clear:both}' +
    '</style></head><body>' + pages + '</body></html>';
}

function payslipPage(nm,id,dp,ds,pf,pt,pd,bk,ac,ba,al,bo,ot,cm,tx,ep,ins,ln,oh,gr,td,nt,mlbl) {
  var fmt = function(v){return v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});};
  var amt = function(v){return v>0?"$"+fmt(v):"—";};
  var row = function(l,v){return '<tr><td>'+esc(l)+'</td><td class="rt">'+v+'</td></tr>';};
  var nfo = function(l,v){return '<tr><td class="lbl">'+esc(l)+'</td><td>'+esc(v)+'</td></tr>';};

  var monthsLabel = mlbl || "";

  return '<div class="pb">' +
    '<table class="hdr-tbl"><tr>' +
    '<td width="40"><table><tr><td class="hdr-logo">TN</td></tr></table></td>' +
    '<td><div class="hdr-co">TALENT NEXUS</div><div class="hdr-tag">Connecting Talent. Creating Impact.</div></td>' +
    '<td align="right"><div class="hdr-label">PAYSLIP</div><div class="hdr-month">' + esc(monthsLabel) + '</div></td>' +
    '</tr></table>' +

    '<div class="ctn">' +

    '<div class="sec">Employee Information</div>' +
    '<table class="itbl">' +
    nfo('Employee Name',nm) + nfo('Employee ID',id) +
    nfo('Department',dp) + nfo('Designation',ds) +
    nfo('Pay Period',pf+' — '+pt) + nfo('Payment Date',pd) +
    nfo('Bank Name',bk) + nfo('Account Number',ac) +
    '</table>' +

    '<table width="100%"><tr><td width="50%" style="vertical-align:top;padding-right:6px">' +
    '<table class="stbl"><thead><tr><th>EARNINGS</th><th class="rt">AMOUNT (USD)</th></tr></thead><tbody>' +
    row('Basic Salary',amt(ba)) + row('Allowance',amt(al)) + row('Attendance Bonus',amt(bo)) +
    row('Overtime Pay',amt(ot)) + row('Commission',amt(cm)) +
    '<tr class="sub"><td>Gross Earnings</td><td class="rt">$'+fmt(gr)+'</td></tr>' +
    '</tbody></table>' +
    '</td><td width="50%" style="vertical-align:top;padding-left:6px">' +
    '<table class="stbl"><thead><tr><th>DEDUCTIONS</th><th class="rt">AMOUNT (USD)</th></tr></thead><tbody>' +
    row('Income Tax',amt(tx)) + row('EPF / ETF',amt(ep)) + row('Insurance',amt(ins)) +
    row('Loan Deduction',amt(ln)) + row('Other Deductions',amt(oh)) +
    '<tr class="sub"><td>Total Deductions</td><td class="rt">$'+fmt(td)+'</td></tr>' +
    '</tbody></table>' +
    '</td></tr></table>' +

    '<div class="sbox">' +
    '<div class="srow"><span>Gross Salary</span><span class="val">USD &nbsp; $'+fmt(gr)+'</span></div><div class="clear"></div>' +
    '<div class="srow"><span>Total Deductions</span><span class="val">USD &nbsp; $'+fmt(td)+'</span></div><div class="clear"></div>' +
    '<div class="srow net"><span>NET PAY</span><span class="val">USD &nbsp; $'+fmt(nt)+'</span></div><div class="clear"></div>' +
    '</div>' +

    '<div class="words"><b>Amount in Words:</b> ' + numberToWords(nt) + ' only.</div>' +

    '</div>' +

    '<div class="ft">This is a computer-generated payslip and does not require a signature.<br>' +
    '<b>Talent Nexus</b> &bull; ' + CO_WEBSITE + ' &bull; ' + HR_EMAIL + '<br>' +
    'UK: ' + CO_ADDRESS_UK + '<br>' +
    'Thailand: ' + CO_ADDRESS_TH + '</div>' +

    '</div>';
}

function generateExperienceHtml(d) {
  var empName = str(d.employeeName), position = str(d.position);
  var shift = str(d.shift), trainStart = str(d.trainingStart);
  var offDate = str(d.officialDate), lastDate = str(d.lastWorkDate);
  var address = str(d.address);
  var certDate = str(d.certDate) || new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  var bodyText = str(d.bodyText);
  var firstName = esc(empName.split(" ")[0]);

  if (!empName || !position) return "<h3>Error: Employee Name and Position are required.</h3>";

  var salutation = str(d.salutation);
  var personName = (salutation ? esc(salutation) + ' ' : '') + esc(empName);
  var tenureStart = trainStart || offDate;
  var tenureEnd = lastDate ? (' to <b>' + esc(lastDate) + '</b>') : '';
  var defaultBody = '<p>This is to certify that <b>' + personName + '</b> was employed with <b>Talent Nexus</b> as <b>' + esc(position) + '</b>' + (tenureStart ? (' from <b>' + esc(tenureStart) + '</b>') : '') + tenureEnd + '.</p>' +
    '<p>During their employment, the primary duties and responsibilities included:</p>' +
    '<ul style="margin:0 0 6px 16px;padding:0">' +
    '<li style="margin:0 0 2px">Managing multiple customer support conversations through non-voice live chat channels.</li>' +
    '<li style="margin:0 0 2px">Handling customer financial inquiries, payment-related issues, and transaction concerns.</li>' +
    '<li style="margin:0 0 2px">Assisting with Know Your Customer (KYC) verification and customer information validation.</li>' +
    '<li style="margin:0 0 2px">Monitoring team performance, attendance, and key operational performance indicators (KPIs).</li>' +
    '<li style="margin:0 0 2px">Preparing and maintaining daily and monthly operational reports.</li>' +
    '<li style="margin:0 0 2px">Supporting customer issue resolution while ensuring service quality and operational efficiency.</li>' +
    '<li style="margin:0 0 2px">Providing professional customer assistance and maintaining effective communication to ensure customer satisfaction.</li>' +
    '</ul>' +
    '<p>Throughout their tenure, <b>' + personName + '</b> demonstrated professionalism, dedication, responsibility, and strong operational management skills. They contributed positively to the team&#39;s performance and overall customer service operations.</p>' +
    '<p>This certificate is issued upon request for whatever legal and professional purpose it may serve.</p>' +
    '<p>We wish them continued success in their future career and endeavors.</p>';

  var refNo = "TN/HR/EXP/" + new Date().getFullYear() + "/" + Math.floor(Math.random()*9000+1000);

  logRequest("experience", empName, "");

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page{size:A4;margin:10mm 12mm}' +
    'body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:#1a1a2e;font-size:9.5pt;line-height:1.45;margin:0}' +
    '.hdr{width:100%;background:#1a1a2e;padding:8px 14px}' +
    '.hdr-tbl{width:100%}.hdr-tbl td{padding:2px 8px}' +
    '.hdr-logo{width:30px;height:30px;background:#c9a84c;text-align:center;color:#fff;font-weight:900;font-size:13px}' +
    '.hdr-co{color:#fff;font-size:12pt;font-weight:700;letter-spacing:0.5px}' +
    '.hdr-tag{color:#c9a84c;font-size:6pt;text-transform:uppercase;letter-spacing:1.5px}' +
    '.title{text-align:center;font-size:13pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:8px 0 2px}' +
    '.line{width:50px;height:2px;background:#c9a84c;margin:0 auto 8px}' +
    '.ref{font-size:7pt;color:#999;margin-bottom:5px}' +
    '.drow{text-align:right;font-size:8.5pt;margin-bottom:5px}' +
    '.to{font-size:8.5pt;font-weight:700;margin-bottom:6px}' +
    '.body-text{font-size:9.5pt;text-align:justify;margin-bottom:6px;line-height:1.55}' +
    '.body-text p{margin:0 0 8px;text-indent:0}' +
    '.dtbl{width:100%;border-collapse:collapse;border:1px solid #ddd;margin:8px 0}' +
    '.dtbl td{padding:3px 8px;font-size:7.8pt;border:1px solid #eee}' +
    '.dtbl td.lbl{background:#f8f8f8;font-weight:600;color:#555;width:28%}' +
    '.sig{margin-top:26px}' +
    '.sig-sign{font-family:"Segoe Script","Brush Script MT","Great Vibes",cursive;font-size:16pt;color:#1a1a2e;margin-bottom:4px}' +
    '.sig-line{border-top:1.5px solid #1a1a2e;width:170px;margin-bottom:3px}' +
    '.sig-name{font-weight:700;font-size:9.5pt}' +
    '.sig-role{font-size:7.5pt;color:#666}' +
    '.sig-hr{font-size:7.5pt;color:#c9a84c;font-weight:600;margin-top:1px}' +
    '.sig-tbl{border-collapse:collapse;margin-top:12px}' +
    '.sig-photo{padding:0 14px 0 0;vertical-align:middle}' +
    '.sig-photo img{display:block;border-radius:50%}' +
    '.sig-text{vertical-align:middle}' +
    '.ft{margin-top:10px;border-top:1px solid #ddd;padding-top:4px;text-align:center;font-size:6.5pt;color:#aaa}' +
    '</style></head><body>' +

    '<table class="hdr-tbl"><tr>' +
    '<td width="34"><table><tr><td class="hdr-logo">TN</td></tr></table></td>' +
    '<td><div class="hdr-co">TALENT NEXUS</div><div class="hdr-tag">Connecting Talent. Creating Impact.</div></td>' +
    '</tr></table>' +

    '<div class="title">EXPERIENCE CERTIFICATE</div>' +
    '<div class="line"></div>' +

    '<div class="ref">Ref: ' + refNo + '</div>' +
    '<div class="drow"><b>Date:</b> ' + esc(certDate) + '</div>' +
    '<div class="to">TO WHOM IT MAY CONCERN</div>' +

    bodyBlock(bodyText, defaultBody) +

    '<table class="dtbl">' +
    '<tr><td class="lbl">Employee Name</td><td>' + esc(empName) + '</td></tr>' +
    '<tr><td class="lbl">Position Held</td><td>' + esc(position) + '</td></tr>' +
    '<tr><td class="lbl">Shift / Team</td><td>' + esc(shift) + '</td></tr>' +
    '<tr><td class="lbl">Training Start Date</td><td>' + esc(trainStart) + '</td></tr>' +
    '<tr><td class="lbl">Working Start Date</td><td>' + esc(offDate) + '</td></tr>' +
    '<tr><td class="lbl">Last Working Date</td><td>' + esc(lastDate) + '</td></tr>' +
    '<tr><td class="lbl">Address on Record</td><td>' + esc(address) + '</td></tr>' +
    '</table>' +

        '<table class="sig-tbl"><tr>' +
    '<td class="sig-photo"><img src="' + HR_SIG_PHOTO + '" width="64" height="64" alt="' + HR_NAME + '"></td>' +
    '<td class="sig-text">' +
    '<div class="sig-sign">' + HR_NAME + '</div>' +
    '<div class="sig-line"></div>' +
    '<div class="sig-name">' + HR_NAME + '</div>' +
    '<div class="sig-role">HR Manager - Consultant</div>' +
    '<div class="sig-hr">TALENT NEXUS</div>' +
    '</td>' +
    '</tr></table>' +

    '<div class="ft">' +
    '<b>Talent Nexus</b> &bull; ' + CO_WEBSITE + ' &bull; ' + HR_EMAIL + '<br>' +
    'UK Office: ' + CO_ADDRESS_UK + ' &bull; Thailand Office: ' + CO_ADDRESS_TH + '<br>' +
    'This is a computer-generated document.' +
    '</div>' +

    '</body></html>';
}

function generateCoeHtml(d) {
  var empName = str(d.employeeName), position = str(d.position);
  var department = str(d.department), startDate = str(d.startDate);
  var address = str(d.address);
  var issueDate = str(d.issueDate) || new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  var bodyText = str(d.bodyText);
  var firstName = esc(empName.split(" ")[0]);

  var basicSalary = num(d.basicSalary);
  var attBonus = num(d.attendanceBonus);
  var perfBonus = num(d.performanceBonus);
  var totalComp = basicSalary + attBonus + perfBonus;
  var cur = currencyInfo(d.currency);

  if (!empName || !position) return "<h3>Error: Employee Name and Position are required.</h3>";

  var fmt = function(v){return v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});};
  var amt = function(v){return v>0?cur+" "+fmt(v):"—";};

  var defaultBody =
    '<p>This is to certify that <b>' + esc(empName) + '</b> has been an employee of <b>Talent Nexus</b> since <b>' + esc(startDate) + '</b>, holding the position of <b>' + esc(position) + '</b>' + (department?' in the <b>' + esc(department) + '</b>':'') + '. ' + firstName + ' is entitled to compensation and benefits as follows:</p>' +
    '<p><b>Compensation:</b><br>' +
    'Basic Salary &mdash; ' + cur + ' ' + fmt(basicSalary) + '<br>' +
    (attBonus > 0 ? 'Attendance Bonus &mdash; ' + cur + ' ' + fmt(attBonus) + '<br>' : '') +
    (perfBonus > 0 ? 'Performance Bonus &mdash; ' + cur + ' ' + fmt(perfBonus) + '<br>' : '') +
    '<b>Total Monthly Compensation &mdash; ' + cur + ' ' + fmt(totalComp) + '</b></p>' +
    '<p>' + firstName + ' has demonstrated the qualities of hard work, good quality performance, and possesses good moral character. ' + firstName + ' has consistently shown dedication and professionalism throughout their tenure with the organization.</p>' +
    '<p>This certification is being issued upon the request of ' + firstName + ' for whatever legal purposes it may serve.</p>';

  var refNo = "TN/HR/COE/" + new Date().getFullYear() + "/" + Math.floor(Math.random()*9000+1000);

  logRequest("coe", empName, "");

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page{size:A4;margin:10mm 12mm}' +
    'body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:#1a1a2e;font-size:9.5pt;line-height:1.45;margin:0}' +
    '.hdr{width:100%;background:#1a1a2e;padding:8px 14px}' +
    '.hdr-tbl{width:100%}.hdr-tbl td{padding:2px 8px}' +
    '.hdr-logo{width:30px;height:30px;background:#c9a84c;text-align:center;color:#fff;font-weight:900;font-size:13px}' +
    '.hdr-co{color:#fff;font-size:12pt;font-weight:700;letter-spacing:0.5px}' +
    '.hdr-tag{color:#c9a84c;font-size:6pt;text-transform:uppercase;letter-spacing:1.5px}' +
    '.title{text-align:center;font-size:13pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:8px 0 2px}' +
    '.line{width:50px;height:2px;background:#c9a84c;margin:0 auto 8px}' +
    '.ref{font-size:7pt;color:#999;margin-bottom:5px}' +
    '.drow{text-align:right;font-size:8.5pt;margin-bottom:5px}' +
    '.to{font-size:8.5pt;font-weight:700;margin-bottom:6px}' +
    '.body-text{font-size:9.5pt;text-align:justify;margin-bottom:6px;line-height:1.55}' +
    '.body-text p{margin:0 0 8px;text-indent:0}' +
    '.dtbl{width:100%;border-collapse:collapse;border:1px solid #ddd;margin:8px 0}' +
    '.dtbl td{padding:3px 8px;font-size:7.8pt;border:1px solid #eee}' +
    '.dtbl td.lbl{background:#f8f8f8;font-weight:600;color:#555;width:28%}' +
    '.sig{margin-top:26px}' +
    '.sig-sign{font-family:"Segoe Script","Brush Script MT","Great Vibes",cursive;font-size:16pt;color:#1a1a2e;margin-bottom:4px}' +
    '.sig-line{border-top:1.5px solid #1a1a2e;width:170px;margin-bottom:3px}' +
    '.sig-name{font-weight:700;font-size:9.5pt}' +
    '.sig-role{font-size:7.5pt;color:#666}' +
    '.sig-hr{font-size:7.5pt;color:#c9a84c;font-weight:600;margin-top:1px}' +
    '.sig-tbl{border-collapse:collapse;margin-top:12px}' +
    '.sig-photo{padding:0 14px 0 0;vertical-align:middle}' +
    '.sig-photo img{display:block;border-radius:50%}' +
    '.sig-text{vertical-align:middle}' +
    '.ft{margin-top:10px;border-top:1px solid #ddd;padding-top:4px;text-align:center;font-size:6.5pt;color:#aaa}' +
    '</style></head><body>' +

    '<table class="hdr-tbl"><tr>' +
    '<td width="34"><table><tr><td class="hdr-logo">TN</td></tr></table></td>' +
    '<td><div class="hdr-co">TALENT NEXUS</div><div class="hdr-tag">Connecting Talent. Creating Impact.</div></td>' +
    '</tr></table>' +

    '<div class="title">CERTIFICATE OF EMPLOYMENT</div>' +
    '<div class="line"></div>' +

    '<div class="ref">Ref: ' + refNo + '</div>' +
    '<div class="drow"><b>Issued:</b> ' + esc(issueDate) + '</div>' +
    '<div class="to">TO WHOM IT MAY CONCERN</div>' +

    bodyBlock(bodyText, defaultBody) +

    '<table class="dtbl">' +
    '<tr><td class="lbl">Employee Name</td><td>' + esc(empName) + '</td></tr>' +
    '<tr><td class="lbl">Position Held</td><td>' + esc(position) + '</td></tr>' +
    '<tr><td class="lbl">Department</td><td>' + esc(department) + '</td></tr>' +
    '<tr><td class="lbl">Start Date</td><td>' + esc(startDate) + '</td></tr>' +
    '<tr><td class="lbl">Basic Salary</td><td>' + cur + ' ' + fmt(basicSalary) + '</td></tr>' +
    (attBonus > 0 ? '<tr><td class="lbl">Attendance Bonus</td><td>' + cur + ' ' + fmt(attBonus) + '</td></tr>' : '') +
    (perfBonus > 0 ? '<tr><td class="lbl">Performance Bonus</td><td>' + cur + ' ' + fmt(perfBonus) + '</td></tr>' : '') +
    '<tr><td class="lbl">Total Monthly Compensation</td><td><b>' + cur + ' ' + fmt(totalComp) + '</b></td></tr>' +
    '<tr><td class="lbl">Address on Record</td><td>' + esc(address) + '</td></tr>' +
    '</table>' +

        '<table class="sig-tbl"><tr>' +
    '<td class="sig-photo"><img src="' + HR_SIG_PHOTO + '" width="64" height="64" alt="' + HR_NAME + '"></td>' +
    '<td class="sig-text">' +
    '<div class="sig-sign">' + HR_NAME + '</div>' +
    '<div class="sig-line"></div>' +
    '<div class="sig-name">' + HR_NAME + '</div>' +
    '<div class="sig-role">HR Manager - Consultant</div>' +
    '<div class="sig-hr">TALENT NEXUS</div>' +
    '</td>' +
    '</tr></table>' +

    '<div class="ft">' +
    '<b>Talent Nexus</b> &bull; ' + CO_WEBSITE + ' &bull; ' + HR_EMAIL + '<br>' +
    'UK Office: ' + CO_ADDRESS_UK + ' &bull; Thailand Office: ' + CO_ADDRESS_TH + '<br>' +
    'This is a computer-generated document.' +
    '</div>' +

    '</body></html>';
}

// ======== LOGGING ========
function logRequest(type, empName, empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("RequestLog");
    if (!s) { s = ss.insertSheet("RequestLog"); s.appendRow(["Timestamp","Type","EmployeeName","EmployeeID"]); }
    s.appendRow([new Date(), type, empName, empId]);
  } catch (e) {}
}

// ======== TOKEN SYSTEM ========
function storeDocumentToken(docType, formData) {
  var token = generateToken();
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("DocumentTokens");
    if (!s) {
      s = ss.insertSheet("DocumentTokens");
      s.appendRow(["Token", "Type", "Payload", "CreatedAt"]);
    }
    var payload = JSON.stringify(formData);
    s.appendRow([token, docType, payload, new Date()]);
    maybeCleanupTokens(s);
  } catch (e) {}
  return token;
}

function generateToken() {
  var ts = new Date().getTime().toString(36);
  var rand = Math.random().toString(36).substring(2, 7);
  return "TK-" + ts + "-" + rand;
}

function maybeCleanupTokens(sheet) {
  try {
    var props = PropertiesService.getScriptProperties();
    var last = Number(props.getProperty("lastTokenCleanup") || 0);
    var now = Date.now();
    if (now - last < 24 * 60 * 60 * 1000) return;
    props.setProperty("lastTokenCleanup", String(now));
    cleanupOldTokens(sheet);
  } catch (e) {}
}

function keepAlive() { return "ok"; }

function installKeepAliveTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "keepAlive") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("keepAlive").timeBased().everyMinutes(5).create();
  return "Keep-alive trigger installed (every 5 min).";
}

function cleanupOldTokens(sheet) {
  try {
    var data = sheet.getDataRange().getValues();
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    var rowsToDelete = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var rowDate = new Date(data[i][3]);
      if (rowDate < cutoff) {
        rowsToDelete.push(i + 1);
      }
    }
    for (var j = 0; j < rowsToDelete.length; j++) {
      sheet.deleteRow(rowsToDelete[j]);
    }
  } catch (e) {}
}

// ======== HELPERS ========
function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function str(v) { return String(v||"").trim(); }
function hasVisibleText(v) {
  var t = String(v||"")
    .replace(/<[^>]*>/g,"")
    .replace(/&nbsp;/gi," ")
    .replace(/&[a-z#0-9]+;/gi,"x")
    .replace(/[\s\u200b-\u200d\ufeff]/g,"");
  return t.length > 0;
}
function bodyBlock(bodyText, defaultBody) {
  var custom = str(bodyText);
  return '<div class="body-text">' + (hasVisibleText(custom) ? custom : defaultBody) + '</div>';
}
function num(v) { var n=parseFloat(v); return isNaN(n)?0:n; }
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim()); }
function safeFilename(s) { return String(s||"document").replace(/[^a-zA-Z0-9_\- ]/g,"").replace(/\s+/g,"_").substring(0,80); }


function currencyInfo(code) {
  var m = {
    PHP: "PHP ₱",
    USD: "USD $",
    MYR: "MYR RM",
    MMK: "MMK K",
    IDR: "IDR Rp",
    INR: "INR ₹",
    BDT: "BDT ৳"
  };
  return m[String(code||"").toUpperCase()] || m.PHP;
}

function parseDateFlex(s) {
  if (!s) return null;
  s = String(s).trim().replace(/-/g,"/");
  var parts = s.split("/");
  if (parts.length < 2) return null;
  var a = parseInt(parts[0]), b = parseInt(parts[1]), c = parseInt(parts[2]||"0");
  if (isNaN(a) || isNaN(b)) return null;
  if (a > 31) return new Date(a, b-1, c || 1);
  var yr = c;
  if (yr < 100) yr += 2000;
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
