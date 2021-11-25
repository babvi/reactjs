/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Collapsible from 'react-collapsible';
import fetchApi from '../../Barriers/fetchApi';
import url from '../../Barriers/UrlStream';
import $, {data} from 'jquery';
import imgUrl from '../../Barriers/imagePath';
import URL_DATA from '../../Barriers/URLValues';
import moment from 'moment';
const imageServerurl = process.env.REACT_APP_IMAGE_SERVER_URL;
const controlerpServerurl = process.env.REACT_APP_CONTROL_ERP_SERVER_IMG;
import toatsr from './../iZtoast/iZtoast';

class People extends Component {
  constructor(props) {
    super(props);
    this.state = {
      people: null,
      data: [],
      userData: [],
      online: [],
      page: 0,
      isTypping: false,
      userId: '',
      userTyping: [],
      chatCount: true,
      unreadCount: [],
      comapanyList: true,
      defaultPage: 0,
      unreadCountData: [],
      userTypingData: [],
      defaultSearch: '',
    };
    this.maxtotalPage = 0;
    this.maxtotalPagePeople = 0;
    this.offsetHeight = 0;
    this.offsetHeightPeople = 0;
    this.user = '';
    this.unReadArray = [];
    this.typingArray=[];
    this.stopTypingArray=[];
  }

  // Call When Component very first time
  async componentDidMount() {
    await this.loadChannelList(this.state.page);
    if (!this.props.people) {
      this.loadChannelList(this.state.page);
      this.loadDefaultUserList(this.state.defaultPage);
    }
    this.handleAPIcount();
    if (this.props.deviceType==='MOBILE') {
      const windowsize = screen.width;
      if (windowsize <= 1023 && windowsize>=768) {
        await this.setState({
          page: this.state.page + 1,
        });
        await this.loadChannelList(this.state.page);
      }
    }
  }

  // ----------- Redirect to the Group ------------------

    redirecttoGroup = async () =>{
      const localStorageId= localStorage.getItem('collaborationGroupId');
      if (localStorageId) {
        const index = this.state.data.findIndex((x) => x.groupId ==localStorageId);
        if (index>-1) {
          this.props.onSelectChannel(this.state.data[index]);
          localStorage.removeItem('collaborationGroupId');
        }
      }
    }

    // ------------ Redirect to Group End --------------

  // ----------------------- Check Pagination Conditions Start ---------------------
  infiniteScroll = async () => {
    if (this.props.deviceType==='MOBILE') {
      if (document.getElementById('peopleInbox').scrollTop + (window.innerHeight+10) >= (document.getElementById('peopleInbox').scrollHeight)) {
        if (this.state.page < this.maxtotalPage -1) {
          await this.setState({
            page: this.state.page + 1,
          });
          await this.loadChannelList(this.state.page);
        }
      }
    } else {
      this.offsetHeight = document.getElementById('contentList').offsetHeight;
      if (this.offsetHeight/2 < (document.getElementById('contentList').scrollTop) && this.state.page < this.maxtotalPage - 1) {
        this.offsetHeight = document.getElementById('contentList').scrollTop;
        this.setState({
          page: this.state.page + 1,
        });
        this.loadChannelList(this.state.page);
      }
    }
  };

  infiniteScrollPeople = () => {
    this.offsetHeightPeople = document.getElementById('contentList1').clientHeight;
    if (this.offsetHeightPeople/2 < ((document.getElementById('contentList1').scrollTop)) && this.state.defaultPage < this.maxtotalPagePeople - 1) {
      this.offsetHeightPeople = document.getElementById('contentList1').scrollTop;
      this.setState({
        defaultPage: this.state.defaultPage + 1,
      });
      if (document.getElementById('searchDefaultUsers')) {
        this.loadDefaultUserList(this.state.defaultPage, (this.state.defaultSearch));
      } else this.loadDefaultUserList(this.state.defaultPage);
    }
  };
  // ----------------------- Check Pagination Conditions End ---------------------

  updatePeopleList = async (val) => {
    this.setState({
      data: val,
    });
  };


  // Manage All Socket and Other Changes in app-Chat
  async componentDidUpdate(prevProps) {
    if (this.props.socket !== null && prevProps.socket !== this.props.socket) {
      if (document.getElementById('contentList')) {
        document
            .getElementById('contentList')
            .addEventListener('scroll', this.infiniteScroll);
      }
    } else {
      if (this.props.deviceType==='MOBILE') {
        document.getElementById('peopleInbox').addEventListener('scroll', this.infiniteScroll);
      } else {
        if (document.getElementById('contentList')) {
          document
              .getElementById('contentList')
              .addEventListener('scroll', this.infiniteScroll);
        }
      }
    }
    if (!this.state.comapanyList || this.props.notSearchgroup) {
      if (document.getElementById('contentList1')) {
        document
            .getElementById('contentList1')
            .addEventListener('scroll', this.infiniteScrollPeople);
      }
    }
    if (this.props.people && prevProps.people !== this.props.people) {
      await this.updatePeopleList(this.props.people);
    }
    if (this.props.unreadCount && prevProps.unreadCount !== this.props.unreadCount) {
      this.setState({
        chatCount: false,
      });
    }

    if (this.props.unreadCount != prevProps.unreadCount) {
      if (this.props.unreadCount) {
        let obj={};
        obj = this.props.unreadCount[0];
        await this.unReadArray.forEach((val, i) => {
          if (val.groupId == obj.groupId) {
            this.unReadArray.splice(i, 1);
          }
        });
        await this.unReadArray.push(obj);
        await this.setState({
          unreadCountData: await this.unReadArray,
        });
        const groupMember=obj.groupName.split('-');
        const index = groupMember.indexOf(URL_DATA.userId); {
          if (index>-1) {
            await this.setState({page: 0});
            await this.loadChannelList(this.state.page);
          }
        }
      }
    }
    if (prevProps.notSearchgroup != this.props.notSearchgroup || prevProps.iconClicked < this.props.iconClicked ||
      prevProps.filterObj != this.props.filterObj || prevProps.serachobj != this.props.serachobj) {
      if (this.props.searchValue.length>1 && Object.keys(this.props.serachobj).length !=0 || Object.keys(this.props.filterObj).length !=0 ) {
        await this.setState({page: 0});
        await this.loadDefaultUserList(this.state.page);
      }
    }
    if (this.props.searchValue.length == 0 && prevProps.searchValue != this.props.searchValue) {
      await this.loadChannelList(0);
    }
    if (prevProps.userTyping != this.props.userTyping) {
      const obj = this.props.userTyping;
      this.typingArray.push(obj);
      this.typingArray.forEach((val, i)=>{
        if (val.groupId == obj.groupId) {
          const numData = this.typingArray.reduce(function(n, val) {
            return n + (val.groupId == obj.groupId);
          }, 0);
          if (numData>1) {
            const Index= this.typingArray.findIndex((j) => j.groupId == obj.groupId);
            if (Index>-1) {
              this.typingArray.splice(Index, 1);
            }
          }
        }
      });
      await this.setState({userTypingData: this.typingArray});
    }
    if (prevProps.stopTyping != this.props.stopTyping) {
      const obj= await this.props.stopTyping;
      this.stopTypingArray=await this.state.userTypingData;
      const Index= await this.stopTypingArray.findIndex((j) => j.groupId == obj.groupId);
      if (Index>-1) {
        await this.stopTypingArray.splice(Index, 1);
        await this.setState({userTypingData: this.stopTypingArray});
      }
    }
    if (prevProps.newOnetoOne != this.props.newOnetoOne ) {
      const groupMember= this.props.newOnetoOne.groupName.split('-');
      const index = groupMember.indexOf(URL_DATA.userId); {
        if (index>-1) {
          await this.setState({page: 0});
          await this.loadChannelList(this.state.page);
        }
      }
    }
    if (this.props.deviceType==='MOBILE') {
      if (this.props.isValueSearchedValue !== null && prevProps.isValueSearchedValue !== this.props.isValueSearchedValue) {
        await this.setState({page: 0});
        this.loadChannelList(this.state.page);
      }
    }
  }

  handleAPIcount = async () => {
    setTimeout(() => {
      this.state.data.forEach((val, i) => {
        if (val.unread) {
          const numData = this.unReadArray.reduce(function(n, value) {
            return n + (value.groupId == val.groupId);
          }, 0);
          if (numData ==0) {
            val.count = val.unread;
            this.unReadArray.push(val);
            this.setState({
              unreadCountData: this.unReadArray,
            });
          }
        }
      });
    }, 1000);
  }

  removeCount = async (val) => {
    const numData = this.unReadArray.reduce(function(n, value) {
      return n + (value.groupName == val);
    }, 0);
    if (numData == 0) {
      if (this.state.unreadCountData.findIndex((j) => j.groupName == val) > -1) {
        this.unReadArray.splice(this.state.unreadCountData.findIndex((j) => j.groupName == val), 1);
        this.setState({
          unreadCountData: await this.unReadArray,
        });
      }
    } else {
      for (let i = 0; i < numData; i++) {
        if (this.state.unreadCountData.findIndex((j) => j.groupName == val) > -1) {
          this.unReadArray.splice(this.state.unreadCountData.findIndex((j) => j.groupName == val), 1);
          this.setState({
            unreadCountData: await this.unReadArray,
          });
        }
      }
    }
  }


  // -------------- Get Data From the API ---------------------------
  loadChannelList = async (page) => {
    this.setState({
      userId: URL_DATA.userId,
    });

    if (URL_DATA && page == 0) {
      this.user = URL_DATA;
    }

    const body = {};
    body['userId']= URL_DATA.userId,
    body['page']= page,
      this.props.deviceType==='MOBILE' && this.props.mobileSearchText.length? body['userName'] = this.props.mobileSearchText : delete body['userName'];

    const response = await fetchApi({
      method: 'post',
      reqUrl: url.USER_LIST,
      data: body,
    });

    this.maxtotalPage = await response.data.data.totalpage;
    if (response && response.data && response.status == 200) {
      if (page == 0) {
        if (this.props.deviceType==='MOBILE') await this.props.handlerLoader(false);
        await this.setState({
          data: response.data.data.data,
        }, () => {
          $('#contentList').scrollTop(
              $('#contentList')[0],
          );
        });
      } else {
        await this.setState({
          data: this.state.data.concat(response.data.data.data),
        });
        await this.handleAPIcount();
      }
      if (localStorage.getItem('collaborationGroupId')) this.redirecttoGroup();
    }
  };

  // -------------- Get Data From the API End ---------------------------

  // ---------------- Handle People Changes at Run Time Start ------------------
  onChannelChange = async (id, groupName) => {
    if (this.props.deviceType==='MOBILE') this.props.changeComponent('');
    this.removeCount(groupName);
    if (this.props.notSearchgroup) {
      const index = this.state.userData.findIndex((people) => people.userId == id);
      let val = {};
      val = this.state.userData[index];
      val.type = 'onetoone';
      val.groupMembers = [String(val.userId), String(URL_DATA.userId)];
      val.groupName = (val.userId - URL_DATA.userId) > 0 ?
        URL_DATA.userId + '-' + val.userId : val.userId + '-' + URL_DATA.userId;
      this.props.onSelectChannel(val);
      setTimeout(() => {
        this.setState({defaultPage: 0, page: 0});
        this.loadChannelList(0);
        this.loadDefaultUserList(0);
      }, 1000);
      this.props.updateNewState(true);
      await this.setState({comapanyList: true});
      await this.loadChannelList(0);
    } else if (this.state.comapanyList) {
      this.props.updateNewState(true);
      const index = this.state.data.findIndex((people) => people.userId == id);
      if (index >= 0) {
        if (this.props.socket) {
          this.props.socket.disconnect();
        }
        if (this.state.data[index].groupName) {
          this.props.onSelectChannel(this.state.data[index]);
        } else {
          let val = {};
          val = this.state.data[index];
          val.type = 'onetoone';
          val.groupMembers = [String(val.userId), String(URL_DATA.userId)];
          val.groupName = (val.userId - URL_DATA.userId) > 0 ?
            URL_DATA.userId + '-' + val.userId : val.userId + '-' + URL_DATA.userId;
          this.props.onSelectChannel(val);
          setTimeout(() => {
            this.setState({defaultPage: 0, page: 0});
            this.loadChannelList(0);
          }, 1000);
        }
      }
    } else {
      this.props.updateNewState(true);
      const index = this.state.userData.findIndex((people) => people.userId == id);
      let val = {};
      val = this.state.userData[index];
      val.type = 'onetoone';
      val.groupMembers = [String(val.userId), String(URL_DATA.userId)];
      val.groupName = (val.userId - URL_DATA.userId) > 0 ?
        URL_DATA.userId + '-' + val.userId : val.userId + '-' + URL_DATA.userId;
      this.props.onSelectChannel(val);
      setTimeout(() => {
        this.setState({defaultPage: 0, page: 0}, () => {
          $('#contentList').scrollTop(
              $('#contentList')[0].scrollHeight,
          );
        });
        // this.loadChannelList(this.state.page);
        this.loadDefaultUserList(0);
      }, 1000);
      await this.setState({comapanyList: true});
    }
  };

  // ---------------- Handle People Changes at Run Time End ----------
  // ----------------- Second Page API -------------------------------

  // ------ Search for CompanyResellerId and app User Start -------
  searchUser = async (val) => {
    await this.setState({defaultPage: 0, page: 0});
    this.loadDefaultUserList(this.state.defaultPage, val);
  }

  handleBlank = async (e) => {
    const val = await this.state.defaultSearch;
    if (e.charCode == '13') {
      await this.searchUser(val);
    }
  }

  // ------ Search for CompanyResellerId and app User End ----------

  // --- Call APi for Default People (CompanyResellerId and app User) Start --------
  loadDefaultUserList = async (page, val='') => {
    if (URL_DATA && page == 0) {
      this.user = URL_DATA.userId;
    }
    const body = {};
    if (this.props.notSearchgroup) {
      body['page']= page,
      body['companyResellerId']= URL_DATA.companyResellerId,
      body['userId']= URL_DATA.userId,
      body['searchType']='global',
      body['searchParameter']= await Object.keys(this.props.serachobj)[0],
      Object.keys(this.props.serachobj)[0] ? body['searchParameter'] = Object.keys(this.props.serachobj)[0] : delete body['searchParameter'],
      Object.keys(this.props.filterObj)[0] ? body['filterParameter'] = Object.keys(this.props.filterObj)[0] : delete body['filterParameter'],
      this.props.searchValue.length ? body['userName']= this.props.searchValue : delete body['userName'];
    } else {
      body['page']= page,
      body['companyResellerId']= URL_DATA.companyResellerId,
      body['userId']= URL_DATA.userId,
      body['searchType']='global',
      val.length ? body['userName'] = val : delete body['userName'];
    }
    const response = await fetchApi({
      method: 'post',
      reqUrl: URL_DATA.userType == 'vendor'? url.VENDOR_ALL : url.USER_ALL,
      data: body,
    });
    this.maxtotalPagePeople = await response.data.data.totalpage;
    if (response && response.status == 200) {
      response.data.data.data.forEach((element, i) => {
        if (element.userId == this.state.userId) {
          response.data.data.data.splice(i, 1);
        }
      });
      if (page == 0) {
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
  openPeopleAccordian() {
    this.props.accordianOpen('people');
  }
  closePeopleAccordian() {
    this.props.accordianOpen('');
  }

  handleDefaultPeople = async (e) => {
    await this.setState({
      [e.target.name]: e.target.value,
    });
    if (this.state.defaultSearch.length > 1 || this.state.defaultSearch.length ==0 ) {
      this.searchUser(this.state.defaultSearch);
    }
  }

  unPinPeople = async (val) => {
    if (val.groupId && val.groupId != '' && val.groupId != undefined) {
      let body = {
        groupId: val.groupId,
        userId: URL_DATA.userId,
      };

      const response = await fetchApi({
        method: 'put',
        reqUrl: url.UN_PIN_GROUP,
        data: body,
      });

      if (response.data.status == 'Success') {
        // toatsr.success(response.data.message);
        toatsr.success('People successfully unpinned');
        await this.setState({
          page: 0,
        });
        await this.loadChannelList(0);
      } else {
        toatsr.error(response.data.message);
      }
    }
  }

  pinPeople = async (val) => {
    if (val.groupId && val.groupId != '' && val.groupId != undefined) {
      let body = {
        groupId: val.groupId,
        userId: URL_DATA.userId,
      };

      const response = await fetchApi({
        method: 'put',
        reqUrl: url.PIN_GROUP,
        data: body,
      });

      if (response.data.status == 'Success') {
        // toatsr.success(response.data.message);
        toatsr.success('People successfully pinned');
        await this.setState({
          page: 0,
        });
        await this.loadChannelList(0);
      } else {
        // toatsr.error(response.data.message);
        toatsr.error('Maximum number of allowed pinned people reached');
      }
    }
  }

  // ----  Call APi for Default People (CompanyResellerId and app User) End  --------

  render() {
    return (
      <div className="deal-inbox customScroll" id="peopleInbox">
        <Collapsible trigger="People" open={
          (URL_DATA.userType == 'app') ?
          (this.props.chatOpen == 'people') ? true : false : true
        } onTriggerOpening={()=>this.openPeopleAccordian()} onTriggerClosing={()=>this.closePeopleAccordian()}>
          {this.props.deviceType==='WEB' ?
           this.state.comapanyList ?
            <a id="myBtn" className="arrow" href="#" style={{'marginRight': '40px'}} onClick={() => this.setState({comapanyList: false})}>
              <span className="plusminusAccordian"></span>
            </a> :
            <a className="arrow sublistarrow" href="#" style={{'marginRight': '40px'}} onClick={() => this.setState({comapanyList: true})}>
              <span className="plusminusAccordian"></span>
            </a>:<></>}
          {this.state.comapanyList && !this.props.notSearchgroup ?
            <div className="lists" id="contentList">
              {this.state.data &&
                this.state.data.map((singleData, i) => {
                  return (
                    <div
                      className="list"
                      key={i}
                      // onClick={() => this.onChannelChange(singleData && singleData.userId, singleData.groupName)}
                    >
                      <div onClick={() => this.onChannelChange(singleData && singleData.userId, singleData.groupName)}>
                        <div className="user-img">
                          {
                          singleData && singleData.groupName ?
                            <span className={`status ${this.props.online && this.props.online.users && Object.keys(this.props.online.users).findIndex((id) => id == singleData.userId) > -1 ? 'online' : 'offline'}`}></span> : ''
                          }
                          <a href="#">
                            {singleData.profileImage.length > 10 ?
                            <img src={controlerpServerurl + singleData.profileImage} /> : <img src={imageServerurl + imgUrl.AVATAR1} />
                            }
                          </a>
                        </div>
                        <a href="#" className="user-text " id="active__user">
                          {
                          singleData && singleData.userName && this.props && this.props.channel && this.props.channel.userName == singleData.userName ?
                            <span className="active">{singleData.userName}</span> : <span>{singleData.userName}</span>
                          }
                          {/* {this.props.isTypping && singleData.type == "onetoone" ?
                          singleData.groupName == this.props.userTyping.groupName && this.props.userTyping.user != this.props.channel.userName
                            ? <p className="type-msg"><strong>... {this.props.userTyping.message}</strong></p> : ""
                          : ""
                        } */}
                          {
                          this.props && this.props.userTyping && this.props.isTypping && singleData.type == 'onetoone' ?
                          this.state.userTypingData[this.state.userTypingData.findIndex((j) => j.groupName == singleData.groupName)] ?
                          <p className="type-msg">
                            <strong>...{this.state.userTypingData[0].message}</strong> </p> : '':
                          ''
                          }
                          {this.props.deviceType==='MOBILE' &&
                        <span className="descText">{singleData.message}</span>
                          }
                        </a>
                      </div>
                      {this.props.deviceType==='MOBILE' && (
                        <div className="time-notification">
                          {/* {moment(singleData.updatedAt).format("LT")} */}
                          <span className="timeData">
                            {moment(singleData.updatedAt).isSame(
                                new Date(),
                                'day',
                            ) ?
                        moment(singleData.updatedAt).format('LT') :
                        moment(singleData.updatedAt).format('L')}
                          </span>
                          {
                        this.props && this.props.unreadCount ?
                        this.state.unreadCountData.findIndex((j) => j.groupName == singleData.groupName) > -1 && this.state.unreadCountData[this.state.unreadCountData.findIndex((j) => j.groupName == singleData.groupName)].groupName != singleData.groupName ?
                        '' :
                        this.state.unreadCountData[this.state.unreadCountData.findIndex((j) => j.groupName == singleData.groupName)] ?
                        <span className="notificationNumber">{this.state.unreadCountData[this.state.unreadCountData.findIndex((j) => j.groupName == singleData.groupName)].count} </span> : '' : ''
                          }
                        </div>
                      )}

                      {this.props.deviceType==='WEB' &&
                      <div className="time-notification">
                        {/* <span className="timeData">{moment(singleData.updatedAt).format("LT")}</span> */}
                        {
                        this.props && this.props.unreadCount ?
                        this.state.unreadCountData.findIndex((j) => j.groupName == singleData.groupName) > -1 && this.state.unreadCountData[this.state.unreadCountData.findIndex((j) => j.groupName == singleData.groupName)].groupName != singleData.groupName ?
                        '' :
                        this.state.unreadCountData[this.state.unreadCountData.findIndex((j) => j.groupName == singleData.groupName)] ?
                        <span className="chat-counter">{this.state.unreadCountData[this.state.unreadCountData.findIndex((j) => j.groupName == singleData.groupName)].count} </span> : '' : ''
                        }
                      </div>
                      }
                      {singleData.isPinGroup ?
                        <img className="pinIcon" src={imageServerurl + imgUrl.UNPINGROUP} onClick={() => this.unPinPeople(singleData)} /> :
                        <img className="pinIcon" src={imageServerurl + imgUrl.PINGROUP} onClick={() => this.pinPeople(singleData)} />
                      }
                    </div>
                  );
                })
              }
              {this.props.deviceType==='MOBILE' &&this.props.isValueSearchedValue && this.state.data.length == 0 ?<span className="noFound"> No Data Found </span> :''}
            </div> :
            <>
              {!this.props.notSearchgroup?
              <div className="searchbar peopleSearch">
                <div className="formGroup">
                  <input type="text" id="searchDefaultUsers" placeholder="Search" name="defaultSearch" onKeyPress={this.handleBlank}
                    onChange={this.handleDefaultPeople} />
                  <button type="submit" className="submitbtn"
                    onClick={() => this.searchUser(this.state.defaultSearch)}>
                  </button></div>
              </div>:<></>}

              <div className="lists customScrollbar" id="contentList1">
                {this.state.userData &&
                  this.state.userData.map((singleDatas, i) => {
                    return (
                      <div
                        className="list"
                        key={i}
                        onClick={() => this.onChannelChange(singleDatas && singleDatas.userId, singleDatas.groupName)}
                      >
                        <div className="user-img">
                          <a href="#">
                            {singleDatas.profileImage.length > 10 ?
                              <img src={controlerpServerurl + singleDatas.profileImage} /> : <img src={imageServerurl + imgUrl.AVATAR1} />
                            }

                          </a>
                        </div>
                        <a href="#" className="user-text " id="active__user">
                          {singleDatas && singleDatas.userName ? singleDatas.userName : singleDatas}
                        </a>
                      </div>
                    );
                  })
                }
                {
                  this.state.userData && this.state.userData.length == 0 ? 'No Data Found' :
                    ''}
              </div>
            </>
          }
        </Collapsible>


      </div>
    );
  }
}
People.propTypes = {
  onSelectChannel: PropTypes.any,
  channel: PropTypes.any,
  socket: PropTypes.any,
  online: PropTypes.any,
  isTypping: PropTypes.any,
  userTyping: PropTypes.any,
  unreadCount: PropTypes.any,
  people: PropTypes.any,
  notSearchgroup: PropTypes.any,
  serachobj: PropTypes.any,
  searchValue: PropTypes.any,
  iconClicked: PropTypes.any,
  filterObj: PropTypes.any,
  updateNewState: PropTypes.any,
  stopTyping: PropTypes.any,
  newOnetoOne: PropTypes.any,
  handlerLoader: PropTypes.any,
  changeComponent: PropTypes.any,
  mobileSearchText: PropTypes.any,
  isValueSearchedValue: PropTypes.any,
  deviceType: PropTypes.any,
  chatOpen: PropTypes.any,
  accordianOpen: PropTypes.any,
};

export default People;
