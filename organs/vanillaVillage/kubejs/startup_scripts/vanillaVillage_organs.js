;(function () {

let VANILLAVILLAGE_ORGAN_IDS = [
  "bell_ventricle",
  "trade_spinewheel",
  "order_sternum",
  "profession_liver",
  "prestige_crown",
  "ledger_lung",
  "field_spleen",
  "repair_reflux_gland",
  "beacon_kidneysheath",
  "watchbell_cochlea",
  "village_iris",
  "offering_gland",
  "iron_guard_shoulder",
  "travel_legplate",
  "trade_scavenger_hand",
  "village_ledger",
  "bell_rope_winder",
  "holy_path_relay",
  "mending_suture",
  "village_bell_core"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLAVILLAGE_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:village_bell_core',
    nameKey: 'point.organeffects.skill.kubejs.village_bell_core',
    descKey: 'point.organeffects.skill.kubejs.village_bell_core.desc',
    cooldown: 600,
    level: 1,
    castEvent: 'village_bell_core_cast'
  }
])

})()
