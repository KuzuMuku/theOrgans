;(function () {
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')

let DIR_KEY = 'vanillaPillager'
let HOME = {
  dimensions: ['minecraft:overworld'],
  dimension_home: true,
  biome_keywords: [],
  structures: [
    'minecraft:pillager_outpost',
    'minecraft:woodland_mansion',
    'irons_spellbooks:evoker_fort'
  ],
  structure_radius: 8,
  structure_cache: new Map()
}
let HOME_CALLBACK = 'vanillaPillager_home'
let RESOURCE = {
  system: 'vanillaPillager_system',
  capacity: 'kubejs:vanillaPillager_resonance_capacity',
  current: 'kubejs:vanillaPillager_resonance'
}
let SYSTEM_SOURCE = RESOURCE.system
let LINK_SOURCE = DIR_KEY + '_links'
let PILLAGER_FACTION_IDS = [
  'minecraft:pillager',
  'minecraft:vindicator',
  'minecraft:evoker',
  'minecraft:illusioner',
  'minecraft:witch',
  'minecraft:ravager',
  'minecraft:vex',
  'irons_spellbooks:summoned_vex',
  'irons_spellbooks:archevoker'
]
let PILLAGER_LOOT_IDS = [
  'minecraft:emerald',
  'minecraft:arrow',
  'minecraft:crossbow',
  'minecraft:white_banner',
  'minecraft:splash_potion',
  'irons_spellbooks:arcane_essence',
  'irons_spellbooks:evocation_rune',
  'irons_spellbooks:scroll'
]
let AUXILIARY = {
  banner_sash: 'kubejs:raider_banner_sash',
  crossbow_winder: 'kubejs:crossbow_string_winder',
  wardrum_head: 'kubejs:wardrum_head',
  plunder_knot: 'kubejs:plunder_knot'
}

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE.current)
let entityOf = Common.entityOf
let rawEntity = Common.rawEntity
let pointKey = Common.pointKey
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let setCounter = Runtime.setCounter
let setRuntimePoint = Runtime.setRuntimePoint
let addResource = Runtime.addResource
let spendResource = Runtime.spendResource
let consumeCounter = Runtime.consumeCounter
let addEffect = Common.addEffect
let inventoryCount = Common.inventoryCount
let countNearbyEntityTypes = Common.countNearbyEntityTypes
let installedSourceIds = Common.installedSourceIds
let targetInFront = Common.targetInFront
let damageTarget = Common.damageTarget

let MARK_POINT_KEY = pointKey('mark', 'kubejs:vanillaPillager_mark')
let PLUNDER_WINDOW = pointKey('runtime', 'kubejs:vanillaPillager_plunder_window')
let EXILE_WINDOW = pointKey('runtime', 'kubejs:vanillaPillager_exile_window')
let SPIKE_WINDOW = pointKey('runtime', 'kubejs:banner_spike_shoulder_window')
let SURGE_KEY = 'kubejs:vanillaPillager_raid_surge'
let PLUNDER_CORE_ITEM = 'kubejs:plunder_core'

function homeMatch(player) {
  return Common.homeMatch(player, HOME)
}

function raidOnline(player) {
  let entity = entityOf(player)
  return homeMatch(player)
    || entity.hasEffect(MobEffects.BAD_OMEN)
    || countNearbyEntityTypes(entity, PILLAGER_FACTION_IDS, 20) > 0
}

function isMarked(target) {
  if (!target) {
    return false
  }
  return Number(OrganKubeJS.getPoint(rawEntity(target), MARK_POINT_KEY)) > 0
}

function auxOnline(player, auxId) {
  return inventoryCount(player, [auxId]) > 0
}

function applyMark(player, target, effect, durationTicks) {
  let entity = entityOf(target)
  if (!entity || !entity.isAlive()) {
    return
  }
  OrganKubeJS.addMarkPoint(entity, 'kubejs:vanillaPillager_mark', 1)
  if (effect && durationTicks > 0) {
    addEffect(entity, effect, durationTicks, 0)
  }
}

function predicateResult(event, value) {
  event.success(!!value)
}

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  predicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaPillager_raid_online', event => {
  predicateResult(event, !!event.player && raidOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaPillager_resource_online', event => {
  predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 8)
})

OrganKubejsEvents.predicate('vanillaPillager_resource_at_least_3', event => {
  predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 3)
})

OrganKubejsEvents.predicate('vanillaPillager_resource_at_least_2', event => {
  predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 2)
})

OrganKubejsEvents.predicate('vanillaPillager_high_heat', event => {
  predicateResult(event, !!event.player
    && getCounter(event.player, RESOURCE.current) > 10
    && !auxOnline(event.player, AUXILIARY.wardrum_head))
})

OrganKubejsEvents.predicate('vanillaPillager_high_heat_reduced', event => {
  predicateResult(event, !!event.player
    && getCounter(event.player, RESOURCE.current) > 6
    && auxOnline(event.player, AUXILIARY.wardrum_head))
})

OrganKubejsEvents.predicate('vanillaPillager_aux_banner_sash', event => {
  predicateResult(event, !!event.player && auxOnline(event.player, AUXILIARY.banner_sash))
})

OrganKubejsEvents.predicate('vanillaPillager_aux_crossbow_winder', event => {
  predicateResult(event, !!event.player && auxOnline(event.player, AUXILIARY.crossbow_winder))
})

OrganKubejsEvents.predicate('vanillaPillager_no_crossbow_winder', event => {
  predicateResult(event, !!event.player && !auxOnline(event.player, AUXILIARY.crossbow_winder))
})

OrganKubejsEvents.predicate('vanillaPillager_aux_wardrum_head', event => {
  predicateResult(event, !!event.player && auxOnline(event.player, AUXILIARY.wardrum_head))
})

OrganKubejsEvents.predicate('vanillaPillager_no_wardrum_head', event => {
  predicateResult(event, !!event.player && !auxOnline(event.player, AUXILIARY.wardrum_head))
})

OrganKubejsEvents.predicate('vanillaPillager_aux_plunder_knot', event => {
  predicateResult(event, !!event.player && auxOnline(event.player, AUXILIARY.plunder_knot))
})

OrganKubejsEvents.predicate('vanillaPillager_no_plunder_knot', event => {
  predicateResult(event, !!event.player && !auxOnline(event.player, AUXILIARY.plunder_knot))
})

OrganKubejsEvents.predicate('vanillaPillager_plunder_online', event => {
  predicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaPillager_plunder_window') > 0)
})

OrganKubejsEvents.predicate('vanillaPillager_exile_online', event => {
  predicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaPillager_exile_window') > 0)
})

OrganKubejsEvents.predicate('vanillaPillager_nightraid_online', event => {
  if (!event.player) {
    predicateResult(event, false)
    return
  }
  let entity = entityOf(event.player)
  predicateResult(event, !entity.level.isDay() || homeMatch(event.player) || raidOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaPillager_banner_spike_window', event => {
  predicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:banner_spike_shoulder_window') > 0)
})

OrganKubejsEvents.predicate('vanillaPillager_surge_active', event => {
  predicateResult(event, !!event.player && getRuntimePoint(event.player, SURGE_KEY) > 0)
})

PlayerEvents.tick(event => {
  let player = event.player
  let entity = entityOf(player)
  let lootNow = inventoryCount(player, PILLAGER_LOOT_IDS)
  let previousLoot = getCounter(player, 'kubejs:pillager_loot_cache')
  let lootGain = Math.max(0, lootNow - previousLoot)
  setCounter(player, 'kubejs:pillager_loot_cache', lootNow)
  if (lootGain > 0) {
    setRuntimePoint(player, 'kubejs:vanillaPillager_plunder_window', 1, 100)
  }

  let pressure = countNearbyEntityTypes(entity, PILLAGER_FACTION_IDS, 16)
  if (pressure > 0) {
    OrganKubeJS.clearRuntimePoint(entity, EXILE_WINDOW)
  } else if (entity.tickCount % 20 === 0) {
    setRuntimePoint(player, 'kubejs:vanillaPillager_exile_window', 1, 100)
  }

  if (entity.tickCount % 20 !== 0) {
    return
  }
  let lastBattle = getCounter(player, 'kubejs:pillager_last_battle')
  if (raidOnline(player) || getRuntimePoint(player, 'kubejs:vanillaPillager_plunder_window') > 0) {
    setCounter(player, 'kubejs:pillager_last_battle', entity.tickCount)
  } else if (lastBattle <= 0 || entity.tickCount - lastBattle >= 300) {
    if (lastBattle <= 0) {
      setCounter(player, 'kubejs:pillager_last_battle', entity.tickCount - 300)
    } else if (entity.tickCount % 60 === 0) {
      spendResource(player, 1)
    }
  }
  if (getRuntimePoint(player, SURGE_KEY) <= 0) {
    return
  }
  let heat = getCounter(player, RESOURCE.current)
  if (heat <= 0) {
    OrganKubeJS.clearRuntimePoint(entity, pointKey('runtime', SURGE_KEY))
  } else {
    spendResource(player, 2)
  }
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
  let source = event.getSource()
  let attacker = source && source.actual ? source.actual : null
  if (!(attacker instanceof PlayerClass) || getRuntimePoint(attacker, SURGE_KEY) <= 0) {
    return
  }
  let dead = event.getEntity()
  if (!isMarked(dead) || installedSourceIds(attacker).indexOf(PLUNDER_CORE_ITEM) < 0) {
    return
  }
  OrganKubeJS.consumeMarkPoint(dead, 'kubejs:vanillaPillager_mark', 1)
  addResource(attacker, 3)
  OrganKubeJS.addTypedRuntimePoint(entityOf(attacker), 'runtime', 'kubejs:plunder_core_extra_loot', 1, 2)
})

OrganKubejsEvents.skillCast('dark_arrow_throat_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let started = getRuntimePoint(player, 'kubejs:vanillaPillager_raid_surge') > 0
  let cost = auxOnline(player, AUXILIARY.crossbow_winder) ? 10 : 12
  if (getCounter(player, RESOURCE.current) < cost) {
    return false
  }
  let target = targetInFront(player, 10.0)
  if (!target) {
    return false
  }
  spendResource(player, cost)
  damageTarget(player, target, 10, 0.2)
  addEffect(target, MobEffects.WEAKNESS, started ? 140 : 100, 0)
  return true
})

OrganKubejsEvents.skillCast('plunder_core_cast', event => {
  let player = event.player
  if (!player || getCounter(player, RESOURCE.current) < 20) {
    return false
  }
  spendResource(player, 20)
  setRuntimePoint(player, SURGE_KEY, 1, 160)
  try {
    Common.castSpell('irons_spellbooks:fang_swirl', 1, player)
  } catch (ignored) {
  }
  return true
})

})()
