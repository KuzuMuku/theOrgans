;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let ProjectileClass = Java.loadClass('net.minecraft.world.entity.projectile.Projectile')
let ServerLevelClass = Java.loadClass('net.minecraft.server.level.ServerLevel')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let MagicData = Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')
let ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
let Items = Java.loadClass('net.minecraft.world.item.Items')
let GameEventTags = Java.loadClass('net.minecraft.tags.GameEventTags')

let RESOURCE = {
  system: 'vanillaSculk_system',
  current: 'kubejs:vanillaSculk_resonance'
}
let SYSTEM_SOURCE = RESOURCE.system

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
let MARK_POINT_KEY = pointKey('counter', 'kubejs:vanillaSculk_mark')

function getCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function getRuntimePoint(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId))
}

function setCounter(player, pointId, value) {
  OrganKubeJS.setSourcePoint(entityOf(player), SYSTEM_SOURCE, pointKey('counter', pointId), Math.max(0, Math.floor(value)))
}

function consumeCounter(player, pointId, amount) {
  return Number(OrganKubeJS.consumeSourcePoint(entityOf(player), SYSTEM_SOURCE, pointKey('counter', pointId), Math.floor(amount)))
}

function addResource(player, amount) {
  if (!amount || amount <= 0) {
    return
  }
  setCounter(player, RESOURCE.current, getCounter(player, RESOURCE.current) + amount)
}

function spendResource(player, amount) {
  if (!amount || amount <= 0) {
    return 0
  }
  return consumeCounter(player, RESOURCE.current, amount)
}

function addEffect(entity, effect, duration, amplifier) {
  entity.addEffect(new MobEffectInstance(effect, duration, amplifier, false, false, true))
}

function addMana(player, amount) {
  MagicData.getPlayerMagicData(entityOf(player)).addMana(amount)
}

function isMarked(target) {
  if (!target) {
    return false
  }
  let points = OrganKubeJS.getPoints(target)
  let iterator = points.entrySet().iterator()
  while (iterator.hasNext()) {
    let entry = iterator.next()
    if (String(entry.getKey()) === MARK_POINT_KEY && Number(entry.getValue()) > 0) {
      return true
    }
  }
  return false
}

function applyMark(player, target, slow) {
  if (!target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return
  }
  OrganKubeJS.addTypedSourcePoint(target, 'target_mark', 'counter', 'kubejs:vanillaSculk_mark', 1)
  addEffect(target, MobEffects.DARKNESS, 80, 0)
  if (slow) {
    addEffect(target, MobEffects.MOVEMENT_SLOWDOWN, 60, 0)
  }
  if (getCounter(player, 'kubejs:echo_marrow_effect') > 0) {
    addMana(player, 4)
  }
}

function isQuiet(player) {
  return getRuntimePoint(player, 'kubejs:vanillaSculk_quiet_window') > 0
}

function isHome(player) {
  return getRuntimePoint(player, 'kubejs:vanillaSculk_home_online') > 0
}

function tryMarkVibrationSource(player, source, chance, slow) {
  if (chance <= 0 || !source || !(source instanceof LivingEntityClass) || !source.isAlive()) {
    return
  }
  if (Math.random() < chance) {
    applyMark(player, source, slow)
  }
}

function entityTypeId(entity) {
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

ForgeEvents.onEvent('net.minecraftforge.event.VanillaGameEvent', event => {
  let level = event.getLevel()
  let cause = event.getCause()

  if (!event.getVanillaEvent().is(GameEventTags.VIBRATIONS)) {
    return
  }

  if (cause instanceof PlayerClass) {
    if (isQuiet(cause) || Math.random() < (0.34 * getCounter(cause, 'kubejs:slient_shulk'))) {
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
    let dx = Number(cause.getX()) - Number(player.getX())
    let dy = Number(cause.getY()) - Number(player.getY())
    let dz = Number(cause.getZ()) - Number(player.getZ())
    let distanceSq = dx * dx + dy * dy + dz * dz

    if (getCounter(player, 'kubejs:silence_crown_effect') > 0 && isHome(player) && distanceSq <= 64.0) {
      let chance = 0.1 + 0.08 * getCounter(player, 'kubejs:echo_cochlea_effect')
      tryMarkVibrationSource(player, cause, chance, false)
    }
    if (getCounter(player, 'kubejs:sensor_throat_sac_effect') > 0 && distanceSq <= 20.25) {
      tryMarkVibrationSource(player, cause, 0.22, true)
    }
  }
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent', event => {
  let target = event.getEntity()
  if (!(target instanceof LivingEntityClass)) {
    return
  }

  let source = event.getSource()
  let direct = source && source.getDirectEntity ? source.getDirectEntity() : null
  let attacker = source && source.getEntity ? source.getEntity() : null

  if (target instanceof PlayerClass) {
    if (getCounter(target, 'kubejs:resonance_spine_effect') > 0) {
      addResource(target, 5)
    }
    if (getCounter(target, 'kubejs:tremor_tail_effect') > 0) {
      addEffect(target, MobEffects.MOVEMENT_SPEED, 80, 1)
    }
  }

  if (!(attacker instanceof PlayerClass)) {
    return
  }

  let melee = direct === attacker
  if (getCounter(attacker, 'kubejs:latentwave_arm_effect') > 0 && melee && Math.random() < 0.3) {
    applyMark(attacker, target, false)
    addEffect(target, MobEffects.MOVEMENT_SLOWDOWN, 60, 0)
  }

  if (getCounter(attacker, 'kubejs:silent_arrow_gland_effect') > 0 && !melee && direct instanceof ProjectileClass) {
    let resonance = getCounter(attacker, RESOURCE.current)
    if (resonance >= 2) {
      spendResource(attacker, 2)
      if (isMarked(target)) {
        event.setAmount(Number(event.getAmount()) * 1.5)
      }
    }
  }
})

ForgeEvents.onEvent('io.redspace.ironsspellbooks.api.events.SpellDamageEvent', event => {
  let source = event.getSpellDamageSource()
  if (!source) {
    return
  }
  let caster = (source).getEntity()
  if (!(caster instanceof PlayerClass)) {
    return
  }
  if (getCounter(caster, 'kubejs:sensor_subbrain_effect') <= 0) {
    return
  }
  let spell = source.spell()
  if (!spell || !spell.getSchoolType() || String(spell.getSchoolType().getId()) !== 'irons_spellbooks:ender') {
    return
  }
  let target = event.getEntity()
  if (!isMarked(target)) {
    return
  }
  let resonance = getCounter(caster, RESOURCE.current)
  if (resonance < 5) {
    return
  }
  spendResource(caster, 5)
  event.setAmount(Number(event.getAmount()) * (1 + resonance * 0.1))
})

ForgeEvents.onEvent('io.redspace.ironsspellbooks.api.events.SpellOnCastEvent', event => {
  let player = event.getEntity()
  if (!(player instanceof PlayerClass)) {
    return
  }
  if (getCounter(player, 'kubejs:wavefront_forehead_effect') <= 0) {
    return
  }
  let manaCost = Number(event.getManaCost())
  if (manaCost > 0) {
    addResource(player, Math.max(1, Math.floor(manaCost * 0.01)))
  }
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
  let dead = event.getEntity()
  let source = event.getSource()
  let attacker = source && source.getEntity ? source.getEntity() : null
  if (!(attacker instanceof PlayerClass)) {
    return
  }
  if (getCounter(attacker, 'kubejs:gloomshell_spleen_effect') <= 0) {
    return
  }
  if (SCULK_MOBS.indexOf(entityTypeId(dead)) < 0) {
    return
  }
  attacker.addItem(new ItemStack(Items.ECHO_SHARD, 1))
  addResource(attacker, 3)
})

})()
