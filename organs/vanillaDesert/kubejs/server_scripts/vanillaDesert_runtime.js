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

let DIR_KEY = 'vanillaDesert'
let HOME = {
  "dimensions": [
    "minecraft:overworld"
  ],
  "biome_keywords": [
    "desert",
    "badlands"
  ],
  "structures": [
    "minecraft:desert_pyramid"
  ],
  "structure_radius": 8
}
let HOME_CALLBACK = 'vanillaDesert_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaDesert_system",
  "capacity": "kubejs:vanillaDesert_resonance_capacity",
  "current": "kubejs:vanillaDesert_resonance",
  "capacity_en": "Dune Heat Capacity",
  "capacity_desc_en": "Maximum shared reserve for dune heat.",
  "current_en": "Dune Heat",
  "current_desc_en": "Shared desert heat gathered by sand, motion and predation.",
  "capacity_zh": "流沙热量上限",
  "capacity_desc_zh": "流沙热量可积累的最大上限。",
  "current_zh": "流沙热量",
  "current_desc_zh": "由沙地、移动与猎杀共同积累的沙漠热量。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaDesert_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:fire_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:sun_ventricle",
  "kubejs:sandstone_breastplate",
  "kubejs:drought_liver",
  "kubejs:heatwave_lung",
  "kubejs:quicksand_spleen",
  "kubejs:eclipse_crown",
  "kubejs:wind_erosion_arm",
  "kubejs:cactus_tendon",
  "kubejs:drysand_iris",
  "kubejs:temple_scavenger_hand"
])
let CORELINE_IDS = new Set([
  "kubejs:sun_ventricle"
])
let SUPPORT_IDS = new Set([])
let DRYHEAT_IDS = new Set([
  "kubejs:sun_ventricle",
  "kubejs:drought_liver",
  "kubejs:heatwave_lung"
])
let EROSION_IDS = new Set([
  "kubejs:wind_erosion_arm",
  "kubejs:drysand_iris"
])
let TEMPLE_IDS = new Set([
  "kubejs:sandstone_breastplate",
  "kubejs:temple_scavenger_hand"
])
let DAYLIGHT_IDS = new Set([
  "kubejs:eclipse_crown",
  "kubejs:cactus_tendon",
  "kubejs:heatwave_lung"
])
let MANA_IDS = new Set([
  "kubejs:drought_liver"
])
let SPELL_IDS = new Set([
  "kubejs:heatwave_lung"
])
let CROWN_IDS = new Set([
  "kubejs:eclipse_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:sandstone_breastplate"
])
let MOVEMENT_IDS = new Set([
  "kubejs:cactus_tendon"
])
let MELEE_IDS = new Set([
  "kubejs:wind_erosion_arm"
])
let RANGED_IDS = new Set([
  "kubejs:drysand_iris"
])
let RESOURCE_IDS = new Set([
  "kubejs:quicksand_spleen",
  "kubejs:temple_scavenger_hand"
])

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function pointKey(pointType, pointId) {
  return OrganKubeJS.pointKey(pointType, pointId)
}

function setSourcePointValue(player, sourceTag, key, value) {
  OrganKubeJS.setSourcePoint(entityOf(player), sourceTag, key, Math.max(0, Math.floor(value)))
}

function getCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function getLinkCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function setCounter(player, pointId, value) {
  setSourcePointValue(player, SYSTEM_SOURCE, pointKey('counter', pointId), value)
}

function setLinkCounter(player, pointId, value) {
  setSourcePointValue(player, LINK_SOURCE, pointKey('counter', pointId), value)
}

function setLinkAttribute(player, attributeId, value) {
  setSourcePointValue(player, LINK_SOURCE, 'attribute:' + attributeId, value)
}

function getRuntimePoint(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId))
}

function setRuntimePoint(player, pointId, value) {
  setSourcePointValue(player, SYSTEM_SOURCE, pointKey('runtime', pointId), value)
}

function consumeCounter(player, pointId, amount) {
  return Number(OrganKubeJS.consumeSourcePoint(entityOf(player), SYSTEM_SOURCE, pointKey('counter', pointId), Math.floor(amount)))
}

function resourceReady(player, amount) {
  if (!RESOURCE || amount <= 0) {
    return true
  }
  return getCounter(player, RESOURCE.current) >= amount
}

function spendResource(player, amount) {
  if (!RESOURCE || amount <= 0) {
    return 0
  }
  return consumeCounter(player, RESOURCE.current, amount)
}

function addResource(player, amount) {
  if (!RESOURCE || amount <= 0) {
    return
  }
  setCounter(player, RESOURCE.current, getCounter(player, RESOURCE.current) + amount)
}

function addEffect(entity, effect, duration, amplifier) {
  entity.addEffect(new MobEffectInstance(effect, duration, amplifier, false, false, true))
}

function installedSourceIds(player) {
  let found = []
  let positions = OrganQueryService.getInstalledOrganPositions(entityOf(player))
  let iterator = positions.iterator()
  while (iterator.hasNext()) {
    let position = iterator.next()
    let stack = position.organ()
    if (!stack || stack.isEmpty()) {
      continue
    }
    found.push(String(BuiltInRegistries.ITEM.getKey(stack.getItem())))
  }
  return found
}

function countMatching(installed, wanted) {
  let total = 0
  for (let i = 0; i < installed.length; i++) {
    if (wanted.has(installed[i])) {
      total++
    }
  }
  return total
}

function hasMatching(installed, wanted) {
  return countMatching(installed, wanted) > 0
}

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
  let dryheatCount = countMatching(installed, DRYHEAT_IDS)
  let erosionCount = countMatching(installed, EROSION_IDS)
  let templeCount = countMatching(installed, TEMPLE_IDS)
  let daylightCount = countMatching(installed, DAYLIGHT_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let dryheatPoint = dryheatCount > 0 ? manaCount + crownCount + movementCount : 0
  let erosionPoint = erosionCount > 0 ? huntCount + movementCount : 0
  let templePoint = templeCount > 0 ? armorCount + resourceCount : 0
  let daylightPoint = daylightCount > 0 ? spellCount + movementCount : 0
  setLinkCounter(player, 'kubejs:vanillaDesert_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaDesert_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaDesert_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaDesert_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaDesert_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaDesert_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:vanillaDesert_dryheat_line', dryheatPoint)
  setLinkCounter(player, 'kubejs:vanillaDesert_erosion_line', erosionPoint)
  setLinkCounter(player, 'kubejs:vanillaDesert_temple_line', templePoint)
  setLinkCounter(player, 'kubejs:vanillaDesert_daylight_line', daylightPoint)
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

function isDaytime(player) {
  let entity = entityOf(player)
  try {
    return !!entity.level.isDay()
  } catch (ignored) {
  }
  return false
}

function highLight(player) {
  let entity = entityOf(player)
  try {
    return Number(entity.level.getMaxLocalRawBrightness(entity.blockPosition())) >= 12
  } catch (ignored) {
  }
  return false
}

function isTempleZone(player) {
  let entity = entityOf(player)
  return dimensionId(entity) === 'minecraft:overworld' && hasNearbyBlock(entity, [
    'minecraft:sandstone',
    'minecraft:cut_sandstone',
    'minecraft:chiseled_sandstone',
    'minecraft:suspicious_sand'
  ], 5)
}

function homeState(player) {
  return Common.homeState(player, HOME)
}

function homeMatch(player) {
  return Common.homeMatch(player, HOME, function (player) {
    return isDaytime(player)
  })
}

let sqDistanceBetween = Common.sqDistanceBetween

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

let vanillaDesertPredicateResult = Common.predicateResult

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaDesertPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_set_major', event => {
  return vanillaDesertPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaDesert_resource_online', event => {
  return vanillaDesertPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaDesert_has_coreline', event => {
  return vanillaDesertPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaDesert_has_support', event => {
  return vanillaDesertPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaDesert_has_mana', event => {
  return vanillaDesertPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaDesert_has_spell', event => {
  return vanillaDesertPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaDesert_has_crown', event => {
  return vanillaDesertPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaDesert_has_armor', event => {
  return vanillaDesertPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaDesert_has_movement', event => {
  return vanillaDesertPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaDesert_has_resource', event => {
  return vanillaDesertPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaDesert_has_hunt', event => {
  if (!event.player) {
    return vanillaDesertPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaDesertPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaDesert_has_chase', event => {
  if (!event.player) {
    return vanillaDesertPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaDesertPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaDesert_dryheat_online', event => {
  return vanillaDesertPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_erosion_ready', event => {
  return vanillaDesertPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaDesert_erosion_window') > 0)
})

OrganKubejsEvents.predicate('vanillaDesert_temple_online', event => {
  return vanillaDesertPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_daylight_online', event => {
  return vanillaDesertPredicateResult(event, !!event.player && homeMatch(event.player))
})




PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaDesert_dryheat_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaDesert_erosion_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaDesert_temple_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaDesert_daylight_window', 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  let dryheat = isDaytime(player) && highLight(player)
  let temple = isTempleZone(player)
  setRuntimePoint(player, 'kubejs:vanillaDesert_dryheat_window', dryheat ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaDesert_erosion_window', dryheat || temple ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaDesert_temple_window', temple ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaDesert_daylight_window', isDaytime(player) ? 1 : 0)
  applyLinearLinks(player)
})


})()
