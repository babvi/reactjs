/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
import React, {Component} from 'react';
import People from '../PeopleList/People';
import PropTypes from 'prop-types';
import Collapsible from 'react-collapsible';
import ReactStars from 'react-rating-stars-component';
import {isEmpty} from 'lodash';
import GroupPeople from './GroupPeople';
import oddoAPI from '../../Barriers/oddoAPI';
import url from '../../Barriers/UrlStream';
import URL_DATA from '../../Barriers/URLValues';
import logoImg from '../../assets/images/app-icon.jpg';
import imgUrl from '../../Barriers/imagePath';
import socketEmit from '../../Barriers/socketEmit';
import $ from 'jquery';
const CONTROL_ERP_URL = process.env.REACT_APP_CONTROL_ERP_SERVER;
const imgServerurl = process.env.REACT_APP_IMAGE_SERVER_URL;
import toatsr from './../iZtoast/iZtoast';
import {BrowserView, MobileView} from 'react-device-detect';

class VendorDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      quote: '',
      dealName: '',
      activity: '',
      getBaseUrl: '',
      orderDetails: '',
      starRating: 0,
      feedback: '',
      submitted: false,
      prevHeight: 0,
      vendorQuote: '',
    };
  }

  componentDidMount = () => {
    this.dealName();
  };


  socketConnection() {
    this.props.socket.on(socketEmit.REFRESH_GLOBAL_GROUP_MEMBER, (data) => {
      if (data.groupName == this.props.channel.groupName) {
        this.dealName();
      }
    });
  };

  async componentDidUpdate(prevProps) {
    if (this.props.channel !== null && prevProps.channel !== this.props.channel) {
      this.dealName();
    }
    this.socketConnection();
    if (this.props.deviceType === 'MOBILE') {
      if (this.state.prevHeight == 0) {
        const windowHeight = $(window).innerHeight();
        const topHeight = $('.o_header_standard').height() ? $('.o_header_standard').height() : 0;
        const divHeight = $('.mobileTopheader').height();
        const topStripHeight = $('.top-strip').height();
        const triggerHeight = $('.Collapsible__trigger').height();
        let triggerFinalheight = (windowHeight - (topHeight + divHeight + topStripHeight + (triggerHeight * 2)) - 20);
        const staticHeight = URL_DATA.userType == 'app' ? 80 : 85;
        triggerFinalheight = (triggerFinalheight / 2) - staticHeight;
        // $(".quoteDisplay").css('max-height',triggerFinalheight);
        // if(URL_DATA.userType == "app"){
        //   URL_DATA.baseMenu == "horizontal" ? $(".quoteDisplay").css('max-height', triggerFinalheight - 35) :
        //   $(".quoteDisplay").css('max-height', triggerFinalheight - 30);
        // }
        $('.quoteDisplay').css('max-height', triggerFinalheight);
        this.setState({
          prevHeight: triggerFinalheight,
        });
      }
      $('.Collapsible__contentOuter').css('overflow', 'hidden');
    }
  }


  dealName = async () => {
    if (URL_DATA.userType == 'vendor') {
      const body = {};
      body['deal_id'] = this.props.channel.dealId;
      body['vendor_user_id']= URL_DATA.userId;
      const response = await oddoAPI({
        method: 'post',
        reqUrl: url.QUOTE_DETAILS,
        data: body,
      });
      if (response.data.result.data) {
        await this.setState({
          vendorQuote: response.data.result.data,
          dealName: response.data.result.data.rec_name,
          activity: response.data.result.data.stage_id,
        });
      }
    } else {
      const body = {};
      body['deal_id'] = this.props.channel.dealId;
      const response = await oddoAPI({
        method: 'post',
        reqUrl: url.QUOTE_DETAILS,
        data: body,
      });
      if (response.data.result.data) {
        await this.setState({
          quote: response.data.result.data,
          dealName: response.data.result.data.rec_name,
          activity: response.data.result.data.stage_id,
        });
      }
    }
  }


  continueQuote(val) {
    window.open(
        `${CONTROL_ERP_URL}/reseller_quote?sale_order_id=${val.id}&action=form_view`,
        '_self',
    );
  }


  getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }


  validateData(file) {
    const allowedExtension = ['png', 'jpg', 'jpeg', 'gif', 'docx', 'pdf', 'xls'];
    const isResellerNumber = document.getElementById('ponumber').value ? document.getElementById('ponumber').value : '';
    if (!allowedExtension.includes(file.name.split('.').pop())) {
      // alert("File type is invalid, Please choose another file!");
      toatsr.error('File type is invalid, Please choose another file!');
      document.getElementById('attachment').value = '';
      return false;
    } else if (!document.getElementById('agree').checked) {
      // alert("Please agree on terms and conditions");
      toatsr.error('Please agree on terms and conditions');
      return false;
    } else if (isResellerNumber.length < 1 || isResellerNumber.length > 50) {
      // alert("PO reseller number is invalid")
      toatsr.error('PO reseller number is invalid');
      document.getElementById('ponumber').value = '';
      return false;
    }
    return true;
  }

  submitPoModeal = async () => {
    const fileVal = document.getElementById('attachment').files[0];
    if (fileVal) {
      if (this.validateData(fileVal)) {
        await this.props.handlerLoader(true);
        const baseUrl = await this.getBase64(fileVal);
        const str = baseUrl;
        const resString = str.split(',')[1];
        const body =
        {
          order_id: parseInt(this.state.orderDetails),
          reseller_po_number: document.getElementById('ponumber').value,
          reseller_po_attachment: resString,
        };
        const response = await oddoAPI({
          method: 'post',
          reqUrl: url.GENERATE_PO,
          data: body,
        });
        await this.props.handlerLoader(false);
        if (response.data.result.status_code == 200) {
          await this.closeModel();
          await this.dealName();
          await this.openFeedbackModel();
        }
      }
    } else {
      if (!document.getElementById('ponumber').value) {
        // alert("PO reseller number is invalid");
        toatsr.error('PO reseller number is invalid');
      } else if (!fileVal) {
        // alert("Please choose any file");
        toatsr.error('Please choose any file');
      }
    }
  }


  openModel = async (val) => {
    await this.setState({orderDetails: val.id});
    const modal = document.getElementById('poModel');
    document.getElementById('searchGroupMember').value = '';
    modal.style.display = 'block';
    this.paymentTerms();
  }

  closeModel = () => {
    const modal = document.getElementById('poModel');
    document.getElementById('poData').reset();
    modal.style.display = 'none';
  }

  allCloseModel = () => {
    const modal = document.getElementById('poModel');
    window.onclick = function(event) {
      if (event.target == modal) {
        document.getElementById('poData').reset();
        modal.style.display = 'none';
      }
    };
  }

  onValueChange = async (e) => {
    await this.setState({
      [e.target.name]: e.target.value,
    });
    if (this.state.submitted) {
      await this.setState({
        submitted: false,
      });
    }
  };

  onSubmit = async () => {
    await this.props.handlerLoader(true);
    await this.setState({
      submitted: true,
    });
    let body = {};
    body = {
      vals: {
        rec_id: this.state.orderDetails,
        type: 'sale',
        action: 'convert_po',
        rating: this.state.starRating,
        comments: this.state.feedback,
        user_id: URL_DATA.userId,
      },
    };
    if (this.state.feedback.length > 0 || this.state.starRating > 0) {
      const response = await oddoAPI({
        method: 'post',
        reqUrl: url.RATING,
        data: body,
      });
      await this.props.handlerLoader(false);
      if (response.data.result.status_code == 200) {
        this.closeFeedbackModel();
      }
    }
  }

  openFeedbackModel = async () => {
    const modal = await document.getElementById('feedbackModel');
    this.ratingChanged(0);
    await this.setState({
      feedback: '',
      starRating: 0,
    });
    modal.style.display = 'block';
  }

  closeFeedbackModel = () => {
    const modal = document.getElementById('feedbackModel');
    modal.style.display = 'none';
  }

  ratingChanged = async (newRating) => {
    await this.setState({
      starRating: newRating,
    });
  };

  paymentTerms = async () => {
    let body = {};
    body = {'quote_id': this.state.orderDetails};
    const response = await oddoAPI({
      method: 'post',
      reqUrl: url.GET_QUOTE_DETAILS,
      data: body,
    });
    if (response.data.result.status_code == 200) {
      await this.setState({paymentTerm: response.data.result.data.payment_term_id.name});
    }
  }


  render() {
    const {
      submitted,
      feedback,
    } = this.state;
    return (
      <div className="right-col-inner mtSpace" id="right-side-Details" onClick={() => this.allCloseModel()}>
        <div className="vendor-details">
          { }
          {this.props.deviceType === 'WEB' &&
            <>
              {this.props && this.props.channel && this.state.quote && this.state.quote.order_ids && this.state.quote.order_ids.length > 0 && this.props.channel.type == 'quote' ?
                (
                  <Collapsible trigger="Quote Number" open={true}>
                    <div className="quoteLists" id="contentDealList">
                      {this.state.quote && this.state.quote.order_ids.map((val, i) => (
                        <div className="vendor-detail" key={i} >
                          {URL_DATA.userType == 'reseller' ?
                            <a className="qNumber" href={`${CONTROL_ERP_URL}reseller_quote?sale_order_id=${val.id}&action=form_view`}>{val.name}</a> :
                            <a className="qNumber">{val.name}</a>}
                          {val.state_values == 'Cancelled' ? <p className="orange left-text">{val.state_values}</p> :
                            <p className="green left-text">{val.state_values}
                              {val.state_values == 'Quote Draft' && URL_DATA.userType == 'reseller' ?
                                <a className="commoncBtn" href={`${CONTROL_ERP_URL}reseller_quote?sale_order_id=${val.id}`}> Continue Quote </a> :
                                ''}
                              {val.state_values == 'Quote Submitted' && URL_DATA.userType == 'reseller' ? <button type="submit" className="commoncBtn" value="Generate PO" onClick={() => this.openModel(val)}>Place PO</button> : ''}
                            </p>
                          }
                        </div>
                      ))}
                    </div>
                    <div id="poModel" className="modal">
                      <div className="modal-content">
                        <h2>Place PO</h2>
                        <form action="#" method="post" id="poData">
                          <div className="form-control gpoForm">
                            <div className="form-group">
                              <label>Reseller PO Number <em>*</em></label>
                              <input type="text" id="ponumber" placeholder="Reseller PO Number" name="search" required maxLength="50" />
                            </div>
                            <div className="form-group">
                              <label>Payment terms (Payment term as per the particular quote)</label>
                              <input className="payment_term_id" type="text" name="paymentTerm" id="paymentTerm"
                                value={this.state.paymentTerm} readOnly />
                            </div>
                            <div className="border-btm full-width form-group">
                              <label>Reseller PO Attachment <em>*</em></label>
                              <div className="fileAttached">
                                <input type="file" id="attachment"></input>
                              </div>
                            </div>
                            <div className="full-width form-group checkmark">
                              <input type="checkbox" className="defaultCheck" id="agree" name="agree" value="true" />
                              <label name="agree">I agree to place the purchase order</label>
                            </div>
                          </div>
                          <div className="action-primary full-width">
                            <button type="button" className="close grey" onClick={() => this.closeModel()}>Cancel</button>
                            <button type="button" className="submitbtn" onClick={() => this.submitPoModeal()}>Submit</button>
                          </div>
                        </form>
                      </div>
                    </div>

                    <div id="feedbackModel" className="modal thanksModel">
                      <div className="modal-content">
                        <form>
                          <div>
                            <img src={imgServerurl + imgUrl.app} />
                            <h2>Thank you for Using app!! </h2>
                            <p>Please rate your experience.</p>
                            <div className="ratings">
                              <ReactStars
                                count={5}
                                onChange={this.ratingChanged}
                                size={30}
                                isHalf={false}
                                emptyIcon={<i className="far fa-star"></i>}
                                halfIcon={<i className="fa fa-star-half-alt"></i>}
                                fullIcon={<i className="fa fa-star"></i>}
                                activeColor="#ef7c4f"
                              />
                            </div>
                            <div>
                              <textarea placeholder="Suggestions/Feedback"
                                name="feedback"
                                value={feedback}
                                onChange={this.onValueChange}
                              />
                              {submitted && isEmpty(feedback) && this.state.starRating == 0 && <p className="feedback_validation">Rating or Feedback is required</p>}
                            </div>
                            <div className="thxButton full-width">
                              <button type="button" className="close grey" onClick={() => this.closeFeedbackModel()}>Cancel</button>
                              <button type="button" className="submitbtn" onClick={this.onSubmit}>Submit</button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </Collapsible>):
                  <>
                    {
                      this.props && this.props.channel && this.state.vendorQuote && this.state.vendorQuote.purchase_order_ids && this.state.vendorQuote.purchase_order_ids.length > 0 && this.props.channel.type == 'quote' &&
                      (
                        <Collapsible trigger="RFQ/PO" open={true}>
                          <div className="quoteLists" id="contentDealList">
                            {this.state.vendorQuote && this.state.vendorQuote.purchase_order_ids.map((val, i) => (
                              <div className="vendor-detail" key={i} >
                                {URL_DATA.userType == 'vendor' ?
                            <a className="qNumber" href={`${CONTROL_ERP_URL}rfq_view?action=form_view&access_token=${val.access_token}`}>{val.name}</a> :
                            <a className="qNumber">{val.name}</a>}
                                {val.state_values == 'Cancelled' ? <p className="orange left-text">{val.state_values}</p> :
                            <p className="green left-text">{val.state_values}
                              {val.state_values == 'Quote Draft' && URL_DATA.userType == 'reseller' ?
                                <a className="commoncBtn" href={`${CONTROL_ERP_URL}reseller_quote?sale_order_id=${val.id}`}> Continue Quote </a> :
                                ''}
                              {val.state_values == 'Quote Submitted' && URL_DATA.userType == 'reseller' ? <button type="submit" className="commoncBtn" value="Generate PO" onClick={() => this.openModel(val)}>Place PO</button> : ''}
                            </p>
                                }
                              </div>
                            ))}
                          </div>
                        </Collapsible>

                      )
                    }
                  </>
              }
              {this.props.channel.type == 'quote' &&
                <>
                  <div className="vendor-detail">
                    <h4 className="orange">Deals Name</h4>
                    <p>{this.state.dealName}</p>
                  </div>

                  <div className="vendor-detail">
                    <h4 className="orange">Status</h4>
                    <p>{this.state.activity.name}</p>
                  </div>
                </>}

              <div className="vendor-detail no-border">
                <GroupPeople channel={this.props.channel} socket={this.props.socket} handlerLoader={this.props.handlerLoader} />
              </div>
            </>
          }
          {this.props.deviceType === 'MOBILE' &&
            <>
              <div className="peopleListcomponent">
                <GroupPeople deviceType={this.props.deviceType} channel={this.props.channel} socket={this.props.socket} handlerLoader={this.props.handlerLoader} />
              </div>
              {this.state.quote && this.state.quote.order_ids && this.state.quote.order_ids.length > 0 ?
                <div className="quoteComponent">
                  <Collapsible trigger="Quote Number" open={true}>
                    {this.props && this.props.channel && this.state.quote && this.state.quote.order_ids.length > 0 && this.props.channel.type == 'quote' && (
                      <div className="quoteLists quoteDisplay" id="contentDealList">
                        {this.state.quote && this.state.quote.order_ids.map((val, i) => (
                          <div className="vendor-detail" key={i} >
                            <div className="leftQuotenumber">
                              <span className="smallTitle">Quote Number</span>
                              {URL_DATA.userType == 'reseller' ? <a className="qNumber" href={`${CONTROL_ERP_URL}reseller_quote?sale_order_id=${val.id}&action=form_view`}>{val.name}</a> :
                                <a href="#" className="qNumber">{val.name}</a>}
                            </div>
                            <div className="rightQuoteBtn">
                              <span className="smallTitle">Status</span>
                              {val.state_values == 'Cancelled' ?
                                <p className="orange left-text"><span>{val.state_values}</span></p> :
                                <p className="green left-text"><span>{val.state_values}</span>
                                  {val.state_values == 'Quote Draft' && URL_DATA.userType == 'reseller' ?
                                    <a className="commoncBtn" href={`${CONTROL_ERP_URL}reseller_quote?sale_order_id=${val.id}`}> Continue Quote </a> :
                                    ''}
                                  {val.state_values == 'Quote Submitted' && URL_DATA.userType == 'reseller' ? <button type="submit" className="commoncBtn" value="Generate PO" onClick={() => this.openModel(val)}>Place PO</button> : ''}
                                </p>
                              }
                            </div>
                          </div>
                        ))}
                      </div>)}
                  </Collapsible>
                </div>:
                <div className="quoteComponent">
                  {URL_DATA.userType == 'vendor' && (
                    <Collapsible trigger="RFQ/PO" open={true}>
                      {this.props && this.props.channel && this.state.vendorQuote && this.state.vendorQuote.purchase_order_ids.length > 0 && this.props.channel.type == 'quote' && (
                        <div className="quoteLists quoteDisplay" id="contentDealList">
                          {this.state.vendorQuote && this.state.vendorQuote.purchase_order_ids.map((val, i) => (
                            <div className="vendor-detail" key={i} >
                              <div className="leftQuotenumber">
                                <span className="smallTitle">RFQ/PO</span>
                                {URL_DATA.userType == 'vendor' ? <a className="qNumber" href={`${CONTROL_ERP_URL}rfq_view?action=form_view&access_token=${URL_DATA.accessToken}`}>{val.name}</a> :
                                <a href="#" className="qNumber">{val.name}</a>}
                              </div>
                              <div className="rightQuoteBtn">
                                <span className="smallTitle">Status</span>
                                {val.state_values == 'Cancelled' ?
                                <p className="orange left-text"><span>{val.state_values}</span></p> :
                                <p className="green left-text"><span>{val.state_values}</span>
                                  {val.state_values == 'Quote Draft' && URL_DATA.userType == 'reseller' ?
                                    <a className="commoncBtn" href={`${CONTROL_ERP_URL}reseller_quote?sale_order_id=${val.id}`}> Continue Quote </a> :
                                    ''}
                                  {val.state_values == 'Quote Submitted' && URL_DATA.userType == 'reseller' ? <button type="submit" className="commoncBtn" value="Generate PO" onClick={() => this.openModel(val)}>Place PO</button> : ''}
                                </p>
                                }
                              </div>
                            </div>
                          ))}
                        </div>)}
                    </Collapsible>
                  )}
                </div>
              }
            </>
          }
          <div id="poModel" className="modal">
            <div className="modal-content">
              <h2>Place PO</h2>
              <form action="#" method="post" id="poData">
                <div className="form-control gpoForm">
                  <div className="form-group">
                    <label>Reseller PO Number <em>*</em></label>
                    <input type="text" id="ponumber" placeholder="Reseller PO Number" name="search" required maxLength="50" />
                  </div>
                  <div className="form-group">
                    <label>Payment terms (Payment term as per the particular quote)</label>
                    <input className="payment_term_id" type="text" name="paymentTerm" id="paymentTerm"
                      value={this.state.paymentTerm} readOnly />
                  </div>
                  <div className="border-btm full-width form-group">
                    <label>Reseller PO Attachment <em>*</em></label>
                    <div className="fileAttached">
                      <input type="file" id="attachment"></input>
                    </div>
                  </div>
                  <div className="full-width form-group checkmark">
                    <input type="checkbox" className="defaultCheck" id="agree" name="agree" value="true" />
                    <label name="agree">I agree to place the purchase order</label>
                  </div>
                </div>
                <div className="action-primary full-width">
                  <button type="button" className="close grey" onClick={() => this.closeModel()}>Cancel</button>
                  <button type="button" className="submitbtn" onClick={() => this.submitPoModeal()}>Submit</button>
                </div>
              </form>
            </div>
          </div>

          <div id="feedbackModel" className="modal thanksModel">
            <div className="modal-content">
              <form>
                <div>
                  <img src={imgServerurl + imgUrl.app} />
                  <h2>Thank you for Using app!! </h2>
                  <p>Please rate your experience.</p>
                  <div className="ratings">
                    <ReactStars
                      count={5}
                      onChange={this.ratingChanged}
                      size={30}
                      isHalf={false}
                      emptyIcon={<i className="far fa-star"></i>}
                      halfIcon={<i className="fa fa-star-half-alt"></i>}
                      fullIcon={<i className="fa fa-star"></i>}
                      activeColor="#ef7c4f"
                    />
                  </div>
                  <div>
                    <textarea placeholder="Suggestions/Feedback"
                      name="feedback"
                      value={feedback}
                      onChange={this.onValueChange}
                    />
                    {submitted && isEmpty(feedback) && this.state.starRating == 0 && <p className="feedback_validation">Rating or Feedback is required</p>}
                  </div>
                  <div className="thxButton full-width">
                    <button type="button" className="close grey" onClick={() => this.closeFeedbackModel()}>Cancel</button>
                    <button type="button" className="submitbtn" onClick={this.onSubmit}>Submit</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

VendorDetails.propTypes = {
  channel: PropTypes.any,
  socket: PropTypes.any,
  handlerLoader: PropTypes.any,
  deviceType: PropTypes.any,
};

export default VendorDetails;
