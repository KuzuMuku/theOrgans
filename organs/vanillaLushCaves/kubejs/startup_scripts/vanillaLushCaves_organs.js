;(function () {

let VANILLALUSHCAVES_ORGAN_IDS = [
  "mossglow_core",
  "calcite_breastbone",
  "sporeglow_lung",
  "mossheal_liver",
  "sporebud_gland",
  "hangingroot_arm",
  "mycelium_sole",
  "brightpod_sac",
  "sporebed_spleen",
  "gloommoss_crown"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLALUSHCAVES_ORGAN_IDS)
})

})()
