;(function () {

let VANILLASWAMP_ORGAN_IDS = [
  "vanillaswamp:silt_poison_heart",
  "vanillaswamp:rotmoss_filter_liver",
  "vanillaswamp:bog_rot_sac",
  "vanillaswamp:slime_shell",
  "vanillaswamp:slime_thread_arm",
  "vanillaswamp:poison_bloom_throat",
  "vanillaswamp:frogfin_sneak_leg",
  "vanillaswamp:sporebog_lung",
  "vanillaswamp:slime_mana_spleen",
  "vanillaswamp:witchbog_crown",
  "vanillaswamp:hydra_venom_core",
  "kubejs:mud_vein_conduit",
  "kubejs:rot_hyphae",
  "vanillaswamp:swamp_gas_bladder",
  "kubejs:rot_pump"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLASWAMP_ORGAN_IDS)
})
})()
