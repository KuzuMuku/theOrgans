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

let DIR_KEY = 'vanillaEnd'
let HOME = {
  "dimensions": [
    "minecraft:the_end"
  ],
  "dimension_home": true,
  "biome_keywords": [
    "end"
  ],
  "structures": [
    "minecraft:end_city"
  ],
  "structure_radius": 10
}
let HOME_CALLBACK = 'vanillaEnd_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaEnd_system",
  "capacity": "kubejs:vanillaEnd_resonance_capacity",
  "current": "kubejs:vanillaEnd_resonance",
  "capacity_en": "Void Fold Capacity",
  "capacity_desc_en": "Maximum shared reserve for void fold.",
  "current_en": "Void Fold",
  "current_desc_en": "Shared end-space fold gathered by displacement, return paths and void stability.",
  "capacity_zh": "虚空折能上限",
  "capacity_desc_zh": "虚空折能可积累的最大上限。",
  "current_zh": "虚空折能",
  "current_desc_zh": "由折返、位移与末地稳定性共同积累的虚空折能。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaEnd_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:ender_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:void_ventricle",
  "kubejs:return_spine_furnace",
  "kubejs:purpur_chest_membrane",
  "kubejs:dragonbreath_liver",
  "kubejs:ender_lung",
  "kubejs:gategap_crown",
  "kubejs:shulker_spleen",
  "kubejs:endstone_reflux_gland",
  "kubejs:endgate_lung",
  "kubejs:enderwart_liver",
  "kubejs:voidabyss_kidneysheath",
  "kubejs:enddust_spleen_membrane",
  "kubejs:shadowfold_arm",
  "kubejs:shadow_throat_sac",
  "kubejs:endleap_tendon",
  "kubejs:wingfold_shoulder_ring",
  "kubejs:endpattern_iris",
  "kubejs:foldgate_fist",
  "kubejs:endbound_shoulderplate",
  "kubejs:gategap_tailbone"
])
let CORELINE_IDS = new Set([
  "kubejs:void_ventricle",
  "kubejs:return_spine_furnace"
])
let SUPPORT_IDS = new Set([
  "kubejs:endgate_lung",
  "kubejs:gategap_tailbone"
])
let FOLD_IDS = new Set([
  "kubejs:return_spine_furnace",
  "kubejs:foldgate_fist",
  "kubejs:shadowfold_arm"
])
let GATE_IDS = new Set([
  "kubejs:endgate_lung",
  "kubejs:gategap_crown",
  "kubejs:gategap_tailbone"
])
let CITY_IDS = new Set([
  "kubejs:purpur_chest_membrane",
  "kubejs:shulker_spleen",
  "kubejs:enddust_spleen_membrane"
])
let AIR_IDS = new Set([
  "kubejs:endleap_tendon",
  "kubejs:wingfold_shoulder_ring",
  "kubejs:endgate_lung"
])
let MANA_IDS = new Set([
  "kubejs:dragonbreath_liver",
  "kubejs:enderwart_liver"
])
let SPELL_IDS = new Set([
  "kubejs:ender_lung"
])
let CROWN_IDS = new Set([
  "kubejs:gategap_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:purpur_chest_membrane",
  "kubejs:voidabyss_kidneysheath"
])
let MOVEMENT_IDS = new Set([
  "kubejs:endleap_tendon",
  "kubejs:wingfold_shoulder_ring"
])
let MELEE_IDS = new Set([
  "kubejs:shadowfold_arm",
  "kubejs:endbound_shoulderplate",
  "kubejs:foldgate_fist"
])
let RANGED_IDS = new Set([
  "kubejs:endpattern_iris",
  "kubejs:shadow_throat_sac"
])
let RESOURCE_IDS = new Set([
  "kubejs:shulker_spleen",
  "kubejs:enddust_spleen_membrane"
])

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE ? RESOURCE.current : null)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
let setSourcePointValue = Common.setSourcePointValue
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
  let foldCount = countMatching(installed, FOLD_IDS)
  let gateCount = countMatching(installed, GATE_IDS)
  let cityCount = countMatching(installed, CITY_IDS)
  let airCount = countMatching(installed, AIR_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let foldPoint = foldCount > 0 ? movementCount + huntCount : 0
  let gatePoint = gateCount > 0 ? crownCount + supportCount + movementCount : 0
  let cityPoint = cityCount > 0 ? armorCount + resourceCount : 0
  let airPoint = airCount > 0 ? movementCount + countMatching(installed, RANGED_IDS) : 0
  setLinkCounter(player, 'kubejs:vanillaEnd_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaEnd_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaEnd_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaEnd_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaEnd_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaEnd_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:vanillaEnd_fold_line', foldPoint)
  setLinkCounter(player, 'kubejs:vanillaEnd_gate_line', gatePoint)
  setLinkCounter(player, 'kubejs:vanillaEnd_city_line', cityPoint)
  setLinkCounter(player, 'kubejs:vanillaEnd_air_line', airPoint)
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

function currentY(entity) {
  try {
    return Number(entity.getY())
  } catch (ignored) {
    return 0
  }
}

function hasVoidKit(player) {
  return inventoryCount(player, [
    'minecraft:ender_pearl',
    'minecraft:chorus_fruit',
    'minecraft:elytra'
  ]) > 0
}

function isCityZone(player) {
  let entity = entityOf(player)
  return dimensionId(entity) === 'minecraft:the_end' && hasNearbyBlock(entity, [
    'minecraft:purpur_block',
    'minecraft:purpur_pillar',
    'minecraft:end_rod',
    'minecraft:end_stone_bricks'
  ], 5)
}

function isGateZone(player) {
  let entity = entityOf(player)
  return dimensionId(entity) === 'minecraft:the_end' && (hasNearbyBlock(entity, [
    'minecraft:end_gateway',
    'minecraft:end_portal',
    'minecraft:chorus_plant',
    'minecraft:chorus_flower'
  ], 5) || hasVoidKit(player))
}

function isAirZone(player) {
  let entity = entityOf(player)
  return dimensionId(entity) === 'minecraft:the_end' && (currentY(entity) >= 80 || hasVoidKit(player))
}

function homeState(player) {
  return Common.homeState(player, HOME)
}

function homeMatch(player) {
  return Common.homeMatch(player, HOME, function (player) {
    return hasVoidKit(player)
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

let vanillaEndPredicateResult = Common.predicateResult

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaEndPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaEnd_set_major', event => {
  return vanillaEndPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaEnd_resource_online', event => {
  return vanillaEndPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaEnd_has_coreline', event => {
  return vanillaEndPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaEnd_has_support', event => {
  return vanillaEndPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaEnd_has_mana', event => {
  return vanillaEndPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaEnd_has_spell', event => {
  return vanillaEndPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaEnd_has_crown', event => {
  return vanillaEndPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaEnd_has_armor', event => {
  return vanillaEndPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaEnd_has_movement', event => {
  return vanillaEndPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaEnd_has_resource', event => {
  return vanillaEndPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaEnd_has_hunt', event => {
  if (!event.player) {
    return vanillaEndPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaEndPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaEnd_has_chase', event => {
  if (!event.player) {
    return vanillaEndPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaEndPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaEnd_fold_ready', event => {
  return vanillaEndPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaEnd_fold_cycle') > 0)
})

OrganKubejsEvents.predicate('vanillaEnd_gate_online', event => {
  return vanillaEndPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaEnd_city_online', event => {
  return vanillaEndPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaEnd_air_online', event => {
  return vanillaEndPredicateResult(event, !!event.player && homeMatch(event.player))
})




PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_gate_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_city_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_air_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_fold_cycle', 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  let gateOnline = isGateZone(player)
  let cityOnline = isCityZone(player)
  let airOnline = isAirZone(player)
  setRuntimePoint(player, 'kubejs:vanillaEnd_gate_window', gateOnline ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaEnd_city_window', cityOnline ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaEnd_air_window', airOnline ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaEnd_fold_cycle', gateOnline || airOnline ? 1 : 0)
  applyLinearLinks(player)
})


OrganKubejsEvents.skillCast('shadow_throat_sac_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let scaledDuration = 100 + getLinkCounter(player, 'kubejs:vanillaEnd_gate_line') * 20
  spendResource(player, 12)
  let targets = targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    addEffect(targets[i], MobEffects.WEAKNESS, scaledDuration, 0)
  }
  return true
})

OrganKubejsEvents.skillCast('foldgate_fist_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let target = targetInFront(player, 9.0)
  if (!target) {
    return false
  }
  let entity = entityOf(player)
  let scaledDamage = 12 + getLinkCounter(player, 'kubejs:vanillaEnd_fold_line') + getLinkCounter(player, 'kubejs:vanillaEnd_air_line')
  let dx = target.getX() - entity.getX()
  let dz = target.getZ() - entity.getZ()
  let length = Math.max(0.01, Math.sqrt(dx * dx + dz * dz))
  entity.teleportTo(target.getX() - dx / length, target.getY(), target.getZ() - dz / length)
  spendResource(player, 12)
  damageTarget(player, target, scaledDamage, 0.6)
  return true
})

})()
