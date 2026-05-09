import { useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Movie from './components/Movie';
import './MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();

  return (
    <div className="movie-details">
      <Header />
      <div className="movie-details-body">
        <Movie movieId={id} />
      </div>
      <Footer />
    </div>
  );
};

export default MovieDetails;
