;(function () {

let VANILLASCULK_ORGAN_IDS = [
  "kubejs:echo_core",
  "kubejs:listening_lung",
  "kubejs:gloomvein_liver",
  "kubejs:warden_boneplate",
  "kubejs:silence_crown",
  "kubejs:echo_cochlea",
  "kubejs:darkvision_iris",
  "kubejs:stealthshock_sole",
  "kubejs:sensor_subbrain",
  "kubejs:resonance_spine",
  "kubejs:gloomshell_spleen",
  "kubejs:echo_marrow",
  "kubejs:resonant_kidneysheath",
  "kubejs:otherdeep_float_membrane",
  "kubejs:deepchamber_sac",
  "kubejs:latentwave_arm",
  "kubejs:sensor_throat_sac",
  "kubejs:silent_arrow_gland",
  "kubejs:tremor_tail",
  "kubejs:ancient_city_step_leg",
  "kubejs:wavefront_forehead",
  "kubejs:conduction_fork_joint",
  "kubejs:deepheart_remnant",
  "kubejs:ancient_jar_hand",
  "kubejs:abyss_hunter_membrane"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLASCULK_ORGAN_IDS)
})
})()
