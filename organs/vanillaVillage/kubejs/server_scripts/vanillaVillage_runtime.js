;(function () {
let BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let Registries = Java.loadClass('net.minecraft.core.registries.Registries')
let HolderSet = Java.loadClass('net.minecraft.core.HolderSet')
let ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
let ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')

let DIR_KEY = 'vanillaVillage'
let HOME = {
  "dimensions": [
    "minecraft:overworld"
  ],
  "biome_keywords": [],
  "structures": [
    "minecraft:village_plains",
    "minecraft:village_desert",
    "minecraft:village_savanna",
    "minecraft:village_snowy",
    "minecraft:village_taiga"
  ],
  "structure_radius": 8
}
let HOME_CALLBACK = 'vanillaVillage_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaVillage_system",
  "capacity": "kubejs:vanillaVillage_resonance_capacity",
  "current": "kubejs:vanillaVillage_resonance",
  "capacity_en": "Order Reserve Capacity",
  "capacity_desc_en": "Maximum shared reserve for order reserve.",
  "current_en": "Order Reserve",
  "current_desc_en": "Shared village order gathered by bells, work and local presence.",
  "capacity_zh": "秩序储备上限",
  "capacity_desc_zh": "秩序储备可积累的最大上限。",
  "current_zh": "秩序储备",
  "current_desc_zh": "由钟声、职业运作与村落存在共同积累的秩序储备。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaVillage_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:holy_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:bell_ventricle",
  "kubejs:trade_spinewheel",
  "kubejs:order_sternum",
  "kubejs:profession_liver",
  "kubejs:prestige_crown",
  "kubejs:ledger_lung",
  "kubejs:field_spleen",
  "kubejs:repair_reflux_gland",
  "kubejs:beacon_kidneysheath",
  "kubejs:watchbell_cochlea",
  "kubejs:village_iris",
  "kubejs:offering_gland",
  "kubejs:iron_guard_shoulder",
  "kubejs:travel_legplate",
  "kubejs:trade_scavenger_hand"
])
let CORELINE_IDS = new Set([
  "kubejs:bell_ventricle",
  "kubejs:trade_spinewheel"
])
let SUPPORT_IDS = new Set([
  "kubejs:beacon_kidneysheath",
  "kubejs:watchbell_cochlea",
  "kubejs:offering_gland"
])
let MANA_IDS = new Set([
  "kubejs:profession_liver"
])
let SPELL_IDS = new Set([
  "kubejs:ledger_lung"
])
let CROWN_IDS = new Set([
  "kubejs:prestige_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:order_sternum"
])
let MOVEMENT_IDS = new Set([
  "kubejs:travel_legplate"
])
let MELEE_IDS = new Set([
  "kubejs:iron_guard_shoulder"
])
let RANGED_IDS = new Set([
  "kubejs:village_iris"
])
let RESOURCE_IDS = new Set([
  "kubejs:field_spleen",
  "kubejs:trade_scavenger_hand"
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
  setLinkCounter(player, 'kubejs:vanillaVillage_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaVillage_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaVillage_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaVillage_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaVillage_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaVillage_resource_link', resourcePoint)
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

function hasNearbyBlock(entity, ids, radius) {
  if (!ids || ids.length === 0) {
    return false
  }
  let pos = entity.blockPosition()
  for (let x = -radius; x <= radius; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -radius; z <= radius; z++) {
        let state = entity.level.getBlockState(new BlockPos(pos.getX() + x, pos.getY() + y, pos.getZ() + z))
        let blockId = String(BuiltInRegistries.BLOCK.getKey(state.getBlock()))
        if (ids.indexOf(blockId) >= 0) {
          return true
        }
      }
    }
  }
  return false
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
  let entity = entityOf(player)
  return state.final || countNearbyEntityTypes(entity, ['minecraft:villager', 'minecraft:wandering_trader'], 16) > 0
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

function vanillaVillagePredicateResult(event, value) {
  return event.success(!!value)
}

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaVillagePredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaVillage_set_major', event => {
  return vanillaVillagePredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaVillage_resource_online', event => {
  return vanillaVillagePredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaVillage_has_coreline', event => {
  return vanillaVillagePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaVillage_has_support', event => {
  return vanillaVillagePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaVillage_has_mana', event => {
  return vanillaVillagePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaVillage_has_spell', event => {
  return vanillaVillagePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaVillage_has_crown', event => {
  return vanillaVillagePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaVillage_has_armor', event => {
  return vanillaVillagePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaVillage_has_movement', event => {
  return vanillaVillagePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaVillage_has_resource', event => {
  return vanillaVillagePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaVillage_has_hunt', event => {
  if (!event.player) {
    return vanillaVillagePredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaVillagePredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaVillage_has_chase', event => {
  if (!event.player) {
    return vanillaVillagePredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaVillagePredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})


OrganKubejsEvents.predicate('vanillaVillage_has_trade', event => {
  return vanillaVillagePredicateResult(event, !!event.player && getCounter(event.player, 'kubejs:village_trade_flow') > 0)
})

OrganKubejsEvents.predicate('vanillaVillage_has_guard', event => {
  return vanillaVillagePredicateResult(event, !!event.player && getCounter(event.player, 'kubejs:village_guard_line') > 0)
})

OrganKubejsEvents.predicate('vanillaVillage_has_supply', event => {
  return vanillaVillagePredicateResult(event, !!event.player && getCounter(event.player, 'kubejs:village_supply_line') > 0)
})


let VILLAGE_WORKSITE_BLOCKS = [
  'minecraft:bell',
  'minecraft:farmland',
  'minecraft:smithing_table',
  'minecraft:lectern',
  'minecraft:cartography_table',
  'minecraft:stonecutter'
]
let VILLAGE_HOSTILE_IDS = [
  'minecraft:zombie',
  'minecraft:zombie_villager',
  'minecraft:husk',
  'minecraft:skeleton',
  'minecraft:spider',
  'minecraft:pillager',
  'minecraft:vindicator',
  'minecraft:witch',
  'minecraft:ravager'
]

PlayerEvents.tick(event => {
  let player = event.player
  let entity = entityOf(player)
  if (Number(entity.tickCount) % 20 !== 0) {
    return
  }
  let villagers = countNearbyEntityTypes(entity, ['minecraft:villager'], 16)
  let golems = countNearbyEntityTypes(entity, ['minecraft:iron_golem'], 16)
  let hostiles = countNearbyEntityTypes(entity, VILLAGE_HOSTILE_IDS, 18)
  let presence = villagers + golems * 2
  let worksite = hasNearbyBlock(entity, VILLAGE_WORKSITE_BLOCKS, 5)
  let emeralds = inventoryCount(player, ['minecraft:emerald'])
  let lastEmeralds = getCounter(player, 'kubejs:village_last_emeralds')
  let tradeFlow = villagers > 0 && emeralds !== lastEmeralds ? Math.min(4, Math.abs(emeralds - lastEmeralds)) : 0
  let guardLine = hostiles > 0 && (golems > 0 || villagers >= 3) ? Math.min(4, hostiles + golems) : 0
  let supplyLine = worksite && villagers > 0 ? Math.min(4, 1 + Math.floor(villagers / 2)) : 0
  setCounter(player, 'kubejs:village_presence', presence)
  setCounter(player, 'kubejs:village_trade_flow', tradeFlow)
  setCounter(player, 'kubejs:village_guard_line', guardLine)
  setCounter(player, 'kubejs:village_supply_line', supplyLine)
  if (RESOURCE && tradeFlow > 0) {
    addResource(player, 1 + tradeFlow)
  }
  if (RESOURCE && guardLine > 0) {
    addResource(player, Math.min(3, guardLine))
  }
  if (RESOURCE && supplyLine > 0) {
    addResource(player, 1)
  }
  setCounter(player, 'kubejs:village_last_emeralds', emeralds)
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


})()
