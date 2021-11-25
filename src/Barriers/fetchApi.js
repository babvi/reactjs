import axios from 'axios';
import URL_DATA from './URLValues';
const url = process.env.REACT_APP_SERVER_URL;

const l = URL_DATA;
let val;
if (l) {
  val = {
    headers: {
      'authorization': 'Bearer '+l.accessToken,
      'Content-Type': 'application/json',
    },
  };
}

const fetchApi = async (serviceType) => {
  if (serviceType.method === 'get') {
    return axios
        .get(`${url}${serviceType.param}`, val)
        .then((res) => {
          return res;
        })
        .catch((err) => {
          return err.response;
        });
  }
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
  if (serviceType.method === 'put') {
    return axios
        .put(`${url}${serviceType.reqUrl}`, serviceType.data, val)
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
  if (serviceType.method === 'delete') {
    return axios
        .delete(`${url}${serviceType.reqUrl}`, {data: {userId: serviceType.data.userId}})
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
export default fetchApi;
