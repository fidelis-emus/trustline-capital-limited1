import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  Shield, 
  BarChart3, 
  Calculator as CalcIcon, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  LogOut, 
  Plus, 
  Trash2, 
  Users, 
  LayoutDashboard,
  Menu,
  X,
  Briefcase,
  Edit,
  Upload,
  Settings as SettingsIcon,
  MessageCircle,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Constants ---
const LOGO_CONFIG = {
  useImage: true, 
  imageUrl: "/logo.png", // User should upload the attached image as 'logo.png' to the root
  text: "TRUSTLINE",
  subtext: "Capital Limited",
  hideTextWhenImageUsed: true // The provided image already contains the text
};

// --- Types ---
interface SiteSettings {
  logo_url: string;
  site_name: string;
  site_subtext: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  min_investment: number;
  expected_return: number;
  duration_months: number;
  image_url: string;
  currency: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image_url: string;
  category: "management" | "staff";
}

interface UserData {
  id: number;
  name: string;
  email: string;
}

interface AdminData {
  id: number;
  email: string;
}

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState<UserData | null>(null);
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    logo_url: "/logo.png",
    site_name: "TRUSTLINE",
    site_subtext: "Capital Limited"
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    // Check local storage for session
    const savedUser = localStorage.getItem("trustline_user");
    const savedAdmin = localStorage.getItem("trustline_admin");
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedAdmin) setAdmin(JSON.parse(savedAdmin));
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.logo_url) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    localStorage.removeItem("trustline_user");
    localStorage.removeItem("trustline_admin");
    setPage("home");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-primary text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <button onClick={() => setPage("home")} className="hover:opacity-80 transition-opacity">
              <Logo settings={settings} />
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLink label="Home" active={page === "home"} onClick={() => setPage("home")} />
              <NavLink label="About" active={page === "about"} onClick={() => setPage("about")} />
              <NavLink label="Products" active={page === "products"} onClick={() => setPage("products")} />
              <NavLink label="Team" active={page === "team"} onClick={() => setPage("team")} />
              <NavLink label="Calculator" active={page === "calculator"} onClick={() => setPage("calculator")} />
              <NavLink label="Contact" active={page === "contact"} onClick={() => setPage("contact")} />
              
              {user ? (
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-white/20">
                  <span className="text-sm font-medium text-accent">Hello, {user.name.split(' ')[0]}</span>
                  <button onClick={logout} className="text-sm hover:text-accent transition-colors flex items-center">
                    <LogOut size={16} className="mr-1" /> Logout
                  </button>
                </div>
              ) : admin ? (
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-white/20">
                  <button onClick={() => setPage("admin")} className="text-sm font-medium text-accent flex items-center">
                    <LayoutDashboard size={16} className="mr-1" /> Admin Panel
                  </button>
                  <button onClick={logout} className="text-sm hover:text-accent transition-colors flex items-center">
                    <LogOut size={16} className="mr-1" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 ml-4">
                  <button onClick={() => setPage("login")} className="text-sm font-medium hover:text-accent transition-colors">Login</button>
                  <button onClick={() => window.location.href = EXTERNAL_APP_URL} className="bg-accent hover:bg-accent-hover text-primary px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg">Open Account</button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-primary/95 border-t border-white/10"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                <MobileNavLink label="Home" onClick={() => { setPage("home"); setIsMenuOpen(false); }} />
                <MobileNavLink label="About" onClick={() => { setPage("about"); setIsMenuOpen(false); }} />
                <MobileNavLink label="Products" onClick={() => { setPage("products"); setIsMenuOpen(false); }} />
                <MobileNavLink label="Team" onClick={() => { setPage("team"); setIsMenuOpen(false); }} />
                <MobileNavLink label="Calculator" onClick={() => { setPage("calculator"); setIsMenuOpen(false); }} />
                <MobileNavLink label="Contact" onClick={() => { setPage("contact"); setIsMenuOpen(false); }} />
                {!user && !admin && (
                  <>
                    <MobileNavLink label="Login" onClick={() => { setPage("login"); setIsMenuOpen(false); }} />
                    <button onClick={() => { window.location.href = EXTERNAL_APP_URL; setIsMenuOpen(false); }} className="w-full bg-accent text-primary py-3 rounded-lg font-bold mt-4">Open Account</button>
                  </>
                )}
                {(user || admin) && <MobileNavLink label="Logout" onClick={() => { logout(); setIsMenuOpen(false); }} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {page === "home" && <HomePage key="home" setPage={setPage} products={products} />}
          {page === "about" && <AboutPage key="about" />}
          {page === "products" && <ProductsPage key="products" products={products} />}
          {page === "team" && <TeamPage key="team" />}
          {page === "calculator" && <CalculatorPage key="calculator" products={products} />}
          {page === "contact" && <ContactPage key="contact" />}
          {page === "login" && <LoginPage key="login" setUser={setUser} setAdmin={setAdmin} setPage={setPage} />}
          {page === "register" && <RegisterPage key="register" setPage={setPage} />}
          {page === "admin" && admin && <AdminPanel key="admin" products={products} fetchProducts={fetchProducts} siteSettings={settings} fetchSettings={fetchSettings} />}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white pt-16 pb-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <button onClick={() => setPage("home")} className="mb-6 hover:opacity-80 transition-opacity">
                <Logo settings={settings} />
              </button>
              <p className="text-white/60 text-sm leading-relaxed">
                {settings.site_name} {settings.site_subtext} is a leading asset management firm dedicated to providing innovative investment solutions and superior returns for our clients.
              </p>
            </div>
            <div>
              <h4 className="text-accent font-bold mb-6 uppercase text-xs tracking-widest">Quick Links</h4>
              <ul className="space-y-4 text-sm text-white/70">
                <li><button onClick={() => setPage("home")} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => setPage("about")} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => setPage("team")} className="hover:text-white transition-colors">Our Team</button></li>
                <li><button onClick={() => setPage("products")} className="hover:text-white transition-colors">Investment Products</button></li>
                <li><button onClick={() => setPage("calculator")} className="hover:text-white transition-colors">Calculator</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-accent font-bold mb-6 uppercase text-xs tracking-widest">Support</h4>
              <ul className="space-y-4 text-sm text-white/70">
                <li><button onClick={() => setPage("contact")} className="hover:text-white transition-colors">Contact Us</button></li>
                <li><button className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button onClick={() => setPage("login")} className="hover:text-white transition-colors">Investor Login</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-accent font-bold mb-6 uppercase text-xs tracking-widest">Contact Info</h4>
              <ul className="space-y-4 text-sm text-white/70">
                <li className="flex items-start">
                  <Mail size={16} className="mr-3 text-accent mt-1 flex-shrink-0" />
                  <span>info@trustlinecapitallimited.com</span>
                </li>
                <li className="flex items-start">
                  <Phone size={16} className="mr-3 text-accent mt-1 flex-shrink-0" />
                  <span>+234 8149637014</span>
                </li>
                <li className="flex items-start">
                  <Briefcase size={16} className="mr-3 text-accent mt-1 flex-shrink-0" />
                  <span>Trustline Capital Limited, Plot 4a, Dr. Omoh Ebhomenye Street, Off Admiralty Way, Lekki Lagos, Lekki Eti Osa, Lagos.</span>
                </li>
                <li className="flex items-start">
                  <Shield size={16} className="mr-3 text-accent mt-1 flex-shrink-0" />
                  <span>SEC Registered & Regulated</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-xs">
            &copy; {new Date().getFullYear()} Trustline Capital Limited. All rights reserved.
          </div>
        </div>
      </footer>

      <WhatsAppChat />
    </div>
  );
}

const EXTERNAL_APP_URL = "https://app.trustlinecapitallimited.com";

function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappNumber = "2347067829425";
  const message = "Hello, I would like to speak with a CRM officer.";

  const handleChat = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-72 mb-4 overflow-hidden border border-slate-100"
          >
            <div className="bg-primary p-4 text-white flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mr-3">
                  <User size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">CRM Officer</h4>
                  <p className="text-[10px] text-white/70">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 bg-slate-50">
              <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-slate-700 mb-4 max-w-[90%]">
                Hello! How can we help you today?
              </div>
              <button 
                onClick={handleChat}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg"
              >
                <MessageCircle size={18} className="mr-2" />
                Start WhatsApp Chat
              </button>
            </div>
            <div className="p-2 text-center bg-white border-t border-slate-50">
              <p className="text-[10px] text-slate-400">Trustline Capital Support</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#25D366] hover:bg-[#128C7E] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
}

// --- Components ---
function Logo({ settings, className = "" }: { settings: SiteSettings, className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="h-10 w-auto flex items-center justify-center mr-2 overflow-hidden">
        <img src={settings.logo_url} alt="Logo" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
      </div>
      <div className="hidden sm:block">
        <span className="text-xl font-bold tracking-tight text-white">{settings.site_name}</span>
        <span className="block text-[10px] text-accent font-semibold tracking-[0.2em] uppercase">{settings.site_subtext}</span>
      </div>
    </div>
  );
}

function NavLink({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`text-sm font-medium transition-all relative py-2 ${active ? 'text-accent' : 'text-white/80 hover:text-white'}`}
    >
      {label}
      {active && <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
    </button>
  );
}

function MobileNavLink({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="block w-full text-left py-3 text-white/80 hover:text-accent font-medium transition-colors"
    >
      {label}
    </button>
  );
}

// --- Pages ---

function HomePage({ setPage, products }: { setPage: (p: string) => void, products: Product[], key?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Hero Section */}
      <section className="hero-gradient h-[85vh] flex items-center text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-6 border border-accent/30">
              Trusted Asset Management
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
              Grow Your Wealth with <span className="text-accent italic">Confidence</span>
            </h1>
            <p className="text-lg text-white/80 mb-10 leading-relaxed">
              Experience professional-grade investment strategies tailored to your financial goals. We combine data-driven insights with decades of expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => window.location.href = EXTERNAL_APP_URL}
                className="bg-accent hover:bg-accent-hover text-primary px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl flex items-center justify-center"
              >
                Get Started Now <ArrowRight className="ml-2" size={20} />
              </button>
              <button 
                onClick={() => setPage("products")}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold text-lg transition-all border border-white/20"
              >
                View Products
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
          <BarChart3 className="w-full h-full" />
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Trustline?</h2>
            <div className="w-20 h-1 bg-accent mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HighlightCard 
              icon={<Shield className="text-accent" size={32} />}
              title="Secure & Regulated"
              description="Your assets are protected by industry-leading security protocols and full regulatory compliance."
            />
            <HighlightCard 
              icon={<BarChart3 className="text-accent" size={32} />}
              title="Expert Management"
              description="Our portfolio managers have a proven track record of delivering consistent returns across market cycles."
            />
            <HighlightCard 
              icon={<TrendingUp className="text-accent" size={32} />}
              title="Innovative Products"
              description="Access a wide range of investment vehicles from fixed income to high-growth equity funds."
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Investment Products</h2>
              <p className="text-slate-500">Explore our top-performing funds curated for your growth.</p>
            </div>
            <button onClick={() => setPage("products")} className="text-accent font-bold flex items-center hover:underline">
              View All <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.slice(0, 3).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* All Products Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Full Investment Portfolio</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Discover our complete range of investment funds designed to match your financial goals.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start your investment journey?</h2>
          <p className="text-white/70 mb-10 text-lg">Join thousands of successful investors who trust Trustline Capital Limited with their future.</p>
          <button 
            onClick={() => window.location.href = EXTERNAL_APP_URL}
            className="bg-accent hover:bg-accent-hover text-primary px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl"
          >
            Create Your Account
          </button>
        </div>
      </section>
    </motion.div>
  );
}

function HighlightCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 card-hover">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function ProductCard({ product }: { product: Product, key?: any }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100 card-hover flex flex-col h-full">
      <div className="h-48 overflow-hidden relative">
        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        <div className="absolute top-4 right-4 bg-accent text-primary px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          {product.expected_return}% Expected Return
        </div>
      </div>
      <div className="p-8 flex-grow flex flex-col">
        <h3 className="text-xl font-bold mb-3">{product.title}</h3>
        <p className="text-slate-600 text-sm mb-6 flex-grow">{product.description}</p>
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Min. Investment</span>
            <span className="font-bold">{product.currency || '₦'}{product.min_investment.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Duration</span>
            <span className="font-bold">{product.duration_months} Months</span>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = EXTERNAL_APP_URL}
          className="w-full mt-8 py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all"
        >
          Invest Now
        </button>
      </div>
    </div>
  );
}

function AboutPage({ key }: { key?: string } = {}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">Our Story</span>
            <h2 className="text-4xl font-bold mb-8">A Legacy of Trust and Performance</h2>
            <div className="space-y-6 text-slate-600 leading-relaxed">
              <p>
                Founded in 2010, Trustline Capital Limited has grown from a boutique investment firm to a comprehensive asset management powerhouse. Our mission has always been clear: to empower our clients through sound financial strategies.
              </p>
              <p>
                We believe that investment success is built on a foundation of rigorous research, disciplined risk management, and an unwavering commitment to our clients' best interests.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">₦2.5B+</div>
                  <div className="text-sm text-slate-500">Assets Under Management</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">15k+</div>
                  <div className="text-sm text-slate-500">Satisfied Investors</div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1000" 
              alt="Office" 
              className="rounded-3xl shadow-2xl"
            />
            <div className="absolute -bottom-8 -left-8 bg-accent p-8 rounded-2xl shadow-xl hidden md:block">
              <div className="text-primary font-bold text-xl mb-1">15+ Years</div>
              <div className="text-primary/70 text-sm">Industry Excellence</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProductsPage({ products }: { products: Product[], key?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Investment Products</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Choose from our diverse range of investment funds designed to match your risk profile and return expectations.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TeamPage({ key }: { key?: string } = {}) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then(res => res.json())
      .then(data => {
        setTeam(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch team", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="mt-4 text-slate-500">Loading our team...</p>
      </div>
    );
  }

  const management = team.filter(m => m.category === "management");
  const staff = team.filter(m => m.category === "staff");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">Our People</span>
          <h2 className="text-4xl font-bold mb-4">Meet the Experts Behind Your Success</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Our team brings together decades of experience in global markets and asset management.</p>
        </div>

        {/* Management Gallery */}
        <section className="mb-24">
          <div className="flex items-center mb-12">
            <div className="h-px bg-slate-200 flex-grow"></div>
            <h3 className="px-6 text-2xl font-bold text-primary">Management Gallery</h3>
            <div className="h-px bg-slate-200 flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {management.map(member => (
              <TeamCard key={member.id} member={member} />
            ))}
          </div>
        </section>

        {/* Staff Gallery */}
        <section>
          <div className="flex items-center mb-12">
            <div className="h-px bg-slate-200 flex-grow"></div>
            <h3 className="px-6 text-2xl font-bold text-primary">Staff Gallery</h3>
            <div className="h-px bg-slate-200 flex-grow"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {staff.map(member => (
              <TeamCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function TeamCard({ member }: { member: TeamMember, key?: any }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100 group"
    >
      <div className="h-72 overflow-hidden relative">
        <img 
          src={member.image_url} 
          alt={member.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div className="text-white">
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Trustline Capital</p>
            <p className="text-sm italic opacity-80">"Dedicated to your financial growth."</p>
          </div>
        </div>
      </div>
      <div className="p-6 text-center">
        <h4 className="font-bold text-lg text-primary mb-1">{member.name}</h4>
        <p className="text-slate-500 text-sm">{member.role}</p>
      </div>
    </motion.div>
  );
}

function CalculatorPage({ products }: { products: Product[], key?: string }) {
  const [amount, setAmount] = useState<number>(1000);
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 0);
  const [result, setResult] = useState<{ total: number, profit: number } | null>(null);

  const calculate = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    const profit = (amount * (product.expected_return / 100)) * (product.duration_months / 12);
    setResult({
      total: amount + profit,
      profit: profit
    });
  };

  useEffect(() => {
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-primary text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
          <div className="p-10 md:w-1/2 bg-primary/50">
            <div className="flex items-center mb-8">
              <CalcIcon className="text-accent mr-3" size={28} />
              <h2 className="text-2xl font-bold">Investment Calculator</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Investment Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white/40">{products.find(p => p.id === selectedProductId)?.currency || '₦'}</span>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Select Product</label>
                <select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id} className="text-primary">{p.title} ({p.expected_return}%)</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={calculate}
                className="w-full bg-accent hover:bg-accent-hover text-primary font-bold py-4 rounded-xl transition-all shadow-lg mt-4"
              >
                Calculate Returns
              </button>
            </div>
          </div>
          
          <div className="p-10 md:w-1/2 gold-gradient text-primary flex flex-col justify-center items-center text-center">
            {result ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="text-sm font-bold uppercase tracking-widest mb-2 opacity-60">Estimated Total Value</div>
                <div className="text-5xl font-bold mb-8">{products.find(p => p.id === selectedProductId)?.currency || '₦'}{result.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                
                <div className="grid grid-cols-2 gap-8 w-full border-t border-primary/10 pt-8">
                  <div>
                    <div className="text-xs font-bold uppercase opacity-60 mb-1">Total Profit</div>
                    <div className="text-xl font-bold">{products.find(p => p.id === selectedProductId)?.currency || '₦'}{result.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase opacity-60 mb-1">Growth</div>
                    <div className="text-xl font-bold">+{((result.profit / amount) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center">
                <CalcIcon size={64} className="mx-auto mb-6 opacity-20" />
                <p className="font-medium opacity-60">Enter your investment details to see estimated returns.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ContactPage({ key }: { key?: string } = {}) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // In a real app, you'd send the form data to the backend here
  };

  if (submitted) {
    return (
      <div className="py-24 min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Message Sent!</h2>
          <p className="text-slate-600 text-lg">
            Thank you for your message. We’ll get back to you shortly.
          </p>
          <button 
            onClick={() => setSubmitted(false)}
            className="mt-8 text-primary font-bold hover:underline"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl font-bold mb-6">Get in Touch</h2>
            <p className="text-slate-600 mb-10 leading-relaxed">
              Have questions about our investment products or need assistance with your account? Our team of experts is here to help you.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mr-4 text-accent">
                  <Mail />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Email Us</h4>
                  <p className="text-slate-500">info@trustlinecapitallimited.com</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mr-4 text-accent">
                  <Phone />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Call Us</h4>
                  <p className="text-slate-500">+234 8149637014</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mr-4 text-accent">
                  <Briefcase />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Office Address</h4>
                  <p className="text-slate-500">The Zylus Place, Plot 4a, Dr. Omoh Ebhomenye Street, Off Admiralty Way, Lekki Lagos, Lekki Eti Osa, Lagos.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input type="email" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent"></textarea>
              </div>
              <button className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LoginPage({ setUser, setAdmin, setPage }: { setUser: (u: UserData) => void, setAdmin: (a: AdminData) => void, setPage: (p: string) => void, key?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const endpoint = isAdminMode ? "/api/admin/login" : "/api/auth/login";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        if (isAdminMode) {
          const adminData = data.admin;
          localStorage.setItem("trustline_admin", JSON.stringify(adminData));
          setAdmin(adminData);
          setPage("admin");
        } else {
          const userData = data.user;
          localStorage.setItem("trustline_user", JSON.stringify(userData));
          setUser(userData);
          setPage("products");
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Connection failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-primary p-8 text-center text-white">
          <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{isAdminMode ? "Admin Portal" : "Investor Login"}</h2>
          <p className="text-white/60 text-sm mt-2">Access your Trustline account</p>
        </div>
        
        <div className="p-8">
          {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6 flex items-center"><X size={16} className="mr-2" /> {error}</div>}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-accent" 
                  placeholder="name@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-accent" 
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg">
              Sign In
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-slate-100 text-center space-y-4">
            {!isAdminMode && (
              <p className="text-sm text-slate-500">
                Don't have an account? <button onClick={() => window.location.href = EXTERNAL_APP_URL} className="text-accent font-bold hover:underline">Register Now</button>
              </p>
            )}
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)} 
              className="text-xs text-slate-400 hover:text-primary transition-colors uppercase tracking-widest font-bold"
            >
              {isAdminMode ? "Switch to Investor Login" : "Admin Login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RegisterPage({ setPage }: { setPage: (p: string) => void, key?: string }) {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      console.log("Registration response status:", res.status);
      const contentType = res.headers.get("content-type");
      console.log("Registration response content-type:", contentType);

      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setSuccess(true);
          setTimeout(() => setPage("login"), 2000);
        } else {
          setError(data.error || "Registration failed");
        }
      } else {
        const text = await res.text();
        console.error("Registration non-JSON response:", text);
        setError("Server error. Please try again later.");
      }
    } catch (err) {
      console.error("Registration fetch error:", err);
      setError("Network error. Please check your connection.");
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-2">Your account has been created!</h2>
          <p className="text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-primary p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-white/60 text-sm mt-2">Start your investment journey today</p>
        </div>
        
        <div className="p-8">
          {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6">{error}</div>}
          
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input 
                type="tel" required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent" 
              />
            </div>
            
            <button className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg mt-4">
              Create Account
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account? <button onClick={() => setPage("login")} className="text-accent font-bold hover:underline">Login</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function AdminPanel({ products, fetchProducts, siteSettings, fetchSettings }: { products: Product[], fetchProducts: () => void, siteSettings: SiteSettings, fetchSettings: () => void, key?: string }) {
  const [tab, setTab] = useState("products");
  const [users, setUsers] = useState<any[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  
  const productFileRef = useRef<HTMLInputElement>(null);
  const teamFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(siteSettings);
  }, [siteSettings]);
  
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    min_investment: 1000,
    expected_return: 10,
    duration_months: 12,
    image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800",
    currency: "₦"
  });

  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
    category: "staff" as "management" | "staff"
  });

  useEffect(() => {
    if (tab === "users") fetchUsers();
    if (tab === "team") fetchTeam();
  }, [tab]);

  useEffect(() => {
    if (editingProduct) {
      setNewProduct({
        title: editingProduct.title,
        description: editingProduct.description,
        min_investment: editingProduct.min_investment,
        expected_return: editingProduct.expected_return,
        duration_months: editingProduct.duration_months,
        image_url: editingProduct.image_url,
        currency: editingProduct.currency || "₦"
      });
      setShowAddModal(true);
    }
  }, [editingProduct]);

  useEffect(() => {
    if (editingMember) {
      setNewMember({
        name: editingMember.name,
        role: editingMember.role,
        image_url: editingMember.image_url,
        category: editingMember.category
      });
      setShowTeamModal(true);
    }
  }, [editingMember]);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
  };

  const fetchTeam = async () => {
    const res = await fetch("/api/team");
    const data = await res.json();
    setTeam(data);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
    const method = editingProduct ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct)
    });
    if (res.ok) {
      setShowAddModal(false);
      setEditingProduct(null);
      setNewProduct({
        title: "",
        description: "",
        min_investment: 1000,
        expected_return: 10,
        duration_months: 12,
        image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800",
        currency: "₦"
      });
      fetchProducts();
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingMember ? `/api/admin/team/${editingMember.id}` : "/api/admin/team";
    const method = editingMember ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember)
    });
    if (res.ok) {
      setShowTeamModal(false);
      setEditingMember(null);
      setNewMember({
        name: "",
        role: "",
        image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
        category: "staff"
      });
      fetchTeam();
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;
    await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
    fetchTeam();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setNewProduct({
      title: "",
      description: "",
      min_investment: 1000,
      expected_return: 10,
      duration_months: 12,
      image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800",
      currency: "₦"
    });
    setShowAddModal(true);
  };

  const openTeamModal = () => {
    setEditingMember(null);
    setNewMember({
      name: "",
      role: "",
      image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
      category: "staff"
    });
    setShowTeamModal(true);
  };

  const handleImageUpload = async (file: File, type: 'product' | 'team' | 'logo') => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'product') {
          setNewProduct({ ...newProduct, image_url: data.imageUrl });
        } else if (type === 'team') {
          setNewMember({ ...newMember, image_url: data.imageUrl });
        } else if (type === 'logo') {
          setLocalSettings({ ...localSettings, logo_url: data.imageUrl });
        }
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    setUploading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localSettings)
      });
      if (res.ok) {
        alert("Settings saved successfully!");
        fetchSettings();
      }
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings.");
    } finally {
      setUploading(false);
    }
  };

  const handleQuickLogoUpdate = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        const newLogoUrl = data.imageUrl;
        // Update settings immediately
        const settingsRes = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...siteSettings, logo_url: newLogoUrl })
        });
        if (settingsRes.ok) {
          alert("Logo updated successfully!");
          fetchSettings();
        }
      }
    } catch (error) {
      console.error("Logo update failed", error);
      alert("Logo update failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            <p className="text-slate-500">Manage your platform assets and users</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={logoFileRef}
              className="hidden" 
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleQuickLogoUpdate(e.target.files[0])}
            />
            <button 
              onClick={() => logoFileRef.current?.click()}
              disabled={uploading}
              className="bg-accent text-primary px-6 py-2 rounded-xl text-sm font-bold hover:bg-accent-hover transition-all flex items-center shadow-sm"
            >
              <Upload size={16} className="mr-2" /> {uploading ? 'Uploading...' : 'Update Logo'}
            </button>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button 
              onClick={() => setTab("products")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === "products" ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
            >
              Products
            </button>
            <button 
              onClick={() => setTab("team")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === "team" ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
            >
              Team
            </button>
            <button 
              onClick={() => setTab("users")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === "users" ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
            >
              Investors
            </button>
            <button 
              onClick={() => setTab("settings")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === "settings" ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
            >
              <SettingsIcon size={16} className="inline mr-1" /> Site Settings
            </button>
          </div>
        </div>
      </div>

        {tab === "products" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Investment Products ({products.length})</h3>
              <button 
                onClick={openAddModal}
                className="bg-accent text-primary px-4 py-2 rounded-lg font-bold flex items-center shadow-md hover:bg-accent-hover transition-all"
              >
                <Plus size={18} className="mr-2" /> Add Product
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="h-32 overflow-hidden relative">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button 
                        onClick={() => setEditingProduct(p)} 
                        className="bg-white/90 px-2 py-1 rounded-lg text-primary hover:text-accent transition-colors shadow-sm flex items-center text-xs font-bold"
                      >
                        <Edit size={14} className="mr-1" /> Modify
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="bg-white/90 p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-colors shadow-sm">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h4 className="font-bold text-lg mb-2">{p.title}</h4>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{p.description}</p>
                    <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Return</div>
                        <div className="font-bold text-accent">{p.expected_return}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Min. Invest</div>
                        <div className="font-bold">{p.currency || '₦'}{p.min_investment.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : tab === "team" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Team Members ({team.length})</h3>
              <button 
                onClick={openTeamModal}
                className="bg-accent text-primary px-4 py-2 rounded-lg font-bold flex items-center shadow-md hover:bg-accent-hover transition-all"
              >
                <Plus size={18} className="mr-2" /> Add Member
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map(m => (
                <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="h-40 overflow-hidden relative">
                    <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button 
                        onClick={() => setEditingMember(m)} 
                        className="bg-white/90 px-2 py-1 rounded-lg text-primary hover:text-accent transition-colors shadow-sm flex items-center text-xs font-bold"
                      >
                        <Edit size={14} className="mr-1" /> Modify
                      </button>
                      <button onClick={() => handleDeleteMember(m.id)} className="bg-white/90 p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-colors shadow-sm">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm ${m.category === 'management' ? 'bg-accent text-primary' : 'bg-primary text-white'}`}>
                        {m.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <h4 className="font-bold text-sm mb-1">{m.name}</h4>
                    <p className="text-slate-500 text-[10px]">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : tab === "settings" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-6">Site Configuration</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company Logo</label>
                <div className="flex items-center gap-6 p-4 border border-slate-100 rounded-2xl bg-slate-50">
                  <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border border-slate-200">
                    <img src={localSettings.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow">
                    <button 
                      onClick={() => logoFileRef.current?.click()}
                      disabled={uploading}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all flex items-center mb-2"
                    >
                      <Upload size={16} className="mr-2" /> {uploading ? 'Uploading...' : 'Modify Logo'}
                    </button>
                    <p className="text-[10px] text-slate-400">Recommended: PNG or SVG with transparent background</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Site Name</label>
                  <input 
                    type="text"
                    value={localSettings.site_name}
                    onChange={(e) => setLocalSettings({ ...localSettings, site_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Site Subtext / Tagline</label>
                  <input 
                    type="text"
                    value={localSettings.site_subtext}
                    onChange={(e) => setLocalSettings({ ...localSettings, site_subtext: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={uploading}
                className="w-full bg-accent text-primary font-bold py-4 rounded-xl mt-4 shadow-lg hover:bg-accent-hover transition-all flex items-center justify-center"
              >
                <CheckCircle2 size={20} className="mr-2" /> {uploading ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Investor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-3 font-bold">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold">{u.name}</div>
                          <div className="text-xs text-slate-400">ID: #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{u.email}</div>
                      <div className="text-xs text-slate-400">{u.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary hover:text-accent transition-colors text-sm font-bold">View Profile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingProduct ? 'Modify Product' : 'Add New Investment Product'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingProduct(null); }}><X /></button>
            </div>
            <form className="p-8 space-y-4" onSubmit={handleAddProduct}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Title</label>
                <input 
                  type="text" required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                  <select 
                    value={newProduct.currency}
                    onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent"
                  >
                    <option value="₦">Naira (₦)</option>
                    <option value="$">Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min. Invest</label>
                  <input 
                    type="number" required
                    value={newProduct.min_investment}
                    onChange={(e) => setNewProduct({ ...newProduct, min_investment: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Return (%)</label>
                  <input 
                    type="number" required
                    value={newProduct.expected_return}
                    onChange={(e) => setNewProduct({ ...newProduct, expected_return: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Months)</label>
                  <input 
                    type="number" required
                    value={newProduct.duration_months}
                    onChange={(e) => setNewProduct({ ...newProduct, duration_months: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-4">
                    <div className="flex-grow">
                      <input 
                        type="text" required
                        placeholder="Image URL or upload below"
                        value={newProduct.image_url}
                        onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                      />
                    </div>
                    {newProduct.image_url && (
                      <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                        <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      ref={productFileRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'product')}
                    />
                    <button 
                      type="button"
                      disabled={uploading}
                      onClick={() => productFileRef.current?.click()}
                      className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center"
                    >
                      <Upload size={16} className="mr-2" /> {uploading ? 'Uploading...' : 'Upload from Computer'}
                    </button>
                    <p className="text-[10px] text-slate-400">Recommended: 800x600px</p>
                  </div>
                </div>
              </div>
              <button className="w-full bg-primary text-white font-bold py-4 rounded-xl mt-4 shadow-lg hover:bg-primary/90 transition-all">
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingMember ? 'Modify Team Member' : 'Add New Team Member'}</h3>
              <button onClick={() => { setShowTeamModal(false); setEditingMember(null); }}><X /></button>
            </div>
            <form className="p-8 space-y-4" onSubmit={handleAddMember}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role / Designation</label>
                <input 
                  type="text" required
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select 
                  value={newMember.category}
                  onChange={(e) => setNewMember({ ...newMember, category: e.target.value as any })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent"
                >
                  <option value="management">Management</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Profile Photo</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-4">
                    <div className="flex-grow">
                      <input 
                        type="text" required
                        placeholder="Image URL or upload below"
                        value={newMember.image_url}
                        onChange={(e) => setNewMember({ ...newMember, image_url: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-accent" 
                      />
                    </div>
                    {newMember.image_url && (
                      <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                        <img src={newMember.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      ref={teamFileRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'team')}
                    />
                    <button 
                      type="button"
                      disabled={uploading}
                      onClick={() => teamFileRef.current?.click()}
                      className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center"
                    >
                      <Upload size={16} className="mr-2" /> {uploading ? 'Uploading...' : 'Upload from Computer'}
                    </button>
                    <p className="text-[10px] text-slate-400">Recommended: Square (400x400px)</p>
                  </div>
                </div>
              </div>
              <button className="w-full bg-primary text-white font-bold py-4 rounded-xl mt-4 shadow-lg hover:bg-primary/90 transition-all">
                {editingMember ? 'Update Member' : 'Save Team Member'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
