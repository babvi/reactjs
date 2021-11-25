/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable no-var */
import React, {Component} from 'react';
import PeopleList from './../PeopleList/PeopleList';
import ChatBar from '../Chat/ChatBar';
import socketIOClient from 'socket.io-client';
import fetchApi from '../../Barriers/fetchApi';
import url from '../../Barriers/UrlStream';
import oddoAPI from '../../Barriers/oddoAPI';
import URL_DATA from '../../Barriers/URLValues';
import Loader from '../Loader/loader';
import $ from 'jquery';


class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      channel: null,
      loader: false,
      deviceToken: [],
      mobileViewToggle: 'quote',
      hideChatState: true,
      deviceType: '',
    };
    this.socket = null;
  }

  componentDidMount = async () => {
    this.getMobileHeight();
    const obj = {groupName: '', senderId: URL_DATA.userId};
    // Initialize socket channel
    const socket = await socketIOClient(process.env.REACT_APP_SERVER_URL, {
      path: '',
      query: obj,
    });

    // Initialization ends

    this.socket = socket;

    socket.connect();

    await this.setState({
      channel: obj,
    });

    const windowsize = window.innerWidth;
    if (windowsize <= 1023) {
      await this.setState({
        deviceType: 'MOBILE',
        mobileViewToggle: 'quote',
      });
    } else await this.setState({deviceType: 'WEB'});
  }

  async getMobileHeight() {
    if (this.state.deviceType=='MOBILE') {
      if (URL_DATA.userType =='reseller' || URL_DATA.userType == 'vendor') {
        const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
        const windowHeight = $(window).innerHeight();
        const margueHeight = $('.appTicketMsg').height() ? $('.appTicketMsg').height() : 0;
        const divHeight= $('.mobileTopheader').height();
        const finalHeight = windowHeight-(divHeight+57+topHeight+margueHeight);
        $('.customScroll').height(finalHeight);
        if (margueHeight) {
          $('.mobileTopheader').css('top', '137px');
        }
        if (URL_DATA.userType =='reseller' && screen.width <= 767) {
          $('.menuopenleft .rightcontainer').css('padding-right', '0px');
          $('.menuopenleft .rightcontainer').css('padding-left', '0px');
        }
      } else if (URL_DATA.userType =='app') {
        const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
        const windowHeight = $(window).innerHeight();
        const divHeight= $('.mobileTopheader').height();
        const OddoAdminHeight= $('.o_oddo_admin').height()?$('.o_oddo_admin').height():0;
        // let finalHeight = windowHeight-(divHeight+100+topHeight+OddoAdminHeight);
        let finalHeight = windowHeight-(divHeight+57+topHeight+OddoAdminHeight);
        URL_DATA.baseMenu=='vertical' ? finalHeight=finalHeight+20:finalHeight=finalHeight;
        // customScroll
        $('.customScroll').height(finalHeight);
        $('.mobileTopheader').css('top', '0px');
        $('.mobileTopheader').css('left', '30px');
        $('.tabingContent .tabLink a').css('width', '33%');
        $('.tabingContent .tabLink a').css('font-size', '12px');
      }
      $('.Collapsible__contentOuter').css('overflow', 'unset');
    }
  }
  async componentDidUpdate() {
    this.getMobileHeight();
    window.addEventListener('resize', this.updateDimensions);
  }
  updateDimensions = async () => {
    const windowsize = screen.width;
    if (windowsize <= 1023) await this.setState({deviceType: 'MOBILE'});
    else await this.setState({deviceType: 'WEB'});
  };


  defaultValue = async () => {
    const body = {
      type: 'quote',
      userId: URL_DATA.userId,
    };
    const response = await fetchApi({
      method: 'post',
      reqUrl: url.LOAD_CHANNEL_LIST,
      data: body,
    });
    this.handleChannelSelect(response.data.data.data[0]);
  }

  deviceTokenData = async (userId) =>{
    const body = {};
    body['reseller_id'] = parseInt(userId);
    const response = await oddoAPI({
      method: 'post',
      reqUrl: url.USER_INFO,
      data: body,
    });
    if (response.data.result.status_code == 200) {
      await this.setState({deviceToken: response.data.result.data.notification_tokens});
    }
  }


  handleChannelSelect = async (data) => {
    {
      if (data.type == 'quote' || data.type =='custom') {
        var queryParam =
          'groupName=' +
          encodeURIComponent(data.groupName) +
          '&senderId=' +
          parseInt(URL_DATA.userId);
      } else {
        await this.deviceTokenData(data.userId);
        const points = [
          parseInt(data.userId),
          parseInt(URL_DATA.userId),
        ];
        var a = points.sort(function(a, b) {
          return a - b;
        });
        var queryParam =
          'groupName=' +
          a[0]+
          '-' +
          a[1]+
          '&senderId=' +
          parseInt(URL_DATA.userId);
      }
    }

    // Initialize socket channel
    const socket = await socketIOClient(process.env.REACT_APP_SERVER_URL, {
      path: '',
      query: queryParam,
      reconnection: true,
      reconnectionDelay: 600000,
      reconnectionDelayMax: 900000,
      reconnectionAttempts: Infinity,
      // transports: ['websocket']
    });
    // Initialization ends
    this.socket = socket;

    // Joins socket channel
    await socket.emit('join', {
      groupName:
          data.type == 'quote' || data.type == 'custom' ? data.groupName : a[0] + '-' + a[1],
      groupMembers: data.groupMembers,
      senderId: parseInt(URL_DATA.userId),
      type: data.type,
      deviceTokens: this.state.deviceToken,
    });
    // Join code ends

    await this.setState({
      channel: data,
    });
  };

  handleLoaderValue= async (val)=>{
    await this.setState({loader: val});
  }
  changeComponentToggle =async (val)=>{
    this.handleLoaderValue(true);
    if (val == 'quote') await this.setState({mobileViewToggle: 'quote'});
    else if (val == 'onetoone') await this.setState({mobileViewToggle: 'onetoone'});
    else if (val == 'custom') await this.setState({mobileViewToggle: 'custom'});
    else if (val=='defaultPeople') await this.setState({mobileViewToggle: 'defaultPeople'});
    else await this.setState({mobileViewToggle: ''});
  }

  hideChat = async (val)=>{
    await this.setState({
      hideChatState: val,
    });
  }


  render() {
    return (
      <div className="contain-area">
        {this.state.loader?<Loader/>:<></>}
        <div className="inner-content scrollbariframe">
          <PeopleList deviceType={this.state.deviceType} onSelectChannel={this.handleChannelSelect} socket={this.socket} channel={this.state.channel} handlerLoader={this.handleLoaderValue}
            mobileViewToggle={this.state.mobileViewToggle} changeComponent= {this.changeComponentToggle} />
          <ChatBar deviceType={this.state.deviceType} hideState={this.state.hideChatState} hideChat={this.hideChat} onSelectChannel={this.handleChannelSelect} channel={this.state.channel} socket={this.socket} handlerLoader={this.handleLoaderValue}
            changeComponent= {this.changeComponentToggle} mobileViewToggle={this.state.mobileViewToggle} />
        </div>
      </div>
    );
  }
}

export default Main;
