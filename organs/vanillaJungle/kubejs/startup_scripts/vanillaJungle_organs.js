;(function () {

let VANILLAJUNGLE_ORGAN_IDS = [
  "buttress_ventricle",
  "mossbark_carapace",
  "rainforest_water_sac",
  "temple_moss_spine",
  "stranglevine_arm",
  "flytrap_throat_sac",
  "jaguar_crouch_tendon",
  "orchid_spellbud_lung",
  "cocoa_marow_liver",
  "sporeweb_crown"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLAJUNGLE_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:flytrap_throat_sac',
    nameKey: 'point.organeffects.skill.kubejs.flytrap_throat_sac',
    descKey: 'point.organeffects.skill.kubejs.flytrap_throat_sac.desc',
    cooldown: 120,
    level: 1,
    castEvent: 'flytrap_throat_sac_cast'
  }
])

})()
