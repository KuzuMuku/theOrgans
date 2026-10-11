;(function () {

let VANILLAVILLAGE_ORGAN_IDS = [
  "vanillavillage:bell_ventricle",
  "vanillavillage:trade_spinewheel",
  "vanillavillage:order_sternum",
  "vanillavillage:profession_liver",
  "vanillavillage:prestige_crown",
  "vanillavillage:ledger_lung",
  "vanillavillage:field_spleen",
  "vanillavillage:repair_reflux_gland",
  "vanillavillage:beacon_kidneysheath",
  "vanillavillage:watchbell_cochlea",
  "vanillavillage:village_iris",
  "vanillavillage:offering_gland",
  "vanillavillage:iron_guard_shoulder",
  "vanillavillage:travel_legplate",
  "vanillavillage:trade_scavenger_hand",
  "kubejs:village_ledger",
  "kubejs:bell_rope_winder",
  "kubejs:holy_path_relay",
  "kubejs:mending_suture",
  "vanillavillage:village_bell_core"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAVILLAGE_ORGAN_IDS)
})
})()
