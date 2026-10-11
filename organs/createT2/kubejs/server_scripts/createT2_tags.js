;(function () {

let CREATET2_ORGAN_IDS = [
  "createt2:brass_pressure_ventricle",
  "createt2:weighted_flywheel_sac",
  "createt2:brass_clutch_spine",
  "createt2:tempo_calibration_cochlea",
  "createt2:overpressure_forge_lung",
  "createt2:lubrication_reflux_gland",
  "createt2:pressure_balance_brass_membrane",
  "createt2:brass_pile_driver",
  "createt2:ratchet_breach_shoulder",
  "createt2:spiral_tunnel_drill",
  "createt2:brass_constancy_star_core",
  "createt2:brass_stress_conduit",
  "createt2:brass_coolant_return_pipe",
  "createt2:counterweight_bearing",
  "createt2:brass_clutch_slide",
  "createt2:experience_etched_line"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', CREATET2_ORGAN_IDS)
})
})()
