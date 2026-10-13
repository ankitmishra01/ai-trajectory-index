# AI Trajectory Index visual audit

Baseline captured on 2026-10-13 from the local `main` branch at 390px, 768px, and 1440px before implementation. Screenshots are in `docs/redesign/before/`.

## System-level findings

- The product does not currently feel like one publication. The ivory editorial homepage shell, dark homepage rankings section, dark map, dark explorer, dark compare page, dark country terminal, and adoption card wall use different spacing, controls, headings, borders, and information density.
- Navigation is duplicated and inconsistent. The utility bar and primary navigation repeat destinations, active states vary, Explore and region pages are not represented clearly, and the mobile header compresses into small text without a usable menu.
- Responsive containment is broken in several views. The homepage rankings grid overflows the 390px viewport, some desktop pages render in unexpectedly narrow columns, and dense controls do not reflow into touch-friendly groups.
- Loading and freshness messages conflict. The header can say "Loading data", the explorer says "cached" and "24h cache", while copy elsewhere claims daily live updates. None of this is presented as one status derived from the scores response.
- Controls lack a common focus, hover, disabled, empty, loading, and success language. Share and export actions do not acknowledge completion.
- Several score treatments can wrap or lose their denominator. Numeric presentation needs tabular figures and `white-space: nowrap`.

## Route findings

- **Home:** The opening editorial composition is distinctive, but its loaded framing ("winning the AI race" and "left behind") is less neutral than the rest of the research product. The page then changes abruptly into a dark terminal. At 390px, hero and ranking layouts overflow, body type becomes too small, and cards form off-screen columns. Search, filter, sort, view, share, and export controls compete for attention.
- **Map:** The map is legible on desktop but the dark full-bleed canvas is disconnected from the site shell. The legend is small, selection state is remote from the map, and the mobile view presents a large loading panel with a floating chat button. Country geographies are pointer-oriented and need explicit keyboard selection support.
- **Explore:** The scatter plot has no shared site header and uses a different container system. Filters are clear on desktop but the chart is dense, relies on color and tiny flags, and needs a mobile data fallback or scroll-safe layout.
- **Compare:** The route is limited to two visible selectors even though the intended contract is up to four. The radar plots near the center despite high pillar scores, indicating an incorrect chart domain or normalization. Summary scores display as 50 and 45 while the selected countries are 91 and 82 in the baseline data, which makes the comparison misleading. The pillar bars use country colors rather than the canonical pillar colors.
- **Adoption:** The introductory comparison between Readiness and Adoption is useful, but the page becomes an extremely long grid of all 186 economies. It lacks progressive disclosure and a compact table mode. Cards, chart, filters, and insights use the dark subsystem rather than the homepage language.
- **Methodology:** Source and formula content is valuable but visually dense. The scoring formula needs a diagram/table hierarchy, an explicit distinction between Readiness and Adoption, and real source links.
- **Country (leading and lagging):** The information architecture is comprehensive, but the dark terminal theme, small uppercase labels, dense cards, and persistent left rail feel like a separate application. The leading-country page is very long; the lagging-country page exposes weak/empty states more starkly. The score header, rank, trajectory, projected score, evidence, brief, news, and comparables need a clearer reading order. Mobile needs a real sidebar drawer and consistent touch targets.
- **Region pages:** The common deep-dive structure is useful, but charts and rankings inherit inconsistent page spacing and dark analytical panels. Regional context and links back to global views are not prominent enough.
- **Widget:** Compactness is appropriate, but typography, score treatment, source/date labeling, focus states, and colors should match the main system while remaining iframe-safe.

## Confirmed content and action issues

- World Bank, OECD, and World Governance Indicators references include placeholder or inconsistent links in the UI.
- Cite routes to the author rather than producing a citation.
- Share and Export provide no visible completion state.
- Edition, update time, live/fallback status, and cache wording are not governed by one component.
- The current design uses inconsistent region and pillar colors across views.

## Design direction

Use the homepage editorial research-publication language as the canonical system across every route. Keep Fraunces for display and Inter Tight for interface/body text, warm ivory surfaces, ink text, signal red for actions, tabular numerals, restrained borders, and the existing five pillar colors. Analytical charts may use a deep ink plotting surface when contrast benefits the data, but the page shell, cards, controls, navigation, spacing, and feedback states remain editorial and consistent.
