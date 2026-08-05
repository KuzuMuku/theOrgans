// priority: 0

// Visit the wiki for more info - https://kubejs.com/

;(function () {
NetworkEvents.dataReceived("motion",event=>{
  let player = event.getPlayer()
  let x = event.data.getDouble('x')
  let y = event.data.getDouble('y')
  let z = event.data.getDouble('z')
  
  player.setMotion(x,y,z)
})
})()
