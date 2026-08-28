;(function () {
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')

let SYSTEM_SOURCE = 'vanillaEnd_system'
let END_MOB_IDS = [
  'minecraft:enderman',
  'minecraft:endermite',
  'minecraft:shulker',
  'minecraft:ender_dragon',
  'cataclysm:ender_guardian',
  'cataclysm:ender_golem'
]
let END_BLOCK_IDS = [
  'minecraft:end_stone',
  'minecraft:end_stone_bricks',
  'minecraft:end_stone_brick_stairs',
  'minecraft:end_stone_brick_slab',
  'minecraft:purpur_block',
  'minecraft:purpur_pillar',
  'minecraft:purpur_stairs',
  'minecraft:purpur_slab'
]
let END_CHEST_IDS = [
  'minecraft:chest',
  'minecraft:trapped_chest',
  'minecraft:barrel'
]

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function entityTypeId(entity) {
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

function blockTypeId(state) {
  try {
    return String(BuiltInRegistries.BLOCK.getKey(state.getBlock()))
  } catch (ignored) {
    return ''
  }
}

function dimensionId(entity) {
  try {
    return String(entity.level.dimension().location())
  } catch (ignored) {
    return ''
  }
}

function getRuntimePoint(player, pointId) {
  try {
    return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId))
  } catch (ignored) {
    return 0
  }
}

function consumeTravelSurge(player) {
  try {
    let entity = entityOf(player)
    let used = Number(OrganKubeJS.consumeRuntimePoint(entity, 'runtime:kubejs:vanillaEnd_travel_surge', 1))
    if (used > 0) {
      return used
    }
    return Number(OrganKubeJS.consumeSourcePoint(
      entity,
      SYSTEM_SOURCE,
      'runtime:kubejs:vanillaEnd_travel_surge',
      1
    ))
  } catch (ignored) {
    return 0
  }
}

function installedSourceIds(player) {
  let entity = entityOf(player)
  let found = []
  try {
    let positions = OrganQueryService.getInstalledOrganPositions(entity)
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

function hasInstalled(player, itemId) {
  return installedSourceIds(player).indexOf(itemId) >= 0
}

function inventoryCount(player, itemId) {
  let entity = entityOf(player)
  let total = 0
  try {
    let inventory = entity.getInventory()
    for (let slot = 0; slot < inventory.getContainerSize(); slot++) {
      let stack = inventory.getItem(slot)
      if (!stack || stack.isEmpty()) {
        continue
      }
      if (String(BuiltInRegistries.ITEM.getKey(stack.getItem())) === itemId) {
        total += Number(stack.getCount())
      }
    }
  } catch (ignored) {
  }
  return total
}

function addResonance(player, amount) {
  return Number(OrganKubeJS.addSourcePoint(
    entityOf(player),
    SYSTEM_SOURCE,
    'counter:kubejs:vanillaEnd_resonance',
    amount
  ))
}

function fireEndEvent(player, type, target, blockState, itemStack) {
  let entity = entityOf(player)
  if (!entity) {
    return
  }
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

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
  let source = event.getSource()
  let attacker = source && source.actual ? source.actual : null
  if (!(attacker instanceof PlayerClass)) {
    return
  }
  let dead = event.getEntity()
  let deadId = entityTypeId(dead)
  if (END_MOB_IDS.indexOf(deadId) < 0 && String(deadId).indexOf('cataclysm:ender_') !== 0) {
    return
  }
  if (getRuntimePoint(attacker, 'kubejs:vanillaEnd_void_guard') > 0) {
    addResonance(attacker, 3)
  }
  fireEndEvent(attacker, 'vanillaEnd:end_kill', dead, null, null)
})

ForgeEvents.onEvent('net.minecraftforge.event.level.BlockEvent.BreakEvent', event => {
  let player = event.getPlayer()
  if (!(player instanceof PlayerClass) || event.getLevel().isClientSide()) {
    return
  }
  let state = event.getState()
  if (END_BLOCK_IDS.indexOf(blockTypeId(state)) < 0) {
    return
  }
  fireEndEvent(player, 'vanillaEnd:end_mine', null, state, null)
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent.RightClickBlock', event => {
  let player = event.getEntity()
  if (!(player instanceof PlayerClass) || event.getLevel().isClientSide()) {
    return
  }
  if (dimensionId(entityOf(player)) !== 'minecraft:the_end') {
    return
  }
  let state = event.getLevel().getBlockState(event.getPos())
  if (END_CHEST_IDS.indexOf(blockTypeId(state)) < 0) {
    return
  }
  fireEndEvent(player, 'vanillaEnd:city_chest', null, state, event.getItemStack())
})

ForgeEvents.onEvent('io.redspace.ironsspellbooks.api.events.SpellDamageEvent', event => {
  let source = event.getSpellDamageSource()
  if (!source) {
    return
  }
  let caster = source.actual
  if (!(caster instanceof PlayerClass) || getRuntimePoint(caster, 'kubejs:vanillaEnd_travel_surge') <= 0) {
    return
  }
  let spell = source.spell()
  if (!spell || !spell.getSchoolType() || String(spell.getSchoolType().getId()) !== 'irons_spellbooks:ender') {
    return
  }
  if (consumeTravelSurge(caster) > 0) {
    event.setAmount(Number(event.getAmount()) + 2)
  }
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent', event => {
  let victim = event.getEntity()
  if (victim instanceof PlayerClass) {
    if (hasInstalled(victim, 'kubejs:return_spine_furnace') && inventoryCount(victim, 'kubejs:void_conduit') > 0) {
      addResonance(victim, 1)
    }
    if (hasInstalled(victim, 'kubejs:endgate_lung') && inventoryCount(victim, 'kubejs:void_conduit') > 0) {
      addResonance(victim, 1)
    }
  }
  let source = event.getSource()
  let attacker = source && source.actual ? source.actual : null
  if (!(attacker instanceof PlayerClass) || getRuntimePoint(attacker, 'kubejs:vanillaEnd_travel_surge') <= 0) {
    return
  }
  if (consumeTravelSurge(attacker) > 0) {
    event.setAmount(Number(event.getAmount()) + 2)
  }
})

})()
