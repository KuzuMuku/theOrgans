let CREATET2_ORGAN_IDS = [
  "brass_pressure_ventricle",
  "weighted_flywheel_sac",
  "brass_clutch_spine",
  "tempo_calibration_cochlea",
  "overpressure_forge_lung",
  "lubrication_reflux_gland",
  "pressure_balance_brass_membrane",
  "brass_pile_driver",
  "ratchet_breach_shoulder",
  "spiral_tunnel_drill"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, CREATET2_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:brass_pile_driver',
    nameKey: 'point.organeffects.skill.kubejs.brass_pile_driver',
    descKey: 'point.organeffects.skill.kubejs.brass_pile_driver.desc',
    cooldown: 100,
    level: 1,
    castEvent: 'brass_pile_driver_cast'
  },
  {
    id: 'kubejs:spiral_tunnel_drill',
    nameKey: 'point.organeffects.skill.kubejs.spiral_tunnel_drill',
    descKey: 'point.organeffects.skill.kubejs.spiral_tunnel_drill.desc',
    cooldown: 140,
    level: 1,
    castEvent: 'spiral_tunnel_drill_cast'
  }
])

