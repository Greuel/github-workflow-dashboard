import useData, { BASE_URL } from '../../common/useData';
import UpdateIcon from '@mui/icons-material/Update';

import React, { useState } from 'react';
import { Paper, CircularProgress, TextField, Button, Dialog, DialogTitle, DialogContent, Typography } from '@mui/material';

type WorkflowStatusResponse = {
  in_progress_count: number;
  in_progress_workflows: string[];
  queued_count: number;
  queued_workflows: string[];
  log_messages: string[];
};

const UpdateWorkflowStatusButton = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<WorkflowStatusResponse | null>(null);
  const [open, setOpen] = useState(false);

  const handleUpdateStatus = async () => {
    setLoading(true);

    try {
      const endpoint = `${BASE_URL}/update-workflow-status`;

      const response = await fetch(endpoint, {
        method: 'POST',
      });

      if (response.ok) {
        const responseData: WorkflowStatusResponse = await response.json();
        setResponse(responseData);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      setOpen(true);
    } catch (error) {
      setResponse(null);
      setOpen(true);
    }

    setLoading(false);
  };

  return (
    <>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Button variant="contained" color="primary" startIcon={<UpdateIcon />} onClick={handleUpdateStatus} >
            Update Job Status
          </Button>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Job Status Update</DialogTitle>
        <DialogContent>
          {response ? (
            <>
              <Typography>In Progress Count: {response.in_progress_count}</Typography>
              <Typography>Queued Count: {response.queued_count}</Typography>
              <Typography>Log Messages:</Typography>
              <ul>
                {response.log_messages.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </>
          ) : (
            <Typography>An error occurred while updating the job status.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateWorkflowStatusButton;
