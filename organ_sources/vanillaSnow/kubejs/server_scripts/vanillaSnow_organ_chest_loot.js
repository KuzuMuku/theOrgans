LootJS.modifiers(event => {
  let snowOrgans = [
    'kubejs:frostseal_ventricle',
    'kubejs:frozensoil_chest_membrane',
    'kubejs:birchmarrow_liver',
    'kubejs:icecrystal_lung',
    'kubejs:frostlight_crown',
    'kubejs:snowhide_spleen',
    'kubejs:icechip_arm',
    'kubejs:snowblind_iris',
    'kubejs:frosthoof_tendon',
    'kubejs:freezebreak_sheath'
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

  addSnowLoot('aquamirae:chests/maze_camp_chest', 0.05)
  addSnowLoot('aquamirae:chests/maze_common_chest', 0.05)
  addSnowLoot('aquamirae:chests/ship_1', 0.05)
  addSnowLoot('aquamirae:chests/ship_2', 0.05)
})
