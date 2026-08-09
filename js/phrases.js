/* Window — scenes + phrase banks
   voice: a warm friend. lowercase, brief, never preachy.
   buckets (what the CAMERA sees): sky sunset water green street indoor food animal night mountains beach people default
   scenes  (the situation the USER armed): everyday going-out studying dinner sleeping

   Voice belongs to the scene, not the user. There is no persona picker.
   Banks are deep on purpose — shallow banks repeat inside a single filming session. */

/* 0018 · BEIGE ON BLACK. Scenes used to be told apart by hue — purple, blue,
   amber, indigo. There is one hue now, so they're told apart by VALUE, and the
   ladder isn't arbitrary: a scene's accent is as bright as the light that scene
   actually happens in. Going out is lit; sleeping is nearly dark. The palette
   describes the situation instead of just labelling it. */
window.SCENES = {
  everyday: {
    label: "everyday",
    label_es: "el día a día",
    blurb: "the doomscroll timer's own voice",
    blurb_es: "la voz del temporizador",
    armable: false,            // always on, never armed
    accent: "#ECE4D4"          // the base cream — the default voice
  },
  "going-out": {
    label: "going out",
    label_es: "salir",
    blurb: "for the night",
    blurb_es: "para la noche",
    armable: true,
    defaultHours: 5,
    accent: "#F6EFDF",         // brightest — the night is lit
    say: ["going out", "i'm going out", "im going out", "night out", "salgo", "saliendo"]
  },
  studying: {
    label: "studying",
    label_es: "estudiando",
    blurb: "lock in",
    blurb_es: "a concentrarse",
    armable: true,
    defaultHours: 3,
    accent: "#C3B79E",         // dim focus
    say: ["studying", "study", "i'm studying", "im studying", "deep work", "estudiando", "estudiar"]
  },
  dinner: {
    label: "dinner",
    label_es: "la comida",
    blurb: "eat like a person",
    blurb_es: "come como persona",
    armable: true,
    defaultHours: 2,
    accent: "#DBD0B9",         // warm low light
    say: ["dinner", "eating", "i'm eating", "im eating", "lunch", "comiendo", "almuerzo", "cena"]
  },
  sleeping: {
    label: "sleeping",
    label_es: "durmiendo",
    blurb: "put it down",
    blurb_es: "déjalo ahí",
    armable: true,
    defaultHours: 9,
    accent: "#9C927F",         // dimmest — the room is dark
    say: ["sleeping", "sleep", "going to sleep", "bed", "bedtime", "durmiendo", "dormir"]
  }
};

window.SCENE_KEYS = Object.keys(window.SCENES);
window.ARMABLE_SCENES = window.SCENE_KEYS.filter(k => window.SCENES[k].armable);

window.PHRASES_EN = {

  /* ---------------------------------------------------------------- everyday
     warm, grounding. the voice people hear most — keep this the deepest bank. */
  everyday: {
    sky: [
      "this light is unreal, stay in it",
      "look up a second longer",
      "the sky did that for free",
      "all that blue, just for you",
      "the clouds are moving slow today, match them",
      "nothing up there is in a hurry",
      "big sky, small feed",
      "that's a lot of room up there",
      "the weather made something for you",
      "clear enough to think in"
    ],
    sunset: [
      "golden hour found you",
      "stay for the last light",
      "the day is ending soft, let it",
      "this glow won't repeat itself",
      "the sun's last trick, watch",
      "everything looks forgiven at this hour",
      "orange like that only lasts a minute",
      "the sky is showing off, let it",
      "you caught the good part"
    ],
    water: [
      "let it wash the noise off",
      "watch it move for a while",
      "the water knows how to be still",
      "everything drifts, so can you",
      "it's been doing that all day without you",
      "nothing out there needs fixing"
    ],
    green: [
      "go touch grass, literally",
      "something out here is growing",
      "green looks good on your eyes",
      "everything here grows slow, that's okay",
      "it got this far without checking anything",
      "quiet green, quiet head",
      "leaves don't rush either"
    ],
    street: [
      "the city's still awake with you",
      "the street has better stories today",
      "somebody out there is having their best day",
      "everyone here is mid-something",
      "real people, real speed",
      "the block kept going without the feed",
      "so much happening at eye level"
    ],
    indoor: [
      "your little world looks warm today",
      "this room holds you fine",
      "the light in here is enough",
      "home is doing its quiet work",
      "you built this corner, look at it",
      "nothing in here is asking for anything",
      "it's softer in here than you thought"
    ],
    food: [
      "eat it while it's warm",
      "slow down, it tastes better",
      "this deserves your full attention",
      "someone made that, including you",
      "food first, feed later",
      "chew, actually chew"
    ],
    animal: [
      "they never worry about mondays",
      "someone's happy just to see you",
      "softest thing in the room, look",
      "no notifications in that little head",
      "they've got it figured out"
    ],
    night: [
      "the quiet is yours tonight",
      "rest is productive too",
      "the dark is soft tonight, let it be",
      "the stars showed up, so did you",
      "nothing needs deciding at this hour",
      "the day's done asking",
      "late is allowed to be gentle",
      "it's darker and calmer out here"
    ],
    mountains: [
      "they've been here forever, you've got time",
      "big rocks, deep breaths",
      "the horizon isn't going anywhere",
      "nothing that old is in a rush"
    ],
    beach: [
      "salt air fixes most things",
      "the tide doesn't rush, why do you",
      "the sea keeps its own time",
      "it's been arriving like that for ages"
    ],
    people: [
      "the best feed is at eye level",
      "someone here is glad you looked up",
      "these are the real ones",
      "look at them instead"
    ],
    default: [
      "you're here, that's enough",
      "one breath, then back",
      "look a little longer",
      "the world kept going, isn't that nice",
      "this moment wasn't on your feed",
      "nothing out here is trying to keep you",
      "that's the real resolution",
      "you found the outside, good",
      "it was here the whole time",
      "nobody made this for engagement",
      "still here, still fine",
      "that's enough of that, look up"
    ]
  },

  /* -------------------------------------------------------------- going out
     nightlife energy. the old techno voice. */
  "going-out": {
    night: [
      "the night is a long build-up, wait for it",
      "4am energy, save some for later",
      "bassline's outside tonight",
      "you're not going to remember your feed tomorrow",
      "the good part hasn't happened yet",
      "everyone worth seeing is out here",
      "dark room, real people, go",
      "the night doesn't buffer"
    ],
    street: [
      "the city's got a pulse, sync to it",
      "the street is the pre-party",
      "everyone out here is going somewhere",
      "this block is the opener",
      "walk it, don't scroll it"
    ],
    sunset: [
      "warm-up set by the sun",
      "doors open when that finishes",
      "golden hour is the first track"
    ],
    indoor: [
      "low light, good company, no rush",
      "the room is already good",
      "nobody in here is on their phone but you",
      "this is the part people post about later"
    ],
    people: [
      "they came out for this, so did you",
      "look who's actually here",
      "these faces beat any feed"
    ],
    sky: [
      "open air stage, no cover charge",
      "the roof came off, look"
    ],
    food: [
      "eat now, thank yourself at 3am",
      "fuel, then go"
    ],
    default: [
      "drop the phone, keep the drop",
      "afters can wait, this can't",
      "real world: best set of the week",
      "you're already out, be out",
      "nothing's happening in there",
      "the night is right in front of you",
      "this is the room, not that one",
      "you'll want to have been present for this",
      "go be somewhere",
      "the feed will still be trash tomorrow"
    ]
  },

  /* --------------------------------------------------------------- studying
     push, focus. the old hype voice. */
  studying: {
    indoor: [
      "keep grinding, you got this",
      "lock in — you're close",
      "this desk is your arena",
      "one more page, then look up again",
      "the work is right there, go",
      "you were in flow ninety seconds ago",
      "back to it, champ",
      "future you is watching this"
    ],
    sky: [
      "big day energy, go get it",
      "sky's clear, so is your head",
      "reset your eyes, then reset your focus"
    ],
    food: [
      "fuel up, then full send",
      "eat like it's leg day",
      "refuel, don't drift"
    ],
    night: [
      "recover hard, win tomorrow",
      "sleep is a rep too",
      "late session — finish clean",
      "one more push or one good sleep, pick"
    ],
    green: [
      "eyes on something far away, then back",
      "twenty seconds of green, then work"
    ],
    street: [
      "own the block today",
      "the streets respect movement"
    ],
    default: [
      "let's move, champ",
      "one more rep of real life",
      "eyes up, chest out",
      "ace the exam, then celebrate",
      "you didn't come this far to scroll",
      "that was a break, this is the work",
      "you're closer than the feed makes you feel",
      "go finish the thing",
      "nothing in there is on the exam",
      "back in. now."
    ]
  },

  /* ----------------------------------------------------------------- dinner
     dry, gently sarcastic. the old deadpan voice. */
  dinner: {
    food: [
      "it's getting cold while you read this",
      "the food is right there. it's been right there",
      "yes, photograph it. then eat it",
      "your dinner has been waiting patiently",
      "it does not taste better through a screen",
      "incredible. now use a fork",
      "the meal is not going to post itself. good"
    ],
    indoor: [
      "ah yes, the room you were ignoring",
      "a table. chairs. the ancient way",
      "this kitchen has been here all along",
      "look at this — a whole room, no ads"
    ],
    people: [
      "these people came to see you, apparently",
      "someone at this table said something. you missed it",
      "there are humans here. talk to one",
      "eye contact. bold, but try it"
    ],
    night: [
      "it's dark. go to bed maybe",
      "the evening is happening without you"
    ],
    street: [
      "cars. people. reality. wild stuff"
    ],
    sky: [
      "yes, that's the sky. it's been there all day",
      "clouds. groundbreaking."
    ],
    green: [
      "that's a plant. it doesn't have a feed"
    ],
    default: [
      "you looked up. incredible",
      "the real world: still in HD",
      "this is what loading screens dream of",
      "no ads out here. weird",
      "congratulations on the bare minimum",
      "nothing here refreshes. adjust",
      "wow. an actual moment. how retro",
      "still no algorithm. still fine",
      "the room continues to exist",
      "you're doing great, allegedly"
    ]
  },

  /* --------------------------------------------------------------- sleeping
     soft, literary, night-leaning. the old poet voice. */
  sleeping: {
    night: [
      "the night holds you like a held breath",
      "the dark asks nothing of you",
      "let the day close its own door",
      "everything unfinished will still be there, softer",
      "the hour is late and kind",
      "nothing tonight needs solving",
      "the quiet has been waiting up for you",
      "sleep is not a surrender, it's a return"
    ],
    indoor: [
      "the room dims itself for you",
      "these walls know the hour",
      "a small warm dark, and you in it",
      "the lamp has said enough"
    ],
    sky: [
      "the sky is a slow letter, read it",
      "light falls without asking to be seen",
      "the dark up there is very old and very calm"
    ],
    water: [
      "the water writes and rewrites itself"
    ],
    green: [
      "everything green is a small patience"
    ],
    default: [
      "you are the window and the view",
      "stillness, too, is a place",
      "the ordinary is only unread",
      "put it down, the day is over",
      "tomorrow keeps its own appointments",
      "nothing more is required of today",
      "the screen is the last thing awake, and it shouldn't be",
      "rest is the honest ending",
      "close it. the night is enough",
      "let the last thing you see be real"
    ]
  }
};

/* ============================================================================
   es-CL — the bank 0005 asked for on 2026-07-24 and nobody built.

   "Chileno is a locale, not a scene. It re-voices EVERY scene." That means
   five full banks, not one — which is why this took until now.

   THESE ARE NOT TRANSLATIONS. A translated bank reads like a dubbed film: the
   words land but the rhythm is somebody else's. Each line was rewritten to do
   the same JOB as its English counterpart in the voice a Chilean would use, so
   the counts match per bucket but the lines often don't correspond one to one.

   Chilean, not neutral LATAM — the launch market should hear itself, not a
   Miami voiceover. Voseo throughout where it falls naturally (tenís, sabís,
   leís, seguís). "la pega", "penca", "al tiro", "harto", "crack", "bacán".
   Deliberately NO "weón"/"weá": it is the most Chilean word there is and it
   would cost the warmth the whole voice is built on. The register survives
   0003 — push, never scold, and never imply the user failed.

   One line is deliberately absent from every bucket here: the "touch grass"
   construction. It's a competitor's app name (see the 2026-08-01 log) and the
   English bank still carries it at everyday.green awaiting Nicolas's word.
   No point creating the same problem twice.
   ============================================================================ */
window.PHRASES_ES = {

  /* ---------------------------------------------------------------- everyday
     tibia, con los pies en la tierra. la voz que más se escucha. */
  everyday: {
    sky: [
      "esta luz está increíble, quédate en ella",
      "mira un poquito más para arriba",
      "el cielo hizo eso gratis",
      "todo ese azul, para ti no más",
      "las nubes andan lentas hoy, hazles caso",
      "nada allá arriba anda apurado",
      "cielo grande, feed chico",
      "hay harto espacio allá arriba",
      "el clima te hizo algo bonito",
      "está despejado, tu cabeza también puede"
    ],
    sunset: [
      "te pilló la hora dorada",
      "quédate para la última luz",
      "el día se está yendo suave, déjalo",
      "este color no se va a repetir",
      "el último truco del sol, mira",
      "a esta hora todo se ve perdonado",
      "un naranjo así dura un minuto",
      "el cielo anda luciéndose, déjalo",
      "pillaste la parte buena"
    ],
    water: [
      "deja que se lleve el ruido",
      "míralo moverse un rato",
      "el agua sabe quedarse quieta",
      "todo va a la deriva, tú también puedes",
      "lleva todo el día haciendo eso sin ti",
      "nada de eso necesita que lo arreglen"
    ],
    green: [
      "acá afuera hay algo creciendo",
      "el verde le hace bien a tus ojos",
      "acá todo crece lento y está bien",
      "llegó hasta acá sin revisar nada",
      "verde tranquilo, cabeza tranquila",
      "las hojas tampoco andan apuradas",
      "toca algo que esté vivo"
    ],
    street: [
      "la ciudad sigue despierta contigo",
      "hoy la calle tiene mejores historias",
      "alguien por ahí está teniendo su mejor día",
      "acá todos andan en la mitad de algo",
      "gente real, velocidad real",
      "el barrio siguió sin el feed",
      "pasan hartas cosas a la altura de los ojos"
    ],
    indoor: [
      "tu mundito se ve tibio hoy",
      "esta pieza te aguanta bien",
      "con esta luz basta",
      "la casa está haciendo su pega callada",
      "este rincón lo armaste tú, míralo",
      "acá adentro nada te está pidiendo nada",
      "está más suave acá de lo que pensabas"
    ],
    food: [
      "cómetelo mientras está caliente",
      "más lento, sabe mejor",
      "esto merece toda tu atención",
      "alguien hizo eso, tú incluido",
      "primero la comida, después el feed",
      "mastica, en serio mastica"
    ],
    animal: [
      "nunca se preocupan de los lunes",
      "hay alguien feliz solo de verte",
      "lo más suave de la pieza, mira",
      "cero notificaciones en esa cabecita",
      "ellos ya lo tienen resuelto"
    ],
    night: [
      "el silencio es tuyo esta noche",
      "descansar también es productivo",
      "la oscuridad anda suave, déjala",
      "aparecieron las estrellas, tú también",
      "a esta hora no hay nada que decidir",
      "el día ya dejó de pedir",
      "tarde también puede ser tranquilo",
      "acá afuera está más oscuro y más calmado"
    ],
    mountains: [
      "llevan siglos ahí, tenís tiempo",
      "piedras grandes, respiros hondos",
      "el horizonte no se va a ir a ningún lado",
      "nada tan viejo anda apurado"
    ],
    beach: [
      "el aire salado arregla casi todo",
      "la marea no se apura, ¿tú por qué?",
      "el mar lleva su propio horario",
      "lleva siglos llegando así"
    ],
    people: [
      "el mejor feed está a la altura de los ojos",
      "acá alguien se alegró de que miraras",
      "estos son los de verdad",
      "míralos a ellos mejor"
    ],
    default: [
      "estás acá, con eso basta",
      "un respiro y volvemos",
      "mira un poquito más",
      "el mundo siguió, qué bueno",
      "este momento no estaba en tu feed",
      "nada acá afuera te quiere retener",
      "esa es la resolución de verdad",
      "encontraste el afuera, bien ahí",
      "estuvo acá todo este rato",
      "nadie hizo esto para el engagement",
      "seguís acá, seguís bien",
      "ya estuvo bueno, mira para arriba"
    ]
  },

  /* -------------------------------------------------------------- going out
     energía de noche. la voz que era techno. */
  "going-out": {
    night: [
      "la noche es un build-up largo, espérala",
      "energía de las 4am, guarda un poco",
      "el bajo está afuera esta noche",
      "mañana no te vas a acordar de tu feed",
      "la parte buena todavía no pasa",
      "toda la gente que vale la pena está acá afuera",
      "pieza oscura, gente real, anda",
      "la noche no bufferea"
    ],
    street: [
      "la ciudad tiene pulso, engánchate",
      "la calle es la previa",
      "todos acá afuera van a alguna parte",
      "esta cuadra es el telonero",
      "camínala, no la scrollees"
    ],
    sunset: [
      "el sol está haciendo el warm-up",
      "cuando termine eso, abren las puertas",
      "la hora dorada es el primer track"
    ],
    indoor: [
      "poca luz, buena gente, sin apuro",
      "la pieza ya está buena",
      "acá nadie está en el teléfono menos tú",
      "esta es la parte que después todos suben"
    ],
    people: [
      "salieron para esto, tú también",
      "mira quién está acá de verdad",
      "estas caras le ganan a cualquier feed"
    ],
    sky: [
      "escenario al aire libre, sin cover",
      "se voló el techo, mira"
    ],
    food: [
      "come ahora, a las 3am te lo agradeces",
      "carga bencina y anda"
    ],
    default: [
      "suelta el teléfono, quédate con el drop",
      "el after puede esperar, esto no",
      "mundo real: el mejor set de la semana",
      "ya saliste, entonces sal en serio",
      "adentro no está pasando nada",
      "la noche está justo ahí adelante",
      "esta es la pieza, no esa",
      "vas a querer haber estado acá",
      "anda a estar en alguna parte",
      "el feed va a seguir siendo penca mañana"
    ]
  },

  /* --------------------------------------------------------------- studying
     empuje, foco. la voz que era hype. */
  studying: {
    indoor: [
      "sigue dándole, tú puedes",
      "concéntrate, estás cerca",
      "este escritorio es tu cancha",
      "una página más y después miras",
      "la pega está justo ahí, anda",
      "hace noventa segundos estabas en flow",
      "vuelve a la pega, crack",
      "el tú del futuro está mirando esto"
    ],
    sky: [
      "energía de día grande, anda a buscarlo",
      "el cielo está despejado, tu cabeza también",
      "resetea los ojos y después la concentración"
    ],
    food: [
      "carga bencina y a todo chancho",
      "come como si fuera día de pierna",
      "recarga, no te disperses"
    ],
    night: [
      "recupérate bien, gana mañana",
      "dormir también es una repetición",
      "sesión tarde, termínala limpia",
      "un empujón más o un buen sueño, elige"
    ],
    green: [
      "mira algo lejos y después vuelve",
      "veinte segundos de verde y a la pega"
    ],
    street: [
      "hoy la cuadra es tuya",
      "la calle respeta al que se mueve"
    ],
    default: [
      "vamos, crack",
      "una repetición más de vida real",
      "ojos arriba, pecho afuera",
      "pásala y después celebras",
      "no llegaste hasta acá para scrollear",
      "eso fue el descanso, esto es la pega",
      "estás más cerca de lo que el feed te hace sentir",
      "anda a terminar la cuestión",
      "nada de eso viene en la prueba",
      "de vuelta. ahora."
    ]
  },

  /* ----------------------------------------------------------------- dinner
     seca, con ironía suave. la voz que era deadpan. */
  dinner: {
    food: [
      "se está enfriando mientras leís esto",
      "la comida está ahí. lleva rato ahí",
      "sí, fotografíala. después cómetela",
      "tu comida lleva rato esperando pacientemente",
      "no sabe mejor a través de una pantalla",
      "increíble. ahora usa el tenedor",
      "el plato no se va a subir solo. qué bueno"
    ],
    indoor: [
      "ah, sí, la pieza que estabas ignorando",
      "una mesa. sillas. el método ancestral",
      "esta cocina lleva todo este rato acá",
      "mira esto: una pieza entera, sin publicidad"
    ],
    people: [
      "esta gente vino a verte, aparentemente",
      "alguien en esta mesa dijo algo. te lo perdiste",
      "hay humanos acá. háblale a uno",
      "contacto visual. atrevido, pero inténtalo"
    ],
    night: [
      "está oscuro. anda a acostarte quizás",
      "la noche está pasando sin ti"
    ],
    street: [
      "autos. gente. realidad. tremendo"
    ],
    sky: [
      "sí, ese es el cielo. lleva todo el día ahí",
      "nubes. revolucionario."
    ],
    green: [
      "eso es una planta. no tiene feed"
    ],
    default: [
      "miraste para arriba. increíble",
      "el mundo real: sigue en HD",
      "con esto sueñan las pantallas de carga",
      "no hay publicidad acá afuera. raro",
      "felicitaciones por lo mínimo",
      "acá nada se refresca. acostúmbrate",
      "wow. un momento real. qué retro",
      "sigue sin algoritmo. sigue estando bien",
      "la pieza continúa existiendo",
      "lo estás haciendo bien, supuestamente"
    ]
  },

  /* --------------------------------------------------------------- sleeping
     suave, literaria, de noche. la voz que era poeta. */
  sleeping: {
    night: [
      "la noche te sostiene como un respiro guardado",
      "la oscuridad no te pide nada",
      "deja que el día cierre su propia puerta",
      "todo lo que quedó a medias va a seguir ahí, más suave",
      "la hora es tarde y es amable",
      "esta noche no hay nada que resolver",
      "el silencio te estaba esperando despierto",
      "dormir no es rendirse, es volver"
    ],
    indoor: [
      "la pieza se apaga sola para ti",
      "estas paredes conocen la hora",
      "una oscuridad chica y tibia, y tú adentro",
      "la lámpara ya dijo suficiente"
    ],
    sky: [
      "el cielo es una carta lenta, léela",
      "la luz cae sin pedir que la miren",
      "esa oscuridad de allá arriba es muy vieja y muy calmada"
    ],
    water: [
      "el agua se escribe y se vuelve a escribir"
    ],
    green: [
      "todo lo verde es una paciencia chica"
    ],
    default: [
      "eres la ventana y también lo que se ve",
      "la quietud también es un lugar",
      "lo ordinario solo está sin leer",
      "déjalo, el día se acabó",
      "el mañana tiene sus propias citas",
      "hoy ya no requiere nada más de ti",
      "la pantalla es lo último despierto, y no debería",
      "descansar es el final honesto",
      "ciérralo. la noche basta",
      "que lo último que veas sea real"
    ]
  }
};

/* ---------------------------------------------------------------- the locale
   Chile ships first, so any es-* device gets Spanish. ?lang=en / ?lang=es
   forces it, which is exactly what filming needs — the same contract
   shoot.html already uses, so one URL habit covers both surfaces.

   PHRASE_BANKS is the shape a third locale slots into. window.PHRASES stays
   the single resolved bank every caller already reads, so nothing downstream
   had to change. */
window.PHRASE_BANKS = { en: window.PHRASES_EN, es: window.PHRASES_ES };

window.LOCALE = (function () {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "en" || q === "es") return q;
  } catch (e) { /* no URLSearchParams, fall through to the device */ }
  return (navigator.language || "en").toLowerCase().indexOf("es") === 0 ? "es" : "en";
})();

window.PHRASES = window.PHRASE_BANKS[window.LOCALE] || window.PHRASES_EN;
document.documentElement.lang = window.LOCALE;

/* voice inherited by a custom scene, or fallback for an unknown key */
window.FALLBACK_SCENE = "everyday";
