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

export default function Runners() {
  // TODO: find out the types of runners api
  const { loading, data: runners = [] } = useData<any[]>(`${BASE_URL}/runners`);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string, busy: boolean) => {
    if (status === 'offline') {
      return 'red';
    } else if (status === 'online' && busy) {
      return 'yellow';
    } else if (status === 'online') {
      return 'green';
    }
    return 'inherit';
  };

  const getStatusIcon = (status: string, busy: boolean) => {
    if (status === 'offline') {
      return <Warning />;
    } else if (status === 'online' && busy) {
      return <Schedule color="primary" />;
    } else if (status === 'online') {
      return <CheckCircle />;
    }
    return null;
  };
  // Pagination calculations
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRunners = runners.slice(startIndex, endIndex);

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
        <Title>Runners</Title>
        <React.Fragment>
          <Typography variant="h1" color="textSecondary" style={{ display: 'flex', alignItems: 'center' }}>
            <TableCell>
              <ListItemIcon>
                <Warning style={{ color: 'red' }} />
              </ListItemIcon>
              Offline
            </TableCell>
            <TableCell>
              <ListItemIcon>
                <CheckCircle style={{ color: 'green' }} />
              </ListItemIcon>
              Online / Ready
            </TableCell>
            <TableCell>
              <ListItemIcon>
                <Schedule style={{ color: 'primary' }} />
              </ListItemIcon>
              Online / Busy
            </TableCell>
          </Typography>
        </React.Fragment>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>id</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Labels</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedRunners.map((runner) => (
            <TableRow key={runner.id}>
              <TableCell>{runner.id}</TableCell>
              <TableCell>{runner.name}</TableCell>
              <TableCell>
                <ListItemIcon style={{ color: getStatusColor(runner.status, runner.busy) }}>
                  {getStatusIcon(runner.status, runner.busy)}
                </ListItemIcon>
              </TableCell>
              <TableCell>{runner.labels.map((label: { name: string }) => label.name).join(', ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableBody></TableBody>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
              colSpan={5}
              count={runners.length}
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
