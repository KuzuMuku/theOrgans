;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')

let DIR_KEY = 'vanillaSculk'
let HOME_STRUCTURE_CACHE = new Map()
let HOME = {
  dimensions: [
    'deeperdarker:otherside'
  ],
  dimension_home: true,
  biome_keywords: [
    'deep_dark',
    'deepdark',
    'sculk'
  ],
  structures: [
    'minecraft:ancient_city'
  ],
  structure_radius: 8,
  structure_cache: HOME_STRUCTURE_CACHE
}
let HOME_CALLBACK = 'vanillaSculk_home'
let RESOURCE = {
  system: 'vanillaSculk_system',
  capacity: 'kubejs:vanillaSculk_resonance_capacity',
  current: 'kubejs:vanillaSculk_resonance'
}
let SYSTEM_SOURCE = RESOURCE.system
let LINK_SOURCE = DIR_KEY + '_links'

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE.current)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
let MARK_POINT_KEY = pointKey('mark', 'kubejs:vanillaSculk_mark')
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let setCounter = Runtime.setCounter
let spendResource = Runtime.spendResource
let addResource = Runtime.addResource
let addEffect = Common.addEffect
let targetsSortedByDistance = Common.targetsSortedByDistance

function homeMatch(player) {
  return Common.homeMatch(player, HOME)
}

function fireSculkEvent(player, type, target) {
  let entity = entityOf(player)
  let builder = RuntimeEvent.builder(type, entity)
  if (target) {
    builder = builder.target(target)
  }
  RuntimeEffectService.fireEvent(entity, builder.build())
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

function hasNearbyMarkedTarget(player, radius) {
  let targets = targetsSortedByDistance(player, radius)
  for (let i = 0; i < targets.length; i++) {
    if (isMarked(targets[i])) {
      return true
    }
  }
  return false
}

function applyMark(player, target, slow) {
  if (!target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return
  }
  OrganKubeJS.addMarkPoint(target, 'kubejs:vanillaSculk_mark', 1)
  addEffect(target, MobEffects.DARKNESS, 80, 0)
  if (slow) {
    addEffect(target, MobEffects.MOVEMENT_SLOWDOWN, 60, 0)
  }
  fireSculkEvent(player, 'vanillaSculk:mark_applied', null)
}

function vanillaSculkPredicateResult(event, value) {
  return event.success(!!value)
}

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaSculkPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaSculk_high_resonance', event => {
  return vanillaSculkPredicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) > 10)
})


OrganKubejsEvents.pointAction('vanillaSculk_shorten_darkness', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  let reduction = Number(event.configDouble('reduction') || 0.1)
  let entity = entityOf(player)
  let current = entity.getEffect(MobEffects.DARKNESS)
  if (current) {
    if (reduction >= 1) {
      entity.removeEffect(MobEffects.DARKNESS)
    } else {
      let duration = Math.floor(Number(current.getDuration()) * Math.max(0, 1 - reduction))
      let amplifier = Number(current.getAmplifier())
      entity.removeEffect(MobEffects.DARKNESS)
      if (duration > 0) {
        addEffect(entity, MobEffects.DARKNESS, duration, amplifier)
      }
    }
  }
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaSculk_ancient_step_quiet', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  let resonance = getCounter(player, RESOURCE.current)
  if (resonance > 0) {
    let ticks = Math.min(180, Math.max(60, Math.floor(resonance * 2)))
    OrganKubeJS.setRuntimePoint(entityOf(player), pointKey('runtime', 'kubejs:vanillaSculk_quiet_window'), 1, ticks)
  }
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaSculk_crown_mark_vibration', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target || event.getEventType() !== 'vanillaSculk:vibration') {
    return 0
  }
  let chance = 0.1 + 0.08 * getCounter(player, 'kubejs:echo_cochlea_effect')
  if (Math.random() < chance) {
    applyMark(player, target, false)
  }
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaSculk_throat_mark_vibration', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target || event.getEventType() !== 'vanillaSculk:vibration') {
    return 0
  }
  if (event.getEventAmount() > 8.0) {
    return 0
  }
  applyMark(player, target, true)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaSculk_melee_mark', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target) {
    return 0
  }
  if (Math.random() < 0.25) {
    applyMark(player, target, true)
  }
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaSculk_spell_cast_echo', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  let manaCost = event.getEventAmount()
  if (manaCost < 50) {
    return 0
  }
  addResource(player, Math.max(1, Math.floor(manaCost * 0.01)))
  return event.pointsConsume ? 1 : 0
})

PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    if (getCounter(player, RESOURCE.current) !== 0) {
      setCounter(player, RESOURCE.current, 0)
    }
    return
  }
  let current = getCounter(player, RESOURCE.current)
  let clamped = Math.min(capacity, current)
  if (clamped !== current) {
    setCounter(player, RESOURCE.current, clamped)
  }
})

OrganKubejsEvents.skillCast('warden_core_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let currentResonance = getCounter(player, RESOURCE.current)
  if (currentResonance <= 1) {
    return false
  }
  let spendAmount = Math.floor(currentResonance / 2)
  if (spendAmount <= 0) {
    return false
  }
  spendResource(player, spendAmount)
  let spellLevel = Math.max(1, Math.floor(spendAmount / 5))
  Common.castSpell('irons_spellbooks:sonic_boom', spellLevel, player)
  return true
})

})()
