;(function () {

let VANILLAVILLAGE_ORGAN_IDS = [
  "kubejs:bell_ventricle",
  "kubejs:trade_spinewheel",
  "kubejs:order_sternum",
  "kubejs:profession_liver",
  "kubejs:prestige_crown",
  "kubejs:ledger_lung",
  "kubejs:field_spleen",
  "kubejs:repair_reflux_gland",
  "kubejs:beacon_kidneysheath",
  "kubejs:watchbell_cochlea",
  "kubejs:village_iris",
  "kubejs:offering_gland",
  "kubejs:iron_guard_shoulder",
  "kubejs:travel_legplate",
  "kubejs:trade_scavenger_hand"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAVILLAGE_ORGAN_IDS)
})
})()
