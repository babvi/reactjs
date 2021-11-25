/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
import React, {Component} from 'react';
import fetchApi from '../../Barriers/fetchApi';
import url from '../../Barriers/UrlStream';
import URL_DATA from '../../Barriers/URLValues';
import PropTypes from 'prop-types';
import $ from 'jquery';
import {
  MobileView,
  isBrowser,
} from 'react-device-detect';
const imgServerurl = process.env.REACT_APP_IMAGE_SERVER_URL;
const controlerpServerurl = process.env.REACT_APP_CONTROL_ERP_SERVER_IMG;

class defaultPeople extends Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      userId: '',
      userData: [],
      toggleFilterBox: false,
      countryCheck: false,
      departmentCheck: false,
      appCheck: false,
      resellerCheck: false,
      vendorCheck: false,
      defaultSearchText: '',
    };
    this.maxtotalPagePeople = 0;
    this.serachobj = {};
    this.filterObj = {};
  }

  infiniteScroll = async () => {
    if (this.props.deviceType==='MOBILE' ) {
      if (document.getElementById('defaultList').scrollTop + window.innerHeight >= (document.getElementById('defaultList').scrollHeight)) {
        if (this.state.page < this.maxtotalPagePeople -1) {
          await this.setState({
            page: this.state.page + 1,
          });
          await this.loadDefaultUserList(this.state.page);
        }
      }
    }
  }
  async componentDidMount() {
    this.loadDefaultUserList(this.state.page);
    if (this.props.deviceType==='MOBILE') {
      const windowsize = screen.width;
      if (windowsize <= 1023 && windowsize>=768) {
        await this.setState({
          page: this.state.page + 1,
        });
        await this.loadDefaultUserList(this.state.page);
      }
    }
  }
  async componentDidUpdate(prevProps) {
    if (this.props.socket !== null && prevProps.socket !== this.props.socket) {
    } else {
      if (this.props.deviceType==='MOBILE' ) {
        if (document.getElementById('defaultList')) {
          document
              .getElementById('defaultList')
              .addEventListener('scroll', this.infiniteScroll);
        }
      }
    }

    if (this.props.deviceType==='MOBILE' ) {
      if (URL_DATA.userType=='reseller' || URL_DATA.userType=='vendor') {
        const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
        const windowHeight = $(window).innerHeight();
        const divHeight= $('.mobileTopheader').height();
        const filterHeight = $('.filterOptions').height();
        const peopleSearchHeight = $('.peopleSearch').height();
        const finalHeight = (windowHeight-(divHeight+filterHeight+peopleSearchHeight+topHeight)-127);
        $('.peopleListScroll').css('max-height', finalHeight); // set max height
      } else if (URL_DATA.userType=='app') {
        const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
        const windowHeight = $(window).innerHeight();
        const divHeight= $('.mobileTopheader').height();
        const filterHeight = $('.filterOptions').height();
        const peopleSearchHeight = $('.peopleSearch').height();
        const finalHeight = (windowHeight-(divHeight+filterHeight+peopleSearchHeight+topHeight)-60);
        const TopHeightFilter=divHeight+5;
        URL_DATA.baseMenu=='horizontal' ? $('.peopleListScroll').css('max-height', finalHeight-70):
        $('.peopleListScroll').css('max-height', finalHeight-50);
        $('.filterOptions').css('top', TopHeightFilter);
      }
    }
  }
  onChannelChange = async (id, groupName) => {
    if (this.props.deviceType==='MOBILE' ) this.props.changeComponent('');
    const index = this.state.userData.findIndex((people) => people.userId == id);
    if (index >= 0) {
      if (this.props.socket) {
        this.props.socket.disconnect();
      }
      if (this.state.userData[index].groupName) {
        this.props.onSelectChannel(this.state.userData[index]);
      } else {
        let val = {};
        val = this.state.userData[index];
        val.type = 'onetoone';
        val.groupMembers = [String(val.userId), String(URL_DATA.userId)];
        val.groupName = (val.userId - URL_DATA.userId) > 0 ?
          URL_DATA.userId + '-' + val.userId : val.userId + '-' + URL_DATA.userId;
        this.props.onSelectChannel(val);
        setTimeout(() => {
          this.setState({page: 0});
          this.loadDefaultUserList(this.state.page);
        }, 1000);
      }
    }
    this.props.setisShow(false);
  }

  loadDefaultUserList = async (page, val = '') => {
    this.setState({
      userId: URL_DATA.userId,
    });
    const body = {};
    if (Object.keys(this.serachobj).length || Object.keys(this.filterObj).length) {
      body['page'] = page,
      body['companyResellerId'] = URL_DATA.companyResellerId,
      body['userId'] = URL_DATA.userId,
      body['searchType'] = 'global',
        this.state.defaultSearchText.length ? body['userName']= this.state.defaultSearchText: delete['userName'];
        Object.keys(this.serachobj).length ? body['searchParameter'] = Object.keys(this.serachobj)[0] : delete body['searchParameter'];
        Object.keys(this.filterObj).length ? body['filterParameter'] = Object.keys(this.filterObj)[0] : delete body['filterParameter'];
    } else {
      body['page'] = page,
      body['companyResellerId'] = URL_DATA.companyResellerId,
      body['userId'] = URL_DATA.userId,
      this.state.defaultSearchText.length ? body['userName']= this.state.defaultSearchText: delete['userName'];
    }
    const response = await fetchApi({
      method: 'post',
      reqUrl: URL_DATA.userType == 'vendor'? url.VENDOR_ALL : url.USER_ALL,
      data: body,
    });
    this.maxtotalPagePeople = await response.data.data.totalpage;
    if (response && response.data.code == 200) {
      response.data.data.data.forEach((element, i) => {
        if (element.userId == this.state.userId) {
          response.data.data.data.splice(i, 1);
        }
      });
      if (page == 0) {
        if (this.props.deviceType==='MOBILE' ) await this.props.handlerLoader(false);
        await this.setState({
          userData: response.data.data.data,
        });
      } else {
        await this.setState({
          userData: this.state.userData.concat(response.data.data.data),
        });
      }
    }
  }

  backToDealInbox = async (val) => {
    if (this.props.deviceType==='MOBILE' ) {
      this.props.changeComponent(val);
      this.props.setisShow(false);
    }
  }
  toggleFilter = async (val) => {
    await this.setState({
      toggleFilterBox: !val,
    });
  }


  handleSerach = async (val) => {
    this.serachobj = {};
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
    if (this.state.countryCheck == false && this.state.departmentCheck == false && this.state.appCheck == false && this.state.resellerCheck == false) {
      await this.setState({advanceSearch: false});
    }
    // if(this.state.searchValue.length>3)
    // this.loadDefaultUserList(this.state.page)
  }


  handlefilter = async (val) => {
    this.filterObj = {};
    await this.setState({page: 0});
    // if (val == 'app') {
    //   if (this.state.appCheck) this.setState({appCheck: false});
    //   else {
    //     this.setState({appCheck: true}); this.filterObj[val] = await val;
    //   }
    //   await this.setState({
    //     resellerCheck: false,
    //   });
    // } else if (val == 'reseller') {
    //   if (this.state.resellerCheck) this.setState({resellerCheck: false});
    //   else {
    //     this.setState({resellerCheck: true});
    //     this.filterObj[val] = await val;
    //   }
    //   await this.setState({
    //     appCheck: false,
    //   });
    // }
    if (val == 'app') {
      if (this.state.appCheck) this.setState({appCheck: false});
      else {
        this.setState({appCheck: true}); this.filterObj[val] = await val;
      }
      await this.setState({
        resellerCheck: false,
        vendorCheck: false,
      });
    } else if (val == 'reseller') {
      if (this.state.resellerCheck) this.setState({resellerCheck: false});
      else {
        this.setState({resellerCheck: true}); ; this.filterObj[val] = await val;
      }
      await this.setState({
        appCheck: false,
        vendorCheck: false,
      });
    } else if (val == 'vendor') {
      if (this.state.vendorCheck) this.setState({vendorCheck: false});
      else {
        this.setState({vendorCheck: true}); this.filterObj[val] = await val;
      }
      await this.setState({
        appCheck: false,
        resellerCheck: false,
      });
    }
    if (this.state.countryCheck == false && this.state.departmentCheck == false && this.state.appCheck == false && this.state.resellerCheck == false && this.state.vendorCheck == false) {
      await this.setState({advanceSearch: false});
    }
    // if(this.state.searchValue.length>3)
    // this.loadDefaultUserList(this.state.page)
  }


  openModel = async (val) => {
    const modal = document.getElementById('filterModel');
    modal.style.display = 'block';
  }

  closeModel = () => {
    const modal = document.getElementById('filterModel');
    modal.style.display = 'none';
    this.resetState();
  }

  resetState() {
    this.setState({
      countryCheck: false,
      departmentCheck: false,
      appCheck: false,
      resellerCheck: false,
    });
    this.serachobj = {};
    this.filterObj = {};
  }

  allCloseModel = () => {
    const modal = document.getElementById('filterModel');
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
        this.resetState();
      }
    };
  }

  defaultPeopleDealSearch =async (e) =>{
    await this.setState({
      [e.target.name]: e.target.value,
    });
    if (this.state.defaultSearchText.length==0 || this.state.defaultSearchText.length >1) {
      this.searchMobileGroupDeal();
      this.resetState();
    }
  }

  searchMobileGroupDeal= async () =>{
    await this.setState({
      page: 0,
    });
    await this.loadDefaultUserList(this.state.page);
    const modal = document.getElementById('filterModel');
    modal.style.display = 'none';
  }

  render() {
    return (
      <div onClick={() => this.allCloseModel()}>
        <MobileView>
          <div className="userListingfilter" >
            <div className="filterOptions">
              <a className="backLink" onClick={() => this.backToDealInbox('quote')}></a>
              <h2>User Listing</h2>
              <a className="filterIcon" href="#" onClick={() => {
                this.openModel();
              }}/>
            </div>

            <div className="userListing">
              <div className="peopleSearch">
                <div className="formGroup">
                  <input type="text" id="searchDefaultUsersMobile" placeholder="Search" name="defaultSearchText" onChange={this.defaultPeopleDealSearch} />
                  <button type="submit" className="submitbtn"
                    onClick={() => this.searchMobileGroupDeal()}>
                  </button>
                </div>
              </div>
              <div className="lists peopleListScroll" id="defaultList" >
                {this.state.userData &&
                this.state.userData.map((singleData, i) => {
                  return (
                    <div
                      className="list"
                      key={i}
                      onClick={() => this.onChannelChange(singleData && singleData.userId, singleData.groupName)}
                    >
                      <div className="user-img">
                        {/* {
                          singleData && singleData.groupName ?
                            <span className={`status ${this.props.online && this.props.online.users && Object.keys(this.props.online.users).findIndex(id => id == singleData.userId) > -1 ? "online" : "offline"}`}></span> : ""
                        } */}
                        <a href="#">
                          {singleData.profileImage.length > 10 ?
                            <img src={controlerpServerurl + singleData.profileImage} /> : <img src={imgServerurl + imgUrl.AVATAR1} />
                          }
                        </a>
                      </div>
                      <a href="#" className="user-text " id="active__user">
                        {
                          singleData && singleData.userName && this.props && this.props.channel && this.props.channel.userName == singleData.userName ?
                            <span className="active">{singleData.userName}</span> : <span>{singleData.userName}</span>
                        }
                      </a>

                    </div>
                  );
                })
                }
                {
                this.state.defaultSearchText.length && this.state.userData.length ==0 ? <span className="noFound"> No Data Found </span> :''
                }
              </div>
            </div>
          </div>

          <div id="filterModel" className="modal">
            <div className="modal-content">
              <button type="button" className="close grey" onClick={() => this.closeModel()}>Cancel</button>
              <ul className="searcdropdownList" id="searcdropdown1">
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


              </ul>
              <div className="action-primary full-width">
                <button type="button" className="submitbtn" onClick={() => this.searchMobileGroupDeal()}>Submit</button>
              </div>
            </div>
          </div>
        </MobileView>
      </div>
    );
  }
}

defaultPeople.propTypes = {
  onSelectChannel: PropTypes.any,
  channel: PropTypes.any,
  socket: PropTypes.any,
  changeComponent: PropTypes.any,
  handlerLoader: PropTypes.any,
  isShow: PropTypes.any,
  setisShow: PropTypes.any,
  deviceType: PropTypes.any,
};

export default defaultPeople;
