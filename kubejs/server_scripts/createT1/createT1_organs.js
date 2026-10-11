;(function () {
let BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')

let SYSTEM_SOURCE = 'kubejs_level1_system'

let POINT = {
  torqueCapacity: 'kubejs:torque_capacity',
  torque: 'kubejs:torque',
  inertia: 'kubejs:inertia',
  chainsawActive: 'kubejs:chainsaw_active',
  proximityAttack: 'kubejs:proximity_attack'
}

let ORE_CRUSH_MAP = {
  'minecraft:coal_ore': { output: 'minecraft:coal', count: 2 },
  'minecraft:deepslate_coal_ore': { output: 'minecraft:coal', count: 2 },
  'minecraft:iron_ore': { output: 'minecraft:raw_iron', count: 2 },
  'minecraft:deepslate_iron_ore': { output: 'minecraft:raw_iron', count: 2 },
  'minecraft:copper_ore': { output: 'minecraft:raw_copper', count: 4 },
  'minecraft:deepslate_copper_ore': { output: 'minecraft:raw_copper', count: 4 },
  'minecraft:gold_ore': { output: 'minecraft:raw_gold', count: 2 },
  'minecraft:deepslate_gold_ore': { output: 'minecraft:raw_gold', count: 2 },
  'minecraft:lapis_ore': { output: 'minecraft:lapis_lazuli', count: 12 },
  'minecraft:deepslate_lapis_ore': { output: 'minecraft:lapis_lazuli', count: 12 },
  'minecraft:redstone_ore': { output: 'minecraft:redstone', count: 12 },
  'minecraft:deepslate_redstone_ore': { output: 'minecraft:redstone', count: 12 },
  'minecraft:diamond_ore': { output: 'minecraft:diamond', count: 2 },
  'minecraft:deepslate_diamond_ore': { output: 'minecraft:diamond', count: 2 },
  'minecraft:emerald_ore': { output: 'minecraft:emerald', count: 2 },
  'minecraft:deepslate_emerald_ore': { output: 'minecraft:emerald', count: 2 },
  'minecraft:nether_quartz_ore': { output: 'minecraft:quartz', count: 6 },
  'minecraft:nether_gold_ore': { output: 'minecraft:gold_nugget', count: 12 }
}

let pointKey = Common.pointKey
let entityOf = Common.entityOf
let rawEntity = Common.rawEntity
let sqDistanceBetween = Common.sqDistanceBetween
let vecX = Common.vecX
let vecY = Common.vecY
let vecZ = Common.vecZ

function getPoint(player, pointType, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), pointType, pointId))
}

function setCounter(player, pointId, value) {
  OrganKubeJS.setSourcePoint(entityOf(player), SYSTEM_SOURCE, pointKey('counter', pointId), Math.max(0, Math.floor(value)))
}

function addCounter(player, pointId, value) {
  if (value === 0) {
    return
  }
  OrganKubeJS.addTypedSourcePoint(entityOf(player), SYSTEM_SOURCE, 'counter', pointId, Math.floor(value))
}

function consumeCounter(player, pointId, value) {
  if (value <= 0) {
    return 0
  }
  return Number(OrganKubeJS.consumeSourcePoint(entityOf(player), SYSTEM_SOURCE, pointKey('counter', pointId), Math.floor(value)))
}

function clampCurrentResources(player) {
  let torqueCap = getPoint(player, 'counter', POINT.torqueCapacity)
  let torque = Math.min(getPoint(player, 'counter', POINT.torque), torqueCap)
  setCounter(player, POINT.torque, Math.max(0, torque))
}

function addTorque(player, amount) {
  let current = getPoint(player, 'counter', POINT.torque)
  setCounter(player, POINT.torque, current + amount)
}

function consumeTorque(player, amount) {
  return consumeCounter(player, POINT.torque, amount)
}

function clearTorque(player) {
  let current = getPoint(player, 'counter', POINT.torque)
  if (current > 0) {
    consumeTorque(player, current)
  }
  return current
}

let addEffect = Common.addEffect
let targetsSortedByDistance = Common.targetsSortedByDistance
let targetInFront = Common.targetInFront
let swingMainHand = Common.swingMainHand
let damageTarget = Common.damageTarget
let tauntNearby = Common.tauntNearby
let currentWeaponBonus = Common.currentWeaponBonus

function tryMineStressPick(player) {
  let playerPos = entityOf(player).blockPosition()
  let look = player.getLookAngle()
  let mined = 0
  let distance = 2
  let targetX = vecX(look) * distance
  let targetY = vecY(look) * distance
  let targetZ = vecZ(look) * distance
  for (let x = -1 + targetX; x <= 1 + targetX; x++) {
    for (let y = 1 + targetY; y <= 2 + targetY; y++) {
      for (let z = -1 + targetZ; z <= 1 + targetZ; z++) {
        let pos = new BlockPos(playerPos.getX() + x, playerPos.getY() + y, playerPos.getZ() + z)
        if (player.level.destroyBlock(pos, true, player)) {
          mined++
        }
      }
    }
  }

  return mined
}

OrganKubejsEvents.pointAction('power_hammer_counter', event => {
  let player = event.player
  if (!player || getPoint(player, 'counter', POINT.torque) < 24) {
    return 0
  }
  consumeTorque(player, 24)
  addEffect(entityOf(player), MobEffects.DAMAGE_RESISTANCE, 40, 0)
  return 1
})

OrganKubejsEvents.pointAction('shaft_attack_gain', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  addCounter(player, POINT.inertia, 2)
  addTorque(player, 6)
  return 1
})

OrganKubejsEvents.pointAction('shaft_mine_gain', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  addCounter(player, POINT.inertia, 1)
  addTorque(player, 4)
  return 1
})

OrganKubejsEvents.pointAction('shaft_interrupt', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  setCounter(player, POINT.inertia, 0)
  addEffect(entityOf(player), MobEffects.MOVEMENT_SLOWDOWN, 60, 1)
  return 1
})

OrganKubejsEvents.skillCast('piston_punch_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let torque = getPoint(player, 'counter', POINT.torque)
  if (torque < 15) {
    player.tell(Text.red('活塞冲拳至少需要 15 点扭力。'))
    return false
  }

  let spent = clearTorque(player)
  swingMainHand(player)
  let weaponBonus = currentWeaponBonus(player)
  let damage = 5 + weaponBonus + Math.floor(spent * 0.22)
  let knockback = spent >= 80 ? 1.8 : spent >= 40 ? 1.3 : 0.9
  let target = targetInFront(player, 5.5)
  if (target) {
    damageTarget(player, target, damage, knockback)
  } else {
    player.tell(Text.gray('活塞冲拳落空：前方没有可命中的目标。'))
  }

  let triggerId = spent >= 80 ? 'kubejs:piston_punch_brutal' : spent >= 40 ? 'kubejs:piston_punch_heavy' : 'kubejs:piston_punch_basic'
  OrganKubeJS.addTypedRuntimePoint(entityOf(player), 'runtime', triggerId, 1, 2)
  return true
})

OrganKubejsEvents.skillCast('spring_ram_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  if (getPoint(player, 'counter', POINT.torque) < 18) {
    player.tell(Text.red('弹射撞角至少需要 18 点扭力。'))
    return false
  }

  consumeTorque(player, 18)
  let entity = entityOf(player)
  let look = entity.getLookAngle()
  if (!look) {
    return false
  }
  let currentVelocity = entity.getDeltaMovement()
  let lookX = vecX(look)
  let lookY = vecY(look)
  let lookZ = vecZ(look)
  let launchX = vecX(currentVelocity) * 0.35 + lookX * 1.9
  let launchY = vecY(currentVelocity)
  let launchZ = vecZ(currentVelocity) * 0.35 + lookZ * 1.9
  
  player.sendData("motion", {
        x:launchX,
        y:launchY,
        z:launchZ
       })
  let targets = targetsSortedByDistance(player, 4.0)
  if (targets.length > 0) {
    damageTarget(player, targets[0], 9.0, 1.5)
    OrganKubeJS.addTypedRuntimePoint(entity, 'runtime', 'kubejs:spring_ram_impact', 1, 2)
  }
  addCounter(player, POINT.proximityAttack, 20)
  return true
})

OrganKubejsEvents.skillCast('drive_chainsaw_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let current = getPoint(player, 'counter', POINT.chainsawActive)
  if (current > 0) {
    setCounter(player, POINT.chainsawActive, 0)
    player.tell(Text.gray('传动链锯停止旋转。'))
    return false
  }
  if (getPoint(player, 'counter', POINT.torque) < 10) {
    player.tell(Text.red('传动链锯启动至少需要 10 点扭力。'))
    return false
  }
  consumeTorque(player, 10)
  setCounter(player, POINT.chainsawActive, 1)
  player.tell(Text.of('传动链锯开始高速旋转。'))
  return true
})

OrganKubejsEvents.pointAction('drive_chainsaw_cycle', event => {
  let player = event.player
  if (!player) {
    return 0
  }

  if (getPoint(player, 'counter', POINT.chainsawActive) <= 0) {
    return 0
  }

  addCounter(player, POINT.proximityAttack, 1)

  consumeTorque(player, 4)
  if (getPoint(player, 'counter', POINT.torque) < 4) {
    setCounter(player, POINT.chainsawActive, 0)
    player.tell(Text.gray('传动链锯失去扭力，已经停转。'))
    return 0
  }

  return 0
})

OrganKubejsEvents.skillCast('stress_pick_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }

  if (getPoint(player, 'counter', POINT.torque) < 24) {
    player.tell(Text.red('应力镐至少需要 24 点扭力。'))
    return false
  }
  consumeTorque(player, 24)
  
  let mined = tryMineStressPick(player)
  if (mined <= 0) {
    player.tell(Text.gray('前方没有可供粉碎的矿石。'))
    return false
  }
  
  let stack = entityOf(player).getMainHandItem()
  if (!stack.isEmpty() && stack.getMaxDamage() > 0) {
    stack.setDamageValue(Math.min(stack.getMaxDamage() - 1, stack.getDamageValue() + mined * 2))
  }
  player.tell(Text.of(`应力镐粉碎了 ${mined} 个矿块。`))
  return true
})

OrganKubejsEvents.skillCast('crushing_gears_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  if (getPoint(player, 'counter', POINT.torque) < 8) {
    player.tell(Text.red('粉碎齿轮至少需要 8 点扭力。'))
    return false
  }
  let entity = entityOf(player)
  let stack = entity.getMainHandItem()
  if (stack.isEmpty()) {
    player.tell(Text.gray('请手持原矿方块后再发动粉碎齿轮。'))
    return false
  }

  let itemId = String(BuiltInRegistries.ITEM.getKey(stack.getItem()))
  let recipe = ORE_CRUSH_MAP[itemId]
  if (!recipe) {
    player.tell(Text.gray('粉碎齿轮只能嚼碎原矿方块。'))
    return false
  }

  stack.shrink(1)
  consumeTorque(player, 8)
  player.give(Item.of(recipe.output, recipe.count))
  player.give(Item.of('minecraft:gravel', 2))
  tauntNearby(player, 12)
  player.tell(Text.of(`粉碎齿轮产出了 ${recipe.count} 个 ${recipe.output}，同时喷出一堆碎石。`))
  return true
})

PlayerEvents.tick(event => {
  let player = event.player
  let entity = entityOf(player)

  let hasHeart = getPoint(player, 'counter', POINT.torqueCapacity) > 0
  if (!hasHeart) {
    setCounter(player, POINT.torque, 0)
    setCounter(player, POINT.inertia, 0)
    setCounter(player, POINT.chainsawActive, 0)
    setCounter(player, POINT.proximityAttack, 0)
    return
  }

  clampCurrentResources(player)
})
})()
