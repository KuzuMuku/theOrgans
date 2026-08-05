;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let Registries = Java.loadClass('net.minecraft.core.registries.Registries')
let HolderSet = Java.loadClass('net.minecraft.core.HolderSet')
let ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
let ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')

let DIR_KEY = 'vanillaPillager'
let HOME = {
  "dimensions": [
    "minecraft:overworld"
  ],
  "biome_keywords": [],
  "structures": [
    "minecraft:pillager_outpost"
  ],
  "structure_radius": 8
}
let HOME_CALLBACK = 'vanillaPillager_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaPillager_system",
  "capacity": "kubejs:vanillaPillager_resonance_capacity",
  "current": "kubejs:vanillaPillager_resonance",
  "capacity_en": "Raid Momentum Capacity",
  "capacity_desc_en": "Maximum shared reserve for raid momentum.",
  "current_en": "Raid Momentum",
  "current_desc_en": "Shared raid momentum gathered by skirmishing, looting and battlefield pressure.",
  "capacity_zh": "劫掠势能上限",
  "capacity_desc_zh": "劫掠势能可积累的最大上限。",
  "current_zh": "劫掠势能",
  "current_desc_zh": "由袭击、搜刮与战场压迫共同积累的劫掠势能。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaPillager_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:evocation_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:raider_ventricle",
  "kubejs:banner_spinewheel",
  "kubejs:outpost_chestplate",
  "kubejs:emerald_liver",
  "kubejs:horn_crown",
  "kubejs:scout_iris",
  "kubejs:loot_spleen",
  "kubejs:breach_gland",
  "kubejs:exile_kidneysheath",
  "kubejs:war_drum_cochlea",
  "kubejs:dark_arrow_throat",
  "kubejs:raid_scavenger_hand",
  "kubejs:skirmish_arm",
  "kubejs:banner_spike_shoulder",
  "kubejs:nightraid_tendon"
])
let CORELINE_IDS = new Set([
  "kubejs:raider_ventricle",
  "kubejs:banner_spinewheel"
])
let SUPPORT_IDS = new Set([
  "kubejs:war_drum_cochlea"
])
let MANA_IDS = new Set([
  "kubejs:emerald_liver"
])
let SPELL_IDS = new Set([
  "kubejs:breach_gland"
])
let CROWN_IDS = new Set([
  "kubejs:horn_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:outpost_chestplate"
])
let MOVEMENT_IDS = new Set([
  "kubejs:nightraid_tendon"
])
let MELEE_IDS = new Set([
  "kubejs:skirmish_arm",
  "kubejs:banner_spike_shoulder"
])
let RANGED_IDS = new Set([
  "kubejs:scout_iris",
  "kubejs:dark_arrow_throat"
])
let RESOURCE_IDS = new Set([
  "kubejs:loot_spleen",
  "kubejs:raid_scavenger_hand"
])

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE ? RESOURCE.current : null)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
let setSourcePointValue = Common.setSourcePointValue
let getCounter = Runtime.getCounter
let getLinkCounter = Runtime.getLinkCounter
let setCounter = Runtime.setCounter
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

function applyLinearLinks(player) {
  if (!player) {
    return
  }
  let installed = installedSourceIds(player)
  let corelineCount = countMatching(installed, CORELINE_IDS)
  let supportCount = countMatching(installed, SUPPORT_IDS)
  let manaCount = countMatching(installed, MANA_IDS)
  let spellCount = countMatching(installed, SPELL_IDS)
  let crownCount = countMatching(installed, CROWN_IDS)
  let armorCount = countMatching(installed, ARMOR_IDS)
  let movementCount = countMatching(installed, MOVEMENT_IDS)
  let resourceCount = countMatching(installed, RESOURCE_IDS)
  let huntCount = countMatching(installed, MELEE_IDS) + countMatching(installed, RANGED_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  setLinkCounter(player, 'kubejs:vanillaPillager_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaPillager_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaPillager_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaPillager_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaPillager_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaPillager_resource_link', resourcePoint)
  setLinkAttribute(player, 'minecraft:armor_toughness', framePoint)
  setLinkAttribute(player, 'minecraft:attack_damage', huntPoint)
  setLinkAttribute(player, 'irons_spellbooks:cooldown_reduction', cadencePoint)
  setLinkAttribute(player, 'irons_spellbooks:max_mana', weavePoint * 10)
  if (SCHOOL_POWER_ATTRIBUTE) {
    setLinkAttribute(player, SCHOOL_POWER_ATTRIBUTE, weavePoint)
  }
}

function biomeId(entity) {
  try {
    let holder = entity.level.getBiome(entity.blockPosition())
    let key = holder.unwrapKey()
    if (key.isPresent()) {
      return String(key.get().location())
    }
  } catch (ignored) {
  }
  return String(entity.level.getBiome(entity.blockPosition()))
}

function cleanDimensionId(value) {
  if (value == null) {
    return ''
  }
  let text = String(value)
  let matches = text.match(/[a-z0-9_.-]+:[a-z0-9_./-]+/g)
  return matches && matches.length > 0 ? matches[matches.length - 1] : text
}

function dimensionId(entity) {
  try {
    let id = cleanDimensionId(entity.level.dimension().location())
    if (id) {
      return id
    }
  } catch (ignored) {
  }
  try {
    let id = cleanDimensionId(entity.level.dimension)
    if (id) {
      return id
    }
  } catch (ignored) {
  }
  try {
    let id = cleanDimensionId(entity.level.dimensionKey)
    if (id) {
      return id
    }
  } catch (ignored) {
  }
  try {
    let id = cleanDimensionId(entity.level.getDimension())
    if (id) {
      return id
    }
  } catch (ignored) {
  }
  return ''
}

function structureCacheKey(entity, structureIds, radiusChunks) {
  let pos = entity.blockPosition()
  return dimensionId(entity) + '@' + (pos.getX() >> 4) + ',' + (pos.getZ() >> 4) + '/' + structureIds.join('|') + '/' + radiusChunks
}

function hasNearbyStructure(entity, structureIds, radiusChunks) {
  if (!structureIds || structureIds.length === 0) {
    return false
  }
  let tick = Number(entity.tickCount)
  let cacheKey = structureCacheKey(entity, structureIds, radiusChunks)
  let cached = HOME_STRUCTURE_CACHE.get(cacheKey)
  if (cached && cached.expireAt > tick) {
    return cached.value
  }
  let matched = false
  try {
    let registry = entity.level.registryAccess().registryOrThrow(Registries.STRUCTURE)
    for (let i = 0; i < structureIds.length; i++) {
      let location = ResourceLocation.tryParse(structureIds[i])
      if (!location) {
        continue
      }
      let key = ResourceKey.create(Registries.STRUCTURE, location)
      let holder = registry.getHolder(key)
      if (!holder.isPresent()) {
        continue
      }
      let pair = entity.level.getChunkSource().getGenerator().findNearestMapStructure(entity.level, HolderSet.direct(holder.get()), entity.blockPosition(), radiusChunks, false)
      if (pair != null) {
        matched = true
        break
      }
    }
  } catch (ignored) {
  }
  HOME_STRUCTURE_CACHE.set(cacheKey, { expireAt: tick + 100, value: matched })
  return matched
}

function entityTypeId(entity) {
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

function countNearbyEntityTypes(entity, ids, radius) {
  if (!ids || ids.length === 0) {
    return 0
  }
  let total = 0
  let list = entity.level.getEntities(entity, entity.getBoundingBox().inflate(radius))
  let iterator = list.iterator()
  while (iterator.hasNext()) {
    let target = iterator.next()
    if (!target || target === entity) {
      continue
    }
    if (ids.indexOf(entityTypeId(target)) >= 0) {
      total++
    }
  }
  return total
}

function inventoryCount(player, ids) {
  if (!ids || ids.length === 0) {
    return 0
  }
  let total = 0
  let inventory = entityOf(player).getInventory()
  for (let slot = 0; slot < inventory.getContainerSize(); slot++) {
    let stack = inventory.getItem(slot)
    if (!stack || stack.isEmpty()) {
      continue
    }
    let itemId = String(BuiltInRegistries.ITEM.getKey(stack.getItem()))
    if (ids.indexOf(itemId) >= 0) {
      total += Number(stack.getCount())
    }
  }
  return total
}

function homeState(player) {
  let entity = entityOf(player)
  let dim = dimensionId(entity)
  let dimensionMatch = !!HOME.dimension_home && HOME.dimensions && HOME.dimensions.indexOf(dim) >= 0
  let biomeMatch = false
  let structureMatch = false
  let biome = biomeId(entity)
  if (HOME.biome_keywords) {
    for (let i = 0; i < HOME.biome_keywords.length; i++) {
      if (biome.indexOf(HOME.biome_keywords[i]) >= 0) {
        biomeMatch = true
        break
      }
    }
  }
  structureMatch = hasNearbyStructure(entity, HOME.structures || [], HOME.structure_radius || 8)
  return {
    dimension: dimensionMatch,
    biome: biomeMatch,
    structure: structureMatch,
    final: dimensionMatch || biomeMatch || structureMatch
  }
}

function homeMatch(player) {
  let state = homeState(player)
  return state.final || countNearbyEntityTypes(entityOf(player), PILLAGER_FACTION_IDS, 20) > 0
}

function sqDistanceBetween(a, b) {
  let dx = Number(a.getX()) - Number(b.getX())
  let dy = Number(a.getY()) - Number(b.getY())
  let dz = Number(a.getZ()) - Number(b.getZ())
  return dx * dx + dy * dy + dz * dz
}

function targetsSortedByDistance(player, radius) {
  let entity = entityOf(player)
  let targets = []
  let list = entity.level.getEntities(entity, entity.getBoundingBox().inflate(radius))
  let iterator = list.iterator()
  while (iterator.hasNext()) {
    let target = iterator.next()
    if (!target || !(target instanceof LivingEntityClass) || target === entity || !target.isAlive()) {
      continue
    }
    targets.push(target)
  }
  return targets.sort((a, b) => sqDistanceBetween(entity, a) - sqDistanceBetween(entity, b))
}

function targetInFront(player, radius) {
  let entity = entityOf(player)
  let look = entity.getLookAngle()
  let targets = targetsSortedByDistance(player, radius)
  let best = null
  let score = -1000
  for (let i = 0; i < targets.length; i++) {
    let target = targets[i]
    let dx = Number(target.getX()) - Number(entity.getX())
    let dz = Number(target.getZ()) - Number(entity.getZ())
    let length = Math.max(0.01, Math.sqrt(dx * dx + dz * dz))
    let dot = dx / length * Number(look.x()) + dz / length * Number(look.z())
    if (dot > score) {
      score = dot
      best = target
    }
  }
  return score > -0.15 ? best : null
}

function damageTarget(player, target, amount, knockbackStrength) {
  let entity = entityOf(player)
  if (!target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return false
  }
  let before = Number(target.getHealth())
  target.setHealth(Math.max(0, before - amount))
  if (target.isAlive() && knockbackStrength > 0) {
    target.knockback(knockbackStrength, entity.getX() - target.getX(), entity.getZ() - target.getZ())
  }
  return Number(target.getHealth()) < before
}

function vanillaPillagerPredicateResult(event, value) {
  return event.success(!!value)
}

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaPillagerPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaPillager_set_major', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaPillager_resource_online', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaPillager_has_coreline', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaPillager_has_support', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaPillager_has_mana', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaPillager_has_spell', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaPillager_has_crown', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaPillager_has_armor', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaPillager_has_movement', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaPillager_has_resource', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaPillager_has_hunt', event => {
  if (!event.player) {
    return vanillaPillagerPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaPillagerPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaPillager_has_chase', event => {
  if (!event.player) {
    return vanillaPillagerPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaPillagerPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})


OrganKubejsEvents.predicate('vanillaPillager_has_raid', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && getCounter(event.player, 'kubejs:pillager_raid_line') > 0)
})

OrganKubejsEvents.predicate('vanillaPillager_has_plunder', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && getCounter(event.player, 'kubejs:pillager_plunder_line') > 0)
})

OrganKubejsEvents.predicate('vanillaPillager_has_curse', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && getCounter(event.player, 'kubejs:pillager_curse_line') > 0)
})

OrganKubejsEvents.predicate('vanillaPillager_has_outpost', event => {
  return vanillaPillagerPredicateResult(event, !!event.player && homeMatch(event.player))
})


let PILLAGER_FACTION_IDS = [
  'minecraft:pillager',
  'minecraft:vindicator',
  'minecraft:evoker',
  'minecraft:illusioner',
  'minecraft:witch',
  'minecraft:ravager'
]
let PILLAGER_LOOT_IDS = [
  'minecraft:emerald',
  'minecraft:arrow',
  'minecraft:crossbow',
  'minecraft:white_banner',
  'minecraft:splash_potion'
]

PlayerEvents.tick(event => {
  let player = event.player
  let entity = entityOf(player)
  if (Number(entity.tickCount) % 20 !== 0) {
    return
  }
  let raiders = countNearbyEntityTypes(entity, PILLAGER_FACTION_IDS, 20)
  let casters = countNearbyEntityTypes(entity, ['minecraft:evoker', 'minecraft:witch'], 20)
  let lootNow = inventoryCount(player, PILLAGER_LOOT_IDS)
  let lastLoot = getCounter(player, 'kubejs:pillager_loot_cache')
  let outpost = homeMatch(player)
  let badOmen = entity.hasEffect(MobEffects.BAD_OMEN)
  let nightBonus = entity.level.isNight() ? 2 : 0
  let lootGain = Math.max(0, lootNow - lastLoot)
  let raidLine = Math.min(5, raiders + (badOmen ? 2 : 0) + (outpost ? 1 : 0))
  let plunderLine = outpost || raiders > 0 ? Math.min(5, lootGain) : 0
  let curseLine = Math.min(4, casters + (badOmen ? 1 : 0))
  setCounter(player, 'kubejs:pillager_presence', raiders)
  setCounter(player, 'kubejs:pillager_raid_line', raidLine)
  setCounter(player, 'kubejs:pillager_plunder_line', plunderLine)
  setCounter(player, 'kubejs:pillager_curse_line', curseLine)
  if (RESOURCE && raidLine > 0) {
    addResource(player, 1 + raidLine + nightBonus)
  }
  if (RESOURCE && plunderLine > 0) {
    addResource(player, plunderLine * 2)
  }
  if (RESOURCE && curseLine > 0) {
    addResource(player, 1)
  }
  setCounter(player, 'kubejs:pillager_loot_cache', lootNow)
})


PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  applyLinearLinks(player)
})


OrganKubejsEvents.skillCast('dark_arrow_throat_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let target = targetInFront(player, 10.0)
  if (!target) {
    return false
  }
  let scaledDamage = 10 + getLinkCounter(player, 'kubejs:vanillaPillager_spell_weave')
  let scaledDuration = 100 + getLinkCounter(player, 'kubejs:vanillaPillager_spell_weave') * 20
  spendResource(player, 12)
  damageTarget(player, target, scaledDamage, 0.2)
  addEffect(target, MobEffects.WEAKNESS, scaledDuration, 0)
  return true
})

})()
