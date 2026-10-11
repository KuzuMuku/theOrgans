;(function () {

let VANILLALUSHCAVES_ORGAN_IDS = [
  "vanillalushcaves:mossglow_core",
  "vanillalushcaves:calcite_breastbone",
  "vanillalushcaves:sporeglow_lung",
  "vanillalushcaves:mossheal_liver",
  "vanillalushcaves:sporebud_gland",
  "vanillalushcaves:hangingroot_arm",
  "vanillalushcaves:mycelium_sole",
  "vanillalushcaves:brightpod_sac",
  "vanillalushcaves:sporebed_spleen",
  "vanillalushcaves:gloommoss_crown",
  "vanillalushcaves:sporebloom_core",
  "kubejs:mycelium_bridge",
  "kubejs:spore_conduit",
  "kubejs:glow_bed",
  "kubejs:root_network"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLALUSHCAVES_ORGAN_IDS)
})
})()
