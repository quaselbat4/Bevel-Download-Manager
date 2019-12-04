import C from '../actions';

export function downloads(state = [], action) {
  switch (action.type) {
    case C.ADD_NEW_DOWNLOAD:
      return [
        ...state,
        {
          id: action.id,
          url: action.url,
          dirname: action.dirname,
          status: action.status
        }
      ];
    case C.START_DOWNLOAD:
      return state.map(download =>
        download.id === action.id
          ? {
              ...download,
              res: action.res,
              status: action.status
            }
          : download
      );
    case C.UPDATE_BYTES_DOWNLOADED:
      return state.map(download =>
        download.id === action.id
          ? {
              ...download,
              bytesDownloaded: action.bytesDownloaded
            }
          : download
      );
    case C.PAUSE_DOWNLOAD:
    case C.COMPLETE_DOWNLOAD:
    case C.DOWNLOAD_REMOVED:
      return state.map(download =>
        download.id === action.id
          ? {
              ...download,
              status: action.status
            }
          : download
      );
    case C.RESUME_DOWNLOAD:
    case C.CANCEL_DOWNLOAD:
      return state.map(download =>
        download.id === action.id
          ? {
              ...download,
              status: action.status,
              res: action.res
            }
          : download
      );
    case C.REMOVE_DOWNLOAD:
      return state.filter(download => download.id !== action.id);
    case C.CHANGE_DOWNLOAD_URL:
      return state.map(download =>
        download.id === action.id
          ? {
              ...download,
              url: action.newUrl,
              res: action.res
            }
          : download
      );
    case C.DOWNLOAD_ERROR:
      return state.map(download =>
        download.id === action.id
          ? {
              ...download,
              status: action.status,
              error: action.error,
              res: action.res
            }
          : download
      );
    case C.CHANGE_DOWNLOAD_BASIC_INFO:
      return state.map(download =>
        download.id === action.id
          ? {
              ...download,
              filename: action.filename,
              availableFilename: action.availableFilename,
              size: action.size,
              resumable: action.resumable
            }
          : download
      );
    case C.HIDE_DOWNLOAD:
    case C.SHOW_DOWNLOAD:
      return state.map(download =>
        download.id === action.id
          ? {
              ...download,
              show: action.show
            }
          : download
      );
    case C.DOWNLOAD_NOT_STARTED:
      return state.map(download =>
        download.id === action.id
          ? {
              ...download,
              status: action.status,
              show: action.show
            }
          : download
      );
    default:
      return state;
  }
}

export function interval(state = null, action) {
  switch (action.type) {
    case C.SET_INTERVAL:
      return action.interval;
    default:
      return state;
  }
}

export function intervalSubscribers(state = [], action) {
  switch (action.type) {
    case C.SUBSCRIBE_TO_INTERVAL:
      return [...state, { id: action.id, action: action.action }];
    case C.UNSUBSCRIBE_FROM_INTERVAL:
      return state.filter(subscriber => subscriber.id !== action.id);
    default:
      return state;
  }
}

export function message(state = {}, action) {
  switch (action.type) {
    case C.ALERT:
      return {
        value: action.message,
        type: action.messageType,
        actionName: action.actionName,
        action: action.action
      };
    default:
      return state;
  }
}

export function settings(state = {}, action) {
  switch (action.type) {
    case C.TOGGLE_SAVE_DATA:
      return {
        ...state,
        saveData: action.value
      };
    default:
      return state;
  }
}
