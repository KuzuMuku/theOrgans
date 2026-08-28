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
  "temple_scavenger_hand",
  "ancient_remnant_core",
  "transpiration_conduit",
  "sand_vein_bundle",
  "sundial_axle"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLADESERT_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:ancient_remnant_core',
    nameKey: 'point.organeffects.skill.kubejs.ancient_remnant_core',
    descKey: 'point.organeffects.skill.kubejs.ancient_remnant_core.desc',
    cooldown: 300,
    level: 1,
    castEvent: 'ancient_remnant_core_cast'
  }
])

})()
