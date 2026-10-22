LootJS.modifiers(event => {
  let snowOrgans = [
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:frostseal_ventricle"}),
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:frozensoil_chest_membrane"}),
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:birchmarrow_liver"}),
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:icecrystal_lung"}),
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:frostlight_crown"}),
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:snowhide_spleen"}),
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:icechip_arm"}),
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:snowblind_iris"}),
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:frosthoof_tendon"}),
    Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:freezebreak_sheath"})
  ]
  let snowAux = [
    'kubejs:deposition_conduit',
    'kubejs:frostvein_bundle',
    'kubejs:icecore_rhythm'
  ]

  function addSnowLoot(table, auxChance) {
    let modifier = event.addLootTableModifier(table)
    for (let i = 0; i < snowOrgans.length; i++) {
      modifier.pool(pool => {
        pool.rolls(1)
        pool.randomChance(0.1)
        pool.addLoot(LootEntry.of(snowOrgans[i]))
      })
    }
    if (auxChance) {
      for (let i = 0; i < snowAux.length; i++) {
        modifier.pool(pool => {
          pool.rolls(1)
          pool.randomChance(auxChance)
          pool.addLoot(LootEntry.of(snowAux[i]))
        })
      }
    }
  }

  event.addLootTableModifier('minecraft:chests/igloo_chest')
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:frozensoil_chest_membrane"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:icechip_arm"})))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of(Item.of('organapi:organ_item').withNBT({OrganId:"vanillasnow:snowblind_iris"})))
    })

  addSnowLoot('aquamirae:chests/maze_camp_chest', 0.05)
  addSnowLoot('aquamirae:chests/maze_common_chest', 0.05)
  addSnowLoot('aquamirae:chests/ship_1', 0.05)
  addSnowLoot('aquamirae:chests/ship_2', 0.05)
})
