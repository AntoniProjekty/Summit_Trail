# 05 — Logistyka, dostawy i płatności

[← Wróć do indeksu](../README.md)

## 5.1 Przesyłki standardowe (kurier / paczkomat)

| Metoda | Zakres wagowy/gabarytowy | Czas dostawy | Cena orientacyjna |
|---|---|---|---|
| Paczkomat InPost | do 25 kg, max. gabaryt C (41×38×64 cm) | 1–2 dni robocze | 14,99 PLN |
| Kurier DPD — pakiet mały | do 10 kg, suma wymiarów ≤ 150 cm | 1 dzień roboczy | 16,99 PLN |
| Kurier DPD — pakiet duży | 10–31,5 kg, suma wymiarów ≤ 300 cm | 1–2 dni robocze | 24,99 PLN |

Silnik dostawy sumuje wagę brutto i najdłuższy wymiar pozycji w koszyku i klasyfikuje przesyłkę automatycznie. Produkty z `shipping_class = oversized` (e-bike, namiot dachowy) wykluczają metody standardowe z listy dostępnych opcji.

## 5.2 Przesyłki paletowe / gabarytowe

| Metoda | Zastosowanie | Przewoźnik | Czas dostawy | Cena orientacyjna |
|---|---|---|---|---|
| Przesyłka paletowa krajowa | E-bike, namiot dachowy, paleta do 200 kg | Raben | 2–3 dni robocze | 149 PLN |
| DHL Freight — przesyłka częściowa | Zamówienia wielopaletowe (B2B) | DHL Freight | 3–5 dni robocze | Wycena indywidualna (API DHL Freight Quote) |
| Dostawa z wniesieniem (premium) | E-bike / namiot dachowy | Raben (usługa dodatkowa) | 2–4 dni robocze | +49 PLN |

Produkty gabarytowe wymagają w checkout numeru telefonu (awizacja telefoniczna przed dostawą paletową).

## 5.3 Odbiór osobisty

- Wybór punktu stacjonarnego z listy (Google Maps API / lista salonów).
- Status „Do przygotowania w punkcie X” + powiadomienie SMS/e-mail po skompletowaniu.
- Koszt: 0 PLN niezależnie od wartości koszyka.
- Limit odbioru: 5 dni robocze, przypomnienie e-mail po tym czasie.

## 5.4 Bramki płatności

| Metoda | Dostawca | Uwagi integracyjne |
|---|---|---|
| BLIK | PayU / Przelewy24 | Płatność natychmiastowa, webhook w czasie rzeczywistym |
| Karta płatnicza | PayU / Przelewy24 | 3D-Secure 2, tokenizacja dla zakupów powrotnych |
| Raty 0% | PayU Raty / Przelewy24 | Od progu koszyka (np. 500 PLN), decyzja kredytowa online |
| PayPo / Twisto (BNPL) | Integracja natywna | „Kup teraz, zapłać za 30 dni” |
| Przelew tradycyjny | — | Auto-anulowanie po 5 dniach braku wpłaty |
| Płatność przy odbiorze | — | Wyłączona dla przesyłek paletowych |

Webhooki płatności (`notify_url` PayU / `urlStatus` Przelewy24) aktualizują status zamówienia i wyzwalają automatyzację BaseLinker (fakturowanie — dok. 04).

## 5.5 Logika darmowej dostawy — reguły koszyka

```
REGUŁA: Darmowa dostawa standardowa
  WARUNEK: suma_koszyka >= 300 PLN ORAZ brak pozycji "oversized"
  AKCJA: koszt_dostawy = 0 PLN (InPost, DPD)

REGUŁA: Wyłączenie przesyłek paletowych
  WARUNEK: koszyk zawiera >=1 produkt "oversized"
  AKCJA: reguła darmowej dostawy standardowej NIE MA ZASTOSOWANIA

REGUŁA: Rabat na dostawę paletową
  WARUNEK: suma_koszyka >= 8000 PLN ORAZ zawiera pozycję "oversized"
  AKCJA: koszt dostawy paletowej -50%
```

Reguły konfigurowalne z panelu administracyjnego (cart rules engine), bez zmian w kodzie.

## 5.6 Zwroty i reklamacje (RMA) — proces samoobsługowy

1. Klient inicjuje zwrot z panelu konta (`/konto/zwroty/nowy`), wskazując pozycje i przyczynę.
2. System automatycznie generuje etykietę zwrotną (InPost/DPD dla standardowych, zamówienie kuriera paletowego dla gabarytów) i formularz odstąpienia (wzór — dok. 06).
3. Status zamówienia aktualizowany do „Zwrot w trakcie” → BaseLinker wyzwala fakturę korygującą po przyjęciu towaru na magazyn.
4. Zwrot środków realizowany tą samą metodą płatności (Refund API) w ciągu 14 dni od otrzymania towaru, zgodnie z Ustawą o prawach konsumenta.
5. Dla e-bike/namiotów: odbiór przez przewoźnika paletowego zamawiany przez sklep na koszt konsumenta (zgodnie z art. 34 ustawy, o ile konsument nie postanowi inaczej).

## 5.7 Logistyka zrównoważona (ESG)

- Opakowania kartonowe z recyklingu, minimalizacja plastiku (folia biodegradowalna przy produktach tekstylnych).
- Konsolidacja przesyłek — jeśli klient zamawia produkt standardowy i gabarytowy w jednym zamówieniu, system proponuje wysyłkę łączoną tam, gdzie to możliwe, redukując liczbę transportów.
- Raportowanie śladu węglowego dostaw (integracja z kalkulatorem CO2 przewoźnika) — prezentowane w sekcji ESG (dok. 01, `/zrownowazony-rozwoj`).

## 5.8 Ekspansja logistyczna — kierunek międzynarodowy

Szczegóły stawek VAT, lokalnych metod płatności i przewoźników dla rynków DE/CZ/SK — patrz [dokument 10](10-b2b-ekspansja-miedzynarodowa.md).
