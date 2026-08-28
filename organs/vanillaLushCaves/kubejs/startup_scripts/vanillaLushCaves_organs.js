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
  "gloommoss_crown",
  "sporebloom_core",
  "mycelium_bridge",
  "spore_conduit",
  "glow_bed",
  "root_network"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLALUSHCAVES_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:sporebloom_core',
    nameKey: 'point.organeffects.skill.kubejs.sporebloom_core',
    descKey: 'point.organeffects.skill.kubejs.sporebloom_core.desc',
    cooldown: 200,
    level: 1,
    castEvent: 'sporebloom_core_cast'
  }
])

})()
