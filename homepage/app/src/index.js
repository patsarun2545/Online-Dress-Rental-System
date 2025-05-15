import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import Home from './pages/Home';
import SingIn from './pages/signin';
import Singup from './pages/signup';
import Profile from './pages/profile';
import Orders from './pages/orders';
import Carts from './pages/carts'
import Heart from './pages/heart'
import ProductDetail from './pages/productdetail';
import Contact from './pages/contact';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home/>
  },
  {
    path: '/home',
    element: <Home/>
  },
  {
    path: '/singin',
    element: <SingIn/>
  },
  {
    path: '/singup',
    element: <Singup/>
  },
  {
    path: '/profile',
    element: <Profile/>
  },
  {
    path: '/orders',
    element: <Orders/>
  },
  {
    path: '/carts',
    element: <Carts/>
  },
  {
    path: '/heart',
    element: <Heart/>
  },
  {
    path: '/product/:id',
    element: <ProductDetail/>
  },
  {
    path: 'contact',
    element: <Contact/>
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <RouterProvider router={router}/>
);
