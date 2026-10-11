;(function () {

let VANILLAEND_ORGAN_IDS = [
  "void_ventricle",
  "return_spine_furnace",
  "purpur_chest_membrane",
  "dragonbreath_liver",
  "ender_lung",
  "gategap_crown",
  "shulker_spleen",
  "endstone_reflux_gland",
  "endgate_lung",
  "enderwart_liver",
  "voidabyss_kidneysheath",
  "enddust_spleen_membrane",
  "shadowfold_arm",
  "shadow_throat_sac",
  "endleap_tendon",
  "wingfold_shoulder_ring",
  "endpattern_iris",
  "foldgate_fist",
  "endbound_shoulderplate",
  "gategap_tailbone",
  "void_guard_core"
]

let VANILLAEND_AUXILIARY_IDS = [
  "void_conduit",
  "gate_anchor",
  "purpur_nerve_cord",
  "ender_tether"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLAEND_AUXILIARY_IDS)
})

})()
