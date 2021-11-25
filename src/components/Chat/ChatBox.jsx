/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable no-var */
import React, {Component, Fragment} from 'react';
import {ContextMenu, MenuItem, ContextMenuTrigger} from 'react-contextmenu';
import PropTypes from 'prop-types';
import url from '../../Barriers/UrlStream';
import fetchApi from '../../Barriers/fetchApi';
import moment from 'moment';
import $ from 'jquery';
import 'emoji-mart/css/emoji-mart.css';
import {Picker} from 'emoji-mart';
import socketEmit from '../../Barriers/socketEmit';
import oddoAPI from '../../Barriers/oddoAPI';
const ss = require('socket.io-stream');
import imgUrl from '../../Barriers/imagePath';
import URL_DATA from '../../Barriers/URLValues';
import toatsr from './../iZtoast/iZtoast';
const imgServerurl = process.env.REACT_APP_IMAGE_SERVER_URL;
const controlerpServerurl = process.env.REACT_APP_CONTROL_ERP_SERVER_IMG;


class ChatBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      input_value: '',
      isTyping: false,
      showTypingMessage: false,
      data: null,
      chat: [],
      id: null,
      page: 0,
      loading: false,
      tempData: [],
      showAddessUser: false,
      showEmojiPicker: false,
      memberList: null,
      searchText: '',
      selectedFile: 0,
      controlId: '',
      groupName: '',
      isUserinGroup: true,
      userName: '',
      userImage: '',
      removeUsersData: '',
      showQuoteButton: false,
      mobileQuoteData: '',
      showMobileQuoteButton: false,
      showQuotetoolTip: false,
      messageId: 0,
      quoteData: '',
      showQuoteStyle: false,
      quoteMessageId: 0,
      leftHandClickButton: true,
      leftLocation: 0,
      TopLocation: 0,
      loader: false,
      scrollCount: 0,
      scrollPosition: 0,
    };
    this.maxPageLimit = 0;
    this.timeStamp = moment().format('h:mm:ss');
  }

  infiniteScroll = async () => {
    if (this.state.page < this.maxPageLimit - 1) {
      const position = await document.getElementById('messageContainer').scrollTop;
      document.getElementById('messageContainer').addEventListener('scroll',
          async () => {
            const scroll = await document.getElementById('messageContainer').scrollTop;
            if (scroll > position) { } else {
              await this.setState({scrollCount: this.state.scrollCount +1});
              let scrollCondtition = (document.getElementById('messageContainer').scrollTop - 10) <= 0;
              if (this.state.scrollCount > 70 && scrollCondtition) {
                if (this.state.page < this.maxPageLimit - 1) {
                  await this.setState({page: this.state.page + 1, loading: false, scrollCount: 0, scrollPosition: position});
                  await this.loadChat(this.state.page);
                  document.getElementById('messageContainer').scrollTop = await this.state.scrollPosition-30;
                }
              }
            }
          });
    }
  };

    removeUsersList = async (groupId) => {
      const updatedUrl = url.GROUP_DETAILS + '/' + groupId;
      const resp = await fetchApi({method: 'get', param: updatedUrl});
      this.setState({removeUsersData: resp.data.data.removedUsers});
      const val = resp.data.data.groupMembers;
      const index = val.indexOf(URL_DATA.userId);
      if (index < 0) {
        this.setState({
          isUserinGroup: false,
        });
      } else {
        this.setState({isUserinGroup: true});
      }
    }
    componentDidMount() {
      if (this.props.deviceType==='MOBILE' ) {
        this.setMobileDynamicHeight();
      }
      this.clearQuote();
    }

    setMobileDynamicHeight() {
      if (URL_DATA.userType=='reseller' || URL_DATA.userType=='vendor') {
        const windowHeight = $(window).innerHeight();
        const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
        const divHeight= $('.mobileTopheader').height();
        const topStripHeight = $('.top-strip').height();
        const messageHeight = $('.message-input').height();
        const MarginTops= (divHeight+topStripHeight)+4;
        let FinalChatHeight = (windowHeight-(divHeight+topHeight+topStripHeight +messageHeight)-55);
        FinalChatHeight = this.state.isUserinGroup ==false ? FinalChatHeight-5 : FinalChatHeight;
        $('.customChatScroll').height(FinalChatHeight);
        $('.customChatScroll').css('margin-top', MarginTops);
        // $(".customChatScroll").scrollTop($(".customChatScroll")[0].scrollHeight);
      }
      if (URL_DATA.userType=='app') {
        const headerbackendHeight = $('header').height() ? $('header').height() :0;
        const windowHeight = $(window).innerHeight();
        const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
        const divHeight= $('.mobileTopheader').height();
        const topStripHeight = $('.top-strip').height();
        const messageHeight = $('.message-input').height();
        const MarginTops= (divHeight+topStripHeight)-4;
        let FinalChatHeight = (windowHeight-(divHeight+topHeight+topStripHeight +messageHeight)-50);
        FinalChatHeight =this.state.isUserinGroup ==false ? FinalChatHeight-5 : FinalChatHeight;
        if ($('.reactbackendChatmodule').height()) {
          FinalChatHeight = FinalChatHeight-headerbackendHeight;
        }
        if (URL_DATA.baseMenu=='horizontal') {
          $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('bottom', '50px');
          $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('position', 'fixed');
          // $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('border','1px solid orange');
          FinalChatHeight= FinalChatHeight-55;
        }
        // else if(URL_DATA.baseMenu=="vertical"){
        //     $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('bottom','50px');
        //     $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('position','fixed');
        // }
        // URL_DATA.baseMenu=="horizontal" ? $(".customChatScroll").height(FinalChatHeight-45):
        $('.customChatScroll').height(FinalChatHeight);
        $('.customChatScroll').css('margin-top', MarginTops);
        $('.top-strip').css('top', divHeight);
        $('#dealBoxcontent .top-strip .backLink').css('margin-left', '0px');
      }
    }


    socketConnection = async () => {
      const AllgroupMembers = this.props.channel['groupMembers'];
      const index = AllgroupMembers.indexOf(URL_DATA.userId);
      await AllgroupMembers.splice(index, 1);
      await this.setState({
        memberList: AllgroupMembers,
      });
      this.props.socket.on(socketEmit.RECEIVED, (data) => {
        const messageData = {
          groupName: data.groupName,
          message: data.message,
          senderId: parseInt(data.senderId),
          createdAt: new Date(),
          isFile: data.isFile ? true : false,
          fileName: data.fileName ? data.fileName : '',
          size: data.size ? data.size : '',
          userName: data.userName ? data.userName : '',
          _id: data._id,
          quoteMessage: data.quoteMessage ? data.quoteMessage : '',
          isBroadcast: data.isBroadcast,
          readUserIds: data.readUserIds ? data.readUserIds : '',
          sendTo: data.sendTo ? data.sendTo : '',
          type: data.type,
        };
        let inData= this.state.chat.findIndex((j) => j._id == data._id);
        if (this.state.isUserinGroup && data.groupName == this.props.channel.groupName && inData == -1) {
          const newChat = this.state.chat;
          newChat.push(messageData);
          this.setState({
            chat: newChat,
          });
        }
        $('#messageContainer').scrollTop($('#messageContainer')[0].scrollHeight);
      });

      // End get message
      this.props.socket.on(socketEmit.NOTIFY_TYPING, (data) => {
        this.setState({showTypingMessage: true, id: data});
      });
      this.props.socket.on(socketEmit.STOP_TYPING, (data) => {
      });
      this.props.socket.on(socketEmit.NOTIFY_TYPING_GLOBAL, (data) => {
        this.setState({showTypingMessage: false, id: data});
      });
      this.props.socket.on(socketEmit.NEW_CHAT_CONNECT, (data) => {
        if (data) {
          this.pushReadUserID(data);
        }
      });


      this.props.socket.on(socketEmit.REFRESH_CHAT_HISTORY_GLOBAL, (data) => {
        if (data && data.groupName == this.props.channel.groupName) {
          const val = this.userInfo();
          this.setState({
            userName: val.name,
            userImage: val.image_1920,
          });
          this.setState({
            page: 0,
            chat: [],
            data: null,
            selectedFile: 0,
            groupName: this.props.channel.groupName,
            scrollCount: 0,
          });
          if (document.getElementById('file-list-scroll')) {
            document.getElementById('file-list-scroll').classList.remove('fileuploadShow');
          }
          if (this.state.selectedFile.length > 0) {
            document.getElementById('messageContainer').style.maxHeight = '54vh';
          }
          document
              .getElementById('messageContainer')
              .addEventListener('scroll', this.infiniteScroll);
          this.maxPageLimit = 0;
          if (this.props.channel.type == 'quote' || this.props.channel.type == 'custom') {
            this.removeUsersList(this.props.channel.id);
          }
          this.loadChat(0);
          this.setState({input_value: ''});
        }
      });

      this.props.socket.on(socketEmit.REFRESH_GLOBAL_GROUP_MEMBER, (data) => {
        if (data.groupName == this.props.channel.groupName) {
          const msgName = 'Your Deal ' + data.groupName + ' has been generated';
          if (msgName != data.message) {
            const messageData = {
              groupName: data.groupName,
              message: data.message,
              senderId: parseInt(data.senderId),
              createdAt: new Date(),
              isFile: data.isFile ? true : false,
              fileName: data.fileName ? data.fileName : '',
              size: data.size ? data.size : '',
              userName: data.userName ? data.userName : '',
              isBroadcast: true,
              _id: data._id,
            };
            let inData= this.state.chat.findIndex((j) => j._id == data._id);
            if (this.state.isUserinGroup && data.groupName == this.props.channel.groupName && inData == -1) {
              const newChat = this.state.chat;
              newChat.push(messageData);
              this.setState({
                chat: newChat,
              });
            }
            if (this.props.channel.id) {
              this.removeUsersList(this.props.channel.id);
            }
          }
        }
      });
    };

    pushReadUserID = async (data) => {
      if (this.state.chat.length) {
        const newChat = await this.state.chat;
        newChat.forEach((val, index) => {
          if (val.groupName == data.groupName && val.sendTo && val.readUserIds) {
            if (!(_.isEqual(val.sendTo.sort(), val.readUserIds.sort()))) {
              newChat[index].readUserIds.push(data.senderId);
              this.setState({
                chat: newChat,
              });
            }
          }
        });
      }
      const apiChat = this.state.data;
      if (apiChat && apiChat!= null && apiChat.length>0 ) {
        apiChat.forEach((val, index) => {
          for (const [key, value] of Object.entries(val)) {
            for (const [childIndex, childValue] of Object.entries(value)) {
              if (!(_.isEqual(childValue.sendTo.sort(), childValue.readUserIds.sort()))) {
                childValue.readUserIds.push(data.senderId);
                this.setState({
                  data: apiChat,
                });
              }
            }
          }
        });
      }
    }

    userInfo = async () => {
      const body = {};
      body['reseller_id'] = parseInt(URL_DATA.userId);
      const response = await oddoAPI({
        method: 'post',
        reqUrl: url.USER_INFO,
        data: body,
      });
      if (response.data.result.status_code == 200) {
        return response.data.result.data;
      } else {
        return '----';
      }
    }

    async componentDidUpdate(prevProps) {
      if (this.props.socket !== null && prevProps.socket !== this.props.socket && this.props.channel.groupName) {
        if (document.getElementById('loading') && document.getElementById('progess-bar-width')) {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('progess-bar-width').style.width = '0%';
        }
        // if (this.props.channel.type == "onetoone") {
        const val = await this.userInfo();
        this.setState({
          userName: val.name,
          userImage: val.image_1920,
        });
        // }
        await this.setState({
          page: 0,
          chat: [],
          data: null,
          selectedFile: 0,
          groupName: this.props.channel.groupName,
          removeUsersData: '',
          showQuoteButton: false,
          mobileQuoteData: '',
          showMobileQuoteButton: false,
          showQuotetoolTip: false,
          messageId: 0,
          quoteData: '',
          showQuoteStyle: false,
          quoteMessageId: 0,
          leftHandClickButton: true,
          leftLocation: 0,
          TopLocation: 0,
          scrollCount: 0,
          scrollPosition: 0,
        });
        await this.clearQuote();

        document
            .getElementById('messageContainer')
            .addEventListener('scroll', this.infiniteScroll);
        this.maxPageLimit = 0;
        this.socketConnection();
        if (this.props.channel.type == 'quote') {
          this.removeUsersList(this.props.channel.id);
        }

        if (document.getElementById('file-list-scroll')) {
          document.getElementById('file-list-scroll').classList.remove('fileuploadShow');
        }
        // if (this.state.selectedFile.length > 0) {
        //   document.getElementById('messageContainer').style.maxHeight = '54vh';
        // }
        // if (this.state.selectedFile.length > 0) {
        //   document.getElementById('messageContainer').style.maxHeight = '65vh';
        // }

        if (document.getElementById('messageContainer')) {
          document.getElementById('messageContainer').addEventListener('scroll', this.infiniteScroll);
        }
        this.maxPageLimit = 0;
        this.socketConnection();
        if (this.props.channel.type == 'quote' || this.props.channel.type == 'custom') {
          this.removeUsersList(this.props.channel.id);
        }
        await this.props.handlerLoader(true);
        if (this.props.deviceType==='MOBILE' ) {
          this.props.chatComponentToggle('chat');
        }
        await this.loadChat(0);
        this.setState({
          input_value: '',
        });
        if (this.props.deviceType==='MOBILE' ) {
          this.setMobileDynamicHeight();
        }
        document.getElementById('messageContainer').style.maxHeight = '54vh';
      } else {
        if (this.props.deviceType==='MOBILE' ) {
          if (URL_DATA.userType == 'reseller' || URL_DATA.userType == 'vendor') {
            const windowHeight = $(window).innerHeight();
            const divHeight= $('.mobileTopheader').height();
            const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
            const topStripHeight = $('.top-strip').height();
            const messageHeight = $('.message-input').height();
            const MarginTops= (divHeight+topStripHeight)+4;
            let FinalChatHeight = (windowHeight-(divHeight+topHeight+topStripHeight +messageHeight)-55);
            FinalChatHeight = this.state.isUserinGroup ==false ? FinalChatHeight-5 : FinalChatHeight;
            $('.customChatScroll').height(FinalChatHeight);
            $('.customChatScroll').css('margin-top', MarginTops);
            if (document.getElementById('messageContainer')) {
              document.getElementById('messageContainer').addEventListener('scroll', this.infiniteScroll);
            }
            // $("#messageContainer").scrollTop($("#messageContainer")[0].scrollHeight);
          } else if (URL_DATA.userType=='app') {
            const headerbackendHeight = $('header').height() ? $('header').height() :0;
            const windowHeight = $(window).innerHeight();
            const divHeight= $('.mobileTopheader').height();
            const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
            const topStripHeight = $('.top-strip').height();
            const messageHeight = $('.message-input').height();
            const MarginTops= (divHeight+topStripHeight)-4;
            let FinalChatHeight = (windowHeight-(divHeight+topHeight+topStripHeight +messageHeight)-50);
            FinalChatHeight = this.state.isUserinGroup ==false ? FinalChatHeight-5 : FinalChatHeight;
            if ($('.reactbackendChatmodule').height()) {
              FinalChatHeight = FinalChatHeight-headerbackendHeight;
            }
            if (URL_DATA.baseMenu=='horizontal') {
              $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('bottom', '50px');
              $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('position', 'fixed');
              // $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('border','1px solid green');
              FinalChatHeight=FinalChatHeight-50;
            }
            // }else if(URL_DATA.baseMenu=="vertical"){
            //     $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('bottom','50px');
            //     $('.reactbackendChatmodule .right-col .user-chatcontent .message-input').css('position','fixed');
            //     FinalChatHeight=FinalChatHeight-100;
            // }
            $('.customChatScroll').height(FinalChatHeight);
            $('.customChatScroll').css('margin-top', MarginTops);
            $('#dealBoxcontent .top-strip .backLink').css('margin-left', '0px');
            if (document.getElementById('messageContainer')) {
              document.getElementById('messageContainer').addEventListener('scroll', this.infiniteScroll);
            }
          }
          if (prevProps.isVendorDetailsOpen == true && this.props.isVendorDetailsOpen == false) {
            this.setState({
              page: 0,
              chat: [],
              data: null,
              selectedFile: 0,
              groupName: this.props.channel.groupName,
            });
            this.loadChat(0);
            this.setState({input_value: ''});
          }
          if (prevProps.isuserProfileopen == true && this.props.isuserProfileopen == false) {
            this.setState({
              page: 0,
              chat: [],
              data: null,
              selectedFile: 0,
              groupName: this.props.channel.groupName,
            });
            this.loadChat(0);
            this.setState({input_value: ''});
          }
        }
      }
    }


    loadChat = async (page) => {
      if (page <= this.maxPageLimit) {
        const {channel} = this.props;
        if (!this.state.loading) {
          this.setState({
            loading: true,
          });
          if (channel.type == 'quote' || channel.type == 'custom') {
            var updatedUrl =
                        url.GET_OLD_CHAT +
                        '?uniqueId=' +
                        encodeURIComponent(channel.groupName) +
                        '&perPage=10' +
                        '&page=' +
                        page + '&userId=' + Number(URL_DATA.userId);
          } else {
            const points = [channel.userId, parseInt(URL_DATA.userId)];
            const a = points.sort(function(a, b) {
              return a - b;
            });
            var updatedUrl =
                        url.GET_OLD_CHAT + '?uniqueId=' + a[0] + '-' + a[1] +
                        '&perPage=10' + '&page=' + page + '&userId=' + Number(URL_DATA.userId);
          }
          const response = await fetchApi({method: 'get', param: updatedUrl});
          await this.props.handlerLoader(false);
          const tempArray = [];
          const oldChatData = this.state.data;
          for (const [key, value] of Object.entries(
              response.data.data.data,
          )) {
            const obj = {};
            if (this.state.data) {
              for (const [index, valueData] of oldChatData.entries()) {
                if (key == Object.keys(valueData)[0]) {
                  const tempOldData = value.concat(Object.values(valueData)[0]);
                  valueData[Object.keys(valueData)[0]] = tempOldData;
                  oldChatData[index] = valueData;
                } else {
                  obj[key] = value;
                  tempArray.push(obj);
                }
                break;
              }
            } else {
              obj[key] = value;
              tempArray.push(obj);
            }
          }
          if (this.state.page > 0 && oldChatData) {
            oldChatData.forEach((value) => {
              tempArray.push(value);
            });
          }
          this.maxPageLimit = response.data.data.totalpage;
          this.setState({
            data: tempArray,
            page: this.state.page,
            loading: false,
            tempData: tempArray,
          }, () => {
            if (page == 0) {
              if (document.getElementById('messageContainer')) {
                $('#messageContainer').scrollTop(
                    $('#messageContainer')[0].scrollHeight,
                );
              }
            }
          });
        }
      }
    };

    handleInput = async (e) => {
      // if (e.nativeEvent.data == "@") {
      //     this.setState({
      //         showAddessUser: true,
      //     });
      // }
      // if (this.state.showAddessUser && !e.target.value.includes("@")) {
      //     this.setState({
      //         showAddessUser: false,
      //         searchText: "",
      //         memberList: this.props.channel["groupMembers"],
      //     });
      // } else if (this.state.showAddessUser) {
      //     var newMemberList = this.state.memberList.filter((member) => {
      //         return member.includes(this.state.searchText + e.nativeEvent.data);
      //     });
      //     this.setState({
      //         memberList: newMemberList,
      //         searchText: this.state.searchText + e.nativeEvent.data,
      //     });
      // }
      await this.setState({input_value: e.target.value});
      if (this.state.input_value.length == 0) this.clearQuote();
    };

    addEmoji = (e) => {
      const emoji = e.native;
      this.setState({
        input_value: this.state.input_value + emoji,
      });
    };

    selectUser = (e) => {
      this.setState({
        input_value:
                this.state.input_value.split('@')[0] + '@' + this.props.channel.users[e.target.id].userName + ' ',
        showAddessUser: false,
      });
    };

    handleSendMessage = async () => {
      const {channel} = this.props;
      const currentUser = this.state.userName;
      if (this.state.input_value || this.state.selectedFile.length) {
        if (channel.type !== 'quote' || channel.type !== 'custom' ) {
          const points = [
            channel.groupName,
            parseInt(URL_DATA.userId),
          ];
          const a = points.sort(function(a, b) {
            return a - b;
          });
        }

        if (this.file != null) {
          document.getElementById('loading').style.display = 'block';
          this.fileUpload(channel);
        }
        if (!this.state.quoteMessageId) document.getElementById('file-upload').value = '';
        // document.getElementById('file-upload').value = '';
        // / Changes
        this.setState({
          showEmojiPicker: false,
          input_value: '',
          selectedFile: 0,
        }, () => {
          $('#messageContainer').scrollTop(
              $('#messageContainer')[0].scrollHeight,
          );
        });

        //
        if (this.file == null) {
          this.props.socket.emit(
              socketEmit.CHAT_MESSAGE,
              this.state.input_value,
              URL_DATA.userId,
              {custome: true, name: 'custom'},
              channel.type,
              this.state.groupName,
                    // this.props.channel.users[parseInt(URL_DATA.userId)].userName
                    this.props.channel.type == 'quote' || this.props.channel.type == 'custom' ?
                        this.props.channel.users[parseInt(URL_DATA.userId)] ? this.props.channel.users[parseInt(URL_DATA.userId)].userName :
                            this.state.removeUsersData[String(URL_DATA.userId)][1] :
                        currentUser, null, this.state.quoteMessageId ? this.state.quoteMessageId : null,
              // one to one in case send my Name
          );
        }
        this.file = null;
      } else {
        // alert("Please Enter Some Message or Attach File!!");
        toatsr.error('Please Enter Some Message or Attach File!!');
      }
      document.getElementById('file-list-scroll').classList.remove('fileuploadShow');
      document.getElementById('messageContainer').style.maxHeight = '54vh';
      if (this.state.quoteMessageId) {
        await this.clearQuote();
      }
    };

    // When user starts typing
    startTyping = async (e) => {
      if (e.charCode == 13 && !e.shiftKey ) {
        this.handleSendMessage();
        e.preventDefault();
        return;
      }
      this.setState({
        isTyping: true,
      });

      const newDate = moment(e.timeStamp).format('h:mm:ss');

      if (this.timeStamp != newDate) {
        this.props.socket.emit(socketEmit.TYPING, {
          user: this.props.channel.type == 'quote' || this.props.channel.type == 'custom' ? this.props.channel.users[parseInt(URL_DATA.userId)].userName :
                    this.props.channel.userName,
          message: 'is typing',
          senderId: URL_DATA.userId,
          type: this.props.channel.type,
        });
      }
      this.timeStamp = newDate;
    };

    // When user stops typing
    removeTyping = () => {
      if (this.state.isTyping) {
        setTimeout(() => {
          this.setState({
            isTyping: false,
          });
        }, 3000);

        setTimeout(() => {
          this.props.socket.emit(socketEmit.STOP_TYPING, {
            user: this.props.channel.type == 'quote' || this.props.channel.type == 'custom' ? this.props.channel.users[parseInt(URL_DATA.userId)].userName :
                        this.props.channel.userName,
            message: 'is typing...',
            senderId: URL_DATA.userId,
            type: this.props.channel.type,
          });
        }, 8000);
      }
    };

    handleShowEmojiPicker = () => {
      this.setState({
        showEmojiPicker: !this.state.showEmojiPicker,
      });
    };

    attachFile = (e) => {
      this.setState({
        input_value: e.target.files[0],
      });
    };

    onFileChange = async (event) => {
      const val = event.target.files;
      if (val.length > 0) {
        document.getElementById('file-list-scroll').classList.add('fileuploadShow');
        document.getElementById('messageContainer').style.maxHeight = '47vh';
        // ReactDOM.findDOMNode(element)
      }
      const newArr = [];
      let i;
      for (i = 0; i < val.length; i++) {
        newArr.push(val[i]);
        this.file = val[i];
        const _size = Math.ceil(val[i] / 1000);
        const allowedExtension = ['png', 'jpg', 'jpeg', 'docx', 'csv', 'pdf', 'xls'];
        if (!allowedExtension.includes(val[i].name.split('.').pop())) {
          // alert("File Type is invalid, Please Choose Antoher File!");
          toatsr.error('File Type is invalid, Please Choose Antoher File!');
          document.getElementById('file-upload').value = '';
          this.setState({
            input_value: '',
          });

          document.getElementById('file-list-scroll').classList.remove('fileuploadShow');
          document.getElementById('messageContainer').style.maxHeight = '54vh';

          return false;
        }
        if (_size > 300) {
          // alert("File size only 30 MB allowed !");
          toatsr.error('File size only 30 MB allowed !');
          document.getElementById('file-upload').value = '';
          this.setState({
            input_value: '',
          }); document.getElementById('file-list-scroll').classList.remove('fileuploadShow');
          document.getElementById('messageContainer').style.maxHeight = '54vh';
          return false;
        }
      }

      await this.setState({selectedFile: newArr});
      event.target.value = '';
    }

    fileUpload = async (DATA) => {
      const textInput = this.state.input_value;
      const socket = this.props.socket;
      const controlId = this.state.controlId;
      const groupName = this.state.groupName;
      const UserName = this.state.userName;
      // let i;
      let files;
      const message = textInput;
      const stream = ss.createStream();
      files = this.state.selectedFile[0];
      const fileIndexExe= files.name.split('.');
      let removeFileNameSpace = fileIndexExe[0].replace(' ', '_');
      const currentTimeStamp = new Date().getTime();
      let today = new Date();
      let hour= today.getHours() < 10 ? '0'+today.getHours() : today.getHours();
      let minute = today.getMinutes() < 10 ? '0'+today.getMinutes() : today.getMinutes();
      let sec = today.getSeconds() < 10 ? '0'+today.getSeconds() : today.getSeconds();
      let time = `${hour}${minute}${sec}`;
      const newFileName= await `${removeFileNameSpace}_${time}_w.${fileIndexExe[fileIndexExe.length-1]}`;
      ss(socket).emit(socketEmit.FILE_UPLOAD, stream,
          {
            timesize: files.size, name: newFileName,
            senderId: parseInt(URL_DATA.userId),
          });

      let size = 0;
      let uploadFileSizeLength = 0;
      let fileUploadPercentage = 0;
      uploadFileSizeLength = files.size;

      const blobStream = ss.createBlobReadStream(files);

      blobStream.on('data', function(chunk) {
        if (controlId == 'file-upload') {
          $('#progressBarSecond').attr('class', '');
        } else {
          $('#progressBar').attr('class', '');
        }
        size += chunk.length;
        if (
          controlId == 'file-upload') {
          $('#progressBarSecond').attr('value', Math.floor(size / uploadFileSizeLength * 100));
        } else {
          $('#progressBar').attr('value', Math.floor(size / uploadFileSizeLength * 100));
        }
        fileUploadPercentage = Math.floor(size / uploadFileSizeLength * 100);
        document.getElementById('progess-bar-width').style.width = fileUploadPercentage+'%';
      });
      blobStream.on('end', function() {
        setTimeout(() => {
          socket.emit(socketEmit.FILE_MESSAGE,
              {
                size: files.size,
                name: newFileName,
                senderId: URL_DATA.userId,
                metadata: {custome: true, name: 'app'}, type: DATA.type,
                message: message,
                groupName: groupName,
                userName: UserName,
                plateform: 'web',
              });
          document.getElementById('loading').style.display = 'none';
          document.getElementById('progess-bar-width').style.width = '0%';
        }, 500);
      });
      blobStream.pipe(stream);
      //  }
    };

    handleDownload = async (i) => {
      console.log(i);
      await this.props.handlerLoader(true);
      if (i.isFile) {
        const body = {};
        if (i._id) {
          body['id'] = i._id;
        } else {
          body['groupName'] = i.groupName;
          body['fileName'] = i.fileName;
        }
        const response = await fetchApi({
          method: 'post',
          reqUrl: url.DOWNLOAD_FILE,
          data: body,
        });
        console.log('response', response);
        if (response.data.code == 200) {
          try {
            let url;
            if (i.fileType == '.pdf') {
              url = `data:application/pdf;base64,${response.data.data.fileUrl}`;
            } else url =`data:image/png;base64,${response.data.data.fileUrl}`;
            console.log(url);
            const anchorEle = document.createElement('a');
            anchorEle.href = url;
            anchorEle.download=i.fileName;
            document.body.appendChild(anchorEle);
            anchorEle.click();
            anchorEle.remove();
          } catch (e) {
            alert('catch' + e);
            console.log('error', e);
          }
        }
        await this.props.handlerLoader(false);
      }
      // const dataUrl = await this.toDataURL(img[0]);
      // alert('download complete'+ dataUrl);
      // // console.log('DataUrl ==>>>', dataUrl);
      // // const linkSource = ;
      // let imagePath = img[0].split('/');
      // a.href = "data:image/png;base64," + ImageBase64;
      // const linkSource = `data:${contentType};base64,${base64Data}`;
      // const linkSource = `data:image/png;base64,${response.data.data.fileUrl}`;
      // console.log(linkSource);
      // const downloadLink = document.createElement('a');
      // // const fileName = imagePath[imagePath.length-1];
      // const fileName = i.fileName;
      // downloadLink.href = linkSource;
      // downloadLink.download = fileName;
      // downloadLink.click();
      // console.log('RESULT:', dataUrl);
    }

    // async toDataURL(url) {
    //   const data = await fetch(url);
    //   alert(data);
    //   const blob = await data.blob();
    //   return new Promise((resolve) => {
    //     const reader = new FileReader();
    //     reader.readAsDataURL(blob);
    //     reader.onloadend = () => {
    //       const base64data = reader.result;
    //       resolve(base64data);
    //     };
    //   });
    // }

    handleOddoDownload = async (i) => {
      window.open(
          i.fileUrl,
          '_blank',
      );
    }

    async popImages(i) {
      const filterArray = this.state.selectedFile;
      filterArray.splice(i, 1);

      await this.setState({
        selectedFile: filterArray,
      });
      if (this.state.selectedFile.length == 0) {
        document.getElementById('file-list-scroll').classList.remove('fileuploadShow');
        document.getElementById('messageContainer').style.maxHeight = '65vh';
      }
    }
    // --------------- Quote Message -----------------------
    quoteMessage = async (val) => {
      if (!val.isFile && this.state.isUserinGroup && val.isBroadcast == false) {
        await this.setState({showQuoteButton: true, messageId: val._id, leftHandClickButton: true});
      }
    }
    removeQuoteButton = async () => {
      await this.setState({showQuoteButton: false, showQuotetoolTip: false, messageId: 0, leftHandClickButton: false});
    }
    quoteData = async (val) => {
      await this.setState({quoteData: val, showQuoteStyle: true, quoteMessageId: val._id, leftHandClickButton: false, showMobileQuoteButton: false});
      if (this.state.showQuoteStyle) {
        // if (this.props.deviceType == 'MOBILE') {
        //   $('#messageContainer').css('maxHeight', '54vh !important');
        // } else $('#messageContainer').css('maxHeight', '40vh');
        if (this.props.deviceType == 'MOBILE') {
          if (URL_DATA.userType == 'app') {
            $('#messageContainer').addClass('quoteMaxHeight');
            $('.quoteContent').css('bottom', '70px');
          } else $('.quoteContent').css('bottom', '0px');
        } else $('#messageContainer').css('maxHeight', '44vh');
        // document.getElementById('messageContainer').style. = this.props.deviceType == 'MOBILE' ? '54vh !important' : '40vh';
        if (document.getElementById('messageContainer')) {
          $('#messageContainer').scrollTop(
              $('#messageContainer')[0].scrollHeight,
          );
        }
      }
    }

    clearQuote = async () => {
      if (this.state.quoteMessageId && document.getElementById('messageContainer')) {
        // document.getElementById('messageContainer').style.maxHeight = '54';
        if (this.props.deviceType == 'MOBILE') {
          $('#messageContainer').removeClass('quoteMaxHeight');
        } else $('#messageContainer').css('maxHeight', '54vh');
      }
      await this.setState({
        showQuoteButton: false,
        showQuotetoolTip: false,
        showQuoteStyle: false,
        messageId: 0,
        quoteData: '',
        quoteMessageId: 0,
        leftHandClickButton: true,
      });
    }

    showToolTip = async () => {
      await this.setState({
        showQuotetoolTip: true,
        leftHandClickButton: false,
      });
      if (this.props.deviceType == 'MOBILE') {
        $('#messageContainer').css('maxHeight', '54vh !important');
      }
      // else $('#messageContainer').css('maxHeight', '40vh');
      // document.getElementById('messageContainer').style.maxHeight = '54vh';
    }


    handleLeftQuoteClick = async (e, data) => {
      await this.quoteData(data);
    };

    showMobileToolTip = async (messageData) => {
      if (this.state.showMobileQuoteButton == false) {
        await this.setState({
          showMobileQuoteButton: true,
          mobileQuoteData: messageData,
        });
      } else {
        await this.setState({
          showMobileQuoteButton: false,
        });
      }
    }

    render() {
      return (
        <Fragment>
          {this.props.channel && this.props.channel.groupName && this.props.hideState? (
                    <div className="user-chatcontent">
                      <div className="loading_message fileuploadLoader" id="loading" style={{display: 'none'}}>
                        <div className="progress">
                          <div className="progress-bar" id="progess-bar-width" role="progressbar"
                            aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                      </div>
                      <div className="chat-history customChatScroll" id="messageContainer" >
                        {this.state.data &&
                                this.state.data.map((value) => {
                                  return Object.values(value).map((res, index) => {
                                    return (
                                      <Fragment
                                        key={index}>
                                        <h5 className="title">
                                          {moment(Object.keys(value)[index]).isSame(
                                              new Date(),
                                              'day',
                                          ) ?
                                                        'Today' :
                                                        Object.keys(value)[index]}
                                        </h5>
                                        {res.map((messageData, i) => {
                                          if (
                                            parseInt(messageData.senderId) ==
                                                        URL_DATA.userId && (messageData.fileUrl == null || messageData.fileUrl=='')
                                          ) {
                                            return (
                                              <div className="reply-message-outer" key={i} onMouseEnter={() => this.quoteMessage(messageData)} onMouseLeave={() => {
                                                this.removeQuoteButton();
                                              }}>
                                                {
                                                                    !messageData.isBroadcast ?
                                                                        <>
                                                                          <ContextMenuTrigger id={messageData._id}>
                                                                            <div className="reply-message">
                                                                              {/* {
                                                                                        this.state.leftHandClickButton && this.state.messageId == messageData._id ?
                                                                                            <div className="rtMsg tooltipMsg" id={"meh"} style={{ left: this.state.leftLocation - 366 }} onClick={() => this.leftHandClick(messageData)}>Quote</div>
                                                                                            : <> </>
                                                                                    } */}

                                                                              {this.state.showQuoteButton ?
                                                                                        this.state.messageId == messageData._id ?
                                                                                            <span className="dotIndicator" onClick={() => this.showToolTip()} title={'More options'}><i className="fa fa-ellipsis-v"></i></span> :
                                                                                            <></> : <></>}
                                                                              {this.state.showQuoteButton && this.state.showQuotetoolTip ?
                                                                                        this.state.messageId == messageData._id ?
                                                                                            <div className="linkPopuphover" onClick={() => this.quoteData(messageData)}><span>Reply</span></div> : <></> : <></>}

                                                                              {
                                                                                this.props.deviceType == 'MOBILE' && !messageData.isFile && this.state.isUserinGroup && messageData.isBroadcast == false ?
                                                                                <span className="dotIndicator" onClick={() => this.showMobileToolTip(messageData)} title={'More options'}><i className="fa fa-ellipsis-v"></i></span> :
                                                                                            <></>
                                                                              }
                                                                              {
                                                                                this.props.deviceType == 'MOBILE' && this.state.showMobileQuoteButton ?
                                                                                 this.state.mobileQuoteData._id == messageData._id ?
                                                                                <div className="linkPopuphover" onClick={() => this.quoteData(messageData)}><span>Reply</span></div> : <></> :<></>
                                                                              }

                                                                              <span>
                                                                                {moment(messageData.createdAt).format(
                                                                                    'LT',
                                                                                )}
                                                                                {
                                                                                            messageData.type == 'onetoone' ?
                                                                                                _.isEqual(messageData.sendTo.sort(), messageData.readUserIds.sort()) ?
                                                                                                    <img className="MessageStatus" src={imgServerurl + imgUrl.GREEN_TICK} /> :
                                                                                                    <img className="MessageStatus" src={imgServerurl + imgUrl.GREY_TICK} /> : <></>
                                                                                }
                                                                                {
                                                                                            messageData.type == 'quote' || messageData.type == 'custom' ?
                                                                                                _.isEqual(messageData.sendTo.sort(), messageData.readUserIds.sort()) ?
                                                                                                    <img className="MessageStatus" src={imgServerurl + imgUrl.GREEN_TICK} /> :
                                                                                                    <img className="MessageStatus" src={imgServerurl + imgUrl.GREY_TICK} /> : <></>
                                                                                }
                                                                              </span>

                                                                              <div className={messageData.quoteMessage ? 'message ImageContainer nonormalMsg' :
                                                                                        'message ImageContainer'}>
                                                                                {messageData.quoteMessage ?
                                                                                            <div className="replyQuoteuser">
                                                                                              <i className="fa fa-quote-left quoteIcon"></i>
                                                                                              <span className="userMsgquote">{messageData.quoteMessage.message}</span>
                                                                                              <span className="quoteusernameTime">
                                                                                                <span className="quoteUsname">
                                                                                                  {
                                                                                                            this.props && this.props.channel && this.props.channel.type == 'onetoone' ?
                                                                                                                this.props && this.props.channel && this.props.channel.type == 'onetoone' &&
                                                                                                                    this.props.channel.users && this.props.channel.users[messageData.quoteMessage.senderId] &&
                                                                                                                    this.props.channel.users[messageData.quoteMessage.senderId].userName ?
                                                                                                                    this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' : '' :
                                                                                                                this.props && this.props.channel && this.props.channel.type == 'quote' &&
                                                                                                                    this.props.channel.users[messageData.quoteMessage.senderId] ? this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' :
                                                                                                                    this.state.removeUsersData[messageData.quoteMessage.senderId] ? this.state.removeUsersData[messageData.quoteMessage.senderId][1] + ', ' : ''
                                                                                                  }
                                                                                                  {
                                                                                                    this.props && this.props.channel && this.props.channel.type == 'custom' &&
                                                                                                    this.props.channel.users[messageData.quoteMessage.senderId] ? this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' :
                                                                                                    this.state.removeUsersData[messageData.quoteMessage.senderId] ? this.state.removeUsersData[messageData.quoteMessage.senderId][1] + ', ' : ''

                                                                                                  }
                                                                                                </span>
                                                                                                <span className="userDatetime">
                                                                                                  {moment(messageData.quoteMessage.createdAt).isSame(
                                                                                                      new Date(),
                                                                                                      'day',
                                                                                                  ) ?
                                                                                                            'Today' :
                                                                                                            moment(messageData.quoteMessage.createdAt).format('LL')}
                                                                                                  <span className="userAt">at</span>
                                                                                                  {moment(messageData.quoteMessage.createdAt).format('LT')}
                                                                                                </span>
                                                                                              </span>
                                                                                              <span className="userreplyMsg">{messageData.message}</span>
                                                                                            </div> :
                                                                                            <>
                                                                                              <p>{messageData.message == 'File Attahed' ? '' : messageData.message}</p>
                                                                                              {messageData.isFile == true ?
                                                                                                    <p onClick={() => {
                                                                                                      this.handleDownload(messageData);
                                                                                                    }}>
                                                                                                      {messageData.isFile == true ?
                                                                                                            < img className="ImageSize" src={imgServerurl + imgUrl.ATTACH_FILE} /> :
                                                                                                            <></>}
                                                                                                      <span className="fileName">
                                                                                                        {messageData && messageData.fileName && messageData.fileName.length > 10 ? <strong title={messageData.fileName}> {messageData.fileName.slice(0, 15) + '...'} </strong> :
                                                                                                                <strong>
                                                                                                                  {messageData.fileName}
                                                                                                                </strong>}
                                                                                                      </span>
                                                                                                      <span className="fileSize">{
                                                                                                            messageData && messageData.size && messageData.size != NaN ?
                                                                                                                messageData.size / 100 + 'Kb' : ''} </span>
                                                                                                    </p> : <></>}
                                                                                            </>}
                                                                              </div>
                                                                            </div>
                                                                          </ContextMenuTrigger>
                                                                          {this.state.leftHandClickButton ?
                                                                                <ContextMenu className="menu" id={messageData._id} >
                                                                                  <MenuItem
                                                                                    onClick={this.handleLeftQuoteClick}
                                                                                    data={messageData}
                                                                                    className="menuItem"
                                                                                  >
                                                                                        Reply
                                                                                  </MenuItem>
                                                                                </ContextMenu> :
                                                                                <></>}
                                                                        </> :
                                                                        !messageData.fileUrl ?
                                                                            <div className="middleChat mbspace-0">{messageData.message}</div> :
                                                                            <div className="reply-message" >
                                                                              <span>
                                                                                {moment(messageData.createdAt).format(
                                                                                    'LT',
                                                                                )}
                                                                              </span>
                                                                              <div className="message ImageContainer">
                                                                                <p style={{'whiteSpace': 'pre-line'}}>{messageData.message == 'File Attached' ? '' : messageData.message}</p>
                                                                                {messageData.fileUrl ?
                                                                                        <div className="pdf-quote">
                                                                                          <div className="pdf-icon" onClick={() => {
                                                                                            this.handleOddoDownload(messageData);
                                                                                          }}>
                                                                                            <img className="imageSize" src={imgServerurl + imgUrl.PDF_ICON} />
                                                                                          </div>
                                                                                          <div className="quote-text">

                                                                                            {messageData && messageData.fileName && messageData.fileName.length > 10 ?
                                                                                                    <span title={messageData.fileName}> {messageData.fileName + '...'} </span> :
                                                                                                    messageData.fileName}

                                                                                            {/* <span className="size newBlankSize"></span> */}
                                                                                          </div>
                                                                                        </div> : <span></span>}
                                                                              </div>

                                                                            </div>
                                                }
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="chat-history-outer" key={i} onMouseEnter={() => this.quoteMessage(messageData)} onMouseLeave={() => {
                                                this.removeQuoteButton();
                                              }}>
                                                {
                                                                    !messageData.isBroadcast ?
                                                                        <>
                                                                          <ContextMenuTrigger id={messageData._id}>
                                                                            {/* {
                                                                                    this.state.leftHandClickButton && this.state.messageId == messageData._id ?
                                                                                        <div className="tooltipMsg ltMsg" style={{ right: this.state.TopLocation + 0 }} onClick={() => this.leftHandClick(messageData)}>Quote</div>
                                                                                        : <> </>
                                                                                } */}
                                                                            {this.state.showQuoteButton ?
                                                                                    this.state.messageId == messageData._id ?
                                                                                        <span className="dotIndicator" onClick={() => this.showToolTip()} title={'More options'}><i className="fa fa-ellipsis-v"></i></span> : <></> : <></>}
                                                                            {this.state.showQuoteButton && this.state.showQuotetoolTip ?
                                                                                    this.state.messageId == messageData._id ?
                                                                                    <div className="linkPopuphover" onClick={() => this.quoteData(messageData)}><span>Reply</span></div> : <></> : <></>}

                                                                            {
                                                                                this.props.deviceType == 'MOBILE' && !messageData.isFile && this.state.isUserinGroup && messageData.isBroadcast == false ?
                                                                                <span className="dotIndicator" onClick={() => this.showMobileToolTip(messageData)} title={'More options'}><i className="fa fa-ellipsis-v"></i></span> :
                                                                                            <></>
                                                                            }
                                                                            {
                                                                                this.props.deviceType == 'MOBILE' && this.state.showMobileQuoteButton ?
                                                                                 this.state.mobileQuoteData._id == messageData._id ?
                                                                                <div className="linkPopuphover" onClick={() => this.quoteData(messageData)}><span>Reply</span></div> : <></> :<></>
                                                                            }

                                                                            <div className="user-img" >
                                                                              {

                                                                                        this.props && this.props.channel && this.props.channel.users ?
                                                                                            this.props.channel.users[messageData.senderId] ?
                                                                                                <img src={controlerpServerurl + this.props.channel.users[messageData.senderId].profileImage} /> :
                                                                                                this.state.removeUsersData[messageData.senderId] ? <img src={controlerpServerurl + this.state.removeUsersData[messageData.senderId][2]} /> : <img src={imgServerurl + imgUrl.AVATAR1} /> :
                                                                                            <img src={imgServerurl + imgUrl.AVATAR1} />
                                                                              }
                                                                            </div>
                                                                            <div className="user-history" >
                                                                              <div className="user-details-time" >
                                                                                {
                                                                                this.props && this.props.channel && this.props.channel.type == 'onetoone' ?
                                                                                this.props.channel.userName : ''
                                                                                }
                                                                                {
                                                                                this.props && this.props.channel && this.props.channel.type == 'quote' &&
                                                                                this.props.channel.users[messageData.senderId] ? this.props.channel.users[messageData.senderId].userName :
                                                                                this.state.removeUsersData[messageData.senderId] ? this.state.removeUsersData[messageData.senderId][1] : ''
                                                                                }
                                                                                {
                                                                                this.props && this.props.channel && this.props.channel.type == 'custom' ?
                                                                                this.props && this.props.channel && this.props.channel.type == 'custom' &&
                                                                                this.props.channel.users[messageData.senderId] ? this.props.channel.users[messageData.senderId].userName :
                                                                                this.state.removeUsersData[messageData.senderId] ? this.state.removeUsersData[messageData.senderId][1] : '' :''
                                                                                }
                                                                                <span>
                                                                                  {moment(messageData.createdAt).format(
                                                                                      'LT',
                                                                                  )}
                                                                                </span>
                                                                              </div>
                                                                              <div className={messageData.quoteMessage ? 'history-content ImageContainer nonormalMsg' :
                                                                                        'history-content ImageContainer'}>
                                                                                {messageData.quoteMessage ?
                                                                                            <div className="leftuserquoteMsg replyQuoteuser">
                                                                                              <i className="fa fa-quote-left quoteIcon"></i>
                                                                                              <span className="userMsgquote">{messageData.quoteMessage.message}</span>
                                                                                              <span className="quoteusernameTime">
                                                                                                <span className="quoteUsname">
                                                                                                  {
                                                                                                            this.props && this.props.channel && this.props.channel.type == 'onetoone' ?
                                                                                                                this.props && this.props.channel && this.props.channel.type == 'onetoone' &&
                                                                                                                    this.props.channel.users && this.props.channel.users[messageData.quoteMessage.senderId] &&
                                                                                                                    this.props.channel.users[messageData.quoteMessage.senderId].userName ?
                                                                                                                    this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' : '' :
                                                                                                                this.props && this.props.channel && this.props.channel.type == 'quote' &&
                                                                                                                    this.props.channel.users[messageData.quoteMessage.senderId] ? this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' :
                                                                                                                    this.state.removeUsersData[messageData.quoteMessage.senderId] ? this.state.removeUsersData[messageData.quoteMessage.senderId][1] + ', ' : ''
                                                                                                  }

                                                                                                  {
                                                                                                    this.props && this.props.channel && this.props.channel.type == 'custom' &&
                                                                                                    this.props.channel.users[messageData.quoteMessage.senderId] ? this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' :
                                                                                                    this.state.removeUsersData[messageData.quoteMessage.senderId] ? this.state.removeUsersData[messageData.quoteMessage.senderId][1] + ', ' : ''

                                                                                                  }

                                                                                                </span>

                                                                                                <span className="userDatetime">
                                                                                                  {moment(messageData.quoteMessage.createdAt).isSame(
                                                                                                      new Date(),
                                                                                                      'day',
                                                                                                  ) ?
                                                                                                            'Today' :
                                                                                                            moment(messageData.quoteMessage.createdAt).format('LL')}
                                                                                                  <span className="userAt">at</span>
                                                                                                  {moment(messageData.quoteMessage.createdAt).format('LT')}
                                                                                                </span>
                                                                                              </span>
                                                                                              <span className="userreplyMsg">{messageData.message}</span>
                                                                                            </div> :
                                                                                            <>
                                                                                              <p>{messageData.message == 'File Attahed' ? '' : messageData.message} </p>
                                                                                              {messageData.isFile == true ?
                                                                                                    <p onClick={() => {
                                                                                                      this.handleDownload(messageData);
                                                                                                    }}>
                                                                                                      {messageData.isFile == true ?
                                                                                                            < img className="ImageSize" src={imgServerurl + imgUrl.ATTACH_FILE} /> :
                                                                                                            ''}
                                                                                                      <span className="fileName">
                                                                                                        {messageData && messageData.fileName && messageData.fileName.length > 10 ? <strong title={messageData.fileName}> {messageData.fileName.slice(0, 15) + '...'} </strong> :
                                                                                                                <strong>
                                                                                                                  {messageData.fileName}
                                                                                                                </strong>}
                                                                                                      </span>
                                                                                                      <span className="fileSize">{
                                                                                                            messageData && messageData.size && messageData.size != NaN ?
                                                                                                                + messageData.size / 100 + 'Kb' : ''} </span>
                                                                                                    </p> : <></>}
                                                                                            </>}
                                                                              </div>
                                                                            </div>
                                                                          </ContextMenuTrigger>
                                                                          {this.state.leftHandClickButton ?
                                                                                <ContextMenu className="menu" id={messageData._id} >
                                                                                  <MenuItem
                                                                                    onClick={this.handleLeftQuoteClick}
                                                                                    data={messageData}
                                                                                    className="menuItem"
                                                                                  >
                                                                                        Reply
                                                                                  </MenuItem>
                                                                                </ContextMenu> :
                                                                                <></>}
                                                                        </> :
                                                                        !messageData.fileUrl ?
                                                                            <div className="middleChat ">{messageData.message}</div> :
                                                                            <>
                                                                              <div className="user-img">
                                                                                <img src={imgServerurl + imgUrl.app_ICON} />
                                                                              </div>
                                                                              <div
                                                                                className="user-history"
                                                                                key={i}
                                                                              >
                                                                                <div className="user-details-time" >
                                                                                        app
                                                                                  <span>
                                                                                    {moment(messageData.createdAt).format(
                                                                                        'LT',
                                                                                    )}
                                                                                  </span>
                                                                                </div>
                                                                                <div className="history-content ImageContainer">

                                                                                  <p style={{'whiteSpace': 'pre-line'}}>{messageData.message == 'File Attached' ? '' : messageData.message}</p>
                                                                                  {messageData.fileUrl ?
                                                                                            <div className="pdf-quote">
                                                                                              <div className="pdf-icon" onClick={() => {
                                                                                                this.handleOddoDownload(messageData);
                                                                                              }}>
                                                                                                <img className="imageSize" src={imgServerurl + imgUrl.PDF_ICON} />
                                                                                              </div>
                                                                                              <div className="quote-text">

                                                                                                {messageData && messageData.fileName && messageData.fileName.length > 10 ?
                                                                                                        <span title={messageData.fileName}> {messageData.fileName + '...'} </span> :
                                                                                                        messageData.fileName}

                                                                                                {/* <span className="size newBlankSize"></span> */}
                                                                                              </div>
                                                                                            </div> : <span></span>}
                                                                                </div>
                                                                              </div>
                                                                            </>
                                                }
                                              </div>
                                            );
                                          }
                                        })}
                                      </Fragment>
                                    );
                                  });
                                })}
                        {this.state.chat &&
                                this.state.chat.map((messageData, j) => {
                                  if (
                                    parseInt(messageData.senderId) ==
                                        URL_DATA.userId
                                  ) {
                                    return (
                                      <div className="reply-message-outer " key={j} onMouseEnter={() => this.quoteMessage(messageData)} onMouseLeave={() => {
                                        this.removeQuoteButton();
                                      }}>
                                        <ContextMenuTrigger id={messageData._id}>
                                          {/* {
                                                        this.state.leftHandClickButton && this.state.messageId == messageData._id ?
                                                            <div className="rtMsg tooltipMsg" onClick={() => this.leftHandClick(messageData)}>Quote</div>
                                                            : <> </>
                                                    } */}
                                          {this.state.showQuoteButton ?
                                                        this.state.messageId == messageData._id ?
                                                            <span className="dotIndicator" onClick={() => this.showToolTip()} title={'More options'}><i className="fa fa-ellipsis-v"></i></span> : <></> : <></>}

                                          {this.state.showQuoteButton && this.state.showQuotetoolTip ?
                                                        this.state.messageId == messageData._id ?
                                                        <div className="linkPopuphover" onClick={() => this.quoteData(messageData)}><span>Reply</span></div> : <></> : <></>}

                                          {
                                                                                this.props.deviceType == 'MOBILE' ?
                                                                                <span className="dotIndicator" onClick={() => this.showMobileToolTip(messageData)} title={'More options'}><i className="fa fa-ellipsis-v"></i></span> :
                                                                                            <></>
                                          }
                                          {
                                                                                this.props.deviceType == 'MOBILE' && this.state.showMobileQuoteButton ?
                                                                                 this.state.mobileQuoteData._id == messageData._id ?
                                                                                <div className="linkPopuphover" onClick={() => this.quoteData(messageData)}><span>Reply</span></div> : <></> :<></>
                                          }


                                          {messageData.isBroadcast ? <div className="middleChat mbspace-0">{messageData.message}</div> :

                                                        <div className="reply-message">
                                                          <span>
                                                            {moment(messageData.createdAt).format('LT')}
                                                            {
                                                                    messageData.type == 'onetoone' ?
                                                                        _.isEqual(messageData.sendTo.sort(), messageData.readUserIds.sort()) ?
                                                                            <img className="MessageStatus" src={imgServerurl + imgUrl.GREEN_TICK} /> :
                                                                            <img className="MessageStatus" src={imgServerurl + imgUrl.GREY_TICK} /> : <></>
                                                            }
                                                            {
                                                                    messageData.type == 'quote' || messageData.type == 'custom' ?
                                                                        _.isEqual(messageData.sendTo.sort(), messageData.readUserIds.sort()) ?
                                                                            <img className="MessageStatus" src={imgServerurl + imgUrl.GREEN_TICK} /> :
                                                                            <img className="MessageStatus" src={imgServerurl + imgUrl.GREY_TICK} /> : <></>
                                                            }
                                                          </span>

                                                          <div className={messageData.quoteMessage ? 'message ImageContainer nonormalMsg' :
                                                                'message ImageContainer'}>
                                                            {messageData.quoteMessage ?
                                                                    <div className="replyQuoteuser">
                                                                      <i className="fa fa-quote-left quoteIcon"></i>
                                                                      <span className="userMsgquote">{messageData.quoteMessage.message}</span>
                                                                      <span className="quoteusernameTime">
                                                                        <span className="quoteUsname">

                                                                          {
                                                                                    this.props && this.props.channel && this.props.channel.type == 'onetoone' ?
                                                                                        this.props && this.props.channel && this.props.channel.type == 'onetoone' &&
                                                                                            this.props.channel.users && this.props.channel.users[messageData.quoteMessage.senderId] &&
                                                                                            this.props.channel.users[messageData.quoteMessage.senderId].userName ?
                                                                                            this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' : '' :
                                                                                        this.props && this.props.channel && this.props.channel.type == 'quote' &&
                                                                                            this.props.channel.users[messageData.quoteMessage.senderId] ? this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' :
                                                                                            this.state.removeUsersData[messageData.quoteMessage.senderId] ? this.state.removeUsersData[messageData.quoteMessage.senderId][1] + ', ' : ''
                                                                          }

                                                                          {
                                                                             this.props && this.props.channel && this.props.channel.type == 'custom' &&
                                                                             this.props.channel.users[messageData.quoteMessage.senderId] ? this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' :
                                                                             this.state.removeUsersData[messageData.quoteMessage.senderId] ? this.state.removeUsersData[messageData.quoteMessage.senderId][1] + ', ' : ''
                                                                          }


                                                                        </span>
                                                                        <span className="userDatetime">
                                                                          {moment(messageData.quoteMessage.createdAt).isSame(
                                                                              new Date(),
                                                                              'day',
                                                                          ) ?
                                                                                    'Today' :
                                                                                    moment(messageData.quoteMessage.createdAt).format('LL')}
                                                                          <span className="userAt">at</span>
                                                                          {moment(messageData.quoteMessage.createdAt).format('LT')}
                                                                        </span>
                                                                      </span>
                                                                      <span className="userreplyMsg">{messageData.message}</span>
                                                                    </div> :
                                                                    <>
                                                                      <p>{messageData.message == 'File Attahed' ? '' : messageData.message}</p>
                                                                      {messageData.isFile == true ?
                                                                            <p onClick={() => {
                                                                              this.handleDownload(messageData);
                                                                            }}>
                                                                              {messageData.isFile == true ?
                                                                                    < img className="ImageSize" src={imgServerurl + imgUrl.ATTACH_FILE} /> :
                                                                                    <></>}

                                                                              <span className="fileName">
                                                                                {messageData && messageData.fileName && messageData.fileName.length > 10 ? <strong title={messageData.fileName}> {messageData.fileName.slice(0, 15) + '...'} </strong> :
                                                                                        <strong>
                                                                                          {messageData.fileName}
                                                                                        </strong>}
                                                                              </span>
                                                                              <span className="fileSize">{
                                                                                    messageData && messageData.size && messageData.size != NaN ?
                                                                                        messageData.size / 100 + 'Kb' : ''} </span>
                                                                            </p> : <></>}
                                                                    </>}
                                                          </div>
                                                        </div>}
                                        </ContextMenuTrigger>
                                        {this.state.leftHandClickButton ?
                                                    <ContextMenu className="menu" id={messageData._id} >
                                                      <MenuItem
                                                        onClick={this.handleLeftQuoteClick}
                                                        data={messageData}
                                                        className="menuItem"
                                                      >
                                                            Reply
                                                      </MenuItem>
                                                    </ContextMenu> :
                                                    <></>}
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="chat-history-outer" onMouseEnter={() => this.quoteMessage(messageData)} onMouseLeave={() => {
                                        this.removeQuoteButton();
                                      }}>
                                        {messageData.isBroadcast ? <div className="middleChat">{messageData.message}</div> :
                                                    <>
                                                      {this.state.showQuoteButton ?
                                                                    this.state.messageId == messageData._id ?
                                                                        <span className="dotIndicator" onClick={() => this.showToolTip()} title={'More options'}><i className="fa fa-ellipsis-v"></i></span> : <></> : <></>}

                                                      {this.state.showQuoteButton && this.state.showQuotetoolTip ?
                                                                    this.state.messageId == messageData._id ?
                                                                    <div className="linkPopuphover" onClick={() => this.quoteData(messageData)}><span>Reply</span></div> : <></> : <></>}

                                                      {
                                                                                this.props.deviceType == 'MOBILE' ?
                                                                                <span className="dotIndicator" onClick={() => this.showMobileToolTip(messageData)} title={'More options'}><i className="fa fa-ellipsis-v"></i></span> :
                                                                                            <></>
                                                      }
                                                      {
                                                                                this.props.deviceType == 'MOBILE' && this.state.showMobileQuoteButton ?
                                                                                 this.state.mobileQuoteData._id == messageData._id ?
                                                                                <div className="linkPopuphover" onClick={() => this.quoteData(messageData)}><span>Reply</span></div> : <></> :<></>
                                                      }
                                                      <ContextMenuTrigger id={messageData._id}>
                                                        <div className="user-img" >
                                                          {
                                                                    this.props && this.props.channel ?
                                                                        this.props.channel.users[messageData.senderId] ?
                                                                            <img src={controlerpServerurl + this.props.channel.users[messageData.senderId].profileImage} /> :
                                                                            this.state.removeUsersData[messageData.senderId] ? <img src={controlerpServerurl + this.state.removeUsersData[messageData.senderId][2]} /> : <img src={imgServerurl + imgUrl.AVATAR1} /> :
                                                                        <img src={imgServerurl + imgUrl.AVATAR1} />
                                                          }
                                                        </div>
                                                        <div className="user-history" key={j}>
                                                          {/* {
                                                                    this.state.leftHandClickButton && this.state.messageId == messageData._id ?
                                                                        <div className="tooltipMsg ltMsg" onClick={() => this.leftHandClick(messageData)}>Quote</div>
                                                                        : <> </>
                                                                } */}
                                                          {/* {this.state.showQuoteButton ?
                                                                    this.state.messageId == messageData._id ?
                                                                        <span className="dotIndicator" onClick={() => this.showToolTip()} title={"More options"}><i className="fa fa-ellipsis-v"></i></span> : <></> : <></>}

                                                                {this.state.showQuoteButton && this.state.showQuotetoolTip ?
                                                                    this.state.messageId == messageData._id ?
                                                                    <div className="linkPopuphover" onClick={() => this.quoteData(messageData)}><span>Reply</span></div> : <></> : <></>} */}
                                                          <div className="user-details-time">
                                                            {messageData.userName}
                                                            <span>
                                                              {moment(messageData.createdAt).format('LT')}
                                                            </span>
                                                          </div>

                                                          <div className={messageData.quoteMessage ? 'history-content ImageContainer nonormalMsg' :
                                                                    'history-content ImageContainer'}>
                                                            {messageData.quoteMessage ?
                                                                        <div className="leftuserquoteMsg replyQuoteuser">
                                                                          <i className="fa fa-quote-left quoteIcon"></i>
                                                                          <span className="userMsgquote">{messageData.quoteMessage.message}</span>
                                                                          <span className="quoteusernameTime">
                                                                            <span className="quoteUsname">
                                                                              {
                                                                                        this.props && this.props.channel && this.props.channel.type == 'onetoone' ?
                                                                                            this.props && this.props.channel && this.props.channel.type == 'onetoone' &&
                                                                                                this.props.channel.users && this.props.channel.users[messageData.quoteMessage.senderId] &&
                                                                                                this.props.channel.users[messageData.quoteMessage.senderId].userName ?
                                                                                                this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' : '' :
                                                                                            this.props && this.props.channel && this.props.channel.type == 'quote' &&
                                                                                                this.props.channel.users[messageData.quoteMessage.senderId] ? this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' :
                                                                                                this.state.removeUsersData[messageData.quoteMessage.senderId] ? this.state.removeUsersData[messageData.quoteMessage.senderId][1] + ', ' : ''
                                                                              }

                                                                              {
                                                                                 this.props && this.props.channel && this.props.channel.type == 'custom' &&
                                                                                 this.props.channel.users[messageData.quoteMessage.senderId] ? this.props.channel.users[messageData.quoteMessage.senderId].userName + ', ' :
                                                                                 this.state.removeUsersData[messageData.quoteMessage.senderId] ? this.state.removeUsersData[messageData.quoteMessage.senderId][1] + ', ' : ''

                                                                              }


                                                                            </span>
                                                                            <span className="userDatetime">
                                                                              {moment(messageData.quoteMessage.createdAt).isSame(
                                                                                  new Date(),
                                                                                  'day',
                                                                              ) ?
                                                                                        'Today' :
                                                                                        moment(messageData.quoteMessage.createdAt).format('LL')}
                                                                              <span className="userAt">at</span>
                                                                              {moment(messageData.quoteMessage.createdAt).format('LT')}
                                                                            </span>
                                                                          </span>
                                                                          <span className="userreplyMsg">{messageData.message}</span>
                                                                        </div> :
                                                                        <>

                                                                          <p>{messageData.message == 'File Attahed' ? '' : messageData.message}</p>
                                                                          {messageData.isFile == true ?
                                                                                <p onClick={() => {
                                                                                  this.handleDownload(messageData);
                                                                                }}>
                                                                                  {messageData.isFile == true ?
                                                                                        < img className="ImageSize" src={imgServerurl + imgUrl.ATTACH_FILE} /> :
                                                                                        <></>}
                                                                                  <span className="fileName">
                                                                                    {messageData && messageData.fileName && messageData.fileName.length > 10 ? <strong title={messageData.fileName}> {messageData.fileName.slice(0, 15) + '...'} </strong> :
                                                                                            <strong>
                                                                                              {messageData.fileName}
                                                                                            </strong>}
                                                                                  </span>
                                                                                  <span className="fileSize">{
                                                                                        messageData && messageData.size && messageData.size != NaN ?
                                                                                            messageData.size / 100 + 'Kb' : ''} </span>
                                                                                </p> : <></>}
                                                                        </>}
                                                          </div>
                                                        </div>
                                                      </ContextMenuTrigger>
                                                      {this.state.leftHandClickButton ?
                                                            <ContextMenu className="menu" id={messageData._id} >
                                                              <MenuItem
                                                                onClick={this.handleLeftQuoteClick}
                                                                data={messageData}
                                                                className="menuItem"
                                                              >
                                                                    Reply
                                                              </MenuItem>
                                                            </ContextMenu> :
                                                            <></>}

                                                    </>
                                        }
                                      </div>
                                    );
                                  }
                                })}
                      </div>
                      {this.state.showQuoteStyle ?
                            <div id="quote" className="quoteContent">
                              <span className="closeArrow"></span>
                              <i className="fa fa-quote-left quoteIcon"></i>
                              <p className="quoteContentbox">{this.state.quoteData.message}</p>
                              <p className="usernameTime">
                                <span className="usernamequote">
                                  {
                                            this.props && this.props.channel && this.props.channel.type == 'onetoone' ?
                                                this.props && this.props.channel && this.props.channel.type == 'onetoone' ?
                                                    this.props.channel.userName + ', ' : '' :
                                                this.props && this.props.channel && this.props.channel.type == 'quote' &&
                                                    this.props.channel.users[this.state.quoteData.senderId] ? this.props.channel.users[this.state.quoteData.senderId].userName + ', ' :
                                                    this.state.removeUsersData[this.state.quoteData.senderId] ? this.state.removeUsersData[this.state.quoteData.senderId][1] + ', ' : ''
                                  }

                                  {
                                    this.props && this.props.channel && this.props.channel.type == 'custom' &&
                                    this.props.channel.users[this.state.quoteData.senderId] ? this.props.channel.users[this.state.quoteData.senderId].userName + ', ' :
                                    this.state.removeUsersData[this.state.quoteData.senderId] ? this.state.removeUsersData[this.state.quoteData.senderId][1] + ', ' : ''
                                  }
                                </span>
                                <span className="quoteDay">
                                  {moment(this.state.quoteData.createdAt).isSame(
                                      new Date(),
                                      'day',
                                  ) ?
                                            'Today' :
                                            moment(this.state.quoteData.createdAt).format('LL')}
                                </span>
                                <span className="at">at</span>
                                <span className="timeQuote">{moment(this.state.quoteData.createdAt).format('LT')}</span>
                              </p>
                              <span onClick={() => {
                                this.clearQuote();
                              }} className="fa fa-times closeArrow"></span>
                            </div> :
                            <></>}
                      <div className="message-input">
                        {this.state.isUserinGroup || this.props.channel.type == 'onetoone' ?
                                <div className="message-type">
                                  <div className="user-img">
                                    {this.props.channel ?
                                            <img src={controlerpServerurl + this.state.userImage} /> :
                                            <img src={imgServerurl + imgUrl.AVATAR2} />
                                    }
                                  </div>
                                  <div className="formGroup borderTextarea">
                                    {this.state.showAddessUser && this.props && this.props.channel && this.props.channel.users && (
                                      <div className="searchuserlist deal-inbox">
                                        <div className="lists">
                                          {this.state.memberList &&
                                                        this.state.memberList.map((data, i) => {
                                                          return (
                                                            <div
                                                              className="list"
                                                              key={i}
                                                              id={data}
                                                              onClick={this.selectUser}
                                                            >
                                                              <p
                                                                className="user-text"
                                                                id={data}
                                                                onClick={this.selectUser}
                                                              >
                                                                {this.props.channel.users[data].userName}
                                                              </p>
                                                            </div>
                                                          );
                                                        })}
                                        </div>
                                      </div>
                                    )}
                                    <textarea className="chatTextarea"
                                      type="text"
                                      placeholder={'Type your Message...'}
                                      onChange={this.handleInput}
                                      value={this.state.input_value}
                                      onKeyPress={this.startTyping}
                                      onKeyUp={this.removeTyping}
                                    />

                                    <button className="emoji-button" onClick={this.handleShowEmojiPicker}>
                                      <span className="emoji-smiley">&#128515;</span>
                                    </button>
                                    {this.state.showEmojiPicker && (
                                      <Picker
                                        onSelect={this.addEmoji}
                                        emojiTooltip={true}
                                        title="appChat"
                                        showPreview={false}
                                        style={{position: 'absolute', bottom: '100%', right: '0'}}
                                      />
                                    )}
                                    {!this.state.showQuoteStyle ?
                                            <>
                                              <img className="attach" id="fileSelect" src={imgServerurl + imgUrl.ATTACHMENT} />
                                              <input type="file" id='file-upload' onChange={this.onFileChange} className="file-upload" />
                                            </> : <> <img className="attach disablefileicons" id="fileSelect" src={imgServerurl + imgUrl.ATTACHMENT} /></>}

                                    <div className="file-list" id="file-list-scroll">
                                      {
                                                this.state.selectedFile.length > 0 ?
                                                    <>
                                                      {this.state.selectedFile.map((val, i) =>
                                                        <div className="files" onClick={() => {
                                                          this.popImages(i);
                                                        }} key={i} >
                                                          <img src={imgServerurl + imgUrl.FILE_ICON}
                                                          />
                                                        </div>,
                                                      )
                                                      }
                                                    </> :
                                                    <span></span>
                                      }
                                    </div>
                                    <a href="#" className="sendbutton" onClick={this.handleSendMessage}>
                                      <i className="fa fa-paper-plane" />
                                    </a>
                                  </div>
                                </div> :
                                ''}
                      </div>
                    </div>
                ) : this.props.hideState ?
                    <div className="user-chatcontent">
                      <h2 className="welcomeHeading">Welcome user to app</h2>
                    </div> :
                    this.props && this.props.channel &&this.props.channel.groupName=='' &&(

                      <div className="user-chatcontent">
                        <h2 className="welcomeHeading">Welcome user to app</h2>
                      </div>
                    )}
        </Fragment>
      );
    }
}
ChatBox.propTypes = {
  channel: PropTypes.any,
  socket: PropTypes.any,
  handlerLoader: PropTypes.any,
  chatComponentToggle: PropTypes.any,
  hideState: PropTypes.any,
  hideChat: PropTypes.any,
  deviceType: PropTypes.any,
  isVendorDetailsOpen: PropTypes.any,
  isuserProfileopen: PropTypes.any,
};
export default ChatBox;
