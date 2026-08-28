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
  "nightraid_tendon",
  "plunder_core"
]

let VANILLAPILLAGER_AUXILIARY_IDS = [
  "raider_banner_sash",
  "crossbow_string_winder",
  "wardrum_head",
  "plunder_knot"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLAPILLAGER_ORGAN_IDS)
  for (let i = 0; i < VANILLAPILLAGER_AUXILIARY_IDS.length; i++) {
    event.create(VANILLAPILLAGER_AUXILIARY_IDS[i]).maxStackSize(64)
      .texture('kubejs:item/' + VANILLAPILLAGER_AUXILIARY_IDS[i])
  }
})

Common.registerSkills([
  {
    id: 'kubejs:dark_arrow_throat',
    nameKey: 'point.organeffects.skill.kubejs.dark_arrow_throat',
    descKey: 'point.organeffects.skill.kubejs.dark_arrow_throat.desc',
    cooldown: 110,
    level: 1,
    castEvent: 'dark_arrow_throat_cast'
  },
  {
    id: 'kubejs:plunder_core',
    nameKey: 'point.organeffects.skill.kubejs.plunder_core',
    descKey: 'point.organeffects.skill.kubejs.plunder_core.desc',
    cooldown: 200,
    level: 1,
    castEvent: 'plunder_core_cast'
  }
])

})()
