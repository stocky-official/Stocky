'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ActivityIcon, ArrowUpDownIcon, BoxesIcon, CheckCircleIcon, ChevronRightIcon, ClockIcon, PlusIcon, StockyLogoIcon, TruckIcon, XIcon } from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import { signOutUser } from '@/lib/auth';
import { isSafeInternalPath, normalizeInternalPath } from '@/lib/authRedirect';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

const features = [
  { id: 'stock', number: '01.', title: 'Stock control', body: 'Track SKU, batch, lot, expiry, bin, and quantity from receiving through replenishment.', stat: 'SKU → bin', statLabel: 'traceable inventory', chart: [38, 53, 48, 67, 61, 85, 78, 100] },
  { id: 'flow', number: '02.', title: 'Transfers and audits', body: 'Give every movement an owner, a destination, an approval trail, and a clear next action.', stat: 'Owner + trail', statLabel: 'controlled movement', chart: [82, 62, 74, 49, 66, 42, 58, 35] },
  { id: 'team', number: '03.', title: 'Team coordination', body: 'Connect staff, suppliers, and the work waiting for them across branches and warehouses.', stat: 'One queue', statLabel: 'coordinated work', chart: [28, 46, 34, 57, 52, 69, 64, 84] },
  { id: 'expiry', number: '04.', title: 'Expiry intelligence', body: 'Turn batch dates and attention signals into action before stock loses value.', stat: 'Batch first', statLabel: 'expiry-aware work', chart: [74, 66, 58, 51, 44, 39, 32, 26] },
] as const;

const faqs = [
  ['Is Stocky secure?', 'Stocky uses authenticated workspace access, company-scoped permissions, and role-aware data views. Ask sales for the current security and data-processing documentation.'],
  ['Who is Stocky for?', 'Stocky is built for retail, food and beverage, wholesale, and e-commerce teams running branches, warehouses, suppliers, and distributed operations.'],
  ['Can I start with one location?', 'Yes. Start with one branch or warehouse and add locations as the operation grows. Enterprise plans support larger multi-location rollouts.'],
  ['How long does setup take?', 'Workspace access is subject to verification. A typical pilot can be configured in minutes after approval; enterprise rollouts use a scoped implementation plan.'],
  ['Can I import existing stock?', 'Yes. Import your current inventory, then keep receiving, auditing, picking, replenishing, and transferring it from one place.'],
] as const;

const enterpriseSignals = [
  ['Company-scoped workspaces', 'Keep each organization’s locations, inventory, suppliers, and activity history isolated by tenant.'],
  ['Role-aware accountability', 'Give owners, admins, managers, and frontline staff the access and approval steps their work requires.'],
  ['Integration-ready handoffs', 'Start with CSV import/export and barcode workflows, then scope ERP, commerce, accounting, or carrier connections with sales.'],
] as const;

const differentiators = [
  ['Lot-level traceability', 'Follow SKU, lot, expiry, bin, and quantity through receiving, putaway, picking, replenishment, and transfer.'],
  ['Location-aware movement', 'Request, approve, dispatch, and receive stock with source and destination ownership in the same record.'],
  ['Work before dashboards', 'Turn low stock, expiry, counts, and transfer decisions into queues with a clear next action.'],
] as const;

function StockSnapshot() {
  return <div className="meridian-stock-snapshot" role="img" aria-label="Illustrative Stocky inventory preview">
    <div className="meridian-snapshot-top"><div className="meridian-snapshot-brand"><span><StockyLogoIcon size="xs" /></span><b>Stocky</b></div><span className="meridian-snapshot-user">AB</span></div>
    <div className="meridian-snapshot-heading"><div><small>ALL LOCATIONS</small><h3>Company stock</h3></div><span className="meridian-snapshot-plus" aria-label="Receive stock status">Ready to receive</span></div>
    <div className="meridian-snapshot-metrics"><div><small>SKUS</small><strong>248</strong><span>Across 6 sites</span></div><div><small>AT RISK</small><strong>08</strong><span className="meridian-warning">Needs review</span></div><div><small>OPEN WORK</small><strong>12</strong><span>Receiving and audits</span></div></div>
    <div className="meridian-snapshot-table"><div className="meridian-snapshot-table-head"><span>SKU / LOT</span><span>BIN</span><span>STATUS</span><span>QTY</span></div>{[['CB-330 / L2407', 'A-02-04', 'Healthy', '1,240'], ['OM-1L / L2408', 'B-01-02', 'Watch', '386'], ['PC-12 / L2406', 'C-03-01', 'Healthy', '2,880']].map(([product, location, status, qty]) => <div className="meridian-snapshot-row" key={product}><span><i />{product}</span><span>{location}</span><b className={status === 'Watch' ? 'is-warning' : ''}>{status}</b><strong>{qty}</strong></div>)}</div>
  </div>;
}

function FeatureVisual({ feature }: { feature: typeof features[number] }) {
  return <div className="meridian-feature-visual" role="img" aria-label={`${feature.title} illustrative preview`}>
    <div className="meridian-feature-window-bar"><span>Stocky / {feature.title}</span><span><i /><i /><i /></span></div>
    <div className="meridian-feature-window-body"><div className="meridian-feature-window-nav" aria-hidden="true"><span className="is-active" /><span /><span /><span /><span /></div><div className="meridian-feature-window-content"><div className="meridian-feature-window-title"><small>LIVE OPERATIONS</small><b>{feature.title}</b><span>Example view</span></div><div className="meridian-feature-chart" aria-label={`${feature.title} example trend`}>{feature.chart.map((height, index) => <span key={`${feature.id}-${index}`} style={{ height: `${height}%` }} />)}</div><div className="meridian-feature-window-lines" aria-hidden="true"><i /><i /><i /></div></div></div>
  </div>;
}

export function LandingHeroWidget() {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'anonymous'>('checking');
  const [nextDestination, setNextDestination] = useState('/platform');
  const [activeFeature, setActiveFeature] = useState<(typeof features)[number]['id']>('stock');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [locations, setLocations] = useState(6);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const featureButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    let cancelled = false;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get('next');
      if (isSafeInternalPath(nextParam)) {
        setNextDestination(nextParam);
      }
      if (params.get('auth_error')) {
        setAuthError('Sign-in could not be completed. Please try again or contact sales for an enterprise access path.');
      }
    }

    const resolveWorkspaceDestination = async (userId: string) => {
      const { data: memberships } = await supabase
        .from('company_users')
        .select('company:companies(code)')
        .eq('auth_user_id', userId)
        .limit(1);
      const compCode = (memberships?.[0]?.company as any)?.code;
      if (compCode && !cancelled) setNextDestination(`/${compCode.toLowerCase()}`);
    };

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user && !cancelled) {
        setAuthStatus('authenticated');
        setAuthUserEmail(user.email || null);
        try {
          await resolveWorkspaceDestination(user.id);
        } catch {
          // Keep the safe default destination.
        }
      } else if (!cancelled) {
        setAuthStatus('anonymous');
      }
    }).catch((error) => {
      if (!cancelled) {
        console.warn('Unable to restore landing session:', error);
        setAuthStatus('anonymous');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setAuthStatus(session?.user ? 'authenticated' : 'anonymous');
        setAuthUserEmail(session?.user?.email || null);
        if (session?.user) void resolveWorkspaceDestination(session.user.id);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = rootRef.current;
    if (!root) return undefined;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' } }).from('.meridian-nav', { y: -24, opacity: 0, duration: .7 }).from('.meridian-hero-rating, .meridian-hero h1, .meridian-hero-copy > p, .meridian-hero-cta', { y: 32, opacity: 0, duration: .75, stagger: .09 }, '-=.35').from('.meridian-hero-award', { y: 18, opacity: 0, duration: .55 }, '-=.35');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reducedMotion) {
        gsap.to('.meridian-hero-photo', { scale: 1.04, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to('.meridian-float-chip--one', { y: -12, rotation: -2, duration: 2.7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to('.meridian-float-chip--two', { y: 10, rotation: 2, duration: 3.1, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: .35 });
      }
      gsap.utils.toArray<HTMLElement>('.meridian-reveal').forEach((element) => gsap.fromTo(element, { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 84%', once: true } }));
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const focusableSelector = 'a[href], button:not([disabled])';
    const getFocusableItems = () => Array.from(
      mobileMenuRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || []
    );
    mobileMenuRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = getFocusableItems();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navigateToWorkspace = (target = nextDestination) => {
    setLoading(true);
    router.push(normalizeInternalPath(target));
  };

  const handleAuth = (targetDestination = nextDestination) => {
    if (authStatus === 'checking') return;
    setAuthError(null);
    setLoading(true);
    router.push(`/auth/email?next=${encodeURIComponent(normalizeInternalPath(targetDestination))}`);
  };

  const handleExplore = () => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const handleDemo = () => { window.location.href = 'mailto:sales@stocky.example?subject=Stocky%20demo%20request'; };
  const handleFeatureKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? features.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + features.length) % features.length;
    setActiveFeature(features[nextIndex].id);
    featureButtonRefs.current[nextIndex]?.focus();
  };

  const selectedFeature = features.find((feature) => feature.id === activeFeature) || features[0];
  const isAuthenticated = authStatus === 'authenticated';

  return <main ref={rootRef} className="meridian-landing">
    <a className="meridian-skip-link" href="#product">Skip to content</a>
    <section id="top" className="meridian-hero">
      <div className="meridian-hero-photo" aria-hidden="true" /><div className="meridian-hero-overlay" aria-hidden="true" />
      <nav className="meridian-nav" aria-label="Main navigation">
        <a href="#top" className="meridian-brand"><span className="meridian-brand-mark"><StockyLogoIcon size="sm" /></span><span>stocky</span></a>
        <div className="meridian-nav-links"><a href="#product">Product</a><a href="#workflow">Workflow</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div>
        <div className="meridian-nav-actions">
          <LanguageSwitcher variant="compact" className="meridian-language-switcher" />
          {authStatus === 'checking' ? (
            <span className="meridian-account-email" aria-live="polite">Checking session…</span>
          ) : isAuthenticated ? (
            <div className="meridian-account-actions"><span className="meridian-account-email" title={authUserEmail || undefined}>{authUserEmail || 'Signed in'}</span><button type="button" className="meridian-nav-login" onClick={() => void signOutUser()}>Sign out</button><button type="button" className="meridian-pill meridian-pill--blue meridian-pill--nav" onClick={() => navigateToWorkspace(nextDestination)}>{loading ? 'Opening…' : 'Go to Workspace'} <ChevronRightIcon size="xs" /></button></div>
          ) : (
            <>
              <button type="button" className="meridian-nav-login" onClick={() => handleAuth(nextDestination)}>{loading ? 'Signing in…' : 'Sign in'}</button>
              <button type="button" className="meridian-pill meridian-pill--blue meridian-pill--nav" onClick={() => handleAuth(nextDestination)}>{loading ? 'Opening…' : 'Get Started Free'}</button>
            </>
          )}
        </div>
        <button
          type="button"
          className="meridian-menu-button"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="meridian-mobile-drawer"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span /><span /><span />
        </button>
        {mobileMenuOpen && (
          <>
          <button
            type="button"
            className="meridian-mobile-backdrop"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div ref={mobileMenuRef} id="meridian-mobile-drawer" className="meridian-mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile navigation">
            <a href="#product" onClick={() => setMobileMenuOpen(false)}>Product</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)}>Workflow</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className="meridian-mobile-actions">
              <LanguageSwitcher variant="compact" className="meridian-language-switcher" />
              {authStatus === 'checking' ? (
                <span className="meridian-account-email" aria-live="polite">Checking session…</span>
              ) : isAuthenticated ? (
                <button
                  type="button"
                  className="meridian-pill meridian-pill--lime meridian-mobile-action"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateToWorkspace(nextDestination);
                  }}
                >
                  {loading ? 'Opening…' : 'Go to Workspace'} <ChevronRightIcon size="xs" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="meridian-mobile-signin"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleAuth(nextDestination);
                    }}
                  >
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>
                  <button
                    type="button"
                    className="meridian-pill meridian-pill--lime meridian-mobile-action"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleAuth(nextDestination);
                    }}
                  >
                    {loading ? 'Opening…' : 'Get Started Free'}
                  </button>
                </>
              )}
            </div>
          </div>
          </>
        )}
      </nav>
      <div className="meridian-hero-copy">
    <div className="meridian-hero-rating"><CheckCircleIcon size="xs" /> Multi-location inventory and warehouse operations</div>
        <h1>Inventory control<br /><span>from receipt to replenishment.</span></h1>
        <p>Track products, lots, expiry dates, bins, transfers, and approvals across retail, food and beverage, wholesale, and e-commerce operations.</p>
        <button
          type="button"
          className="meridian-pill meridian-pill--lime meridian-hero-cta"
          onClick={() => authStatus === 'checking' ? undefined : isAuthenticated ? navigateToWorkspace(nextDestination) : handleAuth(nextDestination)}
        >
          {authStatus === 'checking' ? 'Checking session…' : loading ? 'Opening workspace…' : isAuthenticated ? 'Go to Workspace' : 'Get Started Free'}
          <ChevronRightIcon size="xs" />
        </button>
      </div>
      <div className="meridian-hero-award"><span className="meridian-award-laurel" aria-hidden="true"><CheckCircleIcon size="xs" /></span><b>Built for</b><small>branches, warehouses, and suppliers</small></div>
      <div className="meridian-float-chip meridian-float-chip--one"><ActivityIcon size="xs" /><span><b>Healthy</b><small>stock health</small></span></div><div className="meridian-float-chip meridian-float-chip--two"><ClockIcon size="xs" /><span><b>Open work</b><small>ready today</small></span></div>
    </section>

    <div className="meridian-trust-strip"><div><strong>4 steps</strong><span>receive · store · move · audit</span></div><p>One operational record for the work that happens between suppliers, branches, and warehouses.</p><div className="meridian-trust-mark"><span>API</span><small>connect your<br />existing stack</small></div></div>

    <section id="product" className="meridian-section meridian-intro meridian-reveal"><div className="meridian-heading-block"><p className="meridian-overline">ONE OPERATIONAL RECORD</p><h2>From receiving to picking,<br /><span>keep the next action clear.</span></h2><p>Stocky gives retail, food and beverage, wholesale, and e-commerce teams a shared view of SKU, lot, expiry, bin, transfer, and approval work.</p></div><div className="meridian-intro-grid"><article className="meridian-intro-card"><div className="meridian-card-art meridian-card-art--receiving" role="img" aria-label="Illustrative receiving record"><div className="meridian-receiving-window"><span>RECEIVE STOCK</span><strong>Example intake</strong><div><i /><i /><i /></div><span className="meridian-status-control">Example: ready for review <ChevronRightIcon size="xs" /></span></div></div><h3>Receive against an order, verify quantities, and direct putaway to a zone, aisle, rack, shelf, or bin.</h3></article><article className="meridian-intro-card"><div className="meridian-card-art meridian-card-art--scan" role="img" aria-label="Illustrative barcode scanning record"><div className="meridian-scan-phone"><div className="meridian-scan-top"><span>SCAN PRODUCT</span><XIcon size="xs" aria-hidden="true" /></div><div className="meridian-scan-barcode" aria-label="Example barcode"><i /><i /><i /><i /><i /><i /><i /></div><strong>Cold brew 330ml</strong><small>Barcode matched · <bdi>078123456789</bdi></small><span className="meridian-status-control">Example: put away to A-02-04</span></div></div><h3>Scan with a rugged handheld, continue during connectivity loss, then sync the confirmed movement.</h3></article></div></section>

    <section id="workflow" className="meridian-section meridian-control meridian-reveal"><div className="meridian-heading-block meridian-heading-block--center"><p className="meridian-overline">CONTROL THE OPERATION IN SECONDS</p><h2>Know what is moving<br /><span>before it becomes a problem.</span></h2><p>See stock, transfers, expiry, picking, and team work in one system built for real-world pace.</p><button type="button" className="meridian-pill meridian-pill--blue" onClick={handleExplore}>Explore the workflow <ChevronRightIcon size="xs" /></button></div><div className="meridian-control-grid"><div className="meridian-control-tabs" role="tablist" aria-label="Stocky capabilities">{features.map((feature, index) => <button key={feature.id} ref={(element) => { featureButtonRefs.current[index] = element; }} type="button" role="tab" id={`feature-tab-${feature.id}`} aria-selected={activeFeature === feature.id} aria-controls={`feature-panel-${feature.id}`} tabIndex={activeFeature === feature.id ? 0 : -1} onKeyDown={(event) => handleFeatureKeyDown(event, index)} onClick={() => setActiveFeature(feature.id)} className={activeFeature === feature.id ? 'is-active' : ''}><span>{feature.number}</span><strong>{feature.title}</strong><ChevronRightIcon size="xs" /><small>{activeFeature === feature.id ? feature.body : ''}</small></button>)}</div><div id={`feature-panel-${selectedFeature.id}`} className="meridian-control-preview" role="tabpanel" aria-labelledby={`feature-tab-${selectedFeature.id}`}><div className="meridian-control-preview-copy"><small>{selectedFeature.statLabel}</small><strong>{selectedFeature.stat}</strong></div><FeatureVisual feature={selectedFeature} /></div></div></section>

    <section id="teams" className="meridian-section meridian-relief meridian-reveal"><div className="meridian-relief-copy"><p className="meridian-overline">LESS HUNTING. MORE KNOWING.</p><h2>Make the next action<br /><span>feel accountable.</span></h2><p>Give managers, frontline staff, suppliers, and warehouse teams the same operational record with role-aware access and approval trails.</p><button type="button" className="meridian-pill meridian-pill--blue" onClick={handleDemo}>Talk to sales <ChevronRightIcon size="xs" /></button></div><div className="meridian-relief-art"><div className="meridian-relief-image"><StockSnapshot /></div><div className="meridian-money-chip meridian-money-chip--one"><b>Example receipt</b><small>receiving record</small></div><div className="meridian-money-chip meridian-money-chip--two"><b>Dispatch <ChevronRightIcon size="xs" /> Receive</b><small>approval recorded</small></div></div></section>

    <section id="enterprise" className="meridian-section meridian-enterprise meridian-reveal"><div className="meridian-heading-block"><p className="meridian-overline">READY FOR THE REAL OPERATION</p><h2>Clear boundaries.<br /><span>Clearer handoffs.</span></h2><p>Stocky makes the operating model visible before a rollout starts: who owns the work, which location can see it, and what needs approval.</p></div><div className="meridian-enterprise-grid">{enterpriseSignals.map(([title, body]) => <article key={title}><CheckCircleIcon size="sm" /><div><h3>{title}</h3><p>{body}</p></div></article>)}</div></section>

    <section className="meridian-section meridian-differentiators meridian-reveal"><div className="meridian-heading-block meridian-heading-block--center"><p className="meridian-overline">WHY STOCKY</p><h2>Operational detail<br /><span>without the detour.</span></h2></div><div className="meridian-differentiator-grid">{differentiators.map(([title, body]) => <article key={title}><strong>{title}</strong><p>{body}</p></article>)}</div></section>

    <section id="pricing" className="meridian-section meridian-calculator meridian-reveal"><div className="meridian-heading-block"><p className="meridian-overline">CLEAR COMMERCIAL TERMS</p><h2>Start small.<br /><span>Scale with the operation.</span></h2><p>Use the calculator as an illustrative planning aid. Final pricing depends on locations, users, integrations, and implementation scope.</p><button type="button" className="meridian-pill meridian-pill--blue" onClick={handleDemo}>Request a demo <ChevronRightIcon size="xs" /></button></div><div className="meridian-calculator-card"><div className="meridian-calculator-top" aria-live="polite"><div><small>LOCATIONS IN YOUR OPERATION</small><strong>{locations}</strong></div><div><small>EXAMPLE STOCK POSITIONS</small><strong>{locations * 248}</strong><span>at 248 positions/location</span></div></div><label className="meridian-calculator-label" htmlFor="location-count">Planning range</label><input id="location-count" type="range" min="1" max="100" value={locations} onChange={(event) => setLocations(Number(event.target.value))} aria-label="Number of locations" aria-valuetext={`${locations} locations and ${locations * 248} example stock positions`} /><div className="meridian-calculator-labels"><span>1 location</span><span>100 locations</span></div><div className="meridian-compare-list"><div><span><i className="is-stocky" />Starter</span><b>1–3 locations</b><em>Quote</em></div><div><span><i />Growth</span><b>4–25 locations</b><em>Quote</em></div><div><span><i />Enterprise</span><b>26+ locations</b><em>Custom</em></div></div></div></section>

    <section className="meridian-section meridian-results meridian-reveal"><div className="meridian-heading-block meridian-heading-block--center"><p className="meridian-overline">OPERATIONAL COVERAGE</p><h2>Built around the work<br /><span>teams actually do.</span></h2></div><div className="meridian-results-grid"><article><div className="meridian-result-art meridian-result-art--one"><BoxesIcon size="md" /></div><strong>Receive</strong><p>Verify purchase orders, lots, quantities, and putaway destinations.</p></article><article><div className="meridian-result-art meridian-result-art--two"><ArrowUpDownIcon size="md" /></div><strong>Move</strong><p>Request, approve, pick, dispatch, and receive inter-branch transfers.</p></article><article><div className="meridian-result-art meridian-result-art--three"><TruckIcon size="md" /></div><strong>Replenish</strong><p>Use reorder points, expiry attention, and supplier follow-through to plan the next action.</p></article></div></section>

    <section id="faq" className="meridian-section meridian-faq meridian-reveal"><div className="meridian-faq-heading"><p className="meridian-overline">QUESTIONS, RESOLVED</p><h2>Everything you need<br /><span>in one place.</span></h2><button type="button" className="meridian-pill meridian-pill--lime" onClick={() => authStatus === 'checking' ? undefined : isAuthenticated ? navigateToWorkspace(nextDestination) : handleAuth(nextDestination)}>{authStatus === 'checking' ? 'Checking session…' : loading ? 'Opening…' : isAuthenticated ? 'Open Workspace' : 'Get Started Free'} <ChevronRightIcon size="xs" /></button></div><div className="meridian-faq-list">{faqs.map(([question, answer], index) => { const answerId = `faq-answer-${index}`; return <div className={`meridian-faq-item ${openFaq === index ? 'is-open' : ''}`} key={question}><button id={`faq-question-${index}`} type="button" aria-expanded={openFaq === index} aria-controls={answerId} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><PlusIcon size="xs" aria-hidden="true" /></button><div id={answerId} role="region" aria-labelledby={`faq-question-${index}`}><p>{answer}</p></div></div>; })}</div></section>

    {authError && <div className="meridian-auth-error" role="alert">{authError}</div>}
    <section className="meridian-final-cta meridian-reveal"><p className="meridian-overline">BUILT FOR THE WORK THAT MATTERS</p><h2>Make every location<br /><span>feel accountable.</span></h2><div className="meridian-final-actions"><button type="button" className="meridian-pill meridian-pill--blue" onClick={() => authStatus === 'checking' ? undefined : isAuthenticated ? navigateToWorkspace(nextDestination) : handleAuth(nextDestination)}>{authStatus === 'checking' ? 'Checking session…' : loading ? 'Opening workspace…' : isAuthenticated ? 'Open Workspace' : 'Get Started Free'}<ChevronRightIcon size="xs" /></button><button type="button" className="meridian-text-button" onClick={handleDemo}>Request enterprise demo</button></div></section>
    <footer className="meridian-footer"><a href="#top" className="meridian-brand"><span className="meridian-brand-mark"><StockyLogoIcon size="sm" /></span><span>stocky</span></a><span>Inventory operations for distributed teams. Operated by Overted Technologies.</span><div><a href="#product">Product</a><a href="#workflow">Workflow</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a href="/legal#privacy">Privacy</a><a href="/legal#terms">Terms</a><a href="/legal#security">Security</a><a href="mailto:sales@stocky.example">Contact sales</a></div></footer>
  </main>;
}
