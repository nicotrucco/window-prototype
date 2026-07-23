/* Window — phrase bank
   voice: a warm friend. lowercase, brief, never preachy.
   buckets: sky sunset water green street indoor food animal night mountains beach people default */

window.PHRASES = {
  calm: {
    sky:      ["this light is unreal, stay in it", "look up a second longer", "the sky did that for free", "all that blue, just for you", "the clouds are moving slow today, match them"],
    sunset:   ["golden hour found you", "stay for the last light", "the day is ending soft, let it", "this glow won't repeat itself", "the sun's last trick, watch"],
    water:    ["let it wash the noise off", "watch it move for a while", "the water knows how to be still", "everything drifts, so can you"],
    green:    ["go touch grass, literally", "something out here is growing", "green looks good on your eyes", "everything here grows slow, that's okay"],
    street:   ["the city's still awake with you", "the street has better stories today", "somebody out there is having their best day"],
    indoor:   ["your little world looks warm today", "this room holds you fine", "the light in here is enough", "home is doing its quiet work"],
    food:     ["eat it while it's warm", "slow down, it tastes better", "this deserves your full attention"],
    animal:   ["they never worry about mondays", "someone's happy just to see you", "softest thing in the room, look"],
    night:    ["the quiet is yours tonight", "rest is productive too", "the dark is soft tonight, let it be", "the stars showed up, so did you"],
    mountains:["they've been here forever, you've got time", "big rocks, deep breaths", "the horizon isn't going anywhere"],
    beach:    ["salt air fixes most things", "the tide doesn't rush, why do you", "the sea keeps its own time"],
    people:   ["the best feed is at eye level", "someone here is glad you looked up"],
    default:  ["you're here, that's enough", "one breath, then back", "look a little longer", "the world kept going, isn't that nice", "this moment wasn't on your feed"]
  },

  hype: {
    sky:      ["big day energy, go get it", "sky's clear, so is your head"],
    sunset:   ["you earned this light, champ", "day's done — you showed up"],
    street:   ["own the block today", "the streets respect movement"],
    indoor:   ["keep grinding, you got this", "lock in — you're close", "this desk is your arena"],
    food:     ["fuel up, then full send", "eat like it's leg day"],
    night:    ["recover hard, win tomorrow", "sleep is a rep too"],
    default:  ["let's move, champ", "one more rep of real life", "eyes up, chest out", "ace the exam, then celebrate"]
  },

  deadpan: {
    sky:      ["yes, that's the sky. it's been there all day", "clouds. groundbreaking."],
    sunset:   ["the sun leaves daily and never posts about it"],
    green:    ["that's a plant. it doesn't have a feed"],
    street:   ["cars. people. reality. wild stuff"],
    indoor:   ["ah yes, the room you were ignoring"],
    food:     ["it's getting cold while you read this"],
    night:    ["it's dark. go to bed maybe"],
    default:  ["you looked up. incredible", "the real world: still in HD", "this is what loading screens dream of", "no ads out here. weird"]
  },

  poet: {
    sky:      ["the sky is a slow letter, read it", "light falls without asking to be seen"],
    sunset:   ["the day folds itself into amber", "dusk keeps its promises quietly"],
    water:    ["the water writes and rewrites itself"],
    green:    ["everything green is a small patience"],
    street:   ["the city hums a song it forgot writing"],
    night:    ["the night holds you like a held breath"],
    default:  ["you are the window and the view", "stillness, too, is a place", "the ordinary is only unread"]
  },

  chileno: {
    sky:      ["mira ese cielo po, quédate un rato", "está lindo pa' fuera, oye"],
    sunset:   ["atardecer bacán, no te lo pierdas", "esa luz está heavy buena"],
    green:    ["anda a pisar el pasto po", "puro verde, qué rico"],
    street:   ["la calle está viva hoy día", "sale a dar una vuelta po"],
    indoor:   ["tu pieza se ve cómoda hoy, disfrútala"],
    food:     ["cómetelo caliente, no seai", "está rica la mesa, aprovecha"],
    night:    ["la noche está piola, respira", "tarde ya po, descansa"],
    default:  ["ya po, mira pa' fuera", "aquí está la vida, al tiro", "un respiro y seguimos"]
  },

  techno: {
    sky:      ["open air stage, no cover charge"],
    sunset:   ["warm-up set by the sun"],
    street:   ["the city's got a pulse, sync to it"],
    indoor:   ["low light, good company, no rush"],
    night:    ["the night is a long build-up, wait for it", "4am energy, save some for later", "bassline's outside tonight"],
    default:  ["drop the phone, keep the drop", "afters can wait, this can't", "real world: best set of the week"]
  }
};

window.PERSONAS = ["calm", "hype", "deadpan", "poet", "chileno", "techno"];
