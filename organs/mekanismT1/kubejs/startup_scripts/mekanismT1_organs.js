;(function () {

let MEKANISMT1_ORGAN_IDS = [
  "industrial_energy_core",
  "heat_pump_lung",
  "gas_reflux_sac",
  "high_frequency_phase_cochlea",
  "heat_conductive_boneplate",
  "capacitor_rhythm_gland",
  "distillation_filter_bladder",
  "calibration_lens_eye",
  "heat_blade_arm",
  "magnet_rail_fist",
  "overheat_diffusion_shoulder",
  "cracking_mine_sac",
  "refining_recovery_gland",
  "magnet_rail_leg_bolt",
  "energy_loop_core"
]

let MEKANISMT1_INFRASTRUCTURE_IDS = [
  "basic_energy_wire",
  "heat_exchange_pipe",
  "chemical_gas_pipe",
  "capacitor_bus_bar",
  "mineral_transport_rail"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, MEKANISMT1_ORGAN_IDS)
  Common.registerItems(event, MEKANISMT1_INFRASTRUCTURE_IDS)
})

Common.registerSkills([
  {
    id: 'kubejs:magnet_rail_fist',
    nameKey: 'point.organeffects.skill.kubejs.magnet_rail_fist',
    descKey: 'point.organeffects.skill.kubejs.magnet_rail_fist.desc',
    cooldown: 1600,
    level: 1,
    castEvent: 'magnet_rail_fist_cast'
  },
  {
    id: 'kubejs:cracking_mine_sac',
    nameKey: 'point.organeffects.skill.kubejs.cracking_mine_sac',
    descKey: 'point.organeffects.skill.kubejs.cracking_mine_sac.desc',
    cooldown: 2400,
    level: 1,
    castEvent: 'cracking_mine_sac_cast'
  },
  {
    id: 'kubejs:magnet_rail_leg_bolt',
    nameKey: 'point.organeffects.skill.kubejs.magnet_rail_leg_bolt',
    descKey: 'point.organeffects.skill.kubejs.magnet_rail_leg_bolt.desc',
    cooldown: 100,
    level: 1,
    castEvent: 'magnet_rail_leg_bolt_cast'
  },
  {
    id: 'kubejs:energy_loop_core',
    nameKey: 'point.organeffects.skill.kubejs.energy_loop_core',
    descKey: 'point.organeffects.skill.kubejs.energy_loop_core.desc',
    cooldown: 200,
    level: 1,
    castEvent: 'energy_loop_core_cast'
  }
])

})()
