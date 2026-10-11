;(function () {

let VANILLANETHER_ORGAN_IDS = [
  "vanillanether:infernal_hearth",
  "vanillanether:sacrifice_spine_furnace",
  "vanillanether:obsidian_chest_cavity",
  "vanillanether:ember_liver",
  "vanillanether:spiritflame_lung",
  "vanillanether:overload_crown",
  "vanillanether:ash_spleen",
  "vanillanether:slag_reflux_gland",
  "vanillanether:soulsand_lung_sac",
  "vanillanether:netherwart_liver",
  "vanillanether:furnaceslag_kidneysheath",
  "vanillanether:blackstone_spleen_membrane",
  "vanillanether:blazefire_arm",
  "vanillanether:scorch_throat_sac",
  "vanillanether:lava_tendon",
  "vanillanether:emberstride_ankle",
  "vanillanether:ash_iris",
  "vanillanether:sacrifice_fire_fist",
  "vanillanether:inferno_shoulderplate",
  "vanillanether:hellfire_tailbone",
  "vanillanether:furnace_kneering",
  "vanillanether:blackflame_throat_pipe",
  "vanillanether:fortress_bone_key",
  "vanillanether:bastion_hoof_lock",
  "vanillanether:ancient_relic_hand",
  "vanillanether:gilded_recovery_claw",
  "vanillanether:smeltfist_subcore",
  "vanillanether:cataclysm_magma_core",
  "vanillanether:piglin_contract_liver",
  "vanillanether:ashvale_lung"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLANETHER_ORGAN_IDS)
})
})()
