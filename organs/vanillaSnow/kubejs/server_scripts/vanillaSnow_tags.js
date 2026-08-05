;(function () {

let VANILLASNOW_ORGAN_IDS = [
  "kubejs:frostseal_ventricle",
  "kubejs:frozensoil_chest_membrane",
  "kubejs:birchmarrow_liver",
  "kubejs:icecrystal_lung",
  "kubejs:frostlight_crown",
  "kubejs:snowhide_spleen",
  "kubejs:icechip_arm",
  "kubejs:snowblind_iris",
  "kubejs:frosthoof_tendon",
  "kubejs:freezebreak_sheath"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLASNOW_ORGAN_IDS)
})
})()
