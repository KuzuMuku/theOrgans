;(function () {

let VANILLAOCEAN_ORGAN_IDS = [
  "tidal_ventricle",
  "saltgill_lung",
  "deepsea_liver",
  "coral_boneplate",
  "seacurrent_spleen",
  "tidepressure_crown",
  "wetgill_jowl",
  "seamirror_iris",
  "foam_kidney",
  "farvoyage_flipper",
  "kelp_spinal_cord",
  "shellbell_cochlea",
  "countercurrent_arm",
  "tidefin_leg",
  "bubblewave_throat",
  "coralspike_fist",
  "monument_refraction_eye",
  "tidesound_fork_wrist",
  "deeptide_scavenger_hand",
  "coraltide_tail",
  "dragonfrost_sac",
  "frostabyss_core"
]

let VANILLAOCEAN_AUX_ITEM_IDS = [
  "current_conduit",
  "salt_exchange_valve",
  "tidal_buoy"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLAOCEAN_ORGAN_IDS)
  Common.registerItems(event, VANILLAOCEAN_AUX_ITEM_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:bubblewave_throat',
    nameKey: 'point.organeffects.skill.kubejs.bubblewave_throat',
    descKey: 'point.organeffects.skill.kubejs.bubblewave_throat.desc',
    cooldown: 100,
    level: 1,
    castEvent: 'bubblewave_throat_cast'
  },
  {
    id: 'kubejs:tidesound_fork_wrist',
    nameKey: 'point.organeffects.skill.kubejs.tidesound_fork_wrist',
    descKey: 'point.organeffects.skill.kubejs.tidesound_fork_wrist.desc',
    cooldown: 90,
    level: 1,
    castEvent: 'tidesound_fork_wrist_cast'
  },
  {
    id: 'kubejs:frostabyss_core',
    nameKey: 'point.organeffects.skill.kubejs.frostabyss_core',
    descKey: 'point.organeffects.skill.kubejs.frostabyss_core.desc',
    cooldown: 200,
    level: 1,
    castEvent: 'frostabyss_core_cast'
  }
])

})()
