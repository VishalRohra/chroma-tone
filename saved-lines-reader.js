/*
saved lines schema:
[
  {
    label: string,
    version: string,
    startPosition: [x: float, y: float],
    lines: [
      {
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        extension: int (0-3),
        flipped: int (0-1),
        snap1: int,
        snap2: int,
        id: int,
        type: int (0-2)
      },
      ... older lines
    ]
  },
  ...older tracks
]
*/
'use strict';
var fs = require('fs');
var amf = require('amf');
var SOL_OFFSET = 43; // discovered through experimentation, guessing there's padding

var LINE_ATTRIBUTES = [
'x1',
'y1',
'x2',
'y2',
'extension',
'flipped',
'snap1',
'snap2',
'id',
'type'
];

function savedLinesReader(fileName, cb) {
  fs.readFile(fileName, (err, data) => {
    if (err) {
      return cb(err);
    }
    let tracksData = amf.read(data, SOL_OFFSET);
    tracksData = tracksData.map(track => {
      return {
        label: track.label,
        version: track.version,
        startPosition: track.startLine,
        lines: track.data.map(line => {
          let lineObj = {};
          LINE_ATTRIBUTES.forEach((attribute, i) => {
            lineObj[attribute] = line[i];
          });
          return lineObj;
        })
      };
    });
    cb(null, tracksData);
  });
}

module.exports = savedLinesReader;

// print to console
/*
var SAVEDLINES = 'testLines.sol';
savedLinesReader(SAVEDLINES, (e, tracks) => {
  tracks.forEach((track, i) => {
    console.log('====== track', i, '======');
    console.log(track);
  });
});
*/
