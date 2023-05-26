import * as React from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Drawer,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Grid,
  Link,
  Divider,
  Typography,
  List,
  Toolbar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import Dashboard from './Pages/Dashboard/Dashboard';

function NavigationDrawer() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = React.useState(true);
  const [drawerPadding, setDrawerPadding] = React.useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const measuredDrawerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      setDrawerPadding(0);
      return;
    }
    if (node !== null && node.firstChild) {
      const drawerElement = node.firstChild as HTMLElement;
      setDrawerPadding(drawerElement.clientWidth);
    }
  }, []);

  const toggleDrawer = () => {
    setMenuOpen(!menuOpen);
  };

  const onNavigationEntryClicked = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <React.Fragment>
      <React.Fragment>
        <AppBar position="fixed">
          <Toolbar variant={isMobile ? 'dense' : 'regular'}>
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <IconButton onClick={() => setMenuOpen(!menuOpen)} edge="start" color="inherit" size="large">
                  <MenuIcon />
                </IconButton>
              </Grid>
              <Grid item>
                <Typography component="h1" variant="h6" color="inherit">
                  Workflow Dashboard
                </Typography>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>

        <Drawer
          ref={measuredDrawerRef}
          variant={isMobile ? 'temporary' : 'permanent'}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        >
          <List
            sx={{
              paddingTop: 0,
              a: {
                textDecoration: 'none',
                color: 'black',
              },
            }}
          >
            <IconButton sx={{ minHeight: isMobile ? '56px' : '64px', boxSizing: 'border-box' }}>
              <img src="logo192.png" alt="Logo" height={36} />
            </IconButton>
            <Divider />
            <React.Fragment>
              <ListItemButton selected={location.pathname === '/'} onClick={() => onNavigationEntryClicked('/')}>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>

              <ListItemButton
                selected={location.pathname === '/workflows'}
                onClick={() => onNavigationEntryClicked('/workflows')}
              >
                <ListItemIcon>
                  <AltRouteIcon />
                </ListItemIcon>
                <ListItemText primary="Workflows" />
              </ListItemButton>
            </React.Fragment>
          </List>
        </Drawer>
      </React.Fragment>
      <main style={{ marginTop: '7rem', paddingLeft: `${drawerPadding}px` }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workflows" element={<div>Hi blablablablablalbalblabalbla</div>} />
          <Route element={<div>Not Found</div>} />
        </Routes>
      </main>
    </React.Fragment>
  );
}

export default NavigationDrawer;
