;(function () {

let VANILLASCULK_ORGAN_IDS = [
  "echo_core",
  "listening_lung",
  "gloomvein_liver",
  "warden_boneplate",
  "silence_crown",
  "echo_cochlea",
  "darkvision_iris",
  "stealthshock_sole",
  "sensor_subbrain",
  "resonance_spine",
  "gloomshell_spleen",
  "echo_marrow",
  "resonant_kidneysheath",
  "otherdeep_float_membrane",
  "deepchamber_sac",
  "latentwave_arm",
  "sensor_throat_sac",
  "silent_arrow_gland",
  "tremor_tail",
  "ancient_city_step_leg",
  "wavefront_forehead",
  "conduction_fork_joint",
  "deepheart_remnant",
  "ancient_jar_hand",
  "abyss_hunter_membrane"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLASCULK_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:sensor_throat_sac',
    nameKey: 'point.organeffects.skill.kubejs.sensor_throat_sac',
    descKey: 'point.organeffects.skill.kubejs.sensor_throat_sac.desc',
    cooldown: 110,
    level: 1,
    castEvent: 'sensor_throat_sac_cast'
  }
])

})()
