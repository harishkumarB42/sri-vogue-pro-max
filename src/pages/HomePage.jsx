import React from 'react';
import { ArrowRight, ArrowUpRight, Flower2, Gem, Heart, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import campaignArtwork from '../../data/home1.png';
import ProductImage from '../components/ProductImage.jsx';

const collections = [
  { name: 'Sarees', sub: 'Timeless drapes', icon: Flower2, tone: 'sarees' },
  { name: 'Ethnic Sets', sub: 'Made for celebrations', icon: Sparkles, tone: 'ethnic' },
  { name: 'Dresses', sub: 'Everyday statement', icon: Heart, tone: 'dresses' },
  { name: 'Accessories', sub: 'The finishing touch', icon: Gem, tone: 'accessories' },
];

export default function HomePage({ products = [], onShop, onOpenProduct }) {
  const featuredProducts = products.slice(0, 4);

  return (
    <main className="page home-page">
      <section className="sv-hero" style={{ '--campaign-artwork': `url("${campaignArtwork}")` }} aria-labelledby="home-title">
        <div className="sv-hero-content">
          <span className="sv-hero-label"><i /> THE FESTIVE &amp; EVERYDAY EDIT</span>
          <h1 id="home-title" className="sv-hero-title">Grace in <em>every occasion.</em></h1>
          <p className="sv-hero-description">Traditional roots. Contemporary style. Timeless you. Discover expressive pieces made for the moments that feel like yours.</p>
          <div className="hero-ctas">
            <button className="btn btn-primary" type="button" onClick={() => onShop('All')}>SHOP NEW ARRIVALS <ArrowUpRight size={15} /></button>
            <button className="text-link hero-secondary-link" type="button" onClick={() => onShop('Sarees')}>EXPLORE THE EDIT <ArrowRight size={15} /></button>
          </div>
          <div className="hero-trust" aria-label="Sri Vogue shopping benefits">
            <span><Truck aria-hidden="true" /><b>Thoughtful delivery</b><small>Free over ₹1,999</small></span>
            <span><ShieldCheck aria-hidden="true" /><b>Made for keeps</b><small>Quality you can feel</small></span>
          </div>
        </div>
        <div className="hero-image-caption"><span>01</span><i /> A celebration of craft &amp; modern form</div>
      </section>

      <section className="benefit-strip" aria-label="Shopping benefits">
        <div><Truck aria-hidden="true" /><span><b>Complimentary shipping</b><small>On orders above ₹1,999</small></span></div>
        <div><ArrowRight aria-hidden="true" /><span><b>Easy returns</b><small>Within 7 days of delivery</small></span></div>
        <div><ShieldCheck aria-hidden="true" /><span><b>Thoughtful quality</b><small>Pieces you'll wear again</small></span></div>
        <div><Sparkles aria-hidden="true" /><span><b>Personal style</b><small>Find your own signature</small></span></div>
      </section>

      <section className="section-block home-collections">
        <div className="section-heading">
          <div><span className="eyebrow">SHOP BY MOOD</span><h2>Find your <em>kind of beautiful.</em></h2></div>
          <button className="text-link" type="button" onClick={() => onShop('All')}>VIEW ALL CATEGORIES <ArrowRight size={15} /></button>
        </div>
        <div className="collection-grid">
          {collections.map(({ name, sub, icon: Icon, tone }, index) => {
            const sample = products.find((product) => product.category === name) || products[index] || { id: `SV-C${index + 1}`, name, category: name };
            return (
              <button className={`collection-tile category-${tone}`} key={name} type="button" onClick={() => onShop(name)} aria-label={`Shop ${name}`}>
                <div className="tile-image">
                  <ProductImage product={{ ...sample, name, category: name, image: '' }} className="tile-art" forceFallback loading="eager" />
                  <span className="tile-art-icon"><Icon size={20} aria-hidden="true" /></span>
                  <span className="tile-art-index">0{index + 1} / 04</span>
                </div>
                <div className="tile-meta"><span><b>{name}</b><small>{sub}</small></span><i><ArrowUpRight size={17} /></i></div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-block trending-block">
        <div className="section-heading">
          <div><span className="eyebrow">CURATED FOR YOU</span><h2>New season, <em>new favourites.</em></h2><p className="section-intro">A considered edit for celebrations, everyday rituals and everything in between.</p></div>
          <button className="text-link" type="button" onClick={() => onShop('All')}>SHOP THE COLLECTION <ArrowRight size={15} /></button>
        </div>
        {featuredProducts.length ? (
          <div className="product-grid home-product-grid">
            {featuredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <button className="product-media" type="button" onClick={() => onOpenProduct(product)} aria-label={`View ${product.name}`}>
                  <ProductImage product={product} />
                  {product.badge && <span className="product-tag">{product.badge}</span>}
                </button>
                <div className="product-info"><div><span className="product-category">{product.category}</span><h3>{product.name}</h3><small>{product.colour || 'Colour details coming soon'}</small></div><b>₹{Number(product.price).toLocaleString('en-IN')}</b></div>
                <button className="quick-add" type="button" onClick={() => onOpenProduct(product)}>VIEW DETAILS <ArrowRight size={14} /></button>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><span>✳</span><h3>Your edit is on its way</h3><p>Products will appear here once the catalogue loads.</p></div>}
      </section>

      <section className="quote-banner">
        <div className="quote-art" aria-hidden="true"><span className="quote-art-ring" /><Flower2 size={54} strokeWidth={0.8} /><small>THE SRI VOGUE EDIT</small></div>
        <div className="quote-copy"><span className="eyebrow">THE SRI VOGUE PHILOSOPHY</span><h2>Style is not what you wear.<br /><em>It's how you arrive.</em></h2><p>Thoughtful silhouettes, expressive details and versatile pieces that move with your life.</p><button className="btn btn-primary" type="button" onClick={() => onShop('All')}>EXPLORE SRI VOGUE <ArrowRight size={16} /></button></div>
      </section>
    </main>
  );
}
