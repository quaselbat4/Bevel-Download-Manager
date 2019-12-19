import pauseDownload from './pause-download';
import Store from 'electron-store';
import { deleteFile, getDownloadPath } from './utilities';

export default function saveState() {
  return async (dispatch, getState) => {
    let state = getState();
    state.downloads.forEach(async download => {
      if (download.status === 'progressing') {
        await dispatch(pauseDownload(download.id));
      }
      if (!download.show) deleteFile(getDownloadPath(download));
    });

    const store = new Store();
    return new Promise(resolve => {
      setTimeout(() => {
        state = getState();
        store.set(
          'downloads',
          state.downloads
            .filter(
              download =>
                download.status !== 'gettinginfo' &&
                download.status !== 'removed' &&
                download.show
            )
            .map(download => {
              const { res, ...downloadWithoutRes } = { ...download };
              if (download.status === 'paused') {
                const { bytesDownloaded, ...downloadWithoutBytesDownloaded } = {
                  ...downloadWithoutRes
                };
                return downloadWithoutBytesDownloaded;
              }
              return downloadWithoutRes;
            })
        );
        store.set('settings', state.settings);
        resolve();
      }, 50);
    });
  };
}
