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
  "zero_loss_sampler_claw"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, MEKANISMT2_ORGAN_IDS)
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
  }
])

})()
