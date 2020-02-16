import { setTaskbarProgress } from '../utilities';
import {
  CANCEL_DOWNLOAD,
  ADD_NEW_DOWNLOAD,
  SHOW_DOWNLOAD_ERROR,
  DOWNLOAD_PROGRESSING,
  COMPLETE_DOWNLOAD,
  UPDATE_BYTES_DOWNLOADED_SHOWN
} from '../actions';

export default function windowProgressSyncer(store) {
  return next => action => {
    const watchedActionTypes = [
      UPDATE_BYTES_DOWNLOADED_SHOWN,
      CANCEL_DOWNLOAD,
      ADD_NEW_DOWNLOAD,
      SHOW_DOWNLOAD_ERROR,
      DOWNLOAD_PROGRESSING,
      COMPLETE_DOWNLOAD
    ];

    if (watchedActionTypes.includes(action.type)) {
      setTaskbarProgress(store.getState().downloads);
    }

    return next(action);
  };
}