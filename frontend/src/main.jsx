import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Home from './pages/home/Home.jsx'
import MovieDetails from './pages/movieDetails/MovieDetails.jsx'
import Login from './pages/login/Login.jsx'
import SignUp from './pages/signUp/signUp.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/movie/:id', element: <MovieDetails /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <SignUp /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
