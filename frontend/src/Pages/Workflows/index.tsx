import * as React from 'react';
import { Box, CircularProgress, Grid, Paper } from '@mui/material';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from '../../components/Title';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import useData, { BASE_URL } from '../../common/useData';

export default function Workflows() {
  // TODO: find out the types of workflow_runs api
  const { loading, data: workflowData = [] } = useData<any[]>(`${BASE_URL}/workflow_runs`);

  const [page, setPage] = React.useState(2);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sort by id descending
  workflowData.sort(function (a, b) {
    return b.id - a.id;
  });
  const totalWorkflows = workflowData.length;
  // Pagination calculations
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedWorkflows = workflowData.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }

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
        paddingTop: '2rem',
      }}
    >
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Title>Recent Workflows</Title>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>id</TableCell>
              <TableCell>Repository</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Labels</TableCell>
              <TableCell>Link</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedWorkflows.map((workflow) => (
              <TableRow>
                <TableCell>{workflow.id}</TableCell>
                <TableCell>{workflow.repo_name}</TableCell>
                <TableCell>{workflow.timestamp}</TableCell>
                <TableCell>{workflow.workflow_name}</TableCell>
                <TableCell>{workflow.status}</TableCell>
                <TableCell>{workflow.labels === '{}' ? '' : workflow.labels.slice(1, -1)}</TableCell>
                <TableCell>
                  <Link color="primary" href={workflow.url}>
                    {workflow.url}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                colSpan={6} // Update colSpan to match the number of columns in your table
                count={totalWorkflows} // Replace with the total count of workflows
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                SelectProps={{
                  inputProps: {
                    'aria-label': 'rows per page',
                  },
                  native: true,
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </Paper>
    </Box>
  );
}
