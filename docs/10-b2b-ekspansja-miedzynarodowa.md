# 10 — B2B i ekspansja międzynarodowa

[← Wróć do indeksu](../README.md)

## 10.1 Portal B2B (Wholesale)

Segment B2B (floty rowerowe, wypożyczalnie, hurtownie sprzętu outdoor) obsługiwany jest jako odrębna warstwa nad tym samym katalogiem, z dedykowaną logiką cenową i procesową.

| Funkcja | Opis |
|---|---|
| Logowanie firmowe (multi-user) | Konto firmy z wieloma użytkownikami i rolami (kupujący, zatwierdzający budżet, administrator konta) |
| Cennik netto i grupy cenowe | Ceny netto domyślnie, indywidualne progi rabatowe wg wolumenu (tier pricing) |
| Zapytanie ofertowe (RFQ) | Formularz zapytania o wycenę dla zamówień niestandardowych (duże wolumeny, konfiguracje flotowe) |
| Płatność z odroczonym terminem (net-30/net-60) | Weryfikacja limitu kredytowego (np. integracja z BIG/wywiadownią gospodarczą), automatyczne przypomnienia o płatności |
| Dedykowany Account Manager | Przypisanie klienta B2B do opiekuna handlowego, powiadomienia w BaseLinker (dok. 04, pkt 4.3.6) |
| Punch-out / integracja zakupowa (Faza 3) | Standard OCI/cXML dla klientów korporacyjnych z własnym systemem zakupowym (SAP Ariba i podobne) |
| Zamówienia cykliczne | Automatyczne odnawianie zamówień (np. serwis flotowy co kwartał) |

## 10.2 Ekspansja międzynarodowa — plan rolloutu

| Faza | Rynek | Zakres |
|---|---|---|
| Faza 1 | Polska (PL) | Pełna oferta, wszystkie metody dostawy/płatności (dok. 05) |
| Faza 2 | Niemcy (DE), Czechy (CZ) | Lokalna wersja językowa i cenowa, lokalni przewoźnicy (DPD DE, Zásilkovna/PPL CZ) |
| Faza 3 | Słowacja (SK), inne rynki UE | Rozszerzenie na bazie infrastruktury multi-tenant zbudowanej w Fazie 2 |

### Architektura wielojęzykowości i wielowalutowości

- **i18n na poziomie frontendu:** biblioteka tłumaczeń (next-intl) z osobnymi katalogami treści per rynek (nie maszynowe tłumaczenie 1:1 — lokalizacja opisów SEO per rynek).
- **Multi-currency:** ceny bazowe w PLN, przeliczanie wg kursu z bramki płatności lokalnej (PayU/Adyen dla rynków zagranicznych), zamrożenie kursu na czas trwania sesji checkout.
- **Routing domenowy:** `summitandtrail.de`, `summitandtrail.cz` (ccTLD) lub subdomeny `de.summitandtrail.eu` — z `hreflang` (dok. 07) łączącym wersje językowe.
- **Content Delivery per region:** CDN edge lokalny (Cloudflare) minimalizujący opóźnienia dla ruchu zagranicznego.

## 10.3 Zgodność podatkowa dla sprzedaży międzynarodowej UE

| Mechanizm | Zastosowanie |
|---|---|
| VAT-OSS (One Stop Shop) | Rozliczenie VAT sprzedaży B2C do konsumentów w innych krajach UE przez jedną deklarację w kraju rejestracji, bez rejestracji VAT w każdym kraju osobno |
| Reverse charge (odwrotne obciążenie) B2B | Sprzedaż B2B do firm z UE z aktywnym numerem VAT-UE (weryfikacja w systemie VIES) — stawka 0%, obowiązek podatkowy po stronie nabywcy |
| Progi rejestracji lokalnej | Monitorowanie łącznego progu sprzedaży UE (10 000 EUR) decydującego o obowiązku stosowania VAT-OSS |
| Lokalne stawki VAT | Silnik cenowy uwzględnia stawkę VAT kraju dostawy (DE 19%, CZ 21%) przy sprzedaży B2C |

## 10.4 Lokalne metody płatności per rynek

| Rynek | Preferowane metody płatności |
|---|---|
| Polska | BLIK, karta, przelew, raty 0%, PayPo |
| Niemcy | SOFORT/Klarna, karta, PayPal, Rechnungskauf (płatność po dostawie) |
| Czechy | Karta, przelew bankowy lokalny, GoPay |

Integracja realizowana przez bramkę wspierającą multi-market (np. Adyen) lub równoległe podłączenie lokalnych dostawców przez wspólną warstwę abstrakcji płatności w checkout (dok. 03).

## 10.5 Logistyka międzynarodowa

- Przewoźnicy lokalni per rynek (dok. 05 rozszerzony o DPD DE, Zásilkovna CZ) zintegrowani przez BaseLinker (jeden panel operacyjny niezależnie od liczby rynków — dok. 04).
- Cła i dokumentacja eksportowa automatycznie generowane dla wysyłek poza UE (Faza 4, poza zakresem MVP).
- Zwroty międzynarodowe: scentralizowany magazyn zwrotów w Polsce lub lokalne punkty zwrotów przy większym wolumenie na danym rynku.
