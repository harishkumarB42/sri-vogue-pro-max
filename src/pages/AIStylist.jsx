import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductImage from '../components/ProductImage.jsx';
import { Camera, Sparkles, Heart, ShoppingBag, Upload, WandSparkles, Palette, RefreshCw } from 'lucide-react';

const colorWords = [
  { name: 'Black', rgb: [30, 30, 32], match: ['black', 'charcoal'] },
  { name: 'Ivory', rgb: [235, 225, 207], match: ['ivory', 'cream', 'white', 'oat', 'natural', 'pearl', 'champagne', 'beige', 'sand'] },
  { name: 'Red', rgb: [170, 45, 55], match: ['red', 'ruby', 'maroon', 'wine', 'burgundy', 'cherry', 'coral'] },
  { name: 'Pink', rgb: [218, 139, 163], match: ['pink', 'rose', 'blush', 'fuchsia', 'magenta', 'mauve', 'lilac', 'peach'] },
  { name: 'Blue', rgb: [55, 95, 150], match: ['blue', 'navy', 'indigo', 'teal', 'sky'] },
  { name: 'Green', rgb: [58, 112, 78], match: ['green', 'emerald', 'sage', 'olive', 'forest'] },
  { name: 'Gold', rgb: [190, 150, 75], match: ['gold', 'mustard', 'amber', 'tan', 'camel'] },
  { name: 'Purple', rgb: [125, 80, 145], match: ['purple', 'lavender', 'plum', 'lilac'] },
  { name: 'Brown', rgb: [125, 82, 56], match: ['brown', 'chocolate', 'tan', 'camel', 'khaki'] },
  { name: 'White', rgb: [245, 243, 236], match: ['white', 'ivory', 'cream'] },
];
const distance = (a, b) => Math.sqrt(a.reduce((sum, value, i) => sum + (value - b[i]) ** 2, 0));
const nearestColour = (rgb) => colorWords.reduce((best, item) => (distance(rgb, item.rgb) < distance(rgb, best.rgb) ? item : best), colorWords[1]).name;

// Outfit "slots" so a look is one top/main piece + bottom + layer + shoes + bag + jewellery, never four of the same thing.
const SLOTS = {
  Women: {
    Festive: [['Sarees', 'Ethnic Sets', 'Lehengas', 'Kurtas'], ['Dupattas', 'Ethnic Jackets'], ['Footwear'], ['Bags'], ['Jewellery']],
    Wedding: [['Lehengas', 'Sarees', 'Gowns'], ['Dupattas'], ['Footwear'], ['Bags'], ['Jewellery']],
    Party: [['Dresses', 'Gowns', 'Jumpsuits', 'Co-ord Sets'], ['Jackets', 'Blazers'], ['Footwear'], ['Bags'], ['Jewellery']],
    Office: [['Shirts', 'Tops'], ['Trousers', 'Skirts'], ['Blazers'], ['Footwear'], ['Bags'], ['Watches', 'Jewellery']],
    Casual: [['Tops', 'Shirts', 'Dresses'], ['Jeans', 'Skirts', 'Shorts', 'Trousers'], ['Jackets', 'Knitwear', 'Sweatshirts'], ['Footwear'], ['Bags'], ['Sunglasses', 'Jewellery']],
  },
  Men: {
    Festive: [['Kurtas', 'Ethnic Sets'], ['Ethnic Jackets'], ['Footwear'], ['Watches', 'Accessories']],
    Wedding: [['Kurtas', 'Ethnic Sets'], ['Ethnic Jackets', 'Blazers'], ['Footwear'], ['Watches', 'Accessories']],
    Party: [['Shirts', 'Knitwear'], ['Trousers', 'Jeans'], ['Blazers', 'Jackets'], ['Footwear'], ['Watches', 'Sunglasses']],
    Office: [['Shirts'], ['Trousers'], ['Blazers'], ['Footwear'], ['Watches', 'Accessories']],
    Casual: [['T-Shirts', 'Polos', 'Shirts'], ['Jeans', 'Trousers', 'Shorts'], ['Jackets', 'Hoodies', 'Knitwear'], ['Footwear'], ['Sunglasses', 'Accessories', 'Watches']],
  },
};
const OCCASION_WORDS = {
  Festive: ['festive', 'traditional', 'ethnic', 'silk', 'embroidered', 'kurta', 'saree', 'mirror', 'brocade'],
  Casual: ['casual', 'cotton', 'everyday', 'relaxed', 'weekend', 'denim', 'linen'],
  Office: ['office', 'formal', 'tailored', 'classic', 'pinstripe', 'blazer', 'smart', 'trousers'],
  Wedding: ['wedding', 'bridal', 'velvet', 'embroidered', 'silk', 'brocade', 'gold', 'engagement'],
  Party: ['party', 'evening', 'satin', 'sequin', 'statement', 'night', 'heels', 'beaded', 'mini'],
};
const VIBE_WORDS = {
  Elegant: ['elegant', 'classic', 'silk', 'pearl', 'gold', 'satin', 'drape', 'draped'],
  Minimal: ['minimal', 'classic', 'linen', 'plain', 'simple', 'essential', 'cotton'],
  Bold: ['statement', 'sequin', 'embroidered', 'mirror', 'printed', 'floral', 'velvet', 'chunky'],
  Traditional: ['traditional', 'saree', 'kurta', 'ethnic', 'silk', 'temple', 'banarasi', 'kanjivaram'],
};
const words = (text) => new Set(String(text || '').toLowerCase().match(/[a-z]+/g) || []);

export default function AIStylist({ products = [], onOpenProduct, onAdd, onToggleWish, wishlist = [], onBackToShop }) {
  const [photo, setPhoto] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [forWho, setForWho] = useState('Women');
  const [occasion, setOccasion] = useState('Festive');
  const [vibe, setVibe] = useState('Elegant');
  const [detectedColour, setDetectedColour] = useState('Ivory');
  const [analysed, setAnalysed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState({ forWho: 'Women', occasion: 'Festive', vibe: 'Elegant', colour: 'Ivory' });
  const inputRef = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleFile = (file) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) return setError('Please select an image file (JPG, PNG or WEBP).');
    if (file.size > 8 * 1024 * 1024) return setError('Please choose an image under 8 MB.');
    const reader = new FileReader();
    reader.onerror = () => setError('That photo could not be read. Please try another one.');
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPhoto(dataUrl); setPhotoName(file.name); setAnalysed(false);
      // The image stays in this browser; it is never uploaded.
      const img = new Image();
      img.onload = () => {
        try {
          const size = 32;
          const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          const votes = {};
          // Sample the central area (where the outfit usually is) and skip near-white/near-grey studio backgrounds.
          for (let y = 6; y < size - 6; y++) for (let x = 8; x < size - 8; x++) {
            const i = (y * size + x) * 4; const rgb = [data[i], data[i + 1], data[i + 2]];
            const max = Math.max(...rgb), min = Math.min(...rgb);
            if (max > 236 && max - min < 18) continue;
            const name = nearestColour(rgb); votes[name] = (votes[name] || 0) + 1;
          }
          const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
          setDetectedColour(top ? top[0] : 'Ivory');
        } catch { setDetectedColour('Ivory'); }
      };
      img.onerror = () => setError('That image could not be analysed, but you can still pick a colour below.');
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const recommendations = useMemo(() => {
    const { forWho: who, occasion: occ, vibe: mood, colour } = request;
    const colourEntry = colorWords.find((c) => c.name === colour) || colorWords[1];
    const pool = products.filter((p) => p.audience === who || (p.audience === 'Accessories'));
    const used = new Set();
    const score = (p) => {
      const w = words(`${p.name} ${p.category} ${p.style} ${p.description}`);
      let total = 0;
      (OCCASION_WORDS[occ] || []).forEach((k) => { if (w.has(k)) total += 2; });
      (VIBE_WORDS[mood] || []).forEach((k) => { if (w.has(k)) total += 1.5; });
      const pc = String(p.colour || '').toLowerCase();
      if (colourEntry.match.some((m) => pc.includes(m))) total += 3;
      if (p.stock > 0) total += 0.3;
      total += (Number(p.rating) || 0) / 10;
      return total;
    };
    const picks = [];
    (SLOTS[who]?.[occ] || []).forEach((cats) => {
      const best = pool.filter((p) => cats.includes(p.category) && !used.has(p.id) && (p.audience === who || p.audience === 'Accessories')).sort((a, b) => score(b) - score(a))[0];
      if (best) { used.add(best.id); picks.push(best); }
    });
    return picks.length ? picks : products.filter((p) => p.audience === who).slice(0, 6);
  }, [products, request]);

  const runStylist = () => {
    setBusy(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setRequest({ forWho, occasion, vibe, colour: detectedColour }); setAnalysed(true); setBusy(false); }, 450);
  };
  const markDirty = () => setAnalysed(false);
  const addAll = () => recommendations.forEach((p) => onAdd?.(p, p.sizes?.[0] || 'Free size'));

  return <main className="ai-stylist-page">
    <style>{`
      .ai-stylist-page{--wine:#701626;--gold:#b99a64;--cream:#fbf5ed;color:#3c2c25;background:#fffdf9;padding:32px clamp(14px,4vw,58px) 64px;min-height:65vh}
      .ai-stylist-page *{box-sizing:border-box}.stylist-hero{text-align:center;margin:0 auto 30px;max-width:760px}.stylist-kicker{font-size:10px;letter-spacing:3px;color:var(--gold);text-transform:uppercase}.stylist-hero h1{font:400 clamp(32px,5vw,52px)/1.1 Georgia,serif;color:var(--wine);margin:12px 0}.stylist-hero p{font-size:13px;line-height:1.8;color:#81736a;margin:0 auto;max-width:580px}
      .stylist-layout{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(0,1.15fr);gap:24px;max-width:1180px;margin:auto;align-items:start}.stylist-panel{background:var(--cream);border:1px solid #eadbcb;padding:22px}.stylist-panel h2{font:400 24px Georgia,serif;color:var(--wine);margin:0 0 8px}.stylist-muted{color:#88776b;font-size:12px;line-height:1.7;margin:0 0 18px}.stylist-upload{display:flex;min-height:210px;align-items:center;justify-content:center;flex-direction:column;gap:10px;border:1px dashed #c7ad8e;background:#fffaf4;cursor:pointer;text-align:center;padding:14px;overflow:hidden}.stylist-upload img{width:100%;height:220px;object-fit:contain}.stylist-upload strong{font-size:12px;color:var(--wine)}.stylist-upload small{font-size:10px;color:#89776b}.stylist-field{display:grid;gap:7px;margin-top:17px}.stylist-field label{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#756257}.stylist-field select{width:100%;padding:12px;background:white;border:1px solid #e2d2c3;color:#4b3830;font:inherit;font-size:12px}.stylist-analyse{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;margin-top:20px;background:var(--wine);color:white;border:0;padding:14px;font-size:11px;letter-spacing:1px;cursor:pointer}.stylist-analyse:disabled{opacity:.65;cursor:wait}.stylist-privacy{font-size:10px;color:#8a796e;line-height:1.6;margin:12px 0 0}.stylist-results-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:16px}.stylist-results-head h2{font:400 25px Georgia,serif;color:var(--wine);margin:0}.stylist-color{font-size:10px;color:#8a796e;margin-top:5px}.stylist-product-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.stylist-product{min-width:0;border:1px solid #eee3d8;background:white}.stylist-product-image{position:relative;width:100%;aspect-ratio:3/3.7;background:#f7eee4;overflow:hidden;cursor:pointer}.stylist-product-image img,.stylist-product-photo{width:100%;height:100%;object-fit:cover;display:block}.stylist-product-image .product-artwork{height:100%}.stylist-product-image .stylist-placeholder{display:flex;align-items:center;justify-content:center;height:100%;padding:10px;color:#9b8268;font:12px Georgia,serif;text-align:center}.stylist-product-info{padding:11px}.stylist-product-info small{color:#a08768;font-size:9px;letter-spacing:1px;text-transform:uppercase}.stylist-product-info h3{font:400 14px/1.4 Georgia,serif;margin:5px 0;color:#392a24}.stylist-product-info strong{font-size:12px;color:var(--wine)}.stylist-product-actions{display:flex;gap:7px;margin-top:10px}.stylist-product-actions button{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;flex:1;padding:9px 5px;border:1px solid var(--wine);background:white;color:var(--wine);font-size:9px;cursor:pointer}.stylist-product-actions button:first-child{background:var(--wine);color:white}.stylist-spin{animation:stylistSpin .9s linear infinite}@keyframes stylistSpin{to{transform:rotate(360deg)}}.stylist-error{margin:10px 0 0;padding:9px 11px;background:#fdeceb;border:1px solid #e9b9b4;color:#8a2b24;font-size:11px;line-height:1.5}.stylist-empty{padding:32px 18px;background:#fffaf4;text-align:center;color:#89776b;font-size:12px;line-height:1.8}.stylist-empty svg{color:var(--gold);margin-bottom:8px}
      @media(max-width:760px){.ai-stylist-page{padding:25px 13px 40px}.stylist-layout{grid-template-columns:1fr;gap:16px}.stylist-panel{padding:16px}.stylist-upload{min-height:170px}.stylist-upload img{height:190px}.stylist-results-head h2{font-size:22px}.stylist-product-grid{gap:10px}.stylist-product-info{padding:9px}.stylist-product-info h3{font-size:12px}.stylist-product-actions button{font-size:8px}}
    `}</style>
    <header className="stylist-hero"><span className="stylist-kicker">Your personal fashion assistant</span><h1>Meet your AI Stylist</h1><p>Upload an outfit or inspiration photo, choose the occasion and your style mood, and get a curated outfit-and-accessories edit from Sri Vogue.</p></header>
    <div className="stylist-layout">
      <section className="stylist-panel"><h2><WandSparkles size={20} style={{verticalAlign:'middle',marginRight:8}}/>Style your moment</h2><p className="stylist-muted">Your photo is processed in this browser for a colour cue. It is not uploaded or stored by Sri Vogue.</p>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={e=>handleFile(e.target.files?.[0])}/>
        <button type="button" className="stylist-upload" onClick={()=>inputRef.current?.click()}>
          {photo ? <img src={photo} alt="Your uploaded style inspiration"/> : <><Upload size={28} color="#b99a64"/><strong>Upload your photo or outfit inspiration</strong><small>JPG, PNG or WEBP · up to 8 MB</small></>}
        </button>
        {error && <p className="stylist-error" role="alert">{error}</p>}
        {photoName && <p className="stylist-privacy">Selected: {photoName}</p>}
        <div className="stylist-field"><label htmlFor="sv-who">Styling for</label><select id="sv-who" value={forWho} onChange={e=>{setForWho(e.target.value);markDirty()}}><option>Women</option><option>Men</option></select></div>
        <div className="stylist-field"><label htmlFor="sv-occasion">Occasion</label><select id="sv-occasion" value={occasion} onChange={e=>{setOccasion(e.target.value);markDirty()}}><option>Festive</option><option>Wedding</option><option>Party</option><option>Office</option><option>Casual</option></select></div>
        <div className="stylist-field"><label htmlFor="sv-vibe">Your style mood</label><select id="sv-vibe" value={vibe} onChange={e=>{setVibe(e.target.value);markDirty()}}><option>Elegant</option><option>Minimal</option><option>Bold</option><option>Traditional</option></select></div>
        <div className="stylist-field"><label><Palette size={13} style={{verticalAlign:'middle',marginRight:5}}/>Colour cue</label><select value={detectedColour} onChange={e=>{setDetectedColour(e.target.value);markDirty()}}>{colorWords.map(c=><option key={c.name}>{c.name}</option>)}</select></div>
        <button className="stylist-analyse" onClick={runStylist} disabled={busy}>{busy?<RefreshCw size={15} className="stylist-spin"/>:<Sparkles size={15}/>} {busy?'CURATING YOUR LOOK...':'FIND MY LOOK'}</button>
        <p className="stylist-privacy">Demo AI stylist: recommendations use your selected occasion, style mood and colour cue to rank the available catalogue. No face recognition is used.</p>
      </section>
      <section><div className="stylist-results-head"><div><h2>{analysed?'Your curated look':'Style inspiration'}</h2><div className="stylist-color">{analysed?`${request.forWho} · ${request.occasion} · ${request.vibe} · ${request.colour} palette`:'Choose your details, then tap Find My Look'}</div></div><Sparkles color="#b99a64" size={22}/></div>
        {recommendations.length ? <><div className="stylist-product-grid">{recommendations.map((p)=> <article className="stylist-product" key={p.id}><div className="stylist-product-image" onClick={()=>onOpenProduct?.(p)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&onOpenProduct?.(p)}><ProductImage product={p} className="stylist-product-photo"/></div><div className="stylist-product-info"><small>{p.category}</small><h3>{p.name}</h3><strong>₹{Number(p.price).toLocaleString('en-IN')}</strong><div className="stylist-product-actions"><button onClick={()=>onAdd?.(p,p.sizes?.[0]||'Free size')}><ShoppingBag size={13}/> Add</button><button onClick={()=>onToggleWish?.(p.id)} aria-label="Save item"><Heart size={13} fill={wishlist.includes(p.id)?'currentColor':'none'}/></button></div></div></article>)}</div><button className="stylist-analyse" onClick={addAll}><ShoppingBag size={15}/> ADD THE WHOLE LOOK TO BAG</button></> : <div className="stylist-empty"><Camera size={26}/><br/>Products will appear here once the catalogue loads.</div>}
        {onBackToShop&&<button type="button" className="stylist-analyse" style={{background:'transparent',color:'#701626',border:'1px solid #701626'}} onClick={onBackToShop}>EXPLORE ALL PRODUCTS</button>}
      </section>
    </div>
  </main>;
}
