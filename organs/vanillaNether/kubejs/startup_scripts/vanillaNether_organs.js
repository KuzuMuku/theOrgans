;(function () {

let VANILLANETHER_ORGAN_IDS = [
  "infernal_hearth",
  "sacrifice_spine_furnace",
  "obsidian_chest_cavity",
  "ember_liver",
  "spiritflame_lung",
  "overload_crown",
  "ash_spleen",
  "slag_reflux_gland",
  "soulsand_lung_sac",
  "netherwart_liver",
  "furnaceslag_kidneysheath",
  "blackstone_spleen_membrane",
  "blazefire_arm",
  "scorch_throat_sac",
  "lava_tendon",
  "emberstride_ankle",
  "ash_iris",
  "sacrifice_fire_fist",
  "inferno_shoulderplate",
  "hellfire_tailbone",
  "furnace_kneering",
  "blackflame_throat_pipe",
  "fortress_bone_key",
  "bastion_hoof_lock",
  "ancient_relic_hand",
  "gilded_recovery_claw",
  "smeltfist_subcore",
  "cataclysm_magma_core",
  "piglin_contract_liver",
  "ashvale_lung"
]

let VANILLANETHER_AUX_ITEM_IDS = [
  "ash_conduit",
  "slag_pump",
  "soulfire_rhythm",
  "gilded_recovery_belt"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, VANILLANETHER_ORGAN_IDS)
  Common.registerItems(event, VANILLANETHER_AUX_ITEM_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:scorch_throat_sac',
    nameKey: 'point.organeffects.skill.kubejs.scorch_throat_sac',
    descKey: 'point.organeffects.skill.kubejs.scorch_throat_sac.desc',
    cooldown: 100,
    level: 1,
    castEvent: 'scorch_throat_sac_cast'
  },
  {
    id: 'kubejs:sacrifice_fire_fist',
    nameKey: 'point.organeffects.skill.kubejs.sacrifice_fire_fist',
    descKey: 'point.organeffects.skill.kubejs.sacrifice_fire_fist.desc',
    cooldown: 90,
    level: 1,
    castEvent: 'sacrifice_fire_fist_cast'
  },
  {
    id: 'kubejs:blackflame_throat_pipe',
    nameKey: 'point.organeffects.skill.kubejs.blackflame_throat_pipe',
    descKey: 'point.organeffects.skill.kubejs.blackflame_throat_pipe.desc',
    cooldown: 140,
    level: 1,
    castEvent: 'blackflame_throat_pipe_cast'
  },
  {
    id: 'kubejs:cataclysm_magma_burst',
    nameKey: 'point.organeffects.skill.kubejs.cataclysm_magma_burst',
    descKey: 'point.organeffects.skill.kubejs.cataclysm_magma_burst.desc',
    cooldown: 180,
    level: 1,
    castEvent: 'cataclysm_magma_burst_cast'
  },
  {
    id: 'kubejs:cataclysm_magma_upkeep',
    nameKey: 'point.organeffects.skill.kubejs.cataclysm_magma_upkeep',
    descKey: 'point.organeffects.skill.kubejs.cataclysm_magma_upkeep.desc',
    cooldown: 200,
    level: 1,
    castEvent: 'cataclysm_magma_upkeep_cast'
  }
])

})()
