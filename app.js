/**
 * Letterboxd Pelis Recommendation
 * https://github.com/luchofariello/letterbox-pelis-recomendation
 *
 * Extensión de Chrome que encuentra pelis que te van a gustar exprimiendo los datos públicos de Letterboxd:
 * tus 4 favoritas (o tus mejor puntuadas) → sus fans (quienes las tienen en su top 4)
 * → el top 4 de cada fan → ranking de las más repetidas que todavía no viste.
 *
 * Corre en su propia pestaña (app.html), así las búsquedas no se cortan mientras navegás Letterboxd.
 * Los helpers de scraping se basan originalmente en "Letterboxd MassFollow" de @Miabeyefendi.
 */
(function () {
    'use strict';

    const REPO_URL = 'https://github.com/luchofariello/letterbox-pelis-recomendation';
    const AUTHOR_URL = 'https://github.com/luchofariello';

    // ══════════════ i18n ══════════════
    const pl = (n, one, many) => (n === 1 ? one : many);
    const I18N = {
        es: {
            subtitle: 'Tu próxima peli favorita, sacada de los datos de Letterboxd',
            introTitle: '¿Qué vemos hoy?',
            introLead: '<b>Letterboxd Pelis Recommendation</b> exprime los datos públicos de Letterboxd para encontrar tu próxima peli favorita. La idea es simple: <b class="hl">si alguien ama las mismas pelis que tú, lo demás que ama probablemente también te va a gustar.</b>',
            introStep: 'PASO',
            introSteps: [
                ['⭐ Tus joyas', 'Partimos de tus 4 favoritas o de las pelis que puntuaste con 4½ y 5 estrellas.'],
                ['🕵️ Tus almas gemelas', 'Buscamos a sus fans: la gente que tiene esas pelis en su top 4.'],
                ['🎞️ Espiamos sus tops', 'Juntamos las 4 favoritas de cada fan (con todo respeto). Opcional: también hasta 15 de sus 5★ (valen medio voto) y 15 de sus 4½★ (un cuarto).'],
                ['🧩 Temáticas parecidas', 'Miramos las temáticas de tus pelis (la sección Genres de Letterboxd). Cuantas más comparta una candidata, más puntos suma.'],
                ['🏆 Tu ranking', 'Las que más se repiten y todavía no viste. Si un fan comparte varias de tus pelis, su voto pesa más. En "Elegir una peli ya" también cuentan las temáticas.']
            ],
            introNotes: '🔒 Todo corre en tu navegador: solo leemos páginas públicas de Letterboxd y los resultados se guardan en tu compu.<br>⏱ La primera búsqueda tarda unos minutos; las siguientes vuelan porque recordamos lo que ya revisamos.',
            introGo: '🎬 ¡Vamos!',
            introMini: '¿Cómo funciona?',
            searchTitle: '🔎 Tu búsqueda',
            userLabel: 'Tu usuario de Letterboxd', userPh: 'ej. luchofariello',
            sourceLabel: 'Partir de',
            srcFavs: '⭐ Mis 4 favoritas', srcFavsDesc: 'Las del top 4 de tu perfil',
            srcRated: '★ Mis mejor puntuadas', srcRatedDesc: 'Tus pelis con 4½ y 5 estrellas',
            maxBase: '¿Cuántas de tus pelis usamos?', maxBaseHint: 'Primero las de 5★, después las de 4½★.',
            fansLabel: '¿A cuánta gente le preguntamos?', fansAll: 'Toda la que haya',
            fansHint: 'Personas por cada peli tuya. Más gente = mejor ranking, pero tarda más.',
            fanExplain: '💡 En Letterboxd, un <b>fan</b> de una peli es alguien que la tiene en su top 4 de favoritas.',
            fansAllHint: '⚠️ Toda la que haya: una peli popular puede tener decenas de miles de fans y tardar horas. Puedes detenerla cuando quieras y ver lo que lleva.',
            advanced: '⚙️ Más opciones',
            manualLabel: 'Tus pelis de partida, a mano',
            manualHint: 'Opcional: una por línea (URL o nombre de la URL). Si escribes algo acá, reemplaza lo automático.',
            threadsLabel: 'Velocidad',
            threadsHint: 'Más rápido = más riesgo de que Letterboxd te frene un rato.',
            speeds: ['🐢 Tranqui', '🚶 Normal', '🏃 Rápido', '🚀 A fondo'],
            optFives: '⭐ Sumar también sus 5★ y 4½★', optFivesDesc: 'Además de su top 4, cuenta hasta 15 pelis con 5★ (valen la mitad de voto) y 15 con 4½★ (un cuarto). Tarda más: dos consultas extra por persona.',
            noCache: '🔄 No usar caché',
            noCacheDesc: 'Vuelve a consultar todo (fans, sus favoritas y tus vistas). Más lento, con datos frescos.',
            start: '🔎 Buscar recomendaciones', stop: '⏹ Detener', stopAll: '⏹ Detener del todo',
            popBase: 'Chusmeando tus pelis…', popWatched: 'Revisando qué pelis ya viste…',
            popFans: 'Rastreando a la banda que banca tus pelis…', popFavs: 'Chusmeando el top 4 de cada fan…',
            popDone: '🎬 ¡Balde lleno, papá! Que arranque la función.',
            popStopped: '⏸ Cortaste la función: te quedaste con medio balde.',
            popError: '🔥 Se nos quemaron los pochoclos, qué garrón…',
            history: '🕘 Historial de búsquedas',
            histEmpty: 'Todavía no hay búsquedas guardadas. Cada búsqueda queda acá para volver a verla al instante.',
            histView: '📂 Ver', histViewing: '👁 Viendo', histDel: 'Borrar del historial', histPartial: '⏸ parcial',
            histSrc: { favs: '⭐ Favoritas', rated: '★ Mejor puntuadas', manual: '✍️ A mano', list: '📃 Lista' },
            histMeta: (fans, films) => `${fans} personas · ${films} pelis`,
            resultsTitle: '🍿 Recomendaciones',
            count: n => `${n} ${pl(n, 'película', 'películas')}`,
            export: 'Exportar',
            adjust: 'Ajustar resultados', adjustHint: 'se aplica al instante, sin volver a buscar',
            optMinFans: '👥 Que la recomienden al menos…', optMinFansDesc: n => `${n} ${pl(n, 'persona', 'personas')} con tu gusto`,
            optThemes: '🧩 Sumar por temáticas parecidas', optThemesDesc: 'Suma puntos a las pelis que comparten temáticas (la sección Genres de Letterboxd) con las tuyas y agrega, al final, las mejor puntuadas de tus temáticas principales.', themeMatch: (n, w) => `🧩 ${[n ? `${n} ${pl(n, 'temática', 'temáticas')}` : '', w ? `${w} ${pl(w, 'subtemática', 'subtemáticas')}` : ''].filter(Boolean).join(' + ')} en común`,
            kindtheme: 'Temática', 'kindmini-theme': 'Mini-tema', kindnanogenre: 'Nanogénero', kindword: 'Subtemática', whyMatchTitle: '🧩 En común con tus pelis',
            whyThemes: (m, n, w) => `${m} (${[n ? `${n} ${pl(n, 'temática', 'temáticas')}` : '', w ? `${w} ${pl(w, 'subtemática', 'subtemáticas')}` : ''].filter(Boolean).join(' + ')} en común)`,
            stThemes: '🧩 Buscando las mejores pelis de tus temáticas…', lgThemeList: (n, c) => `🧩 Temática ${n}: ${c} pelis`, themeOnly: '🧩 por temática', themeOnlyTitle: 'No la recomienda ningún fan: sale de las mejor puntuadas de las temáticas de tus pelis.',
            resTabFans: n => `👥 Por fans (${n})`, resTabThemes: n => `🧩 Solo por temática (${n})`,
            emptyThemes: 'No hay pelis que lleguen solo por temática. Prende "🧩 Sumar por temáticas parecidas" o revisa el log: Letterboxd pudo bloquear esas listas.',
            themesTabHint: 'Ningún fan las tiene en sus favoritas: salen de las mejor puntuadas de las temáticas de tus pelis, ordenadas por cuántas temáticas comparten con las tuyas.',
            whyRowtop: n => `${n} ${pl(n, 'persona la tiene', 'personas la tienen')} en su top 4`,
            whyRowfive: n => `${n} ${pl(n, 'persona la puntuó', 'personas la puntuaron')} con 5★ (sin tenerla en su top 4)`,
            whyRowhalf: n => `${n} ${pl(n, 'persona la puntuó', 'personas la puntuaron')} con 4½★ (sin tenerla en su top 4)`,
            whyShared: (n, s) => `y ${pl(n, 'comparte', 'comparten')} ${s} de tus pelis con vos`,
            whyThemeLists: n => `🧩 Sale entre las mejores de ${n} ${pl(n, 'temática', 'temáticas')} de tus pelis`,
            minFansAuto: n => ` · valor sugerido: ${n}`,
            optGems: '💎 Priorizar joyitas', optGemsDesc: 'Menos clásicos obvios, más descubrimientos.',
            optWatched: '👁 Incluir las que ya vi', optWatchedDesc: 'Aparecen marcadas como vistas.',
            optAff: '🎯 Más peso a tus gemelos de gusto', optAffDesc: 'Si alguien comparte 2 o más de tus pelis, su voto vale más.',
            affMin: 'Comparten al menos', affMinSuffix: 'de tus pelis', affBoost: 'Su voto vale x5', affOnly: 'Escuchar solo a ellos',
            affSummary: (a, b, c) => `Gente que comparte 2 de tus pelis: ${a} · 3: ${b} · 4 o más: ${c}`,
            affPending: 'El resumen aparece al terminar la búsqueda.',
            emptyStart: 'Pulsa "Buscar recomendaciones" para empezar.',
            emptyNone: 'Ninguna peli llega al mínimo de personas. Prueba bajarlo o preguntarle a más gente.',
            gemsPending: (done, total) => `💎 Midiendo qué tan famosa es cada candidata: ${done} de ${total}. Las que ya tienen su dato aparecen en el ranking, que se va reordenando solo.`,
            rating: r => `★ ${r} en Letterboxd`, noRating: '★ sin promedio', votesTitle: n => `${n} calificaciones`,
            fansCommon: (n, aff) => `👥 La ${pl(n, 'ama', 'aman')} ${n} ${pl(n, 'persona', 'personas')} con tu gusto${aff ? ` · 🎯 ${aff} ${pl(aff, 'gemelo', 'gemelos')}` : ''}`,
            score: s => `🏆 ${s} ${pl(s, 'voto', 'votos')}`, gemScore: s => `💎 ${s} pts joyita`, rawScore: s => `Votos sin corregir: ${s}`,
            votes: v => `🌍 ${v} calificaciones`, seen: '👁 ya la viste',
            why: '💡 ¿Por qué?', whyClose: '💡 Cerrar', hide: 'Ocultar esta película para siempre',
            whySummary: (n, film, tops, aff) => `<b class="g">${n} ${pl(n, 'persona', 'personas')}</b> que aman tus pelis tienen <b>${film}</b> en su top 4` +
                (tops ? `: sobre todo fans de ${tops}.` : '.') +
                (aff ? ` <span class="v">🎯 ${aff} ${pl(aff, 'es tu gemelo', 'son tus gemelos')} de gusto: comparten varias de tus pelis y su voto pesa más.</span>` : ''),
            and: ' y ', fanWord: n => pl(n, 'persona', 'personas'), voteWord: n => pl(n, 'voto', 'votos'), yourFilms: 'TUS PELIS', recommended: 'recomendada', moreFilms: n => `+${n} pelis más`,
            whyScore: 'Votos:', whyGem: v => `→ corregido por popularidad (${v} calificaciones en Letterboxd) →`,
            whyHintAff: 'Cada persona suma 1 voto por cada peli tuya que tiene en su top 4; tus gemelos de gusto (🎯) suman más.',
            whyHint: 'Cada persona suma 1 voto por cada peli tuya que tiene en su top 4: quien comparte más pelis contigo, pesa más.',
            whoVoted: n => `Quiénes la votaron (${n})`, moreN: n => `y ${n} más`, fanOf: 'Fan de', inCommon: n => `${n} en común`,
            log: '📜 Log',
            needUser: 'Primero escribe tu usuario de Letterboxd.', busy: 'Espera a que termine la búsqueda actual (o detenla).', histMissing: 'No encontré los datos de esa búsqueda.',
            errNoRated: 'No encontré pelis puntuadas con 4½ o 5★. Revisa tu usuario o escríbelas a mano en "Más opciones".',
            errNoFavs: 'No encontré tus favoritas en tu perfil. Escríbelas a mano en "Más opciones".',
            errNoFans: 'No encontré fans para esas películas.', errStopped: 'Detenido',
            stReadingRated: (r, p) => `★ Leyendo tus pelis de ${r} (páginas ${p})…`, stReadingFavs: '⭐ Leyendo tus 4 favoritas…',
            stWatched: p => `👁 Cargando tus pelis vistas (páginas ${p})…`,
            stFans: (d, tot) => `👥 Buscando gente con tu gusto: ${d}/${tot} pelis`,
            stFansAll: (name, n, p) => `👥 ${name}: ${n} fans leídos (página ${p})…`,
            stFavs: (d, tot) => `🎞 Leyendo el top 4 de cada persona: ${d}/${tot}`,
            stDone: n => `✅ Listo: ${n} recomendaciones`, stPartial: '⏹ Detenido (resultados parciales)',
            stHistory: d => `📂 Mostrando la búsqueda del ${d}: los ajustes se aplican al instante, sin consultar nada.`,
            lgBlocked: (st, path, n) => `⛔ HTTP ${st} en ${path} — ${st === 403 ? 'Letterboxd bloqueó la consulta (posible protección antibots).' : 'error del servidor de Letterboxd.'} (${n} en total)`,
            lg429: '⚠️ Letterboxd pidió ir más despacio (429). Pausa de 60s para todos los hilos…',
            lgPage: (url, st) => `❌ ${url} → HTTP ${st}`,
            lgNoCache: '🔄 Sin caché: se consulta todo de nuevo', lgManual: n => `✍️ Usando ${n} pelis escritas a mano`,
            lgRated: (n, r) => `⭐ ${n} pelis con ${r}`, lgTrim: (m, tot) => `✂️ Uso las primeras ${m} de ${tot}`,
            lgBase: (n, names) => `🎬 Pelis de partida (${n}): ${names}`, lgWatched: n => `👁 ${n} pelis vistas`,
            lgResume: (name, n, p) => `♻️ ${name}: ${n} fans guardados, sigo desde la página ${p}`,
            lgFansOf: (name, n) => `👥 ${name}: ${n} personas`,
            lgFansTotal: (n, c) => `👥 ${n} personas distintas${c ? ` (${c} pelis salieron de la caché)` : ''}`,
            lgSkip: '⏭ Dejo de juntar fans y sigo con los que ya tengo',
            lgDone: (d, f, films) => `✅ ${d} personas revisadas${f ? `, ${f} fallaron` : ''} · ${films} pelis distintas`,
            exHeader: 'Recomendaciones', exBase: 'Pelis de partida', exDate: 'Fecha',
            exLine: (i, name, fans, score, gem, url) => `${i}. ${name} — la aman ${fans} personas con tu gusto (${score} votos${gem != null ? `, ${gem} pts joyita` : ''}) — ${url}`,
            lgFansPage: (name, p, got, have, max) => `   ${name} · página ${p}: +${got} → ${have}${max === Infinity ? '' : `/${max}`} personas`,
            lgPages: (what, p) => `   ${what}: páginas ${p}`,
            lgHb: (what, n) => `⏳ Sigo trabajando: ${what} (${n} ${pl(n, 'consulta', 'consultas')} en curso)`,
            lgHbWait: s => `⏳ Letterboxd nos pidió frenar: reanudo en ${s}s…`,
            lgFavsProgress: (d, tot, rate, eta, cached) => `🎞 ${d}/${tot} tops leídos · ${rate}/s · faltan ~${eta}${cached ? ` · ${cached} salieron de la caché` : ''}`,
            lgMeta: (d, left) => `💎 Datos de pelis: ${d} listos, ${left} en cola`,
            wWatched: 'Tus vistas', wRated: r => `Tus pelis de ${r}`,
            eta: s => s < 60 ? `${Math.max(1, Math.round(s))}s` : `${Math.round(s / 60)} min`,
            histBtn: n => `🕘 Historial (${n})`,
            pickTitle: '📺 Elegir una peli ya', pickSub: 'Te elijo una peli con todo el algoritmo.', kindAny: '🎲 Sorprendeme', kindAnyD: 'Lo que más votos tenga', kindGem: '💎 Una joyita', kindGemD: 'Poco conocida', kindClassic: '🏛 Un clásico', kindClassicD: 'Muy votada y bien puntuada',
            pickStream: '📺 Que esté en streaming', pickStreamD: 'En tu país, según lo que muestra Letterboxd.',
            pickShort: '⏱ Algo cortito', pickShortD: 'Hasta una hora y media (90 min).',
            pickBtn: '🎬 ¡Dame una peli!', pickAgain: '🎲 Otra', pickNope: '🚫 No me la muestres más', pickBack: '◀ Anterior', pickOpen: 'Abrir en Letterboxd ↗',
            pickLook: '👉 Mirá esta', pickMeta: (d, tot) => `🎞 Mirando las candidatas: ${d}/${tot}`,
            pickChecking: name => `📺 ¿Dónde se puede ver ${name}?`, pickNone: 'No encontré ninguna que cumpla todo. Prueba sacando algún filtro.',
            pickWhere: '📺 Dónde verla', pickWhereNone: 'No encontré dónde se puede ver en tu país.', pickWhereUnknown: 'No pude leer dónde está disponible:',
            pickWhereLink: 'mirar en Letterboxd', pickRent: 'alquiler/compra', pickRuntime: n => `⏱ ${n} min`,
            lgPickParse: '⚠️ No pude leer las plataformas de streaming (quizás Letterboxd cambió su página). Elijo igual, sin ese filtro.',
            lgPickSkip: (name, why) => `   ✕ ${name}: ${why}`, pickNotStreaming: 'no está en streaming',
            lgPick: (name, n) => `🎬 Elegí ${name} (entre ${n} candidatas)`,
            estLine: (dur, people, cached, speed) => `⏱ Esta búsqueda puede tardar <b>~${dur}</b>: unas ${people} personas${cached ? `, de las cuales ${cached} ya están guardadas` : ', sin nada guardado todavía'} · velocidad ${speed}.`,
            estFaster: dur => `Con 🚀 A fondo: ~${dur}.`,
            estAll: '⏱ Con "Toda la que haya" puede tardar horas: depende de cuántos fans tenga cada peli. Puedes detenerla cuando quieras.',
            durSec: n => `${n} s`, durMin: n => `${n} min`, durHours: n => `${n} h`,
            tabRec: '🍿 Recomendaciones', tabPick: '📺 Elegir una peli ya', estInstant: 'al toque',
            pickNeedFilms: 'Pega al menos una URL de una peli de Letterboxd (letterboxd.com/film/…) o de una lista.',
            stReadingList: p => `📃 Leyendo la lista (páginas ${p})…`, wList: 'La lista',
            errNoList: 'No encontré pelis en esa lista. ¿Es pública y la URL está bien?',
            errNoRatedOf: who => `No encontré pelis con 4½ o 5★ en el perfil de ${who}.`,
            errNoFavsOf: who => `No encontré favoritas en el perfil de ${who}. ¿El usuario está bien?`,
            pickWant: '¿Qué querés?', pickSearchLabel: 'Pelis que te gustan', pickSearchPh: 'Busca una peli… (ej. Aftersun)',
            pickSearchHint: 'Elige de 1 a 10 pelis. También puedes pegar una URL de Letterboxd.', pickSearchingFilms: 'Buscando en Letterboxd…',
            pickNoResults: 'No encontré pelis con ese nombre.', pickMax: n => `Máximo ${n} pelis.`,
            pickPicking: 'Eligiendo peli…', pickStillWorking: 'Sigo procesando atrás para que «Otra» sea todavía mejor…',
            pickTipUser: 'Tip: si escribes tu usuario en la pestaña Recomendaciones, no te recomiendo pelis que ya viste.',
            pickNeedFilms: 'Busca y elige al menos una peli que te guste.',
            srcFilms: '🎬 No tengo perfil', srcFilmsD: 'Elige hasta 5 pelis',
            recFilmsLabel: 'Pelis que te gustan', recFilmsHint: 'Busca y elige de 1 a 5 pelis. También puedes pegar una URL de Letterboxd.',
            recNeedFilms: 'Busca y elige al menos una peli que te guste.',
            dateLocale: 'es-AR'
        },
        en: {
            subtitle: 'Your next favorite film, squeezed out of Letterboxd data',
            introTitle: 'What are we watching tonight?',
            introLead: '<b>Letterboxd Pelis Recommendation</b> squeezes public Letterboxd data to find your next favorite film. The idea is simple: <b class="hl">if someone loves the same films you do, whatever else they love will probably click with you too.</b>',
            introStep: 'STEP',
            introSteps: [
                ['⭐ Your gems', 'We start from your 4 favorites or the films you rated 4½ and 5 stars.'],
                ['🕵️ Your soulmates', 'We find their fans: people who have those films in their top 4.'],
                ['🎞️ We peek at their tops', "We gather every fan's 4 favorites (respectfully). Optional: also up to 15 of their 5★ (half a vote) and 15 of their 4½★ (a quarter)."],
                ['🧩 Similar themes', "We look at your films' themes (Letterboxd's Genres section). The more a candidate shares, the more points it gets."],
                ['🏆 Your ranking', "The most repeated ones you haven't seen yet. Fans who share several of your films get a bigger vote. \"Pick a film now\" also counts themes."]
            ],
            introNotes: '🔒 Everything runs in your browser: we only read public Letterboxd pages and results are stored on your computer.<br>⏱ The first search takes a few minutes; the next ones fly because we remember what we already checked.',
            introGo: "🎬 Let's go!",
            introMini: 'How does it work?',
            searchTitle: '🔎 Your search',
            userLabel: 'Your Letterboxd username', userPh: 'e.g. luchofariello',
            sourceLabel: 'Start from',
            srcFavs: '⭐ My 4 favorites', srcFavsDesc: 'The top 4 on your profile',
            srcRated: '★ My top rated', srcRatedDesc: 'Your films rated 4½ and 5 stars',
            maxBase: 'How many of your films do we use?', maxBaseHint: '5★ first, then 4½★.',
            fansLabel: 'How many people do we ask?', fansAll: 'Everyone there is',
            fansHint: 'People per film of yours. More people = a better ranking, but slower.',
            fanExplain: '💡 On Letterboxd, a <b>fan</b> of a film is someone who has it in their top 4 favorites.',
            fansAllHint: '⚠️ Everyone: a popular film can have tens of thousands of fans and take hours. You can stop anytime and see what you have so far.',
            advanced: '⚙️ More options',
            manualLabel: 'Your starting films, by hand',
            manualHint: 'Optional: one per line (URL or URL slug). If you type anything here, it overrides the automatic ones.',
            threadsLabel: 'Speed',
            threadsHint: 'Faster = a higher chance Letterboxd slows you down for a while.',
            speeds: ['🐢 Chill', '🚶 Normal', '🏃 Fast', '🚀 Full throttle'],
            optFives: '⭐ Also count their 5★ and 4½★ films', optFivesDesc: "On top of their top 4, counts up to 15 films rated 5★ (half a vote) and 15 rated 4½★ (a quarter). Slower: two extra requests per person.",
            noCache: "🔄 Don't use cache",
            noCacheDesc: 'Fetches everything again (fans, their favorites and your watched films). Slower, but fresh.',
            start: '🔎 Find recommendations', stop: '⏹ Stop', stopAll: '⏹ Stop completely',
            popBase: 'Sneaking a peek at your films…', popWatched: "Checking what you've already watched…",
            popFans: 'Tracking down the crew that loves your films…', popFavs: "Peeking at every fan's top 4…",
            popDone: "🎬 Bucket's full! Let the show begin.",
            popStopped: '⏸ You cut the show short: half a bucket left.',
            popError: '🔥 We burned the popcorn… bummer.',
            history: '🕘 Search history',
            histEmpty: 'No saved searches yet. Every search lands here so you can reopen it instantly.',
            histView: '📂 View', histViewing: '👁 Viewing', histDel: 'Delete from history', histPartial: '⏸ partial',
            histSrc: { favs: '⭐ Favorites', rated: '★ Top rated', manual: '✍️ By hand', list: '📃 List' },
            histMeta: (fans, films) => `${fans} people · ${films} films`,
            resultsTitle: '🍿 Recommendations',
            count: n => `${n} ${pl(n, 'film', 'films')}`,
            export: 'Export',
            adjust: 'Tune results', adjustHint: 'applies instantly, no new search',
            optMinFans: '👥 Recommended by at least…', optMinFansDesc: n => `${n} ${pl(n, 'person', 'people')} with your taste`,
            optThemes: '🧩 Boost similar themes', optThemesDesc: "Adds points to films sharing themes (Letterboxd's Genres section) with yours and adds, at the end, the top rated films of your main themes.", themeMatch: (n, w) => `🧩 ${[n ? `${n} ${pl(n, 'theme', 'themes')}` : '', w ? `${w} ${pl(w, 'subtheme', 'subthemes')}` : ''].filter(Boolean).join(' + ')} shared`,
            kindtheme: 'Theme', 'kindmini-theme': 'Mini-theme', kindnanogenre: 'Nanogenre', kindword: 'Subtheme', whyMatchTitle: '🧩 In common with your films',
            whyThemes: (m, n, w) => `${m} (${[n ? `${n} ${pl(n, 'theme', 'themes')}` : '', w ? `${w} ${pl(w, 'subtheme', 'subthemes')}` : ''].filter(Boolean).join(' + ')} shared)`,
            stThemes: '🧩 Finding the best films of your themes…', lgThemeList: (n, c) => `🧩 Theme ${n}: ${c} films`, themeOnly: '🧩 by theme', themeOnlyTitle: 'No fan recommends it: it comes from the top rated films of your films\' themes.',
            resTabFans: n => `👥 By fans (${n})`, resTabThemes: n => `🧩 Theme only (${n})`,
            emptyThemes: 'No films reached only by theme. Turn on "🧩 Boost similar themes" or check the log: Letterboxd may have blocked those lists.',
            themesTabHint: "No fan has them among their favorites: they come from the top rated films of your films' themes, ordered by how many themes they share with yours.",
            whyRowtop: n => `${n} ${pl(n, 'person has it', 'people have it')} in their top 4`,
            whyRowfive: n => `${n} ${pl(n, 'person rated it', 'people rated it')} 5★ (without it in their top 4)`,
            whyRowhalf: n => `${n} ${pl(n, 'person rated it', 'people rated it')} 4½★ (without it in their top 4)`,
            whyShared: (n, s) => `and ${pl(n, 'shares', 'share')} ${s} of your films with you`,
            whyThemeLists: n => `🧩 Among the best of ${n} ${pl(n, 'theme', 'themes')} of your films`,
            minFansAuto: n => ` · suggested value: ${n}`,
            optGems: '💎 Prioritize hidden gems', optGemsDesc: 'Fewer obvious classics, more discoveries.',
            optWatched: "👁 Include films I've seen", optWatchedDesc: 'They show up tagged as seen.',
            optAff: '🎯 More weight to your taste twins', optAffDesc: 'If someone shares 2+ of your films, their vote counts more.',
            affMin: 'They share at least', affMinSuffix: 'of your films', affBoost: 'Their vote counts x5', affOnly: 'Only listen to them',
            affSummary: (a, b, c) => `People sharing 2 of your films: ${a} · 3: ${b} · 4 or more: ${c}`,
            affPending: 'The summary shows up when the search is done.',
            emptyStart: 'Hit "Find recommendations" to start.',
            emptyNone: 'No film reaches the minimum number of people. Try lowering it or asking more people.',
            gemsPending: (done, total) => `💎 Measuring how famous each candidate is: ${done} of ${total}. The ones with data are already ranked, and the list keeps reordering itself.`,
            rating: r => `★ ${r} on Letterboxd`, noRating: '★ no average', votesTitle: n => `${n} ratings`,
            fansCommon: (n, aff) => `👥 Loved by ${n} ${pl(n, 'person', 'people')} with your taste${aff ? ` · 🎯 ${aff} ${pl(aff, 'twin', 'twins')}` : ''}`,
            score: s => `🏆 ${s} ${pl(s, 'vote', 'votes')}`, gemScore: s => `💎 ${s} gem pts`, rawScore: s => `Unadjusted votes: ${s}`,
            votes: v => `🌍 ${v} ratings`, seen: '👁 already seen',
            why: '💡 Why?', whyClose: '💡 Close', hide: 'Hide this film forever',
            whySummary: (n, film, tops, aff) => `<b class="g">${n} ${pl(n, 'person', 'people')}</b> who love your films have <b>${film}</b> in their top 4` +
                (tops ? `: mostly fans of ${tops}.` : '.') +
                (aff ? ` <span class="v">🎯 ${aff} ${pl(aff, 'is your taste twin', 'are your taste twins')}: they share several of your films, so their vote counts more.</span>` : ''),
            and: ' and ', fanWord: n => pl(n, 'person', 'people'), voteWord: n => pl(n, 'vote', 'votes'), yourFilms: 'YOUR FILMS', recommended: 'recommended', moreFilms: n => `+${n} more films`,
            whyScore: 'Votes:', whyGem: v => `→ adjusted for popularity (${v} ratings on Letterboxd) →`,
            whyHintAff: 'Each person adds 1 vote per film of yours in their top 4; your taste twins (🎯) add more.',
            whyHint: 'Each person adds 1 vote per film of yours in their top 4: the more films they share with you, the more they count.',
            whoVoted: n => `Who voted for it (${n})`, moreN: n => `and ${n} more`, fanOf: 'Fan of', inCommon: n => `${n} shared`,
            log: '📜 Log',
            needUser: 'Type your Letterboxd username first.', busy: 'Wait for the current search to finish (or stop it).', histMissing: "Couldn't find that search's data.",
            errNoRated: 'No films rated 4½ or 5★ found. Check your username or type them in "More options".',
            errNoFavs: 'No favorites found on your profile. Type them in "More options".',
            errNoFans: 'No fans found for those films.', errStopped: 'Stopped',
            stReadingRated: (r, p) => `★ Reading your ${r} films (pages ${p})…`, stReadingFavs: '⭐ Reading your 4 favorites…',
            stWatched: p => `👁 Loading your watched films (pages ${p})…`,
            stFans: (d, tot) => `👥 Finding people with your taste: ${d}/${tot} films`,
            stFansAll: (name, n, p) => `👥 ${name}: ${n} fans read (page ${p})…`,
            stFavs: (d, tot) => `🎞 Reading each person's top 4: ${d}/${tot}`,
            stDone: n => `✅ Done: ${n} recommendations`, stPartial: '⏹ Stopped (partial results)',
            stHistory: d => `📂 Showing the search from ${d}: tweaks apply instantly, no requests.`,
            lgBlocked: (st, path, n) => `⛔ HTTP ${st} on ${path} — ${st === 403 ? 'Letterboxd blocked the request (possible anti-bot protection).' : 'Letterboxd server error.'} (${n} total)`,
            lg429: '⚠️ Letterboxd asked to slow down (429). 60s pause for all threads…',
            lgPage: (url, st) => `❌ ${url} → HTTP ${st}`,
            lgNoCache: '🔄 No cache: fetching everything again', lgManual: n => `✍️ Using ${n} films typed by hand`,
            lgRated: (n, r) => `⭐ ${n} films rated ${r}`, lgTrim: (m, tot) => `✂️ Using the first ${m} of ${tot}`,
            lgBase: (n, names) => `🎬 Starting films (${n}): ${names}`, lgWatched: n => `👁 ${n} watched films`,
            lgResume: (name, n, p) => `♻️ ${name}: ${n} fans saved, resuming from page ${p}`,
            lgFansOf: (name, n) => `👥 ${name}: ${n} people`,
            lgFansTotal: (n, c) => `👥 ${n} distinct people${c ? ` (${c} films came from cache)` : ''}`,
            lgSkip: '⏭ Stopped collecting fans, moving on with the ones I have',
            lgDone: (d, f, films) => `✅ ${d} people checked${f ? `, ${f} failed` : ''} · ${films} distinct films`,
            exHeader: 'Recommendations', exBase: 'Starting films', exDate: 'Date',
            exLine: (i, name, fans, score, gem, url) => `${i}. ${name} — loved by ${fans} people with your taste (${score} votes${gem != null ? `, ${gem} gem pts` : ''}) — ${url}`,
            lgFansPage: (name, p, got, have, max) => `   ${name} · page ${p}: +${got} → ${have}${max === Infinity ? '' : `/${max}`} people`,
            lgPages: (what, p) => `   ${what}: pages ${p}`,
            lgHb: (what, n) => `⏳ Still working: ${what} (${n} ${pl(n, 'request', 'requests')} in flight)`,
            lgHbWait: s => `⏳ Letterboxd asked us to slow down: resuming in ${s}s…`,
            lgFavsProgress: (d, tot, rate, eta, cached) => `🎞 ${d}/${tot} tops read · ${rate}/s · ~${eta} left${cached ? ` · ${cached} from cache` : ''}`,
            lgMeta: (d, left) => `💎 Film data: ${d} ready, ${left} queued`,
            wWatched: 'Your watched films', wRated: r => `Your ${r} films`,
            eta: s => s < 60 ? `${Math.max(1, Math.round(s))}s` : `${Math.round(s / 60)} min`,
            histBtn: n => `🕘 History (${n})`,
            pickTitle: '📺 Pick a film now', pickSub: "I'll pick a film for you using the whole algorithm.", kindAny: '🎲 Surprise me', kindAnyD: 'The most voted one', kindGem: '💎 A hidden gem', kindGemD: 'Little known', kindClassic: '🏛 A classic', kindClassicD: 'Widely rated and loved',
            pickStream: '📺 Available to stream', pickStreamD: 'In your country, based on what Letterboxd shows.',
            pickShort: '⏱ Something short', pickShortD: 'Up to an hour and a half (90 min).',
            pickBtn: '🎬 Give me a film!', pickAgain: '🎲 Another', pickNope: "🚫 Don't show it again", pickBack: '◀ Previous', pickOpen: 'Open on Letterboxd ↗',
            pickLook: '👉 Watch this one', pickMeta: (d, tot) => `🎞 Checking candidates: ${d}/${tot}`,
            pickChecking: name => `📺 Where can I watch ${name}?`, pickNone: 'No film matches everything. Try removing a filter.',
            pickWhere: '📺 Where to watch', pickWhereNone: "Couldn't find it streaming in your country.", pickWhereUnknown: "Couldn't read where it's available:",
            pickWhereLink: 'check on Letterboxd', pickRent: 'rent/buy', pickRuntime: n => `⏱ ${n} min`,
            lgPickParse: "⚠️ Couldn't read streaming services (Letterboxd may have changed its page). Picking anyway, without that filter.",
            lgPickSkip: (name, why) => `   ✕ ${name}: ${why}`, pickNotStreaming: 'not streaming',
            lgPick: (name, n) => `🎬 Picked ${name} (out of ${n} candidates)`,
            estLine: (dur, people, cached, speed) => `⏱ This search may take <b>~${dur}</b>: about ${people} people${cached ? `, ${cached} of them already saved` : ', nothing saved yet'} · speed ${speed}.`,
            estFaster: dur => `With 🚀 Full throttle: ~${dur}.`,
            estAll: '⏱ With "Everyone there is" it can take hours: it depends on how many fans each film has. You can stop anytime.',
            durSec: n => `${n}s`, durMin: n => `${n} min`, durHours: n => `${n} h`,
            tabRec: '🍿 Recommendations', tabPick: '📺 Pick a film now', estInstant: 'instant',
            pickNeedFilms: 'Paste at least one Letterboxd film URL (letterboxd.com/film/…) or a list URL.',
            stReadingList: p => `📃 Reading the list (pages ${p})…`, wList: 'The list',
            errNoList: "No films found in that list. Is it public and is the URL right?",
            errNoRatedOf: who => `No films rated 4½ or 5★ found on ${who}'s profile.`,
            errNoFavsOf: who => `No favorites found on ${who}'s profile. Is the username right?`,
            pickWant: 'What do you want?', pickSearchLabel: 'Films you love', pickSearchPh: 'Search a film… (e.g. Aftersun)',
            pickSearchHint: 'Pick 1 to 10 films. You can also paste a Letterboxd URL.', pickSearchingFilms: 'Searching Letterboxd…',
            pickNoResults: 'No films found with that name.', pickMax: n => `${n} films max.`,
            pickPicking: 'Picking a film…', pickStillWorking: 'Still crunching in the background so «Another» gets even better…',
            pickTipUser: "Tip: if you type your username in the Recommendations tab, I won't recommend films you've already seen.",
            pickNeedFilms: 'Search and pick at least one film you love.',
            srcFilms: "🎬 I don't have a profile", srcFilmsD: 'Pick up to 5 films',
            recFilmsLabel: 'Films you love', recFilmsHint: 'Search and pick 1 to 5 films. You can also paste a Letterboxd URL.',
            recNeedFilms: 'Search and pick at least one film you love.',
            dateLocale: 'en-US'
        }
    };
    const lang = localStorage.getItem('lbpr_lang') || (navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en');
    const t = (k, ...args) => { const v = I18N[lang][k] ?? I18N.es[k]; return typeof v === 'function' ? v(...args) : v; };
    document.documentElement.lang = lang;

    // ══════════════ Utilidades ══════════════
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const randomDelay = (min, max) => sleep((Math.random() * (max - min) + min) * 1000);
    const loadJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
    const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const cut = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
    const fmtNum = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.0', '') + 'K' : String(n);
    const fmtDate = ts => new Date(ts).toLocaleString(t('dateLocale'), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    // "the-thing-1982" → "The Thing (1982)"
    const slugName = slug => slug.replace(/-(\d{4})$/, ' ($1)').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Crea un elemento: h('div.card', {onclick}, [hijos])
    function h(tag, props, children) {
        const [name, ...classes] = tag.split('.');
        const el = document.createElement(name || 'div');
        if (classes.length) el.className = classes.join(' ');
        for (const [k, v] of Object.entries(props || {})) {
            if (k === 'html') el.innerHTML = v;
            else if (k === 'text') el.textContent = v;
            else if (k === 'style') el.style.cssText = v;
            else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
            else if (v != null && v !== false) el.setAttribute(k, v === true ? '' : v);
        }
        (Array.isArray(children) ? children : children != null ? [children] : []).forEach(c => el.append(c));
        return el;
    }

    // chrome.storage.local (con unlimitedStorage): para lo que crece mucho (favoritas de fans, listas de fans, historial)
    const store = {
        get: async k => (await chrome.storage.local.get(k))[k],
        set: (k, v) => chrome.storage.local.set({ [k]: v }),
        remove: k => chrome.storage.local.remove(k)
    };

    const FAV_TTL = 30 * 24 * 3600 * 1000;       // top 4 de otros usuarios: 30 días
    const FANS_TTL = 7 * 24 * 3600 * 1000;       // listas de fans de cada película: 7 días
    const WATCHED_TTL = 12 * 3600 * 1000;        // tus películas vistas: 12 horas
    const FILM_META_TTL = 14 * 24 * 3600 * 1000; // portada, promedio y votos de cada película: 14 días
    const HISTORY_MAX = 10;
    const FIVES_MAX = 15;      // de cada fan, cuántas de sus pelis con 5★ y con 4½★ se suman
    const FIVE_WEIGHT = 0.5, HALF_WEIGHT = 0.25;  // una 5★ vale medio voto y una 4½★ un cuarto; una de su top 4 vale 1

    // ══════════════ Estado ══════════════
    let isRunning = false, isPicking = false, stopReq = false, phase = '', skipFans = false;
    // Cada pestaña tiene su propia búsqueda cargada, así no se pisan (lo único compartido es la caché)
    const newCtx = () => ({
        baseFilms: [],        // [[slug, name]] pelis de partida
        baseSlugs: new Set(),
        watched: new Set(),   // tus pelis vistas
        fanFilms: new Map(),  // persona -> [[slug, name]] (su top 4)
        fanFives: new Map(),  // persona -> [[slug, name]] (algunas de sus 5★, pesan menos)
        fanHalves: new Map(), // persona -> [[slug, name]] (algunas de sus 4½★, pesan menos todavía)
        themeFilms: new Map(),// slug -> { name, n }: pelis de las mejores de cada temática de tus pelis (n = en cuántas listas salió)
        fanShared: new Map(), // persona -> cuántas pelis de partida comparte
        fanBases: new Map(),  // persona -> Set de pelis de partida de las que es fan
        key: null             // qué búsqueda está cargada (para no repetirla)
    });
    const R = newCtx(); // 🍿 Recomendaciones
    const P = newCtx(); // 📺 Elegir una peli ya
    let history = [], historyCurrent = null;
    let gemsPending = [], gemsTotal = 0;
    const favCache = {};           // memoria rápida del top 4 de cada fan (lo persistente está en store 'fav:<usuario>')
    const filmMeta = loadJSON('lbmf_film_meta', {});
    const hidden = new Set(loadJSON('lbmf_rec_hidden', []));
    const expanded = new Set();

    // ══════════════ Letterboxd: consultas ══════════════
    // Fetch compartido: si Letterboxd responde 429, frena a TODOS los hilos 60s y reintenta
    let rateLimitUntil = 0, blockedCount = 0, inFlight = 0;
    async function lbFetch(url) {
        for (let attempt = 0; attempt < 3; attempt++) {
            while (Date.now() < rateLimitUntil) await sleep(1000);
            inFlight++;
            let res;
            try { res = await fetch(url, { credentials: 'include' }); }
            catch (e) {
                // error de red (sin internet, conexión cortada): reintenta con pausa creciente
                if (attempt === 2) return new Response('', { status: 599 });
                await sleep(1500 * (attempt + 1));
                continue;
            } finally { inFlight--; }
            if (res.status === 403 || res.status >= 500) {
                // se avisan los primeros 3 y después 1 de cada 20, para no inundar el log
                blockedCount++;
                if (blockedCount <= 3 || blockedCount % 20 === 0) log(t('lgBlocked', res.status, url.replace('https://letterboxd.com', ''), blockedCount), 'var(--red)');
            }
            if (res.status !== 429) return res;
            if (Date.now() >= rateLimitUntil) { rateLimitUntil = Date.now() + 60000; log(t('lg429'), 'var(--red)'); }
        }
        return new Response('', { status: 429 });
    }
    const parseHTML = async res => new DOMParser().parseFromString(await res.text(), 'text/html');

    // Una página de una lista de usuarios de Letterboxd (ej. /film/x/fans/page/2/) → { users: [usuario], hasNext }
    // La conexión puede cortarse a mitad de la descarga ("Failed to fetch" al leer el cuerpo): se reintenta la página
    // en vez de darla por vacía, porque una página vacía hace creer que la lista terminó.
    async function fetchUsersPage(url, page) {
        let r;
        for (let attempt = 0; attempt < 3; attempt++) {
            r = await fetchUsersPageOnce(url, page);
            if (!r.failed) break;
            await sleep(2000 * (attempt + 1));
        }
        return r;
    }
    async function fetchUsersPageOnce(url, page) {
        const fullUrl = page > 1 ? `${url}page/${page}/` : url;
        try {
            const res = await lbFetch(fullUrl);
            if (!res.ok) { log(t('lgPage', fullUrl, res.status), 'var(--red)'); return { users: [], hasNext: false }; }
            const doc = await parseHTML(res);
            const users = new Set();
            const fromHref = a => ((a && a.getAttribute('href')) || '').match(/^\/([a-zA-Z0-9_]+)\/?$/);
            doc.querySelectorAll('table.person-table tr a.name, .person-summary a.name, .person-summary h3 a').forEach(a => {
                const m = fromHref(a); if (m) users.add(m[1]);
            });
            // respaldo por si Letterboxd cambia el layout: links a perfiles que tengan avatar
            if (!users.size) {
                const skip = new Set(['films', 'lists', 'members', 'journal', 'about', 'pro', 'activity', 'search', 'settings', 'film', 'list', 'sign-in', 'create-account', 'people', 'reviews', 'tags', 'apps', 'contact', 'legal', 'welcome']);
                doc.querySelectorAll('#content a[href], main a[href]').forEach(a => {
                    const m = fromHref(a);
                    if (m && !skip.has(m[1].toLowerCase()) && (a.querySelector('img') || a.closest('li, tr')?.querySelector('.avatar img'))) users.add(m[1]);
                });
            }
            let hasNext = !!doc.querySelector('.paginate-nextprev a.next, a.paginate-next');
            if (!hasNext) doc.querySelectorAll('.paginate-pages a, .pagination a').forEach(a => {
                const pm = (a.getAttribute('href') || '').match(/page\/(\d+)/);
                if (pm && parseInt(pm[1]) > page) hasNext = true;
            });
            return { users: [...users], hasNext };
        } catch (e) { console.error(e); return { users: [], hasNext: false, failed: true }; }
    }

    // Junta películas de un bloque de HTML de Letterboxd (soporta el markup viejo y el nuevo de posters) → Map slug -> nombre
    function extractFilms(root) {
        const films = new Map();
        const add = (slug, name) => {
            if (!slug) return;
            name = (name || '').replace(/^Poster for /i, '').trim();
            if (!films.has(slug) || (!films.get(slug) && name)) films.set(slug, name);
        };
        root.querySelectorAll('[data-film-slug], [data-item-slug], [data-target-link], [data-item-link], [data-film-link]').forEach(el => {
            let slug = el.getAttribute('data-film-slug') || el.getAttribute('data-item-slug');
            if (!slug) {
                const link = el.getAttribute('data-target-link') || el.getAttribute('data-item-link') || el.getAttribute('data-film-link') || '';
                const m = link.match(/^\/film\/([^/]+)\/?$/);
                if (m) slug = m[1];
            }
            if (!slug || slug.includes('/')) return;
            const img = el.querySelector('img');
            add(slug, el.getAttribute('data-film-name') || el.getAttribute('data-item-name') || (img && img.getAttribute('alt')));
        });
        if (!films.size) root.querySelectorAll('a[href^="/film/"]').forEach(a => {
            const m = (a.getAttribute('href') || '').match(/^\/film\/([^/]+)\/?$/);
            if (m) { const img = a.querySelector('img'); add(m[1], (img && img.getAttribute('alt')) || a.textContent); }
        });
        return films;
    }

    function favoritesRoot(doc) {
        const direct = doc.querySelector('#favourites, section.favourite-films, .favourite-films');
        if (direct) return direct;
        for (const el of doc.querySelectorAll('h2, h3')) if (/favou?rite films/i.test(el.textContent)) return el.closest('section') || el.parentElement;
        return null;
    }

    // Top 4 de un usuario → { films: [[slug, name]], cached } | null si falló la consulta
    // Con withFives también trae sus primeras FIVES_MAX pelis con 5★ (fives) y con 4½★ (halves). Lo que ya está en caché no se vuelve a pedir.
    async function fetchUserFavorites(username, force, withFives) {
        let c = null;
        if (!force) {
            c = favCache[username];
            if (!c) { c = await store.get('fav:' + username); if (c) favCache[username] = c; }
            if (c && Date.now() - c.t < FAV_TTL) {
                if (!withFives || (c.fives && c.halves)) return { films: c.films, fives: c.fives || [], halves: c.halves || [], cached: true };
            } else c = null;
        }
        let films = c ? c.films : null;
        if (!films) {
            const res = await lbFetch(`https://letterboxd.com/${username}/`);
            if (!res.ok) return null;
            const root = favoritesRoot(await parseHTML(res));
            films = root ? [...extractFilms(root)].slice(0, 4) : [];
        }
        const rated = async r => {
            const res = await lbFetch(`https://letterboxd.com/${username}/films/rated/${r}/`);
            if (!res.ok) return undefined; // falló: no se guarda como "ya consultado"
            const doc = await parseHTML(res);
            return [...extractFilms(doc.querySelector('#content') || doc)].slice(0, FIVES_MAX);
        };
        let fives = c && c.fives, halves = c && c.halves;
        if (withFives) {
            if (!fives) fives = await rated('5');
            if (!halves) halves = await rated('4.5');
        }
        favCache[username] = { films, t: c ? c.t : Date.now() };
        if (fives) favCache[username].fives = fives;
        if (halves) favCache[username].halves = halves;
        store.set('fav:' + username, favCache[username]);
        return { films, fives: fives || [], halves: halves || [], cached: false };
    }

    // Recorre una grilla de posters paginada (ej. "usuario/films/") → Map slug -> nombre
    async function fetchFilmGrid(path, onPage) {
        const films = new Map();
        let page = 1, more = true;
        while (more && !stopReq) {
            const pages = Array.from({ length: threads() }, (_, i) => page + i);
            if (onPage) onPage(`${pages[0]}-${pages[pages.length - 1]}`);
            const results = await Promise.all(pages.map((p, i) => sleep(i * 250).then(async () => {
                const res = await lbFetch(`https://letterboxd.com/${path}${p > 1 ? `page/${p}/` : ''}`);
                if (!res.ok) return null;
                const doc = await parseHTML(res);
                return extractFilms(doc.querySelector('#content') || doc);
            })));
            for (const pf of results) {
                if (!pf || !pf.size) { more = false; break; }
                pf.forEach((name, slug) => { if (!films.has(slug)) films.set(slug, name); });
            }
            page += pages.length;
            if (more) await sleep(600 + Math.random() * 500);
        }
        return films;
    }

    async function fetchWatched(username, onPage, force) {
        const key = 'lbmf_watched_' + username;
        const c = loadJSON(key, null);
        if (!force && c && Date.now() - c.t < WATCHED_TTL) return new Set(c.slugs);
        const slugs = new Set((await fetchFilmGrid(`${username}/films/`, onPage)).keys());
        if (!stopReq) saveJSON(key, { slugs: [...slugs], t: Date.now() });
        return slugs;
    }

    // Tus películas con 5★ y 4½★ (primero las de 5) → [[slug, name]]
    async function fetchTopRated(username, onPage) {
        const out = new Map();
        for (const r of ['5', '4.5']) {
            const label = r === '5' ? '5★' : '4½★';
            const films = await fetchFilmGrid(`${username}/films/rated/${r}/`, p => onPage(label, p));
            films.forEach((name, slug) => { if (!out.has(slug)) out.set(slug, name); });
            log(t('lgRated', films.size, label), 'var(--blue)');
        }
        return [...out];
    }

    // Portada, promedio, votos y año de una película (Letterboxd los publica en JSON-LD, envuelto en comentarios CDATA)
    async function fetchFilmMeta(slug) {
        const res = await lbFetch(`https://letterboxd.com/film/${slug}/`);
        if (!res.ok) return null;
        const doc = await parseHTML(res);
        const meta = { poster: '', rating: null, ratingCount: 0, year: '', t: Date.now() };
        const ld = doc.querySelector('script[type="application/ld+json"]');
        if (ld) {
            try {
                const j = JSON.parse(ld.textContent.replace(/\/\*\s*<!\[CDATA\[\s*\*\/|\/\*\s*\]\]>\s*\*\//g, '').trim());
                meta.poster = j.image || '';
                if (j.aggregateRating) {
                    meta.rating = parseFloat(j.aggregateRating.ratingValue) || null;
                    meta.ratingCount = parseInt(j.aggregateRating.ratingCount) || 0;
                }
                const rel = Array.isArray(j.releasedEvent) ? j.releasedEvent[0] : j.releasedEvent;
                if (rel && rel.startDate) meta.year = String(rel.startDate).slice(0, 4);
                if (Array.isArray(j.genre)) meta.genres = j.genre;
            } catch (e) {}
        }
        // temáticas de la sección Genres (theme, mini-theme y nanogenre), como slugs
        meta.themes = [...new Set([...doc.querySelectorAll('a[href^="/films/theme/"], a[href^="/films/mini-theme/"], a[href^="/films/nanogenre/"]')]
            .map(a => a.getAttribute('href').split('/')[3]).filter(Boolean))];
        // con el tipo, para poder abrir la lista de pelis de cada temática: "theme/crude-humor-and-satire"
        meta.themePaths = [...new Set([...doc.querySelectorAll('a[href^="/films/theme/"], a[href^="/films/mini-theme/"], a[href^="/films/nanogenre/"]')]
            .map(a => a.getAttribute('href').split('/').slice(2, 4).join('/')).filter(p => p.includes('/') && !p.endsWith('/')))];
        if (meta.rating == null) {
            const tw = doc.querySelector('meta[name="twitter:data2"]');
            const m = tw && (tw.getAttribute('content') || '').match(/([\d.]+)\s*out of 5/);
            if (m) meta.rating = parseFloat(m[1]);
        }
        if (!meta.poster) { const img = doc.querySelector('.film-poster img, .poster img'); if (img) meta.poster = img.getAttribute('src') || ''; }
        const rt = ((doc.querySelector('p.text-footer') || {}).textContent || '').match(/(\d+)\s*mins?/);
        meta.runtime = rt ? parseInt(rt[1]) : null;
        return meta;
    }

    // Cola de datos de películas: se piden en segundo plano en el orden del ranking, así las de arriba llegan primero
    const metaQueue = [], metaInFlight = new Set();
    let metaUnsaved = 0, renderTimer = null, metaDone = 0;
    const scheduleRender = () => { if (!renderTimer) renderTimer = setTimeout(() => { renderTimer = null; renderResults(); }, 400); };
    const metaFresh = slug => { const m = filmMeta[slug]; return !!m && Date.now() - m.t < FILM_META_TTL; };
    // los datos viejos (sin temáticas) se vuelven a pedir una vez
    const needsMeta = slug => !metaFresh(slug) || ((filmMeta[slug].themes === undefined || filmMeta[slug].themePaths === undefined) && !filmMeta[slug].failed);
    function wantMeta(slugs) {
        metaQueue.length = 0;
        // con las temáticas prendidas, primero las pelis de partida (hacen falta para puntuar a las demás)
        if (ui.themesCB && ui.themesCB.checked) slugs = [...R.baseFilms.map(f => f[0]), ...slugs];
        for (const slug of new Set(slugs)) if (needsMeta(slug) && !metaInFlight.has(slug)) metaQueue.push(slug);
        pumpMeta();
    }
    function pumpMeta() {
        const limit = isRunning ? 2 : threads(); // mientras corre la búsqueda usa pocos hilos para no frenarla
        while (metaInFlight.size < limit && metaQueue.length) {
            const slug = metaQueue.shift();
            metaInFlight.add(slug);
            (async () => {
                let m = null;
                try { m = await fetchFilmMeta(slug); } catch (e) {}
                // si falló, se reintenta en 10 minutos
                filmMeta[slug] = m || { poster: '', rating: null, ratingCount: 0, year: '', failed: true, t: Date.now() - FILM_META_TTL + 10 * 60 * 1000 };
                metaInFlight.delete(slug);
                if (++metaDone % 25 === 0) log(t('lgMeta', metaDone, metaQueue.length));
                if (++metaUnsaved >= 10 || (!metaQueue.length && !metaInFlight.size)) { saveJSON('lbmf_film_meta', filmMeta); metaUnsaved = 0; }
                scheduleRender();
                await randomDelay(0.4, 0.9);
                pumpMeta();
            })();
        }
    }

    // Acepta URLs (https://letterboxd.com/film/aftersun/), rutas o slugs, uno por línea o separados por coma
    const parseManual = text => text.split(/[\n,]+/).map(x => x.trim()).filter(Boolean).map(x => {
        const m = x.match(/\/film\/([^/?#]+)/);
        return [m ? m[1] : x.replace(/^\/+|\/+$/g, ''), ''];
    });

    // Pelis "de relleno" por temática: las mejor puntuadas de las temáticas más repetidas en tus pelis de partida.
    // No dependen de los fans; pesan poco (THEME_SRC_WEIGHT por lista en la que salen) y quedan al final del ranking.
    // Se toman las THEME_SRC_TOP temáticas más repetidas en tus pelis y las THEME_SRC_FILMS mejores de cada una. Cada lista pesa según qué tan
    // repetida es su temática (1 la más repetida, menos las demás). Solo entran las que salen en al menos THEME_SRC_MIN_LISTS listas.
    const THEME_SRC_TOP = 15, THEME_SRC_FILMS = 50, THEME_SRC_WEIGHT = 0.5, THEME_SRC_MIN_LISTS = 2;
    async function fetchThemeList(path) {
        const key = 'themelist:' + path;
        const c = await store.get(key);
        if (c && Date.now() - c.t < FANS_TTL) return c.films.slice(0, THEME_SRC_FILMS);
        const res = await lbFetch(`https://letterboxd.com/csi/films/films-browser-list/${path}/by/rating/?esiAllowFilters=true`);
        if (!res.ok) { log(t('lgPage', path, res.status), 'var(--red)'); return []; }
        const list = [...extractFilms(await parseHTML(res))].slice(0, THEME_SRC_FILMS);
        if (list.length) store.set(key, { films: list, t: Date.now() });
        await sleep(600 + Math.random() * 500);
        return list;
    }
    async function gatherThemeFilms(ctx) {
        const bases = ctx.baseFilms.slice(0, 30).map(f => f[0]);
        for (const slug of bases) {
            if (stopReq) return;
            const m = filmMeta[slug];
            if (m && m.themePaths && metaFresh(slug) && !m.failed) continue;
            try { const nm = await fetchFilmMeta(slug); if (nm) filmMeta[slug] = nm; } catch (e) {}
            await randomDelay(0.3, 0.6);
        }
        saveJSON('lbmf_film_meta', filmMeta);
        const freq = new Map();
        bases.forEach(slug => ((filmMeta[slug] || {}).themePaths || []).forEach(p => freq.set(p, (freq.get(p) || 0) + 1)));
        const maxFreq = Math.max(1, ...freq.values());
        const top = [...freq].sort((a, b) => b[1] - a[1] || (b[0].startsWith('theme/') - a[0].startsWith('theme/'))).slice(0, THEME_SRC_TOP);
        for (const [path, f] of top) {
            if (stopReq) return;
            const films = await fetchThemeList(path);
            films.forEach(([slug, name]) => {
                if (ctx.baseSlugs.has(slug)) return;
                const e = ctx.themeFilms.get(slug) || { name, n: 0, lists: 0 };
                e.n += f / maxFreq; e.lists++; ctx.themeFilms.set(slug, e);
            });
            log(t('lgThemeList', path.split('/')[1], films.length), 'var(--blue)');
        }
    }

    // ══════════════ Ranking ══════════════
    // Peso del voto de un fan según cuántas pelis base comparte (y la opción de afinidad) → { w (0 = no cuenta), affine }
    function fanWeightFor(shared) {
        if (!ui.affCB.checked) return { w: shared, affine: false };
        const min = Math.min(20, Math.max(2, parseInt(ui.affMin.value) || 2));
        if (shared >= min) return { w: ui.affMode.value === 'boost' ? shared * 5 : shared, affine: true };
        return { w: ui.affMode.value === 'only' ? 0 : shared, affine: false };
    }

    function computeCounts(ctx = R, plain = false) {
        const counts = new Map();
        ctx.fanFilms.forEach((films, u) => {
            const shared = ctx.fanShared.get(u) || 1;
            const { w, affine } = plain ? { w: shared, affine: false } : fanWeightFor(shared);
            if (w <= 0) return;
            const add = (slug, name, weight) => {
                if (ctx.baseSlugs.has(slug)) return;
                const e = counts.get(slug) || { slug, name: '', fans: 0, affine: 0, score: 0 };
                if (!e.name && name) e.name = name;
                e.fans++; e.score += weight;
                if (affine) e.affine++;
                counts.set(slug, e);
            };
            for (const [slug, name] of films) add(slug, name, w);
            const seen = new Set(films.map(f => f[0]));
            for (const [list, k] of [[ctx.fanFives.get(u), FIVE_WEIGHT], [ctx.fanHalves.get(u), HALF_WEIGHT]])
                for (const [slug, name] of list || []) if (!seen.has(slug)) { seen.add(slug); add(slug, name, w * k); }
        });
        return counts;
    }

    // Joyitas: el score se divide por la raíz de la popularidad (votos en Letterboxd).
    // El +5000 suaviza, para que una peli con poquísimos votos no gane solo por casualidad.
    const GEM_SMOOTHING = 5000;
    const hasPopularity = slug => metaFresh(slug) && !filmMeta[slug].failed;
    const gemScore = e => Math.round(e.score / Math.sqrt((filmMeta[e.slug].ratingCount || 0) + GEM_SMOOTHING) * 1000);

    // Temáticas de tus pelis de partida. Multiplicador del puntaje según cuántas comparte una candidata:
    // hasta 4 suma 0,2 por temática (1→1,2 · 2→1,4 · 3→1,6 · 4→1,8) y desde ahí 0,4: 5→2,2 · 6→2,6 · 7→3…
    const themeMult = n => n <= 0 ? 1 : n <= 4 ? 1 + 0.2 * n : 1.8 + 0.4 * (n - 4);
    // Palabras clave de un mini-theme ("robbery-heist-cops-twist-thriller" → robbery, heist, cops, thriller), sin las genéricas
    const KW_STOP = new Set('and the for with intense powerful amusing moving gripping intriguing touching emotion emotional storytelling breathtaking thought provoking funny interesting entertaining fun great good beautiful stunning drama dramas film films story stories sad sweet humorous confusing'.split(' '));
    const kwOf = path => path.startsWith('mini-theme/') ? path.slice(11).split('-').filter(w => w.length > 2 && !KW_STOP.has(w)) : [];
    const KW_VALUE = 0.05, KW_MAX = 8; // cada subtemática compartida suma 0,05 al multiplicador (hasta 8)
    const humanize = slug => { const x = slug.replace(/-/g, ' '); return x.charAt(0).toUpperCase() + x.slice(1); };
    // Perfil de temáticas de tus pelis de partida: temática → pelis tuyas que la tienen; palabra clave → ídem
    function baseProfile(ctx = R) {
        const themes = new Map(), words = new Map();
        const push = (m, k, slug) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(slug); };
        for (const [slug] of ctx.baseFilms) ((filmMeta[slug] || {}).themePaths || []).forEach(p => { push(themes, p, slug); kwOf(p).forEach(w => push(words, w, slug)); });
        return { themes, words, size: themes.size };
    }
    // Qué comparte una candidata con ese perfil: temáticas exactas y palabras clave de sus mini-themes que no coincidieron exacto
    function matchThemes(slug, prof) {
        const paths = (filmMeta[slug] || {}).themePaths || [];
        const exact = [], hit = new Set(), words = new Map();
        paths.forEach(p => { if (prof.themes.has(p)) { exact.push([p, [...prof.themes.get(p)]]); hit.add(p); } });
        paths.forEach(p => { if (!hit.has(p)) kwOf(p).forEach(w => { if (prof.words.has(w) && !words.has(w)) words.set(w, [...prof.words.get(w)]); }); });
        return { exact, words: [...words] };
    }
    // Multiplica el score de cada candidata según lo que comparte con las pelis de partida (prof)
    const withThemeBoost = (list, prof) => !prof || !prof.size ? list : list.map(e => {
        const m = matchThemes(e.slug, prof);
        const nW = Math.min(m.words.length, KW_MAX);
        // multiplicador de las temáticas exactas + 0,05 por cada subtemática (ej. 2 temáticas ×1,4 + 4 subtemáticas = ×1,6)
        const mult = themeMult(m.exact.length) + KW_VALUE * nW;
        return m.exact.length || nW ? Object.assign({}, e, { themes: m.exact.length, words: nW, themeEff: mult, tmatch: m, score: e.score * mult }) : e;
    });
    function getResults() {
        const minFans = minFansValue();
        const counts = computeCounts();
        if (ui.themesCB.checked) R.themeFilms.forEach((x, slug) => {
            const c = counts.get(slug);
            if (!c && (x.lists || 1) < THEME_SRC_MIN_LISTS) return; // solo en una lista: demasiado azar
            const e = c || { slug, name: x.name, fans: 0, affine: 0, score: 0 };
            e.score += THEME_SRC_WEIGHT * x.n; e.listed = x.lists || 1; counts.set(slug, e);
        });
        const base = withThemeBoost([...counts.values()]
            .filter(e => (e.fans >= minFans || (e.fans === 0 && e.listed)) && !hidden.has(e.slug) && (ui.watchedCB.checked || !R.watched.has(e.slug))), ui.themesCB.checked ? baseProfile() : null)
            .sort((a, b) => b.score - a.score || b.fans - a.fans);
        gemsPending = []; gemsTotal = base.length;
        if (!ui.gemsCB.checked) return base;
        // sin la popularidad no se puede calcular el score joyita: esas quedan esperando su dato
        const ready = [];
        for (const e of base) (hasPopularity(e.slug) ? ready : gemsPending).push(e);
        return ready.map(e => Object.assign({}, e, { gem: gemScore(e) })).sort((a, b) => b.gem - a.gem || b.score - a.score);
    }

    function affinitySummary(ctx = R) {
        const by = { 2: 0, 3: 0, 4: 0 };
        ctx.fanShared.forEach(n => { if (n >= 2) by[Math.min(n, 4)]++; });
        return t('affSummary', by[2], by[3], by[4]);
    }

    // ══════════════ UI ══════════════
    const ui = {};
    const threads = () => Math.min(12, Math.max(1, parseInt(ui.threads.value) || 3));
    const minFansValue = () => Math.max(1, parseInt(ui.minFans.dataset.value) || 1);

    const mkSwitch = (checked, yellow) => {
        const input = h('input', { type: 'checkbox' }); input.checked = !!checked;
        return { input, el: h(`label.switch${yellow ? '.yellow' : ''}`, {}, [input, h('span')]) };
    };
    // Tarjetita con título, descripción e interruptor; `extra` se muestra debajo cuando está prendida
    function mkOpt(title, desc, checked, extra, yellow) {
        const sw = mkSwitch(checked, yellow);
        const opt = h('div.opt', {}, [h('div.opt-txt', {}, [h('b', { text: title }), h('span', { text: desc }), extra || '']), sw.el]);
        const sync = () => { opt.classList.toggle('on', sw.input.checked); if (extra) extra.style.display = sw.input.checked ? 'flex' : 'none'; };
        opt.addEventListener('click', ev => {
            if (ev.target.closest('.opt-extra') || ev.target.closest('.switch')) return; // el switch ya se togglea solo
            sw.input.checked = !sw.input.checked; sw.input.dispatchEvent(new Event('change'));
        });
        sw.input.addEventListener('change', sync); sync();
        return { opt, input: sw.input };
    }

    const app = h('div.app');
    document.body.append(app);

    // ── Header ──
    const langBtn = code => h(`button${lang === code ? '.on' : ''}`, {
        text: code.toUpperCase(),
        onclick: () => {
            if (code === lang) return;
            if (isRunning) { alert(t('busy')); return; }
            localStorage.setItem('lbpr_lang', code); location.reload();
        }
    });
    const ghIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>';
    app.append(h('header.header', {}, [
        h('div.brand', {}, [
            h('div.dots', { html: '<i style="background:var(--green)"></i><i style="background:var(--blue)"></i><i style="background:var(--orange)"></i>' }),
            h('div', {}, [h('h1', { text: 'Letterboxd Pelis Recommendation' }), h('p', { text: t('subtitle') })])
        ]),
        h('div.header-r', {}, [
            h('div.lang', {}, [langBtn('es'), langBtn('en')]),
            h('a.hlink.me', { href: AUTHOR_URL, target: '_blank', text: '@luchofariello' }),
            h('a.hlink', { href: REPO_URL, target: '_blank', html: `${ghIcon} GitHub` })
        ])
    ]));

    // ── Intro ──
    const intro = h('div.intro', {}, h('div.intro-in', {}, [
        h('div', { style: 'font-size:30px;line-height:1', text: '🍿' }),
        h('h2', { text: t('introTitle') }),
        h('p', { html: t('introLead') }),
        h('div.steps', {}, t('introSteps').map(([title, txt], i) => {
            const col = ['var(--green)', 'var(--blue)', 'var(--orange)', '#f472b6', 'var(--violet)'][i];
            return h('div.step', { style: `border-top:2px solid ${col}` }, [h('small', { style: `color:${col}`, text: `${t('introStep')} ${i + 1}` }), h('b', { text: title }), h('span', { text: txt })]);
        })),
        h('div.intro-notes', { html: t('introNotes') }),
        h('button.btn.btn-primary', { text: t('introGo'), onclick: () => setIntro(false) })
    ]));
    const introMini = h('button.intro-mini', { html: `🍿 <b>Letterboxd Pelis Recommendation</b> <span>· ${esc(t('introMini'))}</span>`, onclick: () => setIntro(true) });
    const setIntro = open => { intro.style.display = open ? 'block' : 'none'; introMini.style.display = open ? 'none' : 'block'; localStorage.setItem('lbmf_intro_seen', open ? '0' : '1'); };
    app.append(intro, introMini);

    // ── Pestañas ──
    const recTab = h('div', { style: 'display:flex;flex-direction:column;gap:14px' });
    const pickTab = h('div', { style: 'display:flex;flex-direction:column;gap:14px' });
    const tabBtns = {};
    const showTab = which => {
        recTab.style.display = which === 'rec' ? 'flex' : 'none';
        pickTab.style.display = which === 'pick' ? 'flex' : 'none';
        Object.entries(tabBtns).forEach(([k, b]) => b.classList.toggle('on', k === which));
        localStorage.setItem('lbpr_tab', which);
    };
    tabBtns.rec = h('button', { text: t('tabRec'), onclick: () => showTab('rec') });
    tabBtns.pick = h('button', { text: t('tabPick'), onclick: () => showTab('pick') });
    app.append(h('div.tabs', {}, [tabBtns.rec, tabBtns.pick]), recTab, pickTab);

    // ── Tu búsqueda ──
    ui.user = h('input.input', { type: 'text', placeholder: t('userPh') });
    ui.user.value = localStorage.getItem('lbmf_own_user') || '';
    ui.user.addEventListener('input', () => localStorage.setItem('lbmf_own_user', ui.user.value.trim()));

    let source = localStorage.getItem('lbpr_source') || 'favs';
    const segBtn = (value, title, desc) => h('button', { 'data-v': value, html: `<b>${esc(title)}</b><span>${esc(desc)}</span>`, onclick: () => setSource(value) });
    const seg = h('div.seg.seg3', {}, [segBtn('favs', t('srcFavs'), t('srcFavsDesc')), segBtn('rated', t('srcRated'), t('srcRatedDesc')), segBtn('films', t('srcFilms'), t('srcFilmsD'))]);
    ui.maxBase = h('input.input.num', { type: 'number', min: 1, max: 200, value: 20 });
    const maxBaseField = h('div.field', {}, [h('label.label', { text: t('maxBase') }), ui.maxBase, h('div.hint', { text: t('maxBaseHint') })]);

    ui.fans = h('input.input.num', { type: 'number', min: 1, step: 25, value: 50 });
    const fansAll = mkSwitch(false, true);
    ui.fansAll = fansAll.input;
    const fansHint = h('div.hint');
    const syncFansHint = () => {
        ui.fans.disabled = ui.fansAll.checked;
        fansHint.className = ui.fansAll.checked ? 'hint warn' : 'hint';
        fansHint.textContent = ui.fansAll.checked ? t('fansAllHint') : t('fansHint');
    };
    ui.fansAll.addEventListener('change', syncFansHint);

    function setSource(v) {
        // con muchas pelis base conviene tomar menos fans por película
        if (v === 'rated' && source === 'favs' && ui.fans.value === '50') ui.fans.value = 25;
        if (v === 'favs' && source === 'rated' && ui.fans.value === '25') ui.fans.value = 50;
        source = v; localStorage.setItem('lbpr_source', v);
        seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
        maxBaseField.style.display = v === 'rated' ? 'block' : 'none';
        // sin perfil: no hace falta usuario, se eligen las pelis con el buscador
        userField.style.display = v === 'films' ? 'none' : 'block';
        recFilmsField.style.display = v === 'films' ? 'block' : 'none';
    }

    ui.manual = h('textarea.textarea', { rows: 3, placeholder: 'aftersun\nhttps://letterboxd.com/film/in-the-mood-for-love/' });
    // Velocidad = cantidad de consultas en paralelo ("hilos")
    ui.threads = h('select.select', { style: 'max-width:220px' }, [2, 3, 6, 10].map((n, i) => h('option', { value: n, text: t('speeds')[i] })));
    ui.threads.value = localStorage.getItem('lbpr_speed') || '3';
    ui.threads.addEventListener('change', () => localStorage.setItem('lbpr_speed', ui.threads.value));
    const noCacheOpt = mkOpt(t('noCache'), t('noCacheDesc'), false, null, true);
    ui.noCache = noCacheOpt.input;
    const fivesOpt = mkOpt(t('optFives'), t('optFivesDesc'), loadJSON('lbpr_fives', true));
    ui.fives = fivesOpt.input;
    ui.fives.addEventListener('change', () => saveJSON('lbpr_fives', ui.fives.checked));

    ui.startBtn = h('button.btn.btn-primary', { text: t('start'), onclick: () => run() });
    // ── Estimación de cuánto va a tardar la búsqueda ──
    // Modelo: cada hilo lee ~RATE perfiles por segundo (consulta + pausa anti-bloqueo). El valor arranca en un estándar
    // y se va ajustando con lo que midieron tus búsquedas reales (promedio móvil en localStorage).
    const DEFAULT_RATE = 0.5;                     // perfiles por segundo por hilo
    const PAGE_SECS = 1.7, PEOPLE_PER_PAGE = 25;  // cada página de fans: ~1.7s y ~25 personas
    const measuredRate = () => parseFloat(localStorage.getItem('lbpr_rate')) || DEFAULT_RATE;
    ui.estimate = h('div.estimate');
    const fmtDuration = s => s < 90 ? t('durSec', Math.max(10, Math.round(s / 10) * 10)) : s < 5400 ? t('durMin', Math.round(s / 60)) : t('durHours', (s / 3600).toFixed(1).replace('.0', ''));

    // bases: slugs conocidos (para mirar la caché) · nBase: cuántas pelis de partida se esperan si no se conocen
    async function estimateFor({ bases, nBase, perFilm, noCache }) {
        if (perFilm === Infinity) return { all: true };
        const th = threads();
        nBase = bases.length || nBase;
        let people = Math.round(nBase * perFilm * (nBase > 1 ? 0.9 : 1)); // ~10% de la gente se repite entre listas
        let cached = 0, pagesToRead = nBase * Math.ceil(perFilm / PEOPLE_PER_PAGE);
        if (bases.length && !noCache) {
            const lists = await chrome.storage.local.get(bases.map(b => 'fans:' + b));
            const users = new Set();
            pagesToRead = 0;
            for (const b of bases) {
                const cf = lists['fans:' + b];
                const fresh = cf && Date.now() - cf.t < FANS_TTL;
                if (fresh) cf.users.slice(0, perFilm).forEach(u => users.add(u));
                // lo que falte de cada lista hay que leerlo; se estima que cada persona nueva todavía no está guardada
                const missing = fresh && cf.complete ? 0 : perFilm - (fresh ? Math.min(cf.users.length, perFilm) : 0);
                pagesToRead += Math.ceil(missing / PEOPLE_PER_PAGE);
            }
            if (users.size) {
                const favs = await chrome.storage.local.get([...users].map(u => 'fav:' + u));
                cached = Object.values(favs).filter(v => v && Date.now() - v.t < FAV_TTL).length;
            }
            people = Math.max(users.size, people);
        }
        const secs = pagesToRead * PAGE_SECS / Math.min(th, nBase) + Math.max(0, people - cached) / (th * measuredRate()) + 15; // +15s: tus vistas y tus pelis
        return { secs, people, cached };
    }

    // Pinta la estimación en un botón y su línea de detalle
    function showEstimate(btn, label, el, r) {
        if (r.instant) { btn.textContent = `${label} · ${t('estInstant')}`; el.className = 'estimate'; el.textContent = ''; return; }
        if (r.all) { btn.textContent = label; el.className = 'estimate warn'; el.textContent = t('estAll'); return; }
        const th = threads(), dur = fmtDuration(r.secs);
        btn.textContent = `${label} · ~${dur}`;
        el.className = r.secs > 1800 ? 'estimate warn' : 'estimate';
        el.innerHTML = t('estLine', dur, fmtNum(r.people), r.cached ? fmtNum(r.cached) : 0, t('speeds')[[2, 3, 6, 10].indexOf(th)] || th) +
            (r.secs > 600 && th < 10 ? ` ${t('estFaster', fmtDuration(r.secs * th / 10))}` : '');
    }

    let estimateTimer = null, estimateSeq = 0;
    async function estimate() {
        const seq = ++estimateSeq;
        const o = searchOpts();
        // pelis de partida: si se conocen (a mano o tus favoritas ya guardadas) se puede mirar qué hay en caché
        let bases = o.films.map(f => f[0]);
        if (!bases.length && o.src === 'favs' && o.who) { const c = await store.get('fav:' + o.who); if (c) bases = c.films.map(f => f[0]); }
        const r = await estimateFor({ bases, nBase: o.src === 'rated' ? o.maxBase : 4, perFilm: o.perFilm, noCache: o.noCache });
        if (seq === estimateSeq) showEstimate(ui.startBtn, t('start'), ui.estimate, r);
    }
    const scheduleEstimate = () => { clearTimeout(estimateTimer); estimateTimer = setTimeout(() => { estimate(); if (typeof estimatePick === 'function') estimatePick(); }, 300); };

    // Opciones de la búsqueda de la pestaña Recomendaciones (el selector arma las suyas en pickOpts)
    function searchOpts() {
        const films = source === 'films' ? recSearchW.films().map(f => [f.slug, f.name]) : parseManual(ui.manual.value);
        const who = ui.user.value.trim();
        const perFilm = ui.fansAll.checked ? Infinity : Math.max(1, parseInt(ui.fans.value) || 50);
        const src = films.length ? 'manual' : source;
        const maxBase = Math.min(200, Math.max(1, parseInt(ui.maxBase.value) || 20));
        const withFives = ui.fives.checked;
        return { slot: 'search', who, src, films, maxBase, perFilm, noCache: ui.noCache.checked, withFives,
            key: JSON.stringify([src, who, films.map(f => f[0]), perFilm, maxBase, withFives]) };
    }


    ui.stopBtn = h('button.btn.btn-stop', { text: t('stop'), style: 'display:none', onclick: onStop });

    // Balde de pochoclos (barra de progreso)
    const popFill = h('div.bucket-fill');
    const popTop = h('div.bucket-top', {}, [[4, 10], [16, 6], [28, 2], [40, 0], [52, 2], [64, 6], [72, 10], [10, 12], [22, 9], [34, 6], [46, 6], [58, 9], [66, 12]]
        .map(([x, y]) => h('div.corn', { style: `left:${x}px;top:${y}px;transform:rotate(${Math.round(Math.random() * 360)}deg)` })));
    const popPct = h('div.bucket-pct');
    const bucket = h('div.bucket', {}, [h('div.bucket-body', {}, [popFill, h('div.bucket-stripes')]), popTop, popPct]);
    const popStage = h('div.pop-stage');
    const popLast = h('div.pop-last', { style: 'font-size:11px;color:var(--dim);margin-top:6px;font-family:ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis' });
    const pop = h('div.pop', {}, [bucket, h('div', { style: 'flex:1;min-width:0' }, [popStage, popLast])]);
    const statusEl = h('div.status');
    const status = txt => { statusEl.textContent = txt; };

    const REC_MAX_FILMS = 5; // tope de pelis cuando no tenés perfil
    const recSearchW = mkFilmSearch({ max: REC_MAX_FILMS, storeKey: 'lbpr_rec_sel', hint: t('recFilmsHint'), onChange: () => scheduleEstimate() });
    const userField = h('div.field', {}, [h('label.label', { text: t('userLabel') }), ui.user]);
    const recFilmsField = h('div.field', { style: 'display:none' }, [h('label.label', { text: t('recFilmsLabel') }), recSearchW.el]);
    const searchSlot = h('div'); // balde y botón de detener cuando la búsqueda arranca desde esta pestaña
    recTab.append(h('section.card', {}, [
        h('div.card-title', { text: t('searchTitle') }),
        h('div.field', {}, [h('label.label', { text: t('sourceLabel') }), seg]),
        userField, recFilmsField,
        h('div.hint', { style: 'margin:-4px 0 14px;font-size:12px;color:var(--muted)', html: t('fanExplain') }),
        h('div.grid2', {}, [
            maxBaseField,
            h('div.field', {}, [h('label.label', { text: t('fansLabel') }), h('div.row', {}, [ui.fans, fansAll.el, h('span', { style: 'font-size:12px;color:var(--muted)', text: t('fansAll') })]), fansHint])
        ]),
        h('details.fold.fold-inline', {}, [
            h('summary', { text: t('advanced') }),
            h('div.fold-body', {}, [
                h('div.field', {}, [h('label.label', { text: t('manualLabel') }), ui.manual, h('div.hint', { text: t('manualHint') })]),
                h('div.field', {}, [h('label.label', { text: t('threadsLabel') }), ui.threads, h('div.hint', { text: t('threadsHint') })]),
                fivesOpt.opt,
                noCacheOpt.opt
            ])
        ]),
        h('div', { style: 'margin-top:16px' }, [ui.startBtn, ui.estimate]),
        searchSlot
    ]));
    searchSlot.append(ui.stopBtn, pop, statusEl);
    setSource(source); syncFansHint();
    [ui.user, ui.fans, ui.maxBase, ui.manual].forEach(el => el.addEventListener('input', scheduleEstimate));
    [ui.fansAll, ui.threads, ui.noCache].forEach(el => el.addEventListener('change', scheduleEstimate));
    seg.addEventListener('click', scheduleEstimate);
    scheduleEstimate();

    // ── Historial: desplegable desde el encabezado de Recomendaciones ──
    const histList = h('div');
    const histPanel = h('div.hist-panel', { style: 'display:none' }, [h('div.adjust-h', { text: t('history') }), histList]);
    const histBtn = h('button.btn-sm', { text: t('histBtn', 0), onclick: () => { histPanel.style.display = histPanel.style.display === 'none' ? 'block' : 'none'; } });

    // ── 📺 Elegir una peli ya: elige UNA peli con todo el algoritmo ──
    // Todo viene preconfigurado; lo único a elegir es de qué pelis partir (buscador) y qué tipo de peli querés.
    const AVAIL_TTL = 3 * 24 * 3600 * 1000;
    const PICK_MAX_FILMS = 10;
    const PICK_MIN_FANS = 2;       // que la repitan al menos 2 personas
    const PICK_FANS = 100;         // personas por peli (fijo en esta pestaña)
    const PICK_FIRST_AFTER = 40;   // segundos: si la búsqueda no terminó, a los 40s se elige con lo que haya; el resto sigue para "Otra"
    const availCache = loadJSON('lbpr_avail2', {}); // v2: ya filtrado por país
    const AVAIL_COUNTRY = 'AR'; // Letterboxd marca cada servicio con su país (<span class="locale">AR</span>); solo se muestran los de acá
    const pickSkip = new Set(); // las que ya salieron o descartaste
    let pickKind = localStorage.getItem('lbpr_pick_kind') || 'any';
    let pickCurrent = null;
    const pickSeen = []; // pelis que ya se mostraron, en orden ({ e, av }), para poder volver
    let pickPos = -1;    // cuál de pickSeen se está mostrando

    const mkSeg = (items, get, set, cls) => {
        const el = h(`div.seg${cls ? '.' + cls : ''}`);
        const sync = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === get()));
        items.forEach(([v, title, desc]) => el.append(h('button', { 'data-v': v, html: `<b>${esc(title)}</b>${desc ? `<span>${esc(desc)}</span>` : ''}`, onclick: () => { set(v); sync(); scheduleEstimate(); } })));
        sync(); return el;
    };

    // Buscador de pelis de Letterboxd: por atrás se guarda el slug (la URL) de cada peli elegida
    async function searchFilms(q) {
        // 1) el autocompletado que usa Letterboxd (JSON)
        try {
            const res = await lbFetch(`https://letterboxd.com/s/autocompletefilm?q=${encodeURIComponent(q)}&limit=8`);
            if (res.ok) {
                const j = await res.json();
                const items = ((j && j.data) || []).map(d => ({
                    slug: ((d.url || '').match(/\/film\/([^/]+)/) || [])[1], name: d.name, year: d.releaseYear || '',
                    dir: (d.directors || []).map(x => x.name).join(', '), poster: d.posterUrl || d.poster || d.image || ''
                })).filter(x => x.slug);
                if (items.length) return items;
            }
        } catch (e) {}
        // 2) respaldo: la página de resultados de búsqueda
        const res = await lbFetch(`https://letterboxd.com/search/films/${encodeURIComponent(q)}/`);
        if (!res.ok) return [];
        const doc = await parseHTML(res);
        const out = new Map();
        doc.querySelectorAll('ul.results > li, .results li, li.search-result').forEach(li => {
            const [first] = [...extractFilms(li)];
            if (!first || out.has(first[0])) return;
            const title = li.querySelector('.film-title-wrapper a, h2 a, .headline-2 a');
            const year = li.querySelector('.film-title-wrapper small a, small.metadata a, .metadata a');
            const img = li.querySelector('img');
            const src = img ? (img.getAttribute('src') || '') : '';
            out.set(first[0], { slug: first[0], name: (title && title.textContent.trim()) || first[1] || slugName(first[0]), year: year ? year.textContent.trim() : '',
                poster: src && !/empty-poster|placeholder/.test(src) ? src : '' });
        });
        return [...out.values()].slice(0, 8);
    }

    // Buscador de pelis reutilizable (lo usan las dos pestañas). Guarda las elegidas en localStorage[storeKey].
    // → { el, films() → [{ slug, name, year, poster }], focus() }
    function mkFilmSearch({ max, storeKey, hint, onChange }) {
        let films = loadJSON(storeKey, []);
        const input = h('input.input', { type: 'text', placeholder: t('pickSearchPh'), autocomplete: 'off' });
        const results = h('div.search-results', { style: 'display:none' });
        const box = h('div.search-box', {}, [input, results]);
        const chips = h('div.chips');
        const save = () => { saveJSON(storeKey, films); renderChips(); if (onChange) onChange(); };
        function add(f) {
            if (films.some(x => x.slug === f.slug)) return;
            if (films.length >= max) { alert(t('pickMax', max)); return; }
            films.push({ slug: f.slug, name: f.name || slugName(f.slug), year: f.year || '', poster: f.poster || (filmMeta[f.slug] || {}).poster || '' });
            input.value = ''; results.style.display = 'none';
            save();
        }
        function renderChips() {
            chips.innerHTML = '';
            films.forEach(f => chips.append(h('span.chip', {}, [
                mkThumb(f, 'chip-thumb'),
                h('a', { href: `https://letterboxd.com/film/${f.slug}/`, target: '_blank', text: `${f.name}${f.year ? ` (${f.year})` : ''}` }),
                h('button', { text: '✕', onclick: () => { films = films.filter(x => x.slug !== f.slug); save(); } })
            ])));
        }
        let timer = null, seq = 0;
        input.addEventListener('input', () => {
            const q = input.value.trim();
            clearTimeout(timer);
            // pegaron una URL de peli de Letterboxd: se agrega directo
            const um = q.match(/letterboxd\.com\/film\/([^/?#\s]+)/);
            if (um) { add({ slug: um[1] }); return; }
            if (q.length < 2) { results.style.display = 'none'; return; }
            timer = setTimeout(async () => {
                const my = ++seq;
                results.style.display = 'block';
                results.innerHTML = ''; results.append(h('div.search-empty', { text: t('pickSearchingFilms') }));
                const items = await searchFilms(q);
                if (my !== seq) return;
                results.innerHTML = '';
                if (!items.length) { results.append(h('div.search-empty', { text: t('pickNoResults') })); return; }
                items.forEach(it => results.append(h('button.search-item', { onclick: () => add(it) }, [
                    mkThumb(it, 'search-thumb'),
                    h('div', {}, [h('b', { text: it.name }), it.year ? h('span', { text: ` (${it.year})` }) : '', it.dir ? h('small', { text: ` · ${it.dir}` }) : ''])
                ])));
            }, 350);
        });
        input.addEventListener('keydown', ev => { if (ev.key === 'Escape') results.style.display = 'none'; });
        document.addEventListener('click', ev => { if (!box.contains(ev.target)) results.style.display = 'none'; });
        renderChips();
        return { el: h('div', {}, [box, chips, hint ? h('div.hint', { text: hint }) : '']), films: () => films, focus: () => input.focus() };
    }
    // Pone la portada en una fotito: la que ya se tenga o, si no, la busca en segundo plano (queda en la caché)
    function fillThumb(img, f) {
        const known = f.poster || (filmMeta[f.slug] || {}).poster;
        if (known) { img.src = known; return; }
        fetchFilmMeta(f.slug).then(m => { if (m) { filmMeta[f.slug] = m; saveJSON('lbmf_film_meta', filmMeta); if (m.poster) { img.src = m.poster; f.poster = m.poster; } } }).catch(() => {});
    }
    function mkThumb(f, cls) { const img = h(`img.${cls}`, { alt: '', referrerpolicy: 'no-referrer' }); fillThumb(img, f); return img; }

    const pickSearchW = mkFilmSearch({ max: PICK_MAX_FILMS, storeKey: 'lbpr_pick_sel', hint: t('pickSearchHint'), onChange: () => scheduleEstimate() });

    const kindSeg = mkSeg([['any', t('kindAny'), t('kindAnyD')], ['gem', t('kindGem'), t('kindGemD')], ['classic', t('kindClassic'), t('kindClassicD')]],
        () => pickKind, v => { pickKind = v; localStorage.setItem('lbpr_pick_kind', v); }, 'seg3');
    // Ajustes preconfigurados (plegados)
    const streamOpt = mkOpt(t('pickStream'), t('pickStreamD'), localStorage.getItem('lbpr_pick_stream2') !== '0'); // prendido de fábrica
    streamOpt.input.addEventListener('change', () => localStorage.setItem('lbpr_pick_stream2', streamOpt.input.checked ? '1' : '0'));
    const SHORT_MAX_MIN = 90; // "algo cortito": hasta una hora y media
    const shortOpt = mkOpt(t('pickShort'), t('pickShortD'), false);

    ui.pickBtn = h('button.btn.btn-pick', { text: t('pickBtn'), onclick: () => pick() });
    ui.pickEstimate = h('div.estimate');

    // Animación mientras elige: el balde (si hay que buscar) + una tele haciendo zapping
    const tvCanvas = h('canvas', { width: 80, height: 50 });
    const tvScreen = h('div.tv-screen', {}, tvCanvas);
    const tvCh = h('div.tv-ch');
    const tv = h('div.tv', {}, [h('div.tv-ant'), h('div.tv-body', {}, [tvScreen, tvCh, h('div.tv-knobs', { html: '<i></i><i></i>' })]), h('div.tv-legs', { html: '<i></i><i></i>' })]);
    const pickAnimText = h('div.pick-anim-text', { text: t('pickPicking') });
    const pickStop = h('div');
    const pickAnim = h('div.pick-anim', { style: 'display:none' }, [tv, pickAnimText]);
    const pickErr = h('div.status');
    const pickStatus = txt => log(txt, 'var(--faint)'); // en esta pestaña el detalle va solo al log
    const pickOut = h('div');
    let tvTimer = null, tvChN = 3, tvThumbs = [];
    function tvZap() {
        tvChN = tvChN % 99 + 1;
        tvCh.textContent = `CH ${String(tvChN).padStart(2, '0')}`;
        [...tvScreen.children].forEach(c => { if (c !== tvCanvas) c.remove(); });
        const r = Math.random();
        if (r < 0.3 || !tvThumbs.length) { // estática
            const ctx = tvCanvas.getContext('2d'), img = ctx.createImageData(80, 50);
            for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
            ctx.putImageData(img, 0, 0);
        } else if (r < 0.42) tvScreen.append(h('div.tv-bars'));
        else { // una candidata: su portada o su título
            const f = tvThumbs[Math.random() * tvThumbs.length | 0];
            tvScreen.append(f.poster ? h('img', { src: f.poster, referrerpolicy: 'no-referrer' }) : h('div.tv-title', { text: f.name }));
        }
    }
    function startTV() {
        pickAnim.style.display = 'flex'; tv.style.display = 'block'; pickAnimText.textContent = t('pickPicking');
        const refresh = () => { tvThumbs = [...computeCounts(P, true).values()].sort((a, b) => b.score - a.score).slice(0, 30).map(e => ({ name: e.name || slugName(e.slug), poster: (filmMeta[e.slug] || {}).poster })); };
        refresh(); clearInterval(tvTimer);
        let n = 0;
        tvTimer = setInterval(() => { tvZap(); if (++n % 10 === 0) refresh(); }, 190);
    }
    function stopTV() {
        clearInterval(tvTimer); tvTimer = null; tv.style.display = 'none';
        // si la búsqueda sigue corriendo detrás, queda el balde con un aviso; si no, se oculta todo
        if (isRunning && runOpts && runOpts.slot === 'pick') pickAnimText.textContent = t('pickStillWorking');
        else pickAnim.style.display = 'none';
    }

    pickTab.append(h('section.card.pick', {}, [
        h('div.card-title', {}, [h('span', { text: t('pickTitle') }), h('span.card-sub', { text: t('pickSub') })]),
        h('div.field', {}, [h('label.label', { text: t('pickSearchLabel') }), pickSearchW.el]),
        h('div.field', {}, [h('label.label', { text: t('pickWant') }), kindSeg]),
        h('div.opts', {}, [streamOpt.opt, shortOpt.opt]),
        h('div.hint', { style: 'margin:8px 0 16px', text: t('pickTipUser') }),
        ui.pickBtn, ui.pickEstimate, pickStop, pickAnim, pickErr, pickOut
    ]));

    function pickOpts() {
        const films = pickSearchW.films().map(f => [f.slug, f.name]);
        const perFilm = PICK_FANS;
        return { slot: 'pick', src: 'manual', films, perFilm, key: JSON.stringify(['manual', films.map(f => f[0]).sort(), perFilm]) };
    }

    let estimatePickSeq = 0;
    async function estimatePick() {
        const seq = ++estimatePickSeq;
        const o = pickOpts();
        const r = P.fanFilms.size && P.key === o.key ? { instant: true } // ya están los datos de esa búsqueda
            : await estimateFor({ bases: o.films.map(f => f[0]), nBase: 4, perFilm: o.perFilm, noCache: false });
        if (seq === estimatePickSeq) showEstimate(ui.pickBtn, t('pickBtn'), ui.pickEstimate, r);
    }

    // "Where to watch" de Letterboxd (datos de JustWatch para el país de quien consulta)
    // → { ok, services: [{ name, stream: true | false | null }] }  (stream null = no se pudo saber si es suscripción)
    async function fetchAvailability(slug) {
        const c = availCache[slug];
        if (c && Date.now() - c.t < AVAIL_TTL) return c;
        const res = await lbFetch(`https://letterboxd.com/csi/film/${slug}/availability/?esiAllowUser=true&esiAllowCountry=true`);
        if (!res.ok) return { ok: false, services: [] };
        const doc = await parseHTML(res);
        const services = [], seen = new Set();
        let raw = 0; // cuántos servicios había antes de filtrar por país
        doc.querySelectorAll('[class*="service"]').forEach(el => {
            if (el.querySelector('[class*="service"]')) return; // solo los elementos "hoja", no el contenedor
            const nameEl = el.querySelector('.name, .title');
            const img = el.querySelector('img');
            const name = ((nameEl && nameEl.textContent) || (img && img.getAttribute('alt')) || '').replace(/\s+/g, ' ').trim();
            if (!name || name.length > 40 || seen.has(name.toLowerCase())) return;
            // país del servicio: "Amazon US" y "Google Play Movies AR" son listados distintos; sin marca se asume el del usuario
            const loc = ((el.querySelector('.locale') || {}).textContent || '').trim().toUpperCase();
            raw++;
            if (loc && loc !== AVAIL_COUNTRY) return;
            seen.add(name.toLowerCase()); // después del filtro: "Amazon US" no debe tapar a "Amazon AR"
            // tipo de acceso según los links de opciones: -rent / -buy / disco = no es streaming; cualquier otro = suscripción
            let hasRentBuy = false, hasOther = false;
            el.querySelectorAll('.options a.link').forEach(a => {
                if (/-rent|-buy/.test(a.className)) hasRentBuy = true;
                else if (!/disc|dvd|blu/i.test(a.textContent)) hasOther = true;
            });
            const stream = hasOther ? true : hasRentBuy ? false
                : el.querySelector('[class*="stream"]') ? true : /rent|buy|alquil|compr/i.test((el.querySelector('.options') || {}).textContent || '') ? false : null;
            services.push({ name, stream });
        });
        const out = { ok: true, services, raw, t: Date.now() };
        availCache[slug] = out; saveJSON('lbpr_avail2', availCache);
        return out;
    }

    // Trae portada, promedio, calificaciones y duración de varias pelis, en paralelo
    async function ensureMeta(list, needRuntime) {
        const todo = list.filter(e => !metaFresh(e.slug) || filmMeta[e.slug].failed || filmMeta[e.slug].themePaths === undefined || (needRuntime && filmMeta[e.slug].runtime === undefined));
        let i = 0, done = 0;
        const worker = async id => {
            await sleep(id * 250);
            while (i < todo.length) {
                const e = todo[i++];
                try { const m = await fetchFilmMeta(e.slug); if (m) filmMeta[e.slug] = m; } catch (err) {}
                done++;
                if (done % 5 === 0 || done === todo.length) pickStatus(t('pickMeta', done, todo.length));
                await randomDelay(0.3, 0.7);
            }
        };
        if (todo.length) { await Promise.all(Array.from({ length: isRunning ? 2 : threads() }, (_, id) => worker(id))); saveJSON('lbmf_film_meta', filmMeta); }
    }

    // Botón "Dame una peli" / "Otra": si hace falta corre el algoritmo, y al 50% ya elige una
    async function pick() {
        const o = pickOpts();
        const me = ui.user.value.trim();
        if (!o.films.length) { alert(t('pickNeedFilms')); pickSearchW.focus(); return; }
        pickErr.textContent = '';
        // la misma búsqueda ya está corriendo (ej. tocaste "Otra" antes de que termine): se elige con lo que hay
        if (isRunning) {
            if (runOpts && runOpts.key === o.key) { if (P.fanFilms.size) doPick(); } else alert(t('busy'));
            return;
        }
        if (P.fanFilms.size && P.key === o.key) { doPick(); return; }
        // hay que correr todo el algoritmo con estas pelis
        pickSkip.clear(); pickOut.innerHTML = ''; pickSeen.length = 0; pickPos = -1;
        let picked = false;
        const started = Date.now();
        startTV();
        // a los 40s, si todavía no terminó, se muestra una con lo que haya (si ya se leyeron al menos 10 tops)
        const firstTimer = setInterval(() => {
            if (!picked && isRunning && Date.now() - started >= PICK_FIRST_AFTER * 1000 && P.fanFilms.size >= 10) { picked = true; doPick(); }
        }, 1000);
        const ok = await run(o);
        clearInterval(firstTimer);
        if (ok && !picked && P.fanFilms.size) { picked = true; await doPick(); }
        if (!ok) { stopTV(); pickAnim.style.display = 'none'; pickErr.textContent = statusEl.textContent; }
        else if (!isPicking) pickAnim.style.display = 'none';
    }

    async function doPick() {
        if (isPicking) return;
        isPicking = true; ui.pickBtn.disabled = true; ui.pickBtn.style.opacity = '.6';
        startTV();
        try {
            // candidatas: las del ranking, sin vistas, ocultas ni las que ya salieron
            let cands = [...computeCounts(P, true).values()]
                .filter(e => e.fans >= PICK_MIN_FANS && !hidden.has(e.slug) && !P.watched.has(e.slug) && !pickSkip.has(e.slug))
                .sort((a, b) => b.score - a.score)
                .slice(0, pickKind === 'any' && !shortOpt.input.checked ? 40 : 80);
            // temáticas: hacen falta las de tus pelis y las de las candidatas; después se reordena con el multiplicador
            await ensureMeta([...P.baseFilms.map(f => ({ slug: f[0] })), ...cands], shortOpt.input.checked);
            cands = withThemeBoost(cands, baseProfile(P)).sort((a, b) => b.score - a.score);
            const m = e => filmMeta[e.slug] || {};
            if (shortOpt.input.checked) cands = cands.filter(e => m(e).runtime && m(e).runtime <= SHORT_MAX_MIN);
            let ranked;
            if (pickKind === 'gem') ranked = cands.filter(e => hasPopularity(e.slug)).map(e => Object.assign({}, e, { gem: gemScore(e) })).sort((a, b) => b.gem - a.gem);
            else if (pickKind === 'classic') ranked = cands.filter(e => (m(e).rating || 0) >= 3.9 && (m(e).ratingCount || 0) >= 150000).sort((a, b) => b.score * m(b).rating - a.score * m(a).rating);
            else ranked = cands;
            if (!ranked.length) { pickErr.textContent = t('pickNone'); return; }

            // sorteo entre las mejores 12: las de arriba tienen más chances
            let pool = ranked.slice(0, 12), rest = ranked.slice(12);
            let chosen = null, chosenAv = null, checked = 0, emptyChecks = 0, streamFilter = streamOpt.input.checked;
            while (pool.length && !chosen) {
                const weights = pool.map((_, i) => pool.length - i);
                let r = Math.random() * weights.reduce((a, b) => a + b, 0), idx = 0;
                while ((r -= weights[idx]) > 0) idx++;
                const e = pool.splice(idx, 1)[0];
                if (rest.length) pool.push(rest.shift());
                const name = e.name || slugName(e.slug);
                pickStatus(t('pickChecking', name));
                const av = await fetchAvailability(e.slug);
                checked++;
                if (av.ok && !av.raw) emptyChecks++; // sin ningún servicio en el HTML (no cuenta el filtro por país)
                // si ninguna de las primeras 8 muestra plataformas, seguramente no estamos pudiendo leer la página
                if (streamFilter && checked >= 8 && emptyChecks === checked) { log(t('lgPickParse'), 'var(--yellow)'); streamFilter = false; }
                // solo se descarta si se pudo leer la página y no está en streaming; si la consulta falló, no se sabe: se acepta
                if (streamFilter && av.ok && !av.services.some(s => s.stream !== false)) { log(t('lgPickSkip', name, t('pickNotStreaming'))); pickSkip.add(e.slug); continue; }
                chosen = e; chosenAv = av;
            }
            if (!chosen) { pickErr.textContent = t('pickNone'); return; }
            pickSkip.add(chosen.slug);
            pickCurrent = chosen;
            log(t('lgPick', chosen.name || slugName(chosen.slug), ranked.length), 'var(--green)');
            pickSeen.push({ e: chosen, av: chosenAv }); pickPos = pickSeen.length - 1;
            renderPick(chosen, chosenAv);
        } finally {
            isPicking = false; ui.pickBtn.disabled = false; ui.pickBtn.style.opacity = '1';
            stopTV();
            estimatePick();
        }
    }

    // Muestra una de las pelis que ya salieron (◀ Anterior / Otra hacia adelante)
    function showSeen(i) {
        if (i < 0 || i >= pickSeen.length) return;
        pickPos = i; pickCurrent = pickSeen[i].e;
        renderPick(pickSeen[i].e, pickSeen[i].av);
    }

    function renderPick(e, av) {
        const fm = filmMeta[e.slug] || {};
        const url = `https://letterboxd.com/film/${e.slug}/`;
        const title = (e.name || slugName(e.slug)) + (fm.year && !/\(\d{4}\)$/.test(e.name || '') ? ` (${fm.year})` : '');
        const chip = (txt, col) => h('span', { text: txt, style: `font-size:12px;font-weight:600;padding:4px 9px;border-radius:6px;white-space:nowrap;color:${col};background:${col}1a;border:1px solid ${col}33` });
        const chips = h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }, [
            fm.rating != null ? chip(t('rating', fm.rating.toFixed(2)), '#ff8000') : '',
            fm.runtime ? chip(t('pickRuntime', fm.runtime), '#a1a1aa') : '',
            ...(fm.genres || []).slice(0, 3).map(g => chip(g, '#a1a1aa'))
        ]);
        // dónde verla
        const where = h('div', { style: 'display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;color:var(--muted)' }, h('b', { text: t('pickWhere') + ':', style: 'color:var(--txt2)' }));
        if (av && av.ok && av.services.length) av.services.forEach(s => where.append(h('a', {
            href: url, target: '_blank', text: s.stream === false ? `${s.name} (${t('pickRent')})` : s.name,
            style: `font-size:12px;font-weight:700;padding:4px 10px;border-radius:14px;text-decoration:none;${s.stream === false ? 'background:#27272a;color:#a1a1aa' : 'background:rgba(0,224,84,.12);color:#00e054;border:1px solid rgba(0,224,84,.3)'}`
        })));
        else where.append(h('span', { text: av && av.ok ? t('pickWhereNone') : t('pickWhereUnknown') }), h('a', { href: url, target: '_blank', text: t('pickWhereLink'), style: 'color:var(--blue)' }));

        const poster = h('a', { href: url, target: '_blank', style: 'width:120px;height:180px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#27272a;display:flex;align-items:center;justify-content:center;font-size:34px;box-shadow:0 8px 24px rgba(0,0,0,.5)' },
            fm.poster ? h('img', { src: fm.poster, alt: title, referrerpolicy: 'no-referrer', style: 'width:100%;height:100%;object-fit:cover' }) : '🎬');
        pickOut.innerHTML = '';
        pickOut.append(h('div.pick-result', {}, [
            h('div', { style: 'display:flex;gap:18px;align-items:flex-start' }, [
                poster,
                h('div', { style: 'flex:1;min-width:0;display:flex;flex-direction:column;gap:10px' }, [
                    h('div', { style: 'font-size:12px;font-weight:800;color:var(--green);letter-spacing:.5px', text: t('pickLook').toUpperCase() }),
                    h('a', { href: url, target: '_blank', text: title, style: 'font-size:22px;font-weight:800;color:#fff;text-decoration:none;line-height:1.2' }),
                    chips, where,
                    h('div.pick-actions', {}, [
                        pickPos > 0 ? h('button.pbtn.pbtn-sec', { text: t('pickBack'), onclick: () => showSeen(pickPos - 1) }) : '',
                        // "Otra": si volviste atrás, primero avanza por las que ya viste; al final sortea una nueva
                        h('button.pbtn.pbtn-main', { text: t('pickAgain'), onclick: () => pickPos < pickSeen.length - 1 ? showSeen(pickPos + 1) : pick() }),
                        h('button.pbtn.pbtn-no', { text: t('pickNope'), onclick: () => {
                            hidden.add(e.slug); saveJSON('lbmf_rec_hidden', [...hidden]); renderResults();
                            pickSeen.splice(pickPos, 1); pickPos = pickSeen.length - 1; // la ocultada ya no se puede volver a ver
                            pick();
                        } }),
                        h('a.pbtn.pbtn-sec', { href: url, target: '_blank', text: t('pickOpen') })
                    ])
                ])
            ])
        ]));
        pickOut.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ── Resultados ──
    ui.count = h('div.results-count');
    // Mínimo de fans: stepper
    ui.minFans = h('div.stepper', { 'data-value': '2' });
    // se puede usar − / + o escribir el número a mano
    const minFansVal = h('input', { type: 'number', min: 1, value: 2, 'aria-label': t('optMinFans') });
    minFansVal.addEventListener('input', () => { const v = parseInt(minFansVal.value); if (v >= 1) setMinFans(v, true); });
    // Mientras no lo toques, el mínimo es automático: MIN_FANS_PCT de las personas revisadas (mínimo 2). Ej.: 8.000 personas → 120
    let minFansManual = false;
    const MIN_FANS_PCT = 0.015;
    const autoMinFans = () => Math.max(2, Math.round(MIN_FANS_PCT * R.fanFilms.size));
    minFansVal.addEventListener('blur', () => { minFansVal.value = minFansValue(); });
    const minFansDesc = h('span', { text: t('optMinFansDesc', 2) });
    const setMinFans = (v, typing, auto) => {
        v = Math.max(1, v); ui.minFans.dataset.value = v;
        if (!auto) minFansManual = true;
        if (!typing) minFansVal.value = v; // mientras escribís no se pisa lo que estás tipeando
        minFansDesc.textContent = t('optMinFansDesc', v) + t('minFansAuto', autoMinFans());
        if (!auto) renderResults();
    };
    // ajusta el valor automático según cuánta gente tiene la búsqueda (no re-dibuja: lo llama renderResults)
    const syncAutoMinFans = () => { if (!minFansManual) setMinFans(autoMinFans(), false, true); else minFansDesc.textContent = t('optMinFansDesc', minFansValue()) + t('minFansAuto', autoMinFans()); };
    ui.minFans.append(h('button', { text: '−', onclick: () => setMinFans(minFansValue() - 1) }), minFansVal, h('button', { text: '+', onclick: () => setMinFans(minFansValue() + 1) }));
    const minFansOpt = h('div.opt.on', { style: 'cursor:default' }, [h('div.opt-txt', {}, [h('b', { text: t('optMinFans') }), minFansDesc]), ui.minFans]);

    const gemsOpt = mkOpt(t('optGems'), t('optGemsDesc'), localStorage.getItem('lbmf_rec_gems') === '1');
    ui.gemsCB = gemsOpt.input;
    ui.gemsCB.addEventListener('change', () => localStorage.setItem('lbmf_rec_gems', ui.gemsCB.checked ? '1' : '0'));
    const themesOpt = mkOpt(t('optThemes'), t('optThemesDesc'), localStorage.getItem('lbmf_rec_themes') !== '0');
    ui.themesCB = themesOpt.input;
    ui.themesCB.addEventListener('change', () => localStorage.setItem('lbmf_rec_themes', ui.themesCB.checked ? '1' : '0'));
    const watchedOpt = mkOpt(t('optWatched'), t('optWatchedDesc'), false);
    ui.watchedCB = watchedOpt.input;
    ui.affMin = h('input.input', { type: 'number', min: 2, max: 20, value: 2, style: 'width:60px' });
    ui.affMode = h('select.select', {}, [h('option', { value: 'boost', text: t('affBoost') }), h('option', { value: 'only', text: t('affOnly') })]);
    ui.affInfo = h('div.hint', { style: 'width:100%;margin-top:2px' });
    const affExtra = h('div.opt-extra', {}, [h('span', { style: 'font-size:11px;color:var(--muted)', text: t('affMin') }), ui.affMin, h('span', { style: 'font-size:11px;color:var(--muted)', text: t('affMinSuffix') }), ui.affMode, ui.affInfo]);
    const affOpt = mkOpt(t('optAff'), t('optAffDesc'), false, affExtra);
    ui.affCB = affOpt.input;

    ui.list = h('div.rec-list');
    const logEl = h('div.log');
    const logFold = h('details.fold.fold-inline', { style: 'margin-top:14px;display:none' }, [h('summary', { text: t('log') }), h('div.fold-body', {}, logEl)]);
    let lastLogAt = 0;
    function log(msg, color) {
        lastLogAt = Date.now();
        if (isRunning || isPicking) popLast.textContent = msg.trim(); // la última línea también se ve debajo del balde
        logFold.style.display = 'block';
        logEl.append(h('div', { style: `color:${color || 'var(--dim)'}`, text: `[${new Date().toLocaleTimeString()}] ${msg}` }));
        logEl.scrollTop = logEl.scrollHeight;
    }

    // Subpestañas de resultados: recomendadas por fans / llegadas solo por temática
    let resTab = 'fans';
    ui.resTabs = h('div.tabs', { style: 'margin:12px 0' }, ['fans', 'themes'].map(k => h('button', { 'data-k': k, onclick: () => { resTab = k; renderResults(); } })));
    const resultsCard = h('section.card', {}, [
        h('div.results-head', {}, [h('h2', { text: t('resultsTitle') }), h('div.row', {}, [histBtn, h('button.btn-sm', { text: t('export'), onclick: exportTxt })])]),
        histPanel,
        h('div.adjust', {}, [
            h('div.adjust-h', { html: `${esc(t('adjust'))}<span>· ${esc(t('adjustHint'))}</span>` }),
            h('div.opts', {}, [minFansOpt, gemsOpt.opt, themesOpt.opt, watchedOpt.opt, affOpt.opt])
        ]),
        ui.resTabs, ui.count, ui.list, logFold
    ]);
    recTab.append(resultsCard);
    [ui.gemsCB, ui.themesCB, ui.watchedCB, ui.affCB, ui.affMin, ui.affMode].forEach(el => el.addEventListener('change', renderResults));

    // ══════════════ Balde de pochoclos ══════════════
    const POP_PHASES = { base: [0, 5, 'popBase'], watched: [5, 12, 'popWatched'], fans: [12, 35, 'popFans'], favs: [35, 100, 'popFavs'] };
    let popTimer = null, popNow = 0, popQuiet = false;
    function spawnKernel() {
        const k = h('div.corn.kernel', { style: `left:${18 + Math.random() * 50}%;transform:scale(${0.8 + Math.random() * 0.5})` });
        k.style.setProperty('--dx', `${Math.round(Math.random() * 56 - 28)}px`);
        bucket.append(k); setTimeout(() => k.remove(), 1200);
    }
    function setPop(ph, frac = 0) {
        const [from, to, key] = POP_PHASES[ph];
        popNow = Math.max(popNow, from + (to - from) * Math.min(1, Math.max(0, frac)));
        popFill.style.height = `${popNow}%`; popPct.textContent = `${Math.round(popNow)}%`;
        popStage.textContent = popQuiet ? t('pickPicking') : t(key);
    }
    function startPop() {
        popNow = 0; pop.style.display = 'flex'; popTop.classList.remove('on');
        bucket.classList.add('running');
        clearInterval(popTimer); popTimer = setInterval(spawnKernel, 380);
        setPop('base');
    }
    function stopPop(result) { // 'done' | 'stopped' | 'error'
        clearInterval(popTimer); popTimer = null; bucket.classList.remove('running');
        if (result === 'done') {
            popNow = 100; popFill.style.height = '100%'; popPct.textContent = '100%';
            popTop.classList.add('on');
            for (let i = 0; i < 6; i++) setTimeout(spawnKernel, i * 90);
            popStage.textContent = t('popDone');
        } else popStage.textContent = t(result === 'stopped' ? 'popStopped' : 'popError');
    }

    // ══════════════ Historial ══════════════
    function renderHistory() {
        histBtn.textContent = t('histBtn', history.length);
        histList.innerHTML = '';
        if (!history.length) { histList.append(h('div.hint', { style: 'margin-top:0', text: t('histEmpty') })); return; }
        history.forEach(it => {
            const on = it.id === historyCurrent;
            const names = it.baseNames.slice(0, 3).join(', ') + (it.baseNames.length > 3 ? ` +${it.baseNames.length - 3}` : '');
            histList.append(h(`div.hist-row${on ? '.on' : ''}`, {}, [
                h('div', {}, [
                    h('b', { text: `${t('histSrc')[it.source] || ''}${it.who ? ` @${it.who}` : ''} · ${names}` }),
                    h('span', { text: `${fmtDate(it.t)} · ${t('histMeta', fmtNum(it.fans), fmtNum(it.films))}${it.partial ? ` · ${t('histPartial')}` : ''}` })
                ]),
                h('button.btn-sm', { text: on ? t('histViewing') : t('histView'), onclick: () => loadHistory(it.id) }),
                h('button.btn-ghost', {
                    text: '🗑', title: t('histDel'),
                    onclick: async () => {
                        history = history.filter(x => x.id !== it.id);
                        await store.set('history', history); await store.remove('hist:' + it.id);
                        renderHistory();
                    }
                })
            ]));
        });
    }

    async function saveHistory(ctx, src, partial, who) {
        if (!ctx.fanFilms.size) return;
        const id = String(Date.now());
        await store.set('hist:' + id, {
            favs: ctx.baseFilms, fanFilms: [...ctx.fanFilms], fanFives: [...ctx.fanFives], fanHalves: [...ctx.fanHalves], themeFilms: [...ctx.themeFilms], fanWeight: [...ctx.fanShared],
            fanBases: [...ctx.fanBases].map(([u, b]) => [u, [...b]]), watched: [...ctx.watched]
        });
        history = [{ id, t: Date.now(), source: src, who, partial, baseNames: ctx.baseFilms.map(f => f[1] || slugName(f[0])), fans: ctx.fanFilms.size, films: computeCounts(ctx, true).size }, ...history];
        for (const old of history.slice(HISTORY_MAX)) await store.remove('hist:' + old.id);
        history = history.slice(0, HISTORY_MAX);
        await store.set('history', history);
        historyCurrent = id; localStorage.setItem('lbpr_last_hist', id);
        renderHistory();
    }

    async function loadHistory(id, quiet) {
        if (isRunning) { alert(t('busy')); return; }
        const data = await store.get('hist:' + id);
        if (!data) { if (!quiet) alert(t('histMissing')); return; }
        R.baseFilms = data.favs; R.baseSlugs = new Set(R.baseFilms.map(f => f[0]));
        R.fanFilms = new Map(data.fanFilms); R.fanFives = new Map(data.fanFives || []); R.fanHalves = new Map(data.fanHalves || []); R.themeFilms = new Map(data.themeFilms || []); R.fanShared = new Map(data.fanWeight); R.watched = new Set(data.watched);
        R.fanBases = new Map((data.fanBases || []).map(([u, b]) => [u, new Set(b)]));
        minFansManual = false;
        expanded.clear();
        historyCurrent = id; localStorage.setItem('lbpr_last_hist', id);
        R.key = null;
        const it = history.find(x => x.id === id);
        if (!quiet) { status(t('stHistory', it ? fmtDate(it.t) : '')); histPanel.style.display = 'none'; resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        renderHistory(); renderResults();
    }

    // ══════════════ "¿Por qué?": explicación gráfica ══════════════
    const WHY_COLORS = ['#00e054', '#40bcf4', '#ff8000', '#a78bfa', '#f43f5e', '#fbbf24', '#22d3ee', '#f472b6'];
    const matchTitle = m => m ? [...m.exact.map(([p]) => humanize(p.split('/')[1])), ...m.words.map(([w]) => w)].join(' · ') : '';
    const baseName = slug => { const f = R.baseFilms.find(x => x[0] === slug); return (f && f[1]) || slugName(slug); };
    // De qué pelis base es fan cada persona (en búsquedas viejas no se guardaba: se deduce de su top 4)
    const basesOf = (u, films) => R.fanBases.get(u) || new Set(films.filter(([slug]) => R.baseSlugs.has(slug)).map(([slug]) => slug));

    function buildWhy(e) {
        const box = h('div', { style: 'margin-top:10px;padding:14px;background:rgba(24,24,27,.9);border:1px solid var(--line2);border-radius:10px;display:flex;flex-direction:column;gap:14px;' });
        const voters = [];
        R.fanFilms.forEach((films, u) => {
            const has = l => (l || []).some(([slug]) => slug === e.slug);
            const k = has(films) ? 1 : has(R.fanFives.get(u)) ? FIVE_WEIGHT : has(R.fanHalves.get(u)) ? HALF_WEIGHT : 0;
            if (!k) return;
            const shared = R.fanShared.get(u) || 1;
            const { w, affine } = fanWeightFor(shared);
            if (w > 0) voters.push({ u, shared, src: k === 1 ? 'top' : k === FIVE_WEIGHT ? 'five' : 'half', w: w * k, affine, bases: basesOf(u, films) });
        });
        voters.sort((a, b) => b.w - a.w || a.u.localeCompare(b.u));
        const filmName = e.name || slugName(e.slug);

        // 1) Frase resumen
        const perBase = new Map();
        voters.forEach(v => v.bases.forEach(b => perBase.set(b, (perBase.get(b) || 0) + 1)));
        const topBases = [...perBase.entries()].sort((a, b) => b[1] - a[1]);
        const affineCount = voters.filter(v => v.affine).length;
        const tops = topBases.slice(0, 2).map(([b, n]) => `<b>${esc(baseName(b))}</b> (${n})`).join(t('and'));
        box.append(h('div', {
            style: 'font-size:13px;color:var(--txt2);line-height:1.6',
            html: t('whySummary', voters.length, esc(filmName), tops, affineCount).replace('class="g"', 'style="color:var(--green)"').replace('class="v"', 'style="color:var(--violet)"')
        }));

        // 2) Diagrama de flujo: tus pelis base → la recomendada (grosor = cantidad de fans)
        if (topBases.length) {
            const shown = topBases.slice(0, 7), others = topBases.slice(7);
            if (others.length) shown.push(['__others__', others.reduce((n, [, c]) => n + c, 0)]);
            const total = shown.reduce((n, [, c]) => n + c, 0);
            const W = 600, gap = 8, avail = Math.max(120, shown.length * 30);
            const hs = shown.map(([, c]) => Math.max(16, (c / total) * avail));
            const sumH = hs.reduce((a, b) => a + b, 0), H = sumH + gap * (shown.length - 1);
            const lx = 170, lw = 14, rx = 390, rw = 14;
            const rTop = 4 + (H - sumH) / 2;
            let yL = 4, yR = rTop;
            let svg = `<svg viewBox="0 0 ${W} ${H + 8}" width="100%" style="display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">`;
            shown.forEach(([b, c], i) => {
                const hh = hs[i], col = b === '__others__' ? '#52525b' : WHY_COLORS[i % WHY_COLORS.length];
                const label = b === '__others__' ? t('moreFilms', others.length) : cut(baseName(b), 24);
                const x0 = lx + lw, x1 = rx, mx = (x0 + x1) / 2;
                svg += `<path d="M${x0},${yL} C${mx},${yL} ${mx},${yR} ${x1},${yR} L${x1},${yR + hh} C${mx},${yR + hh} ${mx},${yL + hh} ${x0},${yL + hh} Z" fill="${col}" fill-opacity=".28" stroke="${col}" stroke-opacity=".5"/>`;
                svg += `<rect x="${lx}" y="${yL}" width="${lw}" height="${hh}" rx="3" fill="${col}"/>`;
                svg += `<text x="${lx - 8}" y="${yL + hh / 2}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="#e4e4e7" font-weight="600">${esc(label)}</text>`;
                svg += `<text x="${mx}" y="${(yL + yR) / 2 + hh / 2}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#fff" font-weight="700">${c} ${t('fanWord', c)}</text>`;
                yL += hh + gap; yR += hh;
            });
            svg += `<rect x="${rx}" y="${rTop}" width="${rw}" height="${sumH}" rx="3" fill="#fff"/>`;
            const fm = filmMeta[e.slug], px = rx + rw + 10, pw = 60, ph = 90, py = Math.max(0, rTop + sumH / 2 - ph / 2);
            svg += fm && fm.poster
                ? `<image href="${esc(fm.poster)}" x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice" style="clip-path:inset(0 round 5px)"/>`
                : `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="5" fill="#27272a"/><text x="${px + pw / 2}" y="${py + ph / 2}" text-anchor="middle" dominant-baseline="middle" font-size="20">🎬</text>`;
            svg += `<text x="${px + pw + 8}" y="${py + ph / 2 - 8}" font-size="12" fill="#fff" font-weight="700">${esc(cut(filmName, 17))}</text>`;
            svg += `<text x="${px + pw + 8}" y="${py + ph / 2 + 10}" font-size="11" fill="#71717a">${esc(t('recommended'))}</text>`;
            svg += `<text x="${lx + lw / 2}" y="${H + 22}" text-anchor="middle" font-size="10" fill="#52525b">${esc(t('yourFilms'))}</text></svg>`;
            box.append(h('div', { style: 'padding:4px 0 14px', html: svg }));
        }

        // 2b) Qué temáticas comparte con tus pelis
        if (e.tmatch && (e.tmatch.exact.length || e.tmatch.words.length)) {
            const kind = p => t('kind' + p.split('/')[0]);
            const from = bases => bases.map(baseName).join(', ');
            const lines = [
                ...e.tmatch.exact.map(([p, bs]) => `<b>${esc(kind(p))}:</b> ${esc(humanize(p.split('/')[1]))} <span style="color:var(--faint)">← ${esc(from(bs))}</span>`),
                ...e.tmatch.words.slice(0, KW_MAX).map(([w, bs]) => `<b>${esc(t('kindword'))}:</b> ${esc(w)} <span style="color:var(--faint)">← ${esc(from(bs))}</span>`)
            ];
            box.append(h('div', { style: 'font-size:12px;color:var(--muted);display:flex;flex-direction:column;gap:4px' }, [h('b', { text: t('whyMatchTitle'), style: 'color:var(--txt2)' }), h('div', { style: 'display:flex;flex-direction:column;gap:3px', html: lines.join('<br>') })]));
        }

        // 3) Desglose del score: una fila por grupo de personas (de dónde la sacan y cuántas de tus pelis comparten)
        const groups = new Map();
        voters.forEach(v => {
            const key = `${v.src}|${v.shared}|${v.affine}`;
            const g = groups.get(key) || { n: 0, w: v.w, src: v.src, shared: v.shared, affine: v.affine };
            g.n++; groups.set(key, g);
        });
        const chip = (txt, col) => `<span style="padding:4px 9px;border-radius:6px;font-weight:600;background:${col}1a;color:${col};border:1px solid ${col}40">${txt}</span>`;
        const num = x => +x.toFixed(2);
        const rows = [...groups.values()].sort((a, b) => b.n * b.w - a.n * a.w).map(g => {
            const label = t('whyRow' + g.src, g.n) + (g.shared > 1 ? ' ' + t('whyShared', g.n, g.shared) : '') + (g.affine ? ' 🎯' : '');
            return [label, `${g.n} × ${num(g.w)} = ${num(g.n * g.w)}`, g.affine ? '#a78bfa' : '#40bcf4'];
        });
        const lst = ui.themesCB.checked ? R.themeFilms.get(e.slug) : null;
        if (lst) rows.push([t('whyThemeLists', lst.lists || 1), `+${num(THEME_SRC_WEIGHT * lst.n)}`, '#f472b6']);
        const rowsHtml = rows.map(([label, val, col]) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span>${esc(label)}</span>${chip(val, col)}</div>`).join('');
        let scoreHtml = `<b style="color:var(--txt2)">${t('whyScore')}</b>`;
        if (e.themeEff) {
            // el multiplicador por temáticas: votos × (según las temáticas en común) = score final
            const mult = e.themeEff;
            scoreHtml += `${chip(num(e.score / mult), '#a1a1aa')}<span>×</span>${chip(t('whyThemes', num(mult), e.themes, e.words), '#f472b6')}<span>=</span>`;
        }
        scoreHtml += chip(t('score', +e.score.toFixed(1)), '#00e054');
        if (e.gem != null) scoreHtml += `<span>${esc(t('whyGem', fmtNum((filmMeta[e.slug] || {}).ratingCount || 0)))}</span>${chip(t('gemScore', e.gem), '#a78bfa')}`;
        box.append(h('div', { style: 'display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--muted)', html: rowsHtml }),
            h('div', { style: 'display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;color:var(--muted);border-top:1px solid var(--line2);padding-top:10px', html: scoreHtml }),
            h('div', { style: 'font-size:11px;color:var(--faint);margin-top:-8px', text: t(ui.affCB.checked ? 'whyHintAff' : 'whyHint') }));

        // 4) Los fans que la votaron
        const fansEl = h('div', { style: 'display:flex;flex-wrap:wrap;gap:5px;max-height:120px;overflow-y:auto' });
        voters.slice(0, 80).forEach(v => fansEl.append(h('a', {
            href: `https://letterboxd.com/${v.u}/`, target: '_blank',
            text: `${v.affine ? '🎯 ' : ''}${v.u}${v.shared > 1 ? ` · ${t('inCommon', v.shared)}` : ''}`,
            title: `${t('fanOf')}: ${[...v.bases].map(baseName).join(', ') || '—'}`,
            style: `font-size:11px;padding:3px 8px;border-radius:12px;text-decoration:none;white-space:nowrap;background:${v.affine ? 'rgba(167,139,250,.12)' : '#27272a'};color:${v.affine ? '#c4b5fd' : '#d4d4d8'};border:1px solid ${v.affine ? 'rgba(167,139,250,.3)' : '#3f3f46'}`
        })));
        if (voters.length > 80) fansEl.append(h('span', { style: 'font-size:11px;color:var(--faint);padding:3px', text: t('moreN', voters.length - 80) }));
        box.append(h('div', { style: 'font-size:11px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px', text: t('whoVoted', voters.length) }), fansEl);
        return box;
    }

    // ══════════════ Render de resultados ══════════════
    function renderResults() {
        syncAutoMinFans();
        const all = getResults();
        const nThemes = all.filter(e => !e.fans).length;
        ui.resTabs.querySelectorAll('button').forEach(b => {
            const k = b.dataset.k;
            b.textContent = t(k === 'fans' ? 'resTabFans' : 'resTabThemes', k === 'fans' ? all.length - nThemes : nThemes);
            b.classList.toggle('on', k === resTab);
        });
        const items = all.filter(e => resTab === 'themes' ? !e.fans : e.fans > 0);
        const gemsOn = ui.gemsCB.checked;
        ui.affInfo.textContent = R.fanShared.size ? affinitySummary() : t('affPending');
        ui.count.textContent = t('count', items.length);
        ui.list.innerHTML = '';
        if (gemsOn && gemsPending.length) {
            // durante la búsqueda, las primeras 100 pendientes; al terminar, todas
            wantMeta([...items.slice(0, 40).map(e => e.slug), ...gemsPending.slice(0, isRunning ? 100 : Infinity).map(e => e.slug)]);
            ui.list.append(h('div.note', { text: t('gemsPending', gemsTotal - gemsPending.length, gemsTotal) }));
        }
        if (!items.length) { ui.list.append(h('div.empty', { text: t(resTab === 'themes' && R.fanFilms.size ? 'emptyThemes' : R.fanFilms.size ? 'emptyNone' : 'emptyStart') })); return; }
        if (resTab === 'themes') ui.list.append(h('div.note', { text: t('themesTabHint') }));
        const shown = items.slice(0, 150);
        // portada y promedio: durante la búsqueda solo las primeras 40, al terminar todas las visibles
        if (!(gemsOn && gemsPending.length)) wantMeta(shown.slice(0, isRunning ? 40 : 150).map(e => e.slug));
        const scoreOf = e => gemsOn ? e.gem : e.score;
        const maxScore = Math.max(1, scoreOf(items[0]));
        const chip = (txt, col, bg, title) => h('span', { text: txt, title, style: `font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;white-space:nowrap;color:${col};background:${bg}` });

        shown.forEach((e, i) => {
            const fm = filmMeta[e.slug];
            const url = `https://letterboxd.com/film/${e.slug}/`;
            const open = expanded.has(e.slug);
            const poster = h('a', { href: url, target: '_blank', style: 'width:52px;height:78px;border-radius:5px;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,#27272a,#18181b);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.4)' });
            if (fm && fm.poster) poster.append(h('img', { src: fm.poster, alt: e.name || e.slug, loading: 'lazy', referrerpolicy: 'no-referrer', style: 'width:100%;height:100%;object-fit:cover' }));
            else poster.textContent = '🎬';

            const chips = h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' });
            chips.append(chip(fm ? (fm.rating != null ? t('rating', fm.rating.toFixed(2)) : t('noRating')) : '★ …', '#ff8000', 'rgba(255,128,0,.1)', fm && fm.ratingCount ? t('votesTitle', fm.ratingCount.toLocaleString()) : null));
            chips.append(e.fans ? chip(t('fansCommon', e.fans, e.affine), '#40bcf4', 'rgba(64,188,244,.1)') : chip(t('themeOnly'), '#f472b6', 'rgba(244,114,182,.1)', t('themeOnlyTitle')));
            if (gemsOn) {
                chips.append(chip(t('gemScore', e.gem), '#a78bfa', 'rgba(167,139,250,.12)', t('rawScore', +e.score.toFixed(1))));
                if (fm && fm.ratingCount) chips.append(chip(t('votes', fmtNum(fm.ratingCount)), '#a1a1aa', 'rgba(161,161,170,.1)'));
            } else chips.append(chip(t('score', +e.score.toFixed(1)), '#00e054', 'rgba(0,224,84,.1)'));
            if (e.themeEff) chips.append(chip(t('themeMatch', e.themes, e.words), '#f472b6', 'rgba(244,114,182,.1)', matchTitle(e.tmatch)));
            if (R.watched.has(e.slug)) chips.append(chip(t('seen'), '#a1a1aa', 'rgba(161,161,170,.1)'));

            const title = (e.name || slugName(e.slug)) + (fm && fm.year && !/\(\d{4}\)$/.test(e.name || '') ? ` (${fm.year})` : '');
            const info = h('div', { style: 'flex:1;min-width:0;display:flex;flex-direction:column;gap:6px' }, [
                h('a', { href: url, target: '_blank', text: title, style: 'color:#fff;font-weight:700;font-size:14px;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }),
                chips,
                h('div', { style: 'height:3px;background:#27272a;border-radius:2px' }, h('div', { style: `height:100%;width:${(scoreOf(e) / maxScore) * 100}%;background:linear-gradient(90deg,#40bcf4,#00e054);border-radius:2px` }))
            ]);
            const why = !e.fans ? '' : h('button', {
                text: open ? t('whyClose') : t('why'),
                style: `padding:4px 9px;background:${open ? 'rgba(251,191,36,.15)' : '#27272a'};color:${open ? '#fbbf24' : '#e4e4e7'};border:1px solid ${open ? 'rgba(251,191,36,.4)' : '#3f3f46'};border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;flex-shrink:0;align-self:flex-start;white-space:nowrap`,
                onclick: () => { open ? expanded.delete(e.slug) : expanded.add(e.slug); renderResults(); }
            });
            const hide = h('button.btn-ghost', { text: '✕', title: t('hide'), style: 'align-self:flex-start', onclick: () => { hidden.add(e.slug); saveJSON('lbmf_rec_hidden', [...hidden]); renderResults(); } });
            const rank = h('span', { text: i + 1, style: `width:24px;text-align:right;font-size:${i < 3 ? 15 : 12}px;font-weight:${i < 3 ? 800 : 500};color:${i < 3 ? '#00e054' : '#52525b'};font-variant-numeric:tabular-nums;flex-shrink:0` });
            const row = h('div', { style: 'display:flex;align-items:center;gap:12px' }, [rank, poster, info, why, hide].filter(Boolean));
            ui.list.append(h('div', {
                style: `padding:8px 10px;background:rgba(9,9,11,.6);border:1px solid ${open ? '#fbbf2466' : '#27272a'};border-radius:10px`
            }, open ? [row, buildWhy(e)] : row));
        });
    }

    function exportTxt() {
        const items = getResults();
        if (!items.length) return;
        let txt = `Letterboxd Pelis Recommendation – ${t('exHeader')}\n${t('exBase')}: ${R.baseFilms.map(f => f[1] || slugName(f[0])).join(', ')}\n${t('exDate')}: ${new Date().toLocaleString(t('dateLocale'))}\n${'='.repeat(40)}\n\n`;
        items.forEach((e, i) => { txt += t('exLine', i + 1, e.name || slugName(e.slug), e.fans, e.score, e.gem, `https://letterboxd.com/film/${e.slug}/`) + '\n'; });
        const a = h('a', { href: URL.createObjectURL(new Blob([txt], { type: 'text/plain' })), download: `recomendaciones-${Date.now()}.txt` });
        a.click();
    }

    // ══════════════ Búsqueda ══════════════
    function onStop() {
        if (phase === 'fans' && !skipFans) {
            // primer toque mientras junta fans: sigue con los que ya tiene
            skipFans = true; ui.stopBtn.textContent = t('stopAll'); log(t('lgSkip'), 'var(--yellow)');
        } else stopReq = true;
    }

    let runOpts = null; // opciones de la búsqueda que está corriendo
    async function run(opts) {
        if (isRunning) return false;
        opts = opts || searchOpts();
        const me = ui.user.value.trim();
        if (opts.slot === 'search' && opts.src === 'films') { alert(t('recNeedFilms')); recSearchW.focus(); return false; } // "sin perfil" sin pelis elegidas
        if (opts.slot === 'search' && !me && !(opts.films && opts.films.length)) { alert(t('needUser')); ui.user.focus(); return false; }
        const who = opts.who || me;                        // de quién se toman favoritas o puntuadas
        const excluded = new Set([me, who].filter(Boolean)); // ni vos ni el dueño del perfil cuentan como "gente con tu gusto"
        isRunning = true; stopReq = false; skipFans = false;
        // el balde y el botón de detener se muestran en la pestaña desde donde se lanzó
        const slotBtn = opts.slot === 'pick' ? ui.pickBtn : ui.startBtn;
        runOpts = opts;
        popQuiet = opts.slot === 'pick';
        pop.classList.toggle('quiet', popQuiet);
        if (popQuiet) { pickStop.append(ui.stopBtn); pickAnim.style.display = 'flex'; }
        else searchSlot.append(ui.stopBtn, pop, statusEl);
        slotBtn.style.display = 'none'; ui.stopBtn.style.display = 'block'; ui.stopBtn.textContent = t('stop');
        startPop();
        const ctx = opts.slot === 'pick' ? P : R; // cada pestaña llena su propio contexto
        ctx.key = null;
        let ok = false;
        ctx.fanFilms = new Map(); ctx.fanShared = new Map(); ctx.fanBases = new Map(); ctx.fanFives = new Map(); ctx.fanHalves = new Map(); ctx.themeFilms = new Map();
        if (ctx === R) { minFansManual = false; expanded.clear(); historyCurrent = null; renderHistory(); renderResults(); }
        const noCache = !!opts.noCache;
        if (noCache) log(t('lgNoCache'), 'var(--yellow)');
        let src = opts.src;
        phase = 'base';
        // si pasan varios segundos sin novedades, se avisa que sigue vivo (o cuánto falta para reanudar si Letterboxd frenó)
        const heartbeat = setInterval(() => {
            if (Date.now() - lastLogAt < 7000) return;
            const wait = Math.ceil((rateLimitUntil - Date.now()) / 1000);
            log(wait > 0 ? t('lgHbWait', wait) : t('lgHb', t(POP_PHASES[phase] ? POP_PHASES[phase][2] : 'popBase'), inFlight), 'var(--faint)');
        }, 3000);
        try {
            // 1) Pelis de partida: a mano, una lista de Letterboxd, o las favoritas / mejor puntuadas de un perfil
            let favs = opts.films || [];
            const maxBase = opts.maxBase || 20;
            if (favs.length) { src = 'manual'; log(t('lgManual', favs.length), 'var(--blue)'); }
            else if (opts.listPath) {
                favs = [...(await fetchFilmGrid(opts.listPath, p => { status(t('stReadingList', p)); log(t('lgPages', t('wList'), p)); }))];
                if (favs.length > maxBase) { log(t('lgTrim', maxBase, favs.length), 'var(--yellow)'); favs = favs.slice(0, maxBase); }
                if (!favs.length) throw new Error(t('errNoList'));
            } else if (src === 'rated') {
                favs = await fetchTopRated(who, (r, p) => { status(t('stReadingRated', r, p)); log(t('lgPages', t('wRated', r), p)); });
                if (favs.length > maxBase) { log(t('lgTrim', maxBase, favs.length), 'var(--yellow)'); favs = favs.slice(0, maxBase); }
                if (!favs.length) throw new Error(who === me ? t('errNoRated') : t('errNoRatedOf', who));
            } else {
                status(t('stReadingFavs'));
                favs = ((await fetchUserFavorites(who, true)) || {}).films || [];
                if (!favs.length) throw new Error(who === me ? t('errNoFavs') : t('errNoFavsOf', who));
            }
            if (stopReq) throw new Error(t('errStopped'));
            ctx.baseFilms = favs; ctx.baseSlugs = new Set(favs.map(f => f[0]));
            log(t('lgBase', favs.length, favs.map(f => f[1] || slugName(f[0])).join(', ')), 'var(--blue)');

            // 2) Tus vistas
            setPop('watched'); phase = 'watched';
            ctx.watched = me ? await fetchWatched(me, p => { status(t('stWatched', p)); log(t('lgPages', t('wWatched'), p)); }, noCache) : new Set();
            log(t('lgWatched', ctx.watched.size), 'var(--blue)');
            if (stopReq) throw new Error(t('errStopped'));

            // 3) Fans de cada peli base, varias pelis a la vez
            setPop('fans', 0);
            phase = 'fans';
            const maxFans = opts.perFilm || 50;
            let nextFilm = 0, filmsDone = 0, fromCache = 0;
            async function fanWorker(id) {
                await sleep(id * 300);
                while (nextFilm < favs.length && !stopReq && !skipFans) {
                    const [slug, name] = favs[nextFilm++];
                    const label = name || slugName(slug);
                    const users = new Set();
                    const cacheKey = 'fans:' + slug;
                    const cf = noCache ? null : await store.get(cacheKey);
                    const cfFresh = !!cf && Date.now() - cf.t < FANS_TTL;
                    if (cfFresh && (cf.complete || cf.users.length >= maxFans)) {
                        // alcanza con lo guardado: no se consulta nada
                        for (const u of cf.users) { if (users.size >= maxFans) break; if (!excluded.has(u)) users.add(u); }
                        fromCache++;
                    } else {
                        // Si hay una lista guardada pero corta (ej. 500 y ahora piden 1000), se sigue desde la última
                        // página leída. Esa página se relee porque pudo haber quedado cortada; los repetidos se descartan solos.
                        let complete = false, lastPage = 0, startPage = 1;
                        const resume = cfFresh && cf.lastPage > 0;
                        if (resume) {
                            for (const u of cf.users) if (!excluded.has(u)) users.add(u);
                            startPage = lastPage = cf.lastPage;
                            log(t('lgResume', label, users.size, startPage));
                        }
                        for (let p = startPage; users.size < maxFans && !stopReq && !skipFans; p++) {
                            const r = await fetchUsersPage(`https://letterboxd.com/film/${slug}/fans/`, p);
                            if (r.users.length) lastPage = p;
                            for (const u of r.users) { if (users.size >= maxFans) break; if (!excluded.has(u)) users.add(u); }
                            log(t('lgFansPage', label, p, r.users.length, users.size, maxFans));
                            if (!r.hasNext) { complete = r.users.length > 0; break; } // página vacía = falló la consulta, no "completa"
                            if (maxFans === Infinity && p % 10 === 0) status(t('stFansAll', label, users.size, p));
                            await sleep(600 + Math.random() * 500);
                        }
                        // se guarda si trae más fans que lo que había (al continuar se conserva la fecha original)
                        if (!cf || users.size >= cf.users.length || complete)
                            store.set(cacheKey, { users: [...users], complete, lastPage, t: resume ? cf.t : Date.now() });
                    }
                    users.forEach(u => {
                        ctx.fanShared.set(u, (ctx.fanShared.get(u) || 0) + 1);
                        if (!ctx.fanBases.has(u)) ctx.fanBases.set(u, new Set());
                        ctx.fanBases.get(u).add(slug);
                    });
                    filmsDone++;
                    setPop('fans', filmsDone / favs.length);
                    status(t('stFans', filmsDone, favs.length));
                    log(t('lgFansOf', label, users.size), 'var(--blue)');
                    await sleep(400 + Math.random() * 400);
                }
            }
            await Promise.all(Array.from({ length: threads() }, (_, i) => fanWorker(i)));
            log(t('lgFansTotal', ctx.fanShared.size, fromCache), 'var(--blue)');
            if (!ctx.fanShared.size) throw new Error(t('errNoFans'));

            // 4) El top 4 de cada fan, en paralelo
            phase = 'favs'; ui.stopBtn.textContent = t('stop');
            setPop('favs', 0);
            const fans = [...ctx.fanShared.keys()];
            let next = 0, done = 0, failed = 0, cachedN = 0;
            const favsStart = Date.now();
            let fetchedN = 0;
            async function favWorker(id) {
                await sleep(id * 400);
                while (next < fans.length && !stopReq) {
                    const u = fans[next++];
                    const fr = await fetchUserFavorites(u, noCache, !!opts.withFives);
                    if (fr) {
                        ctx.fanFilms.set(u, fr.films);
                        if (fr.fives.length) ctx.fanFives.set(u, fr.fives);
                        if (fr.halves.length) ctx.fanHalves.set(u, fr.halves);
                        // pelis en común reales: las que tiene en su top 4 (pudo aparecer en menos listas de fans
                        // de las que corresponde, porque de cada peli solo se toma una parte de sus fans)
                        const bs = ctx.fanBases.get(u) || new Set();
                        fr.films.forEach(([slug]) => { if (ctx.baseSlugs.has(slug)) bs.add(slug); });
                        ctx.fanBases.set(u, bs);
                        if (bs.size > (ctx.fanShared.get(u) || 0)) ctx.fanShared.set(u, bs.size);
                    } else failed++;
                    done++;
                    if (fr && fr.cached) cachedN++; else fetchedN++;
                    setPop('favs', done / fans.length);
                    if (opts.onProgress) opts.onProgress('favs', done / fans.length, done);
                    status(t('stFavs', done, fans.length));
                    if (done % 20 === 0 || done === fans.length) {
                        const rate = done / Math.max(1, (Date.now() - favsStart) / 1000);
                        log(t('lgFavsProgress', done, fans.length, rate.toFixed(1), t('eta', (fans.length - done) / rate), cachedN));
                    }
                    if (done % 5 === 0 && ctx === R) scheduleRender();
                    if (!(fr && fr.cached)) await randomDelay(0.8, 1.6);
                }
            }
            await Promise.all(Array.from({ length: threads() }, (_, i) => favWorker(i)));
            if (fetchedN >= 30) {
                const rate = fetchedN / ((Date.now() - favsStart) / 1000) / threads();
                localStorage.setItem('lbpr_rate', String(Math.min(2, Math.max(0.1, measuredRate() * 0.6 + rate * 0.4)).toFixed(3)));
            }
            if (ctx === R && !stopReq) { phase = 'themes'; status(t('stThemes')); try { await gatherThemeFilms(ctx); } catch (e) { console.error(e); } }
            log(t('lgDone', done, failed, computeCounts(ctx, true).size), 'var(--green)');
            log(`🎯 ${affinitySummary(ctx)}`, 'var(--blue)');
            status(stopReq ? t('stPartial') : t('stDone', ctx === R ? getResults().length : computeCounts(ctx, true).size));
            stopPop(stopReq ? 'stopped' : 'done');
            await saveHistory(ctx, src, stopReq, who !== me ? who : null);
            ok = !stopReq || ctx.fanFilms.size > 0;
            if (ok) ctx.key = opts.key;
        } catch (err) {
            status('❌ ' + err.message);
            log(err.message, 'var(--red)');
            stopPop(stopReq ? 'stopped' : 'error');
        }
        clearInterval(heartbeat);
        isRunning = false; phase = '';
        slotBtn.style.display = 'block'; ui.stopBtn.style.display = 'none';
        renderResults();
        scheduleEstimate(); // ahora hay más cosas guardadas
        runOpts = null;
        if (popQuiet && !isPicking) pickAnim.style.display = 'none';
        return ok;
    }

    // ══════════════ Inicio ══════════════
    setIntro(false); // cerrado al abrir; se despliega con "¿Cómo funciona?"
    showTab(localStorage.getItem('lbpr_tab') || 'rec');
    renderResults();
    store.get('history').then(hs => {
        history = hs || []; renderHistory();
        // al abrir, se muestra la última búsqueda vista
        const last = localStorage.getItem('lbpr_last_hist');
        if (last && history.some(x => x.id === last)) loadHistory(last, true);
    });
    // migración: la caché vieja del top 4 de fans pasa de localStorage a chrome.storage
    const oldFav = loadJSON('lbmf_fav_cache', null);
    if (oldFav) chrome.storage.local.set(Object.fromEntries(Object.entries(oldFav).map(([u, v]) => ['fav:' + u, v]))).then(() => localStorage.removeItem('lbmf_fav_cache'));
})();
