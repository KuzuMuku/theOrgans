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
  "trade_scavenger_hand"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLAVILLAGE_ORGAN_IDS)
})

})()
