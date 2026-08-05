;(function () {

let MEKANISMT2_ORGAN_IDS = [
  "kubejs:quantum_shield_core",
  "kubejs:plasma_membrane_lung",
  "kubejs:nano_recharge_nest",
  "kubejs:overload_phase_spine",
  "kubejs:shield_weave_membrane",
  "kubejs:vector_lock_eye",
  "kubejs:nano_repair_mesh",
  "kubejs:prism_compute_brain",
  "kubejs:phase_cut_arm",
  "kubejs:light_spear_tendon",
  "kubejs:deflection_prism_shoulder",
  "kubejs:nano_copy_gland",
  "kubejs:energy_harvest_step_foot",
  "kubejs:zero_loss_sampler_claw"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', MEKANISMT2_ORGAN_IDS)
})
})()
