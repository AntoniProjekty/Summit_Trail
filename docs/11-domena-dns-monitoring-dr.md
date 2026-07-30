# 11 — Domena, DNS, monitoring i disaster recovery

[← Wróć do indeksu](../README.md)

## 11.1 Konfiguracja rekordów DNS

Architektura: aplikacja za Cloudflare (proxy DNS, WAF, CDN), serwer origin na dedykowanym IP dostawcy hostingowego/cloud.

```dns
; Strefa DNS: summitandtrail.pl
; TTL domyślny: 3600 (Auto przy Cloudflare proxy)

; --- Rekordy główne ---
summitandtrail.pl.        A       203.0.113.10      ; Proxy Cloudflare ON
summitandtrail.pl.        AAAA    2001:db8::10       ; Proxy Cloudflare ON

; --- WWW ---
www.summitandtrail.pl.    CNAME   summitandtrail.pl.  ; Proxy Cloudflare ON

; --- Panel administracyjny / staging ---
admin.summitandtrail.pl.  A       203.0.113.10      ; Proxy Cloudflare ON (WAF aktywny)
staging.summitandtrail.pl. A      203.0.113.20      ; Proxy Cloudflare OFF lub ograniczone IP

; --- API / integracje ---
api.summitandtrail.pl.    A       203.0.113.10      ; Proxy Cloudflare ON

; --- Status page (monitoring publiczny) ---
status.summitandtrail.pl. CNAME   stats.statuspage-provider.com.

; --- CDN dla zasobów statycznych ---
cdn.summitandtrail.pl.    CNAME   summitandtrail.pl.cdn.cloudflare.net.

; --- Rynki międzynarodowe (dok. 10) ---
de.summitandtrail.pl.      A       203.0.113.10      ; wersja niemiecka
cz.summitandtrail.pl.      A       203.0.113.10      ; wersja czeska

; --- Weryfikacja domeny (Search Console, BaseLinker) ---
summitandtrail.pl.        TXT     "google-site-verification=XXXXXXXXXXXXXXXXXXXX"
```

## 11.2 Poczta i uwierzytelnianie e-mail (SPF, DKIM, DMARC)

Krytyczne dla dostawy e-maili transakcyjnych (potwierdzenia zamówień, faktury, powiadomienia RMA) oraz marketingowych (dok. 08).

```dns
; --- SPF ---
summitandtrail.pl.   TXT   "v=spf1 ip4:203.0.113.10 include:sendgrid.net include:_spf.baselinker.com include:_spf.klaviyomail.com ~all"

; --- DKIM (przykład dla dostawcy SMTP transakcyjnego) ---
s1._domainkey.summitandtrail.pl.  CNAME  s1.domainkey.u1234567.wl123.sendgrid.net.
s2._domainkey.summitandtrail.pl.  CNAME  s2.domainkey.u1234567.wl123.sendgrid.net.

; --- DKIM dla platformy marketing automation ---
kl1._domainkey.summitandtrail.pl. CNAME  dkim1.mc.klaviyomail.com.

; --- DMARC ---
_dmarc.summitandtrail.pl.  TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@summitandtrail.pl; ruf=mailto:dmarc-forensics@summitandtrail.pl; fo=1; pct=100; adkim=s; aspf=s"
```

**Rekomendacja wdrożenia DMARC:** start od `p=none` (monitoring 2–4 tyg., analiza raportów `rua`), następnie `p=quarantine`, docelowo `p=reject` po potwierdzeniu 100% zgodności wszystkich źródeł wysyłki.

## 11.3 Przekierowania HTTPS i normalizacja domeny

```
1) http://summitandtrail.pl/*      → 301 → https://summitandtrail.pl/$1
2) https://www.summitandtrail.pl/* → 301 → https://summitandtrail.pl/$1
3) http://www.summitandtrail.pl/*  → 301 → https://summitandtrail.pl/$1
```

Konfiguracja warstwy zapasowej na origin (Nginx):

```nginx
server {
    listen 80;
    server_name summitandtrail.pl www.summitandtrail.pl;
    return 301 https://summitandtrail.pl$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.summitandtrail.pl;
    ssl_certificate     /etc/ssl/summitandtrail.pl/fullchain.pem;
    ssl_certificate_key /etc/ssl/summitandtrail.pl/privkey.pem;
    return 301 https://summitandtrail.pl$request_uri;
}

server {
    listen 443 ssl http2;
    server_name summitandtrail.pl;
    ssl_certificate     /etc/ssl/summitandtrail.pl/fullchain.pem;
    ssl_certificate_key /etc/ssl/summitandtrail.pl/privkey.pem;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 11.4 Monitoring i status page

| Warstwa | Narzędzie | SLO |
|---|---|---|
| Uptime publiczny | Status page (`status.summitandtrail.pl`) — Statuspage/Better Stack | Transparentność dla klientów B2B (dok. 10) i enterprise |
| Monitoring syntetyczny | Ping/HTTP checks co 60s z 5 lokalizacji globalnych | Wykrycie awarii < 2 min |
| APM/RUM/logi | Datadog/New Relic + Sentry (dok. 03) | p95 < 300ms, MTTR < 4h |
| Alerting | PagerDuty/Opsgenie — eskalacja on-call | Powiadomienie zespołu w < 5 min od wykrycia SEV1 |

**SLA docelowy:** 99.9% dostępności (≈ 43 min niedostępności/miesiąc), raportowany publicznie na stronie statusu.

## 11.5 Disaster Recovery i plan reakcji na incydenty

| Parametr | Wartość docelowa |
|---|---|
| RTO (Recovery Time Objective) | ≤ 1 godzina |
| RPO (Recovery Point Objective) | ≤ 15 minut |
| Częstotliwość backupów pełnych | Co 6h + kontynualny WAL archiving bazy danych |
| Testy odtworzenia backupu (restore drill) | Kwartalnie, w środowisku izolowanym |
| Redundancja | Multi-AZ dla bazy danych i warstwy aplikacyjnej (dok. 03) |

### Runbook incydentu (przykładowy szkielet)

1. **Detekcja** — alert automatyczny (monitoring) lub zgłoszenie zespołu/klienta.
2. **Klasyfikacja severity** — SEV1 (całkowita niedostępność) do SEV4 (kosmetyczny błąd UI).
3. **Incident Commander** przejmuje koordynację, otwiera kanał komunikacji (Slack/Teams dedykowany kanał incydentowy).
4. **Komunikacja zewnętrzna** — aktualizacja statusu na `status.summitandtrail.pl` w ciągu 15 min od SEV1/SEV2.
5. **Mitigacja/rollback** — zgodnie ze strategią wdrożeń (dok. 03: canary/blue-green pozwala na szybki rollback).
6. **Post-mortem** — analiza przyczyn źródłowych (RCA) w ciągu 48h, action items z właścicielami i terminami.

## 11.6 Checklista wdrożenia produkcyjnego — krok po kroku

1. Rejestracja/transfer domeny do panelu DNS (Cloudflare jako autorytatywny DNS).
2. Wpisanie rekordów A/AAAA/CNAME (pkt 11.1), weryfikacja propagacji (`dig summitandtrail.pl`).
3. Certyfikat SSL (Cloudflare Universal SSL) + tryb szyfrowania **Full (Strict)** Cloudflare↔origin.
4. Konfiguracja SPF/DKIM/DMARC (pkt 11.2), test w mail-tester.com / Google Postmaster Tools.
5. Wdrożenie reguł przekierowań 301 (pkt 11.3) — test 4 wariantów adresu (http/https × www/non-www).
6. Aktywacja WAF, rate-limiting, „Under Attack Mode” jako opcji awaryjnej — testy obciążeniowe przed startem (dok. 03).
7. Konfiguracja status page i alertingu (pkt 11.4) przed uruchomieniem publicznym.
8. Wdrożenie CMP (cookies) i weryfikacja zgodności RODO/Omnibus/WCAG przed startem (dok. 06).
9. Testy end-to-end: zamówienie → płatność (sandbox PayU/Przelewy24) → webhook BaseLinker → status → etykieta → e-mail transakcyjny (weryfikacja folderu spam).
10. Test disaster recovery (restore drill) na środowisku staging.
11. Przełączenie DNS na produkcję — monitoring 48h (logi 4xx/5xx, opóźnienia DNS).
12. Protokół odbioru z Klientem, przekazanie danych dostępowych (panel admina, Cloudflare, BaseLinker) w bezpiecznym kanale (menedżer haseł, nie e-mail).
