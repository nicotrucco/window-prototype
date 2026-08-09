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
    blurb: "the doomscroll timer's own voice",
    armable: false,            // always on, never armed
    accent: "#ECE4D4"          // the base cream — the default voice
  },
  "going-out": {
    label: "going out",
    blurb: "for the night",
    armable: true,
    defaultHours: 5,
    accent: "#F6EFDF",         // brightest — the night is lit
    say: ["going out", "i'm going out", "im going out", "night out", "salgo", "saliendo"]
  },
  studying: {
    label: "studying",
    blurb: "lock in",
    armable: true,
    defaultHours: 3,
    accent: "#C3B79E",         // dim focus
    say: ["studying", "study", "i'm studying", "im studying", "deep work", "estudiando", "estudiar"]
  },
  dinner: {
    label: "dinner",
    blurb: "eat like a person",
    armable: true,
    defaultHours: 2,
    accent: "#DBD0B9",         // warm low light
    say: ["dinner", "eating", "i'm eating", "im eating", "lunch", "comiendo", "almuerzo", "cena"]
  },
  sleeping: {
    label: "sleeping",
    blurb: "put it down",
    armable: true,
    defaultHours: 9,
    accent: "#9C927F",         // dimmest — the room is dark
    say: ["sleeping", "sleep", "going to sleep", "bed", "bedtime", "durmiendo", "dormir"]
  }
};

window.SCENE_KEYS = Object.keys(window.SCENES);
window.ARMABLE_SCENES = window.SCENE_KEYS.filter(k => window.SCENES[k].armable);

window.PHRASES = {

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

/* voice inherited by a custom scene, or fallback for an unknown key */
window.FALLBACK_SCENE = "everyday";
