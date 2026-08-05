;(function () {

let VANILLADESERT_ORGAN_IDS = [
  "kubejs:sun_ventricle",
  "kubejs:sandstone_breastplate",
  "kubejs:drought_liver",
  "kubejs:heatwave_lung",
  "kubejs:quicksand_spleen",
  "kubejs:eclipse_crown",
  "kubejs:wind_erosion_arm",
  "kubejs:cactus_tendon",
  "kubejs:drysand_iris",
  "kubejs:temple_scavenger_hand"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLADESERT_ORGAN_IDS)
})
})()
