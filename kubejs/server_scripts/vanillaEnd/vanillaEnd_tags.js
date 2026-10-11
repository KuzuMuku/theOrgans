;(function () {

let VANILLAEND_ORGAN_IDS = [
  "vanillaend:void_ventricle",
  "vanillaend:return_spine_furnace",
  "vanillaend:purpur_chest_membrane",
  "vanillaend:dragonbreath_liver",
  "vanillaend:ender_lung",
  "vanillaend:gategap_crown",
  "vanillaend:shulker_spleen",
  "vanillaend:endstone_reflux_gland",
  "vanillaend:endgate_lung",
  "vanillaend:enderwart_liver",
  "vanillaend:voidabyss_kidneysheath",
  "vanillaend:enddust_spleen_membrane",
  "vanillaend:shadowfold_arm",
  "vanillaend:shadow_throat_sac",
  "vanillaend:endleap_tendon",
  "vanillaend:wingfold_shoulder_ring",
  "vanillaend:endpattern_iris",
  "vanillaend:foldgate_fist",
  "vanillaend:endbound_shoulderplate",
  "vanillaend:gategap_tailbone",
  "vanillaend:void_guard_core"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAEND_ORGAN_IDS)
})
})()
