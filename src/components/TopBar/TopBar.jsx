/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
import React, {Component} from 'react';
import ConvertDeal from './ConvertToDeal';
import PropTypes from 'prop-types';
// import Avtar from "../../assets/images/avatar2.png";
// import User from "media/user1.jpeg";
// import group from "media/group.jpeg"
import imgUrl from '../../Barriers/imagePath';
import $ from 'jquery';
import oddoAPI from '../../Barriers/oddoAPI';
import url from '../../Barriers/UrlStream';
import URL_DATA from '../../Barriers/URLValues';
import fetchApi from '../../Barriers/fetchApi';
import socketEmit from '../../Barriers/socketEmit';
const imgServerurl = process.env.REACT_APP_IMAGE_SERVER_URL;
const controlerpServerurl = process.env.REACT_APP_CONTROL_ERP_SERVER_IMG;
const CONTROL_ERP_URL = process.env.REACT_APP_CONTROL_ERP_SERVER;
class TopBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openModal: false,
      showTypingMessage: false,
      userName: '',
      confirmed_po: false,
      oppositeuserUserType: 0,
      showCTD: true,
      showCTDButton: false,
      online: [],
      vendorDetailsOpen: false,
      dealNameStatus: '',
      isAdminGroup: true,
      isUserinGroup: true,
    };
    this.userType;
  }

  // ----------------------- Socket Emit -------------------------
  socketConnection = () => {
    this.props.socket.on(socketEmit.REFRESH_GLOBAL_GROUP_MEMBER, (data) => {
      if (data && data.groupName == this.props.channel.groupName) {
        this.removeUsersList(data.groupId);
      }
    });
  }
  // ----------------------- Socket Emit Ends --------------------

  componentDidMount() {
    $('.clickBtnp').click(function() {
      $('.rightcontainer').addClass('rpopup');
    });

    $('.popupclose').click(function() {
      $('.rightcontainer').removeClass('rpopup');
    });
    // this.removeUsersList(this.props.channel.id);
  }

  socketEventCalling = async () => {
    this.allOnlineNotifyGlobal(this.props.socket);
    this.notifyOnlineUser(this.props.socket);
  }

  async componentDidUpdate(prevProps) {
    if (this.props.channel !== null && prevProps.channel !== this.props.channel) {
      await this.setState({oppositeuserUserType: 0, vendorDetailsOpen: false, isAdminGroup: true});
      if (this.props.channel.type == 'quote') {
        await this.dealName();
        await this.removeUsersList(this.props.channel.id);
      } else if (this.props.channel.type == 'onetoone') {
        this.oppositeUserType();
      }
    }
    if (this.props.deviceType === 'MOBILE') {
      if (this.props.socket !== null && prevProps.socket !== this.props.socket) {
        await this.socketEventCalling(); ``;
      }
    }
  }

  // -------------- Socket Function---------
  allOnlineNotifyGlobal(socketData) {
    socketData.on(socketEmit.ALL_ONLINE_NOTIFY_GLOBAL, (data) => {
      if (data) {
        this.setState({
          online: data,
        });
      }
    });
  }


  oppositeUserType = async () => {
    const Data = this.props.channel['groupName'].split('-');
    const index = Data.indexOf(URL_DATA.userId);
    Data.splice(index, 1);
    this.oppositeUserInfo(Data[0]);
  }

  removeUsersList = async (groupId) => {
    const updatedUrl = url.GROUP_DETAILS + '/' + groupId;
    const resp = await fetchApi({method: 'get', param: updatedUrl});
    const val = resp.data.data.adminMembers;
    const indexVal = val.indexOf(URL_DATA.userId);
    if (indexVal < 0) {
      await this.setState({
        isAdminGroup: false,
      });
    }
  }

  oppositeUserInfo = async (Id) => {
    const body = {};
    body['reseller_id'] = Id;
    const response = await oddoAPI({
      method: 'post',
      reqUrl: url.USER_INFO,
      data: body,
    });
    if (response.data.result.status_code == 200) {
      await this.setState({
        oppositeuserUserType: response.data.result.data.user_type,
      });
    }
  }

  notifyOnlineUser(socketData) {
    socketData.on(socketEmit.NOTIFY_ONLINE_USER, (data) => {
      if (data) {
        this.setState({
          online: data,
        });
      }
    });
  }
  // -------- Socket Function End -------

  oppositeUserType = async () => {
    const Data = this.props.channel['groupName'].split('-');
    const index = Data.indexOf(URL_DATA.userId);
    Data.splice(index, 1);
    this.oppositeUserInfo(Data[0]);
  }

  oppositeUserInfo = async (Id) => {
    const body = {};
    body['reseller_id'] = Id;
    const response = await oddoAPI({
      method: 'post',
      reqUrl: url.USER_INFO,
      data: body,
    });
    if (response.data.result.status_code == 200) {
      await this.setState({
        oppositeuserUserType: response.data.result.data.user_type,
      });
    }
  }
  dealName = async () => {
    const body = {};
    body['deal_id'] = await this.props.channel.dealId;
    const response = await oddoAPI({
      method: 'post',
      reqUrl: url.QUOTE_DETAILS,
      data: body,
    });
    if (response.data.result.status_code == 200) {
      await this.setState({
        confirmed_po: response.data.result.data.confirmed_po,
        dealNameStatus: response.data.result.data.stage_id,
      });
    }
  }

  updateNewStateval = async (val) => {
    await this.dealName();
  }


  modalToggle = () => {
    this.setState({
      openModal: !this.state.openModal,
    });
    if (this.props.deviceType === 'MOBILE') this.setState({showCTDButton: !this.state.openModal});
  };

  backToDealInbox = async (val) => {
    if (this.props.deviceType === 'MOBILE') {
      if (this.props.isVendorDetailsOpenState) {
        this.closeVendorDetails();
      } else if (this.props.isuserProfileopenState) {
        this.props.changeprofileComponent(this.state.userProfile ? this.state.userProfile : false );
        this.props.hideChat(true);
      } else {
        this.props.changeComponent(val);
        // this.props.isVendorDetailsOpen(true)
      }
    }
  }
  toggleCTD(val) {
    this.setState({showCTD: val});
  }

  profileComponent(val) {
    if (this.props.channel.type == 'onetoone') {
      this.props.changeprofileComponent(val);
      this.props.hideChat(false);
    }
  }
  quoteprofileComponent(val) {
    this.props.changeQuoteprofileComponent(val);
  }

  async vendorDetailsOpen(val) {
    if (URL_DATA.userType=='app') {
      this.props.isVendorDetailsOpen(true);
      this.props.hideChat(false);
    } else if (URL_DATA.userType=='reseller' || URL_DATA.userType=='vendor') {
      if (!this.state.confirmed_po && this.state.isAdminGroup) {
        await this.setState({vendorDetailsOpen: !val});
      } else {
        this.props.isVendorDetailsOpen(!val);
        this.props.hideChat(val);
      }
    }
  }
  async toggleCTDButton(val) {
    await this.setState({showCTDButton: !val});
  }
  async openVendorDetails(val) {
    this.props.isVendorDetailsOpen(val);
    this.props.hideChat(!val);
    this.vendorDetailsOpen(this.state.vendorDetailsOpen);
  }
  async closeVendorDetails() {
    await this.setState({vendorDetailsOpen: false});
    this.props.isVendorDetailsOpen(this.state.vendorDetailsOpen);
    this.props.hideChat(!this.state.vendorDetailsOpen);
  }
  async openProfile() {
    if (this.props.channel.type == 'onetoone') {
      this.profileComponent(true);
    } else if (this.props.channel.type == 'quote' || this.props.channel.type == 'custom') {
      this.props.isVendorDetailsOpen(true);
      this.props.hideChat(false);
    }
  }

  render() {
    const {openModal} = this.state;
    return (
      <div>
        <div className="top-strip">
          {this.props && this.props.channel && this.props.deviceType === 'MOBILE' &&
            <a className="backLink" onClick={() => this.backToDealInbox(this.props.channel.type)}></a>
          }
          {this.props.deviceType === 'WEB' &&
            <div className="user-img">
              {' '}
              {this.props.channel && this.props.channel.type == 'quote' || this.props.channel.type == 'custom' ? (
                <img src={imgServerurl + imgUrl.GROUP}></img>
              ) : (
                ''
              )}

              {this.props.channel && this.props.channel.type == 'onetoone' ? (
                <img src={controlerpServerurl + this.props.channel.profileImage}></img>
              ) : (
                ''
              )}
            </div>
          }
          <div className="user-text quotePeople" onClick={() => this.openProfile()}>
            {this.props.deviceType === 'WEB' &&
              <>
                {this.props.channel && this.props.channel.type == 'quote' || this.props.channel.type == 'custom' ? (
                  <h3>{this.props.channel.groupName}</h3>
                ) : (
                  ''
                )}
                {this.props.channel && this.props.channel.type == 'onetoone' ? (
                  <strong>{this.props.channel.userName}</strong>
                ) : (
                  ''
                )}
              </>}
            {this.props.deviceType === 'MOBILE' &&
              <>
                {/* onClick={() => { this.profileComponent(true) }} */}
                <div className="user-img" >
                  {' '}
                  {this.props.channel && this.props.channel.type == 'quote' || this.props.channel.type == 'custom'? (
                    <img src={imgServerurl + imgUrl.GROUP}></img>
                  ) : (
                    ''
                  )}

                  {this.props.channel && this.props.channel.type == 'onetoone' ? (
                    <img src={controlerpServerurl + this.props.channel.profileImage}></img>
                  ) : (
                    ''
                  )}
                  {this.props.channel && this.props.channel.type == 'onetoone' && (
                    <span className={`status ${this.state.online && this.state.online.users && Object.keys(this.state.online.users).findIndex((id) => id == this.props.channel.userId) > -1 ? 'online' : 'offline'}`}></span>
                  )}
                </div>
                {this.props.channel && this.props.channel.type == 'onetoone' ? (
                  <div className="mobileUsername">
                    <strong>{this.props.channel.userName}
                      {/* {
                        this.props && this.props.channel && this.props.channel.type == 'onetoone' &&
                        URL_DATA.userType == 'app' && this.state.oppositeuserUserType == 'reseller' &&
                        // <a href="#" className="vednorDetialsIndictor" onClick={() => this.toggleCTDButton(this.state.showCTDButton)}>...</a>
                      } */}
                    </strong>
                    <p>{this.state.online.users && Object.keys(this.state.online.users).findIndex((id) => id == this.props.channel.userId) > -1 && ('Online')}</p>
                  </div>
                ) : (
                  ''
                )}

                {this.props.channel && this.props.channel.type == 'quote' || this.props.channel.type == 'custom' ? (
                  <div className="mobileUsername">
                    <strong>{this.props.channel.groupName}</strong>
                    {this.props.channel.type == 'quote' &&
                    <span className="dealStatus">{this.state.dealNameStatus.name}</span>
                    }
                    {/* <a href="#" className="vednorDetialsIndictor" onClick={() => this.vendorDetailsOpen(this.state.vendorDetailsOpen)} /> */}
                  </div>
                ) : (
                  ''
                )}
              </>
            }
          </div>
          <div className="threeDotClick">
            {this.props.deviceType == 'MOBILE' && this.props && this.props.channel && this.props.channel.type == 'onetoone' &&
              URL_DATA.userType == 'app' && this.state.oppositeuserUserType == 'reseller' && (
              <a href="#" className="vednorDetialsIndictor" onClick={() => this.toggleCTDButton(this.state.showCTDButton)}>...</a>
            )}
            {this.props.channel.type == 'quote' && this.props.deviceType == 'MOBILE' && (
              <a href="#" className="vednorDetialsIndictor" onClick={() => this.vendorDetailsOpen(this.state.vendorDetailsOpen)} />
            )}
          </div>
          { }
          {this.state.showTypingMessage && (
            <div>
              <p>{this.state.id + ' is typing...'}</p>
            </div>
          )}
          {this.props.deviceType === 'WEB' &&
            <>
              {this.props && this.props.channel && this.props.channel.type == 'quote' && URL_DATA.userType == 'reseller' && !this.state.confirmed_po ?
                <a className="gQuote" title="Request for Quote" href={`${CONTROL_ERP_URL}reseller_quote?deal_id=${this.props.channel.dealId}&action=form_view`}> Request for Quote </a> :
                ''}
            </>
          }
          {this.props.deviceType === 'WEB' &&
            <>
              {this.props && this.props.channel && this.props.channel.type == 'onetoone' &&
                URL_DATA.userType == 'app' && this.state.oppositeuserUserType == 'reseller' ?
                <div className="convert-deals">
                  <button
                    type="button"
                    className="convert clickBtnp"
                    id="myBtn"
                    onClick={this.modalToggle}
                  >
                    Convert to Deals
                  </button>
                  {openModal && <ConvertDeal modalAction={this.modalToggle} channel={this.props.channel} onSelectChannel={this.props.onSelectChannel} socket={this.props.socket} updateNewState={this.updateNewStateval} handlerLoader={this.props.handlerLoader} />}
                </div> :
                ''
              }
            </>
          }
        </div>
        {this.props.deviceType === 'MOBILE' &&
          <>
            {
              this.props && this.props.channel && this.props.channel.type == 'onetoone' &&
              URL_DATA.userType == 'app' && this.state.oppositeuserUserType == 'reseller' && this.state.showCTDButton && (
                <div className="convert-deals toolTipMobile">
                  <a
                    href="#"
                    className="toolTiplink"
                    id="myBtn"
                    onClick={this.modalToggle}
                  >
                    Convert to Deals
                  </a>
                  {openModal && <ConvertDeal changeComponent= {this.props.changeComponent} deviceType={this.props.deviceType} modalAction={this.modalToggle} channel={this.props.channel} onSelectChannel={this.props.onSelectChannel} socket={this.props.socket} updateNewState={this.updateNewStateval} handlerLoader={this.props.handlerLoader} />}
                </div>
              )}
          </>
        }
        {this.props.deviceType === 'MOBILE' &&
          <>
            {
              this.state.vendorDetailsOpen && (
                <div className="toolTipMobile">
                  {this.props && this.props.channel && this.props.channel.type == 'quote' && URL_DATA.userType == 'reseller' && !this.state.confirmed_po ?
                    <a className="toolTiplink" title="Request for Quote" href={`${CONTROL_ERP_URL}reseller_quote?deal_id=${this.props.channel.dealId}&action=form_view`}> Request for Quote </a> :
                    ''}
                  {
                    this.state.isAdminGroup && (
                      <a href="#" className="toolTiplink" onClick={() => this.openVendorDetails(this.state.vendorDetailsOpen)}> Add People</a>
                    )
                  }
                  <a href="#" className="toolTiplink" onClick={() => this.vendorDetailsOpen(this.state.vendorDetailsOpen)}> Cancel</a>
                </div>
              )
            }
          </>
        }
      </div>
    );
  }
}


TopBar.propTypes = {
  channel: PropTypes.any,
  socket: PropTypes.any,
  onSelectChannel: PropTypes.any,
  handlerLoader: PropTypes.any,
  changeComponent: PropTypes.any,
  changeprofileComponent: PropTypes.any,
  changeQuoteprofileComponent: PropTypes.any,
  isVendorDetailsOpen: PropTypes.any,
  hideChat: PropTypes.any,
  isVendorDetailsOpenState: PropTypes.any,
  isuserProfileopenState: PropTypes.any,
  deviceType: PropTypes.any,
};

export default TopBar;
