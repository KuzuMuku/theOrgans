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
  "sporeweb_crown",
  "ancient_resonance_core",
  "wooden_sap_conduit",
  "root_anchor_silk",
  "aerial_root_breathing_tube",
  "vine_bind_bundle"
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
  },
  {
    id: 'kubejs:ancient_resonance_core',
    nameKey: 'point.organeffects.skill.kubejs.ancient_resonance_core',
    descKey: 'point.organeffects.skill.kubejs.ancient_resonance_core.desc',
    cooldown: 240,
    level: 1,
    castEvent: 'ancient_resonance_core_cast'
  }
])

})()
