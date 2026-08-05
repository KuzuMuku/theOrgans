// priority: 1000
let Common = global.Common || (global.Common = {})

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function rawEntity(entity) {
  return entity && entity.minecraftEntity ? entity.minecraftEntity : entity
}

function pointKey(pointType, pointId) {
  return OrganKubeJS.pointKey(pointType, pointId)
}

function getTypedPoint(player, pointType, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), pointType, pointId))
}

function setSourcePointValue(player, sourceTag, key, value) {
  OrganKubeJS.setSourcePoint(entityOf(player), sourceTag, key, Math.max(0, Math.floor(value)))
}

function getCounter(player, pointId) {
  return getTypedPoint(player, 'counter', pointId)
}

function getRuntimePoint(player, pointId) {
  return getTypedPoint(player, 'runtime', pointId)
}

function getShieldPoint(player, pointId) {
  return getTypedPoint(player, 'shield', pointId)
}

function getLinkCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function addItemsToTag(event, tagId, ids) {
  for (let i = 0; i < ids.length; i++) {
    event.add(tagId, normalizeItemId(ids[i]))
  }
}

function isWet(player) {
  let entity = entityOf(player)
  try {
    return !!entity.isInWaterOrBubble() || !!entity.isInWaterOrBubbleColumn() || !!entity.isInWaterOrRain()
  } catch (ignored) {
  }
  try {
    return !!entity.isInWater()
  } catch (ignored2) {
  }
  return false
}

function isRainingHere(player) {
  let entity = entityOf(player)
  try {
    return !!entity.level.isRainingAt(entity.blockPosition())
  } catch (ignored) {
  }
  return false
}

function isSnowingHere(player) {
  return isRainingHere(player)
}

function hasSnowGround(player) {
  let entity = entityOf(player)
  return hasNearbyBlock(entity, [
    'minecraft:snow_block',
    'minecraft:powder_snow',
    'minecraft:ice',
    'minecraft:packed_ice',
    'minecraft:blue_ice'
  ], 5)
}

function lowMotion(player) {
  let entity = entityOf(player)
  try {
    let movement = entity.getDeltaMovement()
    return Math.abs(Number(movement.x())) + Math.abs(Number(movement.z())) < 0.04
  } catch (ignored) {
  }
  return false
}

function addEffect(entity, effect, duration, amplifier) {
  let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
  entity.addEffect(new MobEffectInstance(effect, duration, amplifier, false, false, true))
}

function vecX(vec) {
  if (!vec) {
    return 0
  }
  try {
    return Number(vec.x())
  } catch (ignored) {
    return Number(vec && vec.x != null ? vec.x : 0)
  }
}

function vecY(vec) {
  if (!vec) {
    return 0
  }
  try {
    return Number(vec.y())
  } catch (ignored) {
    return Number(vec && vec.y != null ? vec.y : 0)
  }
}

function vecZ(vec) {
  if (!vec) {
    return 0
  }
  try {
    return Number(vec.z())
  } catch (ignored) {
    return Number(vec && vec.z != null ? vec.z : 0)
  }
}

function installedSourceIds(player) {
  let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
  let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')
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

function hasNearbyStructure(entity, structureIds, radiusChunks, cache) {
  let Registries = Java.loadClass('net.minecraft.core.registries.Registries')
  let HolderSet = Java.loadClass('net.minecraft.core.HolderSet')
  let ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
  let ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
  if (!structureIds || structureIds.length === 0) {
    return false
  }
  let tick = Number(entity.tickCount)
  let cacheKey = structureCacheKey(entity, structureIds, radiusChunks)
  let cached = cache.get(cacheKey)
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
  cache.set(cacheKey, { expireAt: tick + 100, value: matched })
  return matched
}

function entityTypeId(entity) {
  let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

function hasNearbyBlock(entity, ids, radius) {
  let BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
  let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
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
  let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
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
  let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
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

function sqDistanceBetween(a, b) {
  let dx = Number(a.getX()) - Number(b.getX())
  let dy = Number(a.getY()) - Number(b.getY())
  let dz = Number(a.getZ()) - Number(b.getZ())
  return dx * dx + dy * dy + dz * dz
}

function targetsSortedByDistance(player, radius) {
  let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
  let entity = entityOf(player)
  let targets = []
  let list = entity.level.getEntities(entity, entity.getBoundingBox().inflate(radius))
  let iterator = list.iterator()
  while (iterator.hasNext()) {
    let target = rawEntity(iterator.next())
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
  let lookX = vecX(look)
  let lookZ = vecZ(look)
  let targets = targetsSortedByDistance(player, radius)
  let best = null
  let score = -1000
  for (let i = 0; i < targets.length; i++) {
    let target = targets[i]
    let dx = Number(target.getX()) - Number(entity.getX())
    let dz = Number(target.getZ()) - Number(entity.getZ())
    let length = Math.max(0.01, Math.sqrt(dx * dx + dz * dz))
    let dot = dx / length * lookX + dz / length * lookZ
    if (dot > score) {
      score = dot
      best = target
    }
  }
  return score > -0.15 ? best : null
}

function swingMainHand(player) {
  let InteractionHand = Java.loadClass('net.minecraft.world.InteractionHand')
  player.swing(InteractionHand.MAIN_HAND)
}

function damageTarget(player, target, amount, knockbackStrength) {
  let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
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

function homeState(player, home) {
  let entity = entityOf(player)
  let dim = dimensionId(entity)
  let dimensionMatch = !!home.dimension_home && home.dimensions && home.dimensions.indexOf(dim) >= 0
  let biomeMatch = false
  let structureMatch = false
  let biome = biomeId(entity)
  if (home.biome_keywords) {
    for (let i = 0; i < home.biome_keywords.length; i++) {
      if (biome.indexOf(home.biome_keywords[i]) >= 0) {
        biomeMatch = true
        break
      }
    }
  }
  structureMatch = hasNearbyStructure(entity, home.structures || [], home.structure_radius || 8, home.structure_cache || null)
  return {
    dimension: dimensionMatch,
    biome: biomeMatch,
    structure: structureMatch,
    final: dimensionMatch || biomeMatch || structureMatch
  }
}

function homeMatch(player, home, extraMatchFn) {
  let state = homeState(player, home)
  if (state.final) {
    return true
  }
  if (extraMatchFn) {
    return !!extraMatchFn(player)
  }
  return false
}

function predicateResult(event, value) {
  return event.success(!!value)
}

function tauntNearby(player, radius) {
  let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
  let MobClass = Java.loadClass('net.minecraft.world.entity.Mob')
  let entity = entityOf(player)
  let list = entity.level.getEntities(entity, entity.getBoundingBox().inflate(radius))
  let iterator = list.iterator()
  while (iterator.hasNext()) {
    let target = rawEntity(iterator.next())
    if (!target || !(target instanceof LivingEntityClass) || target === entity || !target.isAlive()) {
      continue
    }
    if (target instanceof MobClass) {
      target.setTarget(entity)
    }
  }
}

function currentWeaponBonus(player) {
  let stack = entityOf(player).getMainHandItem()
  if (stack.isEmpty()) {
    return 0
  }
  return stack.getMaxDamage() > 0 ? 4 : 2
}

function createRuntimeTools(systemSource, linkSource, resourceId) {
  function setCounter(player, pointId, value) {
    setSourcePointValue(player, systemSource, pointKey('counter', pointId), value)
  }

  function setRuntimePoint(player, pointId, value) {
    setSourcePointValue(player, systemSource, pointKey('runtime', pointId), value)
  }

  function setLinkCounter(player, pointId, value) {
    setSourcePointValue(player, linkSource, pointKey('counter', pointId), value)
  }

  function setLinkAttribute(player, attributeId, value) {
    setSourcePointValue(player, linkSource, 'attribute:' + attributeId, value)
  }

  function consumeCounter(player, pointId, amount) {
    return Number(OrganKubeJS.consumeSourcePoint(entityOf(player), systemSource, pointKey('counter', pointId), Math.floor(amount)))
  }

  function resourceReady(player, amount) {
    if (!resourceId || amount <= 0) {
      return true
    }
    return getCounter(player, resourceId) >= amount
  }

  function spendResource(player, amount) {
    if (!resourceId || amount <= 0) {
      return 0
    }
    return consumeCounter(player, resourceId, amount)
  }

  function addResource(player, amount) {
    if (!resourceId || amount <= 0) {
      return
    }
    setCounter(player, resourceId, getCounter(player, resourceId) + amount)
  }

  return {
    getCounter: getCounter,
    getRuntimePoint: getRuntimePoint,
    getLinkCounter: getLinkCounter,
    setCounter: setCounter,
    setRuntimePoint: setRuntimePoint,
    setLinkCounter: setLinkCounter,
    setLinkAttribute: setLinkAttribute,
    consumeCounter: consumeCounter,
    resourceReady: resourceReady,
    spendResource: spendResource,
    addResource: addResource
  }
}

Common.createRuntimeTools = createRuntimeTools
Common.addItemsToTag = addItemsToTag
Common.entityOf = entityOf
Common.rawEntity = rawEntity
Common.pointKey = pointKey
Common.getTypedPoint = getTypedPoint
Common.setSourcePointValue = setSourcePointValue
Common.getCounter = getCounter
Common.getRuntimePoint = getRuntimePoint
Common.getShieldPoint = getShieldPoint
Common.getLinkCounter = getLinkCounter
Common.isWet = isWet
Common.isRainingHere = isRainingHere
Common.isSnowingHere = isSnowingHere
Common.hasSnowGround = hasSnowGround
Common.lowMotion = lowMotion
Common.addEffect = addEffect
Common.vecX = vecX
Common.vecY = vecY
Common.vecZ = vecZ
Common.installedSourceIds = installedSourceIds
Common.countMatching = countMatching
Common.hasMatching = hasMatching
Common.biomeId = biomeId
Common.cleanDimensionId = cleanDimensionId
Common.dimensionId = dimensionId
Common.structureCacheKey = structureCacheKey
Common.hasNearbyStructure = hasNearbyStructure
Common.entityTypeId = entityTypeId
Common.hasNearbyBlock = hasNearbyBlock
Common.countNearbyEntityTypes = countNearbyEntityTypes
Common.inventoryCount = inventoryCount
Common.sqDistanceBetween = sqDistanceBetween
Common.targetsSortedByDistance = targetsSortedByDistance
Common.targetInFront = targetInFront
Common.swingMainHand = swingMainHand
Common.damageTarget = damageTarget
Common.tauntNearby = tauntNearby
Common.currentWeaponBonus = currentWeaponBonus
Common.homeState = homeState
Common.homeMatch = homeMatch
Common.predicateResult = predicateResult
