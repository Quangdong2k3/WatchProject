import logo from '../anh/Watch71.png';
import heroCouple from '../anh/10._CTA.jpg';
import newsImage from '../anh/news.webp';

export const siteAssets = { logo, heroCouple, newsImage };

const watchImages = import.meta.glob('../anh/anhsp/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
  query: '?url'
});

const collections = {
  applewatch: { brand: 'Apple', prefix: 'Watch', category: 'Nữ', basePrice: 7490000 },
  aura: { brand: 'Aura', prefix: 'Aura', category: 'Nữ', basePrice: 2890000 },
  casio: { brand: 'Casio', prefix: 'G-Shock', category: 'Nam', basePrice: 3375900 },
  citizen: { brand: 'Citizen', prefix: 'Eco-Drive', category: 'Nam', basePrice: 5250000 },
  mido: { brand: 'Mido', prefix: 'Swiss', category: 'Nữ', basePrice: 8900000 },
  orient: { brand: 'Orient', prefix: 'Automatic', category: 'Nam', basePrice: 6590000 },
  seiko: { brand: 'Seiko', prefix: '5 Series', category: 'Nam', basePrice: 7182500 },
  tissot: { brand: 'Tissot', prefix: 'Swiss', category: 'Nữ', basePrice: 10990000 }
};

export const products = Object.entries(watchImages)
  .map(([path, image]) => {
    const match = path.match(/\.\.\/anh\/anhsp\/([^/]+)\/([^/]+)$/);
    if (!match || !collections[match[1]]) return null;

    const [, collectionKey, filename] = match;
    const collection = collections[collectionKey];
    const modelNumber = Number.parseInt(filename, 10) || 1;
    const price = collection.basePrice + ((modelNumber - 1) % 4) * 125000;
    const id = `${collectionKey}-${filename.replace(/\.[^.]+$/, '')}`;

    return {
      id,
      name: `${collection.prefix} ${String(modelNumber).padStart(2, '0')}`,
      brand: collection.brand,
      category: collection.category,
      image,
      price,
      originalPrice: Math.round(price * 1.11)
    };
  })
  .filter(Boolean)
  .sort((first, second) => first.id.localeCompare(second.id, undefined, { numeric: true }));

export const brands = [
  'CASIO', 'G-SHOCK', 'CITIZEN', 'ORIENT', 'SEIKO', 'FOSSIL',
  'TISSOT', 'LONGINES', 'MOVADO', 'BULOVA', 'RADO', 'MIDO'
];

export const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price)} ₫`;
