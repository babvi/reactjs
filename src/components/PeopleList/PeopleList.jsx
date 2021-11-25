/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
import React, {Component, Fragment} from 'react';
import People from './People';
import DealInbox from './DealInbox';
import DefaultPeople from './defaultPeople';
import Search from '../Search/Search';
import PropTypes from 'prop-types';
import fetchApi from '../../Barriers/fetchApi';
import url from '../../Barriers/UrlStream';
import socketEmit from '../../Barriers/socketEmit';
import URL_DATA from '../../Barriers/URLValues';
import $ from 'jquery';
import GeneralChat from './GeneralChat';

class PeopleList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      peopleValue: '',
      groupValue: '',
      customValue: '',
      online: [],
      isTypping: false,
      userTyping: [],
      unreadCount: [],
      stopTyping: [],
      companyResellerId: '',
      additionalSearch: false,
      notSearchgroup: false,
      searchValue: '',
      iconClicked: 0,
      prevSearchValue: '',
      countryCheck: false,
      departmentCheck: false,
      appCheck: false,
      resellerCheck: false,
      vendorCheck: false,
      refreshdeal: false,
      newOnetoone: '',
      isValueSearchedValue: 0,
      // currentTab: "quote",
      isShow: false,
      mobileSearchIcon: false,
      mobileSearchText: '',
      chatOpen: 'quote',
    };
    this.serachobj = {};
    this.filterobj = {};
  }


  // ------------------Socket ON Function Definition Start--------------------
  allOnlineNotifyGlobal(socketData) {
    socketData.on(socketEmit.ALL_ONLINE_NOTIFY_GLOBAL, (data) => {
      if (data) {
        this.setState({
          online: data,
        });
      }
    });
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

  notifyTypingGlobal(socketData) {
    socketData.on(socketEmit.NOTIFY_TYPING_GLOBAL, (data) => {
      if (data) {
        this.setState({
          isTypping: true,
          userTyping: data,
        });
      }
    });
  }


  notifyStopTypingGlobal(socketData) {
    socketData.on(socketEmit.NOTIFY_STOP_TYPING_GLOBAL, (data) => {
      if (data) {
        setTimeout(() => {
          this.setState({
            isTypping: false,
            stopTyping: data,
          });
        }, 3000);
      }
    });
  }


  notifyUnreadGlobal(prop) {
    prop.on(socketEmit.NOTIFY_UNREAD_GLOBAL, (data) => {
      if (data) {
        if (data.length != 0) {
          this.setState({
            unreadCount: data,
          });
        }
      }
    });
  }


  onetooneChat(prop) {
    prop.on(socketEmit.RECEIVED, (data) => {
      if (data) {
        this.setState({
          newOnetoone: data,
        });
      }
    });
  }

  // ------------------Socket on End --------------------

  // ------------------Socket Event Starts --------------

  socketEventCalling = async () => {
    this.allOnlineNotifyGlobal(this.props.socket);
    this.notifyOnlineUser(this.props.socket);
    this.notifyTypingGlobal(this.props.socket);
    this.notifyStopTypingGlobal(this.props.socket);
    this.notifyUnreadGlobal(this.props.socket);
    this.onetooneChat(this.props.socket);
  }


  componentDidMount() {
    let data = URL_DATA.userId;
    data = URL_DATA;
    if (data && data.companyResellerId) {
      this.setState({
        companyResellerId: String(data.companyResellerId),
      });
    }
  }

  async componentDidUpdate(prevProps) {
    if (this.props.socket !== null && prevProps.socket !== this.props.socket) {
      await this.socketEventCalling();
    }
    this.getDynamicHeight();
  }

  componentWillUnmount() {
    this.setState({
      online: [],
      isTypping: false,
      userTyping: [],
      unreadCount: [],
    });
  }

  getDynamicHeight() {
    if (this.props.deviceType === 'MOBILE') {
      if (this.state.mobileSearchIcon) {
        if (URL_DATA.userType == 'reseller' || URL_DATA.userType == 'vendor') {
          const topHeight = $('.o_header_standard').height() ? $('.o_header_standard').height() : 0;
          const windowHeight = $(window).innerHeight();
          const divHeight = $('.mobileTopheader').height();
          const finalHeight = windowHeight - (divHeight + 57 + topHeight);
          $('.customScroll').height(finalHeight);
          $('.left-col .deal-inbox').css('margin-top', '167px');
        }
        if (URL_DATA.userType == 'app') {
          const topHeight = $('.o_header_standard').height() ? $('.o_header_standard').height() : 0;
          const windowHeight = $(window).innerHeight();
          const divHeight = $('.mobileTopheader').height();
          // let finalHeight = windowHeight - (divHeight + 150 + topHeight);
          let finalHeight = windowHeight - (divHeight + 50 + topHeight);
          URL_DATA.baseMenu=='horizontal' ?finalHeight = finalHeight-28:finalHeight;
          // URL_DATA.baseMenu=="vertical" ? finalHeight=finalHeight+15:finalHeight=finalHeight;
          $('.customScroll').height(finalHeight);
          $('.left-col .deal-inbox').css('margin-top', '167px');
        }
      } else {
        if (URL_DATA.userType == 'reseller' || URL_DATA.userType == 'vendor') {
          $('.customScroll').css('margin-top', '112px');
          const topHeight = $('.o_header_standard').height() ? $('.o_header_standard').height() : 0;
          const windowHeight = $(window).innerHeight();
          const divHeight = $('.mobileTopheader').height();
          const finalHeight = windowHeight - (divHeight + 57 + topHeight);
          $('.customScroll').height(finalHeight);
        } else if (URL_DATA.userType == 'app') {
          $('.customScroll').css('margin-top', '98px');
          const topHeight = $('.o_header_standard').height() ? $('.o_header_standard').height() : 0;
          const windowHeight = $(window).innerHeight();
          const divHeight = $('.mobileTopheader').height();
          // let finalHeight = windowHeight - (divHeight + 100 + topHeight);
          const finalHeight = windowHeight - (divHeight + 28 + topHeight);
          // URL_DATA.baseMenu=="horizontal" ? $(".customScroll").height(finalHeight-45):
          // URL_DATA.baseMenu=="vertical" ? finalHeight=finalHeight+20:finalHeight=finalHeight;
          $('.customScroll').height(finalHeight);
        }
      }
    }
  }

  // ----------------- Socket Event Ends ---------------------

  // ------------------Searching Statrs ---------------------

  async searchUsersGroup(val) {
    await this.setState({iconClicked: this.state.iconClicked + 1, additionalSearch: false});
    if (Object.keys(this.serachobj).length == 0) {
      const people = await this.peopleSearch(val);
      await this.setState({
        peopleValue: people,
      });
      const group = await this.groupSearch(val);
      await this.setState({
        groupValue: group,
      });
      if (URL_DATA.userType == 'app') {
        const custom = await this.customSearch(val);
        await this.setState({
          customValue: custom,
        });
      }
    }
  }

  handleEnter = async (e) => {
    if (e.charCode == '13') {
      this.handleBlankGroupPeopleDefault(e);
      await this.setState({additionalSearch: false});
    }
  }

  hideAdvanceSearch = async (e) => {
    await this.setState({additionalSearch: false});
  }


  handleBlankGroupPeopleDefault = async (e) => {
    await this.setState({
      [e.target.name]: e.target.value,
    });
    if (this.state.searchValue.length == 0) {
      await this.setState({
        notSearchgroup: false, additionalSearch: false, searchValue: '', countryCheck: false, departmentCheck: false,
        appCheck: false, resellerCheck: false, vendorCheck: false, refreshdeal: true,
      });
      this.serachobj = {}; this.filterobj = {};
      await this.searchUsersGroup(this.state.searchValue);
    }
    await this.setState({iconClicked: this.state.iconClicked + 1});
    if (Object.keys(this.serachobj).length == 0) {
      if (this.state.searchValue.length > 1 || e.charCode == '13') {
        await this.searchUsersGroup(this.state.searchValue);
      }
    }
  }

  async peopleSearch(val) {
    const body = {};
      this.props.deviceType=='WEB' ? this.state.searchValue.length ? body['userName'] = this.state.searchValue : delete body['userName']:'';
      this.props.deviceType=='MOBILE' ? this.state.mobileSearchText.length ? body['userName'] = this.state.mobileSearchText : delete body['userName']:'';
      body['userId'] = URL_DATA.userId,
      body['companyResellerId'] = this.state.companyResellerId;
      body['page'] = 0;
      const Peopleresponse = await fetchApi({
        method: 'post',
        reqUrl: url.USER_LIST,
        data: body,
      });
      return Peopleresponse.data.data.data;
  }

  async groupSearch(val) {
    const body = {};
    this.state.searchValue.length ? body['groupName'] = this.state.searchValue : delete body['groupName'],
      this.state.mobileSearchText.length ? body['groupName'] = this.state.mobileSearchText : delete body['userName'],
    body['userId'] = URL_DATA.userId,
    body['companyResellerId'] = this.state.companyResellerId;
    body['page'] = 0;
    body['type'] = 'quote';
    const gruopresponse = await fetchApi({
      method: 'post',
      reqUrl: url.LOAD_CHANNEL_LIST,
      data: body,
    });
    return gruopresponse.data.data.data;
  }

  async customSearch(val) {
    const body = {};
    this.state.searchValue.length ? body['groupName'] = this.state.searchValue : delete body['groupName'],
      this.state.mobileSearchText.length ? body['groupName'] = this.state.mobileSearchText : delete body['userName'],
    body['userId'] = URL_DATA.userId,
    body['companyResellerId'] = this.state.companyResellerId;
    body['page'] = 0;
    body['type'] = 'custom';
    const gruopresponse = await fetchApi({
      method: 'post',
      reqUrl: url.LOAD_CHANNEL_LIST,
      data: body,
    });
    return gruopresponse.data.data.data;
  }
  // -----------------Searching Ends----------------------

  // --------- Adiitonal Search & Filter Feature Start -----

  additionalSearchfeture = async () => {
    if (this.state.additionalSearch) this.setState({additionalSearch: false});
    else this.setState({additionalSearch: true});
  }

  handleSerach = async (val) => {
    this.serachobj = {};
    await this.setState({notSearchgroup: false});
    if (val == 'country') {
      if (this.state.countryCheck) this.setState({countryCheck: false});
      else {
        this.setState({countryCheck: true}); this.serachobj[val] = await val;
      }
      await this.setState({
        notSearchgroup: true,
        departmentCheck: false,
      });
    } else if (val == 'department') {
      if (this.state.departmentCheck) this.setState({departmentCheck: false});
      else {
        this.setState({departmentCheck: true}); ; this.serachobj[val] = await val;
      }
      await this.setState({
        notSearchgroup: true,
        countryCheck: false,
      });
    }

    if (this.state.countryCheck == false && this.state.departmentCheck == false && this.state.appCheck == false && this.state.resellerCheck == false && this.state.vendorCheck ==false) {
      await this.setState({notSearchgroup: false, additionalSearch: false, searchValue: '', refreshdeal: true});
      this.serachobj = {}; this.filterobj = {};
    }
  }


  handlefilter = async (val) => {
    this.filterobj = {};
    await this.setState({notSearchgroup: false});
    if (val == 'app') {
      if (this.state.appCheck) this.setState({appCheck: false});
      else {
        this.setState({appCheck: true}); this.filterobj[val] = await val;
      }
      await this.setState({
        notSearchgroup: true,
        resellerCheck: false,
        vendorCheck: false,
      });
    } else if (val == 'reseller') {
      if (this.state.resellerCheck) this.setState({resellerCheck: false});
      else {
        this.setState({resellerCheck: true}); ; this.filterobj[val] = await val;
      }
      await this.setState({
        notSearchgroup: true, appCheck: false, vendorCheck: false,
      });
    } else if (val == 'vendor') {
      if (this.state.vendorCheck) this.setState({vendorCheck: false});
      else {
        this.setState({vendorCheck: true}); ; this.filterobj[val] = await val;
      }
      await this.setState({
        notSearchgroup: true, appCheck: false, resellerCheck: false,
      });
    }
    if (this.state.countryCheck == false && this.state.departmentCheck == false && this.state.appCheck == false && this.state.resellerCheck == false && this.state.vendorCheck == false) {
      await this.setState({notSearchgroup: false, additionalSearch: false, searchValue: '', refreshdeal: true});
      this.serachobj = {}; this.filterobj = {};
    }
  }

  updateNewStateval = async (val) => {
    await this.setState({
      notSearchgroup: false, additionalSearch: false, searchValue: '', refreshdeal: true,
      countryCheck: false, departmentCheck: false, appCheck: false, resellerCheck: false, vendorCheck: false,
    });
    this.serachobj = {}; this.filterobj = {};
  }


  handleComponentToggle = async (val) => {
    this.props.changeComponent(val);
    // await this.setState({ currentTab: val })
  }

  async togglecDefaultPeople(val) {
    await this.setState({
      isShow: !val,
    });
    this.props.changeComponent('defaultPeople');
  }

  async togglecDefaultPeople(val) {
    await this.setState({
      isShow: !val,
    });
    this.props.changeComponent('defaultPeople');
  }
  setisShow = async (val) => {
    await this.setState({
      isShow: val,
    });
  }
  searchMobile = async () => {
    await this.setState({
      mobileSearchIcon: !this.state.mobileSearchIcon,
      mobileSearchText: '',
      isValueSearchedValue: 0,
    });
    if (this.state.mobileSearchIcon) {
      const topHeight = $('.o_header_standard').height() ? $('.o_header_standard').height() : 0;
      const windowHeight = $(window).innerHeight();
      const divHeight = $('.mobileTopheader').height();
      let finalHeight;
      if (URL_DATA.userType=='reseller' || URL_DATA.userType == 'vendor') {
        finalHeight = windowHeight - (divHeight + 57 + topHeight);
      }
      // if(URL_DATA.userType=="app"){
      //   finalHeight = windowHeight - (divHeight + 98 + topHeight);
      // }
      // URL_DATA.baseMenu=="horizontal" ? $(".customScroll").height(finalHeight+10):
      URL_DATA.baseMenu=='horizontal' ? finalHeight= finalHeight-28: finalHeight=finalHeight;
      // URL_DATA.baseMenu=="vertical" ? finalHeight=finalHeight-28:finalHeight=finalHeight;
      $('.customScroll').height(finalHeight);
      $('.left-col .deal-inbox').css('margin-top', '167px');
    }
  }
  searchMobileGroupDeal = async () => {
    await this.setState({
      isValueSearchedValue: this.state.isValueSearchedValue + 1,
    });
    if (this.state.mobileSearchText.length == 0) {
      await this.setState({
        isValueSearchedValue: 0,
      });
    }
  }

  mobilePeopleDealSearch = async (e) => {
    await this.setState({
      [e.target.name]: e.target.value,
    });
    if (this.state.mobileSearchText.length == 0 || this.state.mobileSearchText.length >1 ) {
      this.searchMobileGroupDeal();
    }
  }

  accordianOpen = async (val) => {
    if (val == 'quote') this.setState({chatOpen: val});
    else if (val == 'people') this.setState({chatOpen: val});
    else if (val == 'custom') this.setState({chatOpen: val});
    else this.setState({chatOpen: ''});
  }

  render() {
    const {
      searchValue,
    } = this.state;
    return (
      <div className="left-col">
        <div className="searchbar">
          <div className="select-dropdown">
            <div className="formGroup">
              <input type="text" id="searchUsersGroup" placeholder="Search" name="searchValue" value={searchValue} onClick={this.hideAdvanceSearch}
                onChange={this.handleBlankGroupPeopleDefault} onKeyPress={this.handleEnter} />
              <button type="submit" className="submitbtn"
                onClick={() => this.searchUsersGroup(document.getElementById('searchUsersGroup').value)}>
              </button>
              <span className="arrowSelect" onClick={() => this.additionalSearchfeture()}></span></div>
            {this.state.additionalSearch ?
              <ul className="searcdropdownList" id="searcdropdown">
                <li className="title">
                  Search By
                </li>
                <li onClick={() => {
                  this.handleSerach('country');
                }}>
                  <a className="checkbox">
                    <input type="checkbox" value="country" id="country" checked={this.state.countryCheck} />
                    <label>Country</label>
                  </a>
                </li>
                <li onClick={() => {
                  this.handleSerach('department');
                }}>
                  <a className="checkbox">
                    <input type="checkbox" value="department" id="department" checked={this.state.departmentCheck} />
                    <label>Department</label>
                  </a>
                </li>

                <li className="title">
                  Filter By
                </li>
                <li onClick={() => {
                  this.handlefilter('app');
                }}>
                  <a className="checkbox">
                    <input type="checkbox" value="app" id="app" checked={this.state.appCheck} />
                    <label>app</label>
                  </a>
                </li>
                {
                  URL_DATA.userType != 'vendor' &&
                  <li onClick={() => {
                    this.handlefilter('reseller');
                  }}>
                    <a className="checkbox">
                      <input type="checkbox" value="reseller" id="reseller" checked={this.state.resellerCheck} />
                      <label>Reseller</label>
                    </a>
                  </li>
                }
                {
                  URL_DATA.userType != 'reseller' &&
                  <li onClick={() => {
                    this.handlefilter('vendor');
                  }}>
                    <a className="checkbox">
                      <input type="checkbox" value="vendor" id="vendor" checked={this.state.vendorCheck} />
                      <label>Vendor</label>
                    </a>
                  </li>
                }
              </ul> : ''}
          </div>
        </div>
        {
          this.props.deviceType === 'WEB' &&
          <div className="people-list">
            {/* <h4>All People and Rooms</h4> */}
            <DealInbox accordianOpen={this.accordianOpen} chatOpen={this.state.chatOpen} deviceType={this.props.deviceType} onSelectChannel={this.props.onSelectChannel} channel={this.props.channel}
              handlerLoader={this.props.handlerLoader}
              groupChannel={this.props.channel} socket={this.props.socket} group={this.state.groupValue}
              isTypping={this.state.isTypping} userTyping={this.state.userTyping}
              unreadCount={this.state.unreadCount} notSearchgroup={this.state.notSearchgroup}
              refreshdeals={this.state.refreshdeal} newOnetoOne={this.state.newOnetoone} />
            <People accordianOpen={this.accordianOpen} chatOpen={this.state.chatOpen} deviceType={this.props.deviceType} onSelectChannel={this.props.onSelectChannel} channel={this.props.channel}
              socket={this.props.socket} handlerLoader={this.props.handlerLoader} people={this.state.peopleValue} online={this.state.online}
              isTypping={this.state.isTypping} userTyping={this.state.userTyping} unreadCount={this.state.unreadCount}
              notSearchgroup={this.state.notSearchgroup} serachobj={this.serachobj} searchValue={this.state.searchValue}
              iconClicked={this.state.iconClicked} filterObj={this.filterobj} updateNewState={this.updateNewStateval} stopTyping={this.state.stopTyping}
              newOnetoOne={this.state.newOnetoone} />
            {
              URL_DATA.userType=='app' &&
              <GeneralChat accordianOpen={this.accordianOpen} chatOpen={this.state.chatOpen} deviceType={this.props.deviceType} onSelectChannel={this.props.onSelectChannel} channel={this.props.channel}
                socket={this.props.socket} handlerLoader={this.props.handlerLoader} custom={this.state.customValue} online={this.state.online}
                isTypping={this.state.isTypping} userTyping={this.state.userTyping} unreadCount={this.state.unreadCount}
                notSearchgroup={this.state.notSearchgroup} serachobj={this.serachobj} searchValue={this.state.searchValue}
                iconClicked={this.state.iconClicked} filterObj={this.filterobj} updateNewState={this.updateNewStateval} stopTyping={this.state.stopTyping}
                newOnetoOne={this.state.newOnetoone} />
            }
          </div>
        }
        {this.props.deviceType === 'MOBILE' &&
          <div className="mobileTabing">
            <div className="mobileTopheader">
              {/* <i className="fa fa-search"></i> */}
              <div className="mobileHead">
                <h2 className="left-align">Messages</h2>
                {
                  !this.state.isShow && !this.props.mobileViewToggle == '' && (
                    <>
                      <a href="#" className="plusiconMobile right-align default_People_list" onClick={() => {
                        this.togglecDefaultPeople(this.state.isShow);
                      }} />
                      <a href="#" className="searchIconlink" onClick={() => this.searchMobile()} />
                      {this.state.mobileSearchIcon && (
                        <div className="peopleSearch">
                          <div className="formGroup">
                            <input type="text" id="searchDefaultUsersMobile" placeholder="Search here..." name="mobileSearchText" onChange={this.mobilePeopleDealSearch} />
                            <button type="submit" className="submitbtn"
                              onClick={() => this.searchMobileGroupDeal()}>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
              </div>
              {this.props.mobileViewToggle && (
                <div className="tabingContent">
                  { this.props.mobileViewToggle == 'quote' || this.props.mobileViewToggle == 'onetoone' || this.props.mobileViewToggle == 'custom' ?
                    <div className="tabLink">
                      <a className={this.props.mobileViewToggle == 'quote' ? 'active' : 'inactive'} href="#" onClick={() => this.handleComponentToggle('quote')} >Deal Inbox</a>
                      <a className={this.props.mobileViewToggle == 'onetoone' ? 'active' : 'inactive'} href="#" onClick={() => this.handleComponentToggle('onetoone')}>People</a>
                      { URL_DATA.userType == 'app' &&
                        <a className={this.props.mobileViewToggle == 'custom' ? 'active' : 'inactive'} href="#" onClick={() => this.handleComponentToggle('custom')}>Internal Groups</a>
                      }
                    </div> : <></>
                  }
                </div>
              )}
            </div>
            {this.props.mobileViewToggle == 'defaultPeople' ?
              <DefaultPeople deviceType={this.props.deviceType} setisShow={this.setisShow} handlerLoader={this.props.handlerLoader} changeComponent={this.props.changeComponent} onSelectChannel={this.props.onSelectChannel} channel={this.props.channel} socket={this.props.socket} /> :
              <></>}
            {
              this.props.mobileViewToggle == 'quote' &&
              <DealInbox deviceType={this.props.deviceType} isValueSearchedValue={this.state.isValueSearchedValue} mobileSearchText={this.state.mobileSearchText} onSelectChannel={this.props.onSelectChannel} channel={this.props.channel}
                handlerLoader={this.props.handlerLoader}
                groupChannel={this.props.channel} socket={this.props.socket} group={this.state.groupValue}
                isTypping={this.state.isTypping} userTyping={this.state.userTyping}
                unreadCount={this.state.unreadCount} notSearchgroup={this.state.notSearchgroup}
                refreshdeals={this.state.refreshdeal} newOnetoOne={this.state.newOnetoone} changeComponent={this.props.changeComponent} />}

            {
              this.props.mobileViewToggle == 'onetoone' &&
              <People deviceType={this.props.deviceType} isValueSearchedValue={this.state.isValueSearchedValue} mobileSearchText={this.state.mobileSearchText} onSelectChannel={this.props.onSelectChannel} channel={this.props.channel}
                socket={this.props.socket} handlerLoader={this.props.handlerLoader} people={this.state.peopleValue} online={this.state.online}
                isTypping={this.state.isTypping} userTyping={this.state.userTyping} unreadCount={this.state.unreadCount}
                notSearchgroup={this.state.notSearchgroup} serachobj={this.serachobj} searchValue={this.state.searchValue}
                iconClicked={this.state.iconClicked} filterObj={this.filterobj} updateNewState={this.updateNewStateval} stopTyping={this.state.stopTyping}
                newOnetoOne={this.state.newOnetoone} changeComponent={this.props.changeComponent} />
            }
            {
              URL_DATA.userType == 'app' && this.props.mobileViewToggle == 'custom' &&
              <GeneralChat deviceType={this.props.deviceType} isValueSearchedValue={this.state.isValueSearchedValue} mobileSearchText={this.state.mobileSearchText} onSelectChannel={this.props.onSelectChannel} channel={this.props.channel}
                socket={this.props.socket} handlerLoader={this.props.handlerLoader} custom={this.state.customValue} online={this.state.online}
                isTypping={this.state.isTypping} userTyping={this.state.userTyping} unreadCount={this.state.unreadCount}
                notSearchgroup={this.state.notSearchgroup} serachobj={this.serachobj} searchValue={this.state.searchValue}
                iconClicked={this.state.iconClicked} filterObj={this.filterobj} updateNewState={this.updateNewStateval} stopTyping={this.state.stopTyping}
                newOnetoOne={this.state.newOnetoone} changeComponent={this.props.changeComponent}/>
            }
          </div>}
      </div>
    );
  }
}

PeopleList.propTypes = {
  onSelectChannel: PropTypes.any,
  socket: PropTypes.any,
  channel: PropTypes.any,
  handlerLoader: PropTypes.any,
  mobileViewToggle: PropTypes.any,
  changeComponent: PropTypes.any,
  deviceType: PropTypes.any,
};

export default PeopleList;
