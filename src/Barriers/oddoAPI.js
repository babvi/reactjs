import axios from 'axios';
import URL_DATA from './URLValues';
const url = process.env.REACT_APP_CONTROL_ERP_SERVER;

const l = URL_DATA;
let val;
if (l) {
  val = {
    headers: {
      'accessToken': l.accessToken,
      'Content-Type': 'application/json',
      'userID': l.userId,
      'deviceType': l.deviceType,
    },
  };
}

const oddoAPI = async (serviceType) => {
  if (serviceType.method === 'post') {
    return axios
        .post(`${url}${serviceType.reqUrl}`, serviceType.data, val)
        .then((res) => {
          return res;
        })
        .catch((err) => {
          if (err.response && err.response.data && err.response.data.message) {
            return err.response;
          } else {
            return err.response;
          }
        });
  }
};
export default oddoAPI;
