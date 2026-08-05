;(function () {

let VANILLALUSHCAVES_ORGAN_IDS = [
  "kubejs:mossglow_core",
  "kubejs:calcite_breastbone",
  "kubejs:sporeglow_lung",
  "kubejs:mossheal_liver",
  "kubejs:sporebud_gland",
  "kubejs:hangingroot_arm",
  "kubejs:mycelium_sole",
  "kubejs:brightpod_sac",
  "kubejs:sporebed_spleen",
  "kubejs:gloommoss_crown"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLALUSHCAVES_ORGAN_IDS)
})
})()
