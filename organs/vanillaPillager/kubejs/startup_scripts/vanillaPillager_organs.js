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
  for (let i = 0; i < VANILLAPILLAGER_AUXILIARY_IDS.length; i++) {
    event.create(VANILLAPILLAGER_AUXILIARY_IDS[i]).maxStackSize(64)
      .texture('kubejs:item/' + VANILLAPILLAGER_AUXILIARY_IDS[i])
  }
})

})()
