# 12 — Summit AI: własna platforma sztucznej inteligencji

[← Wróć do indeksu](../README.md)

Summit AI to **własna, zastrzeżona warstwa inteligencji** rozsiana po całej platformie Summit & Trail — nie pojedynczy „chatbot", ale spójna platforma ML/AI, która zasila wyszukiwanie, personalizację, obsługę klienta, ceny, marketing, bezpieczeństwo i operacje wewnętrzne. To właśnie ta warstwa odróżnia Summit & Trail od standardowego sklepu SaaS — analogicznie do tego, jak duże platformy (Amazon, Zalando, Decathlon) budują wewnętrzne zespoły AI/ML jako przewagę konkurencyjną, nie jako dodatek.

## 12.1 Architektura platformy AI

<div class="flow-wrap">
<div class="flow-stack">
  <div class="flow-layer">
    <div class="flow-layer-title">Warstwa aplikacyjna</div>
    <div class="flow-chips">
      <span class="flow-chip">Sklep web/mobile</span>
      <span class="flow-chip">Panel BOK / Agent Assist</span>
      <span class="flow-chip">Panel merchandisingu</span>
      <span class="flow-chip">Panel operacji/zakupów</span>
    </div>
  </div>
  <div class="flow-down">↓</div>
  <div class="flow-layer" style="border-color: color-mix(in srgb, var(--accent) 45%, var(--line));">
    <div class="flow-layer-title">Summit AI Gateway</div>
    <div class="flow-chips">
      <span class="flow-chip flow-chip-accent">Router zapytań + guardrails</span>
      <span class="flow-chip flow-chip-accent">Cache semantyczny odpowiedzi</span>
      <span class="flow-chip flow-chip-accent">Filtr bezpieczeństwa: PII redaction, anty-prompt-injection, moderacja</span>
    </div>
  </div>
  <div class="flow-down">↓</div>
  <div class="flow-layer">
    <div class="flow-layer-title">Warstwa modeli</div>
    <div class="flow-chips">
      <span class="flow-chip">LLM (Claude) — asystent, treści, agent assist</span>
      <span class="flow-chip">Model embeddingów — wyszukiwanie, rekomendacje</span>
      <span class="flow-chip">Modele wizji — visual search, fit, kontrola zdjęć</span>
      <span class="flow-chip">Modele prognostyczne — popyt, ceny, fraud score</span>
    </div>
  </div>
  <div class="flow-down">↕</div>
  <div class="flow-pair">
    <div class="flow-layer">
      <div class="flow-layer-title">Platforma MLOps</div>
      <div class="flow-chips">
        <span class="flow-chip">Feature Store (Feast)</span>
        <span class="flow-chip">Baza wektorowa (Pinecone/Weaviate/pgvector)</span>
        <span class="flow-chip">Model Registry (MLflow)</span>
        <span class="flow-chip">Monitoring driftu i kosztów</span>
      </div>
    </div>
    <div class="flow-layer">
      <div class="flow-layer-title">Dane źródłowe</div>
      <div class="flow-chips">
        <span class="flow-chip">CDP — Customer 360 (dok. 08)</span>
        <span class="flow-chip">Data Warehouse (dok. 09)</span>
        <span class="flow-chip">PIM / Katalog (dok. 02)</span>
        <span class="flow-chip">Telemetria IoT e-bike</span>
      </div>
    </div>
  </div>
</div>
</div>

**Zasada projektowa:** żadna aplikacja nie wywołuje modelu AI bezpośrednio — wszystko przechodzi przez **Summit AI Gateway**, który centralizuje: autoryzację, limity kosztowe (budżet per funkcja), logowanie do audytu, filtrowanie danych osobowych z promptów oraz wykrywanie prompt injection. To pozwala wymieniać dostawcę modelu (Claude, model open-source self-hosted) bez zmian w kodzie aplikacji.

## 12.2 Summit AI Assistant — konwersacyjny asystent zakupowy

Wirtualny doradca dostępny na stronie, w aplikacji mobilnej (Faza 3) i w kanałach messagingowych (WhatsApp Business API), zbudowany w architekturze **RAG (Retrieval-Augmented Generation)**.

| Funkcja | Opis |
|---|---|
| Doradztwo produktowe | „Szukam e-bike do dojazdów 15 km dziennie po górzystym terenie, budżet do 12 tys." → asystent filtruje katalog (PIM, dok. 02), porównuje warianty, tłumaczy różnice techniczne w prostym języku |
| Status zamówienia i RMA | Odpowiada na pytania o status bez przełączania klienta do BOK — pobiera dane z Order Management (dok. 04) w czasie rzeczywistym |
| Doradztwo serwisowe | „Jak przygotować rower do zimy" — łączy wiedzę z bazy artykułów (dok. 07) i danych telemetrycznych klienta (12.7), jeśli klient jest zalogowany |
| Wielojęzyczność | Natywna obsługa PL/EN/UK od startu (dok. 13) oraz języków rynków ekspansji DE/CZ (dok. 10) bez potrzeby osobnego treningu — LLM tłumaczy kontekstowo, zachowując terminologię techniczną z PIM |
| Eskalacja do człowieka | Przy niskiej pewności odpowiedzi, pytaniach finansowych/prawnych lub wyrażonej frustracji (sentiment — 12.8) — przekazanie do agenta z pełnym podsumowaniem rozmowy |

### Architektura RAG asystenta

<div class="flow-wrap">
<div class="flow-row">
  <span class="flow-step">Zapytanie klienta</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step">Embedding zapytania</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step">Wyszukiwanie w bazie wektorowej (katalog, FAQ, artykuły, polityki)</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step">Zbiór kontekstu (top-k dokumentów)</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step">Prompt: system + kontekst + historia + profil klienta (CDP)</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step flow-chip-accent">LLM (Claude)</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step">Guardrails wyjścia: ceny/dostępność live, filtr treści</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step">Odpowiedź do klienta</span>
</div>
</div>

Przykładowy system prompt (szkielet, guardrails):

```
Jesteś asystentem zakupowym Summit & Trail. Odpowiadaj wyłącznie na podstawie
dostarczonego kontekstu (katalog, FAQ, polityki). Nie zgaduj cen ani dostępności —
jeśli nie masz aktualnych danych w kontekście, poinformuj klienta i zaproponuj
sprawdzenie na karcie produktu. Nie udzielaj porad finansowych, prawnych ani
medycznych. Jeśli klient wyraża silną frustrację lub prosi o rozmowę z człowiekiem —
zaproponuj przekazanie do konsultanta. Zawsze informuj, że rozmawia z asystentem AI.
```

## 12.3 Wyszukiwanie wizualne, AR i AI dopasowania rozmiaru

| Funkcja | Opis |
|---|---|
| Visual Search | Klient wgrywa zdjęcie (np. namiotu widzianego u znajomego) — model wizji (CLIP-podobny) generuje embedding obrazu i wyszukuje wizualnie podobne produkty w katalogu |
| AR Preview | Podgląd namiotu dachowego na dachu własnego auta (kamera telefonu) lub roweru w wybranym kolorze w skali rzeczywistej — WebAR (model 3D z PIM, dok. 02) |
| AI Fit Advisor | Rekomendacja rozmiaru ramy roweru na podstawie wzrostu/długości nogi (formularz) lub analizy zdjęcia postawy (opcjonalnie, z wyraźną zgodą) — model regresyjny trenowany na danych geometrii ram i zwrotów „rozmiar nie pasował” |
| Kontrola jakości zdjęć produktowych | Model wizji automatycznie flaguje zdjęcia niezgodne ze standardem (zła ekspozycja, brak białego tła, rozmycie) przed publikacją w PIM |

## 12.4 Silnik rekomendacji i personalizacji nowej generacji

Rozwija warstwę opisaną w dok. 07 o konkretną architekturę modelową:

- **Real-time feature store (Feast):** cechy klienta (segment RFM, ostatnio przeglądane kategorie, urządzenie, lokalizacja) i produktu (marża, rotacja magazynowa, sezonowość) dostępne z latencją < 20 ms dla silnika rekomendacji.
- **Embeddingi produktowe i użytkownika** w wspólnej przestrzeni wektorowej (two-tower model) — rekomendacje „podobne produkty” i „dla Ciebie” liczone jako podobieństwo kosinusowe w bazie wektorowej (Pinecone/pgvector).
- **Ranking multi-cel:** model rankingujący wyniki wyszukiwania i rekomendacji optymalizuje jednocześnie trafność, marżę i dostępność magazynową (nie tylko CTR) — logika transparentna dla zespołu merchandisingu (możliwość „wagi biznesowej” per kampania).
- **Cold-start:** dla nowych klientów — rekomendacje oparte na kontekście sesji (kategoria wejściowa, kampania reklamowa) i popularności ogólnej, do momentu zebrania sygnału behawioralnego.

## 12.5 Summit AI Content Studio — generowanie treści

| Zastosowanie | Opis | Nadzór ludzki |
|---|---|---|
| Opisy produktowe SEO | Generowanie wariantów opisu marketingowego (dok. 02) na bazie specyfikacji technicznej z PIM — wiele wariantów do testów A/B (dok. 09) | Redaktor zatwierdza przed publikacją |
| Tłumaczenia lokalizacyjne | Wstępne tłumaczenie opisów na EN/UK (dok. 13) i języki rynków ekspansji DE/CZ (dok. 10) z zachowaniem tonu marki i terminologii technicznej | Obowiązkowa redakcja native speakera (dok. 13) przed publikacją |
| Meta title/description | Automatyczna generacja i testowanie wariantów pod CTR w wynikach wyszukiwania | Automatyczna publikacja z monitoringiem CTR |
| Kreacje reklamowe (ad copy) | Warianty tekstów dla Meta/Google Ads dopasowane do segmentu odbiorcy (dok. 08) | Marketing zatwierdza kampanię |
| Podsumowania recenzji klientów | Skrócone podsumowanie „co klienci mówią” na PDP na bazie dziesiątek recenzji | Oznaczone jako „podsumowanie AI”, link do pełnych recenzji |
| Notatki serwisowe/BOK | Automatyczne podsumowanie długiej korespondencji z klientem dla agenta przejmującego zgłoszenie (12.8) | Widoczne tylko wewnętrznie |

Każda treść wygenerowana przez AI i prezentowana klientowi końcowemu jest oznaczona zgodnie z zasadami transparentności (12.12).

## 12.6 Dynamic pricing i prognozowanie popytu

- **Prognozowanie popytu:** model szeregów czasowych (np. gradient boosting / temporal fusion transformer) na danych sprzedażowych, sezonowości i danych pogodowych (np. wzrost popytu na namioty przy prognozie ładnej pogody) — wspiera planowanie zakupów przekazywane do zespołu zakupów i synchronizowane z BaseLinker (dok. 04).
- **Elastyczność cenowa (price elasticity):** model estymujący wpływ zmiany ceny na wolumen sprzedaży per kategoria — wspiera decyzje o promocjach, zawsze w ramach ograniczeń Dyrektywy Omnibus (dok. 06: 30-dniowa najniższa cena jako twardy constraint modelu, nie sugestia).
- **Monitoring cen konkurencji:** agregacja publicznie dostępnych danych cenowych (zgodnie z ToS/robots.txt), alert dla handlowców przy odchyleniu > X% — **decyzję o zmianie ceny podejmuje człowiek**, model nie zmienia cen automatycznie (kontrola ryzyka prawnego i reputacyjnego).

## 12.7 Predictive Maintenance — AI + IoT dla e-bike

Rowery elektryczne Summit & Trail (wariant Connect, Faza 3) wyposażone w moduł telemetryczny raportujący dane o baterii i komponentach do panelu klienta i platformy AI.

| Sygnał | Model AI | Akcja |
|---|---|---|
| Cykle ładowania baterii, temperatura, głębokość rozładowań | Model predykcji degradacji baterii (RUL — Remaining Useful Life) | Powiadomienie klienta o przewidywanym spadku zasięgu, propozycja wymiany baterii z wyprzedzeniem |
| Wzorce jazdy, wibracje (z akcelerometru) | Model detekcji anomalii (np. niewyważone koło, zużyte klocki hamulcowe) | Automatyczne przypomnienie o przeglądzie serwisowym (dok. 01: `/serwis`) |
| Historia serwisowa + przebieg | Model priorytetyzacji przeglądów | Rekomendacja terminu przeglądu w salonie z dostępnym terminem (dok. 01: `/salony`) |

Dane telemetryczne przetwarzane z zachowaniem zasad RODO (dok. 06) — klient decyduje o aktywacji funkcji telemetrycznych (opt-in), dane zanonimizowane w analizach agregatowych.

## 12.8 AI w obsłudze klienta (Agent Assist)

- **Analiza sentymentu w czasie rzeczywistym** — priorytetyzacja kolejki BOK (dok. 08): zgłoszenia z wysokim wskaźnikiem frustracji przechodzą przed standardowe w kolejce.
- **Auto-triage zgłoszeń** — klasyfikacja tematu (reklamacja, pytanie przedsprzedażowe, status zamówienia) i automatyczne przypisanie do właściwego zespołu/kolejki.
- **Agent Assist:** podczas rozmowy z klientem agent widzi podpowiedzi — proponowaną odpowiedź, powiązane artykuły bazy wiedzy, podsumowanie historii klienta z CDP (dok. 08) — skraca czas obsługi (AHT) bez automatyzowania decyzji finansowych (zwroty ponad określony próg wymagają zatwierdzenia człowieka).
- **Analiza jakości rozmów (QA automatyczne):** próbkowanie i ocena zgodności z procedurami (ton, kompletność informacji) wspierające coaching zespołu BOK.

## 12.9 AI w bezpieczeństwie — fraud detection i AIOps

| Obszar | Model/Mechanizm | Efekt |
|---|---|---|
| Fraud checkout | Model scoringu ryzyka transakcji (adres dostawy vs billing, prędkość zamówień z IP, historia chargeback) | Zamówienia wysokiego ryzyka kierowane do manualnej weryfikacji przed wysyłką |
| Detekcja botów zakupowych | Analiza wzorców behawioralnych (prędkość interakcji, sekwencje kliknięć) uzupełniająca Cloudflare Turnstile (dok. 06) | Ograniczenie wykupywania limitowanych dropów (np. edycje limitowane e-bike) |
| Anomaly detection w infrastrukturze (AIOps) | Model wykrywający nietypowe wzorce ruchu/błędów (dok. 03, 11) | Wcześniejsze wykrycie incydentu niż statyczne progi alertowe |
| Ocena ryzyka kredytowego BNPL | Realizowana przez dostawcę płatności odroczonych (PayPo/Twisto) — Summit & Trail **nie przetwarza własnego scoringu kredytowego** | Uniknięcie klasyfikacji jako systemu wysokiego ryzyka wg AI Act (12.12) |

## 12.10 AI w merchandisingu i operacjach wewnętrznych

- **Auto-tagowanie produktów:** model wizji + NLP automatycznie proponuje atrybuty PIM (kolor, styl, okazja użycia) na podstawie zdjęć i opisu dostawcy — redukcja czasu wdrożenia nowego SKU.
- **Wykrywanie duplikatów i niekompletnych kart produktowych:** przed publikacją w katalogu.
- **Asystent zakupowca (merchandising copilot):** podsumowania trendów sprzedażowych, sugestie doboru asortymentu na nadchodzący sezon na bazie danych z Data Warehouse (dok. 09) i sygnałów zewnętrznych (trendy wyszukiwań).
- **Automatyczne podsumowania raportów zarządczych:** tygodniowe podsumowanie KPI (dok. 09) w języku naturalnym z wyróżnieniem anomalii, wysyłane do zespołu zarządzającego.

## 12.11 Platforma MLOps — infrastruktura pod modele

| Komponent | Rola |
|---|---|
| Feature Store (Feast) | Jednolite, wersjonowane cechy dla treningu i inferencji — eliminacja niezgodności train/serve skew |
| Model Registry (MLflow) | Wersjonowanie modeli, śledzenie eksperymentów, promocja model → staging → produkcja |
| Wektorowa baza danych | Pinecone / Weaviate / pgvector — przechowywanie embeddingów katalogu, FAQ, historii rozmów |
| Monitoring modeli | Wykrywanie data/model drift, alert przy spadku jakości predykcji, automatyczny retrening wg harmonogramu lub triggera driftu |
| Zarządzanie kosztami inferencji | Budżetowanie per funkcja (asystent, rekomendacje, content studio), cache semantyczny odpowiedzi LLM redukujący powtarzalne zapytania |
| Środowiska ML | Odseparowane środowiska trening/staging/produkcja, zgodne z ogólną strategią CI/CD (dok. 03) |
| Human-in-the-loop | Interfejs do oceny i korekty predykcji przez zespół (merchandising, BOK) — dane feedbacku zasilają retrening |

## 12.12 Odpowiedzialne AI i zgodność z EU AI Act

| Wymóg | Implementacja |
|---|---|
| Transparentność wobec użytkownika (Art. 50 AI Act) | Asystent AI zawsze informuje, że rozmowa odbywa się z systemem AI; treści generowane przez AI (opisy, podsumowania recenzji) oznaczone widoczną etykietą |
| Klasyfikacja ryzyka | Funkcje Summit AI (asystent, rekomendacje, wyszukiwanie, content) klasyfikowane jako **ryzyko ograniczone/minimalne** — świadomie unikamy zastosowań wysokiego ryzyka (własny scoring kredytowy, automatyczne decyzje o odmowie usługi bez przeglądu człowieka) |
| Nadzór ludzki (human oversight) | Decyzje o istotnym wpływie na klienta (zwroty ponad próg, blokady konta przy podejrzeniu fraudu, zmiany cen) wymagają zatwierdzenia człowieka — AI rekomenduje, nie decyduje autonomicznie |
| Ochrona danych osobowych w promptach | Warstwa Summit AI Gateway (12.1) redaguje PII przed wysłaniem do modelu tam, gdzie nie jest to niezbędne do udzielenia odpowiedzi; logi rozmów retencjonowane zgodnie z polityką RODO (dok. 06) |
| Odporność na prompt injection / jailbreak | Filtrowanie treści wejściowych i wyjściowych w Gateway, testy red-team przed każdym większym wdrożeniem modelu, ograniczenie zakresu działań asystenta (brak dostępu do operacji zapisu bez potwierdzenia) |
| Audytowalność | Każda interakcja z modelem logowana (wejście, kontekst RAG, wyjście, wersja modelu) do celów audytu i rozpatrywania reklamacji dotyczących odpowiedzi AI |
| Bias monitoring | Okresowa ocena rekomendacji i wyników wyszukiwania pod kątem nieuzasadnionego uprzywilejowania produktów wysokomarżowych względem trafności dla klienta |

---

**Podsumowanie:** Summit AI nie jest jedną funkcją, a warstwą przenikającą całą platformę — od pierwszego kontaktu klienta z wyszukiwarką, przez zakup i rozmowę z asystentem, po telemetrię posprzedażową roweru i wewnętrzne raporty zarządcze. Architektura oparta na centralnym Gateway i platformie MLOps pozwala rozwijać nowe zastosowania AI bez rozproszonych, niekontrolowanych integracji — z zachowaniem pełnej zgodności prawnej i nadzoru człowieka nad decyzjami o istotnym znaczeniu dla klienta.
