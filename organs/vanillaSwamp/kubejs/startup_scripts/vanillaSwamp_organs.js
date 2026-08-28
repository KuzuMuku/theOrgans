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
  "witchbog_crown",
  "hydra_venom_core",
  "mud_vein_conduit",
  "rot_hyphae",
  "swamp_gas_bladder",
  "rot_pump"
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
  },
  {
    id: 'kubejs:hydra_venom_core',
    nameKey: 'point.organeffects.skill.kubejs.hydra_venom_core',
    descKey: 'point.organeffects.skill.kubejs.hydra_venom_core.desc',
    cooldown: 200,
    level: 1,
    castEvent: 'hydra_venom_core_cast'
  },
  {
    id: 'kubejs:swamp_gas_bladder',
    nameKey: 'point.organeffects.skill.kubejs.swamp_gas_bladder',
    descKey: 'point.organeffects.skill.kubejs.swamp_gas_bladder.desc',
    cooldown: 80,
    level: 1,
    castEvent: 'swamp_gas_bladder_cast'
  }
])

})()
