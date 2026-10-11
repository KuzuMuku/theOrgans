LootJS.modifiers(event => {
  let snowOrgans = [
    'organapi:organ_item{OrganId:"vanillasnow:frostseal_ventricle"}',
    'organapi:organ_item{OrganId:"vanillasnow:frozensoil_chest_membrane"}',
    'organapi:organ_item{OrganId:"vanillasnow:birchmarrow_liver"}',
    'organapi:organ_item{OrganId:"vanillasnow:icecrystal_lung"}',
    'organapi:organ_item{OrganId:"vanillasnow:frostlight_crown"}',
    'organapi:organ_item{OrganId:"vanillasnow:snowhide_spleen"}',
    'organapi:organ_item{OrganId:"vanillasnow:icechip_arm"}',
    'organapi:organ_item{OrganId:"vanillasnow:snowblind_iris"}',
    'organapi:organ_item{OrganId:"vanillasnow:frosthoof_tendon"}',
    'organapi:organ_item{OrganId:"vanillasnow:freezebreak_sheath"}'
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
      pool.addLoot(LootEntry.of('organapi:organ_item{OrganId:"vanillasnow:frozensoil_chest_membrane"}'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('organapi:organ_item{OrganId:"vanillasnow:icechip_arm"}'))
    })
    .pool(pool => {
      pool.rolls(1)
      pool.randomChance(0.1)
      pool.addLoot(LootEntry.of('organapi:organ_item{OrganId:"vanillasnow:snowblind_iris"}'))
    })

  addSnowLoot('aquamirae:chests/maze_camp_chest', 0.05)
  addSnowLoot('aquamirae:chests/maze_common_chest', 0.05)
  addSnowLoot('aquamirae:chests/ship_1', 0.05)
  addSnowLoot('aquamirae:chests/ship_2', 0.05)
})
