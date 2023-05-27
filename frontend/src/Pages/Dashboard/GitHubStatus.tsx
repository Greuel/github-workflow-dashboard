import { useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import useData from '../../common/useData';

interface Status {
  page: {
    id: string;
    name: string;
    url: string;
    time_zone: string;
    updated_at: string;
  };
  status: { indicator: string; description: string };
  components: Array<{ id: string; name: string; status: string }>;
}

function GitHubStatus() {
  const { loading, data: status } = useData<Status>('https://www.githubstatus.com/api/v2/status.json');
  const [openDialog, setOpenDialog] = useState(false);

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Paper
        elevation={3}
        sx={{
          padding: 2,
          backgroundColor: status?.status.indicator === 'none' ? '#4caf50' : '#f0ad4e',
          cursor: 'pointer',
          color: 'white',
          fontWeight: 'bold',
        }}
        onClick={handleDialogOpen}
      >
        {status ? (
          <div>
            <Typography variant="h6" gutterBottom>
              GitHub Status
            </Typography>
            {status.status.indicator === 'none' ? (
              <Typography variant="subtitle1">All systems operational</Typography>
            ) : (
              <div>
                {status.components.map((component) => (
                  <div key={component.id}>
                    <Typography variant="subtitle1">
                      {component.name}: {component.status}
                    </Typography>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Typography variant="body1">Loading GitHub status...</Typography>
        )}
      </Paper>
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>GitHub Status Website</DialogTitle>
        <DialogContent style={{ padding: 0, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          <iframe
            src="https://www.githubstatus.com/"
            title="GitHub Status"
            width="100%"
            height="100%"
            frameBorder="0"
          ></iframe>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GitHubStatus;
