import React from 'react';
import { Hero } from '../components/home/Hero';
import { Benefits } from '../components/home/Benefits';
import { CategoryExplorer } from '../components/home/CategoryExplorer';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { BrandBar } from '../components/home/BrandBar';
import { ShoppingExperience } from '../components/home/ShoppingExperience';
import { Newsletter } from '../components/home/Newsletter';
import { SEOHead } from '../components/common/SEOHead';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Inicio | Catálogo de Belleza, Fragancias y Hogar"
        description="Tienda online oficial Las 3YR - Donde Enith en Colombia. Cosméticos y perfumería original Natura, Avon, Yanbal, Leonisa, Ésika y Azzorti con pagos por Nequi, Llave y Contraentrega."
      />
      <Hero />
      <Benefits />
      <CategoryExplorer />
      <FeaturedProducts />
      <BrandBar />
      <ShoppingExperience />
      <Newsletter />
    </div>
  );
};
