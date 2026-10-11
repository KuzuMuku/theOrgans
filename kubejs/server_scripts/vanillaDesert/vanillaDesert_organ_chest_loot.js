LootJS.modifiers(event => {
  event.addLootTableModifier('minecraft:chests/desert_pyramid')
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('organapi:organ_item{OrganId:"vanilladesert:heatwave_lung"}'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('organapi:organ_item{OrganId:"vanilladesert:quicksand_spleen"}'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('organapi:organ_item{OrganId:"vanilladesert:temple_scavenger_hand"}'))
    })
})
