;(function () {

let VANILLASWAMP_ORGAN_IDS = [
  "silt_poison_heart",
  "rotmoss_filter_liver",
  "bog_rot_sac",
  "slime_shell",
  "slime_thread_arm",
  "poison_bloom_throat",
  "frogfin_sneak_leg",
  "sporebog_lung",
  "slime_mana_spleen",
  "witchbog_crown"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLASWAMP_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:poison_bloom_throat',
    nameKey: 'point.organeffects.skill.kubejs.poison_bloom_throat',
    descKey: 'point.organeffects.skill.kubejs.poison_bloom_throat.desc',
    cooldown: 120,
    level: 1,
    castEvent: 'poison_bloom_throat_cast'
  }
])

})()
