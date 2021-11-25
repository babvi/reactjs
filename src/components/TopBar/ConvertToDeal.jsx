/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-tabs */
import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import {isEmpty} from 'lodash';
import $ from 'jquery';
import PropTypes from 'prop-types';
import oddoAPI from '../../Barriers/oddoAPI';
import url from '../../Barriers/UrlStream';
import URL_DATA from '../../Barriers/URLValues';
import socketEmit from '../../Barriers/socketEmit';
import toatsr from './../iZtoast/iZtoast';
const controlerpServerurl = process.env.REACT_APP_CONTROL_ERP_SERVER_IMG;

class ConvertToDeal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inquiryName: '',
      companyName: '',
      contactPersonName: '',
      email: '',
      phone: '',
      otherCompany: '',
      websiteCountry: '',
      webCountry: '',
      website: '',
      otherPerson: '',
      reseller: '',
      description: '',
      vendorList: [],
      contactPerson: [],
      companyList: [],
      selectedVendorName: '',
      submitted: false,
      inquiryNameError: '',
      companyNameError: '',
      contactPersonNameError: '',
      emailError: false,
      phoneError: '',
      resellerError: '',
      descriptionError: '',
      selectedVendorNameError: '',
      otherCompanyValue: false,
      otherPersonValue: false,
      userName: '',
      parent_id: '',
      companySelected: false,
      companyDropdown: [],
      contactPersonDropDown: [],
      vendorDropdown: [],
      CountryDropdown: [],
      companyInfo: '',
      contactPersonInfo: '',
      vedorInfo: '',
      countryInfo: '',
      redirectChat: '',
    };
    this.user;
    this.ConvertToDealValue=0;
  }

  componentDidMount() {
    this.user = URL_DATA;
    this.vendorList();
    this.companyName();
    this.userDetails();
    this.websiteCountry();
    if (this.props.deviceType=='MOBILE') {
      let windowsize = window.innerWidth;
      windowsize = windowsize /100 *70;
      $('.convert-deals form .form-control, .convert-deals form .o_wysiwyg_loader').height(windowsize);
    }
  }


  socketEventCalling = async () => {
  	this.props.socket.on(socketEmit.NEW_GROUP_CREATE, (data) => {
  		if (data) {
  			if (this.state.redirectChat.length==0) {
  				this.setState({
  					redirectChat: data,
  				});
  			}
  		}
  	});
  }

  async componentDidUpdate(prevProps) {
  	if (this.props.socket !== null && prevProps.socket !== this.props.socket) {
  		await this.socketEventCalling();
  	}
  	this.socketEventCalling();
  }


  userDetails = async () => {
  	const body={};
	  body['reseller_id'] = parseInt(this.props.channel.userId);
  	const response = await oddoAPI({
  		method: 'post',
  		reqUrl: url.USER_INFO,
  		data: body,
  	});
  	if (response.data.result.status_code == 200) {
  		this.setState({
  			userName: response.data.result.data.name,
  			parent_id: response.data.result.data.parent_id.id,
  		});
  	}
  }

  vendorList = async () => {
  	const body = {};
  	body['reseller_id'] = this.props.channel.userId;
  	const response = await oddoAPI({
  		method: 'post',
  		reqUrl: url.VENDOR_LIST,
  		data: body,
  	});
  	let val = [];
  	val = await response.data.result.data;
  	const newArr=[];
  	val.forEach((i)=>{
  		const obj={};
  		obj.text=i.name;
  		obj.key=i.id;
  		obj.value=i.id;
  		newArr.push(obj);
  	});
  	await this.setState({vendorDropdown: newArr});
  }

  companyName = async () => {
  	const body = {};
  	const response = await oddoAPI({
  		method: 'post',
  		reqUrl: url.COMPANY_DETAILS,
  		data: body,
  	});

  	let val = [];
  	val = await response.data.result.data.company;
  	await val.splice(0, 0, {id: '', name: ''});
  	await val.push({id: 'other', name: 'Other'});

  	const newArr=[];
  	val.forEach((i)=>{
  		const obj={};
  		obj.text=i.name;
  		obj.key=i.id;
  		obj.value=i.id;
  		newArr.push(obj);
  	});
  	await this.setState({companyDropdown: newArr,
  	});
  }

  contactPersonName = async () => {
  	const body = {};
  	body['end_user_company'] = this.state.companyInfo.key;
  	body['reseller_company_id'] = this.state.parent_id;

  	const response = await oddoAPI({
  		method: 'post',
  		reqUrl: url.END_USER_LIST,
  		data: body,
  	});
  	let val = [];
  	val = await response.data.result.data;
  	await val.splice(0, 0, {id: '', name: ''});
  	await val.push({id: 'other', name: 'Other'});
  	const newArr=[];
  	val.forEach((i)=>{
  		const obj={};
  		obj.text=i.name;
  		obj.key=i.id;
  		obj.value=i.id;
  		newArr.push(obj);
  	});
  	await this.setState({contactPersonDropDown: newArr, contactPerson: val, contactPersonInfo: ''});
  }

  websiteCountry = async () => {
  	const body = {};
  	const response = await oddoAPI({
  		method: 'post',
  		reqUrl: url.ALL_COUNTRY,
  		data: body,
  	});

  	if (response.data.result.status_code == 200) {
  		let val = [];
  		val = await response.data.result.data;
  		const newArr=[];
  		val.forEach((i)=>{
  			const obj={};
  			obj.text=i.name;
  			obj.key=i.id;
  			obj.value=i.id;
  			newArr.push(obj);
  		});
  		await this.setState({CountryDropdown: newArr});
  	}
  }


  onValueChange = (e) => {
  	this.setState({
  		[e.target.name]: e.target.value,
  	});
  	if (this.state.submitted) {
  		this.setState({
  			submitted: false,
  			emailError: false,
  		});
  	}
  };

  allValidDetails() {
  	if (this.state.contactPersonInfo && this.state.contactPersonInfo.text == 'Other') {
  		if (this.state.email && this.state.phone && this.state.description && this.state.contactPersonInfo && this.state.contactPersonInfo.text &&
        this.state.vedorInfo && this.state.vedorInfo.text) {
  			if (this.state.companyInfo && this.state.companyInfo.text == 'Other' && this.state.otherCompany) {
  				if (this.state.contactPersonInfo && this.state.contactPersonInfo.text == 'Other' && this.state.otherPerson) {
  					return true;
  				} else {
  					return true;
  				}
  			} else {
  				return true;
  			}
  		}
  		return false;
  	} else {
  		if (this.state.description && this.state.vedorInfo && this.state.vedorInfo.text) {
  			if (this.state.companyInfo && this.state.companyInfo.text == 'Other' && this.state.otherCompany) {
  				if (this.state.otherPerson) {
  					return true;
  				} else {
  					return true;
  				}
  			} else {
  				return true;
  			}
  		}
  		return false;
  	}
  }

  onSubmit = async () => {
  	const mailformat = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
  	let body = {};
  	if (!isEmpty(this.state.email) && !mailformat.test(this.state.email)) {
  		this.setState({
  			emailError: true,
  		});
  		return false;
  	}
  	this.setState({
  		submitted: true,
  	});
  	if (this.allValidDetails()) {
  		this.props.handlerLoader(true);
  		let Name = this.state.otherPersonValue ? this.state.otherPerson : this.state.contactPersonInfo.key;
  		const Company = this.state.otherCompanyValue ? this.state.otherCompany : parseInt(this.state.companyInfo.text);
  		const websiteNation = this.state.countryInfo ? parseInt(this.state.countryInfo.key) : 25;
  		const parentId = this.state.parent_id ? this.state.parent_id : 19;
  		if (Name==undefined) Name ='';
  		// && this.state.otherPersonValue
  		if (this.state.otherCompanyValue) {
  			body = {
  				'vals':
          {
          	partner_id: this.user.partner_id ? parseInt(this.user.partner_id) : 29,
          	reseller_id: parseInt(this.props.channel.userId),
          	vendor_id: parseInt(this.state.vedorInfo.key),
          	email_from: this.state.email,
          	mobile: this.state.phone,
          	description: this.state.description,
          	name: 'Deal',
          	deal_type: 'new',
          	user_id: URL_DATA.userId,
          	website: this.state.website,
          	website_country_id: websiteNation,
          },
  				'new':
          {
          	'company':
              {'name': Company, 'child_ids': '[[0,0,{\'name\':\' ' + Name.toString() + ' \',\'type\':\'contact\',\'reseller_company_ids\': [[6, 0, [' + parseInt(parentId) + ']]]}]]'},
          },
  			};
  		} else if (this.state.otherPersonValue) {
  			body = {
  				'vals': {
  					'name': 'Deal',
  					'partner_id': this.user.partner_id ? parseInt(this.user.partner_id) : 29,
  					'enduser_id': parseInt(this.state.companyInfo.key),
  					'reseller_id': parseInt(this.props.channel.userId),
  					'vendor_id': parseInt(this.state.vedorInfo.key),
  					'email_from': this.state.email,
  					'mobile': this.state.phone,
  					'deal_type': 'new',
  					'description': this.state.description,
  					'user_id': URL_DATA.userId,
  				},
  				'new': {
  					'contact': {
  						'name': Name,
  						'type': 'contact',
  						'parent_id': parseInt(this.state.companyInfo.key),
  						'reseller_company_ids': [[6, 0, [parentId]]],
  					},
  				},
  			};
  		} else {
  			body = {
  				'vals':
          {
          	partner_id: this.user.partner_id ? parseInt(this.user.partner_id) : 29,
          	enduser_id: parseInt(this.state.companyInfo.key),
          	enduser_user_id: this.state.contactPersonInfo.key? parseInt(this.state.contactPersonInfo.key):'',
          	reseller_id: parseInt(this.props.channel.userId),
          	vendor_id: parseInt(this.state.vedorInfo.key),
          	email_from: this.state.email,
          	mobile: this.state.phone,
          	description: this.state.description,
          	name: 'Deal',
          	deal_type: 'new',
          	user_id: URL_DATA.userId,
          },
  			};
  		}
  		const response = await oddoAPI({
  			method: 'post',
  			reqUrl: url.CREATE_NEW_DEAL,
  			data: body,
  		});
  		this.props.handlerLoader(false);
  		if (response.data.result.status_code == 200) {
  			this.props.modalAction();
  			this.props.updateNewState(this.ConvertToDealValue+1);
  			if (this.props.deviceType==='MOBILE' && this.state.redirectChat.groupName) {
  				localStorage.setItem('redirectquote', this.state.redirectChat.groupName);
  				this.props.changeComponent('quote');
  				this.setState({
  					redirectChat: '',
  				});
  			}
  		} else {
  			toatsr.error(response.data.result.message);
  		}
  	}
  }

  checkOther= async (val, data='') => {
  	switch (val) {
  	case 'company_name':
  		if (data.text == '') {
  			await this.setState({
  				otherCompanyValue: false,
  				companySelected: false,
  			});
  		} else if (data.text == 'Other') {
  			await this.setState({
  				otherCompanyValue: true,
  				companySelected: true,
  			});
  		} else {
  			await this.setState({
  				otherCompanyValue: false,
  				otherPersonValue: false,
  				companySelected: true,
  				email: '',
  				phone: '',
  				otherPerson: '',
  				description: '',
  			});
  			await this.setState({contactPersonDropDown: [], contactPerson: [], contactPersonInfo: ''});
  		}
  		if (data.text) {
  			this.contactPersonName();
  		}
  		break;
  	case 'ContactPersonName':
  		if (data.text == 'Other') {
  			await this.setState({
  				otherPersonValue: true,
  				otherPerson: '',
  			});
  			await this.setState({
  				email: '',
  				phone: '',
  			});
  		} else {
  			await this.setState({
  				otherPersonValue: false,
  			});
  			this.state.contactPerson.forEach((val, i) => {
  				if (data.key == val.id) {
  					this.setState({
  						email: val.email,
  						phone: val.mobile,
  					});
  				}
  			});
  		}
  		break;
  	}
  }

  onChange = async (e) =>{
  	const text= e.target.outerText?e.target.outerText:e.target.textContent;
  	const result = this.state.companyDropdown.find((obj) => {
  		return obj.text === text;
  	});
  	await this.setState({companyInfo: result});
  	await this.checkOther('company_name', this.state.companyInfo);
  	$('.clear').click();
  }

  contactPersons = async (e) =>{
  	const text= e.target.outerText?e.target.outerText:e.target.textContent;
  	const result = this.state.contactPersonDropDown.find((obj) => {
  		return obj.text === text;
  	});
  	await this.setState({contactPersonInfo: result});
  	await this.checkOther('ContactPersonName', result);
  }

  countryChange =async (e) =>{
  	const text= e.target.outerText?e.target.outerText:e.target.textContent;
  	const result = this.state.CountryDropdown.find((obj) => {
  		return obj.text ===text;
  	});
  	await this.setState({countryInfo: result});
  }

  vednorData = async (e) => {
  	const text= e.target.outerText?e.target.outerText:e.target.textContent;
  	const result = this.state.vendorDropdown.find((obj) => {
  		return obj.text === text;
  	});
  	await this.setState({vedorInfo: result});
  }

  render() {
  	const {
  		inquiryName,
  		companyName,
  		contactPersonName,
  		email,
  		phone,
  		otherCompany,
  		websiteCountry,
  		otherPerson,
  		website,
  		reseller,
  		description,
  		inquiryNameError,
  		companyNameError,
  		contactPersonNameError,
  		emailError,
  		phoneError,
  		resellerError,
  		descriptionError,
  		submitted,
  	} = this.state;

  	return (
  		<div id="myModal" className="modal" style={{display: 'block'}}>
  			<div className="modal-content">
  				<h2>Convert to Deals</h2>
  				<form>
  					<div className="form-control customScrollbar">

  						<div className="form-group">
  							<label>
                End User <em>*</em>
  							</label>
  							<div>
  								<Dropdown
  									placeholder='Select End User/Others'
  									className="select-dropdown"
  									fluid
  									search
  									selection
  									options={this.state.companyDropdown}
  									onChange={this.onChange}
  								/>
  								{submitted && Object.keys(this.state.companyInfo).length == 0 && <p>End User is required</p>}
  							</div>
  						</div>
  						{this.state.otherCompanyValue ?
  							<>
  								<div className="form-group">
  									<label>
                    New End User <em>*</em>
  									</label>
  									<input
  										type="text"
  										name="otherCompany"
  										id="otherCompany"
  										value={otherCompany}
  										onChange={this.onValueChange}
  									/>
  									{submitted && this.state.companyInfo.text == 'Other' && isEmpty(otherCompany) && <p>New End User is required</p>}
  								</div>

  								<div className="form-group">
  									<label>
                    End User Website <em>*</em>
  									</label>
  									<input
  										type="url"
  										name="website"
  										id="website"
  										value={website}
  										onChange={this.onValueChange}
  										required
  									/>
  									{submitted && this.state.companyInfo.text == 'Other' && isEmpty(website) && <p>End User Website is required</p>}
  								</div>

  								<div className="form-group">
  									<label>
                    End User Country <em>*</em>
  									</label>
  									<div className="select-dropdown">
  										<Dropdown
  											placeholder='Select End User Country'
  											fluid
  											search
  											selection
  											options={this.state.CountryDropdown}
  											onChange={this.countryChange}
  										/>
  										{submitted && this.state.companyInfo.text == 'Other' && Object.keys(this.state.countryInfo).length ==0 && <p>End User Country is required</p>}
  									</div>
  								</div>
  							</> :
  							''}
  						{this.state.companySelected ?
  							<div className="form-group ui dropdown">
  								<label>
                  End User Contact
  								</label>
  								<div id="dropDown" className="select-dropdown">
  									<Dropdown
  										placeholder='Select End User Contact/Others'
  										fluid
  										search
  										clearable
  										selection
  										options={this.state.contactPersonDropDown}
  										onChange={this.contactPersons}
  									/>
  								</div>
  								{/* {submitted && Object.keys(this.state.contactPersonInfo).length == 0 && <p>End User Contact is required</p>} */}
  							</div>:
  							<div className="form-group">
  								<label>
                  End User Contact
  								</label>
  								<div className="select-dropdown">
  									<select disabled id="ContactPersonName">
  										<option key={1} value={'endUser'}>Select End User Contact/Others </option>
  									</select>
  								</div>
  								{submitted && Object.keys(this.state.contactPersonInfo).length == 0 && <p>End User Contact is required</p>}
  							</div>
  						}
  						{this.state.otherPersonValue ?
  							<div className="form-group">
  								<label>
                  New End User Contact <em>*</em>
  								</label>
  								<input
  									type="text"
  									name="otherPerson"
  									id="otherPerson"
  									value={otherPerson}
  									onChange={this.onValueChange}
  								/>
  								{submitted && this.state.contactPersonInfo.text == 'Other' && isEmpty(otherPerson) && <p>New End User Contact is required</p>}
  							</div> :
  							''}
  						{
  							this.state.otherPersonValue ?
  								<>
  									<div className="form-group">
  										<label>
                      Contact Business Email <em>*</em>
  										</label>
  										<input
  											type="text"
  											name="email"
  											id="email"
  											value={email}
  											onChange={this.onValueChange}
  											required
  										/>
  										{submitted && isEmpty(email) ? (
  											<p>Contact Business Email is required</p>
  										) : (
  											emailError && <p>Contact business email is invalid</p>
  										)}
  									</div>
  									<div className="form-group">
  										<label>
                      Contact Mobile No. <em>*</em>
  										</label>
  										<input
  											type="text"
  											name="phone"
  											pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
  											id="phone"
  											value={phone}
  											onChange={this.onValueChange}
  											required
  										/>
  										{submitted && isEmpty(phone) && <p>Phone number is required</p>}
  									</div>
  								</> :
  								<>
  									<div className="form-group">
  										<label>
                      Contact Business Email
  										</label>
  										<input
  											type="text"
  											name="email"
  											id="email"
  											value={email}
  											placeholder="Business Email"
  											readOnly
  										/>
  									</div>
  									<div className="form-group">
  										<label>
                      Contact Mobile No.
  										</label>
  										<input
  											type="text"
  											name="phone"
  											placeholder="Mobile No."
  											pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
  											id="phone"
  											value={phone}
  											readOnly
  										/>
  									</div>
  								</>}

  						<div className="form-group">
  							<label>
                  Vendor <em>*</em>
  							</label>
  							<Dropdown
  								placeholder='Select Vendor'
  								className="select-dropdown"
  								fluid
  								search
  								selection
  								options={this.state.vendorDropdown}
  								onChange={this.vednorData}
  							/>
  							{submitted && Object.keys(this.state.vedorInfo).length == 0 && <p>Vendor is required</p>}
  						</div>

  						<div className="form-group active">
  							<label>
                  Reseller User <em>*</em>
  							</label>
  							<input
  								type="text"
  								name="reseller"
  								id="reseller"
  								value={this.props.channel.userName}
  								readOnly
  							/>
  						</div>
  						<div className="form-group full-width">
  							<label>
                Deal Notes <em>*</em>
  							</label>
  							<textarea
  								rows="5"
  								cols="5"
  								name="description"
  								placeholder="Deal notes"
  								value={description}
  								onChange={this.onValueChange}
  							></textarea>
  							{submitted && isEmpty(description) && (
  								<p>Deal notes is required</p>
  							)}
  						</div>
  					</div>
  					<div className="action-primary">
  						<button
  							type="button"
  							className="close grey popupclose"
  							onClick={() => this.props.modalAction()}
  						>
                Cancel
  						</button>
  						<button type="button" onClick={this.onSubmit}>
                Submit
  						</button>
  					</div>
  				</form>
  			</div>
  		</div>
  	);
  }
}

ConvertToDeal.propTypes = {
  modalAction: PropTypes.func,
  channel: PropTypes.any,
  socket: PropTypes.any,
  onSelectChannel: PropTypes.any,
  updateNewState: PropTypes.any,
  handlerLoader: PropTypes.any,
  deviceType: PropTypes.any,
  changeComponent: PropTypes.any,
};


export default ConvertToDeal;
