import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

import Title from '../../components/Title';
import useData, { BASE_URL } from '../../common/useData';

export function QueueSize() {
  // TODO: find out the types of queue api
  const { loading, data: queue } = useData<any[]>(`${BASE_URL}/queue`);
  const queueSize = queue?.length ?? 0;

  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
          Jobs in Queue
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: 'lightblue',
            margin: '20px auto',
          }}
          onClick={handleDialogOpen}
          style={{ cursor: 'pointer' }}
        >
          <Typography variant="h4">{queueSize}</Typography>
        </Box>
      </Box>
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Queue Data</DialogTitle>
        <DialogContent>
          <QueueData />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

export function QueueData() {
  const { loading, data: queueData = [], error } = useData<any[]>(`${BASE_URL}/queue`);
  const [page, setPage] = React.useState(2);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const calculateTimeInQueue = (timestamp: string) => {
    const queueTime = new Date(timestamp); // Convert the queue timestamp to a Date object
    const currentTime = new Date(); // Get the current time

    // Calculate the time difference in milliseconds
    const timeDifference = currentTime.getTime() - queueTime.getTime();

    // Convert the time difference to a human-readable format
    const minutes = Math.floor(timeDifference / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days} days, ${hours % 24} hours, ${minutes % 60} minutes`;
  };

  const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalQueue = queueData.length;
  // Pagination calculations
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedQueue = queueData.slice(startIndex, endIndex);

  if (error) {
    return (
      <div role="alert">
        <p>Something went wrong:</p>
        <pre style={{ color: 'red' }}>{error.message}</pre>
      </div>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <React.Fragment>
      <Title>Current Queue: {totalQueue}</Title>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>id</TableCell>
            <TableCell>Repository</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Time in Queue</TableCell>
            <TableCell>Labels</TableCell>
            <TableCell>Workflow Name</TableCell>
            <TableCell>Link</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {queueData.map((queue) => (
            <TableRow>
              <TableCell>{queue.id}</TableCell>
              <TableCell>{queue.repo_name}</TableCell>
              <TableCell>{queue.timestamp}</TableCell>
              <TableCell>{queue.status}</TableCell>
              <TableCell>
                {queue.waiting_for_20_minutes ? (
                  <Alert variant="outlined" severity="error">
                    {calculateTimeInQueue(queue.timestamp)}
                  </Alert>
                ) : (
                  <Alert variant="outlined" severity="info">
                    {calculateTimeInQueue(queue.timestamp)}
                  </Alert>
                )}
              </TableCell>
              <TableCell>{queue.labels === '{}' ? '' : queue.labels.slice(1, -1)}</TableCell>
              <TableCell>{queue.workflow_name}</TableCell>
              <TableCell>
                <Link color="primary" href={queue.url}>
                  {queue.url}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </React.Fragment>
  );
}
