;(function () {

let CREATET2_ORGAN_IDS = [
  "kubejs:brass_pressure_ventricle",
  "kubejs:weighted_flywheel_sac",
  "kubejs:brass_clutch_spine",
  "kubejs:tempo_calibration_cochlea",
  "kubejs:overpressure_forge_lung",
  "kubejs:lubrication_reflux_gland",
  "kubejs:pressure_balance_brass_membrane",
  "kubejs:brass_pile_driver",
  "kubejs:ratchet_breach_shoulder",
  "kubejs:spiral_tunnel_drill"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', CREATET2_ORGAN_IDS)
})
})()
