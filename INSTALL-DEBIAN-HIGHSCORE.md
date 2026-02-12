# SuperCodingBall: Highscore-Liste auf Debian selbst hosten

Diese Anleitung zeigt dir, wie du auf einem Debian-Server:
1. das Frontend von SuperCodingBall hostest und
2. eine **eigene Highscore-API** bereitstellst.

> Wichtig: Der Originalcode nutzt standardmäßig Orange Webcom (`io.datasync.orange.com`).
> Für echtes Self-Hosting der Highscores musst du eine kompatible API betreiben und im Frontend die Basis-URL anpassen.

## 1) Voraussetzungen

- Debian 12 (Bookworm) empfohlen
- Domain, z. B. `ball.example.org`
- Root- oder sudo-Zugriff
- Offene Ports 80/443

Pakete installieren:

```bash
sudo apt update
sudo apt install -y git nginx certbot python3-certbot-nginx nodejs npm
```

## 2) Projekt bauen

```bash
git clone https://github.com/Orange-OpenSource/super-coding-ball.git
cd super-coding-ball
npm ci
npm run build
```

Das Angular-Build liegt danach unter `dist/`.

## 3) Frontend über Nginx bereitstellen

Dateien in ein Web-Verzeichnis kopieren:

```bash
sudo mkdir -p /var/www/supercodingball
sudo cp -r dist/* /var/www/supercodingball/
```

Nginx-Site anlegen:

```nginx
server {
    listen 80;
    server_name ball.example.org;

    root /var/www/supercodingball;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Aktivieren und testen:

```bash
sudo ln -s /etc/nginx/sites-available/supercodingball /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

TLS aktivieren:

```bash
sudo certbot --nginx -d ball.example.org
```


## 3b) Alternative: bestehender Apache-Server (ohne Nginx)

Wenn bei dir bereits Apache läuft, kannst du SuperCodingBall auch direkt dort ausliefern.

Apache-Module aktivieren:

```bash
sudo apt update
sudo apt install -y apache2 certbot python3-certbot-apache
sudo a2enmod rewrite headers proxy proxy_http ssl
sudo systemctl reload apache2
```

Build nach `/var/www/supercodingball` kopieren (falls noch nicht geschehen):

```bash
sudo mkdir -p /var/www/supercodingball
sudo cp -r dist/* /var/www/supercodingball/
```

VirtualHost anlegen, z. B. `/etc/apache2/sites-available/supercodingball.conf`:

```apache
<VirtualHost *:80>
    ServerName ball.example.org
    DocumentRoot /var/www/supercodingball

    <Directory /var/www/supercodingball>
        Options FollowSymLinks
        AllowOverride None
        Require all granted

        # Angular SPA Fallback
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} -f [OR]
        RewriteCond %{REQUEST_FILENAME} -d
        RewriteRule ^ - [L]
        RewriteRule ^ /index.html [L]
    </Directory>

    # Reverse-Proxy für eigene Highscore-API
    ProxyPreserveHost On
    ProxyPass /datasync/v2/super-coding-ball/data/ http://127.0.0.1:8080/
    ProxyPassReverse /datasync/v2/super-coding-ball/data/ http://127.0.0.1:8080/

    ErrorLog ${APACHE_LOG_DIR}/supercodingball-error.log
    CustomLog ${APACHE_LOG_DIR}/supercodingball-access.log combined
</VirtualHost>
```

Site aktivieren und prüfen:

```bash
sudo a2ensite supercodingball
sudo apache2ctl configtest
sudo systemctl reload apache2
```

TLS mit Let's Encrypt:

```bash
sudo certbot --apache -d ball.example.org
```

## 4) Eigene Highscore-API bereitstellen

Die App erwartet diese Struktur:

- `users/{uid}` mit z. B. `displayName`, `blocks`
- `games/{dayTimestamp}/{uid}/userDisplay`
- `games/{dayTimestamp}/{uid}/dailyGames/{opponentId}` (Werte 0/1/2)

Die gleiche Datenlogik ist in den Regeln beschrieben:
`src/assets/webcom-rules.json`.

### Minimaler Betriebsweg auf Debian

- API (Node.js, Go, Python – egal) auf Port `8080`
- Reverse-Proxy in Nginx:

```nginx
location /datasync/v2/super-coding-ball/data/ {
    proxy_pass http://127.0.0.1:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

- Token-basierte Authentifizierung (Bearer) implementieren
- Endpunkte per Benutzer-ID absichern
- Optional: tägliches Aufräumen >15 Tage alte Spiele

## 5) Frontend auf eigene API zeigen lassen

In `src/app/services/online.service.ts` ist aktuell fest verdrahtet:

- `webcomBaseUrl = 'https://io.datasync.orange.com/datasync/v2/super-coding-ball/data'`

Setze hier deine URL, z. B.:

- `https://ball.example.org/datasync/v2/super-coding-ball/data`

Danach neu bauen und deployen:

```bash
npm run build
sudo cp -r dist/* /var/www/supercodingball/
# Wenn du Apache nutzt: sudo systemctl reload apache2
sudo systemctl reload nginx
```

## 6) Health-Checks

Frontend:

```bash
curl -I https://ball.example.org
```

API (Beispiel):

```bash
curl -i https://ball.example.org/datasync/v2/super-coding-ball/data/games
```

## 7) Betrieb (empfohlen)

- API als `systemd`-Service starten
- tägliche Backups (z. B. SQLite/PostgreSQL Dumps)
- Fail2ban + UFW
- Monitoring (Uptime Kuma / Prometheus)
- Logrotation (`/var/log/nginx/*.log` oder `/var/log/apache2/*.log`)

---

Wenn du willst, kann ich dir im nächsten Schritt eine **konkrete minimale Node.js-API** (inkl. `systemd`-Unit und Nginx-Config) schreiben, die exakt zu den im Projekt genutzten Endpunkten passt.
