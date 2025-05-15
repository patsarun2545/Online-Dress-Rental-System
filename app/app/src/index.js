import React from 'react';
import ReactDOM from 'react-dom/client';


import {
  createBrowserRouter,
  RouterProvider
}from 'react-router-dom';
import SingIn from './pages/backoffice/signin';
import Home from './pages/backoffice/Home';
import Product from './pages/backoffice/Product';
import BillSale from './pages/backoffice/BillSale';
import Dashboard from './pages/backoffice/Dashboard';
import Category from './pages/backoffice/Category';
import Customer from './pages/backoffice/Customer';
import RentalDays from './pages/backoffice/RentalDays';
import User from './pages/backoffice/user';
import Account from './pages/backoffice/Account';

const router = createBrowserRouter([
  {
    path: '/',
    element: <SingIn/>
  },
  {
    path: '/home',
    element: <Home/>
  },
  {
    path: '/product',
    element: <Product/>
  },
  {
    path: '/billSale',
    element: <BillSale/>
  },
  {
    path: '/dashboard',
    element: <Dashboard/>
  },
  {
    path: '/category',
    element: <Category/>
  },
  {
    path: '/customer',
    element: <Customer/>
  },
  {
    path: '/user',
    element: <User/>
  },
  {
    path: '/account',
    element: <Account/>
  },
  {
    path: '/rentaldays',
    element: <RentalDays/>
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <RouterProvider router={router}/>
);
