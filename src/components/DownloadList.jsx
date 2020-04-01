import React, { Fragment } from 'react';
import Download from './Download';
import {
  CircularProgress,
  makeStyles,
  Typography,
  createMuiTheme,
  MuiThemeProvider
} from '@material-ui/core';
import { connect } from 'react-redux';
import when from 'when-expression';
import moment from 'moment';
import groupBy from 'lodash.groupby';
import { orderBy } from 'natural-orderby';

const useStyles = makeStyles(theme => ({
  main: {
    textAlign: 'center',
    position: 'relative',
    minHeight: '70%',
    height: '70%',
    backgroundColor: theme.palette.background.default,
    overflowY: 'overlay',
    flex: '1 1 auto',
    display: 'flex',
    alignItems: 'center',
    flexFlow: 'column'
  },
  list: {
    position: 'relative',
    display: 'block',
    width: 600,
    textAlign: 'left',
    marginTop: theme.spacing(2)
  },
  gettingInfo: {
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'center'
  }
}));

const innerTheme = theme =>
  createMuiTheme({ ...theme, typography: { body1: { fontSize: 14 } } });

function DownloadList({ downloads = [] }) {
  const classes = useStyles();

  const grouped = groupBy(downloads, download =>
    moment(download.timestamp)
      .startOf('day')
      .format('MMMM D, YYYY')
  );

  return (
    <MuiThemeProvider theme={innerTheme}>
      <div className={classes.main}>
        {orderBy(Object.keys(grouped)).map(day => (
          <div className={classes.list}>
            {grouped[day].some(
              download => download.status !== 'getting info' && download.show
            ) > 0 && (
              <Typography variant="body1" style={{ fontWeight: 500 }}>
                {day}
              </Typography>
            )}
            {grouped[day].map(download => (
              <Fragment key={download.id}>
                {download.status === 'gettinginfo' ? (
                  <div className={classes.gettingInfo}>
                    <CircularProgress />
                  </div>
                ) : (
                  <Download {...download} />
                )}
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </MuiThemeProvider>
  );
}

export default connect(({ downloads, downloadGroup }) => ({
  downloads: when(downloadGroup)({
    all: downloads,
    else: downloads.filter(download => download.type === downloadGroup)
  })
}))(DownloadList);
