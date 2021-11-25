const urlValue = new URLSearchParams(window.location.search);
let URL_DATA = {};

if (urlValue.get('localStorage') && urlValue.get('localStorage') == 'false') {
  URL_DATA = {
    userId: urlValue.get('userID'),
    deviceType: urlValue.get('deviceType'),
    partner_id: urlValue.get('partner_id'),
    deal_id: urlValue.get('deal_id'),
    companyResellerId: urlValue.get('companyResellerId'),
    userType: urlValue.get('userType'),
    accessToken: urlValue.get('accessToken'),
    baseMenu: urlValue.get('baseMenu'),
    isMobile: urlValue.get('isMobile'),
    // localStoragees: false
  };
} else {
  let headers = localStorage.getItem('headers');
  headers = JSON.parse(headers);
  URL_DATA = {
    userId: String(headers.userID),
    deviceType: headers.deviceType,
    partner_id: headers.partner_id,
    deal_id: headers.deal_id,
    companyResellerId: String(headers.companyResellerId),
    userType: headers.userType,
    accessToken: headers.accessToken,
    baseMenu: headers.baseMenu? headers.baseMenu: '',
    isMobile: headers.isMobile?headers.isMobile:'',
    // localStoragees: true
  };
}
console.log('Final Obj', URL_DATA);
export default URL_DATA;
