import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import HomeHero from '../components/HomeHero';
import FeaturesSection from '../components/FeaturesSection';
import ContactSection from '../components/ContactSection';
import type { AppOutletContext } from '../layouts/MainLayout';

function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const { products } = useOutletContext<AppOutletContext>();

  const handleBrowse = () => {
    navigate('/discover');
  };

  return (
    <>
      <HomeHero highlights={products.highlights} onBrowse={handleBrowse} />
      <FeaturesSection />
      <ContactSection />
    </>
  );
}

export default HomePage;
