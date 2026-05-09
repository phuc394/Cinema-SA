import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Home from './pages/home/Home.jsx'
import MovieDetails from './pages/movieDetails/MovieDetails.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/movie/:id', element: <MovieDetails /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
