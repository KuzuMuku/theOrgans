;(function () {

let CREATE_LEVEL1_ORGANS = [
  'createt1:andesite_alloy_heart',
  'createt1:piston_punch',
  'createt1:power_hammer',
  'createt1:spring_ram',
  'createt1:drive_chainsaw',
  'createt1:stress_pick',
  'createt1:crushing_gears',
  'createt1:micro_waterwheel',
  'createt1:micro_windmill',
  'createt1:torque_driveshaft'
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', CREATE_LEVEL1_ORGANS)
})
})()
