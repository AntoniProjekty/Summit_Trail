# 07 — SEO, AI i personalizacja

[← Wróć do indeksu](../README.md)

## 7.1 Technical SEO

| Element | Implementacja |
|---|---|
| Renderowanie | SSR/ISR (Next.js) — pełny HTML dostępny dla crawlerów bez wykonywania JS |
| Sitemap XML | Segmentowane pliki (`sitemap-products.xml`, `sitemap-categories.xml`, `sitemap-blog.xml`) + `sitemap_index.xml`, auto-regeneracja przy zmianie katalogu |
| Kanoniczne adresy URL | `rel=canonical` na każdej stronie z parametrami filtrów, unikanie duplicate content |
| Paginacja i filtry fasetowe | Kontrola indeksacji (`noindex,follow` dla kombinacji filtrów niskiej wartości SEO) |
| Szybkość strony | Zgodność z budżetem Core Web Vitals (dok. 03) — czynnik rankingowy Google |
| Międzynarodowe SEO (hreflang) | `hreflang` dla wariantów językowych/rynkowych przy ekspansji (dok. 10) |

### Dane strukturalne (schema.org)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Summit & Trail Ranger X1 Trekking E-Bike",
  "sku": "SNT-EBK-RGX1-M-BLK-720",
  "gtin13": "5906190000124",
  "brand": { "@type": "Brand", "name": "Summit & Trail" },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "126"
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "PLN",
    "price": "11000.00",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 14
    }
  }
}
```

Dodatkowe znaczniki: `BreadcrumbList` (nawigacja), `FAQPage` (centrum pomocy), `Article` (blog), `LocalBusiness` (salony stacjonarne).

## 7.2 Strategia treści i content marketing

- **Magazyn „Poradnik Odkrywcy”** (`/magazyn`) — struktura topic clusters: poradniki zakupowe („Jak wybrać e-bike trekkingowy”), recenzje szlaków, artykuły serwisowe („Jak przygotować rower elektryczny do zimy”). Każdy artykuł linkuje wewnętrznie do min. 3 powiązanych PDP.
- **Link building / digital PR:** współpraca z blogerami outdoorowymi i mediami branżowymi, publikacje gościnne z linkami do kategorii produktowych.
- **UGC (user-generated content):** galeria zdjęć klientów z produktami w terenie (social proof + świeże treści indeksowane przez Google Images).
- **Kalendarz redakcyjny** zintegrowany z CMS (dok. 03) — planowanie publikacji wokół sezonowości (wiosna = rowery, jesień = biwak/zasilanie).

## 7.3 Wyszukiwanie semantyczne i AI

| Funkcja | Opis |
|---|---|
| Wyszukiwanie fasetowe z typo-tolerance | Algolia/Elasticsearch — wyniki mimo literówek, synonimy („e-rower” = „e-bike”) |
| Wyszukiwanie semantyczne (NLU) | Zapytania naturalne („rower na dłuższe trasy pod 12 tys. zł”) mapowane na filtry atrybutów przez model embeddingowy |
| Autouzupełnianie z podglądem | Podpowiedzi produktowe ze zdjęciem, ceną i dostępnością w czasie rzeczywistym |
| Wyszukiwanie głosowe/wizualne (Faza 3) | Upload zdjęcia produktu (np. konkurencyjnego namiotu) → wyszukiwanie podobnych produktów w katalogu |

## 7.4 Personalizacja i rekomendacje AI

- **Silnik rekomendacji:** collaborative filtering + content-based filtering (podobne atrybuty) — sekcje „Klienci kupili również”, „Dopasowane akcesoria” (np. bagażnik pod konkretny model roweru).
- **Personalizacja strony głównej:** dynamiczne banery i kolejność kategorii wg segmentu klienta (nowy odwiedzający vs klient powracający vs klient B2B) — feed z CDP (dok. 08).
- **Dynamic pricing / competitor monitoring (Faza 3):** monitorowanie cen konkurencji (web scraping zgodny z ToS lub API cenowe) z alertami dla zespołu handlowego, nie automatyczna zmiana cen bez nadzoru.
- **AI Chatbot / Asystent zakupowy:** wirtualny doradca (LLM z RAG na bazie katalogu i FAQ) — odpowiada na pytania typu „jaki rower wybrać do dojazdów 15 km dziennie po górzystym terenie”, eskaluje do konsultanta przy pytaniach poza zakresem (guardrails i limity odpowiedzi finansowych/medycznych).
- **Wizualizacja i konfigurator 3D (Faza 2):** podgląd wybranego koloru/wariantu roweru w 3D przed zakupem.

## 7.5 SEO lokalne

- Strony `/salony/{miasto}` ze znacznikiem `LocalBusiness`, godzinami otwarcia, mapą i dostępnością lokalną — wsparcie zapytań „e-bike serwis Warszawa”.
- Integracja z Google Business Profile dla każdego salonu (synchronizacja godzin, ocen, zdjęć).
