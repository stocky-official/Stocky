'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ActivityIcon, ArrowUpDownIcon, BoxesIcon, ChevronRightIcon, ClockIcon, TruckIcon } from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import { getAuthRedirectOrigin } from '@/lib/authRedirect';

const features = [
  { id: 'stock', number: '01.', title: 'Stock control', body: 'See every item, location, batch, and expiry in one calm operating view.', stat: '100%', statLabel: 'inventory visibility' },
  { id: 'flow', number: '02.', title: 'Transfers and audits', body: 'Give every movement an owner, a destination, and a clear next action.', stat: '3.4×', statLabel: 'faster decisions' },
  { id: 'team', number: '03.', title: 'Team coordination', body: 'Keep staff, suppliers, and the work waiting for them connected.', stat: '24/7', statLabel: 'operational readiness' },
  { id: 'expiry', number: '04.', title: 'Expiry intelligence', body: 'Turn dates and attention signals into work before value disappears.', stat: '0', statLabel: 'surprises at close' },
] as const;

const faqs = [
  ['Is Stocky secure?', 'Stocky keeps your company data behind authenticated workspace access and clear team permissions.'],
  ['Who is Stocky for?', 'Stocky is built for operators running branches, warehouses, suppliers, and distributed teams.'],
  ['Can I start with one location?', 'Yes. Start with one location and add branches or warehouses as the operation grows.'],
  ['How long does setup take?', 'Most teams can create their workspace, add locations, and invite their team in minutes.'],
  ['Can I import existing stock?', 'Yes. Import your current inventory, then keep receiving, auditing, and transferring it from one place.'],
] as const;

function StockSnapshot() {
  return <div className="meridian-stock-snapshot" aria-label="Stocky inventory preview">
    <div className="meridian-snapshot-top"><div className="meridian-snapshot-brand"><span><BoxesIcon size="xs" /></span><b>Stocky</b></div><span className="meridian-snapshot-user">AB</span></div>
    <div className="meridian-snapshot-heading"><div><small>ALL LOCATIONS</small><h3>Company stock</h3></div><span className="meridian-snapshot-plus">+ Receive</span></div>
    <div className="meridian-snapshot-metrics"><div><small>PRODUCTS</small><strong>248</strong><span>+12.4%</span></div><div><small>AT RISK</small><strong>08</strong><span className="meridian-warning">Needs review</span></div><div><small>INVENTORY VALUE</small><strong>$84k</strong><span>Across 6 sites</span></div></div>
    <div className="meridian-snapshot-table"><div className="meridian-snapshot-table-head"><span>PRODUCT</span><span>LOCATION</span><span>STATUS</span><span>QTY</span></div>{[['Cold brew / 330ml', 'Main branch', 'Healthy', '1,240'], ['Oat milk / 1L', 'Warehouse 02', 'Watch', '386'], ['Paper cups / 12oz', 'Branch 04', 'Healthy', '2,880']].map(([product, location, status, qty]) => <div className="meridian-snapshot-row" key={product}><span><i />{product}</span><span>{location}</span><b className={status === 'Watch' ? 'is-warning' : ''}>{status}</b><strong>{qty}</strong></div>)}</div>
  </div>;
}

function FeatureVisual({ feature }: { feature: typeof features[number] }) {
  return <div className="meridian-feature-visual">
    <div className="meridian-feature-window-bar"><span>Stocky / {feature.title}</span><span><i /><i /><i /></span></div>
    <div className="meridian-feature-window-body"><div className="meridian-feature-window-nav"><span className="is-active" /><span /><span /><span /><span /></div><div className="meridian-feature-window-content"><div className="meridian-feature-window-title"><small>LIVE OPERATIONS</small><b>{feature.title}</b><span>Updated just now</span></div><div className="meridian-feature-chart"><span style={{ height: '38%' }} /><span style={{ height: '53%' }} /><span style={{ height: '48%' }} /><span style={{ height: '67%' }} /><span style={{ height: '61%' }} /><span style={{ height: '85%' }} /><span style={{ height: '78%' }} /><span style={{ height: '100%' }} /></div><div className="meridian-feature-window-lines"><i /><i /><i /></div></div></div>
  </div>;
}

export function LandingHeroWidget() {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<(typeof features)[number]['id']>('stock');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [locations, setLocations] = useState(6);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => { if (user && !cancelled) router.push('/platform'); });
    return () => { cancelled = true; };
  }, [router]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = rootRef.current;
    if (!root) return undefined;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' } }).from('.meridian-nav', { y: -24, opacity: 0, duration: .7 }).from('.meridian-hero-rating, .meridian-hero h1, .meridian-hero-copy > p, .meridian-hero-cta', { y: 32, opacity: 0, duration: .75, stagger: .09 }, '-=.35').from('.meridian-hero-award', { y: 18, opacity: 0, duration: .55 }, '-=.35');
      gsap.to('.meridian-hero-photo', { scale: 1.08, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.meridian-float-chip--one', { y: -12, rotation: -2, duration: 2.7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.meridian-float-chip--two', { y: 10, rotation: 2, duration: 3.1, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: .35 });
      gsap.utils.toArray<HTMLElement>('.meridian-reveal').forEach((element) => gsap.fromTo(element, { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 84%', once: true } }));
      gsap.to('.meridian-marquee-track', { xPercent: -28, duration: 24, repeat: -1, ease: 'none' });
    }, root);
    return () => ctx.revert();
  }, []);

  const handleGoogleSignUp = async () => { setLoading(true); const origin = getAuthRedirectOrigin(); await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback?next=/platform` } }); };
  const selectedFeature = features.find((feature) => feature.id === activeFeature) || features[0];

  return <main ref={rootRef} className="meridian-landing">
    <section id="top" className="meridian-hero">
      <div className="meridian-hero-photo" aria-hidden="true" /><div className="meridian-hero-overlay" aria-hidden="true" />
      <nav className="meridian-nav" aria-label="Main navigation"><a href="#top" className="meridian-brand"><span className="meridian-brand-mark"><BoxesIcon size="sm" /></span><span>stocky</span></a><div className="meridian-nav-links"><a href="#product">Product</a><a href="#workflow">Workflow</a><a href="#teams">Teams</a><a href="#faq">FAQ</a></div><div className="meridian-nav-actions"><button type="button" className="meridian-nav-login" onClick={() => router.push('/platform')}>Sign in</button><button type="button" className="meridian-pill meridian-pill--lime meridian-pill--nav" onClick={handleGoogleSignUp}>{loading ? 'Opening…' : 'Get Started Free'}</button></div><button type="button" className="meridian-menu-button" aria-label="Open menu"><span /><span /><span /></button></nav>
      <div className="meridian-hero-copy"><div className="meridian-hero-rating"><span>✦</span> 4.9 on G2.com</div><h1>Stock today.<br /><span>Clarity tomorrow.</span></h1><p>Unlock a clearer way to manage every product, location, and decision your operation depends on.</p><button type="button" className="meridian-pill meridian-pill--lime meridian-hero-cta" onClick={handleGoogleSignUp}>{loading ? 'Opening workspace…' : 'Get Started Free'}<ChevronRightIcon size="xs" /></button></div>
      <div className="meridian-hero-award"><span className="meridian-award-laurel">✺</span><b>Built for</b><small>busy operators</small></div>
      <div className="meridian-float-chip meridian-float-chip--one"><ActivityIcon size="xs" /><span><b>+18.6%</b><small>stock health</small></span></div><div className="meridian-float-chip meridian-float-chip--two"><ClockIcon size="xs" /><span><b>12 tasks</b><small>ready today</small></span></div>
    </section>

    <div className="meridian-trust-strip"><div><strong>4.8</strong><span>(2,004 operators)</span></div><p>Backed by teams that care about every product and every decision.</p><div className="meridian-trust-mark"><span>#1</span><small>Most useful<br />inventory layer</small></div></div>

    <section id="product" className="meridian-section meridian-intro meridian-reveal"><div className="meridian-heading-block"><p className="meridian-overline">ONE CLEAR EXPERIENCE</p><h2>A clean experience<br /><span>for a messy operation.</span></h2><p>Stocky gives businesses of every size the essential tools to modernise inventory operations and keep the next move obvious.</p></div><div className="meridian-intro-grid"><article className="meridian-intro-card"><div className="meridian-card-art meridian-card-art--receiving"><div className="meridian-receiving-window"><span>RECEIVE STOCK</span><strong>3 items ready</strong><div><i /><i /><i /></div><b>Confirm delivery <ChevronRightIcon size="xs" /></b></div></div><h3>From receiving to transfer, keep the workflow moving.</h3></article><article className="meridian-intro-card"><div className="meridian-card-art meridian-card-art--scan"><div className="meridian-scan-phone"><div className="meridian-scan-top"><span>SCAN PRODUCT</span><span>×</span></div><div className="meridian-scan-barcode"><i /><i /><i /><i /><i /><i /><i /></div><strong>Test Item</strong><small>Barcode matched · 1234</small><b>Added to Main Branch</b></div></div><h3>Scan a product and let the right location, quantity, and expiry follow.</h3></article></div></section>

    <section id="workflow" className="meridian-section meridian-control meridian-reveal"><div className="meridian-heading-block meridian-heading-block--center"><p className="meridian-overline">CONTROL THE OPERATION IN SECONDS</p><h2>Know what is moving<br /><span>before it becomes a problem.</span></h2><p>See stock, transfers, expiry, and team work in one quiet system built for real-world pace.</p><button type="button" className="meridian-pill meridian-pill--lime" onClick={handleGoogleSignUp}>Explore Stocky <ChevronRightIcon size="xs" /></button></div><div className="meridian-control-grid"><div className="meridian-control-tabs" role="tablist" aria-label="Stocky capabilities">{features.map((feature) => <button key={feature.id} type="button" role="tab" aria-selected={activeFeature === feature.id} onClick={() => setActiveFeature(feature.id)} className={activeFeature === feature.id ? 'is-active' : ''}><span>{feature.number}</span><strong>{feature.title}</strong><ChevronRightIcon size="xs" /><small>{activeFeature === feature.id ? feature.body : ''}</small></button>)}</div><div className="meridian-control-preview"><div className="meridian-control-preview-copy"><small>{selectedFeature.statLabel}</small><strong>{selectedFeature.stat}</strong></div><FeatureVisual feature={selectedFeature} /></div></div></section>

    <section id="teams" className="meridian-section meridian-relief meridian-reveal"><div className="meridian-relief-copy"><p className="meridian-overline">LESS HUNTING. MORE KNOWING.</p><h2>Make the next action<br /><span>feel effortless.</span></h2><p>Fast decisions need faster tools. That is why growing teams rely on Stocky to keep locations, suppliers, and people moving together.</p><button type="button" className="meridian-pill meridian-pill--dark" onClick={handleGoogleSignUp}>Start with clarity <ChevronRightIcon size="xs" /></button></div><div className="meridian-relief-art"><div className="meridian-relief-image"><StockSnapshot /></div><div className="meridian-money-chip meridian-money-chip--one"><b>100 units</b><small>received today</small></div><div className="meridian-money-chip meridian-money-chip--two"><b>Main Branch → Warehouse</b><small>transfer completed</small></div></div></section>

    <section className="meridian-section meridian-calculator meridian-reveal"><div className="meridian-heading-block"><p className="meridian-overline">SEE THE DIFFERENCE</p><h2>Find out what<br /><span>your inventory can do.</span></h2><p>See how much time and visibility you unlock when every location works from the same picture.</p><button type="button" className="meridian-pill meridian-pill--lime" onClick={handleGoogleSignUp}>Get Started Free <ChevronRightIcon size="xs" /></button></div><div className="meridian-calculator-card"><div className="meridian-calculator-top"><div><small>LOCATIONS IN YOUR OPERATION</small><strong>{locations}</strong></div><div><small>VISIBLE EVERY DAY</small><strong>{locations * 248}</strong><span>stock positions</span></div></div><input type="range" min="1" max="12" value={locations} onChange={(event) => setLocations(Number(event.target.value))} aria-label="Number of locations" /><div className="meridian-calculator-labels"><span>1 location</span><span>12 locations</span></div><div className="meridian-compare-list"><div><span><i className="is-stocky" />Stocky</span><b>{locations * 18} hrs saved</b><em>{locations * 18}</em></div><div><span><i />Spreadsheets</span><b>Manual work</b><em>{Math.max(12, locations * 4)}</em></div><div><span><i />Disconnected tools</span><b>Hidden work</b><em>{Math.max(8, locations * 3)}</em></div></div></div></section>

    <section className="meridian-section meridian-results meridian-reveal"><div className="meridian-heading-block meridian-heading-block--center"><h2>Real results from<br /><span>real operators.</span></h2></div><div className="meridian-results-grid"><article><div className="meridian-result-art meridian-result-art--one"><BoxesIcon size="md" /></div><strong>2.4×</strong><p>faster receiving decisions</p></article><article><div className="meridian-result-art meridian-result-art--two"><ArrowUpDownIcon size="md" /></div><strong>20%</strong><p>less stock lost to expiry</p></article><article><div className="meridian-result-art meridian-result-art--three"><TruckIcon size="md" /></div><strong>41%</strong><p>more supplier follow-through</p></article></div></section>

    <section id="faq" className="meridian-section meridian-faq meridian-reveal"><div className="meridian-faq-heading"><p className="meridian-overline">QUESTIONS, RESOLVED</p><h2>Everything you need<br /><span>in one place.</span></h2><button type="button" className="meridian-pill meridian-pill--lime" onClick={handleGoogleSignUp}>Get Started Free <ChevronRightIcon size="xs" /></button></div><div className="meridian-faq-list">{faqs.map(([question, answer], index) => <div className={`meridian-faq-item ${openFaq === index ? 'is-open' : ''}`} key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><b>+</b></button><div><p>{answer}</p></div></div>)}</div></section>

    <section className="meridian-final-cta meridian-reveal"><p className="meridian-overline">BUILT FOR THE WORK THAT MATTERS</p><h2>Make every location<br /><span>feel close.</span></h2><button type="button" className="meridian-pill meridian-pill--lime" onClick={handleGoogleSignUp}>{loading ? 'Opening workspace…' : 'Get Started Free'}<ChevronRightIcon size="xs" /></button></section>
    <footer className="meridian-footer"><a href="#top" className="meridian-brand"><span className="meridian-brand-mark"><BoxesIcon size="sm" /></span><span>stocky</span></a><span>Inventory, in the moment.</span><div><a href="#product">Product</a><a href="#workflow">Workflow</a><a href="#teams">Teams</a><a href="#faq">FAQ</a></div></footer>
  </main>;
}
