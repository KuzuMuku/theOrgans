;(function () {

let VANILLAPILLAGER_ORGAN_IDS = [
  "vanillapillager:raider_ventricle",
  "vanillapillager:banner_spinewheel",
  "vanillapillager:outpost_chestplate",
  "vanillapillager:emerald_liver",
  "vanillapillager:horn_crown",
  "vanillapillager:scout_iris",
  "vanillapillager:loot_spleen",
  "vanillapillager:breach_gland",
  "vanillapillager:exile_kidneysheath",
  "vanillapillager:war_drum_cochlea",
  "vanillapillager:dark_arrow_throat",
  "vanillapillager:raid_scavenger_hand",
  "vanillapillager:skirmish_arm",
  "vanillapillager:banner_spike_shoulder",
  "vanillapillager:nightraid_tendon",
  "vanillapillager:plunder_core"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAPILLAGER_ORGAN_IDS)
})
})()
