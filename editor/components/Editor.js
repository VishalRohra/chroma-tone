'use strict';

var _ = require('lodash');
var React = require('react/addons');
var Combokeys = require('combokeys');
var CSSTransitionGroup = React.addons.CSSTransitionGroup; // TODO: don't use this
var mui = require('material-ui');
var ThemeManager = new mui.Styles.ThemeManager();

var {Paper, Styles: { Colors: { blue500, red500, lightGreen500 }}} = mui;
var IconButton = require('./IconButton');
var { getButtons, getButtonGroups } = require('../buttons');
var DrawingSurface = require('./DrawingSurface');

require('../styles/Editor.less');

function setTheme() {
  let palette = ThemeManager.getCurrentTheme().palette;
  palette.primary1Color = blue500;
  palette.primary2Color = red500;
  palette.primary3Color = lightGreen500;
  ThemeManager.setPalette(palette);
}

var Editor = React.createClass({

  getInitialState() {
    return {
      debugButtons: false,
      combokeys: new Combokeys(document)
    };
  },

  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },

  componentWillMount() {
    setTheme();
  },

  componentWillUnmount() {
    this.state.combokeys.detach();
  },

  getStyles() {
    var styles = {
      floatCircle: { padding: '0px', width: 42, height: 42 },
      smallIcon: { padding: '6px', width: 36, height: 36, margin: '3px' },
      defaultIcon: { padding: '9px', width: 42, height: 42, margin: '3px' }
    };

    return styles;
  },

  getTimeline() {
    return {
      render: (i) =>
      <div key={i} className='timeline'>
        <input type='range' min={0} max={100} defaultValue={0} style={{width: '100%'}} />
      </div>
    };
  },

  getButtonGroups() {
    let b = getButtons();

    var styles = this.getStyles();

    b.toggleTimeControl.iconStyle = {
      transform: `rotate(${this.props.timeControlVisible ? 0 : 180}deg)`
    };

    let bs = getButtonGroups(b);

    let addStyle = style => button => {
      button = _.clone(button);
      button.style = style;
      return button;
    };

    bs.float.left = bs.float.left.map(addStyle(styles.floatCircle));
    bs.float.right = bs.float.right.map(addStyle(styles.floatCircle));
    bs.float.middle = bs.float.middle.map(addStyle(styles.smallIcon));

    _.values(bs.bottom).concat(_.values(bs.timeControl)).forEach(buttonGroup => {
      buttonGroup.forEach(button => {
        button.tooltipPosition = 'top-center';
      });
    });

    bs.timeControl.middle = [this.getTimeline()];

    return bs;
  },

  renderButton({name, icon, tooltip, action, style, ...props}, i) {
    if (props.render) {
      return props.render(i);
    }
    if (this.state.debugButtons) {
      return (
        <button key={i} style={{width: 48, height: 48, padding: 0}} {...props} />
      );
    }
    return (
      <IconButton {...props}
        key={i}
        onTouchTap={ action ? () => this.props.dispatch(action) : null}
        style={style || this.getStyles().defaultIcon}
        combokeys={this.state.combokeys}
        tooltip={this.props.selected.help ? tooltip : null}
        selected={this.props.selected[name]}
        disabled={!action}
      >
        {icon}
      </IconButton>
    );
  },

  renderButtons(buttons) {
    return buttons.map(this.renderButton);
  },

  renderButtonGroups(groups) {
    return ['left', 'middle', 'right'].map( position =>
      <div key={position} className='toolbar-group'>
        { this.renderButtons(groups[position]) }
      </div>
    );
  },

  renderFloatBar(float) {
    let makeFloatCircle = (button, i) => (
      { circle: true, key: i, children: this.renderButton(button) }
    );

    let floatPapersProps = float.left.map(makeFloatCircle)
    .concat([{
      className: 'float-paper-bar',
      children:
        <Toolbar className='float-toolbar'>
          {
            this.renderButtons(float.middle)
          }
        </Toolbar>
    }]).concat(float.right.map(makeFloatCircle));

    return (
      <div className='float-container'>
        {floatPapersProps.map((props, i) =>
          <CSSTransitionGroup key={i} transitionName='float-paper'>
            {
              !this.props.toolbarsVisible ?
                <FloatPaper {...props}>
                  {props.children}
                </FloatPaper>
              : null
            }
          </CSSTransitionGroup>
        )}
      </div>
    );
  },

  renderTopBar(top) {
    return (
      <CSSTransitionGroup transitionName='top'>
        {
          this.props.toolbarsVisible ?
          <PaperBar className='top'>
            <Toolbar className='top'>
              {
                this.renderButtonGroups(top)
              }
            </Toolbar>
          </PaperBar>
          : null
        }
      </CSSTransitionGroup>
    );
  },

  renderBottomBar(bottom, timeControl) {
    timeControl = _.flatten(['left', 'middle', 'right'].map(pos => timeControl[pos]));

    var bottomPaperBarClass = this.props.timeControlVisible ? 'bottom-extended' : 'bottom';

    return (
      <CSSTransitionGroup transitionName={bottomPaperBarClass}>
        {
          this.props.toolbarsVisible ?
          <PaperBar className={bottomPaperBarClass}>
            <Toolbar>
              {
                this.renderButtonGroups(bottom)
              }
            </Toolbar>
            <CSSTransitionGroup
              className='toolbar time-control-toolbar'
              transitionName='time-control-toolbar'
            >
              {
                this.props.timeControlVisible ?
                <div className='toolbar-group time-control'>
                  {
                    this.renderButtons(timeControl)
                  }
                </div>
                : null
              }
            </CSSTransitionGroup>
          </PaperBar>
          : null
        }
      </CSSTransitionGroup>
    );
  },

  render() {
    let {
      float,
      top,
      bottom,
      timeControl
    } = this.getButtonGroups();

    return (
      <DrawingSurface className='LR-Editor' dispatch={this.props.dispatch}>
        { this.renderFloatBar(float) }
        { this.renderTopBar(top) }
        { this.renderBottomBar(bottom, timeControl) }
      </DrawingSurface>
    );
  }
});

function stopPropagation(e) {
  e.preventDefault();
  e.stopPropagation();
}

var Toolbar = React.createClass({
  render() {
    return (
      <div
        className={'toolbar ' + (this.props.className || '')}
        onTouchStart={stopPropagation}
        onMouseDown={stopPropagation}
      >
        {this.props.children}
      </div>
    );
  }
});

var PaperBar = React.createClass({
  render() {
    return (
      <Paper
        className={'paper-bar ' + (this.props.className || '')}
        rounded={false}
        transitionEnabled={false}
        onTouchStart={stopPropagation}
        onMouseDown={stopPropagation}
      >
        {this.props.children}
      </Paper>
    );
  }
});

var FloatPaper = React.createClass({
  render() {
    return (
      <Paper
        className={'float-paper ' + (this.props.className || '')}
        circle={this.props.circle}
        style={{boxShadow: 'null'}}
        transitionEnabled={false}
        onTouchStart={stopPropagation}
        onMouseDown={stopPropagation}
      >
        {this.props.children}
      </Paper>
    );
  }
});

module.exports = Editor;

