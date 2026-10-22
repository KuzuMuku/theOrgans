LootJS.modifiers(event => {
  event.addLootTableModifier('minecraft:chests/jungle_temple')
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillajungle:flytrap_throat_sac"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillajungle:jaguar_crouch_tendon"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillajungle:temple_moss_spine"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.05)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillajungle:wooden_sap_conduit"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.05)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillajungle:root_anchor_silk"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.05)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillajungle:aerial_root_breathing_tube"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.05)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillajungle:vine_bind_bundle"})))
    })
})
