import { ErrorBoundary } from 'react-error-boundary';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { red } from '@mui/material/colors';
import NavigationDrawer from './NavigationDrawer';

// A custom theme for this app
const theme = createTheme({
  palette: {
    error: {
      main: red.A400,
    },
    background: {
      default: '#eeeeee',
    },
  },
});

function fallbackRender({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <NavigationDrawer />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
