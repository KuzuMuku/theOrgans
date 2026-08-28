;(function () {

let VANILLASWAMP_ORGAN_IDS = [
  "kubejs:silt_poison_heart",
  "kubejs:rotmoss_filter_liver",
  "kubejs:bog_rot_sac",
  "kubejs:slime_shell",
  "kubejs:slime_thread_arm",
  "kubejs:poison_bloom_throat",
  "kubejs:frogfin_sneak_leg",
  "kubejs:sporebog_lung",
  "kubejs:slime_mana_spleen",
  "kubejs:witchbog_crown",
  "kubejs:hydra_venom_core",
  "kubejs:mud_vein_conduit",
  "kubejs:rot_hyphae",
  "kubejs:swamp_gas_bladder",
  "kubejs:rot_pump"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLASWAMP_ORGAN_IDS)
})
})()
