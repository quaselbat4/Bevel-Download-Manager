import http from 'http';
import https from 'https';
import { downloadError } from '../actions';

export default function makePartialRequest(id, url, rangeStart, rangeEnd) {
  return async (dispatch, _getState) => {
    const protocol = new URL(url).protocol === 'http:' ? http : https;
    const options = {
      headers: {
        Connection: 'keep-alive',
        Range: `bytes=${rangeStart}-${rangeEnd || ''}`
      }
    };

    return new Promise(resolve => {
      protocol
        .get(url, options)
        .on('response', res => {
          if (res.statusCode === 403) {
            dispatch(downloadError(id, { code: 'ERR_FORBIDDEN' }));
          }
          resolve(res)}
        )
        .on('error', err => dispatch(downloadError(id, { code: err.code })));
    });
  };
}
