;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let JsonObject = Java.loadClass('com.google.gson.JsonObject')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')

let HUNT_ENTITIES = [
  'minecraft:polar_bear',
  'minecraft:goat',
  'minecraft:stray',
  'minecraft:rabbit',
  'minecraft:fox',
  'minecraft:snow_golem',
  'aquamirae:maw',
  'aquamirae:spinefish',
  'aquamirae:jellyfish',
  'aquamirae:anglerfish',
  'aquamirae:tortured_soul',
  'aquamirae:golden_moth',
  'aquamirae:captain_cornelia',
  'aquamirae:maze_mother'
]

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function getCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function entityTypeId(entity) {
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

function fireHuntEvent(player, dead) {
  if (!player || !dead || !(dead instanceof LivingEntityClass)) {
    return
  }
  let entity = entityOf(player)
  let extra = new JsonObject()
  extra.addProperty('entity_type', entityTypeId(dead))
  let builder = RuntimeEvent.builder('vanillaSnow:hunt_kill', entity)
    .target(entityOf(dead))
    .amount(2)
    .extra(extra)
  if (entity instanceof LivingEntityClass) {
    RuntimeEffectService.fireEvent(entity, builder.build())
  }
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
  let source = event.getSource()
  let attacker = source && source.actual ? source.actual : null
  if (!(attacker instanceof PlayerClass) || attacker.getLevel().isClientSide() || !(event.getEntity() instanceof LivingEntityClass)) {
    return
  }
  if (getCounter(attacker, 'kubejs:snowhide_spleen_effect') <= 0) {
    return
  }
  let dead = event.getEntity()
  if (HUNT_ENTITIES.indexOf(entityTypeId(dead)) < 0) {
    return
  }
  fireHuntEvent(attacker, dead)
})

ForgeEvents.onEvent('io.redspace.ironsspellbooks.api.events.SpellDamageEvent', event => {
  let source = event.getSpellDamageSource()
  let caster = source && source.actual ? source.actual : null
  if (!(caster instanceof PlayerClass) || caster.getLevel().isClientSide() || !(event.getEntity() instanceof LivingEntityClass)) {
    return
  }
  if (Number(OrganKubeJS.getTypedPoint(entityOf(caster), 'runtime', 'kubejs:vanillaSnow_deepfreeze_online')) <= 0) {
    return
  }
  let target = event.getEntity()
  let slow = target.getEffect(MobEffects.MOVEMENT_SLOWDOWN)
  if (slow) {
    target.removeEffect(MobEffects.MOVEMENT_SLOWDOWN)
  }
  let baseDuration = slow ? Number(slow.getDuration()) : 0
  let amplifier = slow ? Number(slow.getAmplifier()) : 1
  target.addEffect(new MobEffectInstance(MobEffects.MOVEMENT_SLOWDOWN, baseDuration + 20, amplifier, false, false, true))
})

})()
