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

  addOrganPool('minecraft:chests/pillager_outpost', 'kubejs:banner_spinewheel', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'kubejs:emerald_liver', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'kubejs:exile_kidneysheath', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'kubejs:loot_spleen', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'kubejs:outpost_chestplate', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'kubejs:raid_scavenger_hand', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'kubejs:scout_iris', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'kubejs:war_drum_cochlea', 0.1)
  addOrganPool('minecraft:chests/pillager_outpost', 'kubejs:plunder_core', 0.05)

  addOrganPool('minecraft:chests/woodland_mansion', 'kubejs:banner_spike_shoulder', 0.1)
  addOrganPool('minecraft:chests/woodland_mansion', 'kubejs:breach_gland', 0.1)
  addOrganPool('minecraft:chests/woodland_mansion', 'kubejs:horn_crown', 0.1)
  addOrganPool('minecraft:chests/woodland_mansion', 'kubejs:plunder_core', 0.08)

  addOrganPool('irons_spellbooks:chests/evoker_fort', 'kubejs:breach_gland', 0.14)
  addOrganPool('irons_spellbooks:chests/evoker_fort', 'kubejs:horn_crown', 0.14)
  addOrganPool('irons_spellbooks:chests/evoker_fort', 'kubejs:dark_arrow_throat', 0.1)
  addOrganPool('irons_spellbooks:chests/evoker_fort', 'kubejs:plunder_core', 0.15)
})
