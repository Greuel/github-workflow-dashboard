import { Typography } from '@mui/material';
import { Link } from 'react-router-dom';

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyleft © '}
      <Link color="inherit" to="https://github.com/Greuel">
        Greuel
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

export default Copyright;
