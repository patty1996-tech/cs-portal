# CS Employee Self-Service Portal

Automated payslip and experience letter PDF generator for Talent Nexus employees.

## Quick Deploy (3 Steps)

### Step 1: Deploy Apps Script

1. Open your Google Sheet: `https://docs.google.com/spreadsheets/d/1n6fDjRCi17yp0KQ9lP29ARtqJVg0V_YgV_l9m4FjiCw/edit`
2. Go to **Extensions → Apps Script**
3. Copy-paste the entire contents of `appsscript.gs` into the editor
4. Click **Deploy → New Deployment**
5. Type: **Web App**, Execute as: **Me**, Access: **Anyone**
6. Click **Deploy** and **copy the web app URL**
7. The first run will ask for permissions — grant them

### Step 2: Update the website URL

1. Open `index.html` in a text editor
2. Find `YOUR_APPS_SCRIPT_URL_HERE` and replace it with your Apps Script URL
3. Save the file

### Step 3: Deploy to GitHub Pages

1. Go to `https://github.com/patty1996-tech/cs-portal` (create the repo if needed)
2. Upload `index.html` to the repository
3. Go to **Settings → Pages**
4. Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)**
5. Click **Save**
6. Your portal is now live at: `https://patty1996-tech.github.io/cs-portal/`

## Testing

1. Visit `https://patty1996-tech.github.io/cs-portal/`
2. Fill in the payslip form and click Generate
3. A professional PDF should download automatically
4. Check your Google Sheet — a "RequestLog" tab will have the generation record

## Files

| File | Purpose |
|------|---------|
| `appsscript.gs` | Google Apps Script backend (deploy as web app) |
| `index.html` | Employee portal website (deploy to GitHub Pages) |

## Security

- The Apps Script runs as **you** — no one else can modify it
- All requests are logged in the Google Sheet
- No employee data is stored permanently (generated on-demand)
