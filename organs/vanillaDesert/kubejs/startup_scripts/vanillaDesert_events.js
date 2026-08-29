;(function () {
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let Items = Java.loadClass('net.minecraft.world.item.Items')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')

let RELIC_BLOCKS = [
  'minecraft:chest',
  'minecraft:trapped_chest',
  'minecraft:barrel',
  'minecraft:suspicious_sand'
]
let RESOURCE = {
  system: 'vanillaDesert_system',
  current: 'kubejs:vanillaDesert_resonance',
  storm: 'kubejs:vanillaDesert_storm_window',
  stormKill: 'kubejs:vanillaDesert_storm_kill'
}

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function fireDesertEvent(player, type, target, blockState, itemStack) {
  let entity = entityOf(player)
  let builder = RuntimeEvent.builder(type, entity)
  if (target) {
    builder = builder.target(target)
  }
  if (blockState) {
    builder = builder.blockState(blockState)
  }
  if (itemStack && !itemStack.isEmpty()) {
    builder = builder.itemStack(itemStack)
  }
  RuntimeEffectService.fireEvent(entity, builder.build())
}

function getCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function getRuntimePoint(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId))
}

function setCounter(player, pointId, value) {
  OrganKubeJS.setSourcePoint(entityOf(player), RESOURCE.system, OrganKubeJS.pointKey('counter', pointId), Math.max(0, Math.floor(value)))
}

let myrmexClass = null
try {
  myrmexClass = Java.loadClass('com.github.alexthe666.iceandfire.entity.EntityMyrmexBase')
} catch (ignored) {
}

function entityTypeId(entity) {
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

function isDesertHunt(entity) {
  if (!entity) {
    return false
  }
  let id = entityTypeId(entity)
  if (String(id).indexOf('iceandfire:deathworm') === 0) {
    return true
  }
  if (myrmexClass && entity instanceof myrmexClass) {
    try {
      return !entity.isJungle()
    } catch (ignored) {
      return true
    }
  }
  return false
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
  let source = event.getSource()
  let attacker = source && source.getEntity ? source.getEntity() : null
  if (!(attacker instanceof PlayerClass)) {
    return
  }
  let dead = event.getEntity()
  if (isDesertHunt(dead)) {
    fireDesertEvent(attacker, 'vanillaDesert:hunt_kill', dead, null, null)
  }
  if (getRuntimePoint(attacker, RESOURCE.storm) > 0 && OrganKubeJS.getMark(dead, 'kubejs:vanillaDesert_mark') > 0) {
    setCounter(attacker, RESOURCE.stormKill, 1)
  }
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$RightClickBlock', event => {
  let player = event.getEntity()
  if (!(player instanceof PlayerClass) || event.getLevel().isClientSide()) {
    return
  }
  if (String(event.getHand()) !== 'MAIN_HAND') {
    return
  }
  let state = event.getLevel().getBlockState(event.getPos())
  let blockId = String(BuiltInRegistries.BLOCK.getKey(state.getBlock()))
  if (RELIC_BLOCKS.indexOf(blockId) < 0) {
    return
  }
  if (blockId === 'minecraft:suspicious_sand' && event.getItemStack().getItem() !== Items.BRUSH) {
    return
  }
  fireDesertEvent(player, 'vanillaDesert:relic_interact', null, state, event.getItemStack())
})

})()
