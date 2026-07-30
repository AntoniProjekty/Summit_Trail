# 06 — Bezpieczeństwo i zgodność prawna (Security & Compliance)

[← Wróć do indeksu](../README.md)

## 6.1 Ochrona serwera i aplikacji

| Warstwa | Rozwiązanie | Opis wdrożenia |
|---|---|---|
| SSL/TLS | Let's Encrypt / certyfikat OV za Cloudflare | TLS 1.2/1.3, HSTS preload, wyłączone TLS 1.0/1.1 |
| WAF | Cloudflare WAF (Business/Enterprise) | OWASP Core Rule Set + reguły custom dla `/checkout`, `/api/*` |
| Ochrona DDoS | Cloudflare L3/L4/L7 | Automatyczne mitigation, „Under Attack Mode” na żądanie |
| Rate-limiting | Cloudflare Rate Limiting + middleware Redis w aplikacji | `/api/login`: 5 żądań/min/IP; `/api/checkout`: 20/min/IP; formularz kontaktowy: 3/godz./IP |
| Anti-bot | reCAPTCHA v3 (formularze) / Cloudflare Turnstile (checkout) | Score < 0.5 → dodatkowa weryfikacja e-mail |
| Ochrona API | API Gateway z autoryzacją OAuth2/JWT, throttling per-klient | Ochrona przed scraping cen konkurencji, ograniczenie botów zakupowych |

## 6.2 Bezpieczeństwo danych i transakcji

- **PCI-DSS:** sklep nie przechowuje danych kart — pełna delegacja do PayU/Przelewy24 (hosted payment page/iframe). Zakres zgodności: SAQ A / SAQ A-EP.
- **Szyfrowanie danych:** at-rest (AES-256, LUKS/EBS encryption) + szyfrowanie kolumnowe danych PII wrażliwych (telefon, adres).
- **Bezpieczne sesje:** ciasteczka `HttpOnly`, `Secure`, `SameSite=Lax`; rotacja ID sesji po logowaniu; wygaszanie po 30 min nieaktywności.
- **Uwierzytelnianie:** hashowanie `argon2id`, 2FA (TOTP) obowiązkowe dla panelu administracyjnego, blokada konta po 5 nieudanych logowaniach (15 min).
- **Zarządzanie dostępem (RBAC):** granularne role w panelu admina (magazyn, marketing, finanse, IT) — zasada najmniejszych uprawnień.

### Nagłówki bezpieczeństwa HTTP

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://cdn.baselinker.com; style-src 'self' 'unsafe-inline'; frame-src https://secure.payu.com https://secure.przelewy24.pl; img-src 'self' data: https:; object-src 'none'; base-uri 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(), microphone=()
```

## 6.3 Zarządzanie bezpieczeństwem klasy enterprise

| Obszar | Praktyka |
|---|---|
| Testy penetracyjne | Pentest zewnętrzny min. 1×/rok + po każdej istotnej zmianie architektury; retesty poprawek w 30 dni |
| Bug bounty / responsible disclosure | Program zgłoszeń podatności (np. przez HackerOne lub `security.txt`) z SLA reakcji 48h dla krytycznych |
| Skanowanie zależności | Dependabot/Snyk — automatyczne PR z łatkami CVE, blokada merge przy podatnościach `critical`/`high` |
| SAST/DAST w CI/CD | Semgrep (SAST) w pipeline (dok. 03), OWASP ZAP (DAST) na środowisku staging |
| Zarządzanie ryzykiem dostawców (Vendor Risk) | Ocena bezpieczeństwa każdego dostawcy trzeciego (BaseLinker, bramki płatności, CDP) przed integracją |
| Certyfikacja / gotowość | Docelowo ISO/IEC 27001 oraz SOC 2 Type II (roadmap Faza 3) — polityki bezpieczeństwa informacji, audyt wewnętrzny |
| Plan reakcji na incydenty | Runbook z rolami (Incident Commander, Comms Lead), klasyfikacja severity SEV1–SEV4, retrospektywy post-incydentowe |
| Zgłoszenie naruszenia RODO | Procedura zgłoszenia do UODO w ciągu 72h od wykrycia naruszenia (obowiązek art. 33 RODO) |

## 6.4 Zgodność prawna (EU/PL)

### Dyrektywa Omnibus

- Historia cen z ostatnich 30 dni przechowywana per SKU (`price_history` z timestampem).
- Przy obniżce automatyczny komunikat: **„Najniższa cena z 30 dni przed obniżką: X PLN”** = `MIN(ceny_z_30_dni)`, wyliczane automatycznie przy każdej zmianie ceny.
- Logika zgodna z wytycznymi UOKiK dla wyprzedaży progresywnych i kuponów.

### RODO (GDPR)

| Wymóg | Implementacja |
|---|---|
| Zgody marketingowe | Checkbox opt-in niedomyślnie zaznaczony, rozdzielony od zgody niezbędnej do realizacji zamówienia |
| Polityka cookies (CMP) | Consent Management Platform (CookieYes/OneTrust) — blokada skryptów do momentu zgody, granularny wybór kategorii |
| Prawo do zapomnienia | „Usuń moje konto” w panelu + anonimizacja PII w zamówieniach historycznych (zachowanie danych księgowych 5 lat wg Ustawy o rachunkowości, zanonimizowanych w warstwie PII) |
| Prawo do przenoszenia danych | Eksport danych klienta (JSON/CSV) na żądanie |
| Rejestr czynności przetwarzania | RCP prowadzony przez administratora danych (Klienta), wsparte przez IOD |
| Privacy by design/default | Domyślne ustawienia prywatności minimalizujące zbierane dane (np. brak domyślnego trackingu bez zgody) |

### Dostępność cyfrowa (WCAG 2.1 AA / European Accessibility Act)

Od czerwca 2025 r. Europejski Akt o Dostępności (EAA) obejmuje e-commerce — Summit & Trail projektowany jest zgodnie z **WCAG 2.1 poziom AA**: kontrast min. 4.5:1, pełna nawigacja klawiaturą, atrybuty ARIA, alternatywne opisy obrazów, formularze z komunikatami błędów odczytywanymi przez czytniki ekranu. Deklaracja dostępności publikowana pod `/deklaracja-dostepnosci`. Audyt automatyczny (axe-core) w pipeline CI/CD + audyt manualny raz na kwartał.

### Regulamin i Polityka Prywatności

- Regulamin zgodny z Ustawą o prawach konsumenta (Dz.U. 2014 poz. 827 z późn. zm.) — dane sprzedawcy, procedura zamówienia, ceny/płatności, dostawa, reklamacje, odstąpienie od umowy, ochrona danych.
- **Wzór formularza odstąpienia od umowy (14 dni):**

```
WZÓR FORMULARZA ODSTĄPIENIA OD UMOWY
(formularz ten należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy)

Adresat: Summit & Trail [Nazwa spółki], [adres], e-mail: [email]

Ja/My(*) niniejszym informuję/informujemy(*) o moim/naszym odstąpieniu od umowy
sprzedaży następujących towarów(*)/umowy dostawy następujących towarów(*):
.....................................................................

Data zawarcia umowy(*)/odbioru(*): .................................
Imię i nazwisko konsumenta(-ów): ....................................
Adres konsumenta(-ów): ..............................................
Numer zamówienia: ...................................................

Podpis konsumenta(-ów) (tylko jeżeli formularz jest przesyłany w wersji papierowej):
.....................................................................
Data: ................................................................

(*) Niepotrzebne skreślić.
```

- Uwaga specyficzna dla asortymentu gabarytowego: zasady zwrotu e-bike/namiotów dachowych (odbiór przez przewoźnika paletowego — szczegóły w dok. 05.6).
