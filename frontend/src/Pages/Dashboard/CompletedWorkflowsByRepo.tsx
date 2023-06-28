import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from '../../components/Title';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import { CheckCircle, Warning, Schedule } from '@mui/icons-material';
import { Box, CircularProgress, ListItemIcon } from '@mui/material';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import useData, { BASE_URL } from '../../common/useData';

export default function completedWorkflowsByRepo() {
  // TODO: find out the types of api
  const { loading, data: completedWorkflowsByRepo = [] } = useData<any[]>(`${BASE_URL}/workflows-completed-count-by-repo`);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Pagination calculations
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedcompletedWorkflowsByRepo = completedWorkflowsByRepo.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <React.Fragment>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Title>Top Completed Workflows by Repository</Title>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Repository</TableCell>
            <TableCell style={{ textAlign: 'center' }}>Completed Workflows</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedcompletedWorkflowsByRepo.map((completedWorkflowByRepo) => (
            <TableRow>
              <TableCell>{completedWorkflowByRepo.repo_name}</TableCell>
              <TableCell style={{ textAlign: 'center' }}>{completedWorkflowByRepo.num_workflows}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableBody></TableBody>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
              colSpan={5}
              count={completedWorkflowsByRepo.length}
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
    </React.Fragment>
  );
}
