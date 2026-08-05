;(function () {

let VANILLAPILLAGER_ORGAN_IDS = [
  "raider_ventricle",
  "banner_spinewheel",
  "outpost_chestplate",
  "emerald_liver",
  "horn_crown",
  "scout_iris",
  "loot_spleen",
  "breach_gland",
  "exile_kidneysheath",
  "war_drum_cochlea",
  "dark_arrow_throat",
  "raid_scavenger_hand",
  "skirmish_arm",
  "banner_spike_shoulder",
  "nightraid_tendon"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLAPILLAGER_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:dark_arrow_throat',
    nameKey: 'point.organeffects.skill.kubejs.dark_arrow_throat',
    descKey: 'point.organeffects.skill.kubejs.dark_arrow_throat.desc',
    cooldown: 110,
    level: 1,
    castEvent: 'dark_arrow_throat_cast'
  }
])

})()
