/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Collapsible from 'react-collapsible';
import url from '../../Barriers/UrlStream';
import fetchApi from '../../Barriers/fetchApi';
import socketEmit from '../../Barriers/socketEmit';
import imgUrl from '../../Barriers/imagePath';
import URL_DATA from '../../Barriers/URLValues';
import oddoAPI from '../../Barriers/oddoAPI';
import toatsr from './../iZtoast/iZtoast';
import $ from 'jquery';
const imgServerurl = process.env.REACT_APP_IMAGE_SERVER_URL;
const controlerpServerurl = process.env.REACT_APP_CONTROL_ERP_SERVER_IMG;

class GroupPeople extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      allUser: [],
      adminMember: [],
      loadData: 0,
      page: 0,
      deletePerson: '',
      isAdmin: false,
      advanceSearch: false,
      countryCheck: false,
      departmentCheck: false,
      appCheck: false,
      resellerCheck: false,
      vendorCheck: false,
      searchValue: '',
      isUserinGroup: true,
      prevHeight: 0,
      isAdminGroup: false,
      quote: '',
    };
    this.searchlength = -1;
    this.maxtotalPage = 0;
    this.user = '';
    this.serachobj={};
    this.filterobj={};
  }

    // -------------  Chacking Paganation Code Start ------------------------
    infiniteScroll = () => {
      this.offsetHeight = document.getElementById('user1').clientHeight;
      if (this.offsetHeight/2 < (document.getElementById('user1').scrollTop) && this.state.page + 1 < this.maxtotalPage) {
        this.offsetHeight = document.getElementById('user1').scrollTop;
        this.setState({
          page: this.state.page + 1,
        });
        this.loadChannelList(this.state.page);
      }
    };
    // -------------  Chacking Paganation Code End ------------------------

    // ----------------------- Socket Emit -------------------------
    socketConnection = () => {
      this.props.socket.on(socketEmit.REFRESH_CHAT_HISTORY_GLOBAL, (data) => {
        if (data) {
        }
      });

      this.props.socket.on(socketEmit.REFRESH_GLOBAL_GROUP_MEMBER, (data) => {
        if (data && data.groupName == this.props.channel.groupName) {
          this.refreUserList();
        }
      });
    }
    // ----------------------- Socket Emit Ends --------------------

    // --------------  React Life Cycle Method Start ----------------

    componentDidMount = async () => {
      // data: this.props.channel.users,
      await this.setState({
        allUser: [],
        isAdmin: false,
      });
      await this.adminMember(this.props.channel.adminMembers);
      await this.removeUsersList(this.props.channel.id);
    }
    async componentDidUpdate(prevProps) {
      if (this.props.socket !== null && prevProps.socket !== this.props.socket) {
        this.setState({
          // data: this.props.channel.users,
          allUser: [],
          page: 0,
          isAdmin: false,
        });
        this.adminMember(this.props.channel.adminMembers);
        await this.removeUsersList(this.props.channel.id);
        await this.loadChannelList(0);
      }
      if (document.getElementById('user1')) {
        document
            .getElementById('user1')
            .addEventListener('scroll', this.infiniteScroll);
      }
      this.socketConnection();
      if (this.props.deviceType==='MOBILE') {
        if (this.state.prevHeight ==0 && this.props.channel.type == 'quote') {
          const windowHeight = $(window).innerHeight();
          const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
          const divHeight= $('.mobileTopheader').height();
          const topStripHeight = $('.top-strip').height();
          const triggerHeight = $('.Collapsible__trigger').height();
          let triggerFinalheight = (windowHeight - (topHeight + divHeight + topStripHeight + (triggerHeight*2)) - 20);
          await this.dealName();
          if (this.state.quote && this.state.quote.order_ids.length == 0) {
            triggerFinalheight = (triggerFinalheight)-50;
          } else {
            const staticHeight = URL_DATA.userType=='app'?80:85;
            triggerFinalheight = (triggerFinalheight/2)-staticHeight;
          }
          $('.quoteDisplay').css('max-height', triggerFinalheight);
          this.setState({
            prevHeight: triggerFinalheight,
          });
        }
        $('.Collapsible__contentOuter').css('overflow', 'hidden');
      }
    }
    dealName = async () => {
      const body = {};
      body['deal_id'] = this.props.channel.dealId ? this.props.channel.dealId : '89';
      const response = await oddoAPI({
        method: 'post',
        reqUrl: url.QUOTE_DETAILS,
        data: body,
      });
      if (response.data.result.data) {
        this.setState({
          quote: response.data.result.data,
        });
      }
    }

    // --------------  React Life Cycle Method End ----------------

    async searchGroupMember(val) {
      await this.setState({page: 0, advanceSearch: false});
      this.loadChannelList(this.state.page, this.state.searchValue);
    }

    handleBlankGroupMember = async (e) => {
      await this.setState({
        [e.target.name]: e.target.value,
      });
      const val= e.target.value;
      if (this.state.searchValue.length==0) {
        await this.setState({advanceSearch: false, searchValue: '', countryCheck: false, departmentCheck: false,
          appCheck: false, resellerCheck: false});
        await this.setState({page: 0});
        this.loadChannelList(this.state.page, val);
      }
      if (val.length>1 || e.charCode =='13') {
        await this.setState({page: 0});
        this.loadChannelList(this.state.page, val);
        if (e.charCode =='13') {
          e.preventDefault();
        }
      }
    }

    handleEnter = async (e) =>{
      if (e.charCode == '13') {
        this.handleBlankGroupMember(e);
        await this.setState({advanceSearch: false});
      }
    }


    onlyUniqueData = async (allUsers) => {
      const Arr = [];
      let newVal;
      Object.values(this.state.data).forEach((item) => {
        Arr.push(item.userId);
      });
      newVal = allUsers.filter((i) => {
        if (Arr.indexOf(i.userId) == -1) {
          return i;
        }
      });
      if (this.state.page == 0) {
        await this.setState({allUser: newVal});
      } else {
        await this.setState({allUser: this.state.allUser.concat(newVal)});
      }
    }

    removeUsersList = async (groupId) => {
      const updatedUrl = url.GROUP_DETAILS + '/' + groupId;
      const resp = await fetchApi({method: 'get', param: updatedUrl});
      const val = resp.data.data.adminMembers;
      const user = resp.data.data.users;
      const index = val.indexOf(URL_DATA.userId);
      await this.setState({
        data: user,
      });
      if (index < 0) {
        this.setState({
          isAdminGroup: false,
        });
      } else {
        this.setState({isAdminGroup: true});
      }
    }

    // -----------------Searching Ends----------------------


    // ---------- API for Get Data & Add/Remove User Start -----

    loadChannelList = async (page, val='') => {
      if (URL_DATA && page == 0) {
        this.user = URL_DATA;
      }
      let companyResellerId=this.user.companyResellerId;
      if (companyResellerId == false || companyResellerId == 'false') {
        for (const property in this.state.data) {
          if (this.state.data[property].userType == 'reseller') {
            companyResellerId= this.state.data[property].companyResellerId;
            break;
          }
        }
      }
      const body = {};
      body['page'] = page,
      // body['companyResellerId'] = String(this.user.companyResellerId),
      body['companyResellerId'] = companyResellerId;
      body['userId'] = URL_DATA.userId,
      body['groupId'] = this.props.channel.id,
            // this.state.searchValue.length>3 ? body['userName'] = this.state.searchValue : "",
            this.state.searchValue.length ? body['userName'] = this.state.searchValue : '',
      body['searchType']= 'deal';
            Object.keys(this.serachobj)[0] ? body['searchParameter'] = Object.keys(this.serachobj)[0] : delete body['searchParameter'],
            Object.keys(this.filterobj)[0] ? body['filterParameter'] = Object.keys(this.filterobj)[0] : delete body['filterParameter'];
            if (this.props.channel.type == 'custom') body['filterParameter']='app';
            const response = await fetchApi({
              method: 'post',
              reqUrl: url.USER_ALL,
              data: body,
            });
            this.maxtotalPage = response.data.data.totalpage;
            this.onlyUniqueData(response.data.data.data);
    }

    // Gettting Members of List using Group Name

    refreUserList = async () => {
      const updatedUrl =
            await url.GROUP_DETAILS + '/' + this.props.channel.id;
      const response = await fetchApi({method: 'get', param: updatedUrl});
      this.setState({
        data: response.data.data.userDetails,
      });
      await this.loadChannelList(0);
    }
    deviceTokenData = async (userId) => {
      const body = {};
      body['reseller_id'] = parseInt(userId);
      const response = await oddoAPI({
        method: 'post',
        reqUrl: url.USER_INFO,
        data: body,
      });
      if (response.data.result.status_code == 200) {
        return response.data.result.data.notification_tokens;
      }
    }

    // Add  Group Member into Group
    addUser = async (i) => {
      const deciveTokenValue = await this.deviceTokenData(i.userId);
      const body =
        {
          groupId: this.props.channel.id,
          memberId: String(i.userId),
          loggedInUserId: String(URL_DATA.userId),
          deviceToken: deciveTokenValue,
        };
      const response = await fetchApi({
        method: 'put',
        reqUrl: url.GROUP_MEMBERS_ADD,
        data: body,
      });
      if (response.data.code == 200) {
        this.socketConnection();
        this.refreUserList();
        this.closeModel();
      } else if (response.data.code == 204) {
        toatsr.error(response.data.message);
      }
    }

    // Remove Group Member from Group
    onRemovePerson = async () => {
      const deciveTokenValue = await this.deviceTokenData(this.state.deletePerson.userId);
      const body =
        {
          groupId: this.props.channel.id,
          memberId: String(this.state.deletePerson.userId),
          loggedInUserId: String(URL_DATA.userId),
          deviceToken: deciveTokenValue,
        };
      const response = await fetchApi({
        method: 'put',
        reqUrl: url.GROUP_MEMBER_REMOVE,
        data: body,
      });
      if (response.data.code == 200) {
        this.socketConnection();
        this.closeDeleteModel();
        this.refreUserList();
      }
      // else {}
    }

    adminMember = async (admin) => {
      this.setState({
        adminMember: admin,
      });
      if (this.state.adminMember.indexOf(String(URL_DATA.userId)) > -1) {
        this.setState({
          isAdmin: true,
        });
      }
    }

    toggleDropDown = async () =>{
      if (!this.state.advanceSearch) this.setState({advanceSearch: true});
      else this.setState({advanceSearch: false});
    }


    handleSerach= async (val) => {
      this.serachobj={};
      await this.setState({page: 0});
      if (val == 'country') {
        if (this.state.countryCheck) this.setState({countryCheck: false});
        else {
          this.setState({countryCheck: true}); this.serachobj[val] = await val;
        }
        await this.setState({
          departmentCheck: false,
        });
      } else if (val == 'department') {
        if (this.state.departmentCheck) this.setState({departmentCheck: false});
        else {
          this.setState({departmentCheck: true}); ; this.serachobj[val] = await val;
        }
        await this.setState({
          countryCheck: false,
        });
      }
      if (this.state.countryCheck == false && this.state.departmentCheck == false && this.state.appCheck ==false && this.state.resellerCheck ==false) {
        await this.setState({advanceSearch: false});
      }
      // if(this.state.searchValue.length>3)
      this.loadChannelList(this.state.page);
    }


    handlefilter= async (val) => {
      this.filterobj={};
      await this.setState({page: 0});
      if (val == 'app') {
        if (this.state.appCheck) this.setState({appCheck: false});
        else {
          this.setState({appCheck: true}); this.filterobj[val] = await val;
        }
        await this.setState({
          resellerCheck: false,
          vendorCheck: false,
        });
      } else if (val == 'reseller') {
        if (this.state.resellerCheck) this.setState({resellerCheck: false});
        else {
          this.setState({resellerCheck: true}); ; this.filterobj[val] = await val;
        }
        await this.setState({
          appCheck: false,
          vendorCheck: false,
        });
      } else if (val == 'vendor') {
        if (this.state.vendorCheck) this.setState({vendorCheck: false});
        else {
          this.setState({vendorCheck: true}); ; this.filterobj[val] = await val;
        }
        await this.setState({
          appCheck: false,
          resellerCheck: false,
        });
      }

      if (this.state.countryCheck == false && this.state.departmentCheck == false && this.state.appCheck==false && this.state.resellerCheck ==false && this.state.vendorCheck == false) {
        await this.setState({advanceSearch: false});
      }
      // if(this.state.searchValue.length>3)
      this.loadChannelList(this.state.page);
    }

    // ---------- API for Get Data & Add/Remove User Start -----

    // --------------- All Pop-up Code Start ---------------

    openModel = async () => {
      const modal = document.getElementById('myModal');
      document.getElementById('searchGroupMember').value = '';
      const btn = document.getElementById('myBtn');
      const span = document.getElementsByClassName('close')[0];
      modal.style.display = 'block';
      await this.setState({
        advanceSearch: false,
        countryCheck: false,
        departmentCheck: false,
        appCheck: false,
        resellerCheck: false,
        searchValue: '',
        page: 0,
      });
      this.maxtotalPage = 0;
      this.user = '';
      this.serachobj={};
      this.filterobj={};
      await this.loadChannelList(this.state.page);
    }

    closeModel = () => {
      const modal = document.getElementById('myModal');
      modal.style.display = 'none';
    }

    allCloseModel = () => {
      const modal = document.getElementById('myModal');
      window.onclick = function(event) {
        if (event.target == modal) {
          modal.style.display = 'none';
        }
      };
    }

    // Pop Up For Delete
    openDeleteModel = async (i) => {
      const modal = document.getElementById('deleteModal');
      modal.style.display = 'block';
      this.deletePerson = i;
      this.setState({
        deletePerson: i,
      });
    }

    hideAdvanceSearch = async (e) => {
      await this.setState({advanceSearch: false});
    }

    closeDeleteModel = () => {
      const modal = document.getElementById('deleteModal');
      modal.style.display = 'none';
    }

    // --------------- All Pop-up Code End ---------------


    render() {
      const {
        searchValue,
      } = this.state;

      return (
        <div className="people-list plPopup" onClick={() => this.allCloseModel()} >
          <div className="deal-inbox">
            <Collapsible trigger="Chat Members" open={true}>
              {this.state.isAdminGroup?
                        <a id="myBtn" className="arrow" href="#" style={{'marginRight': '40px'}} onClick={() => this.openModel()}>
                          <span className="plusminusAccordian"></span>
                        </a>:<></>}

              <div className="lists autoScrolldiv quoteDisplay" id="contentDealList">
                {
                                this.state.data ?
                                    Object.values(this.state.data).map((val, k) => {
                                      return (
                                        <div className="list" key={k}>
                                          <div className="user-img">
                                            <a href="#">
                                              {val.profileImage.length > 10 ?
                                                            <img src={controlerpServerurl + val.profileImage} /> :
                                                            <img src={imgServerurl + imgUrl.AVATAR1} />
                                              }
                                            </a>
                                          </div>
                                          <a href="#" className="user-text">
                                            {val.userName ? val.userName : 'Dummy User'}
                                          </a>
                                          {this.state.isAdmin ?
                                                    this.state.adminMember.indexOf(val.userId) > -1 || (URL_DATA.userType == 'reseller' && val.userType == 'vendor') ? '' :
                                                        <a className="arrow sublistarrow mr-list" style={{'marginRight': '40px'}} href="#" onClick={() => this.openDeleteModel(val)}>
                                                          <span className="plusminusAccordian"></span>
                                                        </a> : ''}
                                        </div>
                                      );
                                    }) :
                                    ''
                }
              </div>

              <div id="deleteModal" className="modal">
                <div className="modal-content">
                  <h2>Remove People</h2>
                  <form action="#" method="post">
                    <div className="full-width">
                      <div className="form-group full-width">
                        <p>Are you sure you want to Remove {this.state.deletePerson.userName} from {this.props.channel.groupName}?</p>
                      </div>
                    </div>
                    <div className="action-primary full-width">
                      <button type="button" className="close grey" onClick={() => this.closeDeleteModel()}>No</button>
                      <button type="button" onClick={this.onRemovePerson}>
                                            Yes</button>
                    </div>
                  </form>
                </div>
              </div>

              <div id="myModal" className="modal myModelPeople">
                <div className="modal-content">
                  <h2>People List</h2>
                  <form action="#" method="post">
                    <div className="form-group three-col full-width">
                      <div className="searchbar">
                        <div className="select-dropdown">
                          <div className="formGroup">
                            <input type="text" id="searchGroupMember" placeholder="People Search" name="searchValue" value={searchValue}
                              onChange={this.handleBlankGroupMember} onKeyPress={this.handleEnter} onClick={this.hideAdvanceSearch}/>
                            <button type="button" className="submitbtn"
                              onClick={() => this.searchGroupMember(document.getElementById('searchGroupMember').value)}>
                            </button>
                            <span className="arrowSelect" onClick={()=>{
                              this.toggleDropDown();
                            }}></span>
                          </div>
                          {this.state.advanceSearch?
                                                <ul className="searcdropdownList">
                                                  <li className="title">
                                                        Search
                                                  </li>
                                                  <li onClick={() => {
                                                    this.handleSerach('country');
                                                  }}>
                                                    <a className="checkbox">
                                                      <input type="checkbox" value="country" id="country1" checked={this.state.countryCheck} />
                                                      <label>Country</label>
                                                    </a>
                                                  </li>
                                                  <li onClick={() => {
                                                    this.handleSerach('department');
                                                  }}>
                                                    <a className="checkbox">
                                                      <input type="checkbox" value="department" id="designation1" checked={this.state.departmentCheck} />
                                                      <label>Department</label>
                                                    </a>
                                                  </li>
                                                  {
                                                    this.props && this.props.channel && this.props.channel.type !='custom' &&
                                                    <>
                                                      <li className="title">
                                                        Filter By
                                                      </li>
                                                      <li onClick={() => {
                                                        this.handlefilter('app');
                                                      }}>
                                                        <a className="checkbox">
                                                          <input type="checkbox" value="app" id="app1" checked={this.state.appCheck} />
                                                          <label>app</label>
                                                        </a>
                                                      </li>
                                                      <li onClick={() => {
                                                        this.handlefilter('reseller');
                                                      }}>
                                                        <a className="checkbox">
                                                          <input type="checkbox" value="reseller" id="reseller1" checked={this.state.resellerCheck} />
                                                          <label>Reseller</label>
                                                        </a>
                                                      </li>
                                                      {
                                                        URL_DATA.userType == 'app' &&
                                                        <li onClick={() => {
                                                          this.handlefilter('vendor');
                                                        }}>
                                                          <a className="checkbox">
                                                            <input type="checkbox" value="vendor" id="vendor1" checked={this.state.vendorCheck} />
                                                            <label>Vendor</label>
                                                          </a>
                                                        </li>
                                                      }
                                                    </>
                                                  }

                                                </ul> :<></>}
                        </div>
                      </div>
                    </div>
                    <div className="form-group full-width">
                      <div className="lists customScrollbar" id="user1">
                        {
                                                this.state.allUser ?
                                                    Object.values(this.state.allUser).map((val, k) => {
                                                      return (
                                                        <div className="list" key={k}>
                                                          <div className="user-img">
                                                            <a href="#">
                                                              {val.profileImage.length > 10 ?
                                                                            <img src={controlerpServerurl + val.profileImage} /> :
                                                                            <img src={imgServerurl + imgUrl.AVATAR1} />
                                                              }

                                                            </a>
                                                          </div>
                                                          <a href="#" className="user-text">{val.userName}</a>
                                                          <a id="myBtn" className="arrow m-right" href="#" onClick={() => this.addUser(val)} >
                                                            <span className="plusminusAccordian"></span>
                                                          </a>
                                                        </div>
                                                      );
                                                    }) :
                                                    ''
                        }
                      </div>
                      {this.state.allUser && this.state.allUser.length == 0 && this.maxtotalPage ? 'No User Found' : ''}
                    </div>
                    <div className="action-primary full-width">
                      <a className="commoncBtn" href="#" onClick={() => this.closeModel()}>Cancel</a>
                    </div>
                  </form>
                </div>
              </div>
            </Collapsible>
          </div>
        </div >
      );
    }
}

GroupPeople.propTypes = {
  channel: PropTypes.any,
  socket: PropTypes.any,
  handlerLoader: PropTypes.any,
  deviceType: PropTypes.any,
};
export default GroupPeople;
