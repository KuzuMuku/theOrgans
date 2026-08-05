;(function () {

let VANILLANETHER_ORGAN_IDS = [
  "kubejs:infernal_hearth",
  "kubejs:sacrifice_spine_furnace",
  "kubejs:obsidian_chest_cavity",
  "kubejs:ember_liver",
  "kubejs:spiritflame_lung",
  "kubejs:overload_crown",
  "kubejs:ash_spleen",
  "kubejs:slag_reflux_gland",
  "kubejs:soulsand_lung_sac",
  "kubejs:netherwart_liver",
  "kubejs:furnaceslag_kidneysheath",
  "kubejs:blackstone_spleen_membrane",
  "kubejs:blazefire_arm",
  "kubejs:scorch_throat_sac",
  "kubejs:lava_tendon",
  "kubejs:emberstride_ankle",
  "kubejs:ash_iris",
  "kubejs:sacrifice_fire_fist",
  "kubejs:inferno_shoulderplate",
  "kubejs:hellfire_tailbone",
  "kubejs:furnace_kneering",
  "kubejs:blackflame_throat_pipe",
  "kubejs:fortress_bone_key",
  "kubejs:bastion_hoof_lock",
  "kubejs:ancient_relic_hand",
  "kubejs:gilded_recovery_claw",
  "kubejs:smeltfist_subcore",
  "kubejs:cataclysm_magma_core",
  "kubejs:piglin_contract_liver",
  "kubejs:ashvale_lung"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLANETHER_ORGAN_IDS)
})
})()
