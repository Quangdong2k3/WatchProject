import logo from './assets/watch-dak-logo.svg';
import logoLight from './assets/watch-dak-logo-light.svg';
import heroCouple from '../anh/10._CTA.jpg';
import newsImage from '../anh/news.webp';
import collections from '../shared/catalog.json';

export const siteAssets = { logo, logoLight, heroCouple, newsImage };

const watchImages = import.meta.glob('../anh/anhsp/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
  query: '?url'
});

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
