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
  "gategap_tailbone"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLAEND_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:shadow_throat_sac',
    nameKey: 'point.organeffects.skill.kubejs.shadow_throat_sac',
    descKey: 'point.organeffects.skill.kubejs.shadow_throat_sac.desc',
    cooldown: 110,
    level: 1,
    castEvent: 'shadow_throat_sac_cast'
  },
  {
    id: 'kubejs:foldgate_fist',
    nameKey: 'point.organeffects.skill.kubejs.foldgate_fist',
    descKey: 'point.organeffects.skill.kubejs.foldgate_fist.desc',
    cooldown: 90,
    level: 1,
    castEvent: 'foldgate_fist_cast'
  }
])

})()
