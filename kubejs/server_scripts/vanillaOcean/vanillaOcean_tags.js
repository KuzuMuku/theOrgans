;(function () {

let VANILLAOCEAN_ORGAN_IDS = [
  "vanillaocean:tidal_ventricle",
  "vanillaocean:saltgill_lung",
  "vanillaocean:deepsea_liver",
  "vanillaocean:coral_boneplate",
  "vanillaocean:seacurrent_spleen",
  "vanillaocean:tidepressure_crown",
  "vanillaocean:wetgill_jowl",
  "vanillaocean:seamirror_iris",
  "vanillaocean:foam_kidney",
  "vanillaocean:farvoyage_flipper",
  "vanillaocean:kelp_spinal_cord",
  "vanillaocean:shellbell_cochlea",
  "vanillaocean:countercurrent_arm",
  "vanillaocean:tidefin_leg",
  "vanillaocean:bubblewave_throat",
  "vanillaocean:coralspike_fist",
  "vanillaocean:monument_refraction_eye",
  "vanillaocean:tidesound_fork_wrist",
  "vanillaocean:deeptide_scavenger_hand",
  "vanillaocean:coraltide_tail",
  "vanillaocean:dragonfrost_sac",
  "vanillaocean:frostabyss_core"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAOCEAN_ORGAN_IDS)
})
})()
