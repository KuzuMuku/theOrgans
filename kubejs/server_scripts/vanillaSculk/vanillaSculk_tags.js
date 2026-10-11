;(function () {

let VANILLASCULK_ORGAN_IDS = [
  "vanillasculk:echo_core",
  "vanillasculk:listening_lung",
  "vanillasculk:gloomvein_liver",
  "vanillasculk:warden_boneplate",
  "vanillasculk:silence_crown",
  "vanillasculk:echo_cochlea",
  "vanillasculk:darkvision_iris",
  "vanillasculk:stealthshock_sole",
  "vanillasculk:sensor_subbrain",
  "vanillasculk:resonance_spine",
  "vanillasculk:gloomshell_spleen",
  "vanillasculk:echo_marrow",
  "vanillasculk:resonant_kidneysheath",
  "vanillasculk:otherdeep_float_membrane",
  "vanillasculk:deepchamber_sac",
  "vanillasculk:latentwave_arm",
  "vanillasculk:sensor_throat_sac",
  "vanillasculk:silent_arrow_gland",
  "vanillasculk:tremor_tail",
  "vanillasculk:ancient_city_step_leg",
  "vanillasculk:wavefront_forehead",
  "vanillasculk:conduction_fork_joint",
  "vanillasculk:deepheart_remnant",
  "vanillasculk:ancient_jar_hand",
  "vanillasculk:abyss_hunter_membrane",
  "vanillasculk:warden_core"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLASCULK_ORGAN_IDS)
})
})()
