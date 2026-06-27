// CS Portal v3 — Talent Nexus Employee Self-Service with Login
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
  var token = str(p.token);
  var session = str(p.session);

  // Document token retrieval (from email download link)
  if (token && !session) {
    return handleDocumentToken(token);
  }

  // Portal page with valid session
  if (session) {
    var sessionData = validateSession(session);
    if (sessionData) {
      return HtmlService.createHtmlOutput(getPortalPage(sessionData))
        .setTitle("Talent Nexus — Employee Portal")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width,initial-scale=1,maximum-scale=1');
    }
  }

  // Default: Login page
  return HtmlService.createHtmlOutput(getLoginPage(p.error))
    .setTitle("Talent Nexus — Sign In")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width,initial-scale=1,maximum-scale=1');
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

    // Portal login — returns JSON
    if (action === "portal_login") {
      return json(handlePortalLogin(d));
    }

    // All other actions require valid session
    var session = validateSession(d.session);
    if (!session) {
      return HtmlService.createHtmlOutput(getLoginPage("Session expired. Please sign in again."))
        .setTitle("Talent Nexus — Sign In")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width,initial-scale=1');
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

    return json({ error: "Unknown action: " + action });
  } catch (err) {
    // Return error as visible HTML instead of blank JSON
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Error — Talent Nexus</title>' +
      '<style>body{font-family:"Segoe UI",Arial,sans-serif;background:#08080c;color:#e8e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}' +
      '.box{background:#111118;border:1px solid #2a2a3c;border-radius:12px;padding:30px 36px;max-width:480px;text-align:center}' +
      'h2{color:#ef4444;font-size:16px;margin:0 0 8px}.msg{color:#9a9ab2;font-size:11px;word-break:break-all;margin-bottom:16px}' +
      'a{color:#c9a84c;text-decoration:none;font-size:12px;font-weight:600}a:hover{text-decoration:underline}' +
      '</style></head><body><div class="box"><h2>Something went wrong</h2>' +
      '<div class="msg">' + esc(err.toString()) + '</div>' +
      '<a href="javascript:history.back()">Go Back</a></div></body></html>'
    ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// ==================== LOGIN & SESSIONS ====================

function handlePortalLogin(d) {
  var tgName = str(d.tgName);
  var tgId = str(d.tgId);
  var password = str(d.password);
  var ip = str(d.ip || "");

  if (!tgName || !tgId || !password) {
    return { ok: false, error: "All fields are required." };
  }

  var ss = SpreadsheetApp.openById(SHEET_ID);
  var userSheet = getOrCreateSheet(ss, "PortalUsers", ["Email", "Password", "Name", "Role", "TelegramName", "TelegramID", "CreatedAt", "LastLogin"]);
  userSheet.getRange("B:B").setNumberFormat('@STRING@');
  userSheet.getRange("F:F").setNumberFormat('@STRING@');
  migratePortalUsers(userSheet);
  ensureDefaultUser(ss, userSheet);

  var data = userSheet.getDataRange().getValues();
  var foundRow = -1;
  var foundName = "";
  var foundEmail = "";

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

    if (tgName !== oldTgName) {
      userSheet.getRange(foundRow + 1, 5).setValue(tgName);
      logChange(foundEmail, "TelegramName", oldTgName || "(empty)", tgName);
    }
    if (tgId !== oldTgId) {
      userSheet.getRange(foundRow + 1, 6).setValue(tgId);
      logChange(foundEmail, "TelegramID", oldTgId || "(empty)", tgId);
    }
    userSheet.getRange(foundRow + 1, 8).setValue(new Date());

    var sessionToken = createSession(tgName, tgId, foundName);
    logLogin(foundEmail, password, tgName, tgId, "success", foundName, ip);
    return { ok: true, token: sessionToken, name: foundName, tgName: tgName };
  }

  var userExists = false;
  for (var j = 1; j < data.length; j++) {
    var rTn = str(data[j][4]).toLowerCase();
    var rTi = str(data[j][5]).replace(/[^0-9]/g, "");
    if (rTn === tgNameLower || (tgIdClean && rTi === tgIdClean)) { userExists = true; break; }
  }
  var errMsg = userExists ? "Incorrect password." : "Telegram account not found. Contact HR for access.";
  logLogin("", password, tgName, tgId, "failed", errMsg, ip);
  return { ok: false, error: errMsg };
}

function migratePortalUsers(sheet) {
  try {
    var data = sheet.getDataRange().getValues();
    if (data.length < 1) return;
    var headers = data[0];
    // Check if old format (6 columns without TelegramName/TelegramID)
    if (headers.length <= 6) {
      // Add TelegramName and TelegramID columns after Role (col 4)
      sheet.insertColumns(5, 2);
      sheet.getRange(1, 5).setValue("TelegramName");
      sheet.getRange(1, 6).setValue("TelegramID");
      sheet.getRange("F:F").setNumberFormat('@STRING@');
    }
  } catch (e) {}
}

function ensureDefaultUser(ss, userSheet) {
  var data = userSheet.getDataRange().getValues();
  if (data.length <= 1) {
    userSheet.appendRow(["admin@talentnexus.com", "admin123", "HR Admin", "admin", "@HR_Admin", "000000000", new Date(), ""]);
    userSheet.getRange("B:B").setNumberFormat('@STRING@');
    userSheet.getRange("F:F").setNumberFormat('@STRING@');
  }
}

function createSession(tgName, tgId, name) {
  var token = "SES-" + new Date().getTime().toString(36) + "-" + Math.random().toString(36).substring(2, 9);
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sessionSheet = getOrCreateSheet(ss, "PortalSessions", ["Token", "TelegramName", "TelegramID", "Name", "CreatedAt", "ExpiresAt"]);
  // Migrate old session sheet if needed
  try {
    var hdr = sessionSheet.getDataRange().getValues()[0];
    if (hdr.length < 6) {
      sessionSheet.clear();
      sessionSheet.appendRow(["Token", "TelegramName", "TelegramID", "Name", "CreatedAt", "ExpiresAt"]);
    }
  } catch(e) {}
  var expires = new Date(Date.now() + SESSION_HOURS * 3600000);
  sessionSheet.appendRow([token, tgName, tgId, name, new Date(), expires]);
  cleanupOldSessions(sessionSheet);
  return token;
}

function validateSession(token) {
  if (!token) return null;
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sessionSheet = ss.getSheetByName("PortalSessions");
    if (!sessionSheet || sessionSheet.getLastRow() < 2) return null;
    var data = sessionSheet.getDataRange().getValues();
    var now = new Date();
    for (var i = 1; i < data.length; i++) {
      if (str(data[i][0]) === token) {
        var expires = new Date(data[i][5]);
        if (expires > now) {
          return { name: str(data[i][3]), tgName: str(data[i][1]), tgId: str(data[i][2]), token: token, expires: expires };
        }
      }
    }
  } catch (e) {}
  return null;
}

function cleanupOldSessions(sheet) {
  try {
    var data = sheet.getDataRange().getValues();
    var now = new Date();
    var rowsToDelete = [];
    for (var i = data.length - 1; i >= 1; i--) {
      try {
        if (new Date(data[i][5]) < now) rowsToDelete.push(i + 1);
      } catch (e) {}
    }
    // Delete from bottom up
    rowsToDelete.sort(function(a, b) { return b - a; });
    for (var j = 0; j < rowsToDelete.length; j++) {
      sheet.deleteRow(rowsToDelete[j]);
    }
  } catch (e) {}
}

function logLogin(email, password, tgName, tgId, status, detail, ip) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var logSheet = getOrCreateSheet(ss, "LoginLog", ["Timestamp", "Email", "Password", "Name", "TelegramName", "TelegramID", "Status", "Detail", "IP"]);
    logSheet.getRange("C:C").setNumberFormat('@STRING@');
    logSheet.appendRow([new Date(), email, String(password || ""), detail, tgName || "", tgId || "", status, detail, ip || ""]);
  } catch (e) {}
}

function logChange(email, field, oldValue, newValue) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var changeSheet = getOrCreateSheet(ss, "PortalChanges", ["Timestamp", "Email", "Field", "OldValue", "NewValue"]);
    changeSheet.appendRow([new Date(), email, field, oldValue, newValue]);
  } catch (e) {}
}

// ==================== DOCUMENT TOKEN RETRIEVAL (unchanged) ====================

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
    '<p style="color:#999;font-size:12px">Tokens expire after 7 days. Please generate a new document from the portal.</p>' +
    '<a href="https://bit.ly/TNPortal" style="color:#c9a84c">Go to Talent Nexus Portal</a>' +
    '</body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== LOGIN PAGE HTML ====================

function getLoginPage(errorMsg) {
  var errHtml = errorMsg ? '<div class="login-err on">' + esc(errorMsg) + '</div>' : '<div class="login-err"></div>';

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><title>Talent Nexus — Sign In</title><style>' +
    ':root{--bg:#08080c;--s:#0d0d14;--c:#111118;--h:#161622;--b:#1f1f2e;--bl:#2a2a3c;--t:#e8e8f0;--t2:#9a9ab2;--tm:#62627a;--gold:#c9a84c;--gold2:#a8882e;--g:#10b981;--r:#ef4444}' +
    '*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}' +
    '@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}' +
    'body{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--t);min-height:100vh;font-size:13px;-webkit-font-smoothing:antialiased;display:flex;align-items:center;justify-content:center;background-image:radial-gradient(circle at 20% 10%,rgba(201,168,76,0.03),transparent 50%),radial-gradient(circle at 80% 90%,rgba(201,168,76,0.02),transparent 50%)}' +
    '.login-wrap{width:100%;max-width:400px;padding:20px;animation:fadeUp .5s ease}' +
    '.login-card{background:rgba(22,22,34,0.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(201,168,76,0.1);border-radius:20px;padding:36px 30px;box-shadow:0 8px 48px rgba(0,0,0,.6),0 0 80px rgba(201,168,76,.03)}' +
    '.login-logo{width:48px;height:48px;background:linear-gradient(135deg,var(--gold),var(--gold2));border-radius:14px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 32px rgba(201,168,76,.25)}' +
    '.login-logo span{font-size:18px;font-weight:900;color:#fff}' +
    '.login-card h1{text-align:center;font-size:18px;font-weight:700;margin-bottom:4px;color:var(--t)}' +
    '.login-card .sub{text-align:center;color:var(--tm);font-size:10px;margin-bottom:24px}' +
    '.login-card label{display:block;font-size:8px;font-weight:700;color:var(--tm);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}' +
    '.login-card input{width:100%;padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;color:var(--t);font-size:12px;font-family:inherit;outline:none;margin-bottom:12px;transition:all .2s}' +
    '.login-card input:focus{border-color:rgba(201,168,76,.4);box-shadow:0 0 0 3px rgba(201,168,76,.06);background:rgba(255,255,255,.05)}' +
    '.login-card input::placeholder{color:var(--tm);opacity:.6}' +
    '.pw-wrap{position:relative}.pw-wrap input{padding-right:40px}' +
    '.pw-toggle{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--tm);cursor:pointer;font-size:16px;padding:4px 8px}.pw-toggle:hover{color:var(--t)}' +
    '.btn-login{width:100%;padding:11px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 2px 16px rgba(201,168,76,.2);font-family:inherit}' +
    '.btn-login:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(201,168,76,.35)}' +
    '.btn-login:disabled{opacity:.45;cursor:not-allowed;transform:none}' +
    '.login-err{display:none;margin-top:12px;padding:8px 10px;background:rgba(239,68,68,.06);color:#f87171;border-radius:8px;font-size:10px;text-align:center;border:1px solid rgba(239,68,68,.1)}' +
    '.login-err.on{display:block}' +
    '.login-info{background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.08);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:9px;color:var(--t2);line-height:1.6}' +
    '.login-info b{color:var(--gold)}' +
    '.login-foot{text-align:center;margin-top:16px;font-size:8px;color:var(--tm)}' +
    '@media(max-width:440px){.login-wrap{padding:12px}.login-card{padding:24px 18px}}' +
    '</style></head><body>' +
    '<div class="login-wrap"><div class="login-card">' +
    '<div class="login-logo"><span>TN</span></div>' +
    '<h1>Talent Nexus</h1><p class="sub">Employee Self-Service Portal</p>' +
    '<div class="login-info">Sign in with your <b>Telegram account</b> to access payslips and experience letters.<br>Contact <b>' + esc(HR_EMAIL) + '</b> if you need access.</div>' +
    '<label>Telegram Name</label>' +
    '<input type="text" id="loginTgName" placeholder="@username or display name" autofocus>' +
    '<label>Telegram ID</label>' +
    '<input type="text" id="loginTgId" placeholder="Numeric ID from @userinfobot">' +
    '<label>Password</label>' +
    '<div class="pw-wrap"><input type="password" id="loginPw" placeholder="Enter your password" autocomplete="current-password"><button class="pw-toggle" onclick="togglePw()" type="button">&#128065;</button></div>' +
    '<button class="btn-login" id="loginBtn" onclick="doLogin()">Sign In</button>' +
    errHtml +
    '<div class="login-foot">Talent Nexus HR &bull; ' + esc(CO_WEBSITE) + '</div>' +
    '</div></div>' +
    '<script>' +
    'document.getElementById("loginPw").addEventListener("keydown",function(e){if(e.key==="Enter")doLogin()});' +
    'function togglePw(){var el=document.getElementById("loginPw");var btn=event.target;el.type=el.type==="password"?"text":"password";btn.innerHTML=el.type==="password"?"&#128065;":"&#128064;"}' +
    'function doLogin(){var tgName=document.getElementById("loginTgName").value.trim();var tgId=document.getElementById("loginTgId").value.trim();var pw=document.getElementById("loginPw").value;var err=document.querySelector(".login-err");var btn=document.getElementById("loginBtn");' +
    'err.classList.remove("on");if(!tgName||!tgId||!pw){err.textContent="All fields are required.";err.classList.add("on");return}' +
    'btn.textContent="Signing in...";btn.disabled=true;' +
    'google.script.run.withSuccessHandler(function(r){' +
    'if(r.ok){window.location.href=window.location.href.split("?")[0]+"?session="+encodeURIComponent(r.token)}' +
    'else{err.textContent=r.error||"Login failed";err.classList.add("on");btn.textContent="Sign In";btn.disabled=false}' +
    '}).withFailureHandler(function(e){err.textContent="Connection error. Check your internet and try again.";err.classList.add("on");btn.textContent="Sign In";btn.disabled=false})' +
    '.handlePortalLogin({tgName:tgName,tgId:tgId,password:pw})}' +
    '</script></body></html>';
}

// ==================== PORTAL PAGE HTML ====================

function getPortalPage(session) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><title>Talent Nexus — Employee Portal</title><style>' +
    ':root{--bg:#08080c;--s:#0d0d14;--c:#111118;--h:#161622;--b:#1f1f2e;--bl:#2a2a3c;--t:#e8e8f0;--t2:#9a9ab2;--tm:#62627a;--gold:#c9a84c;--gold2:#a8882e;--g:#10b981;--r:#ef4444}' +
    '*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}' +
    '@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}' +
    'body{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--t);min-height:100vh;font-size:13px;-webkit-font-smoothing:antialiased;background-image:radial-gradient(circle at 20% 10%,rgba(201,168,76,0.03),transparent 50%),radial-gradient(circle at 80% 90%,rgba(201,168,76,0.02),transparent 50%)}' +
    '.header{background:var(--s);border-bottom:1px solid var(--b);padding:0 20px;height:52px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}' +
    '.header-l{display:flex;align-items:center;gap:10px}.logo{width:30px;height:30px;border-radius:6px;background:linear-gradient(135deg,var(--gold),var(--gold2));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px}' +
    '.header-l h1{font-size:13px;font-weight:700}.header-l .sub{font-size:9px;color:var(--tm);font-weight:500}' +
    '.header-r{display:flex;align-items:center;gap:10px;font-size:10px;color:var(--t2)}' +
    '.btn-sm{background:transparent;border:1px solid var(--b);color:var(--t2);padding:4px 10px;border-radius:5px;cursor:pointer;font-size:9px;font-weight:600;font-family:inherit;transition:all .15s;text-decoration:none}' +
    '.btn-sm:hover{background:var(--h);color:var(--t);border-color:var(--gold)}' +
    '.container{max-width:760px;margin:0 auto;padding:20px 16px 40px}' +
    '.tabs{display:flex;gap:2px;margin-bottom:20px;background:var(--c);border-radius:12px;padding:4px;border:1px solid var(--b)}' +
    '.tab{flex:1;padding:10px;text-align:center;cursor:pointer;border-radius:8px;font-size:11px;font-weight:600;color:var(--tm);transition:all .15s;border:1px solid transparent;background:transparent;font-family:inherit}' +
    '.tab:hover{color:var(--t2)}.tab.ac{background:var(--h);color:var(--gold);border-color:rgba(201,168,76,0.15)}' +
    '.card{background:var(--c);border:1px solid var(--b);border-radius:16px;padding:24px;animation:fadeUp .4s ease;margin-bottom:12px}' +
    '.form-group{margin-bottom:14px}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}' +
    'label{display:block;font-size:8px;font-weight:700;color:var(--tm);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}' +
    'input,select,textarea{width:100%;padding:9px 11px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:8px;color:var(--t);font-size:11px;font-family:inherit;outline:none;transition:all .2s}' +
    'input:focus,select:focus,textarea:focus{border-color:rgba(201,168,76,.35);box-shadow:0 0 0 3px rgba(201,168,76,.05);background:rgba(255,255,255,.04)}' +
    'select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%23c9a84c\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10z\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:32px}' +
    'select option{background:var(--c);color:var(--t)}textarea{min-height:80px;resize:vertical}::placeholder{color:var(--tm);opacity:.6}' +
    '.section-hd{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--gold);margin:18px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--b)}' +
    '.calc-row{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--h);border-radius:8px;margin-bottom:4px;font-size:11px}' +
    '.calc-row.net{background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.12);font-size:13px;font-weight:700;color:var(--gold)}' +
    '.btn{width:100%;padding:12px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit;box-shadow:0 2px 16px rgba(201,168,76,.2)}' +
    '.btn:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(201,168,76,.35)}.btn:disabled{opacity:.45;cursor:not-allowed;transform:none}' +
    '.info-box{background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.08);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:9px;color:var(--t2);line-height:1.5}' +
    '.info-box b{color:var(--gold)}.month-selector{display:flex;gap:6px;align-items:center;margin-bottom:14px;flex-wrap:wrap}' +
    '.month-selector label{margin-bottom:0;margin-right:4px}.month-selector select{width:auto;min-width:70px}' +
    '.status{display:none;margin-top:10px;padding:10px 14px;border-radius:8px;font-size:10px;font-weight:600;text-align:center}' +
    '.status.error{display:block;background:rgba(239,68,68,.06);color:#f87171;border:1px solid rgba(239,68,68,.1)}' +
    '.status.success{display:block;background:rgba(16,185,129,.06);color:var(--g);border:1px solid rgba(16,185,129,.1)}' +
    '.footer{text-align:center;padding:20px;color:var(--tm);font-size:9px}' +
    '@media(max-width:600px){.form-row,.form-row-3{grid-template-columns:1fr}.card{padding:16px}.container{padding:12px 8px 30px}}' +
    '</style></head><body>' +
    // Header
    '<div class="header"><div class="header-l"><div class="logo">TN</div><div><h1>Talent Nexus</h1><div class="sub">Employee Self-Service Portal</div></div></div>' +
    '<div class="header-r"><span>' + esc(session.tgName || session.name) + '</span><button class="btn-sm" onclick="doLogout()">Sign Out</button></div></div>' +
    '<div class="container">' +
    // Tabs
    '<div class="tabs"><button class="tab ac" id="tab-payslip" onclick="switchTab(\'payslip\')">Payslip</button><button class="tab" id="tab-experience" onclick="switchTab(\'experience\')">Experience Letter</button></div>' +
    // Payslip panel
    '<div id="panel-payslip"><div class="card">' +
    '<div class="info-box">Fill in your details below and click <b>Generate Payslip</b> to download a professional PDF. You can generate up to <b>12 months</b> at once.</div>' +
    '<div class="month-selector"><label>Months:</label><select id="psMonths" onchange="updateMonthInfo()">' +
    '<option value="1">1 Month</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>' +
    '<option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select><span id="monthInfo" style="font-size:9px;color:var(--tm)">— 1 page</span></div>' +
    '<div class="section-hd">Employee Information</div>' +
    '<div class="form-row"><div class="form-group"><label>Employee Name *</label><input type="text" id="psName" value="' + esc(session.name) + '"></div><div class="form-group"><label>Employee ID *</label><input type="text" id="psId" placeholder="e.g. CS2002202400"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Department</label><input type="text" id="psDept" placeholder="Customer Service"></div><div class="form-group"><label>Designation</label><input type="text" id="psDesig" placeholder="e.g. QA Specialist"></div></div>' +
    '<div class="form-row-3"><div class="form-group"><label>Pay Period From</label><input type="text" id="psFrom" placeholder="01/04/26"></div><div class="form-group"><label>Pay Period To</label><input type="text" id="psTo" placeholder="30/04/26"></div><div class="form-group"><label>Payment Date</label><input type="text" id="psPayDate" placeholder="15-05-2026"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Bank Name</label><input type="text" id="psBank" placeholder="e.g. Binance"></div><div class="form-group"><label>Account Number</label><input type="text" id="psAcct" placeholder="Account number"></div></div>' +
    '<div class="section-hd">Earnings (USD)</div>' +
    '<div class="form-row-3"><div class="form-group"><label>Basic Salary</label><input type="number" id="psBasic" placeholder="0.00" step="0.01" oninput="calcSalary()"></div><div class="form-group"><label>Allowance</label><input type="number" id="psAllow" placeholder="0.00" step="0.01" oninput="calcSalary()"></div><div class="form-group"><label>Attendance Bonus</label><input type="number" id="psBonus" placeholder="0.00" step="0.01" oninput="calcSalary()"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Overtime</label><input type="number" id="psOT" placeholder="0.00" step="0.01" oninput="calcSalary()"></div><div class="form-group"><label>Commission</label><input type="number" id="psComm" placeholder="0.00" step="0.01" oninput="calcSalary()"></div></div>' +
    '<div class="section-hd">Deductions (USD)</div>' +
    '<div class="form-row-3"><div class="form-group"><label>Tax</label><input type="number" id="psTax" placeholder="0.00" step="0.01" oninput="calcSalary()"></div><div class="form-group"><label>EPF / ETF</label><input type="number" id="psEpf" placeholder="0.00" step="0.01" oninput="calcSalary()"></div><div class="form-group"><label>Insurance</label><input type="number" id="psIns" placeholder="0.00" step="0.01" oninput="calcSalary()"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Loan Deduction</label><input type="number" id="psLoan" placeholder="0.00" step="0.01" oninput="calcSalary()"></div><div class="form-group"><label>Other Deduction</label><input type="number" id="psOther" placeholder="0.00" step="0.01" oninput="calcSalary()"></div></div>' +
    '<div class="section-hd">Pay Summary</div>' +
    '<div class="calc-row"><span>Gross Salary</span><span id="calcGross">USD $0.00</span></div>' +
    '<div class="calc-row"><span>Total Deductions</span><span id="calcDed">USD $0.00</span></div>' +
    '<div class="calc-row net"><span>NET PAY</span><span id="calcNet">USD $0.00</span></div>' +
    '<div class="form-group" style="margin-top:12px"><label>Email document to (optional)</label><input type="email" id="psEmail" placeholder="Leave blank to skip email"></div>' +
    '<button class="btn" id="psBtn" onclick="generatePayslip()">Generate Payslip</button><div class="status" id="psStatus"></div>' +
    '</div></div>' +
    // Experience panel
    '<div id="panel-experience" style="display:none"><div class="card">' +
    '<div class="info-box">Generate a professional <b>Experience Certificate</b> for any employee. A PDF will open in a new tab ready for printing.</div>' +
    '<div class="section-hd">Employee Information</div>' +
    '<div class="form-row"><div class="form-group"><label>Employee Name *</label><input type="text" id="expName" value="' + esc(session.name) + '"></div><div class="form-group"><label>Position Held *</label><input type="text" id="expPos" placeholder="e.g. Customer Service Representative"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Shift / Team</label><input type="text" id="expShift" placeholder="e.g. Group-A, Morning Shift"></div><div class="form-group"><label>Certificate Date</label><input type="text" id="expCertDate" placeholder="e.g. 27 June 2026"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Training Start Date</label><input type="text" id="expTrain" placeholder="e.g. 15/01/26"></div><div class="form-group"><label>Working Start Date</label><input type="text" id="expOfficial" placeholder="e.g. 01/02/26"></div></div>' +
    '<div class="form-group"><label>Address on Record</label><input type="text" id="expAddr" placeholder="Full address"></div>' +
    '<div class="form-group"><label>Custom Letter Text (optional)</label><textarea id="expBody" placeholder="Leave blank to use the default professional letter template."></textarea></div>' +
    '<div class="form-group"><label>Email certificate to (optional)</label><input type="email" id="expEmail" placeholder="Leave blank to skip email"></div>' +
    '<button class="btn" id="expBtn" onclick="generateExperience()">Generate Experience Letter</button><div class="status" id="expStatus"></div>' +
    '</div></div>' +
    '<div class="footer">Talent Nexus HR &bull; ' + esc(CO_WEBSITE) + ' &bull; ' + esc(HR_EMAIL) + '<br>UK: ' + esc(CO_ADDRESS_UK) + ' | Thailand: ' + esc(CO_ADDRESS_TH) + '</div>' +
    '</div>' +
    // Session token as JS variable
    '<script>var SESSION_TOKEN="' + session.token + '";' +
    'function switchTab(t){document.getElementById("panel-payslip").style.display=t==="payslip"?"block":"none";document.getElementById("panel-experience").style.display=t==="experience"?"block":"none";document.getElementById("tab-payslip").classList.toggle("ac",t==="payslip");document.getElementById("tab-experience").classList.toggle("ac",t==="experience")}' +
    'function n(id){return document.getElementById(id).value.trim()}' +
    'function f(id){var v=parseFloat(document.getElementById(id).value);return isNaN(v)?0:v}' +
    'function fmt2(v){return v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}' +
    'function calcSalary(){var b=f("psBasic"),a=f("psAllow"),bn=f("psBonus"),o=f("psOT"),c=f("psComm"),t=f("psTax"),e=f("psEpf"),i=f("psIns"),l=f("psLoan"),ot=f("psOther");var g=b+a+bn+o+c;var d=t+e+i+l+ot;document.getElementById("calcGross").textContent="USD $"+fmt2(g);document.getElementById("calcDed").textContent="USD $"+fmt2(d);document.getElementById("calcNet").textContent="USD $"+fmt2(g-d)}' +
    'function postForm(action,data,callback){var f=document.createElement("form");f.method="POST";f.action="";f.target="_blank";data.action=action;data.session=SESSION_TOKEN;for(var k in data){var inp=document.createElement("input");inp.name=k;inp.value=data[k];f.appendChild(inp)}document.body.appendChild(f);f.submit();document.body.removeChild(f);if(callback)callback()}' +
    'function generatePayslip(){var s=document.getElementById("psStatus");s.className="status";s.textContent="";var data={employeeName:n("psName"),employeeId:n("psId"),department:n("psDept"),designation:n("psDesig"),payPeriodFrom:n("psFrom"),payPeriodTo:n("psTo"),paymentDate:n("psPayDate"),bankName:n("psBank"),accountNumber:n("psAcct"),basicSalary:n("psBasic"),allowance:n("psAllow"),attendanceBonus:n("psBonus"),overtime:n("psOT"),commission:n("psComm"),tax:n("psTax"),epfEtf:n("psEpf"),insurance:n("psIns"),loanDeduction:n("psLoan"),otherDeduction:n("psOther"),emailTo:n("psEmail"),months:document.getElementById("psMonths").value};if(!data.employeeName||!data.employeeId){s.textContent="Employee Name and ID are required.";s.className="status error";return}var btn=document.getElementById("psBtn");btn.textContent="Generating...";btn.disabled=true;postForm("generate_payslip",data,function(){btn.textContent="Generate Payslip";btn.disabled=false})}' +
    'function generateExperience(){var s=document.getElementById("expStatus");s.className="status";s.textContent="";var data={employeeName:n("expName"),position:n("expPos"),shift:n("expShift"),trainingStart:n("expTrain"),officialDate:n("expOfficial"),address:n("expAddr"),certDate:n("expCertDate"),bodyText:n("expBody"),emailTo:n("expEmail")};if(!data.employeeName||!data.position){s.textContent="Employee Name and Position are required.";s.className="status error";return}var btn=document.getElementById("expBtn");btn.textContent="Generating...";btn.disabled=true;postForm("generate_experience",data,function(){btn.textContent="Generate Experience Letter";btn.disabled=false})}' +
    'function doLogout(){window.location.href=window.location.href.split("?")[0]}' +
    'function updateMonthInfo(){var m=parseInt(document.getElementById("psMonths").value);document.getElementById("monthInfo").textContent="— "+(m===1?"1 page":m+" pages")+" in PDF"}' +
    '</script></body></html>';
}

// ==================== PAYSLIP GENERATION (unchanged) ====================

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
    '.hdr-co{color:#fff;font-size:13pt;font-weight:700;letter-spacing:0.5px}' +
    '.hdr-tag{color:#c9a84c;font-size:6.5pt;text-transform:uppercase;letter-spacing:1.5px}' +
    '.hdr-label{text-align:right;color:#c9a84c;font-size:11pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase}.hdr-month{text-align:right;color:#999;font-size:7pt}' +
    '.ctn{padding:6px 12px}.sec{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8b6914;border-bottom:1.5px solid #1a1a2e;padding-bottom:2px;margin:10px 0 5px}' +
    '.itbl{width:100%;border-collapse:collapse;border:1px solid #ddd;margin-bottom:6px}.itbl td{padding:4px 8px;font-size:8pt;border:1px solid #eee}' +
    '.itbl td.lbl{background:#f8f8f8;font-weight:600;color:#555;width:22%;font-size:7pt}' +
    '.stbl{width:100%;border-collapse:collapse;margin-bottom:4px}.stbl th{background:#1a1a2e;color:#c9a84c;padding:5px 10px;font-size:7.5pt;text-transform:uppercase;letter-spacing:0.5px;text-align:left}' +
    '.stbl th.rt{text-align:right}.stbl td{padding:4px 10px;font-size:8pt;border-bottom:1px solid #eee}.stbl td.rt{text-align:right}' +
    '.stbl tr.sub td{font-weight:700;border-top:2px solid #1a1a2e;border-bottom:0}' +
    '.sbox{margin-top:8px;border:2px solid #1a1a2e;padding:6px 14px}.srow{padding:2px 0;font-size:8.5pt}' +
    '.srow.net{font-size:12pt;font-weight:700;border-top:2px solid #1a1a2e;margin-top:3px;padding-top:4px;color:#1a1a2e}.srow .val{float:right}' +
    '.words{font-size:7pt;color:#666;margin-top:4px}.ft{margin-top:14px;border-top:1px solid #ddd;padding:6px 12px;text-align:center;font-size:6.5pt;color:#999}' +
    '.clear{clear:both}</style></head><body>' + pages + '</body></html>';
}

function payslipPage(nm,id,dp,ds,pf,pt,pd,bk,ac,ba,al,bo,ot,cm,tx,ep,ins,ln,oh,gr,td,nt,mlbl) {
  var fmt = function(v){return v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});};
  var amt = function(v){return v>0?"$"+fmt(v):"—";};
  var row = function(l,v){return '<tr><td>'+esc(l)+'</td><td class="rt">'+v+'</td></tr>';};
  var nfo = function(l,v){return '<tr><td class="lbl">'+esc(l)+'</td><td>'+esc(v)+'</td></tr>';};
  var monthsLabel = mlbl || "";

  return '<div class="pb"><table class="hdr-tbl"><tr>' +
    '<td width="40"><table><tr><td class="hdr-logo">TN</td></tr></table></td>' +
    '<td><div class="hdr-co">TALENT NEXUS</div><div class="hdr-tag">Connecting Talent. Creating Impact.</div></td>' +
    '<td align="right"><div class="hdr-label">PAYSLIP</div><div class="hdr-month">' + esc(monthsLabel) + '</div></td>' +
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
    '<div class="ft">This is a computer-generated payslip and does not require a signature.<br>' +
    '<b>Talent Nexus</b> &bull; ' + CO_WEBSITE + ' &bull; ' + HR_EMAIL + '<br>UK: ' + CO_ADDRESS_UK + '<br>Thailand: ' + CO_ADDRESS_TH + '</div></div>';
}

// ==================== EXPERIENCE LETTER GENERATION (unchanged) ====================

function generateExperienceHtml(d) {
  var empName = str(d.employeeName), position = str(d.position);
  var shift = str(d.shift), trainStart = str(d.trainingStart);
  var offDate = str(d.officialDate), address = str(d.address);
  var certDate = str(d.certDate) || new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  var bodyText = str(d.bodyText);
  var firstName = esc(empName.split(" ")[0]);
  if (!empName || !position) return "<h3>Error: Employee Name and Position are required.</h3>";
  var defaultBody = '<p>This is to certify that <b>' + esc(empName) + '</b> was employed with <b>Talent Nexus</b> from <b>' + esc(trainStart || offDate) + '</b>. During their tenure as <b>' + esc(position) + '</b>, they demonstrated outstanding professionalism, strong work ethic, and unwavering commitment to excellence.</p>' +
    '<p>' + firstName + ' consistently exceeded performance expectations, collaborated effectively with team members, and contributed meaningfully to organizational objectives. Their conduct, punctuality, and dedication were exemplary throughout their service period.</p>' +
    '<p>We confirm that ' + firstName + ' has satisfactorily discharged all duties and responsibilities. There are no outstanding obligations or pending matters on their part.</p>' +
    '<p>We wholeheartedly recommend ' + firstName + ' for any future position they may pursue and wish them continued success in all professional endeavors.</p>';
  var refNo = "TN/HR/EXP/" + new Date().getFullYear() + "/" + Math.floor(Math.random()*9000+1000);
  logRequest("experience", empName, "");

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '@page{size:A4;margin:14mm 15mm}body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:#1a1a2e;font-size:10pt;line-height:1.7;margin:0}' +
    '.hdr{width:100%;background:#1a1a2e;padding:10px 16px}.hdr-tbl{width:100%}.hdr-tbl td{padding:2px 8px}' +
    '.hdr-logo{width:30px;height:30px;background:#c9a84c;text-align:center;color:#fff;font-weight:900;font-size:13px}' +
    '.hdr-co{color:#fff;font-size:12pt;font-weight:700;letter-spacing:0.5px}' +
    '.hdr-tag{color:#c9a84c;font-size:6pt;text-transform:uppercase;letter-spacing:1.5px}' +
    '.title{text-align:center;font-size:13pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:14px 0 2px}' +
    '.line{width:50px;height:2px;background:#c9a84c;margin:0 auto 12px}' +
    '.ref{font-size:7pt;color:#999;margin-bottom:8px}.drow{text-align:right;font-size:8.5pt;margin-bottom:8px}' +
    '.to{font-size:8.5pt;font-weight:700;margin-bottom:10px}' +
    '.body-text{font-size:10pt;text-align:justify;margin-bottom:8px;line-height:1.9}.body-text p{margin:0 0 14px;text-indent:0}' +
    '.dtbl{width:100%;border-collapse:collapse;border:1px solid #ddd;margin:12px 0}' +
    '.dtbl td{padding:4px 10px;font-size:8pt;border:1px solid #eee}.dtbl td.lbl{background:#f8f8f8;font-weight:600;color:#555;width:28%}' +
    '.sig{margin-top:26px}.sig-sign{font-family:"Segoe Script","Brush Script MT","Great Vibes",cursive;font-size:16pt;color:#1a1a2e;margin-bottom:4px}' +
    '.sig-line{border-top:1.5px solid #1a1a2e;width:170px;margin-bottom:3px}.sig-name{font-weight:700;font-size:9.5pt}' +
    '.sig-role{font-size:7.5pt;color:#666}.sig-hr{font-size:7.5pt;color:#c9a84c;font-weight:600;margin-top:1px}' +
    '.ft{margin-top:20px;border-top:1px solid #ddd;padding-top:6px;text-align:center;font-size:6.5pt;color:#aaa}' +
    '</style></head><body>' +
    '<table class="hdr-tbl"><tr><td width="34"><table><tr><td class="hdr-logo">TN</td></tr></table></td>' +
    '<td><div class="hdr-co">TALENT NEXUS</div><div class="hdr-tag">Connecting Talent. Creating Impact.</div></td></tr></table>' +
    '<div class="title">EXPERIENCE CERTIFICATE</div><div class="line"></div>' +
    '<div class="ref">Ref: ' + refNo + '</div><div class="drow"><b>Date:</b> ' + esc(certDate) + '</div>' +
    '<div class="to">TO WHOM IT MAY CONCERN</div>' +
    '<div class="body-text">' + (bodyText || defaultBody) + '</div>' +
    '<table class="dtbl">' +
    '<tr><td class="lbl">Employee Name</td><td>' + esc(empName) + '</td></tr>' +
    '<tr><td class="lbl">Position Held</td><td>' + esc(position) + '</td></tr>' +
    '<tr><td class="lbl">Shift / Team</td><td>' + esc(shift) + '</td></tr>' +
    '<tr><td class="lbl">Training Start Date</td><td>' + esc(trainStart) + '</td></tr>' +
    '<tr><td class="lbl">Working Start Date</td><td>' + esc(offDate) + '</td></tr>' +
    '<tr><td class="lbl">Address on Record</td><td>' + esc(address) + '</td></tr></table>' +
    '<div class="sig"><div class="sig-sign">' + HR_NAME + '</div><div class="sig-line"></div>' +
    '<div class="sig-name">' + HR_NAME + '</div><div class="sig-role">Human Resources Representative</div>' +
    '<div class="sig-hr">TALENT NEXUS</div></div>' +
    '<div class="ft"><b>Talent Nexus</b> &bull; ' + CO_WEBSITE + ' &bull; ' + HR_EMAIL + '<br>' +
    'UK Office: ' + CO_ADDRESS_UK + ' &bull; Thailand Office: ' + CO_ADDRESS_TH + '<br>This is a computer-generated document.</div></body></html>';
}

// ==================== EMAIL (unchanged) ====================

function sendEmailIfRequested(d, htmlContent, filename, docType) {
  var emailTo = str(d.emailTo);
  if (!emailTo || !isValidEmail(emailTo)) return;
  var empName = str(d.employeeName) || "Employee";
  var today = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  var token = storeDocumentToken(docType, d);
  var docLink = APPS_SCRIPT_URL + "?token=" + encodeURIComponent(token);
  var docLabel = docType === "payslip" ? "Payslip" : "Experience Certificate";
  var docMsg = docType === "payslip"
    ? "Your payslip is ready. Click the Download button below to view, print, or save your document. For inquiries, contact the HR department."
    : "Your experience certificate is ready. Click the Download button below to view, print, or save your document. For inquiries, contact the HR department.";

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
      docContent = '<table cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #eee;border-radius:5px;width:100%;margin:10px 0"><tr><td style="padding:10px 0">' +
        '<p style="font-size:12px;color:#555;margin:0 14px 8px"><b>' + esc(docLabel) + '</b> &bull; ' + today + '</p>' +
        '<table style="width:100%;border-collapse:collapse"><tr><td style="width:50%;vertical-align:top"><p style="font-size:10px;font-weight:700;color:#1a1a2e;margin:0 14px 4px;text-transform:uppercase">Earnings</p>' + earnRows +
        '<tr style="border-top:1px solid #ddd"><td style="padding:4px 14px;font-size:10px;font-weight:700">Gross</td><td style="padding:4px 14px;font-size:10px;text-align:right;font-weight:700">' + amt2(gross) + '</td></tr>' +
        '</td><td style="width:50%;vertical-align:top"><p style="font-size:10px;font-weight:700;color:#1a1a2e;margin:0 14px 4px;text-transform:uppercase">Deductions</p>' +
        (dedRows || '<tr><td style="padding:2px 14px;font-size:10px;color:#999" colspan="2">None</td></tr>') +
        '<tr style="border-top:1px solid #ddd"><td style="padding:4px 14px;font-size:10px;font-weight:700">Total Ded.</td><td style="padding:4px 14px;font-size:10px;text-align:right;font-weight:700">' + amt2(totalDed) + '</td></tr>' +
        '</td></tr></table><table style="width:100%;border-collapse:collapse;margin-top:6px;border-top:2px solid #1a1a2e">' +
        '<tr><td style="padding:6px 14px;font-size:13px;font-weight:700;color:#1a1a2e">NET PAY</td><td style="padding:6px 14px;font-size:15px;font-weight:700;color:#1a6b3c;text-align:right">USD $' + fmt2(net) + '</td></tr></table></td></tr></table>';
    } else {
      var expP = str(d.position), expS = str(d.shift);
      var expT = str(d.trainingStart), expO = str(d.officialDate), expA = str(d.address);
      docContent = '<table cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #eee;border-radius:5px;width:100%;margin:10px 0"><tr><td style="padding:10px 14px">' +
        '<p style="font-size:12px;color:#555;margin:0 0 6px"><b>' + esc(docLabel) + '</b> &bull; ' + today + '</p>' +
        '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
        '<tr><td style="padding:3px 0;color:#888">Employee:</td><td style="padding:3px 0"><b>' + esc(empName) + '</b></td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Position:</td><td style="padding:3px 0">' + esc(expP) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Shift:</td><td style="padding:3px 0">' + esc(expS) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Training Start:</td><td style="padding:3px 0">' + esc(expT) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Working Start:</td><td style="padding:3px 0">' + esc(expO) + '</td></tr>' +
        '<tr><td style="padding:3px 0;color:#888">Address:</td><td style="padding:3px 0">' + esc(expA) + '</td></tr>' +
        '</table></td></tr></table>';
    }

    var htmlBody = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;border:1px solid #e2e2e2;border-radius:8px;overflow:hidden;background:#fff">' +
      '<div style="background:#1a1a2e;padding:22px 28px;text-align:center"><h1 style="color:#c9a84c;margin:0;font-size:20px;font-weight:700;letter-spacing:1px">TALENT NEXUS</h1>' +
      '<p style="color:#aaa;margin:4px 0 0;font-size:10px;letter-spacing:2px;text-transform:uppercase">Human Resources Department</p></div>' +
      '<div style="padding:24px 28px"><p style="font-size:14px;color:#333;margin:0 0 8px">Dear <b>' + esc(empName) + '</b>,</p>' +
      '<p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 8px">' + docMsg + '</p>' +
      '<table cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;width:100%;margin:10px 0"><tr>' +
      '<td style="width:90px;background:#1a1a2e;text-align:center;vertical-align:middle;padding:16px 0;border-radius:6px 0 0 6px"><span style="color:#c9a84c;font-size:28px;font-weight:900">TN</span></td>' +
      '<td style="padding:14px 16px;vertical-align:middle"><p style="font-size:12px;font-weight:700;color:#1a1a2e;margin:0 0 4px">' + esc(docLabel) + ' Ready</p>' +
      '<p style="font-size:11px;color:#888;margin:0 0 8px">' + esc(empName) + ' &bull; ' + today + '</p>' +
      '<a href="' + docLink + '" style="display:inline-block;background:#c9a84c;color:#fff;padding:6px 18px;border-radius:4px;text-decoration:none;font-size:11px;font-weight:600">Download</a></td></tr></table>' +
      docContent + '<p style="font-size:12px;color:#555;line-height:1.6;margin:8px 0 4px"><b>Download:</b> <a href="' + docLink + '" style="color:#c9a84c">View & Print Document</a></p>' +
      '<p style="font-size:12px;color:#999;line-height:1.6;margin:0">For inquiries, contact <a href="mailto:' + HR_EMAIL + '" style="color:#c9a84c;text-decoration:none"><b>' + HR_EMAIL + '</b></a>.</p></div>' +
      '<div style="background:#fafafa;padding:18px 28px;border-top:1px solid #eee;text-align:center">' +
      '<p style="font-size:12px;color:#555;margin:0 0 4px"><b>With Regards,</b></p><p style="font-size:13px;color:#1a1a2e;margin:0 0 1px;font-weight:700">' + HR_NAME + '</p>' +
      '<p style="font-size:10px;color:#999;margin:0 0 8px">Human Resources Representative &bull; Talent Nexus</p>' +
      '<p style="font-size:9px;color:#bbb;margin:0">' + CO_WEBSITE + '</p><p style="font-size:9px;color:#bbb;margin:0">UK: ' + CO_ADDRESS_UK + '</p>' +
      '<p style="font-size:9px;color:#bbb;margin:0">Thailand: ' + CO_ADDRESS_TH + '</p></div></div>';

    var plainBody = "Dear " + empName + ",\n\n" + docMsg + "\n\nView & Print: " + docLink + "\n\nDocument: " + docLabel + "\nDate: " + today + "\nIssued By: " + HR_NAME + ", HR Department\n\nFor inquiries, contact " + HR_EMAIL + "\n\nWith Regards,\n" + HR_NAME + "\nHuman Resources Representative\nTalent Nexus\n" + CO_WEBSITE + "\nUK: " + CO_ADDRESS_UK + "\nThailand: " + CO_ADDRESS_TH;

    MailApp.sendEmail({ to: cleanTo, subject: docLabel + " — Talent Nexus", htmlBody: htmlBody, body: plainBody, name: "Talent Nexus HR", replyTo: HR_EMAIL });

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

// ==================== TOKEN SYSTEM (unchanged) ====================

function storeDocumentToken(docType, formData) {
  var token = generateToken();
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var s = ss.getSheetByName("DocumentTokens");
    if (!s) { s = ss.insertSheet("DocumentTokens"); s.appendRow(["Token", "Type", "Payload", "CreatedAt"]); }
    s.appendRow([token, docType, JSON.stringify(formData), new Date()]);
    cleanupOldTokens(s);
  } catch (e) {}
  return token;
}

function generateToken() {
  var ts = new Date().getTime().toString(36);
  var rand = Math.random().toString(36).substring(2, 7);
  return "TK-" + ts + "-" + rand;
}

function cleanupOldTokens(sheet) {
  try {
    var data = sheet.getDataRange().getValues();
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    var rowsToDelete = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var rowDate = new Date(data[i][3]);
      if (rowDate < cutoff) rowsToDelete.push(i + 1);
    }
    for (var j = 0; j < rowsToDelete.length; j++) { sheet.deleteRow(rowsToDelete[j]); }
  } catch (e) {}
}

// ==================== PDF RETURN (unchanged) ====================

function returnPdf(html, filename) {
  try {
    var cleanTitle = filename.replace(/\.pdf$/,"").replace(/_/g," ");
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + esc(cleanTitle) + '</title>' +
      '<style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:0}}' +
      'body{margin:0;padding:0;font-family:"Segoe UI",Arial,sans-serif;background:#f0f0f0}' +
      '.toolbar{position:fixed;top:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,0.3)}' +
      '.toolbar span{font-size:13px;font-weight:600}' +
      '.toolbar button{background:#c9a84c;color:#fff;border:0;padding:8px 20px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;margin-left:8px}' +
      '.toolbar button:hover{background:#d4b85e}.toolbar button.sec{background:transparent;border:1px solid #666;color:#ccc}' +
      '.toolbar button.sec:hover{background:rgba(255,255,255,0.05)}@media print{.toolbar{display:none}}' +
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
      '<!DOCTYPE html><html><body style="font-family:Arial;padding:30px;text-align:center"><h3>Error</h3><p>' + esc(e.toString()) + '</p></body></html>'
    );
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
  } catch (e) {}
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
