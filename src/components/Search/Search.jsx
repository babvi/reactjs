/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-vars */
import React, {Component} from 'react';
import fetchApi from '../../Barriers/fetchApi';
import url from '../../Barriers/UrlStream';

class Search extends Component {
  constructor(props) {
    super(props);
    this.setState = {};
  }

  componentDidMount = () => { };

  searchlength = 0;
  async searchUser(val) {
    if (val.length > 3) {
      const body = {
        userName: val,
        page: 0,
      };
      const response = await fetchApi({
        method: 'post',
        reqUrl: url.USER_LIST,
        data: body,
      });
      this.searchlength = 1;
    } else {
      if (this.searchlength == 1) {
        this.searchlength = 0;
        document.getElementById('search').value = '';
      }
    }
  }


  render() {
    return (
      <div className="searchbar">
        <div className="formGroup">
          <input type="text" id="search" placeholder="Search User" name="search"
            onChange={() => this.searchUser(document.getElementById('search').value)} />
        </div>
      </div>
    );
  }
}

export default Search;
