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
import $, {data} from 'jquery';
import {isBrowser} from 'react-device-detect';
import moment from 'moment';
import toatsr from './../iZtoast/iZtoast';
const imageServerurl = process.env.REACT_APP_IMAGE_SERVER_URL;

class GeneralChat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      channels: [],
      page: 0,
      isTypping: false,
      chatCount: true,
      userTyping: [],
      unreadCount: 0,
      userId: '',
      newGroup: '',
      unreadCountData: [],
    };
    this.maxtotalPage = 0;
    this.offsetHeight = 0;
    this.flag = true;
    this.unReadArray = [];
  }

  // Call When Component very first time
  async componentDidMount() {
    await this.loadChannelList(this.state.page);
    const val = URL_DATA;
    if (val.deal_id != false) {
      await this.defaultGroupConnect();
    } else {
      this.redirecttoGroup();
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
      if (localStorage.getItem('redirectquote')) {
        const redirectquoteName= localStorage.getItem('redirectquote');
        this.onChannelChange(redirectquoteName);
        localStorage.removeItem('redirectquote');
      }
    }
  }

      // ----------------------- Check Pagination Conditions Start ---------------------
      infiniteScroll = async () => {
        if (this.props.deviceType==='MOBILE' ) {
          if (document.getElementById('commonChat').scrollTop + (window.innerHeight+10) >= (document.getElementById('commonChat').scrollHeight)) {
            if (this.state.page < this.maxtotalPage -1) {
              await this.setState({
                page: this.state.page + 1,
              });
              await this.loadChannelList(this.state.page);
            }
          }
        } else {
          this.offsetHeight = document.getElementById('commonDeallist').offsetHeight;
          if (this.offsetHeight/2 < (document.getElementById('commonDeallist').scrollTop) && this.state.page < this.maxtotalPage -1 ) {
            this.offsetHeight = document.getElementById('commonDeallist').scrollTop;
            await this.setState({
              page: this.state.page + 1,
            });
            await this.loadChannelList(this.state.page);
          }
        }
      };
      // --------------------- Check Pagination Conditions End -------------------------

      // ----------- Redirect to the Group ------------------

        redirecttoGroup = async () =>{
          const localStorageId= localStorage.getItem('collaborationGroupId');
          if (localStorageId) {
            const updatedUrl = await url.GROUP_DETAILS + '/' + localStorageId;
            const response = await fetchApi({method: 'get', param: updatedUrl});
            if (response.data.code == 200 && response.data.data.type == 'quote') {
              this.onChannelChange(response.data.data.groupName);
              localStorage.removeItem('collaborationGroupId');
            }
          }
        }

        // ------------ Redirect to Group End --------------

        // ----------------- Socket Emit Start -----------------

      socketConnection = () => {
        this.props.socket.on(socketEmit.REFRESH_GLOBAL_GROUP_MEMBER, (data) => {
          if (data) {
            // if(data.memberId == URL_DATA.userId || data.senderId == URL_DATA.userId) Need to Review this Condition Again
            if (data.senderId == URL_DATA.userId || data.memberId == URL_DATA.userId) {
              this.loadChannelList(0);
            }
          }
        });
        this.props.socket.on(socketEmit.NEW_GROUP_CREATE, (data) => {
          if (data) {
            if (!this.state.newGroup) {
              setTimeout(() => {
                this.setState({page: 0});
                this.loadChannelList(0);
                this.setState({
                  newGroup: data,
                });
              }, 500);
            }
          }
        });

        this.props.socket.on(socketEmit.UPDATE_DEAL_NAME, (data) => {
          if (data) {
            const groupMemberIndex = data.groupMembers.indexOf(URL_DATA.userId);
            if (groupMemberIndex>-1) {
              if (data.oldGruopName == this.props.channel.groupName) {
                this.connectWithSameGroup(data);
              } else {
                this.setState({page: 0});
                this.loadChannelList(this.state.page);
              }
            }
          }
        });
      }

      // --------------- Socket Emit End -------------------
      connectWithSameGroup = async (data)=>{
        await this.setState({page: 0});
        await this.loadChannelList(this.state.page);
        await this.onChannelChange(data.groupName);
      }

      updateCustomList = async (val) => {
        await this.setState({
          channels: val,
        });
      };

      // Manage All Socket and Other Changes in app-Chat
      async componentDidUpdate(prevProps) {
        if (this.props.socket !== null && prevProps.socket !== this.props.socket) {
          // await this.loadChannelList(0);
          this.setState({newGroup: ''});
          // if (document.getElementById("commonDeallist")) {
          //   document
          //   .getElementById("commonDeallist")
          //   .addEventListener("scroll", this.infiniteScroll);
          // }
        } else {
          if (this.props.deviceType==='MOBILE' ) {
            document.getElementById('commonChat')
                .addEventListener('scroll', this.infiniteScroll);
          } else {
            if (document.getElementById('commonDeallist')) {
              document
                  .getElementById('commonDeallist')
                  .addEventListener('scroll', this.infiniteScroll);
            }
          }
        }
        if (this.props && this.props.custom && prevProps.custom !== this.props.custom) {
          await this.updateCustomList(this.props.custom);
        }
        if (this.props.unreadCount && prevProps.unreadCount !== this.props.unreadCount) {
          await this.setState({
            chatCount: false,
            page: 0,
          });
          await this.loadChannelList(this.state.page);
        }
        if (this.props.socket != prevProps.socket) {
          this.socketConnection();
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
            const numData = this.unReadArray.reduce(function(n, value) {
              return n + (value.groupId == obj.groupId);
            }, 0);
            if (numData == 0) {
              await this.unReadArray.push(obj);
              await this.setState({
                unreadCountData: await this.unReadArray,
              });
            }
          }
        }
        // prevProps.notSearchgroup != this.props.notSearchgroup ||
        if (prevProps.refreshdeals != this.props.refreshdeals) {
          await this.setState({page: 0});
          await this.loadChannelList(this.state.page);
        }

        if (prevProps.newOnetoOne != this.props.newOnetoOne ) {
          const groupMemberIndex = this.props.newOnetoOne.sendTo.indexOf(URL_DATA.userId);
          if (groupMemberIndex>-1) {
            await this.setState({page: 0});
            await this.loadChannelList(this.state.page);
          }
        }

        if (this.props.deviceType==='MOBILE' ) {
          if (this.props.isValueSearchedValue !== null && prevProps.isValueSearchedValue !== this.props.isValueSearchedValue) {
            await this.setState({page: 0});
            this.loadChannelList(this.state.page);
          }
        }
      }

      handleAPIcount = async () => {
        setTimeout(() => {
          this.state.channels.forEach((val, i) => {
            if (val.unread) {
              const numData = this.unReadArray.reduce(function(n, value) {
                return n + (value.groupId == val.groupId);
              }, 0);
              if (numData ==0) {
                val.count = val.unread;
                val.groupId= val.id;
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
            await this.setState({
              unreadCountData: await this.unReadArray,
            });
          }
        } else {
          for (let i = 0; i < numData; i++) {
            if (this.state.unreadCountData.findIndex((j) => j.groupName == val) > -1) {
              this.unReadArray.splice(this.state.unreadCountData.findIndex((j) => j.groupName == val), 1);
              await this.setState({
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
        const body = {};
        body['type']= 'custom',
        body['userId']= URL_DATA.userId,
        body['page']= page;
          this.props.deviceType==='MOBILE' && this.props.mobileSearchText.length? body['groupName'] = this.props.mobileSearchText : delete body['groupName'];
          const response = await fetchApi({
            method: 'post',
            reqUrl: url.LOAD_CHANNEL_LIST,
            data: body,
          });
          this.maxtotalPage = response.data.data.totalpage;
          if (response && response.data && response.status == 200 && this.state.page <= this.maxtotalPage) {
            if (page == 0) {
              if (this.props.deviceType==='MOBILE' ) await this.props.handlerLoader(false);
              await this.setState({
                channels: response.data.data.data,
              }, () => {
                $('#commonDeallist').scrollTop(
                    $('#commonDeallist')[0],
                );
              },
              );
            } else {
              await this.setState({
                channels: this.state.channels.concat(response.data.data.data),
              });
              await this.handleAPIcount();
            // await this.props.handlerLoader(true);
            }
            if (this.state.newGroup) {
              this.connectWithnewGroup();
            }
          }
      };

      // -------------- Get Data From the API End ---------------------------

      // -------------- Default Connection With Group Start ----------------------
      connectWithnewGroup() {
        this.onChannelChange(this.state.newGroup.groupName);
        this.setState({newGroup: ''});
      }

      defaultGroupConnect() {
        if (URL_DATA && this.flag) {
          this.user = URL_DATA;
          if (this.user.deal_id != 'false' && this.flag) {
            this.state.channels.forEach((val) => {
              if (val.dealId == this.user.deal_id) {
                this.flag = false;
                this.onChannelChange(val.groupName);
              }
            });
          }
        }
      }
      // -------------- Default Connection With Group End ----------------------


      // ---------------- Handle Group Changes at Run Time Start ------------------
      onChannelChange = async (id) => {
        this.removeCount(id);
        if (this.props.deviceType==='MOBILE' ) this.props.changeComponent('');
        const index = this.state.channels.findIndex(
            (channel) => channel.groupName == id,
        );
        if (index >= 0) {
          if (this.props.socket) {
            this.props.socket.disconnect();
          }
          this.props.onSelectChannel(this.state.channels[index]);
        }
      };

      openCustomAccordian() {
        this.props.accordianOpen('custom');
      }
      closeCustomAccordian() {
        this.props.accordianOpen('');
      }

      unPinGroup = async (val) => {
        if (val.id && val.id != '' && val.id != undefined) {
          let body = {
            groupId: val.id,
            userId: URL_DATA.userId,
          };

          const response = await fetchApi({
            method: 'put',
            reqUrl: url.UN_PIN_GROUP,
            data: body,
          });

          if (response.data.status == 'Success') {
            // toatsr.success(response.data.message);
            toatsr.success('Group successfully unpinned');
            await this.setState({
              page: 0,
            });
            await this.loadChannelList(0);
          } else {
            toatsr.error(response.data.message);
          }
        }
      }

      pinGroup = async (val) => {
        if (val.id && val.id != '' && val.id != undefined) {
          let body = {
            groupId: val.id,
            userId: URL_DATA.userId,
          };

          const response = await fetchApi({
            method: 'put',
            reqUrl: url.PIN_GROUP,
            data: body,
          });

          if (response.data.status == 'Success') {
            // toatsr.success(response.data.message);
            toatsr.success('Group successfully pinned');
            await this.setState({
              page: 0,
            });
            await this.loadChannelList(0);
          } else {
            // toatsr.error(response.data.message);
            toatsr.error('Maximum number of allowed pinned group reached');
          }
        }
      }


      // ---------------- Handle Group Changes at Run Time End  ------------------

      // --------------------- Java Script XML  aka (HTML Code)  ---------------------
      render() {
        return (
          <div className="deal-inbox customScroll" id="commonChat">
            <Collapsible trigger="Internal Groups" open={this.props.chatOpen == 'custom' ? true : false} onTriggerOpening={()=>this.openCustomAccordian()} onTriggerClosing={()=>this.closeCustomAccordian()}>
              <div className="lists" id="commonDeallist">
                {!this.props.notSearchgroup ?
                this.state.channels &&
                  this.state.channels.map((channel, i) => {
                    return (
                      <div
                        className="list"
                        key={i}
                        // onClick={() =>
                        //   this.onChannelChange(channel.groupName)
                        // }
                      >
                        <div onClick={() =>
                          this.onChannelChange(channel.groupName)
                        }>
                          <div className="user-img">
                            <a href="#">
                              <img src={imageServerurl + imgUrl.GROUP} />
                            </a>
                          </div>
                          <a href="#" className="user-text " title={channel.groupName}>
                            {
                            channel && channel.groupName && this.props && this.props.channel.groupName == channel.groupName ?
                              <span className="active">{channel.groupName}</span> : <span>{channel.groupName}</span>
                            }

                            {this.props && this.props.groupChannel &&this.props.groupChannel.groupName ?
                            this.props.isTypping ?
                              channel.groupName == this.props.userTyping.groupName && this.props.userTyping.user != this.props.groupChannel.users[this.state.userId].userName ?
                                <p className="type-msg"><strong>....<b> {this.props.userTyping.user} </b> </strong> {this.props.userTyping.message}  </p> : '' :
                              '' : this.props.isTypping && channel.groupName == this.props.userTyping.groupName ? <p className="type-msg"><strong>....<b> {this.props.userTyping.user} </b> </strong> {this.props.userTyping.message}  </p> : ''}
                            {this.props.deviceType==='MOBILE' && <span className="descText">{channel.message}</span>}
                          </a>
                        </div>
                        {this.props.deviceType==='MOBILE' &&
                          <div className="time-notification">
                            <span className="timeData">
                              {moment(channel.updatedAt).isSame(
                                  new Date(),
                                  'day',
                              )?
                                  moment(channel.updatedAt).format('LT') :
                                  moment(channel.updatedAt).format('L')}
                            </span>
                            { !channel.unread==0 && (
                              <span className="notificationNumber">{channel.unread}</span>
                            )}
                          </div>}
                        {channel.isPinGroup ?
                      <img className="pinIcon" src={imageServerurl + imgUrl.UNPINGROUP} onClick={() => this.unPinGroup(channel)} /> :
                      <img className="pinIcon" src={imageServerurl + imgUrl.PINGROUP} onClick={() => this.pinGroup(channel)} />
                        }
                        {
                          this.props.deviceType==='WEB' &&
                          this.props && this.props.unreadCount ?
                          this.state.unreadCountData.findIndex((j) => j.groupName == channel.groupName) > -1 && this.state.unreadCountData[this.state.unreadCountData.findIndex((j) => j.groupName == channel.groupName)].groupName != channel.groupName ?
                          '' :
                          this.state.unreadCountData[this.state.unreadCountData.findIndex((j) => j.groupName == channel.groupName)] && isBrowser ?
                          <span className="chat-counter">{this.state.unreadCountData[this.state.unreadCountData.findIndex((j) => j.groupName == channel.groupName)].count} </span> : '' : ''
                        }
                      </div>
                    );
                  }):'NO Deal Available'}
                {
                   this.props.custom && this.state.channels && this.state.channels.length == 0 && !this.props.notSearchgroup ? 'No Group Found' :
                    ''}
                {this.props.deviceType==='MOBILE' && this.props.isValueSearchedValue && this.state.channels.length == 0 ?<span className="noFound"> No Deal Found </span> :''}
              </div>
            </Collapsible>
          </div>
        );
      }
}

// All Reciving Props in this Compnent
GeneralChat.propTypes = {
  onSelectChannel: PropTypes.any,
  socket: PropTypes.any,
  isTypping: PropTypes.any,
  userTyping: PropTypes.any,
  unreadCount: PropTypes.any,
  custom: PropTypes.any,
  groupChannel: PropTypes.any,
  channel: PropTypes.any,
  notSearchgroup: PropTypes.any,
  refreshdeals: PropTypes.any,
  newOnetoOne: PropTypes.any,
  handlerLoader: PropTypes.any,
  changeComponent: PropTypes.any,
  mobileSearchText: PropTypes.any,
  isValueSearchedValue: PropTypes.any,
  deviceType: PropTypes.any,
  chatOpen: PropTypes.any,
  accordianOpen: PropTypes.any,
};
export default GeneralChat;
