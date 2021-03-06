import updateBytesDownloadedThunk from './update-bytes-downloaded';
import fs from 'fs';
import { getPartialDownloadPath } from '../utilities';
import { SAVE_DATA_LIMIT } from '../constants';
import Timeout from 'await-timeout';
import { setDownloadFileStream } from '../actions/downloads';

export default function downloadFile(id, res) {
  return async (dispatch, getState) => {
    let state = getState();
    let download = state.downloads.byId[id];

    const partialDownloadPath = getPartialDownloadPath(download);
    const fileStream = fs.createWriteStream(
      partialDownloadPath,
      download.bytesDownloaded > 0 ? { flags: 'a' } : undefined
    );
    dispatch(setDownloadFileStream(id, fileStream));

    const timeout = new Timeout();
    let buffer;
    let hasResEnded = false;
    let firstTimeoutRunning = false;
    let firstTimeoutElapsed = false;
    const firstSaveDataTimeout = new Timeout();

    res.on('data', async (chunk) => {
      res.pause();

      state = getState();
      download = state.downloads.byId[id];
      const getSpeedLimit = () =>
        (state.settings.saveData && SAVE_DATA_LIMIT) ||
        (download.limitSpeed && state.settings.downloadSpeedLimit);
      let speedLimit = getSpeedLimit();

      buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;

      if (speedLimit) {
        let shouldSkipSecondTimeout = false;

        const writeSlicedBuffer = async () => {
          if (shouldSkipSecondTimeout) shouldSkipSecondTimeout = false;
          else await timeout.set(500);

          state = getState();
          download = state.downloads.byId[id];

          if (['paused', 'canceled', 'complete'].includes(download.status)) {
            return;
          }

          const chunkToWrite = buffer.slice(0, speedLimit / 2);
          buffer = buffer.slice(speedLimit / 2);

          if (fileStream.destroyed) return;

          await writeStreamWritePromise(fileStream, chunkToWrite);
          await dispatch(
            updateBytesDownloadedThunk(
              id,
              download.bytesDownloaded + chunkToWrite.length
            )
          );

          state = getState();
          download = state.downloads.byId[id];
          speedLimit = getSpeedLimit();

          if (download.status !== 'paused' && download.status !== 'canceled') {
            if ((buffer.length > speedLimit && speedLimit) || hasResEnded) {
              await writeSlicedBuffer();
            } else res.resume();
          }
        };

        // Keep adding more data to buffer until length is more than half of
        // SAVE_DATA_LIMIT or timeout has elapsed.
        if (!firstTimeoutRunning) {
          firstTimeoutElapsed = false;
          firstTimeoutRunning = true;
          firstSaveDataTimeout.set(500).then(async () => {
            firstTimeoutElapsed = true;
            firstTimeoutRunning = false;
            shouldSkipSecondTimeout = true;
            res.pause();
            speedLimit = getSpeedLimit();
            if (speedLimit) await writeSlicedBuffer();
          });
        }
        if (!firstTimeoutElapsed) {
          if (buffer.length < speedLimit / 2) res.resume();
          else {
            firstTimeoutRunning = false;
            firstSaveDataTimeout.clear();
            res.pause();
            await writeSlicedBuffer();
          }
        }
      } else {
        if (fileStream.destroyed) return;

        await writeStreamWritePromise(fileStream, buffer);
        await dispatch(
          updateBytesDownloadedThunk(
            id,
            download.bytesDownloaded + buffer.length
          )
        );
        buffer = null;

        if (download.status !== 'paused') res.resume();
      }
    });
  };
}

function writeStreamWritePromise(writeStream, chunk) {
  return new Promise((resolve, reject) => {
    writeStream.write(chunk, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}
