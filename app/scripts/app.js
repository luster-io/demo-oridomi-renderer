/** @jsx React.DOM */

var Physics = require('impulse')
var OriDomi = require('oridomi')
var folded = new OriDomi(document.querySelector('.cover'), { speed: 0, ripple: 0, touchEnabled: false, perspective: 800 })
var lastPercent = 1
folded.accordion(0)

var phys = new Physics(function(x) {
  folded.accordion(Math.acos(x) * (180 / Math.PI))
})

phys.position(1, 0)

var startX
  , width = window.innerWidth
  , interaction
  , mousedown = false

window.addEventListener('contextmenu', function(evt) {
  evt.preventDefault()
})

window.addEventListener('touchstart', start)
window.addEventListener('mousedown', start)

window.addEventListener('touchmove', move)
window.addEventListener('mousemove', move)

window.addEventListener('touchend', end)
window.addEventListener('mouseup', end)

function pageX(evt) {
  return evt.touches && evt.touches[0].pageX || evt.pageX
}

function start(evt) {
  var percent = phys.position().x
  mousedown = true
  interaction = phys.interact()
  interaction.start()

  if(percent <= 0) percent = .1

  startX = pageX(evt) / percent
}

function move(evt) {
  if(!mousedown) return
  evt.preventDefault()
  var delta = pageX(evt)
    , percentMoved = delta / startX

  if(percentMoved > 1) percentMoved = 1
  interaction.position(percentMoved)
}

function end(evt) {
  if(!mousedown) return
  mousedown = false
  evt.preventDefault()
  interaction.end()
  var to = (phys.direction('left')) ? 0 : 1
  phys.accelerate({ bounce: true, acceleration: 3, minBounceDistance: 0, bouceAcceleration: 6, damping: .2 }).to(to).start()
}
