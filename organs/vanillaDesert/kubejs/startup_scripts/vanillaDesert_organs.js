;(function () {

let VANILLADESERT_ORGAN_IDS = [
  "sun_ventricle",
  "sandstone_breastplate",
  "drought_liver",
  "heatwave_lung",
  "quicksand_spleen",
  "eclipse_crown",
  "wind_erosion_arm",
  "cactus_tendon",
  "drysand_iris",
  "temple_scavenger_hand"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLADESERT_ORGAN_IDS)
})

})()
