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
  "kubejs:zero_loss_sampler_claw",
  "kubejs:radiation_diffusion_core",
  "kubejs:fission_plasma_chamber",
  "kubejs:plasma_state_wiring",
  "kubejs:radiation_deflection_armor",
  "kubejs:quantum_mecha_protocol",
  "kubejs:quantum_wire",
  "kubejs:phase_coil",
  "kubejs:nano_repair_line",
  "kubejs:lockon_sensor_array",
  "kubejs:fission_fuel_rod",
  "kubejs:radiation_filter"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', MEKANISMT2_ORGAN_IDS)
})

ServerEvents.tags('block', event => {
  event.add('minecraft:mineable/pickaxe', 'kubejs:quantum_sync_cube')
})
})()
