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
  "spiral_tunnel_drill",
  "brass_constancy_star_core",
  "brass_stress_conduit",
  "brass_coolant_return_pipe",
  "counterweight_bearing",
  "brass_clutch_slide",
  "experience_etched_line"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, CREATET2_ORGAN_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:brass_pile_driver',
    nameKey: 'point.organeffects.skill.kubejs.brass_pile_driver',
    descKey: 'point.organeffects.skill.kubejs.brass_pile_driver.desc',
    cooldown: 20 * 90,
    level: 1,
    castEvent: 'brass_pile_driver_cast'
  },
  {
    id: 'kubejs:spiral_tunnel_drill',
    nameKey: 'point.organeffects.skill.kubejs.spiral_tunnel_drill',
    descKey: 'point.organeffects.skill.kubejs.spiral_tunnel_drill.desc',
    cooldown: 20 * 120,
    level: 1,
    castEvent: 'spiral_tunnel_drill_cast'
  },
  {
    id: 'kubejs:ratchet_breach_shoulder',
    nameKey: 'point.organeffects.skill.kubejs.ratchet_breach_shoulder',
    descKey: 'point.organeffects.skill.kubejs.ratchet_breach_shoulder.desc',
    cooldown: 20 * 5,
    level: 1,
    castEvent: 'ratchet_breach_shoulder_cast'
  },
  {
    id: 'kubejs:brass_constancy_star_core',
    nameKey: 'point.organeffects.skill.kubejs.brass_constancy_star_core',
    descKey: 'point.organeffects.skill.kubejs.brass_constancy_star_core.desc',
    cooldown: 20 * 15,
    level: 1,
    castEvent: 'brass_constancy_star_core_cast'
  }
])
