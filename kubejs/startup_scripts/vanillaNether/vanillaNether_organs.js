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
  Common.registerItems(event, VANILLANETHER_AUX_ITEM_IDS)
})

})()
