;(function () {

let MEKANISMT2_ORGAN_IDS = [
  "quantum_shield_core",
  "plasma_membrane_lung",
  "nano_recharge_nest",
  "overload_phase_spine",
  "shield_weave_membrane",
  "vector_lock_eye",
  "nano_repair_mesh",
  "prism_compute_brain",
  "phase_cut_arm",
  "light_spear_tendon",
  "deflection_prism_shoulder",
  "nano_copy_gland",
  "energy_harvest_step_foot",
  "zero_loss_sampler_claw",
  "radiation_diffusion_core",
  "fission_plasma_chamber",
  "plasma_state_wiring",
  "radiation_deflection_armor",
  "quantum_mecha_protocol",
  "quantum_wire",
  "phase_coil",
  "nano_repair_line",
  "lockon_sensor_array",
  "fission_fuel_rod",
  "radiation_filter"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, MEKANISMT2_ORGAN_IDS)
})

StartupEvents.registry('block', event => {
  event.create('quantum_sync_cube')
    .textureAll('minecraft:block/obsidian')
    .hardness(5.0)
    .resistance(6.0)
    .requiresTool()
    .tagBlock('minecraft:mineable/pickaxe')
})

Common.registerSkills([
  {
    id: 'kubejs:phase_cut_arm',
    nameKey: 'point.organeffects.skill.kubejs.phase_cut_arm',
    descKey: 'point.organeffects.skill.kubejs.phase_cut_arm.desc',
    cooldown: 90,
    level: 1,
    castEvent: 'phase_cut_arm_cast'
  },
  {
    id: 'kubejs:light_spear_tendon',
    nameKey: 'point.organeffects.skill.kubejs.light_spear_tendon',
    descKey: 'point.organeffects.skill.kubejs.light_spear_tendon.desc',
    cooldown: 110,
    level: 1,
    castEvent: 'light_spear_tendon_cast'
  },
  {
    id: 'kubejs:nano_copy_gland',
    nameKey: 'point.organeffects.skill.kubejs.nano_copy_gland',
    descKey: 'point.organeffects.skill.kubejs.nano_copy_gland.desc',
    cooldown: 180,
    level: 1,
    castEvent: 'nano_copy_gland_cast'
  },
  {
    id: 'kubejs:fission_plasma_chamber',
    nameKey: 'point.organeffects.skill.kubejs.fission_plasma_chamber',
    descKey: 'point.organeffects.skill.kubejs.fission_plasma_chamber.desc',
    cooldown: 240,
    level: 1,
    castEvent: 'fission_plasma_chamber_cast'
  },
  {
    id: 'kubejs:quantum_mecha_protocol',
    nameKey: 'point.organeffects.skill.kubejs.quantum_mecha_protocol',
    descKey: 'point.organeffects.skill.kubejs.quantum_mecha_protocol.desc',
    cooldown: 300,
    level: 1,
    castEvent: 'quantum_mecha_protocol_cast'
  }
])

})()
