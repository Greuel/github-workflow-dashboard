import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Timer10SelectIcon from '@mui/icons-material/Timer10Select';
import { mainListItems, secondaryListItems } from './listItems';
import Chart from './Chart';
import { QueueSize, QueueData } from './Queue/Queue';
import { ProgressSize, ProgressData } from './Progress/Progress';
import Completed from './Completed';
import Workflows from './Workflows//Workflows';
import Runners from './Runners';
import GitHubStatus from './components/GitHubStatus';
import { useEffect, useState } from "react";

const mdTheme = createTheme();

function DashboardContent() {
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
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

export default function Dashboard() {
  return <DashboardContent />;
}
