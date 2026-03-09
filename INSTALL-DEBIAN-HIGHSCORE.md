# SuperCodingBall: Highscore-Liste auf Debian selbst hosten

Diese Anleitung zeigt dir eine **komplette Self-Hosting-Variante** auf Debian:
1. Frontend ausliefern (Nginx **oder** Apache)
2. eigene Highscore-API installieren
3. SQLite-Datenbank initialisieren
4. API als `systemd`-Service betreiben

> Wichtig: Der Originalcode nutzt standardmäßig Orange Webcom (`io.datasync.orange.com`).
> Für echtes Self-Hosting der Highscores musst du eine kompatible API betreiben und im Frontend die Basis-URL anpassen.

## 1) Voraussetzungen

- Debian 12 (Bookworm) empfohlen
- Domain, z. B. `ball.example.org`
- Root-/sudo-Zugriff
- Ports 80/443 offen

Pakete installieren:

```bash
sudo apt update
sudo apt install -y git curl certbot nodejs npm sqlite3
```

## 2) Projekt bauen (Frontend)

```bash
git clone https://github.com/Orange-OpenSource/super-coding-ball.git
cd super-coding-ball
npm ci
npm run build
```

Build-Artefakte kopieren:

```bash
sudo mkdir -p /var/www/supercodingball
sudo cp -r dist/* /var/www/supercodingball/
```

## 3a) Frontend über Nginx bereitstellen

```bash
sudo apt install -y nginx python3-certbot-nginx
```

`/etc/nginx/sites-available/supercodingball`:

```nginx
server {
    listen 80;
    server_name ball.example.org;

    root /var/www/supercodingball;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse-Proxy zur lokalen Highscore-API
    location /datasync/v2/super-coding-ball/data/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktivieren:

```bash
sudo ln -s /etc/nginx/sites-available/supercodingball /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d ball.example.org
```

## 3b) Alternative: bestehender Apache-Server

```bash
sudo apt install -y apache2 python3-certbot-apache
sudo a2enmod rewrite headers proxy proxy_http ssl
sudo systemctl reload apache2
```

`/etc/apache2/sites-available/supercodingball.conf`:

```apache
<VirtualHost *:80>
    ServerName ball.example.org
    DocumentRoot /var/www/supercodingball

    <Directory /var/www/supercodingball>
        Options FollowSymLinks
        AllowOverride None
        Require all granted

        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} -f [OR]
        RewriteCond %{REQUEST_FILENAME} -d
        RewriteRule ^ - [L]
        RewriteRule ^ /index.html [L]
    </Directory>

    # Reverse-Proxy zur lokalen Highscore-API
    ProxyPreserveHost On
    ProxyPass /datasync/v2/super-coding-ball/data/ http://127.0.0.1:8080/
    ProxyPassReverse /datasync/v2/super-coding-ball/data/ http://127.0.0.1:8080/

    ErrorLog ${APACHE_LOG_DIR}/supercodingball-error.log
    CustomLog ${APACHE_LOG_DIR}/supercodingball-access.log combined
</VirtualHost>
```

Aktivieren:

```bash
sudo a2ensite supercodingball
sudo apache2ctl configtest
sudo systemctl reload apache2
sudo certbot --apache -d ball.example.org
```

## 4) Highscore-Backend + Datenbank komplett installieren

Die App schreibt/liest im Kern:

- `users/{uid}` (`displayName`, `blocks`)
- `games/{dayTimestamp}/{uid}/userDisplay`
- `games/{dayTimestamp}/{uid}/dailyGames/{opponentId}` (0/1/2)

(Die Logik entspricht den Regeln in `src/assets/webcom-rules.json`.)

### 4.1 Backend-Ordner anlegen

```bash
sudo mkdir -p /opt/supercodingball-api
sudo chown "$USER":"$USER" /opt/supercodingball-api
cd /opt/supercodingball-api
npm init -y
npm install express sqlite3
```

### 4.2 API-Code (`server.js`)

```bash
cat > server.js <<'JS'
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json({ limit: '2mb' }));

const db = new sqlite3.Database('/var/lib/supercodingball/highscores.db');

// ----- DB init -----
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    displayName TEXT,
    blocks TEXT,
    pictureUrl TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS game_user_display (
    day INTEGER NOT NULL,
    uid TEXT NOT NULL,
    displayName TEXT,
    pictureUrl TEXT,
    PRIMARY KEY(day, uid)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS game_results (
    day INTEGER NOT NULL,
    uid TEXT NOT NULL,
    oppId TEXT NOT NULL,
    points INTEGER NOT NULL CHECK(points BETWEEN 0 AND 2),
    PRIMARY KEY(day, uid, oppId)
  )`);
});

// ----- Dummy auth: Bearer <uid> -----
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'missing bearer token' });
  req.uid = m[1].trim();
  next();
}

// Helpers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// routes aligned to /datasync/v2/super-coding-ball/data/<...>
app.get('/users/:uid', auth, async (req, res) => {
  const row = await get('SELECT uid, displayName, blocks, pictureUrl FROM users WHERE uid=?', [req.params.uid]);
  res.json(row);
});

app.patch('/users/:uid', auth, async (req, res) => {
  if (req.uid !== req.params.uid) return res.status(403).json({ error: 'forbidden' });
  const current = await get('SELECT uid, displayName, blocks, pictureUrl FROM users WHERE uid=?', [req.params.uid]);
  const displayName = req.body.displayName ?? current?.displayName ?? null;
  const blocks = req.body.blocks ?? current?.blocks ?? null;
  const pictureUrl = req.body.pictureUrl ?? current?.pictureUrl ?? null;
  await run(
    `INSERT INTO users(uid, displayName, blocks, pictureUrl)
     VALUES(?,?,?,?)
     ON CONFLICT(uid) DO UPDATE SET displayName=excluded.displayName, blocks=excluded.blocks, pictureUrl=excluded.pictureUrl`,
    [req.params.uid, displayName, blocks, pictureUrl]
  );
  res.json({ ok: true });
});

app.delete('/users/:uid', auth, async (req, res) => {
  if (req.uid !== req.params.uid) return res.status(403).json({ error: 'forbidden' });
  await run('DELETE FROM users WHERE uid=?', [req.params.uid]);
  await run('DELETE FROM game_user_display WHERE uid=?', [req.params.uid]);
  await run('DELETE FROM game_results WHERE uid=? OR oppId=?', [req.params.uid, req.params.uid]);
  res.json({ ok: true });
});

app.get('/users/:uid/blocks', auth, async (req, res) => {
  const row = await get('SELECT blocks FROM users WHERE uid=?', [req.params.uid]);
  res.json(row?.blocks || '');
});

app.put('/games/:day/:uid/userDisplay', auth, async (req, res) => {
  if (req.uid !== req.params.uid) return res.status(403).json({ error: 'forbidden' });
  const day = Number(req.params.day);
  const displayName = (req.body?.fullDisplayName || req.body?.displayName || '').slice(0, 20);
  const pictureUrl = req.body?.pictureUrl || null;
  await run(
    `INSERT INTO game_user_display(day, uid, displayName, pictureUrl)
     VALUES(?,?,?,?)
     ON CONFLICT(day, uid) DO UPDATE SET displayName=excluded.displayName, pictureUrl=excluded.pictureUrl`,
    [day, req.params.uid, displayName, pictureUrl]
  );
  res.json({ ok: true });
});

app.put('/games/:day/:uid/dailyGames/:oppId', auth, async (req, res) => {
  if (req.uid !== req.params.uid) return res.status(403).json({ error: 'forbidden' });
  const day = Number(req.params.day);
  const points = Number(req.body);
  if (![0, 1, 2].includes(points)) return res.status(400).json({ error: 'points must be 0,1,2' });
  const opp = await get('SELECT uid FROM users WHERE uid=?', [req.params.oppId]);
  if (!opp) return res.status(400).json({ error: 'opponent does not exist' });
  await run(
    `INSERT INTO game_results(day, uid, oppId, points)
     VALUES(?,?,?,?)
     ON CONFLICT(day, uid, oppId) DO UPDATE SET points=excluded.points`,
    [day, req.params.uid, req.params.oppId, points]
  );
  res.json({ ok: true });
});

app.get('/games/:day', auth, async (req, res) => {
  const day = Number(req.params.day);
  const displays = await all('SELECT uid, displayName, pictureUrl FROM game_user_display WHERE day=?', [day]);
  const results = await all('SELECT uid, oppId, points FROM game_results WHERE day=?', [day]);

  const out = {};
  for (const d of displays) {
    out[d.uid] = { userDisplay: { displayName: d.displayName || '', pictureUrl: d.pictureUrl || '' }, dailyGames: {} };
  }
  for (const r of results) {
    out[r.uid] = out[r.uid] || { userDisplay: { displayName: '', pictureUrl: '' }, dailyGames: {} };
    out[r.uid].dailyGames[r.oppId] = r.points;
  }
  res.json(out);
});

app.get('/games', auth, async (_req, res) => {
  const days = await all('SELECT DISTINCT day FROM game_user_display UNION SELECT DISTINCT day FROM game_results ORDER BY day DESC');
  const out = {};
  for (const d of days) {
    const day = d.day;
    const displays = await all('SELECT uid, displayName, pictureUrl FROM game_user_display WHERE day=?', [day]);
    const results = await all('SELECT uid, oppId, points FROM game_results WHERE day=?', [day]);
    out[day] = {};
    for (const x of displays) {
      out[day][x.uid] = { userDisplay: { displayName: x.displayName || '', pictureUrl: x.pictureUrl || '' }, dailyGames: {} };
    }
    for (const x of results) {
      out[day][x.uid] = out[day][x.uid] || { userDisplay: { displayName: '', pictureUrl: '' }, dailyGames: {} };
      out[day][x.uid].dailyGames[x.oppId] = x.points;
    }
  }
  res.json(out);
});

app.delete('/games/:day', auth, async (req, res) => {
  const day = Number(req.params.day);
  const maxAge = 15 * 24 * 60 * 60 * 1000;
  if (day >= Date.now() - maxAge) return res.status(403).json({ error: 'only days older than 15d can be deleted' });
  await run('DELETE FROM game_user_display WHERE day=?', [day]);
  await run('DELETE FROM game_results WHERE day=?', [day]);
  res.json({ ok: true });
});

app.listen(8080, '127.0.0.1', () => {
  console.log('supercodingball-api listening on 127.0.0.1:8080');
});
JS
```

### 4.3 Datenbankverzeichnis + Rechte

```bash
sudo mkdir -p /var/lib/supercodingball
sudo chown -R "$USER":"$USER" /var/lib/supercodingball
```

Teststart:

```bash
node /opt/supercodingball-api/server.js
```

### 4.4 Als `systemd`-Service installieren

```bash
sudo tee /etc/systemd/system/supercodingball-api.service > /dev/null <<'UNIT'
[Unit]
Description=SuperCodingBall Highscore API
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/supercodingball-api
ExecStart=/usr/bin/node /opt/supercodingball-api/server.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
UNIT
```

Rechte für Service-User:

```bash
sudo chown -R www-data:www-data /opt/supercodingball-api
sudo mkdir -p /var/lib/supercodingball
sudo chown -R www-data:www-data /var/lib/supercodingball
```

Service starten:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now supercodingball-api
sudo systemctl status supercodingball-api
```

Logs prüfen:

```bash
journalctl -u supercodingball-api -f
```

## 5) Frontend auf eigene API zeigen lassen

In `src/app/services/online.service.ts` ist aktuell fest verdrahtet:

- `webcomBaseUrl = 'https://io.datasync.orange.com/datasync/v2/super-coding-ball/data'`

Setze hier deine URL, z. B.:

- `https://ball.example.org/datasync/v2/super-coding-ball/data`

Dann neu bauen + deployen:

```bash
cd /pfad/zu/super-coding-ball
npm run build
sudo cp -r dist/* /var/www/supercodingball/
# Nginx:
sudo systemctl reload nginx
# Apache:
# sudo systemctl reload apache2
```

## 6) Funktionstest

Frontend:

```bash
curl -I https://ball.example.org
```

API (Beispiel mit Dummy-Bearer):

```bash
curl -i -H 'Authorization: Bearer test-user' \
  https://ball.example.org/datasync/v2/super-coding-ball/data/games
```

Test-User anlegen:

```bash
curl -i -X PATCH \
  -H 'Authorization: Bearer test-user' \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Team-Test","blocks":"<xml></xml>"}' \
  https://ball.example.org/datasync/v2/super-coding-ball/data/users/test-user
```

## 7) Betrieb (empfohlen)

- tägliches Backup der SQLite-Datei:
  - `/var/lib/supercodingball/highscores.db`
- ältere Scores per Cron/Timer löschen (>15 Tage)
- Firewall, Fail2ban, Monitoring
- Logrotation (`/var/log/nginx/*.log` oder `/var/log/apache2/*.log`)

---

Hinweis zur Sicherheit: Der oben gezeigte Bearer-Mechanismus (`Bearer <uid>`) ist bewusst minimal für schnellen Self-Hosting-Start. Für Produktivbetrieb solltest du echte JWT-Validierung (Issuer/Audience/Signatur) und Rate-Limits ergänzen.
