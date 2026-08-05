;(function () {

let VANILLAEND_ORGAN_IDS = [
  "kubejs:void_ventricle",
  "kubejs:return_spine_furnace",
  "kubejs:purpur_chest_membrane",
  "kubejs:dragonbreath_liver",
  "kubejs:ender_lung",
  "kubejs:gategap_crown",
  "kubejs:shulker_spleen",
  "kubejs:endstone_reflux_gland",
  "kubejs:endgate_lung",
  "kubejs:enderwart_liver",
  "kubejs:voidabyss_kidneysheath",
  "kubejs:enddust_spleen_membrane",
  "kubejs:shadowfold_arm",
  "kubejs:shadow_throat_sac",
  "kubejs:endleap_tendon",
  "kubejs:wingfold_shoulder_ring",
  "kubejs:endpattern_iris",
  "kubejs:foldgate_fist",
  "kubejs:endbound_shoulderplate",
  "kubejs:gategap_tailbone"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAEND_ORGAN_IDS)
})
})()
