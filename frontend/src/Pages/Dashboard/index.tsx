import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { QueueSize } from './Queue';
import { ProgressSize } from './Progress';
import Completed from './Completed';
import Runners from './Runners';
import GitHubStatus from './GitHubStatus';

function Dashboard() {
  return (
    <Box
      component="main"
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
        maxWidth: '60rem',
        margin: '0 auto',
        padding: '0 1rem',
        paddingBottom: '2rem',
      }}
    >
      <Grid container spacing={2}>
        {/* Recent workflow queue */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                <QueueSize />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                <ProgressSize />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                <Completed />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                <GitHubStatus />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        {/* Recent Workflows */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Runners />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
