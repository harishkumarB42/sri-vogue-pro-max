import React, { useEffect, useState } from 'react';
import { Flower2, Gem, Shirt, ShoppingBag, Sparkles, Watch } from 'lucide-react';

const colourHues = {
  black: 250, ivory: 38, white: 35, emerald: 150, green: 145, sage: 135,
  wine: 345, maroon: 350, burgundy: 350, ruby: 5, red: 5, coral: 14,
  blush: 345, rose: 335, pink: 330, fuchsia: 315, lavender: 275,
  purple: 275, blue: 220, navy: 225, teal: 180, turquoise: 182,
  mustard: 44, gold: 43, brown: 26, peach: 22, beige: 32, cream: 36,
};

function hueFor(product) {
  const colour = String(product?.colour || '').toLowerCase();
  const match = Object.entries(colourHues).find(([name]) => colour.includes(name));
  if (match) return match[1];
  const seed = String(product?.id || product?.name || 'sri-vogue');
  return [...seed].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360;
}

function IconFor({ category }) {
  const value = String(category || '').toLowerCase();
  if (/bag|accessor|footwear|shoe/.test(value)) return <ShoppingBag aria-hidden="true" />;
  if (/jewellery|jewelry|watch|sunglass/.test(value)) return /watch/.test(value) ? <Watch aria-hidden="true" /> : <Gem aria-hidden="true" />;
  if (/saree|ethnic|lehenga|kurta/.test(value)) return <Flower2 aria-hidden="true" />;
  if (/dress|shirt|top|jean|trouser|blazer|wear|skirt/.test(value)) return <Shirt aria-hidden="true" />;
  return <Sparkles aria-hidden="true" />;
}

export default function ProductImage({ product, className = 'product-photo', loading = 'lazy', forceFallback = false }) {
  const src = String(product?.image || '').trim();
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (src && !failed && !forceFallback) {
    return (
      <img
        className={className}
        src={src}
        alt={product?.name || 'Sri Vogue product'}
        loading={loading}
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  const hue = hueFor(product);
  return (
    <div
      className={`${className} product-artwork`}
      role="img"
      aria-label={`${product?.name || 'Sri Vogue selection'} — ${product?.category || 'fashion'}${product?.colour ? `, ${product.colour}` : ''}`}
      style={{ '--art-hue': hue }}
    >
      <div className="artwork-topline"><span>SRI VOGUE</span><span>{product?.id || 'SV'}</span></div>
      <div className="artwork-emblem"><IconFor category={product?.category} /></div>
      <div className="artwork-caption">
        <span>{product?.category || 'THE EDIT'}</span>
        <strong>{product?.name || 'A considered piece'}</strong>
        <small>{product?.colour || 'Made for your moments'}</small>
      </div>
      <span className="artwork-orbit" aria-hidden="true" />
    </div>
  );
}
