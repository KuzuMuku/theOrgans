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

let DIR_KEY = 'vanillaSwamp'
let HOME = {
  "dimensions": [
    "minecraft:overworld"
  ],
  "biome_keywords": [
    "swamp",
    "mangrove"
  ],
  "structures": [
    "minecraft:swamp_hut"
  ],
  "structure_radius": 8
}
let HOME_CALLBACK = 'vanillaSwamp_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaSwamp_system",
  "capacity": "kubejs:vanillaSwamp_resonance_capacity",
  "current": "kubejs:vanillaSwamp_resonance",
  "capacity_en": "Mire Venom Capacity",
  "capacity_desc_en": "Maximum shared reserve for mire venom.",
  "current_en": "Mire Venom",
  "current_desc_en": "Shared swamp mire venom gathered by sludge, poison and wet decay.",
  "capacity_zh": "沼腐毒势上限",
  "capacity_desc_zh": "沼腐毒势可积累的最大上限。",
  "current_zh": "沼腐毒势",
  "current_desc_zh": "由污泥、毒素与潮湿腐化共同积累的沼腐毒势。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaSwamp_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:nature_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:silt_poison_heart",
  "kubejs:rotmoss_filter_liver",
  "kubejs:bog_rot_sac",
  "kubejs:slime_shell",
  "kubejs:slime_thread_arm",
  "kubejs:poison_bloom_throat",
  "kubejs:frogfin_sneak_leg",
  "kubejs:sporebog_lung",
  "kubejs:slime_mana_spleen",
  "kubejs:witchbog_crown"
])
let CORELINE_IDS = new Set([
  "kubejs:silt_poison_heart"
])
let SUPPORT_IDS = new Set([
  "kubejs:bog_rot_sac"
])
let VENOM_IDS = new Set([
  "kubejs:silt_poison_heart",
  "kubejs:bog_rot_sac",
  "kubejs:poison_bloom_throat"
])
let SLIME_IDS = new Set([
  "kubejs:slime_shell",
  "kubejs:slime_thread_arm",
  "kubejs:frogfin_sneak_leg",
  "kubejs:slime_mana_spleen"
])
let ROT_IDS = new Set([
  "kubejs:rotmoss_filter_liver",
  "kubejs:sporebog_lung",
  "kubejs:witchbog_crown"
])
let MIRE_IDS = new Set([
  "kubejs:silt_poison_heart",
  "kubejs:slime_shell",
  "kubejs:frogfin_sneak_leg"
])
let MANA_IDS = new Set([
  "kubejs:rotmoss_filter_liver"
])
let SPELL_IDS = new Set([
  "kubejs:sporebog_lung"
])
let CROWN_IDS = new Set([
  "kubejs:witchbog_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:slime_shell"
])
let MOVEMENT_IDS = new Set([
  "kubejs:frogfin_sneak_leg"
])
let MELEE_IDS = new Set([
  "kubejs:slime_thread_arm"
])
let RANGED_IDS = new Set([
  "kubejs:poison_bloom_throat"
])
let RESOURCE_IDS = new Set([
  "kubejs:slime_mana_spleen"
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
  let venomCount = countMatching(installed, VENOM_IDS)
  let slimeCount = countMatching(installed, SLIME_IDS)
  let rotCount = countMatching(installed, ROT_IDS)
  let mireCount = countMatching(installed, MIRE_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let venomPoint = venomCount > 0 ? huntCount + resourceCount : 0
  let slimePoint = slimeCount > 0 ? movementCount + armorCount + resourceCount : 0
  let rotPoint = rotCount > 0 ? manaCount + spellCount + crownCount : 0
  let mirePoint = mireCount > 0 ? corelineCount + armorCount + movementCount : 0
  setLinkCounter(player, 'kubejs:vanillaSwamp_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaSwamp_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaSwamp_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaSwamp_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaSwamp_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaSwamp_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:vanillaSwamp_venom_line', venomPoint)
  setLinkCounter(player, 'kubejs:vanillaSwamp_slime_line', slimePoint)
  setLinkCounter(player, 'kubejs:vanillaSwamp_rot_line', rotPoint)
  setLinkCounter(player, 'kubejs:vanillaSwamp_mire_line', mirePoint)
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

function isWet(player) {
  let entity = entityOf(player)
  try {
    return !!entity.isInWaterOrRain()
  } catch (ignored) {
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

function slimeTerrain(player) {
  let entity = entityOf(player)
  return hasNearbyBlock(entity, [
    'minecraft:mud',
    'minecraft:slime_block',
    'minecraft:lily_pad',
    'minecraft:brown_mushroom',
    'minecraft:moss_block',
    'minecraft:clay'
  ], 5)
}

function crowdedBog(player) {
  let entity = entityOf(player)
  let list = entity.level.getEntities(entity, entity.getBoundingBox().inflate(5))
  let iterator = list.iterator()
  let total = 0
  while (iterator.hasNext()) {
    let target = iterator.next()
    if (!target || !(target instanceof LivingEntityClass) || target === entity || !target.isAlive()) {
      continue
    }
    total++
  }
  return total >= 2
}

function homeState(player) {
  return Common.homeState(player, HOME)
}

function homeMatch(player) {
  return Common.homeMatch(player, HOME, function (player) {
    return isWet(player) || isRainingHere(player)
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

let vanillaSwampPredicateResult = Common.predicateResult

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaSwampPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaSwamp_set_major', event => {
  return vanillaSwampPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaSwamp_resource_online', event => {
  return vanillaSwampPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_coreline', event => {
  return vanillaSwampPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_support', event => {
  return vanillaSwampPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_mana', event => {
  return vanillaSwampPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_spell', event => {
  return vanillaSwampPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_crown', event => {
  return vanillaSwampPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_armor', event => {
  return vanillaSwampPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_movement', event => {
  return vanillaSwampPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_resource', event => {
  return vanillaSwampPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_hunt', event => {
  if (!event.player) {
    return vanillaSwampPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaSwampPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaSwamp_has_chase', event => {
  if (!event.player) {
    return vanillaSwampPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaSwampPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaSwamp_mire_online', event => {
  return vanillaSwampPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaSwamp_slime_online', event => {
  return vanillaSwampPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaSwamp_slime_window') > 0)
})

OrganKubejsEvents.predicate('vanillaSwamp_venom_online', event => {
  return vanillaSwampPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaSwamp_venom_window') > 0)
})

OrganKubejsEvents.predicate('vanillaSwamp_rot_online', event => {
  return vanillaSwampPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaSwamp_rot_window') > 0)
})




PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaSwamp_mire_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaSwamp_slime_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaSwamp_venom_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaSwamp_rot_window', 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  let mire = homeMatch(player) || isWet(player) || isRainingHere(player)
  let slime = slimeTerrain(player)
  let venom = mire && crowdedBog(player)
  let rot = slime || hasNearbyBlock(entityOf(player), ['minecraft:brown_mushroom', 'minecraft:red_mushroom', 'minecraft:moss_block'], 4)
  setRuntimePoint(player, 'kubejs:vanillaSwamp_mire_window', mire ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaSwamp_slime_window', slime ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaSwamp_venom_window', venom ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaSwamp_rot_window', rot ? 1 : 0)
  applyLinearLinks(player)
})


OrganKubejsEvents.skillCast('poison_bloom_throat_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let scaledDuration = 100 + getLinkCounter(player, 'kubejs:vanillaSwamp_venom_line') * 20
  spendResource(player, 12)
  let targets = targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    addEffect(targets[i], MobEffects.POISON, scaledDuration, 0)
    addEffect(targets[i], MobEffects.MOVEMENT_SLOWDOWN, scaledDuration, 0)
  }
  return true
})

})()
