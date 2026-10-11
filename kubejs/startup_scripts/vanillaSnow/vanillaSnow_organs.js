;(function () {

let VANILLASNOW_ORGAN_IDS = [
  "frostseal_ventricle",
  "frozensoil_chest_membrane",
  "birchmarrow_liver",
  "icecrystal_lung",
  "frostlight_crown",
  "snowhide_spleen",
  "icechip_arm",
  "snowblind_iris",
  "frosthoof_tendon",
  "freezebreak_sheath",
  "frozen_maze_core"
]

let VANILLASNOW_AUX_IDS = [
  "deposition_conduit",
  "frostvein_bundle",
  "icecore_rhythm"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLASNOW_AUX_IDS)
})

})()
