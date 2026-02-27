import React from 'react';
import Hero from '../components/Hero';
import LatestCollection from '../components/LatestCollection';
import FeaturedSpotlight from '../components/FeaturedSpotlight';
import PromoGrid from '../components/PromoGrid';

const Home = () => {
    return (
        <div>
            <Hero />
            <LatestCollection />
            <FeaturedSpotlight />
            <PromoGrid />
        </div>
    );
}

export default Home;