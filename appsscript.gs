// CS Portal v3 — MINIMAL DEBUG VERSION
// Deploy as Web App (Execute as: Me, Who has access: Anyone)

var SHEET_ID = "1n6fDjRCi17yp0KQ9lP29ARtqJVg0V_YgV_l9m4FjiCw";
var HR_NAME = "Hannah Cortez";
var HR_EMAIL = "hr@talentnexus.com";
var CO_WEBSITE = "www.talentnexus.com";
var CO_ADDRESS_UK = "Suite 10 & 11, The Sanctuary, 23 Oak Hill Grove, Surbiton, Surrey KT6 6DU, United Kingdom";
var CO_ADDRESS_TH = "The Offices at CentralWorld, 999/9 Rama I Road, 28th Floor, Pathum Wan, Bangkok 10330, Thailand";
var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwtcjR_XMIyZFixa3RymCqIymRP6csBSuVoGGb8UyDo69iIJaQtjwHYqce7tn-S-gjZ/exec";
var SESSION_HOURS = 8;

// ==================== ENTRY POINTS ====================

function doGet(e) {
  var p = e.parameter || {};

  // Quick deployment test
  if (p.test === "1") {
    return ContentService.createTextOutput("DEPLOY OK - v4-minimal - " + new Date().toISOString());
  }

  var session = str(p.session);

  if (session) {
    var s = validateSession(session);
    if (s) {
      try {
        return HtmlService.createHtmlOutput(getPortalPage(s))
          .setTitle("Talent Nexus — Portal")
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
          .addMetaTag('viewport','width=device-width,initial-scale=1');
      } catch(e) {
        return ContentService.createTextOutput("PORTAL PAGE ERROR: " + e.toString());
      }
    }
  }

  try {
    var loginHtml = getLoginPage(str(p.error));
    return HtmlService.createHtmlOutput(loginHtml)
      .setTitle("Talent Nexus — Sign In")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport','width=device-width,initial-scale=1');
  } catch(e) {
    return ContentService.createTextOutput("LOGIN PAGE ERROR: " + e.toString());
  }
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

    if (action === "portal_login") {
      return json(handlePortalLogin(d));
    }

    // All other actions require valid session
    var session = validateSession(d.session);
    if (!session) {
      return json({ error: "Session expired." });
    }

    if (action === "generate_payslip") {
      d.employeeName = d.employeeName || session.name;
      var html = generatePayslipHtml(d);
      var startDt = parseDateFlex(str(d.payPeriodFrom));
      var periodName = startDt ? (monthName(startDt) + "_" + startDt.getFullYear()) : "Monthly";
      var filename = safeFilename(d.employeeName || "Employee") + "_" + periodName + "_Payslip.pdf";
      sendEmailIfRequested(d, html, filename, "payslip");
      return returnPdf(html, filename);
    }

    if (action === "generate_experience") {
      d.employeeName = d.employeeName || session.name;
      var html2 = generateExperienceHtml(d);
      var filename2 = safeFilename(d.employeeName || "Employee") + "_Experience_Letter.pdf";
      sendEmailIfRequested(d, html2, filename2, "experience");
      return returnPdf(html2, filename2);
    }

    return json({ error: "Unknown action" });
  } catch (err) {
    return json({ error: err.toString() });
  }
}

// ==================== LOGIN ====================

function handlePortalLogin(d) {
  var tgName = str(d.tgName);
  var tgId = str(d.tgId);
  var password = str(d.password);

  if (!tgName || !tgId || !password) {
    return { ok: false, error: "All fields are required." };
  }

  var ss = SpreadsheetApp.openById(SHEET_ID);
  var userSheet = getOrCreateSheet(ss, "PortalUsers", ["Email","Password","Name","Role","TelegramName","TelegramID","CreatedAt","LastLogin"]);
  userSheet.getRange("B:B").setNumberFormat('@STRING@');
  userSheet.getRange("F:F").setNumberFormat('@STRING@');
  migratePortalUsers(userSheet);
  ensureDefaultUser(ss, userSheet);

  var data = userSheet.getDataRange().getValues();
  var foundRow = -1, foundName = "", foundEmail = "";
  var tgNameLower = tgName.toLowerCase();
  var tgIdClean = tgId.replace(/[^0-9]/g, "");

  for (var i = 1; i < data.length; i++) {
    var rowTgName = str(data[i][4]).toLowerCase();
    var rowTgId = str(data[i][5]).replace(/[^0-9]/g, "");
    if (rowTgName === tgNameLower || (tgIdClean && rowTgId === tgIdClean)) {
      if (str(data[i][1]) === password) {
        foundRow = i;
        foundName = str(data[i][2]) || tgName;
        foundEmail = str(data[i][0]);
        break;
      }
    }
  }

  if (foundRow >= 0) {
    var oldTgName = str(data[foundRow][4]);
    var oldTgId = str(data[foundRow][5]);
    if (tgName !== oldTgName) { userSheet.getRange(foundRow + 1, 5).setValue(tgName); logChange(foundEmail, "TelegramName", oldTgName || "(empty)", tgName); }
    if (tgId !== oldTgId) { userSheet.getRange(foundRow + 1, 6).setValue(tgId); logChange(foundEmail, "TelegramID", oldTgId || "(empty)", tgId); }
    userSheet.getRange(foundRow + 1, 8).setValue(new Date());
    var sessionToken = createSession(tgName, tgId, foundName);
    logLogin(foundEmail, password, tgName, tgId, "success", foundName, "");
    return { ok: true, token: sessionToken, name: foundName, tgName: tgName };
  }

  var userExists = false;
  for (var j = 1; j < data.length; j++) {
    if (str(data[j][4]).toLowerCase() === tgNameLower || (tgIdClean && str(data[j][5]).replace(/[^0-9]/g, "") === tgIdClean)) { userExists = true; break; }
  }
  var errMsg = userExists ? "Incorrect password." : "Account not found. Contact HR.";
  logLogin("", password, tgName, tgId, "failed", errMsg, "");
  return { ok: false, error: errMsg };
}

// ==================== SESSIONS ====================

function createSession(tgName, tgId, name) {
  var token = "SES-" + new Date().getTime().toString(36) + "-" + Math.random().toString(36).substring(2, 9);
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = getOrCreateSheet(ss, "PortalSessions", ["Token","TelegramName","TelegramID","Name","CreatedAt","ExpiresAt"]);
    var expires = new Date(Date.now() + SESSION_HOURS * 3600000);
    s.appendRow([token, tgName, tgId, name, new Date(), expires]);
  } catch(e) {}
  return token;
}

function validateSession(token) {
  if (!token) return null;
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("PortalSessions");
    if (!s || s.getLastRow() < 2) return null;
    var data = s.getDataRange().getValues();
    var now = new Date();
    for (var i = 1; i < data.length; i++) {
      if (str(data[i][0]) === token) {
        if (new Date(data[i][5]) > now) {
          return { name: str(data[i][3]), tgName: str(data[i][1]), token: token };
        }
      }
    }
  } catch(e) {}
  return null;
}

// ==================== LOGGING ====================

function logLogin(email, password, tgName, tgId, status, detail, ip) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = getOrCreateSheet(ss, "LoginLog", ["Timestamp","Email","Password","Name","TelegramName","TelegramID","Status","Detail","IP"]);
    s.getRange("C:C").setNumberFormat('@STRING@');
    s.appendRow([new Date(), email, String(password||""), detail, tgName||"", tgId||"", status, detail, ip||""]);
  } catch(e) {}
}

function logChange(email, field, oldVal, newVal) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = getOrCreateSheet(ss, "PortalChanges", ["Timestamp","Email","Field","OldValue","NewValue"]);
    s.appendRow([new Date(), email, field, oldVal, newVal]);
  } catch(e) {}
}

function migratePortalUsers(sheet) {
  try {
    var data = sheet.getDataRange().getValues();
    if (data.length < 1) return;
    if (data[0].length <= 6) {
      sheet.insertColumns(5, 2);
      sheet.getRange(1, 5).setValue("TelegramName");
      sheet.getRange(1, 6).setValue("TelegramID");
      sheet.getRange("F:F").setNumberFormat('@STRING@');
    }
  } catch(e) {}
}

function ensureDefaultUser(ss, sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    sheet.appendRow(["admin@talentnexus.com", "admin123", "HR Admin", "admin", "@HR_Admin", "000000000", new Date(), ""]);
    sheet.getRange("B:B").setNumberFormat('@STRING@');
    sheet.getRange("F:F").setNumberFormat('@STRING@');
  }
}

// ==================== LOGIN PAGE (minimal) ====================

function getLoginPage(errorMsg) {
  var errHtml = errorMsg ? '<div id="err" style="color:#f87171;text-align:center;margin-top:12px;font-size:13px">' + esc(errorMsg) + '</div>' : '<div id="err" style="display:none"></div>';

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Talent Nexus — Sign In</title>'
+ '<style>body{font-family:Arial,sans-serif;background:#08080c;color:#e8e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}'
+ '.box{background:#111118;border:1px solid #2a2a3c;border-radius:12px;padding:30px;width:340px;text-align:center}'
+ 'h2{color:#c9a84c;margin:0 0 6px;font-size:18px}.sub{color:#62627a;font-size:10px;margin-bottom:20px}'
+ 'input{width:100%;padding:10px;margin-bottom:10px;background:#1a1a2e;border:1px solid #2a2a3c;border-radius:6px;color:#e8e8f0;font-size:13px;box-sizing:border-box;outline:none}'
+ 'input:focus{border-color:#c9a84c}'
+ 'button{width:100%;padding:11px;background:#c9a84c;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer}'
+ 'button:hover{background:#d4b85e}button:disabled{opacity:.5}'
+ '</style></head><body><div class="box">'
+ '<h2>Talent Nexus</h2><div class="sub">Employee Portal &bull; v4-minimal</div>'
+ '<input type="text" id="tgName" placeholder="Telegram Name (e.g. @username)" autofocus>'
+ '<input type="text" id="tgId" placeholder="Telegram ID">'
+ '<input type="password" id="pw" placeholder="Password">'
+ '<button id="btn" onclick="doLogin()">Sign In</button>'
+ errHtml
+ '</div>'
+ '<script>'
+ 'document.getElementById("pw").addEventListener("keydown",function(e){if(e.key==="Enter")doLogin()});'
+ 'function doLogin(){'
+ 'var n=document.getElementById("tgName").value.trim();'
+ 'var i=document.getElementById("tgId").value.trim();'
+ 'var p=document.getElementById("pw").value;'
+ 'var e=document.getElementById("err");'
+ 'var b=document.getElementById("btn");'
+ 'e.style.display="none";'
+ 'if(!n||!i||!p){e.textContent="All fields required.";e.style.display="block";return}'
+ 'b.textContent="Signing in...";b.disabled=true;'
+ 'google.script.run'
+ '  .withSuccessHandler(function(r){'
+ '    if(r.ok){window.location.href=window.location.href.split("?")[0]+"?session="+encodeURIComponent(r.token)}'
+ '    else{e.textContent=r.error;e.style.display="block";b.textContent="Sign In";b.disabled=false}'
+ '  })'
+ '  .withFailureHandler(function(err){e.textContent="Error: "+err.message;e.style.display="block";b.textContent="Sign In";b.disabled=false})'
+ '  .handlePortalLogin({tgName:n,tgId:i,password:p});'
+ '}'
+ '</script></body></html>';
}

// ==================== PORTAL PAGE (minimal) ====================

function getPortalPage(session) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Talent Nexus — Portal</title>'
+ '<style>body{font-family:Arial,sans-serif;background:#08080c;color:#e8e8f0;padding:20px;margin:0}'
+ '.bar{background:#0d0d14;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1f1f2e;margin:-20px -20px 20px}'
+ '.bar span{font-weight:700;color:#c9a84c}.bar button{background:transparent;border:1px solid #2a2a3c;color:#9a9ab2;padding:5px 12px;border-radius:4px;cursor:pointer;font-size:11px}'
+ '.bar button:hover{color:#fff;border-color:#c9a84c}'
+ '.tabs{display:flex;gap:4px;margin-bottom:16px}'
+ '.tab{padding:8px 16px;background:#111118;border:1px solid #1f1f2e;color:#9a9ab2;cursor:pointer;border-radius:6px;font-size:12px}'
+ '.tab.on{background:#1a1a2e;color:#c9a84c;border-color:#c9a84c}'
+ '.card{background:#111118;border:1px solid #1f1f2e;border-radius:8px;padding:16px;margin-bottom:12px}'
+ '.card h3{font-size:11px;color:#9a9ab2;margin:0 0 12px;text-transform:uppercase;letter-spacing:.5px}'
+ '.row{display:flex;gap:10px;margin-bottom:8px}.row>div{flex:1}'
+ 'label{display:block;font-size:9px;color:#62627a;margin-bottom:3px;text-transform:uppercase}'
+ 'input,select,textarea{width:100%;padding:8px;background:#0d0d14;border:1px solid #1f1f2e;border-radius:4px;color:#e8e8f0;font-size:11px;box-sizing:border-box;outline:none}'
+ 'input:focus,select:focus{border-color:#c9a84c}'
+ '.btn{padding:10px;background:#c9a84c;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;width:100%}'
+ '.btn:hover{background:#d4b85e}.btn:disabled{opacity:.5}'
+ '.sum{display:flex;justify-content:space-between;padding:4px 0;font-size:11px}'
+ '.sum.net{font-weight:700;color:#c9a84c;font-size:13px;border-top:1px solid #1f1f2e;margin-top:4px;padding-top:6px}'
+ '@media(max-width:500px){.row{flex-direction:column}}'
+ '</style></head><body>'
+ '<div class="bar"><span>' + esc(session.tgName || session.name) + '</span><button onclick="location.href=location.href.split(\'?\')[0]">Sign Out</button></div>'
+ '<div class="tabs"><button class="tab on" id="tab-ps" onclick="switchTab(\'ps\')">Payslip</button><button class="tab" id="tab-ex" onclick="switchTab(\'ex\')">Experience Letter</button></div>'

// Payslip panel
+ '<div id="panel-ps"><div class="card"><h3>Generate Payslip</h3>'
+ '<div class="row"><div><label>Employee Name *</label><input type="text" id="psName" value="' + esc(session.name) + '"></div><div><label>Employee ID *</label><input type="text" id="psId"></div></div>'
+ '<div class="row"><div><label>Department</label><input type="text" id="psDept"></div><div><label>Designation</label><input type="text" id="psDesig"></div></div>'
+ '<div class="row"><div><label>Pay Period From</label><input type="text" id="psFrom"></div><div><label>Pay Period To</label><input type="text" id="psTo"></div><div><label>Payment Date</label><input type="text" id="psPayDate"></div></div>'
+ '<div class="row"><div><label>Basic Salary</label><input type="number" id="psBasic" step="0.01" oninput="calc()"></div><div><label>Allowance</label><input type="number" id="psAllow" step="0.01" oninput="calc()"></div><div><label>Bonus</label><input type="number" id="psBonus" step="0.01" oninput="calc()"></div></div>'
+ '<div class="row"><div><label>Overtime</label><input type="number" id="psOT" step="0.01" oninput="calc()"></div><div><label>Commission</label><input type="number" id="psComm" step="0.01" oninput="calc()"></div></div>'
+ '<div class="row"><div><label>Tax</label><input type="number" id="psTax" step="0.01" oninput="calc()"></div><div><label>EPF/ETF</label><input type="number" id="psEpf" step="0.01" oninput="calc()"></div><div><label>Insurance</label><input type="number" id="psIns" step="0.01" oninput="calc()"></div></div>'
+ '<div class="row"><div><label>Loan</label><input type="number" id="psLoan" step="0.01" oninput="calc()"></div><div><label>Other Ded.</label><input type="number" id="psOther" step="0.01" oninput="calc()"></div></div>'
+ '<div class="row"><div><label>Bank</label><input type="text" id="psBank"></div><div><label>Account #</label><input type="text" id="psAcct"></div><div><label>Email (optional)</label><input type="email" id="psEmail"></div></div>'
+ '<div class="sum"><span>Gross</span><span id="gross">$0.00</span></div>'
+ '<div class="sum"><span>Deductions</span><span id="ded">$0.00</span></div>'
+ '<div class="sum net"><span>NET PAY</span><span id="net">$0.00</span></div>'
+ '<button class="btn" id="psBtn" onclick="genPs()" style="margin-top:10px">Generate Payslip</button>'
+ '<div id="psMsg" style="font-size:10px;text-align:center;margin-top:8px"></div>'
+ '</div></div>'

// Experience panel
+ '<div id="panel-ex" style="display:none"><div class="card"><h3>Generate Experience Letter</h3>'
+ '<div class="row"><div><label>Employee Name *</label><input type="text" id="exName" value="' + esc(session.name) + '"></div><div><label>Position *</label><input type="text" id="exPos"></div></div>'
+ '<div class="row"><div><label>Shift / Team</label><input type="text" id="exShift"></div><div><label>Certificate Date</label><input type="text" id="exDate"></div></div>'
+ '<div class="row"><div><label>Training Start</label><input type="text" id="exTrain"></div><div><label>Working Start</label><input type="text" id="exOfficial"></div></div>'
+ '<div class="row"><div><label>Address</label><input type="text" id="exAddr"></div><div><label>Email (optional)</label><input type="email" id="exEmail"></div></div>'
+ '<label>Custom Letter Text (optional)</label><textarea id="exBody" rows="3" style="width:100%;margin-bottom:8px"></textarea>'
+ '<button class="btn" id="exBtn" onclick="genEx()">Generate Experience Letter</button>'
+ '<div id="exMsg" style="font-size:10px;text-align:center;margin-top:8px"></div>'
+ '</div></div>'

+ '<script>var TOKEN="' + session.token + '";'
+ 'function switchTab(t){document.getElementById("panel-ps").style.display=t==="ps"?"block":"none";document.getElementById("panel-ex").style.display=t==="ex"?"block":"none";document.getElementById("tab-ps").className="tab"+(t==="ps"?" on":"");document.getElementById("tab-ex").className="tab"+(t==="ex"?" on":"")}'
+ 'function v(id){return document.getElementById(id).value.trim()}'
+ 'function n(id){var x=parseFloat(document.getElementById(id).value);return isNaN(x)?0:x}'
+ 'function f(x){return x.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}'
+ 'function calc(){var g=n("psBasic")+n("psAllow")+n("psBonus")+n("psOT")+n("psComm");var d=n("psTax")+n("psEpf")+n("psIns")+n("psLoan")+n("psOther");document.getElementById("gross").textContent="$"+f(g);document.getElementById("ded").textContent="$"+f(d);document.getElementById("net").textContent="$"+f(g-d)}'
+ 'function post(action,data,btn,msg){var b=document.getElementById(btn);var m=document.getElementById(msg);m.textContent="";b.disabled=true;b.textContent="Generating...";var f=document.createElement("form");f.method="POST";f.action="";f.target="_blank";data.action=action;data.session=TOKEN;for(var k in data){var i=document.createElement("input");i.name=k;i.value=data[k];f.appendChild(i)}document.body.appendChild(f);f.submit();document.body.removeChild(f);setTimeout(function(){b.disabled=false;b.textContent=action==="generate_payslip"?"Generate Payslip":"Generate Experience Letter";m.textContent="Opening in new tab...";m.style.color="#10b981"},1500)}'
+ 'function genPs(){var d={employeeName:v("psName"),employeeId:v("psId"),department:v("psDept"),designation:v("psDesig"),payPeriodFrom:v("psFrom"),payPeriodTo:v("psTo"),paymentDate:v("psPayDate"),bankName:v("psBank"),accountNumber:v("psAcct"),basicSalary:v("psBasic"),allowance:v("psAllow"),attendanceBonus:v("psBonus"),overtime:v("psOT"),commission:v("psComm"),tax:v("psTax"),epfEtf:v("psEpf"),insurance:v("psIns"),loanDeduction:v("psLoan"),otherDeduction:v("psOther"),emailTo:v("psEmail"),months:"1"};if(!d.employeeName||!d.employeeId){var m=document.getElementById("psMsg");m.textContent="Name and ID required.";m.style.color="#ef4444";return}post("generate_payslip",d,"psBtn","psMsg")}'
+ 'function genEx(){var d={employeeName:v("exName"),position:v("exPos"),shift:v("exShift"),trainingStart:v("exTrain"),officialDate:v("exOfficial"),address:v("exAddr"),certDate:v("exDate"),bodyText:v("exBody"),emailTo:v("exEmail")};if(!d.employeeName||!d.position){var m=document.getElementById("exMsg");m.textContent="Name and Position required.";m.style.color="#ef4444";return}post("generate_experience",d,"exBtn","exMsg")}'
+ '</script></body></html>';
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
  logRequest("payslip", empName, empId);
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
  var defaultBody = '<p>This is to certify that <b>' + esc(empName) + '</b> was employed with <b>Talent Nexus</b>. During their tenure as <b>' + esc(position) + '</b>, they demonstrated outstanding professionalism and commitment.</p>' +
    '<p>We confirm ' + firstName + ' has satisfactorily discharged all duties. We recommend ' + firstName + ' for any future position and wish them continued success.</p>';
  var refNo = "TN/HR/EXP/" + new Date().getFullYear() + "/" + Math.floor(Math.random()*9000+1000);
  logRequest("experience", empName, "");
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
  var docMsg = docType === "payslip"
    ? "Your payslip is ready. Click Download to view, print, or save."
    : "Your experience certificate is ready. Click Download to view, print, or save.";

  try {
    var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;border:1px solid #e2e2e2;border-radius:8px;background:#fff">' +
      '<div style="background:#1a1a2e;padding:22px 28px;text-align:center"><h1 style="color:#c9a84c;margin:0;font-size:20px">TALENT NEXUS</h1></div>' +
      '<div style="padding:24px 28px"><p style="font-size:14px;color:#333">Dear <b>' + esc(empName) + '</b>,</p>' +
      '<p style="font-size:13px;color:#555">' + docMsg + '</p>' +
      '<a href="' + docLink + '" style="display:inline-block;background:#c9a84c;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px">Download ' + docLabel + '</a>' +
      '<p style="font-size:11px;color:#999;margin-top:16px">For inquiries contact <a href="mailto:' + HR_EMAIL + '">' + HR_EMAIL + '</a></p></div>' +
      '<div style="background:#fafafa;padding:18px 28px;text-align:center;border-top:1px solid #eee">' +
      '<p style="font-size:12px;color:#555;margin:0"><b>With Regards,</b></p><p style="font-size:13px;color:#1a1a2e;margin:0">' + HR_NAME + '</p>' +
      '<p style="font-size:10px;color:#999;margin:0">Human Resources &bull; Talent Nexus</p></div></div>';

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
      if (s) s.appendRow([new Date(), "email_sent", empName, emailTo.trim()]);
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
  } catch(e) {}
  return token;
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
      '<script>function downloadFile(){var b=new Blob([document.documentElement.outerHTML],{type:"text/html"});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="' + esc(cleanTitle) + '.html";a.click()}' +
      'setTimeout(function(){window.print()},800)</script></body></html>'
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

function getOrCreateSheet(ss, name, headers) {
  var s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); if (headers) s.appendRow(headers); }
  return s;
}

function logRequest(type, empName, empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("RequestLog");
    if (!s) { s = ss.insertSheet("RequestLog"); s.appendRow(["Timestamp","Type","EmployeeName","EmployeeID"]); }
    s.appendRow([new Date(), type, empName, empId]);
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
