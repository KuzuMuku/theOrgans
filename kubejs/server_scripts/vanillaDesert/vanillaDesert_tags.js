;(function () {

let VANILLADESERT_ORGAN_IDS = [
  "vanilladesert:sun_ventricle",
  "vanilladesert:sandstone_breastplate",
  "vanilladesert:drought_liver",
  "vanilladesert:heatwave_lung",
  "vanilladesert:quicksand_spleen",
  "vanilladesert:eclipse_crown",
  "vanilladesert:wind_erosion_arm",
  "vanilladesert:cactus_tendon",
  "vanilladesert:drysand_iris",
  "vanilladesert:temple_scavenger_hand",
  "vanilladesert:ancient_remnant_core"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLADESERT_ORGAN_IDS)
})
})()
