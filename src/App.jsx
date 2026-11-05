import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  Bot,
  Check,
  ChevronRight,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Minus,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Snowflake,
  ShoppingBag,
  Sun,
  Truck,
  UserRound,
  X
} from 'lucide-react';
import { brands, formatPrice, products, siteAssets } from './data.js';
import { getAuthMessage, useAuth } from './auth.jsx';

const CartContext = createContext(null);

function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside App.');
  return context;
}

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
        });
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.search, location.hash]);

  return null;
}

function Reveal({ as: Element = 'div', children, className = '', delay = 0 }) {
  const revealRef = useRef(null);

  useEffect(() => {
    const element = revealRef.current;
    if (!element) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      element.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Element
      ref={revealRef}
      className={`reveal ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      {children}
    </Element>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('watch-dak-theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('watch-dak-cart') || '[]');
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('watch-dak-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('watch-dak-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === product.id);
      if (existing) {
        return currentItems.map((item) => item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item);
      }
      return [...currentItems, { ...product, quantity }];
    });
    setToast(`${product.name} đã được thêm vào giỏ`);
    window.setTimeout(() => setToast(''), 2600);
  };

  const setQuantity = (productId, quantity) => {
    setCartItems((currentItems) => currentItems
      .map((item) => item.id === productId ? { ...item, quantity } : item)
      .filter((item) => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== productId));
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartContext = {
    addToCart,
    cartCount,
    cartItems,
    cartTotal,
    clearCart: () => setCartItems([]),
    removeFromCart,
    setQuantity
  };

  return (
    <CartContext.Provider value={cartContext}>
      <ScrollManager />
      <SiteHeader
        onOpenCart={() => setCartOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
      />
      <ChristmasEffects />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/Buynow.html" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/LOGIN.html" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/formdnhap/formdnhap.html" element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
      <FloatingAssistant />
      {toast && <div className="toast-message" role="status"><Check size={17} />{toast}</div>}
    </CartContext.Provider>
  );
}

function SiteHeader({ onOpenCart, theme, onToggleTheme }) {
  const [searchText, setSearchText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { user, signOut } = useAuth();

  const handleSearch = (event) => {
    event.preventDefault();
    const search = searchText.trim();
    navigate(search ? `/?q=${encodeURIComponent(search)}` : '/');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="utility-row">
        <div className="utility-inner">
          <span>Đồng hồ chính hãng · Bảo hành toàn quốc</span>
          <span><Truck size={14} /> Giao hàng miễn phí từ 2.000.000₫</span>
        </div>
      </div>
      <div className="header-main wrap">
        <button className="mobile-menu-toggle icon-button" type="button" aria-label="Mở menu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link className="brand-mark" to="/" aria-label="WATCH DAK trang chủ" onClick={closeMenu}>
          <img src={siteAssets.logo} alt="WATCH DAK" />
        </Link>
        <form className="search-box" role="search" onSubmit={handleSearch}>
          <input
            aria-label="Tìm đồng hồ"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Tìm thương hiệu, mẫu đồng hồ..."
          />
          <button type="submit" aria-label="Tìm kiếm"><Search size={18} /></button>
        </form>
        <div className="header-actions">
          <button className="theme-toggle icon-button" type="button" aria-label={theme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'} title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'} onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={18} />}
          </button>
          {user ? (
            <div className="signed-in-actions">
              <span className="signed-in-name" title={user.email || ''}><UserRound size={17} />{user.displayName || user.email}</span>
              <button className="sign-out-button" type="button" title="Đăng xuất" aria-label="Đăng xuất" onClick={() => signOut()}><LogOut size={16} /></button>
            </div>
          ) : <Link className="account-link" to="/login"><UserRound size={18} /><span>Tài khoản</span></Link>}
          <button className="cart-trigger icon-button" type="button" aria-label={`Mở giỏ hàng, ${cartCount} sản phẩm`} onClick={onOpenCart}>
            <ShoppingBag size={20} />
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </div>
      <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Danh mục chính">
        <div className="main-nav-inner wrap">
          <Link to="/#menwatch" onClick={closeMenu}>Đồng hồ nam</Link>
          <Link to="/#womenwatch" onClick={closeMenu}>Đồng hồ nữ</Link>
          <Link to="/products" onClick={closeMenu}>Bộ sưu tập</Link>
          <Link to="/#brands" onClick={closeMenu}>Thương hiệu</Link>
          <Link to="/#journal" onClick={closeMenu}>Tạp chí</Link>
          <Link to="/register" onClick={closeMenu}>Ưu đãi thành viên <ArrowUpRight size={14} /></Link>
        </div>
      </nav>
    </header>
  );
}

function ChristmasEffects() {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(motionPreference.matches);
    motionPreference.addEventListener('change', updatePreference);
    return () => motionPreference.removeEventListener('change', updatePreference);
  }, []);

  if (reducedMotion) return null;

  return (
    <div className="christmas-effects" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <Snowflake
          className="christmas-snowflake"
          key={index}
          size={index % 4 === 0 ? 14 : 10}
          style={{
            '--snow-left': `${(index * 37 + 8) % 100}%`,
            '--snow-delay': `${(index % 9) * -1.7}s`,
            '--snow-duration': `${13 + (index % 6) * 2}s`,
            '--snow-drift': `${((index % 5) - 2) * 34}px`,
            '--snow-opacity': `${0.3 + (index % 4) * 0.1}`
          }}
        />
      ))}
      <div className="christmas-lights">
        {Array.from({ length: 9 }, (_, index) => <i key={index} style={{ '--light-delay': `${index * 170}ms` }} />)}
      </div>
    </div>
  );
}

function HomePage() {
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const searchTerm = (searchParams.get('q') || '').toLowerCase();
  const filteredProducts = products.filter((product) => (
    `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(searchTerm)
  ));

  return (
    <>
      <div className="wrap home-content">
        <section className="hero-banner">
          <img className="hero-image" src={siteAssets.heroCouple} alt="Bộ sưu tập đồng hồ đôi WATCH DAK" />
          <div className="hero-copy">
            <span className="eyebrow">BỘ SƯU TẬP 2026</span>
            <h1>Thời gian<br />được định nghĩa lại.</h1>
            <p>Chọn chiếc đồng hồ kể câu chuyện của riêng bạn.</p>
            <Link className="button button-dark" to="/#menwatch">Khám phá bộ sưu tập <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-index"><span>01</span><i />04</div>
        </section>

        <section className="service-strip" aria-label="Dịch vụ">
          <div><ShieldCheck size={20} /><span><strong>Chính hãng 100%</strong><small>Kiểm định trước khi giao</small></span></div>
          <div><Truck size={20} /><span><strong>Giao hàng toàn quốc</strong><small>Miễn phí đơn từ 2 triệu</small></span></div>
          <div><Check size={20} /><span><strong>Bảo hành tận tâm</strong><small>Hỗ trợ tại hệ thống</small></span></div>
        </section>

        {searchTerm ? (
          <ProductSection id="search-results" eyebrow="TÌM KIẾM" title={`Kết quả cho “${searchParams.get('q')}”`} items={filteredProducts} onAdd={addToCart} />
        ) : (
          <>
            <ProductSection id="menwatch" eyebrow="LỰA CHỌN NỔI BẬT" title="Đồng hồ nam bán chạy" items={products.filter((product) => product.category === 'Nam').slice(0, 8)} onAdd={addToCart} />
            <ProductSection id="womenwatch" eyebrow="NÉT ĐẸP RIÊNG" title="Đồng hồ nữ thanh lịch" items={products.filter((product) => product.category === 'Nữ').slice(0, 8)} onAdd={addToCart} />
          </>
        )}

        {!searchTerm && <>
          <section className="style-section section-space">
            <SectionHeading eyebrow="CHỌN THEO PHONG CÁCH" title="Một chiếc đồng hồ, một dấu ấn." />
            <div className="style-grid">
              <Link className="style-tile" to="/#menwatch">
                <img src={products[4].image} alt="Đồng hồ Seiko phong cách cổ điển" />
                <span className="style-copy"><span>ĐỒNG HỒ NAM</span><strong>Vững vàng trong từng khoảnh khắc</strong><span className="text-link">Khám phá <ArrowRight size={15} /></span></span>
              </Link>
              <Link className="style-tile" to="/#womenwatch">
                <img src={products[6].image} alt="Đồng hồ Seiko thanh lịch" />
                <span className="style-copy"><span>ĐỒNG HỒ NỮ</span><strong>Tinh tế theo cách của bạn</strong><span className="text-link">Khám phá <ArrowRight size={15} /></span></span>
              </Link>
            </div>
            <div className="category-links">
              {[
                { title: 'Đồng hồ bán chạy', image: products[0].image, target: '#menwatch' },
                { title: 'Phong cách cổ điển', image: products[4].image, target: '#menwatch' },
                { title: 'Đồng hồ hiện đại', image: products[9].image, target: '#womenwatch' },
                { title: 'Đồng hồ đôi', image: products[10].image, target: '#womenwatch' }
              ].map((category, index) => (
                <Reveal key={category.title} as="a" className="category-link" delay={index * 55} href={category.target}>
                  <img src={category.image} alt="" />
                  <span>{category.title}<ArrowRight size={14} /></span>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="brand-section section-space" id="brands">
            <SectionHeading eyebrow="THƯƠNG HIỆU ĐƯỢC YÊU THÍCH" title="Những cái tên làm nên chuẩn mực." />
            <div className="brand-grid">
              {brands.map((brand, index) => <Reveal className="brand-tile" key={brand} delay={(index % 6) * 45}>{brand}</Reveal>)}
            </div>
          </section>

          <section className="journal-section section-space" id="journal">
            <SectionHeading eyebrow="GÓC THỜI GIAN" title="Câu chuyện quanh cổ tay bạn." />
            <div className="journal-feature">
              <Reveal className="journal-image"><img src={siteAssets.newsImage} alt="Phong cách và phụ kiện thời trang" /></Reveal>
              <Reveal className="journal-copy" delay={90}>
                <span className="eyebrow">PHONG CÁCH · 5 PHÚT ĐỌC</span>
                <h3>Chọn đồng hồ như chọn một phần cá tính.</h3>
                <p>Từ mặt số cổ điển đến dáng thể thao hiện đại, hãy bắt đầu từ nhịp sống và phong cách bạn muốn mang theo mỗi ngày.</p>
                <Link className="text-link" to="/#menwatch">Đọc câu chuyện <ArrowRight size={15} /></Link>
              </Reveal>
            </div>
          </section>
        </>}
      </div>
    </>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <Reveal className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
    </Reveal>
  );
}

function ProductSection({ id, eyebrow, title, items, onAdd }) {
  return (
    <section className="product-section section-space" id={id}>
      <div className="section-topline">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <Link className="text-link section-more" to={`/products?category=${encodeURIComponent(items[0]?.category || '')}`}>Xem tất cả <ArrowRight size={15} /></Link>
      </div>
      {items.length ? (
        <div className="product-grid">
          {items.map((product, index) => <ProductCard key={product.id} product={product} onAdd={onAdd} delay={(index % 4) * 55} />)}
        </div>
      ) : <p className="empty-results">Không tìm thấy mẫu đồng hồ phù hợp. Hãy thử từ khóa khác.</p>}
    </section>
  );
}

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const query = searchParams.get('q') || '';
  const filteredProducts = products.filter((product) => {
    const matchesCategory = !category || product.category === category;
    const matchesBrand = !brand || product.brand === brand;
    const matchesQuery = !query || `${product.name} ${product.brand}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesBrand && matchesQuery;
  });

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    setSearchParams(nextParams);
  };

  return (
    <div className="wrap interior-page catalog-page">
      <div className="breadcrumbs"><Link to="/">Trang chủ</Link><ChevronRight size={14} /><span>Bộ sưu tập</span></div>
      <SectionHeading eyebrow="BỘ SƯU TẬP WATCH DAK" title={category ? `Đồng hồ ${category.toLowerCase()}` : 'Tất cả đồng hồ'} />
      <div className="catalog-toolbar">
        <span>{filteredProducts.length} mẫu đồng hồ</span>
        <div>
          <label>Giới tính<select value={category} onChange={(event) => updateFilter('category', event.target.value)}><option value="">Tất cả</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></label>
          <label>Thương hiệu<select value={brand} onChange={(event) => updateFilter('brand', event.target.value)}><option value="">Tất cả hãng</option>{[...new Set(products.map((product) => product.brand))].map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        </div>
      </div>
      {filteredProducts.length ? <div className="product-grid">{filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} onAdd={addToCart} delay={(index % 4) * 40} />)}</div> : <p className="empty-results">Không có mẫu phù hợp với bộ lọc hiện tại.</p>}
    </div>
  );
}

function ProductCard({ product, onAdd, delay = 0 }) {
  return (
    <Reveal as="article" className="product-card" delay={delay}>
      <Link className="product-image" to={`/Buynow.html?product=${product.id}`}>
        <span className="product-tag">{product.category === 'Nam' ? 'NAM' : 'NỮ'}</span>
        <img src={product.image} alt={`${product.brand} ${product.name}`} loading="lazy" />
        <span className="product-quick-view">Xem chi tiết <ArrowUpRight size={15} /></span>
      </Link>
      <div className="product-details">
        <span className="product-brand">{product.brand}</span>
        <Link className="product-title" to={`/Buynow.html?product=${product.id}`}>{product.name}</Link>
        <div className="product-prices"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.originalPrice)}</del></div>
        <button className="add-button" type="button" onClick={() => onAdd(product)}><ShoppingBag size={15} /> Thêm vào giỏ</button>
      </div>
    </Reveal>
  );
}

function ProductPage() {
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const product = products.find((item) => item.id === searchParams.get('product')) || products[0];
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="wrap interior-page">
      <div className="breadcrumbs"><Link to="/">Trang chủ</Link><ChevronRight size={14} /><span>{product.brand}</span><ChevronRight size={14} /><span>{product.name}</span></div>
      <section className="product-detail-layout">
        <div className="detail-image"><img src={product.image} alt={`${product.brand} ${product.name}`} /></div>
        <div className="detail-copy">
          <span className="eyebrow">{product.brand.toUpperCase()} · {product.category.toUpperCase()}</span>
          <h1>{product.name}</h1>
          <p className="detail-code">Mã sản phẩm: {product.id.toUpperCase()}</p>
          <div className="detail-price"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.originalPrice)}</del><span>Tiết kiệm {formatPrice(product.originalPrice - product.price)}</span></div>
          <p className="detail-description">Thiết kế bền bỉ, hoàn thiện chỉn chu và dễ phối cùng phong cách thường ngày. Sản phẩm được kiểm tra kỹ trước khi giao.</p>
          <div className="detail-benefits"><span><ShieldCheck size={18} /> Chính hãng, bảo hành toàn quốc</span><span><Truck size={18} /> Giao hàng miễn phí từ 2 triệu</span></div>
          <div className="purchase-row">
            <div className="quantity-control" aria-label="Số lượng">
              <button type="button" aria-label="Giảm số lượng" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button>
              <span>{quantity}</span>
              <button type="button" aria-label="Tăng số lượng" onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button>
            </div>
            <button type="button" className="button button-dark detail-add" onClick={handleAdd}><ShoppingBag size={17} /> Thêm vào giỏ</button>
          </div>
          {added && <p className="inline-success"><Check size={16} /> Đã thêm sản phẩm vào giỏ hàng.</p>}
          <div className="service-note"><span>Đổi sản phẩm trong 7 ngày</span><span>Hỗ trợ tư vấn mỗi ngày</span><span>Thanh toán an toàn</span></div>
        </div>
      </section>
    </div>
  );
}

function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [orderComplete, setOrderComplete] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    clearCart();
    setOrderComplete(true);
    event.currentTarget.reset();
  };

  if (orderComplete) {
    return <section className="wrap checkout-complete"><span className="success-mark"><Check size={26} /></span><span className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</span><h1>Cảm ơn bạn đã tin chọn WATCH DAK.</h1><p>Đây là bản giao diện React demo; đơn hàng chưa được gửi đến hệ thống bán hàng.</p><Link className="button button-dark" to="/products">Tiếp tục mua sắm <ArrowRight size={16} /></Link></section>;
  }

  if (!cartItems.length) {
    return <section className="wrap checkout-complete"><span className="eyebrow">GIỎ HÀNG ĐANG TRỐNG</span><h1>Chọn chiếc đồng hồ của bạn trước nhé.</h1><Link className="button button-dark" to="/products">Xem bộ sưu tập <ArrowRight size={16} /></Link></section>;
  }

  return (
    <div className="wrap interior-page checkout-page">
      <div className="breadcrumbs"><Link to="/">Trang chủ</Link><ChevronRight size={14} /><span>Thanh toán</span></div>
      <SectionHeading eyebrow="HOÀN TẤT ĐƠN HÀNG" title="Thông tin giao hàng" />
      <div className="checkout-layout">
        <form className="account-form checkout-form" onSubmit={handleSubmit}>
          <div className="form-pair"><label>Họ và tên<input name="name" autoComplete="name" required /></label><label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" required /></label></div>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Địa chỉ nhận hàng<input name="address" autoComplete="street-address" required /></label>
          <label>Ghi chú<textarea name="note" rows="3" placeholder="Yêu cầu giao hàng (không bắt buộc)" /></label>
          <button className="button button-dark form-submit" type="submit">Xác nhận đặt hàng <ArrowRight size={16} /></button>
        </form>
        <aside className="checkout-summary"><h2>Đơn hàng của bạn</h2>{cartItems.map((item) => <div className="checkout-line" key={item.id}><span>{item.name} × {item.quantity}</span><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}<div className="checkout-total"><span>Tổng cộng</span><strong>{formatPrice(cartTotal)}</strong></div><p>Thanh toán khi nhận hàng. Đơn này chỉ mô phỏng giao diện, chưa gửi tới máy chủ.</p></aside>
      </div>
    </div>
  );
}

function LoginPage() {
  const { signInEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError('');
    setBusy(true);
    try {
      await signInEmail(formData.get('email'), formData.get('password'));
      navigate('/');
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout eyebrow="CHÀO MỪNG TRỞ LẠI" title="Đăng nhập">
      <form className="account-form" onSubmit={handleSubmit}>
        <label>Email<input name="email" type="email" autoComplete="email" required placeholder="ban@email.com" /></label>
        <label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required minLength={6} placeholder="Nhập mật khẩu" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-dark form-submit" type="submit" disabled={busy}>{busy ? 'Đang đăng nhập...' : 'Đăng nhập'} {!busy && <ArrowRight size={16} />}</button>
      </form>
      <SocialAuthButtons />
      <p className="auth-switch">Chưa có tài khoản? <Link to="/register">Tạo tài khoản</Link></p>
    </AuthLayout>
  );
}

function RegisterPage() {
  const { registerEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password');
    const confirmation = formData.get('confirmation');

    if (password !== confirmation) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await registerEmail(formData.get('email'), password, formData.get('name'));
      navigate('/');
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout eyebrow="ĐỒNG HÀNH CÙNG WATCH DAK" title="Tạo tài khoản">
      <form className="account-form" onSubmit={handleSubmit}>
        <label>Họ và tên<input name="name" autoComplete="name" required placeholder="Tên của bạn" /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required placeholder="ban@email.com" /></label>
        <div className="form-pair">
          <label>Mật khẩu<input name="password" type="password" autoComplete="new-password" required minLength={6} placeholder="Tối thiểu 6 ký tự" /></label>
          <label>Xác nhận<input name="confirmation" type="password" autoComplete="new-password" required minLength={6} placeholder="Nhập lại mật khẩu" /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-dark form-submit" type="submit" disabled={busy}>{busy ? 'Đang tạo tài khoản...' : 'Đăng ký'} {!busy && <ArrowRight size={16} />}</button>
      </form>
      <SocialAuthButtons />
      <p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </AuthLayout>
  );
}

function SocialAuthButtons() {
  const { configured, signInSocial } = useAuth();
  const navigate = useNavigate();
  const [busyProvider, setBusyProvider] = useState('');
  const [error, setError] = useState('');

  const handleSocialSignIn = async (provider) => {
    setBusyProvider(provider);
    setError('');
    try {
      await signInSocial(provider);
      navigate('/');
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setBusyProvider('');
    }
  };

  return (
    <div className="social-auth">
      <div className="auth-divider"><span>hoặc tiếp tục với</span></div>
      <div className="social-auth-buttons">
        <button className="social-auth-button google" type="button" disabled={Boolean(busyProvider)} onClick={() => handleSocialSignIn('google')}>
          <span className="social-brand-mark">G</span>{busyProvider === 'google' ? 'Đang kết nối...' : 'Google'}
        </button>
        <button className="social-auth-button facebook" type="button" disabled={Boolean(busyProvider)} onClick={() => handleSocialSignIn('facebook')}>
          <span className="social-brand-mark">f</span>{busyProvider === 'facebook' ? 'Đang kết nối...' : 'Facebook'}
        </button>
      </div>
      {!configured && <p className="auth-setup-hint">Cần điền cấu hình Firebase trong <code>.env.local</code> và bật Google/Facebook provider để sử dụng.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

function AuthLayout({ eyebrow, title, children }) {
  return (
    <div className="wrap auth-page">
      <section className="auth-panel">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="auth-intro">Quản lý đơn hàng, lưu sản phẩm yêu thích và nhận tin mới từ WATCH DAK.</p>
        {children}
      </section>
      <aside className="auth-aside">
        <img src={siteAssets.heroCouple} alt="Bộ sưu tập đồng hồ WATCH DAK" />
        <div><span className="eyebrow">WATCH DAK</span><h2>Thời gian là dấu ấn của bạn.</h2></div>
      </aside>
    </div>
  );
}

function CartDrawer({ isOpen, onClose }) {
  const { cartItems, cartTotal, removeFromCart, setQuantity } = useCart();

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  return (
    <div className={`cart-layer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <button className="cart-backdrop" type="button" aria-label="Đóng giỏ hàng" tabIndex={isOpen ? 0 : -1} onClick={onClose} />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header className="cart-header">
          <div><span className="eyebrow">WATCH DAK</span><h2 id="cart-title">Giỏ hàng <small>({cartItems.length})</small></h2></div>
          <button className="icon-button" type="button" aria-label="Đóng giỏ hàng" onClick={onClose}><X size={20} /></button>
        </header>
        {cartItems.length ? (
          <>
            <div className="cart-list">
              {cartItems.map((item) => (
                <article className="cart-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-info">
                    <span>{item.brand}</span><strong>{item.name}</strong><b>{formatPrice(item.price)}</b>
                    <div className="cart-item-controls">
                      <div className="quantity-control compact">
                        <button type="button" aria-label="Giảm số lượng" onClick={() => setQuantity(item.id, item.quantity - 1)}><Minus size={13} /></button>
                        <span>{item.quantity}</span>
                        <button type="button" aria-label="Tăng số lượng" onClick={() => setQuantity(item.id, item.quantity + 1)}><Plus size={13} /></button>
                      </div>
                      <button className="remove-link" type="button" onClick={() => removeFromCart(item.id)}>Xóa</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-summary">
              <div><span>Tạm tính</span><strong>{formatPrice(cartTotal)}</strong></div>
              <p>Phí giao hàng sẽ được xác nhận khi hoàn tất đơn.</p>
              <Link className="button button-dark checkout-button" to="/checkout" onClick={onClose}>Đặt hàng <ArrowRight size={16} /></Link>
            </div>
          </>
        ) : (
          <div className="cart-empty"><ShoppingBag size={34} /><h3>Giỏ hàng đang trống</h3><p>Thêm một chiếc đồng hồ bạn yêu thích để bắt đầu.</p><button className="button button-dark" type="button" onClick={onClose}>Khám phá bộ sưu tập</button></div>
        )}
      </aside>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-main">
        <div className="footer-brand"><img src={siteAssets.logoLight} alt="WATCH DAK" /><p>Chọn nhịp thời gian phù hợp với phong cách của bạn.</p><span><MapPin size={15} /> TP. Hồ Chí Minh · Việt Nam</span></div>
        <div className="footer-column"><h3>Hỗ trợ</h3><Link to="/Buynow.html">Hướng dẫn mua hàng</Link><Link to="/Buynow.html">Chính sách bảo hành</Link><Link to="/Buynow.html">Đổi trả trong 7 ngày</Link></div>
        <div className="footer-column"><h3>WATCH DAK</h3><Link to="/#brands">Thương hiệu</Link><Link to="/#journal">Tạp chí</Link><Link to="/register">Ưu đãi thành viên</Link></div>
        <div className="footer-column"><h3>Kết nối</h3><a href="mailto:hello@watchdak.vn">hello@watchdak.vn</a><span>1900 8386</span><span>Thứ 2 – Chủ nhật · 9:00–21:00</span></div>
      </div>
      <div className="wrap footer-bottom"><span>© 2026 WATCH DAK. Đồng hồ chính hãng.</span><span>Thanh toán an toàn · Giao hàng toàn quốc</span></div>
    </footer>
  );
}

const quickQuestions = ['Phí giao hàng thế nào?', 'Chính sách bảo hành?', 'Có thể đổi trả không?'];

function getAssistantReply(message) {
  const question = message.toLowerCase();

  if (/giá|bao nhiêu|mẫu|sản phẩm|đồng hồ|tư vấn/.test(question)) {
    return 'WATCH DAK hiện có 86 mẫu thuộc Casio, Seiko, Citizen, Orient, Tissot, Mido, Aura và Apple Watch. Bạn có thể xem giá và lọc theo hãng tại bộ sưu tập.';
  }
  if (/giao|ship|vận chuyển|bao lâu|phí/.test(question)) {
    return 'Đơn từ 2.000.000₫ được miễn phí giao hàng toàn quốc. Thời gian và phí cụ thể sẽ được xác nhận theo địa chỉ nhận hàng.';
  }
  if (/bảo hành|bảo trì|chính hãng/.test(question)) {
    return 'Sản phẩm được kiểm tra trước khi giao và có chính sách bảo hành theo hãng. Gọi 1900 8386 để được hướng dẫn theo mẫu đồng hồ.';
  }
  if (/đổi|trả|hoàn/.test(question)) {
    return 'WATCH DAK hỗ trợ yêu cầu đổi sản phẩm trong 7 ngày. Sản phẩm cần còn nguyên tình trạng và phụ kiện; đội ngũ sẽ xác nhận điều kiện cụ thể.';
  }
  if (/thanh toán|trả tiền|tiền mặt|thẻ/.test(question)) {
    return 'Bạn có thể chọn thanh toán khi nhận hàng. Ở bước đặt hàng, điền thông tin giao nhận để đội ngũ xác nhận đơn.';
  }
  if (/xin chào|chào|hello|hi\b/.test(question)) {
    return 'Xin chào! Mình là trợ lý WATCH DAK. Mình có thể giúp bạn tìm đồng hồ, hỏi về giao hàng, bảo hành hoặc đổi trả.';
  }
  return 'Mình chưa hiểu rõ câu hỏi này. Bạn có thể hỏi về mẫu đồng hồ, giá, giao hàng, bảo hành hoặc đổi trả; cần hỗ trợ trực tiếp hãy gọi 1900 8386.';
}

function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Xin chào! Mình có thể giúp gì về đồng hồ, giao hàng hoặc bảo hành?' }
  ]);
  const messageListRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const updateScrollState = () => setShowBackToTop(window.scrollY > 420);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    inputRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const sendMessage = (value = draft) => {
    const text = value.trim();
    if (!text) return;

    const userMessage = { id: Date.now(), sender: 'user', text };
    const reply = { id: Date.now() + 1, sender: 'bot', text: getAssistantReply(text) };
    setMessages((currentMessages) => [...currentMessages, userMessage, reply]);
    setDraft('');
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  };

  return (
    <div className="floating-tools">
      {showBackToTop && (
        <button className="back-to-top" type="button" aria-label="Cuộn lên đầu trang" onClick={scrollToTop}>
          <ArrowUp size={19} />
        </button>
      )}
      {isOpen && (
        <section className="assistant-panel" role="dialog" aria-modal="false" aria-labelledby="assistant-title">
          <header className="assistant-header">
            <span className="assistant-avatar"><Bot size={19} /></span>
            <span className="assistant-heading"><strong id="assistant-title">Trợ lý WATCH DAK</strong><small><i /> Đang sẵn sàng hỗ trợ</small></span>
            <button className="assistant-close" type="button" aria-label="Đóng chat" onClick={() => setIsOpen(false)}><X size={18} /></button>
          </header>
          <div className="assistant-messages" ref={messageListRef} aria-live="polite">
            <span className="assistant-time">HÔM NAY</span>
            {messages.map((message) => (
              <p className={`assistant-bubble ${message.sender}`} key={message.id}>{message.text}</p>
            ))}
            <div className="assistant-quick-questions">
              {quickQuestions.map((question) => (
                <button key={question} type="button" onClick={() => sendMessage(question)}>{question}</button>
              ))}
            </div>
          </div>
          <form className="assistant-form" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nhập câu hỏi của bạn..." aria-label="Nhập câu hỏi" />
            <button type="submit" aria-label="Gửi tin nhắn" disabled={!draft.trim()}><Send size={17} /></button>
          </form>
          <span className="assistant-disclaimer">Trợ lý tự động · Không gửi thông tin thanh toán</span>
        </section>
      )}
      <button className={`assistant-trigger ${isOpen ? 'is-open' : ''}`} type="button" aria-label={isOpen ? 'Đóng trợ lý chat' : 'Mở trợ lý chat'} aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!isOpen && <span className="assistant-trigger-label">Chat với chúng tôi</span>}
      </button>
    </div>
  );
}

function NotFoundPage() {
  return <section className="wrap not-found"><span className="eyebrow">404 · KHÔNG TÌM THẤY TRANG</span><h1>Trang này đã lỡ một nhịp.</h1><Link className="button button-dark" to="/">Về trang chủ <ArrowRight size={16} /></Link></section>;
}

export default App;
