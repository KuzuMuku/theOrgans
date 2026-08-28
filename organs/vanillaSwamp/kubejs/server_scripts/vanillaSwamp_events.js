;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')

let Runtime = Common.createRuntimeTools('vanillaSwamp_system', 'vanillaSwamp_links', 'kubejs:vanillaSwamp_resonance')
let entityOf = Common.entityOf
let addResource = Runtime.addResource
let getRuntimePoint = Runtime.getRuntimePoint
let installedSourceIds = Common.installedSourceIds
let addEffect = Common.addEffect
let entityTypeId = Common.entityTypeId
let SWAMP_CORPSES = [
  'minecraft:frog',
  'minecraft:slime',
  'minecraft:witch',
  'minecraft:glow_squid',
  'minecraft:tropical_fish',
  'iceandfire:hydra'
]
let WETLAND_PLANTS = [
  'minecraft:lily_pad',
  'minecraft:vines',
  'minecraft:moss_block',
  'minecraft:mangrove_propagule',
  'minecraft:brown_mushroom',
  'minecraft:red_mushroom',
  'minecraft:short_grass',
  'minecraft:seagrass',
  'minecraft:kelp'
]

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

BlockEvents.broken(event => {
  let player = event.player || event.entity
  if (!player || !rotHyphaeOnline(player)) {
    return
  }
  let block = event.block
  if (!block || WETLAND_PLANTS.indexOf(block.getId()) < 0) {
    return
  }
  let entity = entityOf(player)
  if (!entity || entity.level.isClientSide()) {
    return
  }
  addResource(player, 1)
})

})()
