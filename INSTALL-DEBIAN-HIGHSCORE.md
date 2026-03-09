# SuperCodingBall: Highscore-Liste auf Debian selbst hosten (PHP + MariaDB)

Da bei dir **PHP und MariaDB bereits laufen**, ist das der einfachste Weg.

Diese Anleitung deckt vollständig ab:
1. Frontend deployen
2. MariaDB-Schema anlegen
3. PHP-API für Highscores bereitstellen
4. Frontend auf deine eigene API umstellen

> Hinweis: Die App spricht standardmäßig gegen Orange Webcom (`io.datasync.orange.com`). Für Self-Hosting musst du die Basis-URL in der App umstellen.

## 1) Voraussetzungen

- Debian 12
- Domain, z. B. `ball.example.org`
- Laufender Apache **oder** Nginx
- PHP 8.1+ (mit `pdo_mysql`)
- MariaDB 10.6+

Pakete (falls etwas fehlt):

```bash
sudo apt update
sudo apt install -y git nodejs npm mariadb-server php php-mysql certbot
```

## 2) Frontend bauen und ausliefern

```bash
git clone https://github.com/Orange-OpenSource/super-coding-ball.git
cd super-coding-ball
npm ci
npm run build
sudo mkdir -p /var/www/supercodingball
sudo cp -r dist/* /var/www/supercodingball/
```

## 3) MariaDB: Datenbank und Tabellen

In MariaDB einloggen:

```bash
sudo mysql -u root
```

Dann ausführen:

```sql
CREATE DATABASE supercodingball CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'scb'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON supercodingball.* TO 'scb'@'127.0.0.1';
FLUSH PRIVILEGES;

USE supercodingball;

CREATE TABLE users (
  uid VARCHAR(128) PRIMARY KEY,
  display_name VARCHAR(20) NULL,
  blocks MEDIUMTEXT NULL,
  picture_url VARCHAR(512) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE game_user_display (
  day_ts BIGINT NOT NULL,
  uid VARCHAR(128) NOT NULL,
  display_name VARCHAR(20) NULL,
  picture_url VARCHAR(512) NULL,
  PRIMARY KEY (day_ts, uid),
  CONSTRAINT fk_gud_user FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE game_results (
  day_ts BIGINT NOT NULL,
  uid VARCHAR(128) NOT NULL,
  opp_id VARCHAR(128) NOT NULL,
  points TINYINT NOT NULL,
  PRIMARY KEY (day_ts, uid, opp_id),
  CONSTRAINT chk_points CHECK (points IN (0,1,2)),
  CONSTRAINT fk_gr_user FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
  CONSTRAINT fk_gr_opp FOREIGN KEY (opp_id) REFERENCES users(uid) ON DELETE CASCADE
);
```

## 4) PHP-API installieren

Ordner anlegen:

```bash
sudo mkdir -p /var/www/supercodingball-api
sudo chown -R www-data:www-data /var/www/supercodingball-api
```

Datei `/var/www/supercodingball-api/config.php`:

```php
<?php
return [
  'dsn' => 'mysql:host=127.0.0.1;dbname=supercodingball;charset=utf8mb4',
  'user' => 'scb',
  'pass' => 'CHANGE_ME_STRONG_PASSWORD',
];
```

Datei `/var/www/supercodingball-api/index.php` (minimal kompatible API):

```php
<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$config = require __DIR__ . '/config.php';
$pdo = new PDO($config['dsn'], $config['user'], $config['pass'], [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

function jsonBody(): array {
  $raw = file_get_contents('php://input') ?: '';
  $d = json_decode($raw, true);
  return is_array($d) ? $d : [];
}
function bearerUid(): string {
  $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/^Bearer\s+(.+)$/i', $h, $m)) {
    http_response_code(401); echo json_encode(['error' => 'missing bearer']); exit;
  }
  return trim($m[1]);
}
function pathParts(): array {
  $p = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '';
  $base = '/datasync/v2/super-coding-ball/data';
  if (!str_starts_with($p, $base)) { http_response_code(404); echo '{}'; exit; }
  $r = trim(substr($p, strlen($base)), '/');
  return $r === '' ? [] : explode('/', $r);
}

$uidAuth = bearerUid();
$method = $_SERVER['REQUEST_METHOD'];
$parts = pathParts();

try {
  // GET /users/{uid}
  if ($method === 'GET' && count($parts) === 2 && $parts[0] === 'users') {
    $st = $pdo->prepare('SELECT uid, display_name AS displayName, blocks, picture_url AS pictureUrl FROM users WHERE uid=?');
    $st->execute([$parts[1]]);
    echo json_encode($st->fetch() ?: null); exit;
  }

  // PATCH /users/{uid}
  if ($method === 'PATCH' && count($parts) === 2 && $parts[0] === 'users') {
    $uid = $parts[1];
    if ($uidAuth !== $uid) { http_response_code(403); echo json_encode(['error'=>'forbidden']); exit; }
    $b = jsonBody();
    $display = $b['displayName'] ?? null;
    $blocks = $b['blocks'] ?? null;
    $pic = $b['pictureUrl'] ?? null;
    $st = $pdo->prepare("INSERT INTO users(uid, display_name, blocks, picture_url) VALUES(?,?,?,?)
      ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), blocks=VALUES(blocks), picture_url=VALUES(picture_url)");
    $st->execute([$uid, $display, $blocks, $pic]);
    echo json_encode(['ok'=>true]); exit;
  }

  // GET /users/{uid}/blocks
  if ($method === 'GET' && count($parts) === 3 && $parts[0] === 'users' && $parts[2] === 'blocks') {
    $st = $pdo->prepare('SELECT blocks FROM users WHERE uid=?');
    $st->execute([$parts[1]]);
    $row = $st->fetch();
    echo json_encode($row['blocks'] ?? ''); exit;
  }

  // PUT /games/{day}/{uid}/userDisplay
  if ($method === 'PUT' && count($parts) === 5 && $parts[0] === 'games' && $parts[3] === 'userDisplay') {
    [$x,$day,$uid] = $parts;
    if ($uidAuth !== $uid) { http_response_code(403); echo json_encode(['error'=>'forbidden']); exit; }
    $b = jsonBody();
    $display = substr((string)($b['fullDisplayName'] ?? $b['displayName'] ?? ''), 0, 20);
    $pic = $b['pictureUrl'] ?? null;
    $st = $pdo->prepare("INSERT INTO game_user_display(day_ts, uid, display_name, picture_url) VALUES(?,?,?,?)
      ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), picture_url=VALUES(picture_url)");
    $st->execute([(int)$day, $uid, $display, $pic]);
    echo json_encode(['ok'=>true]); exit;
  }

  // PUT /games/{day}/{uid}/dailyGames/{oppId}
  if ($method === 'PUT' && count($parts) === 6 && $parts[0] === 'games' && $parts[3] === 'dailyGames') {
    [$x,$day,$uid,$y,$oppId] = $parts;
    if ($uidAuth !== $uid) { http_response_code(403); echo json_encode(['error'=>'forbidden']); exit; }
    $points = (int)(json_decode(file_get_contents('php://input') ?: '0', true));
    if (!in_array($points, [0,1,2], true)) { http_response_code(400); echo json_encode(['error'=>'invalid points']); exit; }

    $u = $pdo->prepare('SELECT uid FROM users WHERE uid=?'); $u->execute([$oppId]);
    if (!$u->fetch()) { http_response_code(400); echo json_encode(['error'=>'opponent missing']); exit; }

    $st = $pdo->prepare("INSERT INTO game_results(day_ts, uid, opp_id, points) VALUES(?,?,?,?)
      ON DUPLICATE KEY UPDATE points=VALUES(points)");
    $st->execute([(int)$day, $uid, $oppId, $points]);
    echo json_encode(['ok'=>true]); exit;
  }

  // GET /games/{day}
  if ($method === 'GET' && count($parts) === 2 && $parts[0] === 'games') {
    $day = (int)$parts[1];
    $out = [];
    $a = $pdo->prepare('SELECT uid, display_name, picture_url FROM game_user_display WHERE day_ts=?');
    $a->execute([$day]);
    foreach ($a->fetchAll() as $r) {
      $out[$r['uid']] = ['userDisplay'=>['displayName'=>$r['display_name'] ?? '', 'pictureUrl'=>$r['picture_url'] ?? ''], 'dailyGames'=>new stdClass()];
    }
    $b = $pdo->prepare('SELECT uid, opp_id, points FROM game_results WHERE day_ts=?');
    $b->execute([$day]);
    foreach ($b->fetchAll() as $r) {
      if (!isset($out[$r['uid']])) $out[$r['uid']] = ['userDisplay'=>['displayName'=>'','pictureUrl'=>''], 'dailyGames'=>[]];
      if ($out[$r['uid']]['dailyGames'] instanceof stdClass) $out[$r['uid']]['dailyGames'] = [];
      $out[$r['uid']]['dailyGames'][$r['opp_id']] = (int)$r['points'];
    }
    echo json_encode($out); exit;
  }

  http_response_code(404); echo json_encode(['error' => 'not found']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server error']);
}
```

## 5) Webserver-Routing für API

### Apache (läuft bei dir bereits)

In deinem VirtualHost ergänzen:

```apache
Alias /datasync/v2/super-coding-ball/data /var/www/supercodingball-api

<Directory /var/www/supercodingball-api>
    AllowOverride None
    Require all granted
    DirectoryIndex index.php
</Directory>
```

Dann reload:

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

### Nginx (falls genutzt)

```nginx
location /datasync/v2/super-coding-ball/data {
    alias /var/www/supercodingball-api;
    index index.php;
    try_files $uri $uri/ /index.php?$query_string;
}

location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
}
```

## 6) Frontend auf eigene URL umstellen

In `src/app/services/online.service.ts`:

- von `https://io.datasync.orange.com/datasync/v2/super-coding-ball/data`
- auf `https://ball.example.org/datasync/v2/super-coding-ball/data`

Dann neu bauen/deployen:

```bash
npm run build
sudo cp -r dist/* /var/www/supercodingball/
```

## 7) Testen

```bash
curl -i -H 'Authorization: Bearer test-user' \
  https://ball.example.org/datasync/v2/super-coding-ball/data/games/0

curl -i -X PATCH \
  -H 'Authorization: Bearer test-user' \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Team-Test","blocks":"<xml></xml>"}' \
  https://ball.example.org/datasync/v2/super-coding-ball/data/users/test-user
```

---

## Wichtiger Sicherheitshinweis

Das Beispiel nutzt bewusst eine minimale Auth (`Bearer <uid>`), damit du schnell starten kannst.
Für echten Betrieb: JWT-Validierung, Rate-Limits, CORS-Policy und Request-Logging ergänzen.
