;(function () {
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PiglinClass = Java.loadClass('net.minecraft.world.entity.monster.piglin.Piglin')
let PotionItemClass = Java.loadClass('net.minecraft.world.item.PotionItem')
let ItemTags = Java.loadClass('net.minecraft.tags.ItemTags')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')

let NETHER_HUNT_IDS = [
  'minecraft:blaze',
  'minecraft:ghast',
  'minecraft:wither_skeleton',
  'minecraft:skeleton',
  'minecraft:magma_cube',
  'minecraft:hoglin',
  'minecraft:zoglin',
  'minecraft:piglin',
  'minecraft:piglin_brute',
  'minecraft:zombified_piglin',
  'minecraft:strider',
  'alexsmobs:crimson_mosquito',
  'alexsmobs:warped_mosco'
]

let HERB_ITEM_IDS = [
  'minecraft:nether_wart',
  'minecraft:crimson_fungus',
  'minecraft:warped_fungus',
  'minecraft:crimson_roots',
  'minecraft:warped_roots',
  'minecraft:red_mushroom',
  'minecraft:brown_mushroom',
  'minecraft:mushroom_stew',
  'minecraft:suspicious_stew'
]

let SMELTFIST_ORGAN = 'kubejs:smeltfist_subcore'
let SMELTFIST_STACKS = 'kubejs:vanillaNether_smeltfist_stacks'

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function rawEntity(entity) {
  return entity && entity.minecraftEntity ? entity.minecraftEntity : entity
}

function fireNetherEvent(player, type, target, itemStack, blockState) {
  let entity = entityOf(player)
  let builder = RuntimeEvent.builder(type, entity)
  if (target) {
    builder = builder.target(rawEntity(target))
  }
  if (itemStack && !itemStack.isEmpty()) {
    builder = builder.itemStack(itemStack)
  }
  if (blockState) {
    builder = builder.blockState(blockState)
  }
  RuntimeEffectService.fireEvent(entity, builder.build())
}

function entityTypeId(entity) {
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

function itemId(stack) {
  try {
    return String(BuiltInRegistries.ITEM.getKey(stack.getItem()))
  } catch (ignored) {
    return ''
  }
}

function hasNetherOrgan(player, organId) {
  let entity = entityOf(player)
  let positions = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService').getInstalledOrganPositions(entity)
  let iterator = positions.iterator()
  while (iterator.hasNext()) {
    let stack = iterator.next().organ()
    if (!stack || stack.isEmpty()) {
      continue
    }
    if (String(BuiltInRegistries.ITEM.getKey(stack.getItem())) === organId) {
      return true
    }
  }
  return false
}

function setRuntime(player, pointId, durationTicks) {
  if (!player) {
    return
  }
  let key = OrganKubeJS.pointKey('runtime', pointId)
  OrganKubeJS.setRuntimePoint(entityOf(player), key, 1, Math.max(2, durationTicks))
}

function clearRuntime(player, pointId) {
  if (!player) {
    return
  }
  let entity = entityOf(player)
  let key = OrganKubeJS.pointKey('runtime', pointId)
  try {
    OrganKubeJS.clearRuntimePoint(entity, key)
  } catch (ignored) {
  }
}

function hasRuntime(player, pointId) {
  try {
    return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId)) > 0
  } catch (ignored) {
    return false
  }
}

function getRuntimeValue(player, pointId) {
  try {
    return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId))
  } catch (ignored) {
    return 0
  }
}

function setRuntimeValue(player, pointId, value, durationTicks) {
  if (!player) {
    return
  }
  let key = OrganKubeJS.pointKey('runtime', pointId)
  OrganKubeJS.setRuntimePoint(entityOf(player), key, Math.max(0, value), Math.max(2, durationTicks))
}

function isFireDamage(source) {
  if (!source) {
    return false
  }
  try {
    return !!source.isFire()
  } catch (ignored) {
  }
  try {
    let id = String(source.type().msgId())
    return id.indexOf('fire') >= 0 || id.indexOf('lava') >= 0 || id.indexOf('hot_floor') >= 0
  } catch (ignored) {
  }
  return false
}

function addEmber(player, amount) {
  if (!player) {
    return
  }
  let entity = entityOf(player)
  let current = Number(OrganKubeJS.getTypedPoint(entity, 'counter', 'kubejs:vanillaNether_resonance'))
  OrganKubeJS.setSourcePoint(entity, 'vanillaNether_system', OrganKubeJS.pointKey('counter', 'kubejs:vanillaNether_resonance'), Math.max(0, current + amount))
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
  let source = event.getSource()
  let attacker = source && source.getEntity ? source.getEntity() : null
  if (!(attacker instanceof PlayerClass)) {
    return
  }
  if (NETHER_HUNT_IDS.indexOf(entityTypeId(event.getEntity())) < 0) {
    return
  }
  fireNetherEvent(attacker, 'vanillaNether:nether_kill', event.getEntity(), null, null)
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingEntityUseItemEvent$Finish', event => {
  let entity = event.getEntity()
  if (!(entity instanceof PlayerClass) || entity.level.isClientSide()) {
    return
  }
  let stack = event.getItem()
  if (!stack || stack.isEmpty()) {
    return
  }
  let id = itemId(stack)
  let isPotion = stack.getItem() instanceof PotionItemClass
  if (HERB_ITEM_IDS.indexOf(id) < 0 && !isPotion) {
    return
  }
  fireNetherEvent(entity, 'vanillaNether:herb_supply', null, stack, null)
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$EntityInteract', event => {
  let player = event.getEntity()
  let target = event.getTarget()
  let stack = event.getItemStack()
  if (!(player instanceof PlayerClass) || event.getLevel().isClientSide() || String(event.getHand()) !== 'MAIN_HAND') {
    return
  }
  let id = itemId(stack)
  let lovedByPiglin = false
  try {
    lovedByPiglin = !!stack.is(ItemTags.PIGLIN_LOVED)
  } catch (ignored) {
    lovedByPiglin = id === 'minecraft:gold_ingot' || id === 'minecraft:gold_nugget' || id === 'minecraft:gold_block'
  }
  if (!(target instanceof PiglinClass) && !lovedByPiglin) {
    return
  }
  if (lovedByPiglin || id.indexOf('gold') >= 0 || id === 'minecraft:gilded_blackstone') {
    setRuntime(player, 'kubejs:vanillaNether_contract_window', 120)
    fireNetherEvent(player, 'vanillaNether:trade', target, stack, null)
  }
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$RightClickBlock', event => {
  let player = event.getEntity()
  if (!(player instanceof PlayerClass) || event.getLevel().isClientSide() || String(event.getHand()) !== 'MAIN_HAND') {
    return
  }
  let state = event.getLevel().getBlockState(event.getPos())
  let blockId = String(BuiltInRegistries.BLOCK.getKey(state.getBlock()))
  if (blockId.indexOf('chest') < 0 && blockId.indexOf('barrel') < 0) {
    return
  }
  fireNetherEvent(player, 'vanillaNether:chest_open', null, null, state)
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent', event => {
  let entity = event.getEntity()
  let source = event.getSource()
  if (entity instanceof PlayerClass) {
    if (hasNetherOrgan(entity, SMELTFIST_ORGAN)) {
      let stacks = getRuntimeValue(entity, SMELTFIST_STACKS) + 1
      setRuntimeValue(entity, SMELTFIST_STACKS, stacks, 100)
    }
    if (hasNetherOrgan(entity, 'kubejs:hellfire_tailbone')) {
      setRuntime(entity, 'kubejs:vanillaNether_hellfire_retribution', 100)
    }
    if (hasNetherOrgan(entity, 'kubejs:obsidian_chest_cavity') && isFireDamage(source)) {
      event.setAmount(Number(event.getAmount()) * 0.8)
    }
  }

  let attacker = source && source.getEntity ? source.getEntity() : null
  if (!(attacker instanceof PlayerClass)) {
    return
  }
  let target = entity
  if (!(target instanceof LivingEntityClass) || !target.isAlive()) {
    return
  }
  if (hasRuntime(attacker, 'kubejs:vanillaNether_hellfire_retribution')) {
    event.setAmount(Number(event.getAmount()) * 1.5)
    target.setSecondsOnFire(2)
    clearRuntime(attacker, 'kubejs:vanillaNether_hellfire_retribution')
  }

  if (hasNetherOrgan(attacker, SMELTFIST_ORGAN) && getRuntimeValue(attacker, SMELTFIST_STACKS) >= 3) {
    let area = entityOf(attacker).getEntitiesOfClass(LivingEntityClass, entityOf(attacker).getBoundingBox().inflate(3.5), candidate => candidate !== attacker && candidate.isAlive())
    let iterator = area.iterator()
    while (iterator.hasNext()) {
      iterator.next().setSecondsOnFire(4)
    }
    clearRuntime(attacker, SMELTFIST_STACKS)
  }
})

ForgeEvents.onEvent('io.redspace.ironsspellbooks.api.events.SpellDamageEvent', event => {
  let source = event.getSpellDamageSource()
  if (!source) {
    return
  }
  let caster = source.getEntity()
  if (!(caster instanceof PlayerClass)) {
    return
  }
  let spell = source.spell()
  let school = spell && spell.getSchoolType() ? String(spell.getSchoolType().getId()) : ''

  if (school === 'irons_spellbooks:fire' && hasRuntime(caster, 'kubejs:vanillaNether_inferno_upkeep')) {
    addEmber(caster, 1)
  }

  if (school === 'irons_spellbooks:fire' && hasRuntime(caster, 'kubejs:vanillaNether_hellfire_retribution')) {
    let amount = Number(event.getAmount())
    event.setAmount(amount * 1.5)
    let target = event.getEntity()
    if (target instanceof LivingEntityClass && target.isAlive()) {
      target.setSecondsOnFire(2)
    }
    clearRuntime(caster, 'kubejs:vanillaNether_hellfire_retribution')
  }
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingEvent$LivingJumpEvent', event => {
  let entity = event.getEntity()
  if (entity instanceof PlayerClass) {
    setRuntime(entity, 'kubejs:vanillaNether_jump_momentum', 80)
  }
})

})()
