# Running HERMES//HUB

The dashboard is a single consolidated build on the `main` branch. Zero
dependencies — it runs on the Python standard library only (Python 3.10+).

## 1. Get the latest code

```powershell
cd C:\path\to\hermes-agent
git checkout main
git pull origin main
```

## 2. Start the server

```powershell
cd apps\hermes-agent\..\dashboard   # i.e. the apps/dashboard folder
python server.py
```

You should see it start on **http://127.0.0.1:8787**.

Options:
- `python server.py --port 9000` — use a different port
- `python server.py --offline` — force sample data (no internet calls)
- `python server.py --host 0.0.0.0 --token SECRET` — expose to your LAN
  (a token is required when binding beyond localhost)

## 3. Open the dashboard

Open **http://127.0.0.1:8787** in your browser.

You'll see seven page tabs across the top:
**Main · Markets · Feeds · Sports · Intel · Health · AI Lab**

## 4. First load after an update (one time only)

The app is an installable PWA, so an old version can be cached. The service
worker is now **network-first** and auto-reloads once when it updates, so a
normal load should refresh you to the latest. If you were stuck on an old
build and still don't see all the tabs:

**In a browser tab:** DevTools (F12) → Application → Service Workers →
*Unregister* → then hard-reload (Ctrl+Shift+R).

**Installed as an app on your phone/desktop:** remove the installed app
icon and re-add it from the browser's "Install / Add to Home Screen".

After this one-time step, future updates apply automatically — just reload.
