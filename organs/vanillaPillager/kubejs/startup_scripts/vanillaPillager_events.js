;(function () {
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')

let SYSTEM_SOURCE = 'vanillaPillager_system'
let RESOURCE_CURRENT = 'kubejs:vanillaPillager_resonance'
let SURGE_KEY = 'kubejs:vanillaPillager_raid_surge'
let PLUNDER_CORE_ITEM = 'vanillapillager:plunder_core'
let MARK_POINT_KEY = OrganKubeJS.pointKey('mark', 'kubejs:vanillaPillager_mark')

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function rawEntity(entity) {
  return entity && entity.minecraftEntity ? entity.minecraftEntity : entity
}

function pointKey(pointType, pointId) {
  return OrganKubeJS.pointKey(pointType, pointId)
}

function getRuntimePoint(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId))
}

function getCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function addResource(player, amount) {
  if (!player || amount <= 0) {
    return
  }
  let entity = entityOf(player)
  let current = getCounter(player, RESOURCE_CURRENT)
  OrganKubeJS.setSourcePoint(entity, SYSTEM_SOURCE, pointKey('counter', RESOURCE_CURRENT), Math.max(0, Math.floor(current + amount)))
}

function installedSourceIds(player) {
  let found = []
  try {
    let positions = OrganQueryService.getInstalledOrganPositions(entityOf(player))
    let iterator = positions.iterator()
    while (iterator.hasNext()) {
      let position = iterator.next()
      let stack = position.organ()
      if (!stack || stack.isEmpty()) {
        continue
      }
      found.push(String(BuiltInRegistries.ITEM.getKey(stack.getItem())))
    }
  } catch (ignored) {
  }
  return found
}

function isMarked(target) {
  if (!target) {
    return false
  }
  return Number(OrganKubeJS.getPoint(rawEntity(target), MARK_POINT_KEY)) > 0
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
  let source = event.getSource()
  let attacker = source && source.actual ? source.actual : null
  if (!(attacker instanceof PlayerClass) || getRuntimePoint(attacker, SURGE_KEY) <= 0) {
    return
  }
  let dead = event.getEntity()
  if (!isMarked(dead) || installedSourceIds(attacker).indexOf(PLUNDER_CORE_ITEM) < 0) {
    return
  }
  OrganKubeJS.consumeMarkPoint(dead, 'kubejs:vanillaPillager_mark', 1)
  addResource(attacker, 3)
  OrganKubeJS.addTypedRuntimePoint(entityOf(attacker), 'runtime', 'kubejs:plunder_core_extra_loot', 1, 2)
})

})()
