;(function () {
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let MagicData = Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData')

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
  current: 'kubejs:vanillaSculk_resonance',
  capacity_en: 'Echo Reserve Capacity',
  capacity_desc_en: 'Maximum shared reserve for echo reserve.',
  current_en: 'Echo Reserve',
  current_desc_en: 'Shared echo reserve gathered by silence, vibration and deep-dark pressure.',
  capacity_zh: '回响储能上限',
  capacity_desc_zh: '回响储能可积累的最大上限。',
  current_zh: '回响储能',
  current_desc_zh: '由静默、震动与深暗压力共同积累的回响储能。',
  generated: true
}
let SYSTEM_SOURCE = RESOURCE.system
let LINK_SOURCE = DIR_KEY + '_links'

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE.current)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
let MARK_POINT_KEY = pointKey('mark', 'kubejs:vanillaSculk_mark')
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let getLinkCounter = Runtime.getLinkCounter
let setCounter = Runtime.setCounter
let setRuntimePoint = Runtime.setRuntimePoint
let setLinkCounter = Runtime.setLinkCounter
let setLinkAttribute = Runtime.setLinkAttribute
let consumeCounter = Runtime.consumeCounter
let resourceReady = Runtime.resourceReady
let spendResource = Runtime.spendResource
let addResource = Runtime.addResource
let addEffect = Common.addEffect
let installedSourceIds = Common.installedSourceIds
let countMatching = Common.countMatching
let hasMatching = Common.hasMatching
let targetsSortedByDistance = Common.targetsSortedByDistance
let sqDistanceBetween = Common.sqDistanceBetween

let SOURCE_IDS = new Set([
  'kubejs:echo_core',
  'kubejs:listening_lung',
  'kubejs:gloomvein_liver',
  'kubejs:warden_boneplate',
  'kubejs:silence_crown',
  'kubejs:echo_cochlea',
  'kubejs:darkvision_iris',
  'kubejs:stealthshock_sole',
  'kubejs:sensor_subbrain',
  'kubejs:resonance_spine',
  'kubejs:gloomshell_spleen',
  'kubejs:echo_marrow',
  'kubejs:resonant_kidneysheath',
  'kubejs:otherdeep_float_membrane',
  'kubejs:deepchamber_sac',
  'kubejs:latentwave_arm',
  'kubejs:sensor_throat_sac',
  'kubejs:silent_arrow_gland',
  'kubejs:tremor_tail',
  'kubejs:ancient_city_step_leg',
  'kubejs:wavefront_forehead',
  'kubejs:conduction_fork_joint',
  'kubejs:deepheart_remnant',
  'kubejs:ancient_jar_hand',
  'kubejs:abyss_hunter_membrane'
])
let CORELINE_IDS = new Set([
  'kubejs:echo_core',
  'kubejs:resonance_spine'
])
let SUPPORT_IDS = new Set([
  'kubejs:echo_cochlea',
  'kubejs:sensor_subbrain',
  'kubejs:otherdeep_float_membrane',
  'kubejs:tremor_tail',
  'kubejs:abyss_hunter_membrane'
])
let MANA_IDS = new Set([
  'kubejs:gloomvein_liver',
  'kubejs:deepchamber_sac'
])
let SPELL_IDS = new Set([
  'kubejs:listening_lung'
])
let CROWN_IDS = new Set([
  'kubejs:silence_crown',
  'kubejs:wavefront_forehead'
])
let ARMOR_IDS = new Set([
  'kubejs:warden_boneplate',
  'kubejs:resonant_kidneysheath'
])
let MOVEMENT_IDS = new Set([
  'kubejs:stealthshock_sole',
  'kubejs:ancient_city_step_leg'
])
let MELEE_IDS = new Set([
  'kubejs:latentwave_arm',
  'kubejs:conduction_fork_joint'
])
let RANGED_IDS = new Set([
  'kubejs:darkvision_iris',
  'kubejs:silent_arrow_gland',
  'kubejs:sensor_throat_sac'
])
let RESOURCE_IDS = new Set([
  'kubejs:gloomshell_spleen',
  'kubejs:ancient_jar_hand'
])
let LISTENING_IDS = new Set([
  'kubejs:listening_lung'
])

function homeState(player) {
  return Common.homeState(player, HOME)
}

function homeMatch(player) {
  return Common.homeMatch(player, HOME)
}

function addMana(player, amount) {
  try {
    MagicData.getPlayerMagicData(entityOf(player)).addMana(amount)
  } catch (ignored) {
  }
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

function shortenDarkness(player, installed) {
  let entity = entityOf(player)
  let current = entity.getEffect(MobEffects.DARKNESS)
  if (!current) {
    return
  }
  let reduction = 0

  reduction += 0.1 * getCounter(player, 'kubejs:darkness_reduce')

  if (reduction <= 0) {
    return
  }
  if(reduction >= 1){
    clearDarkness(player)
  }
  let duration =  Number(current.getDuration()) * (1 - reduction)
  let amplifier = Number(current.getAmplifier())

  entity.removeEffect(MobEffects.DARKNESS)
  addEffect(entity, MobEffects.DARKNESS, duration, amplifier)
}

function clearDarkness(player) {
  entityOf(player).removeEffect(MobEffects.DARKNESS)
}

function vanillaSculkPredicateResult(event, value) {
  return event.success(!!value)
}

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaSculkPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaSculk_set_major', event => {
  return vanillaSculkPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaSculk_resource_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaSculk_has_coreline', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_support', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_mana', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_spell', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_crown', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_armor', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_movement', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_resource', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_hunt', event => {
  if (!event.player) {
    return vanillaSculkPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaSculkPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_chase', event => {
  if (!event.player) {
    return vanillaSculkPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaSculkPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaSculk_silence_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaSculk_quiet_window') > 0)
})

OrganKubejsEvents.predicate('vanillaSculk_mark_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasNearbyMarkedTarget(event.player, 8.0))
})

OrganKubejsEvents.predicate('vanillaSculk_echo_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 1)
})

OrganKubejsEvents.predicate('vanillaSculk_otherdeep_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && homeMatch(event.player))
})

PlayerEvents.tick(event => {
  let player = event.player
  let installed = installedSourceIds(player)
  if (countMatching(installed, SOURCE_IDS) <= 0) {
    return
  }

  let entity = entityOf(player)
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaSculk_quiet_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaSculk_prev_sneak', 0)
    setRuntimePoint(player, 'kubejs:vanillaSculk_home_online', 0)
    setLinkAttribute(player, 'minecraft:generic.luck', 0)
    setLinkAttribute(player, 'minecraft:generic.max_health', 0)
    setLinkAttribute(player, 'irons_spellbooks:casting_movespeed', 0)
    return
  }

  let resonance = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, resonance)
  let home = homeMatch(player)
  let sneaking = !!entity.isShiftKeyDown()
  let quietTicks = getRuntimePoint(player, 'kubejs:vanillaSculk_quiet_window')
  if (quietTicks > 0) {
    quietTicks--
  }

  let prevSneak = getRuntimePoint(player, 'kubejs:vanillaSculk_prev_sneak') > 0
  if (prevSneak && !sneaking && getCounter(player, 'kubejs:ancient_city_step_leg_effect') > 0 && resonance > 0) {
    let seconds = Math.min(3, Math.max(1, Math.floor(resonance / 25)))
    quietTicks = Math.max(quietTicks, seconds * 60)
  }
  setRuntimePoint(player, 'kubejs:vanillaSculk_prev_sneak', sneaking ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaSculk_quiet_window', quietTicks)
  setRuntimePoint(player, 'kubejs:vanillaSculk_silence_online', quietTicks > 0 ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaSculk_home_online', home ? 1 : 0)

  setLinkAttribute(player, 'minecraft:generic.luck', getCounter(player, 'kubejs:ancient_jar_hand_effect') * resonance)
  setLinkAttribute(player, 'minecraft:generic.max_health', getCounter(player, 'kubejs:abyss_hunter_membrane_effect') * resonance)
  setLinkAttribute(player, 'irons_spellbooks:casting_movespeed', home && getCounter(player, 'kubejs:otherdeep_float_membrane_effect') > 0 ? 2 : 0)

  let tick = entity.age
  if (tick % 20 === 0) {
    if (getCounter(player, 'kubejs:darkvision_iris_effect') > 0) {
      addEffect(entity, MobEffects.NIGHT_VISION, 240, 0)
    }
    shortenDarkness(player, installed)

    let mana_recover_home = getCounter(player, 'kubejs:otherdeep_float_membrane_effect')
    if (mana_recover_home > 0 && home) {
      addMana(player, mana_recover_home)
    }
    let mana_recover = getCounter(player, 'kubejs:conduction_fork_joint_effect')
    if (mana_recover > 0 && resonance > 10) {
      addMana(player, mana_recover)
    }
    let hp_recover = getCounter(player, 'kubejs:deepheart_remnant_effect')
    if (hp_recover > 0 && resonance > 10) {
      entity.heal(hp_recover * 0.5)
    }
    if (getCounter(player, 'kubejs:deepchamber_sac_effect') > 0 && home) {
      addResource(player, 1)
      try {
        entity.getFoodData().eat(1, 0.5)
      } catch (ignored) {
      }
    }
  }

  let listeningTicks = getCounter(player, 'kubejs:vanillaSculk_listen_ticks')
  if (hasMatching(installed, LISTENING_IDS) && sneaking) {
    listeningTicks++
    if (listeningTicks >= 60) {
      clearDarkness(player)
      listeningTicks = 0
    }
  } else {
    listeningTicks = 0
  }
  setCounter(player, 'kubejs:vanillaSculk_listen_ticks', listeningTicks)

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
