// File length exception: Single-page component containing complete SVG assets, GSAP ScrollTrigger timeline, and layout per Implementation Plan §1.3 (rule of three).
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./LandingPage.css";

// Register ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

export const LandingPage: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const trailTrackRef = useRef<HTMLDivElement | null>(null);
  const dealCardRef = useRef<HTMLDivElement | null>(null);
  const trailFillRef = useRef<HTMLDivElement | null>(null);
  const dealStatusRef = useRef<HTMLDivElement | null>(null);
  const stagesRef = useRef<(HTMLDivElement | null)[]>([]);

  const [noMotion] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    // Nav scroll handler
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle("scrolled", window.scrollY > 20);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Check prefers-reduced-motion
    if (noMotion) {
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }

    if (!rootRef.current) {
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }

    let ctx: gsap.Context | null = null;

    try {
      // GSAP context for proper cleanup on unmount
      ctx = gsap.context(() => {
        // Hero entrance animations
        gsap.fromTo(
          ".hero .eyebrow, .hero h1, .hero .sub, .hero-ctas",
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.08,
            clearProps: "all"
          }
        );

        gsap.fromTo(
          "[data-reveal].hero-visual",
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: 0.25,
            ease: "power3.out",
            clearProps: "all"
          }
        );

        // Feature cards scroll reveal
        gsap.to(".feature-card", {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: ".feature-grid",
            start: "top 82%"
          }
        });

        // Quote cards scroll reveal
        gsap.to(".quote-card", {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: ".quote-grid",
            start: "top 85%"
          }
        });

        // Dashboard preview scale-in
        gsap.to(".dash-visual", {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".dash-visual",
            start: "top 80%"
          }
        });

        // Signature Pipeline Trail Section (pinned + scrubbed)
        const track = trailTrackRef.current;
        const card = dealCardRef.current;
        const fill = trailFillRef.current;
        const statusEl = dealStatusRef.current;
        const stageEls = stagesRef.current.filter(Boolean);
        const labels = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won"];

        if (track && card && fill && statusEl && stageEls.length === 6) {
          const layoutStages = () => {
            if (!track) return 0;
            const w = track.offsetWidth || 800;
            stageEls.forEach((s, i) => {
              if (s) {
                const x = (w / (stageEls.length - 1)) * i;
                s.style.left = `${x}px`;
              }
            });
            return w;
          };

          let trackWidth = layoutStages();

          const handleResize = () => {
            trackWidth = layoutStages();
          };
          window.addEventListener("resize", handleResize);

          gsap.set(card, { left: 0 });

          ScrollTrigger.create({
            trigger: ".trail-section",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            pin: ".trail-pin",
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh() {
              trackWidth = layoutStages();
            },
            onUpdate(self) {
              const progress = self.progress; // 0 -> 1 across pinned scroll range
              const activeIndex = Math.round(progress * (stageEls.length - 1));
              if (card) card.style.left = `${trackWidth * progress}px`;
              if (fill) fill.style.width = `${progress * 100}%`;

              stageEls.forEach((st, j) => {
                if (st) {
                  st.classList.toggle("active", j <= activeIndex);
                }
              });

              if (statusEl) statusEl.textContent = labels[activeIndex] || "New";
              if (card) card.classList.toggle("is-won", activeIndex === stageEls.length - 1);
            }
          });
        }
      }, rootRef.current || undefined);
    } catch (err) {
      console.warn("GSAP animation initialization warning:", err);
    }

    // Cleanup function: revert all GSAP context and remove event listeners
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (ctx) ctx.revert();
    };
  }, [noMotion]);

  return (
    <div ref={rootRef} className={`landing-page-root ${noMotion ? "no-motion" : ""}`}>
      <nav id="nav" ref={navRef}>
        <div className="logo">
          <svg className="logo-mark" viewBox="0 0 24 24" fill="none">
            <path d="M2 19L9 6L13 14L16 9L22 19H2Z" fill="#2E5BFF" />
          </svg>
          Ridgeline
        </div>
        <div className="nav-links">
          <a href="#features">Product</a>
          <a href="#trail">Pipeline</a>
          <a href="#dashboard">Dashboard</a>
        </div>
        <div className="nav-cta">
          <Link to="/login" className="btn btn-ghost">
            Log in
          </Link>
          <Link to="/login" className="btn btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div
          className="wrap"
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div className="eyebrow">
            <span className="dot"></span>Built for B2B sales teams
          </div>
          <h1>
            Every deal, <em>moving forward.</em>
          </h1>
          <p className="sub">
            Ridgeline replaces the spreadsheet with one clear path from first contact to closed deal
            — so nothing stalls, and nothing gets lost.
          </p>
          <div className="hero-ctas">
            <a href="#trail" className="btn btn-signal btn-lg">
              See the pipeline
            </a>
            <Link
              to="/login"
              className="btn btn-ghost btn-lg"
              style={{ border: "1px solid var(--line)" }}
            >
              Get started
            </Link>
          </div>

          <div className="hero-visual" data-reveal>
            <div className="device-frame">
              <div className="device-bar">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="device-grid">
                <div className="panel">
                  <div className="panel-label">My leads</div>
                  <div className="lead-row">
                    <span>Acme Robotics</span>
                    <span className="tag tag-new">New</span>
                  </div>
                  <div className="lead-row">
                    <span>Fenwick &amp; Ives</span>
                    <span className="tag tag-qualified">Qualified</span>
                  </div>
                  <div className="lead-row">
                    <span>Harlow Freight</span>
                    <span className="tag tag-won">Won</span>
                  </div>
                </div>
                <div className="panel stat-block">
                  <div>
                    <div className="panel-label">Open pipeline</div>
                    <div className="stat-num mono">$186,400</div>
                    <div className="stat-cap">Across 14 opportunities</div>
                  </div>
                  <div>
                    <div className="panel-label">Follow-ups due</div>
                    <div className="stat-num mono">3</div>
                    <div className="stat-cap">Today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">
              <span className="dot"></span>How it works
            </div>
            <h2>Three habits replace the spreadsheet.</h2>
            <p>
              Nothing exotic — just the parts of a sales process that actually break when they live
              in a dozen tabs.
            </p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5z"
                    stroke="#2E5BFF"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="#2E5BFF"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Capture leads the moment they land</h3>
              <p>
                Every lead gets a company, a source, and an owner from the first second — no more
                &quot;whose lead was this?&quot; three weeks later.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12h16M14 6l6 6-6 6"
                    stroke="#2E5BFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Move deals forward, one stage at a time</h3>
              <p>
                Six stages, one direction. A deal can&apos;t quietly skip ahead or slip backward
                without someone noticing.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#2E5BFF" strokeWidth="1.6" />
                  <path
                    d="M12 7v5l3.5 2"
                    stroke="#2E5BFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Never miss a follow-up</h3>
              <p>
                Every call and note gets logged against the customer, with a next date — so
                &quot;I&apos;ll circle back&quot; actually happens.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="trail-section" id="trail">
        <div className="trail-pin">
          <div className="trail-head">
            <div className="eyebrow" style={{ margin: "0 auto 18px", width: "fit-content" }}>
              <span className="dot"></span>The Ridgeline path
            </div>
            <h2>Watch a deal climb the ridge.</h2>
            <p>
              Every opportunity follows the same six-stage trail. Scroll to see one make the climb.
            </p>
          </div>
          <div className="trail-track" id="trailTrack" ref={trailTrackRef}>
            <div className="deal-card" id="dealCard" ref={dealCardRef}>
              <div className="name">Acme Robotics</div>
              <div className="value mono">$42,000</div>
              <div className="status" id="dealStatus" ref={dealStatusRef}>
                New
              </div>
            </div>
            <div className="trail-line">
              <div className="trail-line-fill" id="trailFill" ref={trailFillRef}></div>
            </div>
            <div
              className="stage"
              data-x="0"
              ref={(el) => {
                stagesRef.current[0] = el;
              }}
            >
              <div className="stage-dot"></div>
              <div className="stage-label">New</div>
            </div>
            <div
              className="stage"
              data-x="1"
              ref={(el) => {
                stagesRef.current[1] = el;
              }}
            >
              <div className="stage-dot"></div>
              <div className="stage-label">Contacted</div>
            </div>
            <div
              className="stage"
              data-x="2"
              ref={(el) => {
                stagesRef.current[2] = el;
              }}
            >
              <div className="stage-dot"></div>
              <div className="stage-label">Qualified</div>
            </div>
            <div
              className="stage"
              data-x="3"
              ref={(el) => {
                stagesRef.current[3] = el;
              }}
            >
              <div className="stage-dot"></div>
              <div className="stage-label">Proposal</div>
            </div>
            <div
              className="stage"
              data-x="4"
              ref={(el) => {
                stagesRef.current[4] = el;
              }}
            >
              <div className="stage-dot"></div>
              <div className="stage-label">Negotiation</div>
            </div>
            <div
              className="stage won"
              data-x="5"
              ref={(el) => {
                stagesRef.current[5] = el;
              }}
            >
              <div className="stage-dot"></div>
              <div className="stage-label">Won</div>
            </div>
          </div>
        </div>
      </section>

      <section className="dash-section" id="dashboard">
        <div className="wrap dash-flex">
          <div className="dash-copy">
            <div className="eyebrow">
              <span className="dot"></span>For managers
            </div>
            <h2>Know your pipeline&apos;s health at a glance.</h2>
            <p>
              One screen answers the question every Monday standup starts with: where do we actually
              stand?
            </p>
            <div className="dash-list">
              <div className="dash-list-item">
                <span className="check">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#fff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Total pipeline value, updated the moment a stage changes
              </div>
              <div className="dash-list-item">
                <span className="check">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#fff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Win rate for the current month, no spreadsheet math
              </div>
              <div className="dash-list-item">
                <span className="check">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#fff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                A per-rep breakdown, so coaching conversations start with facts
              </div>
            </div>
          </div>
          <div className="dash-visual" data-reveal>
            <div className="dash-card">
              <div className="dash-topbar">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="dash-inner">
                <div className="dash-grid">
                  <div className="kpi">
                    <div className="num mono">$482,300</div>
                    <div className="cap">Open pipeline value</div>
                  </div>
                  <div className="kpi">
                    <div className="num mono delta">38%</div>
                    <div className="cap">Win rate — this month</div>
                  </div>
                  <div className="kpi">
                    <div className="num mono">6</div>
                    <div className="cap">Follow-ups due today</div>
                  </div>
                </div>
                <div className="rep-table">
                  <div className="rep-row">
                    <span className="name">Priya Shah</span>
                    <span className="val mono">$142,000 open</span>
                  </div>
                  <div className="rep-row">
                    <span className="name">Diego Marín</span>
                    <span className="val mono">$98,500 open</span>
                  </div>
                  <div className="rep-row">
                    <span className="name">Wei Chen</span>
                    <span className="val mono">$74,900 open</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="quotes">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">
              <span className="dot"></span>Built for teams like yours
            </div>
            <h2>What changes in the first week</h2>
          </div>
          <div className="quote-grid">
            <div className="quote-card">
              <p>
                &quot;We stopped losing leads between the inbox and the spreadsheet. Everything
                just... lives in one place now.&quot;
              </p>
              <div className="quote-who">
                <b>Sales Manager</b> — mid-size industrial distributor
              </div>
            </div>
            <div className="quote-card">
              <p>
                &quot;I can see exactly which reps need help without asking anyone to update a
                status column.&quot;
              </p>
              <div className="quote-who">
                <b>Head of Sales</b> — B2B logistics company
              </div>
            </div>
            <div className="quote-card">
              <p>
                &quot;The stage rules sound small, but they&apos;re the reason our pipeline number
                is finally trustworthy.&quot;
              </p>
              <div className="quote-who">
                <b>Sales Representative</b> — SaaS reseller
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta wrap" style={{ maxWidth: "none" }}>
        <h2>Stop losing deals to a spreadsheet.</h2>
        <p>Set up your pipeline in a few minutes — no credit card, no import headaches.</p>
        <Link to="/login" className="btn btn-signal">
          Get started free
        </Link>
      </section>

      <footer>
        <div className="wrap footer-flex">
          <div className="logo">
            <svg className="logo-mark" viewBox="0 0 24 24" fill="none">
              <path d="M2 19L9 6L13 14L16 9L22 19H2Z" fill="#2E5BFF" />
            </svg>
            Ridgeline
          </div>
          <div className="footer-links">
            <a href="#features">Product</a>
            <a href="#trail">Pipeline</a>
            <a href="#dashboard">Dashboard</a>
            <Link to="/login">Log in</Link>
          </div>
        </div>
        <div className="wrap footer-fine">
          Ridgeline is a demo product built for a CRM engineering case study — the design and copy
          above are illustrative, not a live product.
        </div>
      </footer>
    </div>
  );
};
