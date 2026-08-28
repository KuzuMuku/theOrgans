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
  Common.registerItems(event, VANILLASNOW_ORGAN_IDS)
  Common.registerItems(event, VANILLASNOW_AUX_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:frozen_maze_core',
    nameKey: 'point.organeffects.skill.kubejs.frozen_maze_core',
    descKey: 'point.organeffects.skill.kubejs.frozen_maze_core.desc',
    cooldown: 400,
    level: 1,
    castEvent: 'frozen_maze_core_cast'
  }
])

})()
