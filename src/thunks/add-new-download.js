import {
  addNewDownload,
  gotDownloadInfo,
  removeDownload,
  notify,
  openDialog
} from '../actions';
import { getFilename, getFileSize, getAvailableFilename } from '../utilities';
import { v4 } from 'uuid';
import ytdl from 'ytdl-core';
import filenameReservedRegex from 'filename-reserved-regex';
import remoteFilename from 'remote-file-info';
import youtubeUrl from 'youtube-url';
import isOnline from 'is-online';
import http from 'http';
import https from 'https';

export default function addNewDownloadThunk(url, dirname) {
  return async (dispatch, getState) => {
    if (youtubeUrl.valid(url)) {
      return dispatch(addNewYoutubeDownloadThunk(url, dirname));
    }

    const id = v4();
    dispatch(addNewDownload(id, 'file', url, dirname));

    const protocol = new URL(url).protocol === 'http:' ? http : https;

    const res = await new Promise(async resolve =>
      protocol
        .get(url, { headers: { Range: 'bytes=0-' } })
        .on('response', res => resolve(res))
        .on('error', () => {
          dispatch(removeDownload(id));
          dispatch(
            notify('error', 'Network error', 'Retry', () =>
              dispatch(addNewDownloadThunk(url, dirname))
            )
          );
        })
    );
    res.destroy();

    if (res.statusCode === 403) {
      dispatch(removeDownload(id));
      dispatch(notify('error', 'Forbidden request'));

      return Promise.resolve();
    }

    // Get info from the request.
    const filename = getFilename(url, res.headers);
    const size = getFileSize(res.headers);

    dispatch(
      gotDownloadInfo(
        id,
        filename,
        await getAvailableFilename(dirname, filename, getState().downloads),
        size,
        res.statusCode === 206
      )
    );

    return Promise.resolve();
  };
}

export function addNewYoutubeDownloadThunk(url, dirname) {
  return async dispatch => {
    const id = v4();
    dispatch(addNewDownload(id, 'youtube', url, dirname));

    if (!(await isOnline())) {
      dispatch(removeDownload(id));
      dispatch(
        notify('error', 'Network error', 'Retry', () =>
          dispatch(addNewYoutubeDownloadThunk(url, dirname))
        )
      );
      return;
    }

    ytdl.getInfo(url, async (err, info) => {
      if ((err && err.code === 'ENOTFOUND') || !info) {
        dispatch(removeDownload(id));
        dispatch(notify('error', 'YouTube video not found'));
        return;
      }

      dispatch(
        openDialog('youtuberes', {
          downloadId: id,
          videoTitle: info.title.replace(filenameReservedRegex(), ' '),
          videoFormats: await Promise.all(
            info.formats
              .filter(format => format.qualityLabel && format.audioQuality)
              .map(async format => ({
                ...format,
                contentLength: format.contentLength
                  ? Number.parseInt(format.contentLength)
                  : (await remoteFilename(format.url).catch(reason => false))
                      .fileSize
              }))
          )
        })
      );
    });
  };
}
