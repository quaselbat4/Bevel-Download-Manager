import React from 'react';
import { connect } from 'react-redux';
import DownloadActionButton from './DownloadActionButton';
import PeriodicUpdate from './PeriodicUpdate';
import DownloadSpeed from './DownloadSpeed';
import { shell } from 'electron';
import path from 'path';
import { thunkCancelDownload, thunkRemoveDownload } from '../thunks';
import prettyBytes from '../pretty-bytes';
import {
  LinearProgress,
  Card,
  CardContent,
  IconButton
} from '@material-ui/core';
import './Download.css';
import { WhiteButton } from './CustomButtons';
import { Close } from '@material-ui/icons';
import { makeStyles, withStyles } from '@material-ui/styles';
import { grey, blue } from '@material-ui/core/colors';
import when from 'when-expression';
import DownloadMoreActions from './DownloadMoreActions';
import pathExists from 'path-exists';
import { downloadRemoved } from '../actions';

const useStyles = makeStyles(theme => ({
  cardError: {
    backgroundColor: '#fbfbfb',
    boxShadow: 'none',
    border: '0.5px solid #e0e0e0'
  },
  cardContent: {
    margin: '3px',
    paddingTop: 0
  },
  iconButton: {
    float: 'right',
    marginRight: '-14px'
  },
  colorLinearProgress: {
    width: '95%',
    padding: '0',
    marginBottom: '10px'
  }
}));

const ColorLinearProgress = withStyles({
  barColorPrimary: {
    backgroundColor: blue['600']
  }
})(LinearProgress);

const filenameStyles = {
  error: {
    color: grey['600'],
    textDecoration: 'line-through'
  },
  complete: {
    cursor: 'pointer'
  }
};

const moreVert = {
  float: 'right',
  position: 'absolute',
  right: 0,
  top: '25%',
  bottom: '100%'
};

function Download({
  id,
  url,
  availableFilename,
  dirname,
  size,
  bytesDownloaded,
  status,
  dispatch,
  error
}) {
  const fullPath = path.resolve(dirname, availableFilename);

  const openFolder = async () => {
    if (!await pathExists(fullPath)) dispatch(downloadRemoved(id));
    else shell.showItemInFolder(fullPath);
  };

  const openFile = async () => {
    if (status === 'complete') {
      if (!await pathExists(fullPath)) dispatch(downloadRemoved(id));
      else shell.openItem(fullPath);
    }
  };

  const openUrl = () => {
    shell.openExternal(url);
  };

  const cancel = () => {
    dispatch(thunkCancelDownload(id));
  };

  const remove = () => {
    dispatch(thunkRemoveDownload(id));
  };

  const classes = useStyles();

  return (
    <div className="Download">
      <Card
        style={{ position: 'relative' }}
        className={
          status === 'canceled' || status === 'error' || status === 'deleted'
            ? classes.cardError
            : {}
        }
      >
        <CardContent className={classes.cardContent}>
          <div>
            {(status === 'canceled' ||
              status === 'complete' ||
              status === 'error' ||
              status === 'deleted') && (
              <IconButton className={classes.iconButton} onClick={remove}>
                <Close style={{ fontSize: '15px' }} />
              </IconButton>
            )}
            <br />
            {status !== 'complete' && status !== 'deleted' && (
              <div style={moreVert}>
                <DownloadMoreActions id={id} currentUrl={url} />
              </div>
            )}
            <button
              className="Download-link-button Download-file"
              onClick={openFile}
              style={when(status)({
                canceled: filenameStyles.error,
                complete: filenameStyles.complete,
                error: filenameStyles.error,
                deleted: filenameStyles.error,
                else: {}
              })}
            >
              {availableFilename}
            </button>
            <span style={{ marginLeft: 10, fontWeight: 500 }}>
              {when(status)({
                canceled: 'Canceled',
                error: error
                  ? when(error.code)({
                      ERR_FILE_CHANGED: 'File changed',
                      else: null
                    })
                  : null,
                deleted: 'Deleted',
                else: null
              })}
            </span>
            <br />
            <div>
              <button
                className="Download-link-button Download-url"
                onClick={openUrl}
              >
                {url}
              </button>
            </div>
            <br />
            {status !== 'complete' &&
              status !== 'canceled' &&
              status !== 'error' &&
              status !== 'deleted' && (
                <PeriodicUpdate start={status === 'started'} interval={500}>
                  <div style={{ marginBottom: '10px' }}>
                    <DownloadSpeed
                      bytesDownloaded={bytesDownloaded}
                      status={status}
                    />
                    {prettyBytes(bytesDownloaded)} of {prettyBytes(size)}
                  </div>
                </PeriodicUpdate>
              )}
            {status === 'complete' && (
              <button
                className="Download-link-button Download-show-in-folder"
                onClick={openFolder}
              >
                Show in folder
              </button>
            )}
            {status !== 'complete' &&
              status !== 'canceled' &&
              status !== 'error' &&
              status !== 'deleted' && (
                <PeriodicUpdate start={status === 'started'}>
                  <ColorLinearProgress
                    value={(bytesDownloaded / size) * 100}
                    variant="determinate"
                    className={classes.colorLinearProgress}
                  />
                </PeriodicUpdate>
              )}
            <DownloadActionButton id={id} status={status} />
            {status !== 'canceled' &&
              status !== 'complete' &&
              status !== 'error' &&
              status !== 'deleted' && (
                <WhiteButton onClick={cancel} variant="contained" size="small">
                  Cancel
                </WhiteButton>
              )}
            <br />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default connect()(Download);
