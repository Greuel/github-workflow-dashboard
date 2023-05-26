import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from "react";
import material from '@mui/material';
import * as Icons from '@mui/icons-material';
import styled from '@emotion/styled';
import react from '@emotion/react';
import Dashboard from './Dashboard';
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/workflows",
    element: <div>Hello World</div>
  }
]);

export default router;
