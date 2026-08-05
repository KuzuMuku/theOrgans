;(function () {

let CREATE_LEVEL1_ORGANS = [
  'andesite_alloy_heart',
  'piston_punch',
  'power_hammer',
  'spring_ram',
  'drive_chainsaw',
  'stress_pick',
  'crushing_gears',
  'micro_waterwheel',
  'micro_windmill',
  'torque_driveshaft'
]

let CREATE_LEVEL1_SKILL_COOLDOWNS = {
  piston_punch: 20 * 4,
  spring_ram: 20 * 5,
  drive_chainsaw: 20 * 3,
  stress_pick: 20 * 8,
  crushing_gears: 20 * 6
}

StartupEvents.registry('item', event => {
  Common.registerItems(event, CREATE_LEVEL1_ORGANS)
})

Common.registerSkills([
  {
    id: 'kubejs:piston_punch',
    nameKey: 'point.organeffects.skill.kubejs.piston_punch',
    descKey: 'point.organeffects.skill.kubejs.piston_punch.desc',
    cooldown: CREATE_LEVEL1_SKILL_COOLDOWNS.piston_punch,
    level: 1,
    castEvent: 'piston_punch_cast'
  },
  {
    id: 'kubejs:spring_ram',
    nameKey: 'point.organeffects.skill.kubejs.spring_ram',
    descKey: 'point.organeffects.skill.kubejs.spring_ram.desc',
    cooldown: CREATE_LEVEL1_SKILL_COOLDOWNS.spring_ram,
    level: 1,
    castEvent: 'spring_ram_cast'
  },
  {
    id: 'kubejs:drive_chainsaw',
    nameKey: 'point.organeffects.skill.kubejs.drive_chainsaw',
    descKey: 'point.organeffects.skill.kubejs.drive_chainsaw.desc',
    cooldown: CREATE_LEVEL1_SKILL_COOLDOWNS.drive_chainsaw,
    level: 1,
    castEvent: 'drive_chainsaw_cast'
  },
  {
    id: 'kubejs:stress_pick',
    nameKey: 'point.organeffects.skill.kubejs.stress_pick',
    descKey: 'point.organeffects.skill.kubejs.stress_pick.desc',
    cooldown: CREATE_LEVEL1_SKILL_COOLDOWNS.stress_pick,
    level: 1,
    castEvent: 'stress_pick_cast'
  },
  {
    id: 'kubejs:crushing_gears',
    nameKey: 'point.organeffects.skill.kubejs.crushing_gears',
    descKey: 'point.organeffects.skill.kubejs.crushing_gears.desc',
    cooldown: CREATE_LEVEL1_SKILL_COOLDOWNS.crushing_gears,
    level: 1,
    castEvent: 'crushing_gears_cast'
  }
])
})()
