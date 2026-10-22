LootJS.modifiers(event => {
  event.addLootTableModifier('minecraft:chests/end_city_treasure')
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaend:endbound_shoulderplate"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaend:enddust_spleen_membrane"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaend:endgate_lung"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaend:endpattern_iris"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaend:gategap_tailbone"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaend:return_spine_furnace"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaend:wingfold_shoulder_ring"})))
    })
})
