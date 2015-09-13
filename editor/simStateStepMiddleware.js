import {playback} from './reducers'
import {INC_FRAME_INDEX, DEC_FRAME_INDEX, SET_FRAME_INDEX, ADD_LINE, REPLACE_LINE, REMOVE_LINE, ADD_BALL, REMOVE_BALL, REPLACE_BALL} from './actions'
import {step, addBall, addWire, removeEntity} from 'core'
import neume from 'neume.js'

// http://mohayonao.github.io/neume.js/examples/mml-piano.html
function piano($, freq, dur, vol, brightness = 1) {
  return $([ 1, 5, 13, 0.5 ].map(function(x, i) {
    return $("sin", { freq: freq * x });
  })).mul(0.75 * vol)
  .$("shaper", { curve: 0.75 })
  .$("lpf", { freq: $("line", { start: brightness * freq * 3, end: brightness * freq * 0.75, dur: brightness * 3.5 }), Q: 6 })
  .$("xline", { start: 0.5, end: 0.01, dur: dur * 5 }).on("end", $.stop);
}
var CONTEXT = new window.AudioContext()

let neu = neume(CONTEXT)

// http://en.wikipedia.org/wiki/MIDI_Tuning_Standard#Frequency_values
function freqToStep(hz) {
  return 69 + 12 * Math.log2(hz / 440);
}
function stepToFreq(step) {
  return 440 * Math.pow(2, (step - 69) / 12);
}

function makeCollisionSounds(collisions) {
  collisions.forEach(({entities: [_, wire], force}) => {
    if (force < 0.2) return // more than gravity
    let length = wire.p.distance(wire.q)
    neu.Synth(($) => piano($, 44000 / length, Math.sqrt(force) / 10, wire.t * (1 - Math.exp(-force))), wire.t).start('now')
  })
}

function refreshSimState(simStates, getState, action) {
  let {index} = playback(getState().playback, action)
  let length = simStates.length
  for (let i = length - 1; i < index; i++) {
    simStates = simStates.concat([step(simStates[i])])
  }
  return {...action, simStates}
}

export default function simStateStep() {
  return ({getState}) => next => action => {
    let {simStatesData: {simStates}} = getState()
    switch (action.type) {
      case ADD_LINE:
        simStates = [addWire(simStates[0], action.line.id, action.line.p, action.line.q, action.line.t)]
        break
      case REPLACE_LINE:
        simStates = [addWire(removeEntity(simStates[0], action.prevLine.id), action.line.id, action.line.p, action.line.q, action.line.t)]
        break
      case REPLACE_BALL:
        simStates = [addBall(removeEntity(simStates[0], action.id), action.id, action.point)]
        break
      case REMOVE_LINE:
        simStates = [removeEntity(simStates[0], action.line.id)]
        break
      case REMOVE_BALL:
        simStates = [removeEntity(simStates[0], action.id)]
        break
      case ADD_BALL:
        simStates = [addBall(simStates[0], action.id, action.point, action.vel)]
        break
    }
    switch (action.type) {
      case SET_FRAME_INDEX:
        action = refreshSimState(simStates, getState, action)
        break
      case ADD_LINE:
      case REPLACE_LINE:
      case REMOVE_LINE:
      case ADD_BALL:
      case REMOVE_BALL:
      case REPLACE_BALL:
      case INC_FRAME_INDEX:
      case DEC_FRAME_INDEX:
        action = refreshSimState(simStates, getState, action)
        let {index} = playback(getState().playback, action)
        makeCollisionSounds(action.simStates[index].collisions)
    }
    let result = next(action)
    return result
  }
}
