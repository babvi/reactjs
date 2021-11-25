/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import imgUrl from '../../Barriers/imagePath';
import oddoAPI from '../../Barriers/oddoAPI';
import url from '../../Barriers/UrlStream';
import URL_DATA from '../../Barriers/URLValues';
import $ from 'jquery';
const imgServerurl = process.env.REACT_APP_IMAGE_SERVER_URL;
const controlerpServerurl= process.env.REACT_APP_CONTROL_ERP_SERVER_IMG;

class UserDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: '',
      userProfile: true,
    };
  }
  componentDidMount() {
    this.currentUserDetails();
    if (this.props.deviceType ==='MOBILE') {
      this.resolveHeightIssue();
    }
  }

  currentUserDetails = async () => {
    const body = {};
    body['reseller_id'] = parseInt(URL_DATA.userId);
    const response = await oddoAPI({
      method: 'post',
      reqUrl: url.USER_INFO,
      data: body,
    });
    if (response.data.result.status_code == 200) {
      this.setState({
        userInfo: response.data.result.data,
      });
    }
  }

  resolveHeightIssue() {
    if (this.props.deviceType=='MOBILE') {
      if (URL_DATA.userType=='reseller' || URL_DATA.userType=='vendor') {
        const topHeight= $('.o_header_standard').height()?$('.o_header_standard').height():0;
        const margueHeight = $('.appTicketMsg').height() ? $('.appTicketMsg').height() : 0;
        const windowHeight = $(window).innerHeight();
        const divHeight= $('.mobileTopheader').height();
        let finalHeight = windowHeight-(divHeight+topHeight+margueHeight);
        finalHeight= finalHeight-150;
        $('.userProfileArea').height(finalHeight);
        $('.userProfileArea').css('margin-top', '116px');
        $('.userProfileArea').css('overflow-y', 'auto');
      } else if (URL_DATA.userType=='app') {
        $('.userProfileArea').css('margin-top', '125px');
      }
    }
  }

  changeprofile= async (val)=>{
    await this.setState({
      userProfile: !val,
    });
    this.props.changeprofileComponent(this.state.userProfile);
    this.props.hideChat(true);
  }
  render() {
    return (
      <div className="right-col-inner userProfileArea">
        {this.props.channel && this.props.channel.groupName ?
          <div className="user-details userListScroll">
            <div className="user-img">
              {this.props.channel ?
                <img src={controlerpServerurl + this.props.channel.profileImage} /> :
                <img src={imgServerurl + imgUrl.AVATAR2} />
              }
            </div>
            <div className="user-name">
              {this.props.channel && this.props.channel.userName}
            </div>
            <div className="user-designation">
              {this.props && this.props.channel && this.props.channel.designation ?
                this.props.channel.designation : '---'
              }
            </div>
            <div className="userp-detail">
              <div className="userdetailsContent">
                <span className="title">Language:</span>
                <div className="userdetailsScroll" id="contentDealList">
                  {
                    this.props && this.props.channel && this.props.channel.language.map((item, contentIndex) => {
                      return (<span key={contentIndex}>
                        {item}
                        {
                          contentIndex < this.props.channel.language.length - 1 ? ',' : ''
                        }
                      </span>);
                    })
                  }
                </div>
              </div>
              <div className="userdetailsContent">

                <span className="title">Country:</span>
                {' '}
                <div className="userdetailsScroll" id="contentDealList">
                  {
                    this.props && this.props.channel && this.props.channel.country.map((item, contentIndex) => {
                      return (<span key={contentIndex}>
                        {item}
                        {
                          contentIndex < this.props.channel.country.length - 1 ? ',' : ''
                        }
                      </span>);
                    })
                  }
                </div>
              </div>
            </div>
          </div> :
          <div className="user-details">
            <div className="user-img">
              {this.state.userInfo.image_1920 ?
                <img src={controlerpServerurl + this.state.userInfo.image_1920} /> :
                <img src={imgServerurl + imgUrl.AVATAR2} />
              }
            </div>
            <div className="user-name">
              {this.state.userInfo.name}
            </div>
            <div className="user-designation">
              {this.state.userInfo.designation_id ?
                this.state.userInfo.designation_id.name : '---'
              }
            </div>
            <div className="userp-detail">
              <div className="userdetailsContent">
                <span className="title">Language:</span>
                <div className="userdetailsScroll" id="contentDealList">
                  {
                    this.state.userInfo && this.state.userInfo.language_ids.map((item, contentIndex) => {
                      return (<span key={contentIndex}>
                        {item.name}
                        {
                          contentIndex < this.state.userInfo.language_ids.length - 1 ? ',' : ''
                        }
                      </span>);
                    })
                  }
                </div>
              </div>
              <div className="userdetailsContent">

                <span className="title">Country:</span>
                {' '}
                <div className="userdetailsScroll" id="contentDealList">
                  {
                    this.state.userInfo && this.state.userInfo.country_ids.map((item, contentIndex) => {
                      return (<span key={contentIndex}>
                        {item.name}
                        {
                          contentIndex < this.state.userInfo.country_ids.length - 1 ? ',' : ''
                        }
                      </span>);
                    })
                  }
                </div>
              </div>
            </div>
          </div>}
      </div >
    );
  }
}

UserDetails.propTypes = {
  channel: PropTypes.any,
  socket: PropTypes.any,
  changeprofileComponent: PropTypes.any,
  hideChat: PropTypes.any,
  deviceType: PropTypes.any,
};

export default UserDetails;
