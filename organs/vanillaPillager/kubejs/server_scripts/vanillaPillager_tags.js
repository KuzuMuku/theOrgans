;(function () {

let VANILLAPILLAGER_ORGAN_IDS = [
  "kubejs:raider_ventricle",
  "kubejs:banner_spinewheel",
  "kubejs:outpost_chestplate",
  "kubejs:emerald_liver",
  "kubejs:horn_crown",
  "kubejs:scout_iris",
  "kubejs:loot_spleen",
  "kubejs:breach_gland",
  "kubejs:exile_kidneysheath",
  "kubejs:war_drum_cochlea",
  "kubejs:dark_arrow_throat",
  "kubejs:raid_scavenger_hand",
  "kubejs:skirmish_arm",
  "kubejs:banner_spike_shoulder",
  "kubejs:nightraid_tendon"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAPILLAGER_ORGAN_IDS)
})
})()
