;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')

let SYSTEM_SOURCE = 'vanillaSwamp_system'
let RESOURCE_CURRENT = 'kubejs:vanillaSwamp_resonance'
let SWAMP_CORPSES = [
  'minecraft:frog',
  'minecraft:slime',
  'minecraft:witch',
  'minecraft:glow_squid',
  'minecraft:tropical_fish',
  'iceandfire:hydra'
]

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function pointKey(pointType, pointId) {
  return OrganKubeJS.pointKey(pointType, pointId)
}

function getRuntimePoint(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId))
}

function addResource(player, amount) {
  if (!player || amount <= 0) {
    return
  }
  let entity = entityOf(player)
  let current = Number(OrganKubeJS.getTypedPoint(entity, 'counter', RESOURCE_CURRENT))
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

function entityTypeId(entity) {
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

function addEffect(entity, effect, duration, amplifier) {
  let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
  entity.addEffect(new MobEffectInstance(effect, duration, amplifier, false, false, true))
}

function playerInstalled(player, id) {
  if (!player) {
    return false
  }
  return installedSourceIds(player).indexOf(id) >= 0
}

function rotHyphaeOnline(player) {
  return playerInstalled(player, 'kubejs:rot_hyphae')
}

function spreadMarkedCorpse(player, deadTarget) {
  let nearby = Common.targetsSortedByDistance(player, 6)
  let spreadCount = 0
  for (let i = 0; i < nearby.length; i++) {
    let target = nearby[i]
    if (!target || !(target instanceof LivingEntityClass) || target === deadTarget || !target.isAlive()) {
      continue
    }
    if (spreadCount >= 3) {
      break
    }
    OrganKubeJS.addMarkPoint(target, 'kubejs:vanillaSwamp_mark', 1)
    addEffect(target, MobEffects.POISON, 60, 0)
    addEffect(target, MobEffects.MOVEMENT_SLOWDOWN, 40, 0)
    spreadCount++
  }
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
  let deadTarget = event.getEntity()
  if (deadTarget && SWAMP_CORPSES.indexOf(entityTypeId(deadTarget)) >= 0) {
    try {
      let players = deadTarget.level.players
      let iterator = players.iterator()
      while (iterator.hasNext()) {
        let nearbyPlayer = iterator.next()
        if (!(nearbyPlayer instanceof PlayerClass) || !rotHyphaeOnline(nearbyPlayer)) {
          continue
        }
        if (Common.sqDistanceBetween(nearbyPlayer, deadTarget) <= 36) {
          addResource(nearbyPlayer, 1)
        }
      }
    } catch (ignored) {
    }
  }

  let source = event.getSource()
  let attacker = source && source.getEntity ? source.getEntity() : null
  if (!(attacker instanceof PlayerClass)) {
    return
  }

  let player = attacker
  let marked = deadTarget && OrganKubeJS.getMark(deadTarget, 'kubejs:vanillaSwamp_mark') > 0
  if (!marked) {
    return
  }

  if (playerInstalled(player, 'kubejs:hydra_venom_core') && getRuntimePoint(player, 'kubejs:vanillaSwamp_rotting_window') > 0) {
    addResource(player, 5)
  }

  if (playerInstalled(player, 'kubejs:mud_vein_conduit')) {
    spreadMarkedCorpse(player, deadTarget)
  }
})

})()
