import { useHashLocation } from "wouter/use-hash-location";
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Menu, Play, Upload, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getGetPublicSiteContentQueryKey,
  useGetPublicSiteContent,
  type SiteContent,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import AdminPage from '@/pages/admin';
import NotFound from '@/pages/not-found';
import logo from '@assets/Tak_berjudul388_20260504151152_1790731249936.png';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

const FALLBACK_SITE_CONTENT: SiteContent = {
  members: [
    { id: 'azelyth', name: 'Azelyth Faeren', alias: 'Eren/Ren', description: 'Deskripsi member akan ditambahkan.', channel: 'https://youtube.com/@zelren14?si=NcVyPXxS2c7NfIhX', imageUrl: null },
    { id: 'riyuzi', name: 'Riyuzi Vynae', alias: 'Riyu', description: 'Deskripsi member akan ditambahkan.', channel: 'https://www.youtube.com/@RiyuziVynae', imageUrl: null },
    { id: 'azaa', name: 'Azaa Lockwood', alias: 'Azaa', description: 'Deskripsi member akan ditambahkan.', channel: 'https://youtube.com/@azaalockwood?si=-I9GXMdRn6uAtvVJ', imageUrl: null },
    { id: 'shezi', name: 'Shezi Asta Freola', alias: 'Frell', description: 'Deskripsi member akan ditambahkan.', channel: 'https://www.youtube.com/@Rawrr_Frell', imageUrl: null },
  ],
  theme: { base: '#100E14', violet: '#BD67FF', magenta: '#FF4F9A' },
};

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const contentQuery = useGetPublicSiteContent({
    query: {
      queryKey: getGetPublicSiteContentQueryKey(),
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  });
  const content = contentQuery.data ?? FALLBACK_SITE_CONTENT;
  const themeStyle = {
    '--void': content.theme.base,
    '--violet': content.theme.violet,
    '--magenta': content.theme.magenta,
  } as CSSProperties;

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('.reveal');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const channel = 'https://youtube.com/@xtraordinaryvour?si=5Nu1DsjIdGtPeEm0';

  return (
    <div className="site-shell" style={themeStyle}>
      <header className="topbar">
        <a className="brand" href="#awal" onClick={closeMenu} aria-label="Xtra Ordinary Vour, ke awal">
          <span className="brand-logo"><img src={logo} alt="" /></span>
          <span className="brand-copy">XTRA ORDINARY<small>VOUR / CREATOR COLLECTIVE</small></span>
        </a>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-menu">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <nav id="main-navigation" className={`nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Navigasi utama">
          <a href="#tentang" onClick={closeMenu} data-testid="link-about">Tentang</a>
          <a href="#anggota" onClick={closeMenu} data-testid="link-members">Anggota</a>
          <a href="#kanal" onClick={closeMenu} data-testid="link-channel">Kanal utama</a>
          <a className="nav-cta" href={channel} target="_blank" rel="noreferrer" onClick={closeMenu} data-testid="link-youtube-nav">Kunjungi YouTube <ArrowUpRight /></a>
        </nav>
      </header>

      <main>
        <section className="hero" id="awal" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">Xtra Ordinary Vour · Indonesia</div>
            <h1 id="hero-title"><span>Xtra</span><span>ordinary</span><span>Vour.</span></h1>
            <p className="hero-intro">Empat kreator, satu nama kolektif. Kenali para anggota dan temukan kanal mereka—semua dimulai dari sini.</p>
            <div className="hero-actions">
              <a className="button-primary" href={channel} target="_blank" rel="noreferrer" data-testid="link-youtube-hero"><Play fill="currentColor" /> Kanal utama <ArrowUpRight /></a>
              <a className="button-quiet" href="#anggota" data-testid="link-explore-members">Kenali anggota <ArrowDown /></a>
            </div>
          </div>
          <div className="hero-emblem" aria-hidden="true">
            <div className="emblem-ring" />
            <div className="emblem-cut" /><div className="emblem-cut two" />
            <div className="emblem-xv">XV</div>
            <span className="emblem-label">CREATOR COLLECTIVE / ID</span>
          </div>
          <span className="hero-index">XOV / PERKENALAN</span>
          <a className="hero-scroll" href="#tentang" data-testid="link-scroll-about">Jelajahi <span>↓</span></a>
        </section>

        <section className="section intro-section" id="tentang">
          <div className="reveal">
            <div className="section-kicker">01 / Tentang XOV</div>
            <h2 className="section-title">Ruang untuk<br />jadi <em>extra.</em></h2>
            <div className="intro-mark">XTRA ORDINARY VOUR — INDONESIA</div>
          </div>
          <div className="intro-copy reveal delay-1">
            <p className="statement">Empat nama kreator berkumpul di bawah satu identitas: Xtra Ordinary Vour.</p>
            <p>Temukan kanal utama XOV, lalu kunjungi halaman setiap anggota untuk mengenal karya mereka lebih dekat. Halaman ini akan terus menjadi titik temu untuk semua kanal.</p>
          </div>
        </section>

        <section className="section members" id="anggota">
          <div className="section-head reveal">
            <div><div className="section-kicker">02 / Para anggota</div><h2 className="section-title">Temui para<br /><em>kreator.</em></h2></div>
            <p>Empat anggota Xtra Ordinary Vour. Pilih nama untuk menuju kanal masing-masing.</p>
          </div>
          <div className="member-grid" data-testid="member-grid">
            {content.members.map((member, index) => (
              <article className={`member-card reveal delay-${index % 3 + 1}`} key={member.id} data-testid={`card-member-${index + 1}`}>
                <div className="member-art" role="img" aria-label={`Gambar anggota ${member.name}`}>
                  <span className="member-number">XOV / 0{index + 1}</span>
                  {member.imageUrl ? (
                    <img className="member-img" src={member.imageUrl} alt={`Gambar ${member.name}`} />
                  ) : (
                    <div className="member-placeholder">
                      <span className="upload-glyph"><Upload aria-hidden="true" /></span>
                      <span className="placeholder-title">Slot foto / PNG<br />{member.name}</span>
                      <span className="placeholder-note">Gambar anggota belum ditambahkan.</span>
                    </div>
                  )}
                </div>
                <div className="member-info">
                  <h3 className="member-name">{member.name}</h3>
                  <div className="member-alias">{member.alias}</div>
                  <p>{member.description}</p>
                  <a className="member-link" href={member.channel} target="_blank" rel="noreferrer" aria-label={`Kunjungi kanal YouTube ${member.name}`} data-testid={`link-member-${index + 1}`}>
                    Kanal YouTube <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="channel-section" id="kanal" aria-labelledby="channel-title">
          <div className="channel-layout reveal">
            <div className="channel-copy">
              <div className="section-kicker">03 / Kanal utama</div>
              <h2 className="section-title" id="channel-title">Masuk ke<br /><em>XOV.</em></h2>
              <p>Kunjungi kanal YouTube resmi Xtra Ordinary Vour untuk menemukan konten terbaru dari kolektif.</p>
              <a className="button-primary" href={channel} target="_blank" rel="noreferrer" data-testid="link-youtube-featured">
                <Play fill="currentColor" aria-hidden="true" /> Buka kanal YouTube <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <aside className="channel-aside">
              <small>XTRA ORDINARY VOUR / YOUTUBE</small>
              <p>Satu identitas. Empat kreator. Temukan kanal yang paling ingin kamu ikuti.</p>
            </aside>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand" href="#awal" aria-label="Kembali ke awal">
          <span className="brand-logo"><img src={logo} alt="" /></span>
          <span className="brand-copy">XTRA ORDINARY<small>VOUR / CREATOR COLLECTIVE</small></span>
        </a>
        <div className="footer-note">© Xtra Ordinary Vour <a className="footer-admin-link" href="/admin">Kelola situs</a></div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/admin" component={AdminPage} />
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter hook={useHashLocation}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
