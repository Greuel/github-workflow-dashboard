import * as React from 'react';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';

function useCompleted() {
  const [completedData, setCompletedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:3100/completed')
      .then((response) => response.json())
      .then((json) => {
        console.log('Fetched completed data:', json); // Debugging statement
        setCompletedData(json);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  console.log('Completed data:', completedData); // Debugging statement
  return { completedData, loading };
}

export default function Completed() {
  const { completedData, loading } = useCompleted();
  const completedSize = completedData.length;
  console.log('Completed:', completedData);
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
