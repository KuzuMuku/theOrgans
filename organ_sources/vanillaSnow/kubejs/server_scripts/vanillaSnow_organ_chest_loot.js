LootJS.modifiers(event => {
  event.addLootTableModifier('minecraft:chests/igloo_chest')
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('kubejs:frozensoil_chest_membrane'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('kubejs:icechip_arm'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('kubejs:snowblind_iris'))
    })
})
