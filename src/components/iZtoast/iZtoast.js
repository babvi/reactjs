import iZtoast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

const toast = {

  /**
    * An error occurred
     * reference : ./src/redux/_helper/_helper/ErrorHanlder.js
     * @param {String} message message
     * @param {String} title title
     * @return {Object} returning Object
     */
  error: (message, title = 'Error') => {
    return iZtoast.error({
      title: title,
      message: message,
      timeout: 5000,
      position: 'topRight',
      progressBar: false,
      displayMode: 'once',
    });
  },
  success: (message, title = 'Success') => {
    return iZtoast.success({
      title: title,
      message: message,
      timeout: 5000,
      position: 'topRight',
    });
  },
};

export default toast;
