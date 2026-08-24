;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let ServerLevelClass = Java.loadClass('net.minecraft.server.level.ServerLevel')
let GameEventTags = Java.loadClass('net.minecraft.tags.GameEventTags')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')
let ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
let Items = Java.loadClass('net.minecraft.world.item.Items')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

let RESOURCE = {
  system: 'vanillaSculk_system',
  current: 'kubejs:vanillaSculk_resonance'
}
let SYSTEM_SOURCE = RESOURCE.system
let MARK_POINT_KEY = OrganKubeJS.pointKey('mark', 'kubejs:vanillaSculk_mark')
let SCULK_MOBS = [
  'minecraft:warden',
  'deeperdarker:sculk_leech',
  'deeperdarker:stalker',
  'deeperdarker:shriek_worm',
  'deeperdarker:shattered'
]

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function pointKey(pointType, pointId) {
  return OrganKubeJS.pointKey(pointType, pointId)
}

function getCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function setCounter(player, pointId, value) {
  OrganKubeJS.setSourcePoint(entityOf(player), SYSTEM_SOURCE, pointKey('counter', pointId), Math.max(0, Math.floor(value)))
}

function consumeCounter(player, pointId, amount) {
  return Number(OrganKubeJS.consumeSourcePoint(entityOf(player), SYSTEM_SOURCE, pointKey('counter', pointId), Math.floor(amount)))
}

function getRuntimePoint(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId))
}

function entityTypeId(entity) {
  return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
}

function isMarked(target) {
  if (!target) {
    return false
  }
  try {
    let points = OrganKubeJS.getPoints(target)
    let iterator = points.entrySet().iterator()
    while (iterator.hasNext()) {
      let entry = iterator.next()
      if (String(entry.getKey()) === MARK_POINT_KEY && Number(entry.getValue()) > 0) {
        return true
      }
    }
  } catch (ignored) {
  }
  return false
}

function isQuiet(player) {
  return getRuntimePoint(player, 'kubejs:vanillaSculk_quiet_window') > 0
}

function sqDistanceBetween(a, b) {
  let dx = Number(a.getX()) - Number(b.getX())
  let dy = Number(a.getY()) - Number(b.getY())
  let dz = Number(a.getZ()) - Number(b.getZ())
  return dx * dx + dy * dy + dz * dz
}

function fireSculkEventWithAmount(player, type, target, amount) {
  let entity = entityOf(player)
  let builder = RuntimeEvent.builder(type, entity).target(target || entity).amount(Number(amount))
  RuntimeEffectService.fireEvent(entity, builder.build())
}

ForgeEvents.onEvent('net.minecraftforge.event.VanillaGameEvent', event => {
  let level = event.getLevel()
  let cause = event.getCause()

  if (!event.getVanillaEvent().is(GameEventTags.VIBRATIONS)) {
    return
  }

  if (cause instanceof PlayerClass) {
    let soleCount = getCounter(cause, 'kubejs:slient_shulk')
    if (isQuiet(cause) || (soleCount > 0 && Math.random() < 0.34 * soleCount)) {
      event.setCanceled(true)
    }
    return
  }

  if (!(cause instanceof LivingEntityClass) || !(level instanceof ServerLevelClass)) {
    return
  }

  let players = level.players
  let iterator = players.iterator()
  while (iterator.hasNext()) {
    let player = iterator.next()
    let distanceSq = sqDistanceBetween(entityOf(player), cause)
    if (distanceSq > 256.0) {
      continue
    }
    fireSculkEventWithAmount(player, 'vanillaSculk:vibration', cause, Math.sqrt(distanceSq))
  }
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent', event => {
  let target = event.getEntity()
  let source = event.getSource()
  let attacker = source && source.actual ? source.actual : null

  if (!(attacker instanceof PlayerClass)) {
    return
  }

  let glands = getCounter(attacker, 'kubejs:silent_arrow_gland_effect')
  if (glands <= 0 || source.type().msgId() !== 'arrow') {
    return
  }

  let resonance = getCounter(attacker, RESOURCE.current)
  let need = 2 * glands
  if (!isMarked(target) || resonance < need) {
    return
  }
  event.setAmount(Number(event.getAmount()) * (1 + 0.5 * glands))
  consumeCounter(attacker, RESOURCE.current, need)
})

ForgeEvents.onEvent('io.redspace.ironsspellbooks.api.events.SpellDamageEvent', event => {
  let source = event.getSpellDamageSource()
  if (!source) {
    return
  }
  let caster = source.actual
  if (!(caster instanceof PlayerClass)) {
    return
  }
  if (getCounter(caster, 'kubejs:sensor_subbrain_effect') <= 0) {
    return
  }
  let spell = source.spell()
  if (!spell || !spell.getSchoolType() || String(spell.getSchoolType().getId()) !== 'irons_spellbooks:eldritch') {
    return
  }
  let target = event.getEntity()
  let resonance = getCounter(caster, RESOURCE.current)
  if (!isMarked(target) || resonance < 5) {
    return
  }
  event.setAmount(Number(event.getAmount()) * resonance * 0.2)
  consumeCounter(caster, RESOURCE.current, Math.floor(resonance / 2))
})

ForgeEvents.onEvent('io.redspace.ironsspellbooks.api.events.SpellOnCastEvent', event => {
  let player = event.getEntity()
  if (!(player instanceof PlayerClass)) {
    return
  }
  let wavefront_forehead_effect = getCounter(player, 'kubejs:wavefront_forehead_effect')
  if (wavefront_forehead_effect <= 0) {
    return
  }
  let resonance = getCounter(player, RESOURCE.current) + Number(event.getManaCost()) * 0.02 * wavefront_forehead_effect
  setCounter(player, RESOURCE.current, resonance)
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
  let source = event.getSource()
  let attacker = source && source.actual ? source.actual : null
  if (!(attacker instanceof PlayerClass)) {
    return
  }
  if (getCounter(attacker, 'kubejs:gloomshell_spleen_effect') <= 0) {
    return
  }
  let dead = event.getEntity()
  if (SCULK_MOBS.indexOf(entityTypeId(dead)) < 0) {
    return
  }
  entityOf(attacker).addItem(new ItemStack(Items.ECHO_SHARD, 1))
  setCounter(attacker, RESOURCE.current, getCounter(attacker, RESOURCE.current) + 4)
})

})()
