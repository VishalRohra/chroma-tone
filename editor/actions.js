'use strict';

import * as tools from './tools';
import bindHotkey from './bindHotkey';
import DrawCancelledException from './DrawCancelledException';
import { setIndexAndRate, startPlayback } from './playback'
import { Track, OldTrack } from 'core'
import { solReader, jsonReader } from 'io'
import 'buffer'

const DEBUG = false;
/**
 * action types
 */

export const RESIZE = 'RESIZE';
export const SET_MOD_KEY = 'SET_MOD_KEY';
export const SHOW_TOOLBARS = 'SHOW_TOOLBARS';
export const HIDE_TOOLBARS = 'HIDE_TOOLBARS';
export const SHOW_SIDEBAR = 'SHOW_SIDEBAR';
export const HIDE_SIDEBAR = 'HIDE_SIDEBAR';
export const SELECT_SIDEBAR_ITEM = 'SELECT_SIDEBAR_ITEM';
export const TOGGLE_TIME_CONTROL = 'TOGGLE_TIME_CONTROL';
export const TOGGLE_BUTTON = 'TOGGLE_BUTTON';
export const SET_TOOL = 'SET_TOOL';
export const SET_HOTKEY = 'SET_HOTKEY';
export const SET_CAM = 'SET_CAM';
export const SET_FRAME_INDEX = 'SET_FRAME_INDEX';
export const SET_FRAME_MAX_INDEX = 'SET_FRAME_MAX_INDEX';
export const SET_FRAME_RATE = 'SET_FRAME_RATE';
export const INC_FRAME_INDEX = 'INC_FRAME_INDEX';
export const DEC_FRAME_INDEX = 'DEC_FRAME_INDEX';
export const SET_PLAYBACK_STATE = 'SET_PLAYBACK_STATE';
export const MOD_PLAYBACK_STATE = 'MOD_PLAYBACK_STATE';
export const SET_FLAG = 'SET_FLAG';
export const ADD_LINE = 'ADD_LINE';
export const REMOVE_LINE = 'REMOVE_LINE';
export const REPLACE_LINE = 'REPLACE_LINE';
export const NEW_TRACK = 'NEW_TRACK';
export const LOAD_TRACK = 'LOAD_TRACK';
export const IMPORT_TRACK = 'IMPORT_TRACK';
export const CANCEL_IMPORT = 'CANCEL_IMPORT';
export const SHOW_FILE_LOADER = 'SHOW_FILE_LOADER';
export const HIDE_FILE_LOADER = 'HIDE_FILE_LOADER';
export const LOAD_FILE = 'LOAD_FILE';
export const LOAD_FILE_SUCCESS = 'LOAD_FILE_SUCCESS';
export const LOAD_FILE_FAIL = 'LOAD_FILE_FAIL';
export const SELECT_COLOR = 'SELECT_COLOR'
export const SHOW_TRACK_SAVER = 'SHOW_TRACK_SAVER'
export const HIDE_TRACK_SAVER = 'HIDE_TRACK_SAVER'
export const SET_TRACK_NAME = 'SET_TRACK_NAME'
export const PUSH_ACTION = 'PUSH_ACTION'
export const UNDO = 'UNDO'
export const REDO = 'REDO'
export const DRAW_STREAM_START = 'DRAW_STREAM_START'
export const DRAW_STREAM_END = 'DRAW_STREAM_END'
export const SELECT_LINE = 'SELECT_LINE'

/**
 * action creators
 */
export function drawStreamStart() {
  return {
    type: DRAW_STREAM_START
  }
}
export function drawStreamEnd() {
  return {
    type: DRAW_STREAM_END
  }
}
export function selectLine(lineID) {
  return {
    type: SELECT_LINE,
    lineID: lineID
  }
}
// display dimensions
export function setWindowSize({ width, height }) {
  return {
    type: RESIZE,
    windowSize: { width, height }
  };
}

export function setModKey(key, pressed) {
  return {
    type: SET_MOD_KEY,
    key: key,
    pressed: pressed
  }
}

// toolbars
export function selectColor(color) {
  return {
    type: SELECT_COLOR,
    color: color
  }
}
export function showToolbars() {
  return {
    type: SHOW_TOOLBARS
  };
}
export function hideToolbars() {
  return {
    type: HIDE_TOOLBARS
  };
}
export function showSidebar() {
  return {
    type: SHOW_SIDEBAR
  };
}
export function hideSidebar() {
  return {
    type: HIDE_SIDEBAR
  };
}
export function showFileLoader() {
  return {
    type: SHOW_FILE_LOADER
  }
}
export function hideFileLoader() {
  return {
    type: HIDE_FILE_LOADER
  }
}

export function toggleTimeControl() {
  return {
    type: TOGGLE_TIME_CONTROL
  };
}
export function toggleButton(name) {
  return {
    type: TOGGLE_BUTTON,
    name: name
  };
}
export function setTool(tool) {
  return {
    type: SET_TOOL,
    tool: tool
  };
}
export function importTrack() {
  return {
    type: IMPORT_TRACK
  }
}
export function cancelImport() {
  return {
    type: CANCEL_IMPORT
  }
}
export function showTrackSaver() {
  return {
    type: SHOW_TRACK_SAVER
  }
}
export function hideTrackSaver() {
  return {
    type: HIDE_TRACK_SAVER
  }
}
export function setTrackName(name) {
  return {
    type: SET_TRACK_NAME,
    name: name
  }
}

/* thunk for side effects: mutating combokeys */
export function setHotkey(combokeys, ripples, name, hotkey) {
  return (dispatch, getState) => {
    let oldHotkey = getState().hotkeys[name];
    if (oldHotkey) {
      combokeys.unbind(oldHotkey, 'keydown');
      combokeys.unbind(oldHotkey, 'keyup');
    }

    dispatch({
      type: SET_HOTKEY,
      name,
      hotkey
    });

    if (hotkey) {
      bindHotkey(combokeys, ripples, name, hotkey, dispatch);
    }
  }
}

export function setCam(cam) {
  return {
    type: SET_CAM,
    cam
  };
}

// playback
export function incFrameIndex() {
  return {
    type: INC_FRAME_INDEX
  };
}
export function decFrameIndex() {
  return {
    type: DEC_FRAME_INDEX
  };
}
export function setFrameIndex(index) {
  return {
    type: SET_FRAME_INDEX,
    index: index
  };
}
export function setFrameMaxIndex(maxIndex) {
  return {
    type: SET_FRAME_MAX_INDEX,
    maxIndex: maxIndex
  };
}

/* thunk for async actions */
export function setFrameRate(rate) {
  return (dispatch, getState) => {
    let prevRate = getState().playback.rate;

    // dispatches are synchronous so rate is immediately set
    dispatch({
      type: SET_FRAME_RATE,
      rate: rate
    });

    if (prevRate === 0 && rate !== 0) {
      startPlayback(dispatch, getState);
    }
  };
}
/* thunk for logic in dispatching more actions (should move to reducer) */
import { playbackCamSelector } from './selectors'
export function setPlaybackState(state) {
  return (dispatch, getState) => {
    setIndexAndRate(state, dispatch, getState);
    // TODO: figure out editing/playback camera logic
    if (state === 'pause') {
      dispatch({
        type: SET_CAM,
        cam: playbackCamSelector(getState())
      })
    }
    dispatch({
      type: SET_PLAYBACK_STATE,
      state: state
    });
  };
}
/* thunk for logic in dispatching more actions (should move to reducer) */
export function modPlaybackState(mod = null) {
  return (dispatch, getState) => {
    let {playback: {state, modState: prevMod}} = getState()
    if (mod) {
      setIndexAndRate(mod, dispatch, getState)
    } else if (prevMod) {
      setIndexAndRate(state, dispatch, getState, true)
    }
    dispatch({
      type: MOD_PLAYBACK_STATE,
      mod: mod
    });
  }
}
export function setFlag() {
  return {
    type: SET_FLAG
  }
}
/* thunk for async actions + getting state*/
export function draw(drawStream, cancellableDrawStream, options = {}) {
  return (dispatch, getState) => {
    dispatch(drawStreamStart())

    let tool;
    if (options.isMiddle) {
      let {modKeys: {mod}} = getState()
      tool = mod ? 'zoom' : 'pan'
    } else if (options.isRight) {
      // not handling right clicks yet
      return;
    } else {
      tool = getState().selectedTool;
    }
    let {
      stream,
      onNext,
      onCancel,
      onEnd
    } = tools[tool](drawStream, dispatch, getState, cancellableDrawStream);

    stream.finally(() =>
      dispatch(drawStreamEnd())
    )
    .subscribe(onNext, (err) => {
      if (err instanceof DrawCancelledException) {
        if (onCancel) {
          onCancel();
        }
      } else {
        throw err;
      }
    }, onEnd);
  };
}

export function deltaPanModZoom(pos, delta) {
  return (dispatch, getState) => {
    tools.deltaPanModZoom(pos, delta, dispatch, getState)
  }
}

export function addLine(line) {
  return {
    type: ADD_LINE,
    line: line
  }
}

export function removeLine(line) {
  return {
    type: REMOVE_LINE,
    line: line
  }
}

export function replaceLine(prevLine, line) {
  return {
    type: REPLACE_LINE,
    prevLine: prevLine,
    line: line
  }
}

export function newTrack(isV61 = false) {
  let track = new (isV61 ? OldTrack : Track)([]);
  return {
    type: NEW_TRACK,
    track: track,
    lineStore: track.lineStore,
    startPosition: track.getStartPosition(),
    label: (new Date()).toString(),
    version: isV61 ? '6.1' : '6.2'
  };
}

export function loadTrack(trackData) {
  let {label, version, startPosition, lines} = trackData
  let track = new ((version === '6.1') ? OldTrack : Track)(lines, startPosition)
  return {
    type: LOAD_TRACK,
    track: track,
    lineStore: track.lineStore,
    startPosition: track.getStartPosition(),
    label: label,
    version: version
  }
}

/* thunk for async actions */
export function loadFile([file]) {
  return (dispatch) => {
    dispatch({
      type: LOAD_FILE
    })
    let reader = new FileReader();
    let fileExtension = file.name.split('.').pop();
    // TODO: clean this up
    switch (fileExtension) {
      case 'sol':
        reader.onload = (upload) => {
          try {
            let tracks = solReader(new Buffer(new Uint8Array(upload.target.result)));
            dispatch({
              type: LOAD_FILE_SUCCESS,
              fileName: file.name,
              tracks: tracks
            })
          } catch (e) {
            dispatch({
              type: LOAD_FILE_FAIL,
              error: e.message
            })
          }
        }
        reader.readAsArrayBuffer(file)
        break
      case 'json':
        reader.onload = (upload) => {
          try {
            let track = jsonReader(upload.target.result);
            dispatch({
              type: LOAD_FILE_SUCCESS,
              fileName: file.name,
              tracks: [track]
            })
          } catch (e) {
            dispatch({
              type: LOAD_FILE_FAIL,
              error: e.message
            })
          }
        }
        reader.readAsText(file)
        break
      default:
        dispatch({
          type: LOAD_FILE_FAIL,
          error: 'Unknown file type'
        })
    }

  }
}

export function selectSidebarItem(selected) {
  return {
    type: SELECT_SIDEBAR_ITEM,
    selected: selected
  }
}

// history
export function pushAction(action) {
  return {
    type: PUSH_ACTION,
    action: action
  }
}
function getInverseAction(action) {
  switch (action.type) {
    case ADD_LINE:
      return removeLine(action.line)
    case REMOVE_LINE:
      return addLine(action.line)
    case REPLACE_LINE:
      return replaceLine(action.line, action.prevLine)
  }
}
/* thunk for conditional action + getting state */
export function undo() {
  return (dispatch, getState) => {
    dispatch(drawStreamEnd())
    let {history: {undoStack}} = getState()
    if (undoStack.size > 0) {
      dispatch(getInverseAction(undoStack.peek()))
    }
    dispatch({
      type: UNDO
    })
  }
}
/* thunk for conditional action + getting state */
export function redo() {
  return (dispatch, getState) => {
    dispatch(drawStreamEnd())
    let {history: {redoStack}} = getState()
    if (redoStack.size > 0) {
      dispatch(redoStack.peek())
    }
    dispatch({
      type: REDO
    })
  }
}
