LootJS.modifiers(event => {
  function addOrganPool(table, item, chance) {
    event.addLootTableModifier(table)
      .pool(pool => {
        pool.rolls(1)
        pool.randomChance(chance)
        pool.addLoot(LootEntry.of(item))
      })
  }

  let pillagerTables = [
    'minecraft:chests/pillager_outpost',
    'minecraft:chests/woodland_mansion',
    'irons_spellbooks:chests/evoker_fort'
  ]
  for (let i = 0; i < pillagerTables.length; i++) {
    let table = pillagerTables[i]
    let auxItems = [
      'kubejs:raider_banner_sash',
      'kubejs:crossbow_string_winder',
      'kubejs:wardrum_head',
      'kubejs:plunder_knot'
    ]
    for (let j = 0; j < auxItems.length; j++) {
      addOrganPool(table, auxItems[j], 0.08)
    }
  }

  addOrganPool('minecraft:chests/pillager_outpost', 'organapi:organ_item{OrganId:"vanillapillager:banner_spinewheel"}', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'organapi:organ_item{OrganId:"vanillapillager:emerald_liver"}', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'organapi:organ_item{OrganId:"vanillapillager:exile_kidneysheath"}', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'organapi:organ_item{OrganId:"vanillapillager:loot_spleen"}', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'organapi:organ_item{OrganId:"vanillapillager:outpost_chestplate"}', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'organapi:organ_item{OrganId:"vanillapillager:raid_scavenger_hand"}', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'organapi:organ_item{OrganId:"vanillapillager:scout_iris"}', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'organapi:organ_item{OrganId:"vanillapillager:war_drum_cochlea"}', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'organapi:organ_item{OrganId:"vanillapillager:plunder_core"}', 0.05)

  addOrganPool('minecraft:chests/woodland_mansion', 'organapi:organ_item{OrganId:"vanillapillager:banner_spike_shoulder"}', 0.1)
  addOrganPool('minecraft:chests/woodland_mansion', 'organapi:organ_item{OrganId:"vanillapillager:breach_gland"}', 0.1)
  addOrganPool('minecraft:chests/woodland_mansion', 'organapi:organ_item{OrganId:"vanillapillager:horn_crown"}', 0.1)
  addOrganPool('minecraft:chests/woodland_mansion', 'organapi:organ_item{OrganId:"vanillapillager:plunder_core"}', 0.08)

  addOrganPool('irons_spellbooks:chests/evoker_fort', 'organapi:organ_item{OrganId:"vanillapillager:breach_gland"}', 0.14)
  addOrganPool('irons_spellbooks:chests/evoker_fort', 'organapi:organ_item{OrganId:"vanillapillager:horn_crown"}', 0.14)
  addOrganPool('irons_spellbooks:chests/evoker_fort', 'organapi:organ_item{OrganId:"vanillapillager:dark_arrow_throat"}', 0.1)
  addOrganPool('irons_spellbooks:chests/evoker_fort', 'organapi:organ_item{OrganId:"vanillapillager:plunder_core"}', 0.15)
})
