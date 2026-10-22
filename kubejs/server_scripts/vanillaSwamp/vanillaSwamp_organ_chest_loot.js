LootJS.modifiers(event => {
  event.addLootTableModifier('minecraft:chests/witch_hut')
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaswamp:frogfin_sneak_leg"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaswamp:poison_bloom_throat"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaswamp:sporebog_lung"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.05)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillaswamp:swamp_gas_bladder"})))
    })
})
