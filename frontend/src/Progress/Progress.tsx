import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Title from '../Title';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useEffect, useState } from "react";
import useProgressData from './useProgressData';
import { Grid, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export function ProgressSize() {
  const {loading, progressSize, progressData } = useProgressData();
  const [dialogOpen, setDialogOpen] = useState(false);
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
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>Jobs in Progress</Typography>
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
          <Typography variant="h4">{progressSize}</Typography>
        </Box>
      </Box>
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Progress Data</DialogTitle>
        <DialogContent>
          <ProgressData />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

export function ProgressData() {
  const {progressData, loading } = useProgressData();
  const [page, setPage] = React.useState(2);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const handlePageChange = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }
  const totalProgress = progressData.length;
  // Pagination calculations
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedProgress = progressData.slice(startIndex, endIndex);

  return (
   <React.Fragment>
     <Title>Current In Progress: {totalProgress}</Title>
     <Table size="small">
     <TableHead>
       <TableRow>
         <TableCell>id</TableCell>
         <TableCell>Repository</TableCell>
         <TableCell>Date</TableCell>
         <TableCell>Status</TableCell>
         <TableCell>Workflow Name</TableCell>
         <TableCell>Link</TableCell>
       </TableRow>
     </TableHead>
     <TableBody>
       {progressData.map((progress) => (
         <TableRow>
           <TableCell>{progress.id}</TableCell>
           <TableCell>{progress.repo_name}</TableCell>
           <TableCell>{progress.timestamp}</TableCell>
           <TableCell>{progress.status}</TableCell>
           <TableCell>{progress.workflow_name}</TableCell>
           <TableCell>
             <Link color="primary" href={progress.url}>
               {progress.url}
             </Link>
           </TableCell>
         </TableRow>
       ))}
     </TableBody>
     </Table>
   </React.Fragment>
 );
}
