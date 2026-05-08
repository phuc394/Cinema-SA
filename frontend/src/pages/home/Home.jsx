import Header from '../../components/Header';
import Footer from '../../components/Footer';
import NowShowing from './components/NowShowing';
import ComingSoon from './components/ComingSoon';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <Header />
      <div className="home-body">
        <NowShowing />
        <ComingSoon />
      </div>
      <Footer />
    </div>
  );
};

export default Home;