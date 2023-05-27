import * as React from 'react';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import useData, { BASE_URL } from '../../common/useData';

export default function Completed() {
  // TODO: find out the types of completed api
  const { loading, data: completedData } = useData<any[]>(`${BASE_URL}/completed`);
  const completedSize = completedData?.length ?? 0;

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
          Jobs Completed
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
        >
          <Typography variant="h4">{completedSize}</Typography>
        </Box>
      </Box>
    </React.Fragment>
  );
}
