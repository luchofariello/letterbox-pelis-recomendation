# Letterboxd Pelis Recommendation

Extensión de Chrome (Manifest V3, JS plano, sin build). Recomienda pelis: fans de tus pelis → su top 4 → ranking.

## Cómo trabajar (ahorrar tokens)
- Respuestas cortas y directas.
- **No hacer pruebas en Chrome ni capturas** salvo que se pidan. Solo chequear sintaxis y dejar el cambio listo.
- No releer `app.js` entero: buscar con grep y leer solo el tramo necesario.
- No hacer commit ni push salvo que se pida.

## Archivos
- `manifest.json` · `background.js` (abre `app.html` al tocar el ícono) · `app.html` · `app.css` · `app.js` (todo) · `icons/` · `docs/screenshots/` · `README.md` (es) · `README.en.md`
- Chequeo de sintaxis (macOS, sin node): `jsc` en `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc` con `new Function(read("app.js"))`.

## Arquitectura de `app.js` (en orden)
1. `I18N` (es/en) + `t(key, ...args)`. Textos siempre en los dos idiomas.
2. Utilidades (`h()` crea DOM, `store` = chrome.storage.local, `loadJSON/saveJSON` = localStorage).
3. Consultas a Letterboxd: `lbFetch` (maneja 429 con pausa global de 60s), `fetchUsersPage`, `extractFilms`, `fetchUserFavorites`, `fetchFilmGrid`, `fetchFilmMeta` (JSON-LD), `fetchAvailability`.
4. Ranking: `computeCounts(ctx, plain)`, `fanWeightFor`, `getResults`, joyitas (`gemScore`).
5. UI: pestañas **Recomendaciones** (`recTab`) y **Elegir una peli ya** (`pickTab`), buscador reutilizable `mkFilmSearch`, balde de pochoclos, tele (zapping), historial, "¿Por qué?" (`buildWhy`, SVG).
6. `run(opts)`: el algoritmo (1 pelis de partida → 2 vistas → 3 fans por peli → 4 top 4 de cada fan). Lo usan las dos pestañas.

## Decisiones importantes
- **Contextos separados:** `R` (Recomendaciones) y `P` (Elegir una peli ya) guardan su propia búsqueda (`baseFilms, baseSlugs, watched, fanFilms, fanShared, fanBases, key`). Solo comparten la caché. Una sola búsqueda a la vez (`isRunning`).
- **Caché** (chrome.storage): `fav:<user>` 30d, `fans:<slug>` 7d (con `lastPage` para continuar), `lbmf_film_meta` 14d (localStorage), vistas 12h, disponibilidad 3d. `hist:<id>` + `history` (últimas 10).
- **Elegir una peli ya:** 100 personas por peli fijo, mínimo 2, streaming prendido por defecto, "cortito" ≤ 90 min, primera peli a los 40s o al terminar, ◀ Anterior / 🎲 Otra / 🚫 No me la muestres más.
- Lenguaje de UI: "personas con tu gusto", "votos", "gemelos de gusto" (no "fans/afines").
- Letterboxd no tiene API: se lee HTML. Cloudflare bloquea consultas fuera del navegador; el lector de "Where to watch" (`/csi/film/<slug>/availability/`) nunca se pudo verificar con HTML real.

## Pendiente / ideas
- Opción "⚖️ Balancear entre mis pelis": con muchos fans, una peli de nicho con comunidad unida domina el ranking.
- Confirmar el lector de streaming con HTML real de Letterboxd.
- Licencia: parte del código viene de *Letterboxd MassFollow* (@Miabeyefendi); su licencia no se pudo verificar.

## Repo
https://github.com/luchofariello/letterbox-pelis-recomendation
