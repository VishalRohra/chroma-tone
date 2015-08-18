import classNames from 'classnames';
import React from 'react'
import { LeftNav, List, ListItem, ListDivider, RaisedButton } from 'material-ui'
import ImportIcon from 'icons/import';
import LoadFromFileIcon from 'icons/folder-upload';
import { selectSidebarItem, loadTrack, setCam } from '../actions';

class SideBarContents extends React.Component {
  render() {
    let {toolbarsVisible, timeControlVisible} = this.props;
    return (
      <List subheader=' ' style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div className={classNames('sidebar-spacer', {open: toolbarsVisible})} />
        { this.props.header }
        <ListDivider style={{marginTop: 0, flexShrink: 0}} />
        <List style={{overflow: 'scroll', flexGrow: 1}}>
          { this.props.children }
        </List>
        <ListDivider style={{marginTop: 0, flexShrink: 0}} />
        { this.props.footer }
        <div className={classNames('sidebar-spacer', {open: toolbarsVisible})} />
        <div className={classNames('sidebar-spacer', {open: toolbarsVisible && timeControlVisible})} />
      </List>
    )
  }
}

export default class SideBar extends React.Component {

  static get contextTypes() {
    return {
      muiTheme: React.PropTypes.object
    }
  }

  constructor() {
    super()
    this.state = {docked: false}
  }

  componentWillMount() {
    this.setState({docked: this.props.open});
  }

  componentDidMount() {
    this.setState({docked: true});
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.open && !nextProps.open) {
      this.nav.close();
    }
    if (!this.props.open && nextProps.open) {
      this.nav.open();
    }
  }

  handleSelect(i) {
    if (i === this.props.selected) {
      return;
    }
    let { tracks, dispatch } = this.props;
    dispatch(selectSidebarItem(i));
    dispatch(loadTrack(tracks[i]));
    let [x, y] = tracks[i].startPosition;
    // todo: do the bounding box thing
    dispatch(setCam({x, y, z: 1}))
  }

  render() {
    let {
      menuItem: {selectedTextColor},
      raisedButton: {primaryTextColor}
    } = this.context.muiTheme.component;

    return (
      <LeftNav
        docked={this.state.docked}
        ref={component => { this.nav = component}}
        style={{zIndex: 'auto'}}
        disableSwipeToOpen={true}
        selectedIndex={2}
        header={
          <SideBarContents
            toolbarsVisible={this.props.toolbarsVisible}
            timeControlVisible={this.props.timeControlVisible}
            header={
              <ListItem
                rightIcon={<LoadFromFileIcon/>}
                disabled={true}
                primaryText={this.props.fileName}
                secondaryText={'Select a track to import'}
              />
            }
            footer={
              <div className='track-importer-footer'>
                <RaisedButton label='cancel' />
                <RaisedButton primary={true} label='Import' disabled={this.props.selected < 0}>
                  <ImportIcon style={{position: 'relative', top: 6, right: 7}} color={primaryTextColor}/>
                </RaisedButton>
              </div>
            }
          >
            {this.props.tracks ? (
              this.props.tracks.length < 1 ?
                <ListItem key={0} primaryText='This file has no tracks!' disabled={true} />
              : this.props.tracks.map( ({label, version, lines}, i) =>
                <ListItem key={i}
                  style={i === this.props.selected ? {color: selectedTextColor} : null}
                  primaryText={label}
                  secondaryText={`${lines.length} line${lines.length > 1 ? 's' : ''}`}
                  rightIcon={<div>{version}</div>}
                  onTouchTap={() => this.handleSelect(i)}
                />
              )
            ) :
              <ListItem key={0} primaryText='No file loaded!' disabled={true} />
            }
          </SideBarContents>
        }
        menuItems={[]}
      />
    )
  }

}
