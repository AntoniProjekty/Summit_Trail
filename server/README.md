# Summit & Trail API

Prawdziwy backend dla sklepu Summit & Trail: konta użytkowników, koszyk, lista życzeń, zamówienia i punkty programu lojalnościowego Summit Club. Zastępuje warstwę `localStorage` używaną w prototypie frontendowym — dane żyją w bazie danych po stronie serwera i są dostępne z każdego urządzenia, na którym użytkownik się zaloguje.

## Stack

- **Node.js ≥ 22.5** (wymagany dla wbudowanego modułu `node:sqlite`)
- **Express** — routing i middleware
- **SQLite** (`node:sqlite`, wbudowany w Node — zero zewnętrznych zależności bazodanowych)
- Hasła: `crypto.scrypt` (KDF odporny na atak GPU), sesje: losowy token w bezpiecznym ciasteczku `httpOnly`

Baza danych to pojedynczy plik `data/store.sqlite` — świetnie się skaluje do jednego serwera/małego ruchu. Przy większej skali podmień `src/db.js` na klienta PostgreSQL bez zmiany API tras.

## Uruchomienie lokalne

```bash
cd server
npm install
cp .env.example .env      # dostosuj ALLOWED_ORIGINS do adresu Twojego frontendu
npm start                 # albo: npm run dev (auto-restart)
```

Serwer wystartuje na `http://localhost:4000`. Sprawdzenie: `curl http://localhost:4000/api/health`.

## Endpointy API

| Metoda | Ścieżka | Opis | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Rejestracja `{name, email, password}` | — |
| POST | `/api/auth/login` | Logowanie `{email, password}` | — |
| POST | `/api/auth/logout` | Wylogowanie | — |
| GET | `/api/auth/me` | Aktualny zalogowany użytkownik (lub `null`) | — |
| GET | `/api/cart` | Koszyk zalogowanego użytkownika | ✔ |
| POST | `/api/cart` | Dodaj pozycję `{productId, name, variantLabel, unitPrice, qty}` | ✔ |
| PATCH | `/api/cart/:id` | Zmień ilość `{qty}` | ✔ |
| DELETE | `/api/cart/:id` | Usuń pozycję | ✔ |
| DELETE | `/api/cart` | Wyczyść koszyk | ✔ |
| GET | `/api/wishlist` | Lista ID produktów na liście życzeń | ✔ |
| POST | `/api/wishlist/:productId` | Dodaj produkt | ✔ |
| DELETE | `/api/wishlist/:productId` | Usuń produkt | ✔ |
| POST | `/api/orders/checkout` | Złóż zamówienie z koszyka `{promoCode?, shipCost, delivery, payment}` — nalicza punkty i czyści koszyk | ✔ |
| GET | `/api/orders` | Historia zamówień | ✔ |

Sesja przenoszona jest przez ciasteczko `stt_session` (httpOnly). Frontend musi wywoływać `fetch` z `credentials: "include"`.

## Wdrożenie produkcyjne (żeby konta działały na realnym adresie)

To jest zwykła aplikacja Node.js — działa na każdym hostingu, który uruchamia `node`:

### Render (gotowy Blueprint — najszybsza opcja)

W repozytorium jest plik [`render.yaml`](../render.yaml), który opisuje usługę za Ciebie:

1. Wejdź na [render.com](https://render.com), zaloguj się przez GitHub.
2. **New +** → **Blueprint** → wybierz to repozytorium (branch `claude/summit-trail-ecommerce-spec-pdgh6e` lub `main`) → Render sam wykryje `render.yaml` i zaproponuje usługę `summit-trail-api` (root `server/`, plan Free).
3. Zatwierdź (**Apply**) — po zbudowaniu Render przypisze adres typu `https://summit-trail-api.onrender.com` (jeśli nazwa wolna; jeśli zajęta, dostaniesz wariant z losowym sufiksem).
4. Sprawdź zmienną `ALLOWED_ORIGINS` w ustawieniach usługi — musi wskazywać na realny adres frontendu (domyślnie w `render.yaml` wpisany jest adres GitHub Pages tego repo).
5. Skopiuj przypisany adres API i wpisz go w `web/index.html` w linii `window.STT_API_BASE = window.STT_API_BASE || "..."` (na początku sekcji `<script>` przed głównym kodem), commit i push — frontend na GitHub Pages przełączy się z `localStorage` na realne konta.

Alternatywy bez Blueprintu — **Railway / Fly.io**: połącz z repozytorium GitHub, wskaż katalog `server/`, komenda startowa `npm start`, ustaw zmienne `NODE_ENV=production` i `ALLOWED_ORIGINS=<adres Twojego frontendu>`.

**Własny VPS**: `git clone`, `cd server && npm install --production`, uruchom pod `pm2` lub jako `systemd` service, wystaw przez Nginx z certyfikatem TLS (wymagane — ciasteczka sesji w produkcji wymagają `Secure` + HTTPS).

⚠️ Baza SQLite to plik na dysku kontenera — na platformach z efemerycznym systemem plików (część darmowych planów Render/Railway) dane przepadną po restarcie kontenera. Do trwałego wdrożenia produkcyjnego użyj wolumenu trwałego (persistent disk) albo podmień na hostowaną bazę Postgres (np. Neon, Supabase) — schemat w `src/db.js` jest prosty do przeniesienia.

## Bezpieczeństwo — co już jest, a czego jeszcze brakuje do pełnej produkcji

Zrobione: haszowanie haseł (scrypt + sól), zapytania parametryzowane (brak SQL injection), rate-limiting na logowaniu/rejestracji, ciasteczka `httpOnly`/`SameSite`, CORS ograniczony do znanych originów, walidacja danych wejściowych.

Do zrobienia przed realnym uruchomieniem komercyjnym: weryfikacja adresu e-mail, reset hasła, 2FA dla panelu admina (jak w dok. 06 specyfikacji), monitoring i alerty, backup bazy danych, przegląd bezpieczeństwa (pentest) — zgodnie z pełną specyfikacją w `docs/06-bezpieczenstwo-zgodnosc-prawna.md`.
