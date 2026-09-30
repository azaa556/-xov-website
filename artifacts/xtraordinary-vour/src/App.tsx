import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Menu, Play, Sparkles, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

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

  const closeMenu = () => setMenuOpen(false);
  const channel = 'https://youtube.com/@xtraordinaryvour';
  const members = [
    { name: 'Nara Vey', role: 'Penjaga siaran larut', copy: 'Mengumpulkan cerita yang tercecer di sela-sela malam.', note: 'arsiparis mimpi', initials: 'NV', color: '#f5d66c', bg: '#846958', skin: '#e9b99f', hair: '#302740', coat: '#eccf77' },
    { name: 'Mika Sora', role: 'Pengacak frekuensi', copy: 'Datang membawa teori aneh dan tawa yang menular.', note: 'radio dari awan', initials: 'MS', color: '#86d6c3', bg: '#477776', skin: '#f0c4ac', hair: '#241e3b', coat: '#78cbbb' },
    { name: 'Rumi Vale', role: 'Kurator benda ganjil', copy: 'Setiap benda punya kisah. Ia tahu sebagian besar kisahnya.', note: 'kolektor kecil', initials: 'RV', color: '#f08b78', bg: '#9b625a', skin: '#e8b79d', hair: '#40304a', coat: '#ed8f7a' },
    { name: 'Kiyo Noct', role: 'Penerjemah sunyi', copy: 'Membuat hal rumit terasa seperti obrolan di teras.', note: 'peta yang berjalan', initials: 'KN', color: '#bba1df', bg: '#65587e', skin: '#f0c8aa', hair: '#29243b', coat: '#b89ad8' },
  ];

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#awal" onClick={closeMenu} aria-label="Xtra Ordinary Vour, ke awal">
          <span className="brand-mark">xv</span><span>XTRA ORDINARY<small>VOUR / BROADCAST CLUB</small></span>
        </a>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-menu">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <nav className={`nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Navigasi utama">
          <a href="#cerita" onClick={closeMenu}>Cerita kami</a>
          <a href="#wajah" onClick={closeMenu}>Para penghuni</a>
          <a href="#frekuensi" onClick={closeMenu}>Isi siaran</a>
          <a className="nav-cta" href={channel} target="_blank" rel="noreferrer" onClick={closeMenu}>Temukan di YouTube <ArrowUpRight /></a>
        </nav>
      </header>

      <main>
        <section className="hero" id="awal" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">Siaran dari sisi lain layar</div>
            <h1 id="hero-title"><span>XTRA</span><span>ordinary</span><span>VOUR.</span></h1>
            <p className="hero-intro">Kami sekelompok suara dari tempat yang tidak ada di peta. Datanglah untuk satu cerita—tinggallah karena obrolannya.</p>
            <div className="hero-actions">
              <a className="button-primary" href={channel} target="_blank" rel="noreferrer" data-testid="link-youtube-hero"><Play fill="currentColor" /> Masuk ke siaran <ArrowUpRight /></a>
              <a className="button-quiet" href="#cerita">Kenali semesta ini <ArrowDown /></a>
            </div>
          </div>
          <div className="hero-art" aria-label="Ilustrasi abstrak seorang penyiar dari dunia imajinatif" role="img">
            <div className="orbit"><i className="planet" /></div>
            <div className="portrait"><i className="ear" /><i className="eye" /><i className="blush" /><i className="collar" /></div>
            <div className="orbit-note">halo, pendengar</div>
            <div className="stamp">aneh itu<br />tempat pulang</div>
          </div>
          <span className="side-caption">PENERIMAAN SINYAL / 00:00 — SELALU</span>
          <span className="hero-index">ID.01 / SEBUAH PERKENALAN</span>
          <a className="hero-scroll" href="#cerita">Gulir pelan-pelan ↓</a>
        </section>

        <div className="disclaimer" role="note" data-testid="notice-placeholder">
          <Sparkles aria-hidden="true" /><span><strong>CATATAN STUDIO:</strong> Profil, cerita, format, dan seluruh detail di halaman ini adalah contoh / placeholder untuk diganti oleh pemilik kanal.</span>
        </div>

        <section className="section manifesto" id="cerita">
          <div className="reveal">
            <div className="section-kicker">01 — Sedikit tentang kami</div>
            <h2 className="section-title">Tidak semua<br />yang aneh itu<br /><em>asing.</em></h2>
            <div className="scribble">sinyalmu<br />sampai</div>
          </div>
          <div className="manifesto-copy reveal delay-1">
            <p className="big-line">“Kadang kita cuma perlu ruang yang tidak meminta kita jadi biasa.”</p>
            <p>Xtra Ordinary Vour adalah konsep rumah siaran untuk para pencerita, pengelana ide, dan manusia-manusia sedikit tidak biasa. Bukan soal menjadi paling lantang. Ini tentang menemukan frekuensi yang terasa seperti milik sendiri.</p>
            <p>Anggap halaman ini sebagai undangan masuk ke ruang obrolan imajiner kami. Kru dan kisah di bawah masih berupa contoh—kepribadian aslinya menunggu untuk kamu kenal di kanal resmi.</p>
          </div>
        </section>

        <section className="section members" id="wajah">
          <div className="section-head reveal">
            <div><div className="section-kicker">02 — Kru contoh / placeholder</div><h2 className="section-title">Yang menjaga<br /><em>frekuensi.</em></h2></div>
            <p>Empat suara, empat sudut pandang. Nama, profil, dan ilustrasi berikut hanya bahan contoh—silakan ganti dengan anggota resmi.</p>
          </div>
          <div className="member-grid">
            {members.map((member, index) => (
              <article className={`member-card reveal delay-${index % 3 + 1}`} key={member.initials} style={{ '--member-color': member.color, '--member-bg': member.bg, '--skin': member.skin, '--hair': member.hair, '--coat': member.coat } as CSSProperties} data-testid={`card-member-${member.initials.toLowerCase()}`}>
                <div className="member-art" role="img" aria-label={`Ilustrasi placeholder ${member.name}`}>
                  <span className="member-number">XV—0{index + 1}</span><div className="mini-person"><i className="body" /></div><span className="member-orbit-label">{member.note}</span>
                </div>
                <div className="member-info"><h3>{member.name}</h3><div className="member-role">{member.role}</div><p>{member.copy}</p><div className="member-tag">contoh karakter · ganti profil ini</div></div>
              </article>
            ))}
          </div>
        </section>

        <section className="section formats" id="frekuensi">
          <div className="section-kicker reveal">03 — Hal-hal yang mungkin kita lakukan</div>
          <h2 className="section-title reveal">Satu kanal,<br /><em>banyak semesta.</em></h2>
          <div className="format-layout">
            <p className="format-intro reveal">Format berikut adalah ide contoh, bukan jadwal atau program yang sedang berjalan. Isi siaran sesungguhnya bisa kamu temukan langsung di kanal resmi.</p>
            <div className="format-list reveal delay-1">
              <div className="format-row"><span className="num">01</span><div><h3>Ruang tamu tengah malam</h3><p>Obrolan ringan, cerita yang nyaris terlupa, dan pertanyaan yang tak buru-buru dijawab.</p></div><span className="arrow">↗</span></div>
              <div className="format-row"><span className="num">02</span><div><h3>Ekspedisi dari kursi</h3><p>Menjelajah game, dunia rekaan, atau misteri kecil dengan rasa ingin tahu sebagai kompas.</p></div><span className="arrow">↗</span></div>
              <div className="format-row"><span className="num">03</span><div><h3>Frekuensi pendengar</h3><p>Surat, rekomendasi, dan cerita dari kamu. Ruang ini selalu lebih ramai kalau dibagi.</p></div><span className="arrow">↗</span></div>
            </div>
          </div>
        </section>

        <section className="broadcast" aria-labelledby="broadcast-title">
          <div className="broadcast-panel reveal">
            <div className="broadcast-visual" role="img" aria-label="Ilustrasi panggung siaran imajiner"><span className="play-button" aria-hidden="true"><Play fill="currentColor" size={19} /></span></div>
            <div className="broadcast-copy">
              <div className="broadcast-meta">Kanal resmi · satu klik dari sini</div>
              <h2 id="broadcast-title" className="section-title">Penasaran<br />sama suaranya?</h2>
              <p>Halaman ini cuma pintu depan. Sinyal sungguhan, video, dan kabar terbaru ada di kanal YouTube Xtra Ordinary Vour.</p>
              <a className="button-primary" href={channel} target="_blank" rel="noreferrer" data-testid="link-youtube-featured"><Play fill="currentColor" /> Kunjungi kanal YouTube <ArrowUpRight /></a>
            </div>
          </div>
        </section>

        <section className="signal" id="pendengar">
          <div className="reveal">
            <div className="section-kicker">04 — Frekuensi terbuka</div>
            <h2 className="section-title">Bawa ceritamu.<br /><em>Kami dengar.</em></h2>
            <p>Tempat terbaik untuk ikut menyapa, menonton, atau sekadar melihat apa yang sedang terjadi adalah kanal resmi kami. Sampai jumpa di sana.</p>
            <div className="signal-action"><a className="button-primary" href={channel} target="_blank" rel="noreferrer" data-testid="link-youtube-community">Ikuti frekuensinya <ArrowUpRight /></a></div>
          </div>
          <div className="signal-card reveal delay-1">
            <small>CATATAN UNTUK PENDENGAR / 001</small>
            <blockquote>“Kamu tidak perlu menjelaskan kenapa hal-hal kecil terasa besar.”</blockquote>
            <cite>— pesan contoh dari ruang siaran</cite>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand" href="#awal" aria-label="Kembali ke awal"><span className="brand-mark">xv</span><span>XTRA ORDINARY<small>VOUR / BROADCAST CLUB</small></span></a>
        <div className="footer-note">Semua profil &amp; tulisan anggota di sini adalah placeholder.<br />© Xtra Ordinary Vour · Silakan ganti identitas dan konten contoh.</div>
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
