LootJS.modifiers(event => {
  event.addLootTableModifier('minecraft:chests/jungle_temple')
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('kubejs:flytrap_throat_sac'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('kubejs:jaguar_crouch_tendon'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('kubejs:temple_moss_spine'))
    })
})
