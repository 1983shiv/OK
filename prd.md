# OptionKart — Product Requirements Document (PRD)

**Version:** 2.0  
**Last Updated:** April 19, 2026  
**Status:** Execution-Ready  
**Author:** Product & Engineering  
**Confidentiality:** Internal — Founders, Engineering, Design, Investors

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Context & Opportunity](#2-market-context--opportunity)
3. [Product Vision & Strategy](#3-product-vision--strategy)
4. [Target Users & Personas](#4-target-users--personas)
5. [Core Value Proposition](#5-core-value-proposition)
6. [Development Stages — Deep Feature Expansion](#6-development-stages--deep-feature-expansion)
7. [Technical Architecture](#7-technical-architecture)
8. [AI Integration Strategy](#8-ai-integration-strategy)
9. [Monetization & Pricing Strategy](#9-monetization--pricing-strategy)
10. [Payment Integration (Razorpay)](#10-payment-integration-razorpay)
11. [Security & Compliance](#11-security--compliance)
12. [Analytics & Tracking](#12-analytics--tracking)
13. [Go-To-Market Strategy](#13-go-to-market-strategy)
14. [Competitive Positioning](#14-competitive-positioning)
15. [Execution Roadmap](#15-execution-roadmap)
16. [Team & Resource Requirements](#16-team--resource-requirements)
17. [Risks & Mitigation](#17-risks--mitigation)
18. [Appendix](#18-appendix)

---

# 1. Executive Summary

**OptionKart** is a web-based options trading analytics platform built for Indian retail traders. It transforms raw F&O data from NSE (via the Upstox API) into actionable, beginner-friendly signals, insights, and visualisations.

### The Problem

- **91% of retail F&O traders in India lost money in FY25** (SEBI study), with aggregate losses of ₹1.06 lakh crore.
- Existing tools (Sensibull, Opstra) are either too simplistic for serious analysis or too complex for beginners.
- No tool effectively bridges the gap between "raw options chain data" and "what should I actually do?"
- Retail traders spend hours manually interpreting OI data, IV skews, and PCR — and still make bad trades.

### The Solution

OptionKart converts complex options data into **plain-English signals and visual insights**. Think of it as "Google Maps for options trading" — you don't need to understand GPS coordinates to get where you're going.

### Key Differentiators

| Dimension         | Sensibull         | Opstra                   | OptionKart                        |
| ----------------- | ----------------- | ------------------------ | --------------------------------- |
| Primary audience  | Beginner          | Advanced                 | **Both** (progressive disclosure) |
| Core philosophy   | Strategy-first    | Analytics-first          | **Insight-first**                 |
| AI integration    | None              | None                     | **Native AI (GPT-powered)**       |
| Pricing entry     | ₹800+/mo\*        | ₹1,300+/mo               | **Free tier + ₹199/mo**           |
| UX approach       | Clean but limited | Data-heavy, overwhelming | **Signal-driven, progressive**    |
| Mobile experience | Adequate          | Poor                     | **Mobile-first design**           |

_\*Sensibull free tier available via Zerodha but severely limited_

### Business Model

Freemium SaaS with subscription tiers (₹0 / ₹199 / ₹499 / ₹999 per month), supplemented by broker affiliate revenue and future API monetisation.

### Tech Stack

| Layer           | Technology                         | Rationale                                                        |
| --------------- | ---------------------------------- | ---------------------------------------------------------------- |
| Frontend        | Next.js 16+ (App Router) on Vercel | SSR for SEO, Edge Functions, instant deployments                 |
| Backend         | Node.js with NestJS                | Modular architecture, TypeScript-native, excellent for real-time |
| Real-time Cache | Redis (Upstash or self-hosted)     | Sub-ms latency for live market data                              |
| Primary DB      | PostgreSQL (Neon)                  | Relational integrity for users, subscriptions, financial data    |
| Document Store  | MongoDB Atlas                      | Flexible schema for market snapshots, OI history                 |
| Queue           | BullMQ (Redis-backed)              | Job scheduling, data pipeline orchestration                      |
| Data Source     | Upstox API v2 + WebSocket V3       | Free, reliable, good documentation                               |
| Payments        | Razorpay Subscriptions API         | UPI, cards, wallets — native India support                       |
| AI              | OpenAI API (GPT-4o-mini primary)   | Cost-effective, fast, good enough for insights                   |
| Hosting         | Vercel (FE) + Railway/Render (BE)  | Cost-effective, scales with demand                               |
| Monitoring      | Sentry + Uptime Robot              | Error tracking + uptime monitoring                               |

---

# 2. Market Context & Opportunity

## 2.1 Market Size

| Metric                                                      | Value                          | Source              |
| ----------------------------------------------------------- | ------------------------------ | ------------------- |
| Active F&O participants (Feb 2026)                          | ~38.9 lakh (3.89M) individuals | BusinessWorld / NSE |
| Total individual investors in equity derivatives (FY26 YTD) | 83.6 lakh (8.36M)              | NSE Data            |
| Retail share of options premium paid                        | 39.1% (Sep 2025)               | Rediff / NSE        |
| YoY growth in F&O participation (FY19→FY26)                 | ~12x (7.1L → 83.6L)            | NSE                 |
| Algorithmic trading penetration in F&O                      | 67%                            | ScanX               |

## 2.2 The Pain Point (Quantified)

- **91% of retail traders lost money** in FY25 F&O trading
- Average loss per trader: **₹1.1 lakh/year**
- Aggregate retail losses: **₹1.06 lakh crore** in FY25 (up 41% from FY24)
- Primary cause: Information asymmetry, emotional trading, lack of structured analysis tools

## 2.3 Regulatory Landscape

SEBI has been tightening F&O regulations since Nov 2024:

- Increased minimum contract sizes
- Rationalized weekly expiries (fewer expiry days)
- Stricter position limits
- Higher margin requirements

**Implication for OptionKart:** With fewer but larger trades, traders need _better_ analysis tools, not more. This is a tailwind for analytics platforms.

## 2.4 Serviceable Addressable Market (SAM)

| Segment                                      | Size        | Willingness to pay | Revenue potential  |
| -------------------------------------------- | ----------- | ------------------ | ------------------ |
| Active options traders needing analytics     | ~15-20 lakh | ₹200-1,000/mo      | ₹300-2,000 Cr/year |
| Beginner traders needing education + signals | ~30-40 lakh | ₹0-199/mo          | ₹72-960 Cr/year    |
| Algo traders needing API access              | ~1-2 lakh   | ₹999-2,999/mo      | ₹12-72 Cr/year     |

**Target:** Capture 0.1% of active traders in Year 1 = ~4,000 paying users × ₹350 ARPU = **₹16.8 lakh MRR (~₹2 Cr ARR)**

---

# 3. Product Vision & Strategy

## 3.1 Vision Statement

> **Make every retail trader in India trade options with the confidence of an institutional desk — through data-driven insights, not gut feelings.**

## 3.2 Strategic Pillars

```
┌─────────────────────────────────────────────────────────┐
│                    OPTIONKART STRATEGY                  │
├─────────────┬──────────────┬──────────────┬─────────────┤
│  SIMPLIFY   │   SIGNAL     │   EDUCATE    │   SCALE     │
│             │              │              │             │
│ Convert raw │ Turn data    │ Help users   │ Build       │
│ data into   │ into yes/no  │ understand   │ platform    │
│ visual      │ actionable   │ WHY, not     │ effects via │
│ clarity     │ signals      │ just WHAT    │ community   │
└─────────────┴──────────────┴──────────────┴─────────────┘
```

## 3.3 Product Principles

1. **Insight over Information** — Never show raw data without context. Every number should answer "so what?"
2. **Progressive Disclosure** — Beginners see signals; advanced users can drill into the data
3. **Speed is a Feature** — Dashboard must load in <2s; data refresh <5s
4. **Mobile-First, Desktop-Rich** — Design for phone traders first (70%+ of Indian retail)
5. **Trust Through Transparency** — Always show data source, last updated time, and confidence levels
6. **No Financial Advice** — We provide data analytics, not buy/sell recommendations

---

# 4. Target Users & Personas

## 4.1 Persona: Rahul — The Beginner (Primary)

| Attribute          | Detail                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| Age                | 22-30                                                                  |
| Experience         | 0-6 months in F&O                                                      |
| Trading capital    | ₹50K-2L                                                                |
| Current tools      | Zerodha Kite, YouTube, Telegram groups                                 |
| Pain points        | Doesn't understand OI, confused by options chain, follows tips blindly |
| What he wants      | "Just tell me if market is bullish or bearish today"                   |
| Device             | Mobile (95% of time)                                                   |
| Willingness to pay | ₹0 initially, ₹199/mo after seeing value                               |

**User Story:** _"As a beginner trader, I want to see a simple bullish/bearish signal for Nifty so that I don't have to spend 30 minutes analysing the options chain."_

## 4.2 Persona: Priya — The Active Trader (Secondary)

| Attribute          | Detail                                                    |
| ------------------ | --------------------------------------------------------- |
| Age                | 28-40                                                     |
| Experience         | 1-3 years in F&O                                          |
| Trading capital    | ₹5L-20L                                                   |
| Current tools      | Sensibull, Opstra, TradingView                            |
| Pain points        | Pays ₹1,300/mo for Opstra but doesn't use 70% of features |
| What she wants     | OI analysis, PCR trends, strike-level data, alerts        |
| Device             | Desktop (trading hours), Mobile (checking)                |
| Willingness to pay | ₹499/mo for the right tool                                |

**User Story:** _"As an active trader, I want to track OI changes in real-time on specific strikes so that I can spot institutional activity and adjust my positions quickly."_

## 4.3 Persona: Vikram — The Algo Trader (Tertiary — Future)

| Attribute          | Detail                                               |
| ------------------ | ---------------------------------------------------- |
| Age                | 25-35                                                |
| Experience         | 3+ years, knows Python                               |
| Trading capital    | ₹20L+                                                |
| Current tools      | Custom scripts, Zerodha API                          |
| Pain points        | Building his own analytics is time-consuming         |
| What he wants      | API access to processed OI data, signals via webhook |
| Willingness to pay | ₹999-2,999/mo                                        |

---

# 5. Core Value Proposition

## 5.1 Value Ladder

```
Level 1: SEE THE DATA          → Options chain, OI data, PCR (Free)
Level 2: UNDERSTAND THE DATA   → Visual trends, heatmaps, comparisons (Free/Paid)
Level 3: ACT ON THE DATA       → Signals, alerts, strategy suggestions (Paid)
Level 4: LEARN FROM THE DATA   → AI insights, explanations, education (Paid)
Level 5: AUTOMATE WITH DATA    → API access, webhook alerts, backtesting (Premium)
```

## 5.2 Core Features Mapped to Value

| Feature            | User Pain                       | OptionKart Solution                           | Value Level |
| ------------------ | ------------------------------- | --------------------------------------------- | ----------- |
| Signal Dashboard   | "Is market bullish or bearish?" | PCR-based + OI-based sentiment signal         | 3           |
| OI Heatmap         | "Where is money flowing?"       | Visual heatmap of OI build-up/unwinding       | 2           |
| Strike Scanner     | "Which strikes are active?"     | Top OI gainers/losers with context            | 2           |
| Smart Alerts       | "I miss big moves"              | Push/email alerts on OI spikes, PCR shifts    | 3           |
| AI Chat            | "I don't understand this data"  | Ask questions, get plain-English explanations | 4           |
| Strategy Suggester | "What should I trade?"          | AI-powered strategy based on current data     | 4           |
| Backtesting        | "Would this have worked?"       | Test strategies on historical data            | 5           |

---

# 6. Development Stages — Deep Feature Expansion

---

## 🟢 STAGE 1 — MVP (Weeks 1-2)

### Goal

Ship a **publicly accessible, no-login-required** dashboard that proves demand. Validate: Does anyone care about OI data presented simply?

### Features

#### 6.1.1 Market Sentiment Dashboard

**What it shows:**

- Nifty 50 and Bank Nifty current spot price + change
- Overall Sentiment Signal: 🟢 BULLISH / 🟡 NEUTRAL / 🔴 BEARISH (derived from PCR + OI analysis)
- Put-Call Ratio (PCR) with visual gauge
- Total Call OI vs Total Put OI (bar chart)
- Max Pain strike price
- Nifty/BankNifty ATM (At The Money) strike OI details

**User Flow:**

```
User opens optionkart.com
     │
     ▼
Landing page with value prop + CTA "View Live Dashboard"
     │
     ▼
Dashboard loads (no login needed)
     │
     ├─ Default view: Nifty 50
     ├─ Toggle: Bank Nifty
     │
     ▼
User sees:
  ┌─────────────────────────────────────┐
  │  🟢 BULLISH  │  PCR: 1.23          │
  │  Nifty: 24,580 (+0.45%)            │
  ├─────────────────────────────────────┤
  │  Call OI: 12.5Cr  │  Put OI: 15.4Cr│
  │  [========█████████████]            │
  ├─────────────────────────────────────┤
  │  Max Pain: 24,500                   │
  │  ATM Strike: 24,600                 │
  ├─────────────────────────────────────┤
  │  Top OI Build-up (Calls):          │
  │  24,700 CE: +5.2L  ▲               │
  │  24,800 CE: +3.1L  ▲               │
  ├─────────────────────────────────────┤
  │  Top OI Build-up (Puts):           │
  │  24,400 PE: +4.8L  ▲               │
  │  24,300 PE: +2.9L  ▲               │
  └─────────────────────────────────────┘

Auto-refresh every 3 minutes during market hours (9:15 AM - 3:30 PM IST)
```

**Edge Cases:**
| Scenario | Handling |
|----------|----------|
| Market closed (before 9:15 AM / after 3:30 PM) | Show last available data with "Market Closed" badge + countdown to next open |
| Upstox API down | Show cached data with "Data delayed" warning + timestamp of last fetch |
| Expiry day (Thursday) | Highlight it's expiry day; show both current and next expiry data |
| Zero OI on a strike | Skip from top movers; don't show empty rows |
| Public holiday | Show "Market Holiday" banner with reason |
| User on slow 3G | Progressive loading — show sentiment first (small payload), then details |

**API Requirements (Backend → Upstox):**

| Endpoint                  | Method | Purpose                                      | Frequency   |
| ------------------------- | ------ | -------------------------------------------- | ----------- |
| `/v2/option/chain`        | GET    | Fetch full options chain for Nifty/BankNifty | Every 3 min |
| `/v2/market-quote/quotes` | GET    | Current spot price                           | Every 1 min |
| WebSocket V3 (protobuf)   | Stream | Real-time price ticks (future optimisation)  | Continuous  |

**Data Requirements:**

- Nifty 50 & Bank Nifty options chain data (all strikes for current + next expiry)
- Fields needed per strike: `strike_price`, `call_oi`, `put_oi`, `call_oi_change`, `put_oi_change`, `call_ltp`, `put_ltp`, `call_volume`, `put_volume`, `call_iv`, `put_iv`
- Spot price: `last_price`, `net_change`, `percent_change`

**UI/UX Expectations:**

- **Mobile-first** responsive layout (single column on mobile, 2-column on desktop)
- Dark theme by default (traders prefer dark mode) with light mode toggle
- Large, readable sentiment signal (the first thing you see)
- Color coding: Green (bullish signals), Red (bearish signals), Amber (neutral)
- Minimal chrome — no unnecessary navigation, no footer clutter
- Loading skeleton while data fetches
- Last updated timestamp visible at all times
- **Page load target: <2 seconds on 4G**

**Tech Implementation Notes:**

- Server-side render the initial dashboard with ISR (Incremental Static Regeneration) or SSR
- Client-side polling every 3 minutes with `SWR` or `React Query`
- Cache Upstox responses in Redis with 60-second TTL
- Calculate PCR, Max Pain, and sentiment signals on the backend (not client)

#### 6.1.2 Basic Options Chain Table

**What it shows:**

- Simplified options chain (not the full NSE table)
- Columns: Strike | Call OI | Call OI Chg | Call LTP | Put LTP | Put OI Chg | Put OI
- ATM strike highlighted
- Color-coded OI changes (green for build-up, red for unwinding)
- Scrollable, with ATM strike centered by default

**Edge Cases:**

- Far OTM strikes with negligible OI → collapse into "Other strikes" section
- Show only ±10 strikes from ATM by default, expandable

#### 6.1.3 SEO Landing Page

**Purpose:** Capture organic traffic from traders searching for options analysis tools

**Target Keywords:**

- "nifty option chain analysis"
- "nifty PCR live"
- "bank nifty OI data"
- "options trading tools india"
- "best options analysis platform india"

**Page Structure:**

```
Hero: "Stop Guessing. Start Trading with Data."
  └─ CTA: "View Live Dashboard — Free"

Section: What You Get
  └─ 3 feature cards with screenshots

Section: How It Works
  └─ 3-step visual (Open → Read Signal → Trade)

Section: Who It's For
  └─ Beginner & Active trader descriptions

Section: FAQ
  └─ 5-7 common questions (SEO-rich)

Footer: Disclaimer, Links
```

### MVP Monetization

- **100% Free** — Zero friction, no login walls
- No ads, no paywalls
- Goal: accumulate users and validate engagement metrics

### MVP Success Criteria (Week 2 Check)

| Metric                 | Target                | How to Measure               |
| ---------------------- | --------------------- | ---------------------------- |
| Unique visitors        | 500+ in first 2 weeks | Google Analytics / Plausible |
| Return visitors        | 20%+                  | GA returning users           |
| Avg. session duration  | >2 minutes            | GA                           |
| Dashboard views        | 1,000+                | Custom event tracking        |
| Social shares/mentions | Any organic mentions  | Twitter/Telegram monitoring  |

---

## 🟡 STAGE 2 — Early Product (Weeks 3-8)

### Goal

Add authentication, personalisation, and the first paywalled features. Start capturing emails for future conversion.

### Features

#### 6.2.1 Authentication System

**Implementation:**

- **Magic Link (Email OTP)** — Primary (no password friction)
- **Google OAuth** — Secondary (one-tap sign-in)
- No username/password — reduce friction to absolute minimum

**User Flow:**

```
User clicks "Sign In" or hits a paywalled feature
     │
     ▼
Modal appears:
  ┌──────────────────────────────┐
  │  Sign in to OptionKart       │
  │                              │
  │  [Email address      ]       │
  │  [Send Magic Link]          │
  │                              │
  │  ──── or ────                │
  │                              │
  │  [🔵 Continue with Google]   │
  └──────────────────────────────┘
     │
     ├─ Magic Link: Email sent → User clicks link → Logged in
     └─ Google: OAuth flow → Logged in
     │
     ▼
Redirect back to previous page with user context loaded
```

**Edge Cases:**
| Scenario | Handling |
|----------|----------|
| Magic link expired (>15 min) | Show "Link expired" page with "Resend" button |
| User signs up with Google, later tries magic link with same email | Merge accounts automatically |
| User already logged in on another tab | Sync session via cookie; avoid double auth |
| Rate limiting | Max 3 magic link requests per email per 10 minutes |
| Disposable email addresses | Allow for now; flag for review if abuse detected |

**Data Model (PostgreSQL):**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  auth_provider ENUM('magic_link', 'google') NOT NULL,
  google_id VARCHAR(255),
  plan ENUM('free', 'starter', 'pro', 'elite') DEFAULT 'free',
  subscription_id VARCHAR(255), -- Razorpay subscription ID
  subscription_status ENUM('active', 'paused', 'cancelled', 'expired') DEFAULT NULL,
  ai_credits_remaining INT DEFAULT 5, -- Daily AI query limit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);
```

#### 6.2.2 Personalised Watchlist

**What it does:**

- User can "favourite" specific strikes (e.g., Nifty 24,500 CE)
- Watchlist persists across sessions
- Shows real-time OI changes, LTP, IV for watched strikes
- Maximum 10 strikes on free plan, 50 on paid

**User Flow:**

```
On Options Chain table:
  User clicks ⭐ next to a strike
     │
     ▼
  Strike added to watchlist (instant, no page reload)
     │
     ▼
  Watchlist accessible via bottom tab (mobile) or sidebar (desktop)
     │
     ▼
  Watchlist view:
  ┌─────────────────────────────────────────┐
  │  ⭐ My Watchlist (3/10 free)            │
  ├─────────────────────────────────────────┤
  │  Nifty 24,500 CE  │ OI: 15.2L (+2.1L) │
  │  Nifty 24,600 PE  │ OI: 8.7L  (-1.3L) │
  │  BN 52,000 CE     │ OI: 5.4L  (+0.8L) │
  ├─────────────────────────────────────────┤
  │  [Upgrade for 50 strikes →]             │
  └─────────────────────────────────────────┘
```

**Data Model (PostgreSQL):**

```sql
CREATE TABLE watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  instrument_key VARCHAR(255) NOT NULL, -- Upstox instrument key
  symbol VARCHAR(50) NOT NULL, -- e.g., "NIFTY"
  strike_price DECIMAL(10,2) NOT NULL,
  option_type ENUM('CE', 'PE') NOT NULL,
  expiry_date DATE NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, instrument_key)
);
```

#### 6.2.3 Alert System

**Alert Types (MVP):**

| Alert Type      | Trigger Condition                    | Example                                   |
| --------------- | ------------------------------------ | ----------------------------------------- |
| OI Spike        | OI change > X% in single interval    | "Nifty 24,500 CE OI surged +15% in 5 min" |
| PCR Cross       | PCR crosses above/below threshold    | "Nifty PCR crossed above 1.5 (bullish)"   |
| Max Pain Shift  | Max Pain moves by > X strikes        | "Max Pain shifted from 24,500 to 24,600"  |
| Watchlist Alert | Any watchlist strike OI change > 10% | "Your watched strike 24,600 PE: OI +12%"  |

**Delivery Channels:**

- **In-app notification** (bell icon) — All users
- **Browser push notification** — All logged-in users (opt-in)
- **Email digest** — End of day summary (opt-in)
- **Telegram bot** (Stage 3) — Paid users only

**Limits:**

| Plan    | Max Active Alerts | Delivery Channels       |
| ------- | ----------------- | ----------------------- |
| Free    | 3                 | In-app only             |
| Starter | 10                | In-app + Browser push   |
| Pro     | 25                | All channels            |
| Elite   | Unlimited         | All channels + Telegram |

**Edge Cases:**
| Scenario | Handling |
|----------|----------|
| Alert triggers during market close | Queue it; deliver summary at market open |
| 50 alerts fire simultaneously | Batch into single notification: "12 alerts triggered" |
| User has no active subscription but has 5 alerts set | Keep alerts but only fire the first 3; show upgrade nudge |
| Expiry day → strike no longer exists | Auto-archive alert; notify user |

#### 6.2.4 OI Trend Charts

**What it shows:**

- Historical OI data plotted as time-series charts
- Selectable timeframes: 1 Day (5-min intervals), 5 Days, 1 Month
- Overlay: OI vs Price (dual-axis chart)
- Interactive: hover to see exact values at any point

**Data Requirement:**

- Store OI snapshots every 5 minutes during market hours → MongoDB

**Data Model (MongoDB):**

```json
// Collection: oi_snapshots
{
  "_id": "ObjectId",
  "symbol": "NIFTY",
  "expiry": "2026-04-24",
  "strike": 24500,
  "type": "CE",
  "timestamp": "2026-04-19T09:20:00Z",
  "oi": 1520000,
  "oi_change": 210000,
  "volume": 45000,
  "ltp": 185.5,
  "iv": 14.2
}
```

**Indexes:**

- `{ symbol: 1, strike: 1, type: 1, timestamp: -1 }`
- TTL Index on timestamp: 90 days for free data, unlimited for paid

**Feature Gating:**
| Plan | Historical Data Access |
|------|----------------------|
| Free | Current day only |
| Starter | 7 days |
| Pro | 30 days |
| Elite | 90 days + CSV export |

#### 6.2.5 PCR History Chart

- Daily PCR plotted as time-series
- Moving average overlay (5-day, 20-day)
- Annotated significant events (expiry days, big market moves)
- Free: 7 days; Paid: 90 days

### Stage 2 Success Criteria (Week 8 Check)

| Metric                              | Target                   |
| ----------------------------------- | ------------------------ |
| Registered users                    | 2,000+                   |
| DAU / MAU ratio                     | >15%                     |
| Free → Paid conversion              | 3-5%                     |
| Paying subscribers                  | 60-100                   |
| MRR                                 | ₹15,000-30,000           |
| Churn rate (monthly)                | <10%                     |
| Alert engagement (% who set alerts) | >30% of registered users |

---

## 🔵 STAGE 3 — Core Product (Months 2-3)

### Goal

Build defensible features that differentiate from competitors. This is where OptionKart becomes a "must-have" vs "nice-to-have."

### Features

#### 6.3.1 OI Heatmap

**What it shows:**

- 2D grid: Strike prices (Y-axis) × Time intervals (X-axis)
- Cell color intensity = OI build-up magnitude
- Separate heatmaps for Calls and Puts
- Instantly reveals where institutional money is concentrating

**UI Specification:**

```
              9:15  9:30  9:45  10:00  10:15  ...
            ┌──────┬──────┬──────┬──────┬──────┐
  24,800   │  ░░  │  ▒▒  │  ██  │  ██  │  ██  │  ← Heavy call writing
  24,700   │  ░░  │  ░░  │  ▒▒  │  ▒▒  │  ░░  │
  24,600   │  ▒▒  │  ▒▒  │  ▒▒  │  ░░  │  ░░  │  ← ATM
  24,500   │  ░░  │  ░░  │  ▒▒  │  ██  │  ██  │  ← Heavy put writing
  24,400   │  ░░  │  ░░  │  ░░  │  ▒▒  │  ▒▒  │
            └──────┴──────┴──────┴──────┴──────┘
  Legend: ░░ Low  ▒▒ Medium  ██ High OI Build-up
```

**Data Requirement:** Every 5-min OI snapshot (from Stage 2 data pipeline)

**Implementation:** Use D3.js or Recharts with custom canvas renderer for performance (can be 100+ cells)

#### 6.3.2 Smart Money Indicators

**Money Flow Index (MFI):**

- Combines OI, volume, and price to detect institutional activity
- Formula: `MFI = (Put OI Change × Put Volume) / (Call OI Change × Call Volume)`
- Displayed as a simple gauge: "Smart Money: 🟢 Buying / 🔴 Selling"

**Unusual OI Activity Scanner:**

- Flags strikes where OI change is >2 standard deviations from mean
- Shows: Strike, Direction (build-up/unwinding), Magnitude, Time
- Sorted by magnitude (biggest moves first)

**Support/Resistance Zones from OI:**

- Highest Call OI = Resistance level
- Highest Put OI = Support level
- Visualised as horizontal bands on a price chart

#### 6.3.3 Multi-Expiry Analysis

- Compare OI data across Current, Next, and Monthly expiries
- Identify rollovers (OI shifting from current to next expiry)
- Rollover % calculation and trend

#### 6.3.4 Advanced Dashboard Widgets

**Customisable layout:**

- Users can rearrange dashboard widgets (drag-and-drop)
- Save layout per user
- Default layouts: "Beginner" (simplified), "Trader" (detailed)

**New Widgets:**

- IV (Implied Volatility) chart
- India VIX real-time display
- FII/DII derivative data (if available via public sources)
- Market breadth (advance/decline)

#### 6.3.5 Telegram Bot Integration

- Users connect their Telegram account
- Alerts delivered instantly via Telegram
- Commands: `/watchlist`, `/pcr`, `/signal nifty`
- Paid feature (Pro + Elite plans)

**Implementation:** Node.js Telegram Bot API (Grammy/Telegraf library)

### Stage 3 Success Criteria

| Metric                           | Target               |
| -------------------------------- | -------------------- |
| Registered users                 | 8,000-10,000         |
| Paying subscribers               | 400-600              |
| MRR                              | ₹1.5-3 lakh          |
| Feature adoption (heatmap usage) | >40% of active users |
| NPS score                        | >40                  |

---

## 🟣 STAGE 4 — AI Integration (Months 3-6)

### Goal

Make OptionKart "intelligent" — add AI-powered features that no competitor offers. This is the primary moat.

### Features

#### 6.4.1 AI Market Analyst (Chat Interface)

**What it does:**

- Users can ask questions in natural language about current market data
- AI responds with analysis backed by actual OptionKart data (not hallucinated)
- Grounded in real-time OI, PCR, IV, and price data

**Example Interactions:**

```
User:  "What is the market sentiment for Nifty today?"

AI:    "Based on today's data, Nifty is showing MODERATELY BULLISH sentiment.

        Here's why:
        • PCR is at 1.23 (above 1.0 = bullish) — up from 0.95 yesterday
        • Significant Put OI build-up at 24,400 (+5.2L) suggests strong support
        • Call OI at 24,800 is the resistance ceiling
        • Max Pain at 24,550 suggests Nifty may consolidate near current levels

        ⚠️ Watch out: If PCR drops below 1.0 in next 30 min, sentiment could flip

        🔗 See live dashboard | View OI heatmap"
```

```
User:  "Why did Bank Nifty fall 300 points in the last hour?"

AI:    "Bank Nifty's sharp decline appears driven by aggressive Call writing:

        • 52,000 CE saw +8.2L OI build-up (unusual activity detected at 1:45 PM)
        • Simultaneously, Put unwinding at 51,500 PE suggests breakdown
        • Smart Money indicator flipped to SELLING at 1:30 PM
        • This pattern resembles a 'bearish engulfing' in OI terms

        Current support: 51,200 (highest Put OI)

        ⚠️ Disclaimer: This is data analysis, not financial advice."
```

**Technical Architecture:**

```
User Query → Backend → Context Builder → LLM API → Response Parser → User
                │                                        │
                └─ Fetch current market data ──────────────┘
                   from Redis/MongoDB as context
```

**Prompt Engineering Template:**

```
System Prompt:
"You are OptionKart AI, an options market analyst for Indian markets (NSE).
You analyze Open Interest, PCR, Implied Volatility, and price data to provide
market insights. You MUST:
1. Base ALL analysis on the provided market data (never make up numbers)
2. Always cite specific data points (e.g., 'PCR is 1.23', not 'PCR is high')
3. Mention confidence level: High/Medium/Low
4. Include relevant caveats and disclaimers
5. Never give buy/sell recommendations — only data-driven observations
6. Keep responses under 200 words unless the user asks for detail
7. Use simple language a beginner can understand

Market Data Context:
{current_market_data_json}

Previous conversation:
{last_3_messages}
"

User Message: "{user_query}"
```

**Edge Cases:**
| Scenario | Handling |
|----------|----------|
| User asks about stocks (not index options) | "I currently analyze Nifty and Bank Nifty options. Stock options coming soon!" |
| User asks for buy/sell advice | Polite redirection: "I can't give trading advice, but here's what the data shows..." |
| Market is closed | Analyse last available data with caveat: "Based on today's closing data..." |
| AI hallucinates a number | Validate all numbers in response against actual data before sending |
| User sends gibberish | "I didn't understand that. Try asking something like 'What is Nifty sentiment today?'" |
| User exhausts daily limit | Show limit message + upgrade CTA |

#### 6.4.2 AI Strategy Suggester

**What it does:**

- Based on current market data, suggests appropriate options strategies
- Shows payoff diagrams for each suggestion
- Explains when/why each strategy works

**Example Output:**

```
Based on current market conditions:
• Nifty at 24,580 | IV: 14.2% | PCR: 1.23 | Trend: Range-bound

Suggested Strategies:

1. 🟢 Iron Condor (Confidence: HIGH)
   Sell 24,400 PE + Sell 24,700 CE / Buy 24,300 PE + Buy 24,800 CE
   Max Profit: ₹4,200 | Max Loss: ₹5,800 | Breakeven: 24,358/24,742
   Why: Low IV + range-bound market + strong OI at support/resistance

2. 🟡 Bull Put Spread (Confidence: MEDIUM)
   Sell 24,400 PE + Buy 24,300 PE
   Max Profit: ₹2,800 | Max Loss: ₹4,700 | Breakeven: 24,372
   Why: Strong put OI support at 24,400; bullish PCR

⚠️ These are educational examples based on data, not trading advice.
```

#### 6.4.3 Daily AI Market Brief

- Auto-generated morning brief (8:45 AM) using pre-market data
- Auto-generated closing brief (3:45 PM) with day's summary
- Delivered via email/in-app to paid users
- Uses previous day's OI data, global cues, India VIX

### AI Cost & Quota Strategy

_See [Section 8: AI Integration Strategy](#8-ai-integration-strategy) for complete details_

---

## 🟠 STAGE 5 — Platform & Scale (Months 6+)

### Goal

Transform OptionKart from a tool into a platform with network effects.

### Features

#### 6.5.1 Strategy Backtesting Engine

**What it does:**

- Users can test options strategies against historical data
- Select: Strategy type, entry/exit rules, date range
- Output: Win rate, avg P&L, max drawdown, Sharpe ratio

**User Flow:**

```
User goes to "Backtest" page
     │
     ▼
Select Strategy: [Iron Condor ▼]
Select Index: [Nifty ▼]
Date Range: [Jan 2026 - Mar 2026]
Entry Rule: [PCR > 1.2]
Exit Rule: [50% profit or 100% loss]
     │
     ▼
[Run Backtest]
     │
     ▼
Results:
  Total Trades: 24
  Win Rate: 62.5%
  Avg Profit: ₹3,200
  Avg Loss: ₹2,100
  Net P&L: ₹28,400
  Max Drawdown: ₹8,600
  [View Trade Log] [Share Results]
```

**Data Requirement:** 6+ months of stored 5-minute OI snapshots (from Stage 2 pipeline)

#### 6.5.2 Community Features

- **Trade Ideas Feed:** Users post trade setups with charts
- **Discussion Threads:** Tied to specific indices or strategies
- **Upvote/Downvote:** Surface best ideas
- **Moderation:** AI-powered content moderation + manual review

#### 6.5.3 Gamification & Leaderboard

- **Paper Trading Competition:** Virtual portfolio, track P&L
- **Prediction Accuracy:** Track how often a user's predictions match reality
- **Badges:** "First Trade Idea", "100-Day Streak", "Top Analyser"
- **Monthly Leaderboard:** Top 10 by paper trading P&L

#### 6.5.4 Public API (Monetised)

**Endpoints:**

- `/api/v1/sentiment/{index}` — Current sentiment signal
- `/api/v1/oi/{index}/{expiry}` — OI data for an index
- `/api/v1/pcr/{index}` — Current and historical PCR
- `/api/v1/heatmap/{index}` — OI heatmap data

**Pricing:**
| Plan | Requests/day | Price |
|------|-------------|-------|
| Developer | 100 | Free |
| Pro API | 5,000 | ₹1,999/mo |
| Enterprise | 50,000 | ₹9,999/mo |

#### 6.5.5 Multi-Index & Stock Options

- Expand beyond Nifty and BankNifty
- Add: Nifty FinService, Nifty Midcap Select
- Individual stock options (top 50 F&O stocks)
- Significant data pipeline scaling required

---

# 7. Technical Architecture

## 7.1 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                       │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────┐                │
│   │              Next.js Application (Vercel)                    │                │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐│                │
│   │  │ Dashboard  │  │ Charts    │  │ AI Chat   │  │ Settings ││                │
│   │  │ Pages      │  │ Component │  │ Component │  │ Pages    ││                │
│   │  └───────────┘  └───────────┘  └───────────┘  └──────────┘│                │
│   │  ┌─────────────────────────────────────────────────────────┐│                │
│   │  │     React Query / SWR (Client-side data fetching)       ││                │
│   │  └─────────────────────────────────────────────────────────┘│                │
│   └─────────────────────────┬───────────────────────────────────┘                │
│                              │ HTTPS                                             │
└──────────────────────────────┼───────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / BACKEND LAYER                             │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────┐                │
│   │             NestJS Application (Railway / Render)            │                │
│   │                                                              │                │
│   │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │                │
│   │  │ Auth Module  │  │ Market Data  │  │ Subscription     │   │                │
│   │  │ (JWT + OAuth)│  │ Module       │  │ Module (Razorpay)│   │                │
│   │  └─────────────┘  └──────────────┘  └──────────────────┘   │                │
│   │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │                │
│   │  │ Alert Module │  │ AI Module    │  │ Analytics Module │   │                │
│   │  │ (BullMQ)     │  │ (OpenAI)     │  │ (Event Tracking) │   │                │
│   │  └─────────────┘  └──────────────┘  └──────────────────┘   │                │
│   │  ┌─────────────────────────────────────────────────────┐    │                │
│   │  │     Data Ingestion Service (Cron + WebSocket)       │    │                │
│   │  │     - Upstox API Poller (every 3 min)               │    │                │
│   │  │     - Snapshot Writer (every 5 min)                  │    │                │
│   │  │     - Alert Evaluator (on each data update)         │    │                │
│   │  └─────────────────────────────────────────────────────┘    │                │
│   └──────────┬──────────────┬───────────────┬───────────────────┘                │
│              │              │               │                                    │
└──────────────┼──────────────┼───────────────┼────────────────────────────────────┘
               │              │               │
               ▼              ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                            │
│                                                                                  │
│   ┌──────────────┐  ┌────────────────┐  ┌───────────────────┐                   │
│   │    Redis      │  │  PostgreSQL    │  │    MongoDB Atlas   │                   │
│   │  (Upstash)    │  │  (Neon)        │  │                   │                   │
│   │               │  │                │  │                   │                   │
│   │ • Live OI     │  │ • Users        │  │ • OI Snapshots    │                   │
│   │   cache       │  │ • Subscriptions│  │ • Historical OI   │                   │
│   │ • Rate limit  │  │ • Watchlists   │  │ • AI Chat Logs    │                   │
│   │   counters    │  │ • Alerts       │  │ • Market Events   │                   │
│   │ • Session     │  │ • Payments     │  │ • Backtest Results│                   │
│   │   store       │  │ • Audit logs   │  │                   │                   │
│   │ • BullMQ      │  │                │  │                   │                   │
│   │   queues      │  │                │  │                   │                   │
│   └──────────────┘  └────────────────┘  └───────────────────┘                   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                        │
│                                                                                  │
│   ┌──────────────┐  ┌────────────────┐  ┌───────────────┐  ┌──────────────┐     │
│   │ Upstox API   │  │ Razorpay       │  │ OpenAI API    │  │ Resend/SES   │     │
│   │ (Market Data)│  │ (Payments)     │  │ (AI Features) │  │ (Email)      │     │
│   └──────────────┘  └────────────────┘  └───────────────┘  └──────────────┘     │
│   ┌──────────────┐  ┌────────────────┐  ┌───────────────┐                       │
│   │ Sentry       │  │ Plausible /    │  │ Telegram Bot  │                       │
│   │ (Errors)     │  │ PostHog        │  │ API           │                       │
│   │              │  │ (Analytics)    │  │               │                       │
│   └──────────────┘  └────────────────┘  └───────────────┘                       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Data Pipeline Design

### 7.2.1 Real-Time Data Flow

```
Upstox API ──(REST poll every 3 min)──▶ Data Ingestion Service
                                              │
                                              ├──▶ Redis (live cache, 60s TTL)
                                              │      └──▶ Serves dashboard API calls
                                              │
                                              ├──▶ Alert Evaluator (BullMQ job)
                                              │      ├──▶ Check all active alerts
                                              │      └──▶ Trigger notifications
                                              │
                                              └──(every 5 min)──▶ MongoDB (snapshot)
                                                                    └──▶ Historical data
                                                                         for charts
```

### 7.2.2 Cron Schedule (Market Hours: 9:15 AM - 3:30 PM IST)

| Job                     | Frequency   | Description                               |
| ----------------------- | ----------- | ----------------------------------------- |
| `fetch-nifty-chain`     | Every 3 min | Fetch Nifty options chain from Upstox     |
| `fetch-banknifty-chain` | Every 3 min | Fetch BankNifty options chain from Upstox |
| `fetch-spot-prices`     | Every 1 min | Fetch Nifty/BankNifty spot price          |
| `compute-metrics`       | Every 3 min | Calculate PCR, Max Pain, signals          |
| `save-snapshot`         | Every 5 min | Write OI snapshot to MongoDB              |
| `evaluate-alerts`       | Every 3 min | Check all active alerts against new data  |
| `daily-summary`         | 3:35 PM     | Generate end-of-day summary               |
| `cleanup-cache`         | 4:00 PM     | Clear stale Redis keys                    |

### 7.2.3 Data Volume Estimates

| Data Type                                 | Daily Volume                           | Monthly Volume | Storage (MongoDB) |
| ----------------------------------------- | -------------------------------------- | -------------- | ----------------- |
| OI Snapshots (Nifty, ~40 strikes × CE/PE) | 80 strikes × 75 intervals = 6,000 docs | 180,000 docs   | ~20 MB/mo         |
| OI Snapshots (BankNifty, ~30 strikes)     | 60 strikes × 75 intervals = 4,500 docs | 135,000 docs   | ~15 MB/mo         |
| Spot price ticks                          | ~375/day                               | ~11,250/mo     | ~1 MB/mo          |
| AI chat logs                              | Varies (est. 500/day at scale)         | 15,000/mo      | ~5 MB/mo          |
| **Total**                                 |                                        |                | **~40 MB/mo**     |

At 100K users, storage remains manageable (<5 GB/year for market data). User-generated data scales linearly.

## 7.3 Database Schema

### 7.3.1 PostgreSQL (Relational — Users, Subscriptions, Alerts)

```sql
-- Users table (see Section 6.2.1 for full schema)

-- Subscriptions (linked to Razorpay)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  razorpay_plan_id VARCHAR(255) NOT NULL,
  plan_name VARCHAR(50) NOT NULL, -- 'starter', 'pro', 'elite'
  status VARCHAR(50) NOT NULL, -- 'created', 'authenticated', 'active', 'paused',
                               -- 'halted', 'cancelled', 'completed', 'expired'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  billing_cycle VARCHAR(20), -- 'monthly', 'yearly'
  amount_paise INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50), -- 'upi', 'card', 'wallet', 'netbanking'
  failure_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments ledger (every Razorpay payment event)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  razorpay_payment_id VARCHAR(255) UNIQUE NOT NULL,
  razorpay_order_id VARCHAR(255),
  amount_paise INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50) NOT NULL, -- 'authorized', 'captured', 'failed', 'refunded'
  method VARCHAR(50), -- 'upi', 'card', 'wallet'
  error_code VARCHAR(100),
  error_description TEXT,
  refund_id VARCHAR(255),
  refund_amount_paise INT,
  invoice_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts configuration
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'oi_spike', 'pcr_cross', 'max_pain_shift', 'watchlist'
  symbol VARCHAR(20) NOT NULL, -- 'NIFTY', 'BANKNIFTY'
  strike_price DECIMAL(10,2), -- NULL for PCR/MaxPain alerts
  option_type VARCHAR(2), -- 'CE', 'PE', or NULL
  condition_operator VARCHAR(10), -- 'gt', 'lt', 'cross_above', 'cross_below'
  condition_value DECIMAL(10,4),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  trigger_count INT DEFAULT 0,
  delivery_channels TEXT[], -- e.g., ARRAY['in_app', 'push', 'email', 'telegram']
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alert history (triggered alerts)
CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES alerts(id),
  user_id UUID REFERENCES users(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  trigger_data JSONB, -- Snapshot of data that triggered the alert
  notification_sent BOOLEAN DEFAULT false,
  channels_notified TEXT[]
);

-- User preferences / settings
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'dark', -- 'dark', 'light'
  default_index VARCHAR(20) DEFAULT 'NIFTY',
  dashboard_layout JSONB, -- Widget positions and sizes
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_telegram BOOLEAN DEFAULT false,
  telegram_chat_id VARCHAR(50),
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata'
);
```

### 7.3.2 MongoDB (Document Store — Market Data, AI Logs)

**Collection: `oi_snapshots`** — Stores 5-minute snapshots of OI data

```json
{
  "_id": "ObjectId",
  "symbol": "NIFTY",
  "expiry": "2026-04-24",
  "snapshot_time": "2026-04-19T09:20:00Z",
  "spot_price": 24580.5,
  "strikes": [
    {
      "strike": 24500,
      "ce": { "oi": 1520000, "oi_change": 210000, "volume": 45000, "ltp": 185.5, "iv": 14.2 },
      "pe": { "oi": 1890000, "oi_change": -50000, "volume": 32000, "ltp": 102.3, "iv": 15.1 }
    }
  ],
  "computed": {
    "pcr": 1.23,
    "max_pain": 24500,
    "total_call_oi": 12500000,
    "total_put_oi": 15400000,
    "sentiment": "bullish",
    "sentiment_score": 72
  }
}
```

**Indexes:**

- `{ symbol: 1, snapshot_time: -1 }`
- `{ symbol: 1, expiry: 1, snapshot_time: -1 }`
- TTL index on `snapshot_time`: auto-delete after 90 days

**Collection: `ai_conversations`**

```json
{
  "_id": "ObjectId",
  "user_id": "uuid",
  "session_id": "uuid",
  "messages": [
    {
      "role": "user",
      "content": "What is nifty sentiment?",
      "timestamp": "2026-04-19T09:20:00Z"
    },
    {
      "role": "assistant",
      "content": "Based on today's data...",
      "timestamp": "2026-04-19T09:20:02Z",
      "tokens_used": { "prompt": 450, "completion": 180 },
      "model": "gpt-4o-mini",
      "market_context_snapshot": { "pcr": 1.23, "spot": 24580 }
    }
  ],
  "total_tokens": 630,
  "created_at": "2026-04-19T09:20:00Z",
  "expires_at": "2026-05-19T09:20:00Z"
}
```

**Collection: `daily_summaries`**

```json
{
  "_id": "ObjectId",
  "symbol": "NIFTY",
  "date": "2026-04-19",
  "open_pcr": 1.05,
  "close_pcr": 1.23,
  "high_pcr": 1.31,
  "low_pcr": 0.98,
  "max_pain_open": 24500,
  "max_pain_close": 24550,
  "spot_open": 24520,
  "spot_close": 24580,
  "spot_high": 24650,
  "spot_low": 24480,
  "total_call_oi_change": 5200000,
  "total_put_oi_change": 3800000,
  "unusual_activities": [
    { "strike": 24700, "type": "CE", "activity": "heavy_writing", "oi_change": 820000 }
  ],
  "ai_summary": "Market showed bullish bias throughout the day..."
}
```

## 7.4 API Design

### 7.4.1 API Conventions

- **Base URL:** `https://api.optionkart.com/v1`
- **Auth:** Bearer JWT token in `Authorization` header
- **Response Format:** JSON with consistent envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-04-19T09:20:00Z",
    "cached": true,
    "cache_age_seconds": 45
  }
}
```

- **Error Format:**

```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_REQUIRED",
    "message": "This feature requires a Pro subscription",
    "upgrade_url": "/pricing"
  }
}
```

### 7.4.2 Endpoint Catalog

#### Authentication

| Method | Endpoint                  | Auth | Description             |
| ------ | ------------------------- | ---- | ----------------------- |
| POST   | `/auth/magic-link`        | ❌   | Send magic link email   |
| POST   | `/auth/verify-magic-link` | ❌   | Verify magic link token |
| POST   | `/auth/google`            | ❌   | Google OAuth callback   |
| POST   | `/auth/refresh`           | 🔒   | Refresh JWT token       |
| POST   | `/auth/logout`            | 🔒   | Invalidate session      |

#### Market Data (Public — no auth required for basic)

| Method | Endpoint                             | Auth | Description                                      |
| ------ | ------------------------------------ | ---- | ------------------------------------------------ |
| GET    | `/market/dashboard/{index}`          | ❌   | Full dashboard data (sentiment, PCR, OI summary) |
| GET    | `/market/chain/{index}`              | ❌   | Simplified options chain (current expiry)        |
| GET    | `/market/chain/{index}/{expiry}`     | 🔒   | Options chain for specific expiry                |
| GET    | `/market/spot/{index}`               | ❌   | Current spot price                               |
| GET    | `/market/pcr/{index}`                | ❌   | Current PCR value                                |
| GET    | `/market/pcr/{index}/history`        | 🔒   | PCR history (query params: `from`, `to`)         |
| GET    | `/market/max-pain/{index}`           | ❌   | Current max pain                                 |
| GET    | `/market/heatmap/{index}`            | 🔒   | OI Heatmap data                                  |
| GET    | `/market/unusual-activity/{index}`   | 🔒   | Unusual OI scanner                               |
| GET    | `/market/support-resistance/{index}` | ❌   | OI-based support/resistance                      |

#### User Data

| Method | Endpoint            | Auth | Description                       |
| ------ | ------------------- | ---- | --------------------------------- |
| GET    | `/user/profile`     | 🔒   | Get user profile + plan           |
| PATCH  | `/user/profile`     | 🔒   | Update profile                    |
| GET    | `/user/preferences` | 🔒   | Get user preferences              |
| PUT    | `/user/preferences` | 🔒   | Update user preferences           |
| GET    | `/user/usage`       | 🔒   | AI credits remaining, alert count |

#### Watchlist

| Method | Endpoint          | Auth | Description                            |
| ------ | ----------------- | ---- | -------------------------------------- |
| GET    | `/watchlist`      | 🔒   | Get all watchlist items with live data |
| POST   | `/watchlist`      | 🔒   | Add strike to watchlist                |
| DELETE | `/watchlist/{id}` | 🔒   | Remove from watchlist                  |

#### Alerts

| Method | Endpoint          | Auth | Description             |
| ------ | ----------------- | ---- | ----------------------- |
| GET    | `/alerts`         | 🔒   | Get all user alerts     |
| POST   | `/alerts`         | 🔒   | Create new alert        |
| PATCH  | `/alerts/{id}`    | 🔒   | Update alert            |
| DELETE | `/alerts/{id}`    | 🔒   | Delete alert            |
| GET    | `/alerts/history` | 🔒   | Triggered alert history |

#### AI

| Method | Endpoint                  | Auth | Description                  |
| ------ | ------------------------- | ---- | ---------------------------- |
| POST   | `/ai/chat`                | 🔒   | Send AI query (SSE response) |
| GET    | `/ai/daily-brief/{index}` | 🔒   | Get today's AI market brief  |
| POST   | `/ai/strategy-suggest`    | 🔒   | Get strategy suggestions     |
| GET    | `/ai/usage`               | 🔒   | AI credits used today        |

#### Subscription

| Method | Endpoint                | Auth | Description                                 |
| ------ | ----------------------- | ---- | ------------------------------------------- |
| GET    | `/subscription`         | 🔒   | Get current subscription details            |
| POST   | `/subscription/create`  | 🔒   | Create Razorpay subscription                |
| POST   | `/subscription/webhook` | ❌\* | Razorpay webhook receiver (\*IP restricted) |
| POST   | `/subscription/cancel`  | 🔒   | Cancel subscription                         |
| POST   | `/subscription/pause`   | 🔒   | Pause subscription                          |
| POST   | `/subscription/resume`  | 🔒   | Resume paused subscription                  |

### 7.4.3 Rate Limiting Strategy

| Tier                | Requests/min | Burst (10s)  | Notes                         |
| ------------------- | ------------ | ------------ | ----------------------------- |
| Anonymous (no auth) | 30           | 10           | Enough for dashboard browsing |
| Free user           | 60           | 20           | Standard API access           |
| Starter             | 120          | 40           |                               |
| Pro                 | 300          | 100          |                               |
| Elite               | 600          | 200          |                               |
| Public API          | Per API plan | Per API plan | Separate rate limits          |

**Implementation:**

- Redis-based sliding window counter
- Key pattern: `ratelimit:{user_id}:{endpoint}:{window}`
- Return `429 Too Many Requests` with `Retry-After` header
- Exempt webhook endpoints from rate limiting

## 7.5 Caching Strategy

| Data                       | Cache Location | TTL   | Invalidation                      |
| -------------------------- | -------------- | ----- | --------------------------------- |
| Options chain (live)       | Redis          | 60s   | Overwritten on next Upstox fetch  |
| Dashboard computed metrics | Redis          | 60s   | Recomputed on data fetch          |
| Spot price                 | Redis          | 30s   | Overwritten on next fetch         |
| User session               | Redis          | 24h   | On logout or token refresh        |
| PCR history (chart data)   | Redis          | 5 min | On new snapshot                   |
| Static content (plans)     | CDN (Vercel)   | 1h    | On deploy                         |
| AI response                | None           | —     | Never cached (queries are unique) |

**Redis Key Naming Convention:**

```
ok:live:{index}:chain          → Full options chain
ok:live:{index}:dashboard      → Computed dashboard metrics
ok:live:{index}:spot           → Spot price
ok:session:{user_id}           → User session
ok:ratelimit:{user_id}:{ep}    → Rate limit counter
ok:alert:eval:{alert_id}       → Last evaluation result (avoid duplicate triggers)
```

## 7.6 Scalability Plan: 100 Users → 100K Users

### Phase 1: 0–1,000 Users (Months 1-3)

| Component  | Setup                       | Monthly Cost |
| ---------- | --------------------------- | ------------ |
| Frontend   | Vercel Free/Hobby           | Free-$20     |
| Backend    | Railway (single instance)   | $5-10        |
| PostgreSQL | Neon Free                   | Free         |
| MongoDB    | Atlas Free (512MB)          | Free         |
| Redis      | Upstash Free (10K cmds/day) | Free         |
| **Total**  |                             | **$5-30/mo** |

### Phase 2: 1,000–10,000 Users (Months 3-6)

| Component  | Setup                             | Monthly Cost    |
| ---------- | --------------------------------- | --------------- |
| Frontend   | Vercel Pro                        | $20             |
| Backend    | Railway (2 instances, auto-scale) | $30-50          |
| PostgreSQL | Neon Launch                       | $19             |
| MongoDB    | Atlas M10 (shared, 2GB)           | $57             |
| Redis      | Upstash Pro (1M cmds/day)         | $10             |
| **Total**  |                                   | **$140-160/mo** |

Key changes:

- Add horizontal scaling on backend (NestJS handles this natively)
- Move to connection pooling for PostgreSQL (PgBouncer)
- Add CDN for static assets
- Implement response compression (gzip/brotli)

### Phase 3: 10,000–100,000 Users (Months 6-12+)

| Component  | Setup                                     | Monthly Cost      |
| ---------- | ----------------------------------------- | ----------------- |
| Frontend   | Vercel Enterprise or self-hosted          | $100-400          |
| Backend    | AWS ECS or Railway (4-8 instances)        | $200-500          |
| PostgreSQL | Neon Scale/RDS (dedicated, read replicas) | $69-200           |
| MongoDB    | Atlas M30 (dedicated, 8GB)                | $210              |
| Redis      | Upstash or ElastiCache                    | $50-100           |
| CDN        | CloudFront                                | $50-100           |
| Monitoring | Sentry + Datadog                          | $50-100           |
| **Total**  |                                           | **$760-1,600/mo** |

Key changes:

- Websocket gateway for real-time data (eliminate polling from client)
- Read replicas for PostgreSQL
- MongoDB sharding by symbol + time range
- Dedicated Redis cluster
- Background worker processes separated from HTTP servers
- Rate limiting by plan tier
- Geographic CDN for static assets
- Consider migrating to Upstox WebSocket V3 for real-time push (eliminate REST polling)

---

# 8. AI Integration Strategy

## 8.1 AI Use Cases (Priority Order)

| #   | Feature                      | Stage | User Value                      | Cost/Query | Priority |
| --- | ---------------------------- | ----- | ------------------------------- | ---------- | -------- |
| 1   | Market Sentiment Chat        | 4     | High — instant answers          | ~₹0.12     | P0       |
| 2   | AI Market Brief (auto-gen)   | 4     | High — saves 30 min             | ~₹0.20     | P0       |
| 3   | Strategy Suggester           | 4     | Very High — directly actionable | ~₹0.25     | P1       |
| 4   | OI Analysis Explainer        | 4     | Medium — educational            | ~₹0.10     | P1       |
| 5   | Anomaly Explanation          | 4     | Medium — contextual             | ~₹0.08     | P2       |
| 6   | Backtesting Natural Language | 5     | Medium — convenience            | ~₹0.15     | P2       |

## 8.2 Model Selection & Cost Analysis

### Primary Model: GPT-4o-mini

| Metric                                    | Value                                                      |
| ----------------------------------------- | ---------------------------------------------------------- |
| Input cost                                | $0.15 / 1M tokens                                          |
| Output cost                               | $0.60 / 1M tokens                                          |
| Context window                            | 128K tokens                                                |
| Avg prompt (system + market data + query) | ~800 tokens                                                |
| Avg response                              | ~300 tokens                                                |
| **Cost per query**                        | ~$0.00015 input + $0.00018 output = **$0.00033 (~₹0.028)** |

### Cost Projections

| Users                | Queries/day | Monthly Cost (GPT-4o-mini) |
| -------------------- | ----------- | -------------------------- |
| 100 paying users     | 300         | ₹252 (~$3)                 |
| 1,000 paying users   | 3,000       | ₹2,520 (~$30)              |
| 10,000 paying users  | 30,000      | ₹25,200 (~$300)            |
| 100,000 paying users | 300,000     | ₹2,52,000 (~$3,000)        |

**Verdict:** At GPT-4o-mini pricing, AI costs are **negligible** relative to subscription revenue. Even at 100K users, AI cost is ~₹2.5L/mo vs potential revenue of ₹1.5-2 Cr/mo.

## 8.3 Prompt Engineering — Production Templates

### Template 1: Market Sentiment Query

```
SYSTEM:
You are OptionKart AI, an options data analyst for Indian markets (NSE).
Rules:
- Respond ONLY based on the data provided below
- Never fabricate numbers — if data is missing, say so
- Keep responses concise (max 150 words)
- Use simple Hindi-English mixed language if user writes in Hindi
- End with a relevant caveat or risk factor
- NEVER recommend buying or selling any contract

CURRENT MARKET DATA (as of {timestamp}):
Index: {index_name}
Spot Price: {spot_price} ({price_change_pct}%)
PCR: {pcr_value} (Prev close: {prev_pcr})
Total Call OI: {total_call_oi} (Change: {call_oi_change})
Total Put OI: {total_put_oi} (Change: {put_oi_change})
Max Pain: {max_pain}
ATM Strike: {atm_strike}
VIX: {vix_value}
Top 3 Call OI Build-up: {top_call_oi}
Top 3 Put OI Build-up: {top_put_oi}
Unusual Activity: {unusual_activity_summary}

USER: {user_query}
```

### Template 2: Strategy Suggestion

```
SYSTEM:
You are an options strategy educator. Based on the market data below,
suggest 2-3 appropriate options strategies with educational context.

Rules:
- Explain WHY each strategy fits the current data
- Include approximate profit/loss levels
- Rate confidence: High/Medium/Low
- Mention key risks for each strategy
- Format with clear structure (numbered list)
- DISCLAIMER: These are educational examples, not trading advice

MARKET CONTEXT:
{same_data_as_template_1}
IV Percentile: {iv_percentile}
Market Phase: {trending_or_rangebound}
Days to Expiry: {dte}

Suggest strategies.
```

### Template 3: Daily Market Brief

```
SYSTEM:
Generate a concise end-of-day market analysis report for {index_name}.
Format:

## {index_name} Daily Brief — {date}

**Day's Verdict:** [One-line summary]

**Key Numbers:**
(5-6 bullet points with today's important metrics)

**What Happened:**
(2-3 paragraph analysis of the day's price action explained through OI data)

**Watch Tomorrow:**
(2-3 things to watch for in the next session)

**Confidence Level:** [High/Medium/Low]

Use the following data:
{full_day_data_summary}
```

## 8.4 AI Cost Model: Platform Pays vs BYO API Key

### Recommended Hybrid Approach

```
┌─────────────────────────────────────────────────┐
│              AI CREDIT SYSTEM                   │
├─────────────┬──────────┬──────────┬─────────────┤
│ Free        │ Starter  │ Pro      │ Elite       │
│             │          │          │             │
│ 5 queries   │ 30       │ 100      │ 300         │
│ per day     │ per day  │ per day  │ per day     │
│             │          │          │ + BYO key   │
│ GPT-4o-mini │ GPT-4o   │ GPT-4o   │ option for  │
│ only        │ -mini    │ -mini    │ unlimited   │
└─────────────┴──────────┴──────────┴─────────────┘
```

**Why this works:**

1. **Free tier (5/day):** Enough to experience the value; creates "aha moment"
2. **Paid tiers (30-300/day):** More than enough for any active trader (~10 queries/day typical)
3. **BYO Key (Elite):** Advanced users who want unlimited queries bring their own OpenAI key — zero cost to platform, power-user retention

**BYO Key Implementation:**

```
User adds OpenAI API key in Settings
     │
     ▼
Key encrypted (AES-256) and stored in PostgreSQL
     │
     ▼
When user makes AI query:
  1. Check if BYO key exists → use user's key
  2. Else → use platform key with credit deduction
     │
     ▼
User's key is NEVER logged, NEVER sent to frontend,
ONLY used server-side for API calls
```

## 8.5 Token Optimisation Strategies

1. **Cache common queries:** If 10 users ask "What is Nifty sentiment?" within the same 3-minute window, serve the same response
2. **Pre-compute daily brief:** Generate once at 3:45 PM, serve to all users (not per-user)
3. **Limit conversation history:** Only send last 3 messages as context (not full history)
4. **Use GPT-4.1-nano for classification:** Route simple queries (FAQ-type) to cheaper model
5. **Prompt caching:** Leverage OpenAI's prompt caching (50% discount on repeated system prompts)
6. **Set `max_tokens: 500`:** Prevent runaway responses
7. **Batch API for daily briefs:** Use OpenAI Batch API (50% discount) for non-real-time summaries

---

# 9. Monetization & Pricing Strategy

## 9.1 Pricing Tiers

| Feature                            | 🆓 Free    | 🟢 Starter ₹199/mo | 🔵 Pro ₹499/mo | 🟣 Elite ₹999/mo       |
| ---------------------------------- | ---------- | ------------------ | -------------- | ---------------------- |
| **Dashboard & Sentiment**          | ✅         | ✅                 | ✅             | ✅                     |
| **Options Chain (current expiry)** | ✅         | ✅                 | ✅             | ✅                     |
| **Multi-expiry analysis**          | ❌         | ✅                 | ✅             | ✅                     |
| **OI Heatmap**                     | ❌         | ✅ (daily)         | ✅ (real-time) | ✅ (real-time)         |
| **Historical data**                | Today only | 7 days             | 30 days        | 90 days + Export       |
| **Watchlist items**                | 5          | 15                 | 30             | 50                     |
| **Alerts**                         | 3 (in-app) | 10 (+ push)        | 25 (+ email)   | Unlimited (+ Telegram) |
| **AI queries/day**                 | 5          | 30                 | 100            | 300 + BYO key          |
| **Strategy Suggester**             | ❌         | ❌                 | ✅             | ✅                     |
| **Daily AI Brief**                 | ❌         | ❌                 | ✅             | ✅                     |
| **Backtesting**                    | ❌         | ❌                 | ❌             | ✅                     |
| **API access**                     | ❌         | ❌                 | ❌             | ✅ (1,000 req/day)     |
| **Priority support**               | ❌         | Email              | Email + Chat   | Dedicated              |
| **Ads**                            | Minimal    | ❌                 | ❌             | ❌                     |

### Annual Plans (20% discount)

| Plan    | Monthly | Annual (per month) | Annual Total |
| ------- | ------- | ------------------ | ------------ |
| Starter | ₹199    | ₹159               | ₹1,908       |
| Pro     | ₹499    | ₹399               | ₹4,788       |
| Elite   | ₹999    | ₹799               | ₹9,588       |

## 9.2 Feature Gating Strategy

**Soft gate (gentle):**

- Show the feature with blurred/limited data
- CTA: "Upgrade to unlock full heatmap →"
- User sees the VALUE before they pay

**Hard gate:**

- Feature not accessible at all
- Used for API access, backtesting

**Usage gate:**

- Feature works but with limits (alerts, watchlist, AI queries)
- Counter shown: "3/5 AI queries used today"

**Recommended gating per feature:**

| Feature           | Gate Type                    | Rationale                              |
| ----------------- | ---------------------------- | -------------------------------------- |
| OI Heatmap        | Soft (show blurred)          | Visual appeal drives conversion        |
| Historical charts | Soft (show 1 day, blur rest) | Creates desire for more data           |
| AI chat           | Usage (5/day free)           | "Aha moment" then limit                |
| Alerts            | Usage (3 free)               | User sets up workflow, then needs more |
| Backtesting       | Hard                         | Premium-only feature                   |
| API               | Hard                         | Developer-oriented, high-value         |

## 9.3 Conversion Optimisation Ideas

1. **Free trial on sign-up:** 7-day Pro trial (no credit card required) → experience full value
2. **Upgrade nudge at limit:** When user hits 5th AI query: "You've used all free queries today. Unlock 30/day for ₹199/mo"
3. **Social proof:** "Join 500+ traders already using OptionKart Pro"
4. **Expiry day urgency:** On expiry Thursdays, show special banner: "Get real-time alerts for expiry day — upgrade now"
5. **Annual plan push:** Show monthly cost comparison: "Save ₹480/year with annual plan"
6. **Referral program:** "Give ₹100 off, Get ₹100 off" — Credits on both sides
7. **Telegram channel → conversion:** Free daily market brief on Telegram; Pro brief has deeper analysis

## 9.4 Unit Economics (LTV vs CAC)

### LTV Calculation

| Variable                  | Starter                             | Pro        | Elite      |
| ------------------------- | ----------------------------------- | ---------- | ---------- |
| Monthly price             | ₹199                                | ₹499       | ₹999       |
| Avg subscription duration | 4 months                            | 6 months   | 8 months   |
| Gross margin              | 85%                                 | 85%        | 80%        |
| **LTV**                   | **₹677**                            | **₹2,545** | **₹6,394** |
| **Blended LTV**           | **~₹2,000** (assuming 50/30/20 mix) |            |            |

### Target CAC

| Channel            | Est. CAC | LTV:CAC Ratio |
| ------------------ | -------- | ------------- |
| SEO (organic)      | ₹0-50    | 40:1+ ✅      |
| YouTube (organic)  | ₹50-100  | 20:1 ✅       |
| Telegram (organic) | ₹20-50   | 40:1+ ✅      |
| Google Ads         | ₹300-500 | 4-7:1 ⚠️      |
| Twitter Ads        | ₹200-400 | 5-10:1 ✅     |

**Target: Keep blended CAC under ₹200 (LTV:CAC > 10:1)**

## 9.5 Revenue Projections

| Month   | MAU    | Paying Users | ARPU | MRR        | ARR Run Rate |
| ------- | ------ | ------------ | ---- | ---------- | ------------ |
| 1 (MVP) | 500    | 0            | ₹0   | ₹0         | ₹0           |
| 2       | 2,000  | 60           | ₹249 | ₹14,940    | ₹1.79L       |
| 3       | 5,000  | 200          | ₹299 | ₹59,800    | ₹7.18L       |
| 6       | 15,000 | 800          | ₹349 | ₹2,79,200  | ₹33.5L       |
| 9       | 30,000 | 2,000        | ₹399 | ₹7,98,000  | ₹95.8L       |
| 12      | 50,000 | 4,000        | ₹449 | ₹17,96,000 | ₹2.15 Cr     |

**Assumptions:**

- 4% paid conversion rate (conservative; Sensibull reportedly has 5-8%)
- ARPU increases as Pro/Elite mix improves
- 50,000 MAU achievable with SEO + YouTube + Telegram strategy
- Excludes affiliate revenue and API monetisation

### Revenue Mix Target (Month 12)

| Stream                  | Contribution | Monthly  |
| ----------------------- | ------------ | -------- |
| Subscriptions (primary) | 75%          | ₹13.5L   |
| Broker affiliates       | 15%          | ₹2.7L    |
| API access              | 5%           | ₹0.9L    |
| Ads (free tier)         | 5%           | ₹0.9L    |
| **Total**               | **100%**     | **₹18L** |

---

# 10. Payment Integration (Razorpay)

## 10.1 Architecture Overview

```
User clicks "Upgrade to Pro"
     │
     ▼
Frontend → POST /subscription/create
     │
     ▼
Backend creates Razorpay Subscription
  (razorpay.subscriptions.create)
     │
     ▼
Returns subscription_id + checkout options
     │
     ▼
Frontend opens Razorpay Checkout modal
  (razorpay.open with subscription_id)
     │
     ▼
User pays via UPI / Card / Wallet
     │
     ├─ SUCCESS ─▶ Checkout callback → Backend verifies signature
     │                                    → Updates user plan
     │                                    → Sends confirmation email
     │
     └─ FAILURE ─▶ Shows retry option → Logs failed attempt
```

## 10.2 Razorpay Setup Requirements

1. **Razorpay account** with Subscriptions enabled
2. **Plans created** in Razorpay dashboard:

| Plan ID                | Name            | Amount          | Period  | Interval |
| ---------------------- | --------------- | --------------- | ------- | -------- |
| `plan_starter_monthly` | Starter Monthly | ₹19900 (paise)  | monthly | 1        |
| `plan_starter_yearly`  | Starter Annual  | ₹190800 (paise) | yearly  | 1        |
| `plan_pro_monthly`     | Pro Monthly     | ₹49900 (paise)  | monthly | 1        |
| `plan_pro_yearly`      | Pro Annual      | ₹478800 (paise) | yearly  | 1        |
| `plan_elite_monthly`   | Elite Monthly   | ₹99900 (paise)  | monthly | 1        |
| `plan_elite_yearly`    | Elite Annual    | ₹958800 (paise) | yearly  | 1        |

3. **Webhook endpoint** configured: `https://api.optionkart.com/v1/subscription/webhook`
4. **Webhook secret** stored securely in environment variables

## 10.3 Subscription Lifecycle

```
                    ┌───────────┐
                    │  CREATED  │ ← subscription.create()
                    └─────┬─────┘
                          │ User completes payment
                          ▼
                  ┌───────────────┐
                  │ AUTHENTICATED │ ← First payment authorized
                  └───────┬───────┘
                          │ Payment captured
                          ▼
                    ┌───────────┐
            ┌──────│  ACTIVE   │──────────────────┐
            │      └─────┬─────┘                  │
            │            │                        │
            │   ┌────────┴────────┐               │
            │   │                 │               │
            ▼   ▼                 ▼               ▼
      ┌──────────┐         ┌──────────┐    ┌───────────┐
      │  PAUSED  │         │  HALTED  │    │ CANCELLED │
      │ (by user)│         │ (payment │    │ (by user  │
      └────┬─────┘         │  failed  │    │  request) │
           │               │  3 times)│    └───────────┘
           │               └──────────┘
           │ User resumes
           ▼
      ┌──────────┐
      │  ACTIVE  │
      └──────────┘
```

## 10.4 Webhook Events to Handle

| Event                        | Action                                                             |
| ---------------------------- | ------------------------------------------------------------------ |
| `subscription.authenticated` | Log payment method; user can access paid features                  |
| `subscription.activated`     | Set user plan to active; send welcome email                        |
| `subscription.charged`       | Log payment; extend period; update `current_period_end`            |
| `subscription.paused`        | Set user plan to paused; retain data; restrict features            |
| `subscription.resumed`       | Reactivate user plan                                               |
| `subscription.cancelled`     | Set plan active until `current_period_end`; then downgrade to free |
| `subscription.halted`        | After 3 failed payments; downgrade user; send recovery email       |
| `subscription.completed`     | Subscription ended naturally (if fixed duration)                   |
| `subscription.pending`       | Payment pending (UPI mandate); show "processing" state             |
| `payment.failed`             | Log failure; increment `failure_count`; show in-app alert          |
| `refund.created`             | Log refund; adjust billing records                                 |

## 10.5 Webhook Implementation

```typescript
// NestJS Controller
@Post('subscription/webhook')
async handleWebhook(@Req() req: Request, @Res() res: Response) {
  // 1. Verify webhook signature
  const webhookSignature = req.headers['x-razorpay-signature'];
  const isValid = Razorpay.validateWebhookSignature(
    JSON.stringify(req.body),
    webhookSignature,
    process.env.RAZORPAY_WEBHOOK_SECRET
  );

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // 2. Process event (idempotent — use event_id for dedup)
  const event = req.body;
  const eventId = event.event_id; // Store to prevent duplicate processing

  // 3. Route to handler
  switch (event.event) {
    case 'subscription.charged':
      await this.handleSubscriptionCharged(event.payload);
      break;
    case 'subscription.halted':
      await this.handleSubscriptionHalted(event.payload);
      break;
    // ... other cases
  }

  // 4. Always return 200 quickly (Razorpay retries on non-2xx)
  return res.status(200).json({ received: true });
}
```

## 10.6 Failed Payment Handling

```
Payment fails (e.g., insufficient balance, UPI timeout)
     │
     ├─ Failure 1: Razorpay auto-retries after 3 days
     │     └─ In-app banner: "Payment failed. Please update your payment method."
     │
     ├─ Failure 2: Razorpay auto-retries after 3 more days
     │     └─ Email: "Your OptionKart subscription is at risk. Update payment →"
     │
     └─ Failure 3: Subscription status → HALTED
           └─ Email: "Your Pro subscription has been paused due to payment failure.
                      Renew now to keep your data."
           └─ In-app: Hard gate on all paid features
           └─ Data: Retained for 30 days, then watchlist/alerts archived
```

## 10.7 Upgrade / Downgrade Flows

### Upgrade (Free → Starter, Starter → Pro, etc.)

1. Create new subscription with higher plan
2. If mid-cycle, Razorpay prorates automatically
3. Immediate access to new features
4. Old subscription cancelled (if any)

### Downgrade (Pro → Starter)

1. User requests downgrade
2. Current plan active until end of billing cycle
3. At renewal: new (lower) plan activates
4. Excess watchlist items / alerts → keep but disable beyond new limit
5. Historical data access reduces to new plan level

### Cancellation

1. User requests cancellation
2. Plan remains active until `current_period_end`
3. 72 hours before expiry: "Your Pro plan expires in 3 days. Renew?"
4. On expiry: Downgrade to Free; retain account and data

## 10.8 Refund Policy

- Refunds within **48 hours** of charge: Full refund, no questions asked
- Refunds after 48 hours: Pro-rated refund at discretion
- Annual plans: Refund for unused months if cancelled within 30 days
- Process: Razorpay `refund.create` API → log in payments table → email confirmation
- Display refund policy clearly on pricing page and checkout

---

# 11. Security & Compliance

## 11.1 Data Security Practices

| Layer                 | Measure                                                         |
| --------------------- | --------------------------------------------------------------- |
| Transport             | TLS 1.3 everywhere (HTTPS enforced)                             |
| Authentication        | JWT (RS256) with 15-min access token + 7-day refresh token      |
| Password              | No passwords stored (magic link + OAuth only)                   |
| API keys (BYO OpenAI) | AES-256 encrypted at rest; never logged; never sent to client   |
| Database              | Encrypted at rest (Neon/Atlas default); encrypted connections   |
| Secrets               | Environment variables via Railway/Vercel; never in code         |
| PII                   | Minimal collection: email, name only; no financial account data |
| Sessions              | HttpOnly, Secure, SameSite=Strict cookies                       |

## 11.2 API Protection

| Threat                | Mitigation                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| DDoS                  | Cloudflare or Vercel Edge (built-in DDoS protection)                       |
| Brute force auth      | Rate limit: 5 magic link requests per email per hour                       |
| API abuse             | Tiered rate limiting (see Section 7.4.3)                                   |
| Injection (SQL/NoSQL) | Parameterised queries (TypeORM/Prisma); input validation (class-validator) |
| XSS                   | React auto-escapes; CSP headers; no dangerouslySetInnerHTML                |
| CSRF                  | SameSite cookies; CSRF tokens for state-changing operations                |
| Webhook spoofing      | Razorpay signature verification (HMAC-SHA256)                              |
| Data scraping         | Rate limiting + bot detection (User-Agent analysis)                        |

## 11.3 Abuse Prevention

- **Free tier abuse (multiple accounts):** Rate limit by IP for anonymous users; track device fingerprint
- **AI query abuse:** Hard daily cap per user; monitor for automated requests
- **Alert spam:** Maximum alert evaluation frequency; debounce rapid triggers
- **Scraping prevention:** No bulk data export on free tier; watermark exported data

## 11.4 Financial Disclaimers (CRITICAL)

OptionKart is an **analytics platform, NOT an investment adviser**. This distinction is legally critical under SEBI regulations.

### Required Disclaimers (Display prominently)

**On every page (footer):**

> "OptionKart is a data analytics tool. The information provided is for educational and informational purposes only. It does not constitute financial advice, investment advice, or trading advice. Trading in options involves substantial risk of loss and is not suitable for all investors. Past data does not guarantee future results."

**On AI-generated content:**

> "This analysis is generated by AI based on publicly available market data. It is not a recommendation to buy, sell, or hold any security. Always consult a SEBI-registered investment adviser before making trading decisions."

**On Strategy Suggester:**

> "Strategy suggestions are educational examples based on current market data. They are not trading recommendations. Please evaluate all risks and consult a qualified financial adviser."

**Checkout page:**

> "OptionKart provides data analytics tools, not financial advisory services. By subscribing, you acknowledge that trading decisions are solely your responsibility."

### SEBI Compliance Considerations

| Requirement           | OptionKart Status                                                                | Action                                                                   |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| SEBI RIA registration | **Not required** — we provide data analytics, not personalised investment advice | Ensure no features cross into "personalised advice" territory            |
| AI disclosure         | Required if providing advisory services                                          | Add clear AI disclosure in all AI-generated content                      |
| Disclaimers           | Required on all financial data                                                   | Implemented (see above)                                                  |
| Data accuracy         | Must not mislead                                                                 | Show data source, timestamp, and "delayed by X seconds" where applicable |
| User data protection  | IT Act, 2000 + DPDP Act, 2023                                                    | Privacy policy, data retention limits, user data deletion                |

### Legal Documents Required

1. **Terms of Service** — User agreement, liability limitations
2. **Privacy Policy** — Data collection, usage, retention, deletion rights
3. **Refund Policy** — Clear cancellation and refund terms
4. **Disclaimer** — Not SEBI-registered, not financial advice
5. **Cookie Policy** — If using analytics cookies

> **⚠️ IMPORTANT:** Consult a fintech lawyer in India before launch to review all disclaimers and ensure compliance with current SEBI regulations, IT Act, and DPDP Act 2023.

---

# 12. Analytics & Tracking

## 12.1 Recommended Tool Stack

| Purpose        | Tool                           | Rationale                                                                                      |
| -------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Web analytics  | Plausible Analytics or PostHog | Privacy-friendly, no cookie consent needed (Plausible); PostHog for advanced product analytics |
| Event tracking | PostHog                        | Custom events, funnels, session replay                                                         |
| Error tracking | Sentry                         | Error monitoring with stack traces                                                             |
| Uptime         | UptimeRobot or Better Uptime   | Free tier available                                                                            |
| Heatmaps       | PostHog (built-in)             | See where users click/scroll                                                                   |

## 12.2 Event Taxonomy

### Core Events

| Event Name         | Properties                 | Trigger                         |
| ------------------ | -------------------------- | ------------------------------- |
| `page_view`        | `page_name`, `user_plan`   | Every page navigation           |
| `dashboard_loaded` | `index`, `load_time_ms`    | Dashboard renders with data     |
| `index_switched`   | `from_index`, `to_index`   | User switches Nifty / BankNifty |
| `expiry_changed`   | `from_expiry`, `to_expiry` | User changes expiry selector    |
| `chain_expanded`   | `strike_count_shown`       | User expands options chain      |
| `heatmap_viewed`   | `index`, `timeframe`       | User opens heatmap              |

### Engagement Events

| Event Name                   | Properties                             | Trigger                     |
| ---------------------------- | -------------------------------------- | --------------------------- |
| `watchlist_add`              | `strike`, `option_type`, `count_total` | User adds to watchlist      |
| `watchlist_remove`           | `strike`, `option_type`                | User removes from watchlist |
| `alert_created`              | `alert_type`, `count_total`            | User creates alert          |
| `alert_triggered`            | `alert_type`, `delivery_channel`       | Alert fires                 |
| `ai_query_sent`              | `query_length`, `user_plan`            | User sends AI question      |
| `ai_query_rated`             | `rating` (thumbs up/down)              | User rates AI response      |
| `strategy_suggestion_viewed` | `strategy_type`                        | User views strategy card    |
| `chart_interacted`           | `chart_type`, `timeframe`              | User hovers/zooms chart     |

### Conversion Events

| Event Name            | Properties                                | Trigger                      |
| --------------------- | ----------------------------------------- | ---------------------------- |
| `signup_started`      | `method` (magic_link/google)              | User begins sign-up          |
| `signup_completed`    | `method`                                  | User successfully registers  |
| `paywall_hit`         | `feature`, `user_plan`                    | User encounters feature gate |
| `pricing_page_viewed` | `source` (paywall/nav/cta)                | User opens pricing page      |
| `checkout_started`    | `plan`, `billing_cycle`                   | User initiates checkout      |
| `checkout_completed`  | `plan`, `billing_cycle`, `payment_method` | Payment succeeds             |
| `checkout_abandoned`  | `plan`, `step_abandoned`                  | User exits checkout          |
| `upgrade_completed`   | `from_plan`, `to_plan`                    | User upgrades                |
| `churn_initiated`     | `plan`, `reason` (if collected)           | User starts cancellation     |

### System Events

| Event Name            | Properties                              | Trigger                      |
| --------------------- | --------------------------------------- | ---------------------------- |
| `api_error`           | `endpoint`, `status_code`, `error_type` | API returns error            |
| `upstox_fetch_failed` | `endpoint`, `error`                     | Upstox API call fails        |
| `data_staleness`      | `age_seconds`                           | Data older than 5 min served |
| `rate_limit_hit`      | `user_plan`, `endpoint`                 | User hits rate limit         |

## 12.3 Key Funnels to Track

### Funnel 1: Visitor → Registered User

```
Landing Page → View Dashboard → Sign Up Started → Sign Up Completed
Expected: 100% → 40% → 10% → 8%
```

### Funnel 2: Free → Paid

```
Registered → Paywall Hit → Pricing Viewed → Checkout Started → Checkout Completed
Expected: 100% → 60% → 30% → 15% → 4%
```

### Funnel 3: AI Engagement

```
AI Tab Opened → First Query Sent → Query Rated → 5th Query (Limit Hit) → Upgrade
Expected: 100% → 70% → 40% → 25% → 5%
```

## 12.4 North Star Metrics

| Metric                        | Target                           | Measured by                                |
| ----------------------------- | -------------------------------- | ------------------------------------------ |
| **Weekly Active Users (WAU)** | Growing 10% WoW (first 6 months) | Unique users with ≥1 dashboard_loaded/week |
| **Paid conversion rate**      | 4-6% of registered users         | checkout_completed / signup_completed      |
| **7-day retention**           | >30%                             | Users returning within 7 days of signup    |
| **NPS**                       | >40                              | Quarterly in-app survey                    |
| **MRR growth**                | 15-20% MoM (first year)          | Razorpay dashboard                         |

---

# 13. Go-To-Market Strategy

## 13.1 SEO Strategy

### Target Keywords (High Intent, Low-Medium Competition)

| Keyword                        | Monthly Volume (Est.) | Difficulty | Priority |
| ------------------------------ | --------------------- | ---------- | -------- |
| nifty option chain analysis    | 5,000-10,000          | Medium     | P0       |
| bank nifty OI data             | 2,000-5,000           | Low        | P0       |
| nifty PCR live                 | 3,000-8,000           | Medium     | P0       |
| options trading tools india    | 1,000-3,000           | Medium     | P1       |
| OI analysis tool               | 1,000-2,000           | Low        | P0       |
| max pain nifty today           | 5,000-10,000          | Low        | P0       |
| nifty support resistance today | 3,000-5,000           | Medium     | P1       |
| options strategy builder india | 500-1,000             | Low        | P2       |
| nifty sentiment analysis       | 1,000-2,000           | Low        | P1       |

### Content Pages (SEO Landing Pages)

1. **`/nifty-pcr-live`** — Live PCR with historical chart (evergreen traffic magnet)
2. **`/nifty-max-pain`** — Live Max Pain calculation
3. **`/bank-nifty-oi-analysis`** — BankNifty-specific analysis
4. **`/nifty-option-chain`** — Simplified option chain view
5. **`/options-trading-guide`** — Beginner's guide (long-form SEO content)
6. **`/blog`** — Weekly market analysis posts

### Technical SEO Checklist

- [ ] Next.js SSR/ISR for all data pages (Googlebot sees content)
- [ ] Structured data (JSON-LD) for financial data pages
- [ ] Open Graph meta tags for social sharing
- [ ] Sitemap.xml generated dynamically
- [ ] robots.txt configured properly
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Internal linking between all data pages
- [ ] FAQ schema markup on guide pages

## 13.2 YouTube Strategy

### Content Calendar (First 3 Months)

| Week | Video Type      | Example Title                                                |
| ---- | --------------- | ------------------------------------------------------------ |
| 1    | Launch video    | "I Built a Free Options Analysis Tool for Indian Traders"    |
| 2    | Tutorial        | "How to Read Options Chain Like a Pro (Using OptionKart)"    |
| 3    | Daily analysis  | "Nifty Weekly Analysis: OI Data + AI Insights - 21 Apr 2026" |
| 4    | Educational     | "What is Put-Call Ratio? PCR Complete Guide for Beginners"   |
| 5    | Tool comparison | "OptionKart vs Sensibull vs Opstra: Honest Comparison"       |
| 6-12 | Mix of above    | Daily/weekly market analysis + tutorials                     |

### YouTube Growth Tactics

- Post **daily pre-market analysis** (5-min Shorts) → captures intent search
- Cross-post to **Instagram Reels** and **Twitter/X**
- Community tab: Daily polls ("Nifty bullish or bearish today?")
- End screens: "Try the free dashboard →"
- YouTube description: SEO-optimised with all target keywords

## 13.3 Telegram/Discord Growth

### Telegram Channel: "@OptionKartSignals"

**Content (daily):**

- 9:00 AM — Pre-market brief (free teaser from AI daily brief)
- 12:00 PM — Mid-day OI update
- 3:45 PM — End-of-day summary
- Weekly — "Pro Insight of the Week" (full analysis, drives upgrades)

**Growth tactics:**

- Pin on YouTube videos: "Join Telegram for daily signals"
- Cross-promote in existing trading Telegram groups (with permission)
- Run contests: "Best trade analysis of the week wins 1 month Pro"

### Discord Community (Stage 3+)

- Channels: #general, #nifty-analysis, #banknifty, #ai-insights, #feature-requests
- Bots: Real-time alert mirror, PCR updates
- Weekly voice sessions: "Options Analysis Live with OptionKart"

## 13.4 Early Traction Strategy (First 30 Days)

| Day   | Action                                                   | Goal        |
| ----- | -------------------------------------------------------- | ----------- |
| 1-3   | Soft launch on Twitter/X and Reddit (r/IndianStreetBets) | 100 users   |
| 4-7   | Post launch story on Indie Hackers, HackerNews           | 300 users   |
| 7-10  | YouTube launch video + first tutorial                    | 500 users   |
| 10-15 | Start daily Telegram posts + YouTube Shorts              | 1,000 users |
| 15-20 | Reach out to trading finance YouTubers for reviews       | 1,500 users |
| 20-25 | Run Twitter Space: "Building a Trading Tool in Public"   | 2,000 users |
| 25-30 | Launch Product Hunt (coordinate upvotes)                 | 2,500 users |

## 13.5 Broker Affiliate Strategy

| Broker    | Program          | Commission           | Integration                                |
| --------- | ---------------- | -------------------- | ------------------------------------------ |
| Upstox    | Referral program | ₹200-600 per account | "Open Upstox account to trade signals" CTA |
| Zerodha   | Referral program | ₹300 per account     | Link in content                            |
| Angel One | Affiliate        | ₹500+ per account    | Banner ads for free users                  |
| Groww     | Referral         | ₹200 per account     | Content integration                        |

**Estimated affiliate revenue:** 100 conversions/mo × ₹400 avg = ₹40,000/mo (passive)

---

# 14. Competitive Positioning

## 14.1 Detailed Competitive Matrix

| Feature                | OptionKart       | Sensibull                | Opstra               | Strike.money |
| ---------------------- | ---------------- | ------------------------ | -------------------- | ------------ |
| **Pricing (entry)**    | ₹0 (free tier)   | ₹0-800/mo                | ₹0-1,300/mo          | ₹0-500/mo    |
| **Options Chain View** | ✅ Simplified    | ✅ Standard              | ✅ Advanced          | ✅ Standard  |
| **OI Analysis**        | ✅ + Heatmap     | ✅ Basic                 | ✅ Deep              | ✅ Basic     |
| **PCR Analysis**       | ✅ + History     | ✅                       | ✅ + Deep            | ✅           |
| **Max Pain**           | ✅ Live          | ✅                       | ✅                   | ✅           |
| **Strategy Builder**   | ✅ AI-powered    | ✅ Manual                | ✅ Manual            | ✅ Basic     |
| **Backtesting**        | ✅ (Stage 5)     | ❌                       | ✅ (EOD + Intra PRO) | ❌           |
| **AI Chat / Insights** | ✅ Native        | ❌                       | ❌                   | ❌           |
| **AI Market Brief**    | ✅ Daily         | ❌                       | ❌                   | ❌           |
| **Alerts**             | ✅ Multi-channel | ✅ Basic                 | ✅                   | ✅           |
| **Mobile Experience**  | ✅ Mobile-first  | ⚠️ Adequate              | ❌ Poor              | ⚠️ Adequate  |
| **Broker Integration** | Analytics-only   | ✅ Deep (trade from app) | ⚠️ Limited           | ✅ Basic     |
| **API Access**         | ✅ (Stage 5)     | ❌                       | ❌                   | ❌           |
| **Community Features** | ✅ (Stage 5)     | ❌                       | ❌                   | ❌           |
| **India VIX Analysis** | ✅               | ✅                       | ✅                   | ✅           |
| **Stock Options**      | Future           | ✅                       | ✅                   | ✅           |
| **Paper Trading**      | ✅ (Stage 5)     | ✅                       | ✅                   | ❌           |

## 14.2 Competitive Gaps to Exploit

### Gap 1: No AI-Powered Insights (BIGGEST OPPORTUNITY)

- **Current state:** Zero competitors offer AI-driven market analysis
- **OptionKart advantage:** GPT-powered chat that explains OI data in plain English
- **Why competitors can't easily copy:** Requires prompt engineering expertise, cost management infrastructure, and product thinking about how to surface AI naturally

### Gap 2: Poor Mobile Experience

- **Current state:** Opstra is unusable on mobile; Sensibull is adequate but not mobile-first
- **OptionKart advantage:** Designed mobile-first from day one
- **Why it matters:** 70%+ of Indian retail traders primarily use mobile devices

### Gap 3: Pricing Gap Between Free and ₹800+/mo

- **Current state:** Sensibull jumps from free (crippled) to ₹800/mo; Opstra from free to ₹1,300/mo
- **OptionKart advantage:** Progressive pricing at ₹199/₹499/₹999 with a genuinely useful free tier
- **Why it matters:** Indian retail traders are price-sensitive; ₹199 is an impulse purchase

### Gap 4: Beginner Friendliness

- **Current state:** All tools assume some level of options knowledge
- **OptionKart advantage:** Signal-first design (🟢🟡🔴) → anyone can understand; AI explains "why"
- **Why it matters:** The fastest-growing segment is beginner traders (SEBI data shows massive new entrants)

### Gap 5: Community & Social Features

- **Current state:** None of the competitors have community features
- **OptionKart advantage:** Trade ideas feed, leaderboards, discussions create network effects
- **Why it matters:** Network effects create switching costs; community = moat

## 14.3 Positioning Statement

**For** Indian retail traders **who** want to make better options trading decisions,
**OptionKart** is the **AI-powered options analytics platform** that
**transforms complex market data into simple, actionable signals.**
Unlike **Sensibull and Opstra,** OptionKart **uses AI to explain what the data means**
and is designed **mobile-first with progressive pricing starting free.**

---

# 15. Execution Roadmap

## 15.1 Sprint-Wise Breakdown (MVP — Weeks 1-2)

### Sprint 1 (Week 1): Foundation + Core Data

| Day | Task                                                       | Output                      |
| --- | ---------------------------------------------------------- | --------------------------- |
| Mon | Project setup: Next.js, NestJS, DB connections             | Boilerplate running locally |
| Mon | Upstox API integration: Auth + option chain fetch          | Working API calls           |
| Tue | Data pipeline: Cron job to fetch + cache in Redis          | Data flowing every 3 min    |
| Tue | Backend: PCR, Max Pain, Sentiment calculations             | Computed metrics API        |
| Wed | API: `/market/dashboard/{index}` + `/market/chain/{index}` | Working REST endpoints      |
| Wed | Frontend: Dashboard layout (mobile-first)                  | Static layout               |
| Thu | Frontend: Connect to API, display live data                | Dynamic dashboard           |
| Thu | Frontend: Options chain table component                    | Working chain view          |
| Fri | Frontend: Polish, dark theme, loading states               | Styled MVP                  |
| Fri | SEO: Meta tags, OG images, landing page copy               | SEO-ready                   |

### Sprint 2 (Week 2): Polish + Launch

| Day | Task                                                   | Output                  |
| --- | ------------------------------------------------------ | ----------------------- |
| Mon | Edge cases: market closed, API failure, holidays       | Robust error handling   |
| Mon | Data: Auto-refresh (3-min polling on client)           | Live updating dashboard |
| Tue | Landing page: Hero, features, FAQ sections             | Marketing page          |
| Tue | SEO: Sitemap, structured data, page speed optimisation | Google-ready            |
| Wed | Testing: Manual QA on mobile + desktop                 | Bug fixes               |
| Wed | Production deploy: Vercel (FE) + Railway (BE)          | Live on optionkart.com  |
| Thu | Monitoring: Sentry setup, uptime checks                | Observability           |
| Thu | Analytics: Plausible/PostHog setup, core events        | Tracking live           |
| Fri | **🚀 Soft launch: Twitter, Reddit, Telegram**          | Users!                  |
| Fri | Collect feedback, prioritise for Stage 2               | Feedback pipeline       |

## 15.2 Stage 2 Breakdown (Weeks 3-8)

| Week | Focus                    | Key Deliverables                                       |
| ---- | ------------------------ | ------------------------------------------------------ |
| 3    | Authentication           | Magic link + Google OAuth; user model; JWT             |
| 4    | Watchlist + Data storage | Watchlist CRUD; 5-min snapshots to MongoDB             |
| 5    | Charts                   | OI trend charts; PCR history; chart components         |
| 6    | Alerts                   | Alert CRUD; evaluation engine; in-app notifications    |
| 7    | Payments                 | Razorpay integration; subscription lifecycle; webhooks |
| 8    | Feature gating + Polish  | Plan-based feature flags; paywall UIs; testing         |

## 15.3 Stage 3-5 High-Level Timeline

| Month | Stage      | Key Milestones                                          |
| ----- | ---------- | ------------------------------------------------------- |
| 3     | Core (3a)  | OI Heatmap, Smart Money indicators                      |
| 4     | Core (3b)  | Multi-expiry analysis, advanced dashboard, Telegram bot |
| 5     | AI (4a)    | AI Chat MVP, market sentiment queries                   |
| 6     | AI (4b)    | Strategy Suggester, daily AI Brief, BYO key option      |
| 7-8   | Scale (5a) | Backtesting engine, multi-index expansion               |
| 9-10  | Scale (5b) | Community features, leaderboard                         |
| 11-12 | Scale (5c) | Public API, stock options, mobile app consideration     |

---

# 16. Team & Resource Requirements

## 16.1 Solo Developer Path (Months 1-4)

Viable if founder is a **full-stack developer** comfortable with:

- Next.js + NestJS
- PostgreSQL + MongoDB + Redis
- Razorpay integration
- Basic DevOps (Vercel + Railway)

**Workload:** 60-80 hours/week to hit the 2-week MVP timeline

**Outsource:**

- Logo and brand identity (₹5,000-15,000 on Fiverr/Dribbble)
- Legal review of disclaimers and ToS (₹10,000-25,000)

## 16.2 Small Team (2-3 people, Months 4-8)

| Role                 | Responsibility                           | Hiring Priority                   |
| -------------------- | ---------------------------------------- | --------------------------------- |
| Founder (Full-stack) | Backend, data pipeline, AI, architecture | Already onboard                   |
| Frontend Developer   | Dashboard UI, charts, responsive design  | P0 — Month 4                      |
| Content Creator      | YouTube, Telegram, SEO content           | P1 — Month 3-4 (can be part-time) |

## 16.3 Growth Team (4-6 people, Months 8-12)

| Role              | Responsibility                           | When     |
| ----------------- | ---------------------------------------- | -------- |
| Backend Developer | Backtesting engine, API layer, scaling   | Month 8  |
| Designer (UI/UX)  | Dashboard redesign, mobile optimisation  | Month 8  |
| Community Manager | Telegram, Discord, social media, support | Month 9  |
| Marketing Lead    | SEO, partnerships, affiliate management  | Month 10 |

## 16.4 Monthly Burn Rate Estimates

| Phase                   | Team             | Infra   | Tools  | Total             |
| ----------------------- | ---------------- | ------- | ------ | ----------------- |
| Solo (Months 1-3)       | ₹0 (founder)     | ₹2,000  | ₹1,000 | ₹3,000/mo         |
| Small team (Months 4-6) | ₹50,000-80,000\* | ₹5,000  | ₹3,000 | ₹60,000-90,000/mo |
| Growth (Months 8-12)    | ₹2-3L            | ₹15,000 | ₹5,000 | ₹2.5-3.5L/mo      |

_Assumes freelance/part-time hires initially, not full-time salaries_

---

# 17. Risks & Mitigation

## 17.1 Technical Risks

| Risk                         | Probability | Impact                    | Mitigation                                                                                                                       |
| ---------------------------- | ----------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Upstox API downtime**      | Medium      | High — no data to show    | Cache 15+ min of data; implement fallback to NSE website scraping (legal grey area — use sparingly); consider multi-broker API   |
| **Upstox API rate limiting** | High        | Medium — stale data       | Efficient polling (only fetch what's needed); shared API credentials for read-only data; upgrade to Upstox premium API if needed |
| **Upstox API policy change** | Low         | Critical — breaks product | Abstract data source behind interface; can swap to Zerodha/Angel APIs; keep 1-2 weeks of cached data                             |
| **Redis/DB failure**         | Low         | High — site unusable      | Managed services (Upstash/Neon) with auto-backups; health checks; circuit breakers                                               |
| **OpenAI API cost spike**    | Low         | Medium — margin impact    | Token limits per query; model routing (cheap model for simple queries); BYO key option absorbs cost                              |

## 17.2 Business Risks

| Risk                              | Probability | Impact                        | Mitigation                                                                                             |
| --------------------------------- | ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Low conversion (free → paid)**  | Medium      | High — no revenue             | Optimise paywall placement; A/B test pricing; ensure free tier delivers "aha moment"                   |
| **High churn**                    | Medium      | High — MRR erosion            | Weekly engagement emails; feature drip; exit surveys to understand why                                 |
| **SEBI regulatory action**        | Low         | Critical — product banned     | Stay strictly in "analytics" lane; never give personalised advice; prominent disclaimers; legal review |
| **Competitor copies AI features** | Medium      | Medium — competitive pressure | Move fast; build brand + community (network effects are hard to copy); deepen AI integration           |
| **Data accuracy complaints**      | Medium      | High — trust loss             | Show source + timestamp always; "delayed by X seconds" badges; comparison validation against NSE       |

## 17.3 Market Risks

| Risk                                     | Probability | Impact               | Mitigation                                                                            |
| ---------------------------------------- | ----------- | -------------------- | ------------------------------------------------------------------------------------- |
| **SEBI further restricts F&O**           | Medium      | Medium — smaller TAM | Diversify to equities analytics; position as "analysis tool" not "trading encourager" |
| **Bear market reduces trading activity** | Medium      | Low-Medium           | Analytics tools are needed in ALL markets; pivot messaging to "protect your capital"  |
| **New competitor with deep funding**     | Low         | Medium               | Build community moat; maintain price advantage; focus on India-specific needs         |

---

# 18. Appendix

## 18.1 Glossary

| Term                    | Definition                                                                 |
| ----------------------- | -------------------------------------------------------------------------- |
| OI (Open Interest)      | Total number of outstanding derivative contracts not yet settled           |
| PCR (Put-Call Ratio)    | Ratio of Put OI to Call OI; >1 = bullish, <1 = bearish                     |
| Max Pain                | Strike price where option buyers suffer maximum losses (theoretical)       |
| ATM (At The Money)      | Strike price nearest to current spot price                                 |
| IV (Implied Volatility) | Market's expectation of future price movement; derived from option premium |
| CE / PE                 | Call European / Put European (standard NSE option contracts)               |
| F&O                     | Futures & Options segment of NSE                                           |
| VIX                     | Volatility Index — measures market's expected volatility over near term    |
| Greeks                  | Delta, Gamma, Theta, Vega — measures of option price sensitivity           |

## 18.2 Reference Links

- [Upstox API v2 Documentation](https://upstox.com/developer/api-documentation/)
- [Razorpay Subscriptions API](https://razorpay.com/docs/subscriptions/)
- [SEBI Investment Advisers Regulations](https://www.sebi.gov.in/)
- [NSE F&O Data](https://www.nseindia.com/)
- [OpenAI API Pricing](https://openai.com/pricing)

## 18.3 Decision Log

| Date     | Decision                                           | Rationale                                                                          | Alternatives Considered                                                          |
| -------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Apr 2026 | PostgreSQL for users/subs, MongoDB for market data | Relational integrity for financial data; flexible schema for time-series snapshots | All-PostgreSQL (lacks flexible schema), All-MongoDB (lacks relational integrity) |
| Apr 2026 | Magic Link over password auth                      | Zero friction; no password resets; higher conversion                               | Password auth (friction), SMS OTP (costly at scale)                              |
| Apr 2026 | GPT-4o-mini as primary AI model                    | Best cost/performance ratio for structured analysis                                | GPT-4o (2x cost, marginal improvement), Claude (Anthropic, different pricing)    |
| Apr 2026 | Razorpay over Stripe                               | Better UPI support; native India payment methods; lower fees                       | Stripe (poor UPI support), Cashfree (less mature subscriptions API)              |
| Apr 2026 | BullMQ over Agenda.js                              | Better maintained; native TypeScript; superior queue features                      | Agenda.js (MongoDB-based, less scalable), node-cron (no queue management)        |

---

_This document is a living artifact. Update it as decisions are made, assumptions are validated, and the product evolves._

**Document History:**

- v1.0 — Initial PRD (reference document)
- v2.0 — Complete rewrite with deep technical, business, and strategic expansion (Apr 19, 2026)
