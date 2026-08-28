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
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.05)
      pool.addLoot(LootEntry.of('kubejs:wooden_sap_conduit'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.05)
      pool.addLoot(LootEntry.of('kubejs:root_anchor_silk'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.05)
      pool.addLoot(LootEntry.of('kubejs:aerial_root_breathing_tube'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.05)
      pool.addLoot(LootEntry.of('kubejs:vine_bind_bundle'))
    })
})
