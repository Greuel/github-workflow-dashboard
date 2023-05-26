import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { QueueSize } from './Queue';
import { ProgressSize } from './Progress';
import Completed from './Completed';
import Workflows from './Workflows';
import Runners from './Runners';
import GitHubStatus from './GitHubStatus';

function Dashboard() {
  return (
    <Box
      component="main"
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Recent workflow queue */}
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
          {/* Recent Workflows */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Runners />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Workflows />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard;
