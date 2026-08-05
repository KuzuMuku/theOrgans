;(function () {

let VANILLAOCEAN_ORGAN_IDS = [
  "kubejs:tidal_ventricle",
  "kubejs:saltgill_lung",
  "kubejs:deepsea_liver",
  "kubejs:coral_boneplate",
  "kubejs:seacurrent_spleen",
  "kubejs:tidepressure_crown",
  "kubejs:wetgill_jowl",
  "kubejs:seamirror_iris",
  "kubejs:foam_kidney",
  "kubejs:farvoyage_flipper",
  "kubejs:kelp_spinal_cord",
  "kubejs:shellbell_cochlea",
  "kubejs:countercurrent_arm",
  "kubejs:tidefin_leg",
  "kubejs:bubblewave_throat",
  "kubejs:coralspike_fist",
  "kubejs:monument_refraction_eye",
  "kubejs:tidesound_fork_wrist",
  "kubejs:deeptide_scavenger_hand",
  "kubejs:coraltide_tail"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAOCEAN_ORGAN_IDS)
})
})()
