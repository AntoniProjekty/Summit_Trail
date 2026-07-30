# 02 — Produkty, katalog i PIM (Product Information Management)

[← Wróć do indeksu](../README.md)

## 2.1 Taksonomia katalogu

```
Summit & Trail
├── E-Rowery
│   ├── E-Bike Trekkingowy
│   ├── E-Bike Górski (MTB)
│   ├── E-Bike Miejski
│   └── Akcesoria do e-bike (baterie zapasowe, torby ramowe, foteliki)
├── Sprzęt Biwakowy
│   ├── Namioty Dachowe
│   ├── Namioty Naziemne
│   ├── Śpiwory i maty
│   └── Kuchnie turystyczne
├── Akcesoria Outdoorowe
│   ├── Bagażniki dachowe i systemy transportowe
│   ├── Odzież i obuwie techniczne
│   └── Nawigacja i elektronika outdoorowa
└── Zasilanie Przenośne
    ├── Stacje zasilania (Power Stations)
    ├── Panele solarowe
    └── Powerbanki i akcesoria ładujące
```

Taksonomia zaprojektowana jako **drzewo wielowymiarowe** — produkt może należeć do kategorii głównej oraz kategorii "krzyżowych" (np. bagażnik dachowy pod namiot jest jednocześnie w „Akcesoria Outdoorowe” i polecany krzyżowo w PDP namiotu dachowego).

## 2.2 Model danych PIM (Product Information Management)

Rekomendowane podejście: dedykowany PIM (np. Akeneo/Pimcore) jako **źródło prawdy dla treści produktowej**, synchronizowany jednostronnie do: sklepu (frontend), BaseLinker (ceny/stany — patrz dok. 04) oraz feedów marketplace.

| Warstwa atrybutów | Przykład | Wykorzystanie |
|---|---|---|
| Atrybuty wspólne (wszystkie kategorie) | Nazwa, SKU, EAN, VAT, waga, wymiary, opis SEO | Katalog, logistyka, podatki |
| Atrybuty kategorii (attribute set) | E-Bike: moc silnika, zasięg, rozmiar ramy; Namiot: słup wodny, pojemność osobowa | Filtry fasetowe, tabela specyfikacji |
| Atrybuty wariantowe | Kolor, rozmiar, pojemność baterii | Generowanie SKU wariantów, warstwa cenowa |
| Atrybuty marketingowe | Bestseller, Nowość, Eco-friendly, Zgodność z ratami 0% | Odznaki (badges) na listingu i PDP |
| Atrybuty kanałowe (channel-specific) | Nazwa/kategoria dedykowana dla Allegro, opis skrócony dla Google Shopping | Feed marketplace (dok. 04) |

## 2.3 Atrybuty filtrowania fasetowego (per kategoria)

| Kategoria | Filtry fasetowe |
|---|---|
| E-Bike Trekkingowy | Rozmiar ramy, pojemność baterii (Wh), zasięg (km), typ hamulców, cena, dostępność „odbiór dziś w salonie” |
| Namiot Dachowy | Pojemność osobowa, słup wodny (mm), waga, materiał poszycia, kompatybilność z bagażnikiem |
| Stacja Zasilania | Pojemność (Wh), moc wyjściowa (W), typ ogniw (LiFePO4/NMC), liczba portów USB-C PD |

Silnik wyszukiwania (Algolia/Elasticsearch — patrz dok. 07) indeksuje wszystkie atrybuty jako facety z licznikiem wyników w czasie rzeczywistym oraz sortowaniem wg trafności, ceny, popularności i oceny.

## 2.4 Przykładowe karty produktowe (referencyjne)

Poniżej trzy w pełni rozbudowane karty produktowe reprezentujące trzy główne kategorie asortymentu — struktura ta jest szablonem replikowanym dla całego katalogu (docelowo 300–500 aktywnych SKU w Fazie 1).

### 2.4.1 E-Bike Trekkingowy — „Summit & Trail Ranger X1”

**SKU bazowe:** `SNT-EBK-RGX1` · **EAN (wariant M/Czarny):** `5906190000117`

#### Treść SEO

## Ranger X1 — trekkingowy e-bike, który przewiezie Cię dalej, niż myślisz

Summit & Trail Ranger X1 to elektryczny rower trekkingowy zaprojektowany dla osób, które nie dzielą przygody na „miasto” i „szlak”. Silnik środkowy 250W, bateria do 720 Wh i geometria trekkingowa sprawiają, że Ranger X1 równie dobrze radzi sobie w dojazdach do pracy, jak i na wielodniowych wyprawach z bagażem.

### Zasięg, który nie ogranicza planów
Dzięki akumulatorowi zintegrowanemu w ramie (opcja 500 Wh lub 720 Wh) Ranger X1 pokonuje nawet **130 km** na jednym ładowaniu w trybie Eco.

### Napęd Bosch Performance Line — moc i precyzja
Środkowy silnik Bosch klasy Performance Line (250 W, 65 Nm) współpracuje z 10-biegową kasetą Shimano Deore.

### Bezpieczeństwo na pierwszym miejscu
Hydrauliczne tarczowe hamulce Shimano MT200 oraz oświetlenie zintegrowane z instalacją elektryczną spełniają wymagania homologacyjne do jazdy po zmroku.

#### Specyfikacja techniczna

| Parametr | Wartość |
|---|---|
| Silnik | Bosch Performance Line, 250 W, 65 Nm (środkowy) |
| Bateria | Bosch PowerTube, 500 Wh / 720 Wh |
| Zasięg (Eco) | do 130 km (720 Wh) / do 90 km (500 Wh) |
| Czas ładowania | 4,5 h |
| Rama | Aluminium 6061, S/M/L/XL |
| Przerzutki | Shimano Deore 10-rz. |
| Hamulce | Hydrauliczne tarczowe Shimano MT200, 180 mm |
| Maks. obciążenie | 150 kg |
| Waga roweru | 24,8–25,6 kg (wg wariantu) |

#### Warianty i logistyka

| Atrybut | Opcje |
|---|---|
| Rozmiar ramy | S / M / L / XL |
| Kolor | Czarny Grafit / Zielony Leśny |
| Bateria | 500 Wh / 720 Wh |

| Parametr logistyczny | Wartość |
|---|---|
| VAT | 23% |
| Cena netto / brutto | 8 943,09 PLN / 11 000,00 PLN |
| Waga brutto (z opak.) | 29,5 kg |
| Wymiary opakowania | 145 × 25 × 85 cm |
| Typ przesyłki | Paletowa (Raben/DHL Freight) |
| Kod CN | 8711 60 10 |

### 2.4.2 Namiot Dachowy — „Summit & Trail SkyNest 3”

**SKU bazowe:** `SNT-TNT-SKN3` · **EAN (Piaskowy):** `5906190000148`

#### Treść SEO

## SkyNest 3 — Twój hotel na czterech kołach, gdziekolwiek zaparkujesz

Namiot dachowy Summit & Trail SkyNest 3 zmienia dach każdego SUV-a, kombi czy pickupa w wygodną sypialnię z widokiem. Rozkładany w mniej niż 3 minuty, mieści do 3 osób.

### Rozstaw w 3 minuty, bez narzędzi
Konstrukcja hard-shell na zawiasie gazowym otwiera się jednym ruchem, z drabinką aluminiową teleskopową (190–230 cm).

### Materiały klasy premium na trudne warunki
Poszycie Rip-Stop 280 g/m² zapewnia oddychalność przy pełnej wodoodporności **5000 mm słupa wody**.

#### Specyfikacja techniczna

| Parametr | Wartość |
|---|---|
| Pojemność | 2–3 osoby |
| Materiał | Rip-Stop 280 g/m², natłuszczana |
| Słup wodny | 5000 mm |
| Skorupa | ABS wzmacniane włóknem szklanym |
| Materac | Piana wysokiej gęstości, 7,5 cm |
| Wymiary złożony / rozłożony | 210×130×30 cm / 210×240 cm |
| Obciążenie dynamiczne bagażnika | do 75 kg |
| Waga | 58 kg |

#### Warianty i logistyka

| Atrybut | Opcje |
|---|---|
| Kolor | Piaskowy / Oliwkowy |
| Pojemność | 2-osobowy (SkyNest 2) / 3-osobowy (SkyNest 3) |

| Parametr logistyczny | Wartość |
|---|---|
| VAT | 23% |
| Cena netto / brutto | 6 504,07 PLN / 8 000,00 PLN |
| Waga brutto | 64 kg |
| Wymiary opakowania | 215×135×35 cm |
| Typ przesyłki | Paletowa |
| Kod CN | 6306 22 00 |

### 2.4.3 Stacja Zasilania — „Summit & Trail PowerBase 1000”

**SKU bazowe:** `SNT-PWR-PB1000` · **EAN (1000 Wh):** `5906190000179`

#### Treść SEO

## PowerBase 1000 — energia elektryczna wszędzie, gdzie zabierze Cię szlak

Przenośna stacja zasilania na ogniwach LiFePO4 do zasilania sprzętu biwakowego, lodówek turystycznych i elektroniki bez dostępu do sieci.

### Ogniwa LiFePO4 — 3500+ cykli ładowania
Ponad 3500 cykli pełnego ładowania przy zachowaniu 80% pojemności — ekwiwalent ponad 10 lat użytkowania sezonowego.

### Ładowanie z trzech źródeł równocześnie
AC 230V, solar (do 200W), 12V samochodowe.

#### Specyfikacja techniczna

| Parametr | Wartość |
|---|---|
| Pojemność | 1024 Wh (LiFePO4) |
| Moc ciągła / szczytowa | 1200 W / 2400 W |
| Porty | 2× AC230V, 2× USB-A, 2× USB-C PD100W, 1× DC12V |
| Czas ładowania AC (0–80%) | 50 min |
| Żywotność | > 3500 cykli |
| Waga | 12,8 kg |

#### Warianty i logistyka

| Atrybut | Opcje |
|---|---|
| Pojemność | 1024 Wh / 1500 Wh |
| Zestaw | Solo / + panel SolarFlex 100W / + panel SolarFlex 200W |

| Parametr logistyczny | Wartość |
|---|---|
| VAT | 23% |
| Cena netto / brutto | 3 252,03 PLN / 4 000,00 PLN |
| Waga brutto | 14,5 kg |
| Wymiary opakowania | 38×28×30 cm |
| Typ przesyłki | Standardowa (kurier/paczkomat) |
| Kod CN | 8507 60 00 |
| Uwaga | Baterie litowe UN3480/UN3481 — deklaracja ADR/IATA dla przewoźnika |

## 2.5 Zarządzanie treścią i mediami produktowymi

| Element | Standard |
|---|---|
| Zdjęcia produktowe | Min. 6 zdjęć/produkt, tło białe (marketplace-ready) + zdjęcia lifestyle, format WebP/AVIF, CDN z transformacją on-the-fly |
| Wideo 360°/rozpakowanie | Dla produktów flagowych (e-bike, namioty) — hostowane na CDN wideo (Mux/Cloudflare Stream) |
| Tabele rozmiarów | Interaktywny „Size Guide” z rekomendacją rozmiaru ramy na podstawie wzrostu klienta |
| Recenzje i oceny | Zbierane automatycznie 14 dni po dostawie (e-mail trigger), weryfikowane zakupy (Verified Purchase), moduł Q&A pod produktem |
| Rich Snippets | Znaczniki `schema.org/Product`, `AggregateRating`, `Offer` — szczegóły w dok. 07 |
