/* eslint-disable no-invalid-this */
import React, {Component} from 'react';
import TopBar from '../TopBar/TopBar';
import ChatBox from '../Chat/ChatBox';
import UserDetails from '../Profiles/UserDetails';
import VendorDetails from '../Profiles/VendorDetails';
import PropTypes from 'prop-types';

class ChatBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chatMobileView: '',
      isuserProfileopen: false,
      changeQuoteprofileComponent: false,
      isVendorDetailsOpen: false,
    };
  }

  changeChatComponentToggle =async (val)=>{
    if (val == 'chat') await this.setState({chatMobileView: val});
  }

  async componentDidUpdate(prevProps) {
    if (this.props.channel !== null && prevProps.channel !== this.props.channel) {
      await this.setState({isVendorDetailsOpen: false});
    }
  }

  changeprofileComponent = async (val) =>{
    await this.setState({
      isuserProfileopen: val,
    });
  }

  changeQuoteprofileComponent= async (val) =>{
    await this.setState({
      changeQuoteprofileComponent: val,
    });
  }

  isVendorDetailsOpen= async (val) =>{
    await this.setState({
      isVendorDetailsOpen: val,
    });
  }

  render() {
    return (
      <div className="right-col" id="dealBoxcontent">
        {this.props.deviceType==='WEB' && (
          <>
            <TopBar deviceType={this.props.deviceType} channel={this.props.channel} socket={this.props.socket} onSelectChannel={this.props.onSelectChannel} handlerLoader={this.props.handlerLoader} />
            <div className="inner-content">
              <ChatBox deviceType={this.props.deviceType} hideState={this.props.hideState} channel={this.props.channel} socket={this.props.socket} handlerLoader={this.props.handlerLoader} />
              {this.props.channel && this.props.channel.type == 'quote' || this.props.channel.type == 'custom' ? (
              <VendorDetails
                deviceType={this.props.deviceType}
                channel={this.props.channel}
                socket={this.props.socket}
                handlerLoader={this.props.handlerLoader}
              />
              ) : (
                <UserDetails
                  deviceType={this.props.deviceType}
                  channel={this.props.channel}
                  socket={this.props.socket}
                  handlerLoader={this.props.handlerLoader}
                />
                )}
            </div>
          </>
        )}
        {this.props.deviceType==='MOBILE' && (
          <>
            {this.props.mobileViewToggle ? <></>:
              <>
                <TopBar deviceType={this.props.deviceType} isuserProfileopenState={this.state.isuserProfileopen} hideChat={this.props.hideChat} isVendorDetailsOpenState={this.state.isVendorDetailsOpen} isVendorDetailsOpen={this.isVendorDetailsOpen} changeQuoteprofileComponent={this.changeQuoteprofileComponent} changeprofileComponent={this.changeprofileComponent}
                  changeComponent= {this.props.changeComponent} channel={this.props.channel} socket={this.props.socket} onSelectChannel={this.props.onSelectChannel} handlerLoader={this.props.handlerLoader}/>
                {
                  this.props.channel && this.props.channel.type =='quote' && this.state.isVendorDetailsOpen && (
                    <VendorDetails
                      deviceType={this.props.deviceType}
                      channel={this.props.channel}
                      socket={this.props.socket}
                      handlerLoader={this.props.handlerLoader}
                      changeQuoteprofileComponent={this.changeQuoteprofileComponent}
                      hideChat={this.props.hideChat}
                    />
                  )
                }
                {
                  this.props.channel && this.props.channel.type == 'custom' && this.state.isVendorDetailsOpen && (
                    <VendorDetails
                      deviceType={this.props.deviceType}
                      channel={this.props.channel}
                      socket={this.props.socket}
                      handlerLoader={this.props.handlerLoader}
                      changeQuoteprofileComponent={this.changeQuoteprofileComponent}
                      hideChat={this.props.hideChat}
                    />
                  )
                }
                {this.state.isuserProfileopen && this.props.channel.type =='onetoone' && (
                  <UserDetails
                    deviceType={this.props.deviceType}
                    channel={this.props.channel}
                    socket={this.props.socket}
                    handlerLoader={this.props.handlerLoader}
                    changeprofileComponent={this.changeprofileComponent}
                    hideChat={this.props.hideChat}
                  />
                )}
                <ChatBox isuserProfileopen={this.state.isuserProfileopen} isVendorDetailsOpen={this.state.isVendorDetailsOpen} deviceType={this.props.deviceType} hideState={this.props.hideState} hideChat={this.props.hideChat} channel={this.props.channel} socket={this.props.socket} handlerLoader={this.props.handlerLoader} chatComponentToggle={this.props.changeComponent} />
              </>}
          </>
        )}
      </div>
    );
  }
}

ChatBar.propTypes = {
  channel: PropTypes.any,
  socket: PropTypes.any,
  onSelectChannel: PropTypes.any,
  handlerLoader: PropTypes.any,
  changeComponent: PropTypes.any,
  mobileViewToggle: PropTypes.any,
  hideChat: PropTypes.any,
  hideState: PropTypes.any,
  deviceType: PropTypes.any,
};

export default ChatBar;
