# NEXUS — Enterprise AI Command Center

> **Five minds. One mission. Zero compromises.**

NEXUS is a **collaborative multi-agent AI system** that transforms how enterprises make decisions. When a business challenge arises, five specialized AI agents activate simultaneously — each analyzing the problem from a different lens — then synthesize their findings into an executive-grade action plan within seconds.

[![Built with Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=flat-square)](https://ai.google.dev)
[![Voice by Speechmatics](https://img.shields.io/badge/Voice-Speechmatics-FF6B35?style=flat-square)](https://speechmatics.com)
[![Deployed on Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=flat-square&logo=render)](https://nexus-frontend-ksfn.onrender.com)
[![Models by Featherless](https://img.shields.io/badge/Models-Featherless-8B5CF6?style=flat-square)](https://featherless.ai)

---

## 🎯 The Problem We Solve

Enterprise decisions suffer from **cognitive fragmentation**:

- Sales team sees an opportunity; Risk team hasn't assessed it
- Operations spots a crisis; Communications hasn't drafted a response
- Strategy proposes an initiative; Finance hasn't modeled it

The average Fortune 500 company spends **6-8 weeks** coordinating a major strategic response. NEXUS does it in **under 60 seconds**.

---

## 🧠 The Five Agents

| Agent | Role | Model | Specialty |
|-------|------|-------|-----------|
| 🔍 **Scout** | Intelligence Gathering | Featherless (Mistral-7B) | Extracts facts, identifies gaps, maps the landscape |
| 📊 **Analyst** | Deep Analysis | Gemini 2.0 Flash | Quantitative reasoning, pattern recognition, risk assessment |
| 🎯 **Strategist** | Strategic Planning | Gemini 2.0 Pro | Long-horizon thinking, competitive dynamics, strategic options |
| 📢 **Communicator** | Stakeholder Management | Gemini 2.0 Flash | Drafts communications, messaging, stakeholder maps |
| 🎭 **Orchestrator** | Synthesis & Decision | Gemini 2.0 Pro | Integrates all agent outputs into unified executive brief |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NEXUS FRONTEND                        │
│         React + Tailwind + Framer Motion                 │
│    Real-time WebSocket • Voice Input (Speechmatics)      │
└────────────────────────┬────────────────────────────────┘
                         │ WebSocket (ws://)
┌────────────────────────▼────────────────────────────────┐
│                  FastAPI Backend                          │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Scout   │  │ Analyst  │  │Strategist│  (parallel)  │
│  │Featherless│  │ Gemini   │  │  Gemini  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │              │                      │
│  ┌────▼─────┐  ┌────▼──────────────▼───────────────┐    │
│  │Communicator│  │        ORCHESTRATOR               │   │
│  │  Gemini  │  │    Synthesis + Final Brief         │   │
│  └──────────┘  └───────────────────────────────────┘   │
│                                                          │
│  Message Bus (asyncio) • Session Store (Redis)           │
└────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Vultr VM (Ubuntu 22.04)                     │
│          Nginx Reverse Proxy + Docker Compose            │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Local)

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone & Configure

```bash
git clone https://github.com/YOUR_USERNAME/nexus-enterprise-ai
cd nexus-enterprise-ai
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

### 3. Access

- Frontend: <http://localhost:3000>
- API Docs: <http://localhost:8000/docs>
- WebSocket: ws://localhost:8000/ws

---

## 🔑 Required API Keys

| Service | Key | Get It |
|---------|-----|--------|
| Google Gemini | `GEMINI_API_KEY` | [ai.google.dev](https://ai.google.dev) |
| Speechmatics | `SPEECHMATICS_API_KEY` | [speechmatics.com](https://speechmatics.com) |
| Featherless | `FEATHERLESS_API_KEY` | [featherless.ai](https://featherless.ai) |

---

## 🖥️ Demo Scenarios

Try these inputs to see NEXUS in action:

1. **Crisis Response**: *"Our largest client ($2M ARR) just sent a termination notice citing slow support response times and feature gaps vs competitors. We have 30 days before contract end."*

2. **Growth Opportunity**: *"We've been approached by a Series B startup in our space looking for an acqui-hire. 40 engineers, strong ML team, $8M ARR, asking $45M."*

3. **Operational Issue**: *"Our cloud costs jumped 340% this month due to an engineering incident. Board meeting is in 72 hours. What do we do?"*

---

## 📁 Project Structure

```
nexus/
├── backend/               # FastAPI Python backend
│   ├── agents/            # Five AI agents
│   ├── core/              # Message bus, models, config
│   ├── services/          # API integrations (Gemini, Featherless, Speechmatics)
│   └── main.py            # App entry point
├── frontend/              # React frontend
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/         # Custom hooks (WebSocket, Voice)
│       └── App.jsx        # Main application
├── deployment/            # Vultr deployment scripts
├── docker-compose.yml
└── .env.example
```

---

## 🏆 Hackathon Tracks

- **Enterprise Utility**: Solves the #1 enterprise problem — slow, fragmented decision-making
- **Collaborative Systems**: Five specialized agents with distinct roles, knowledge sharing via message bus

---

## 📊 Judging Criteria Coverage

| Criteria | How NEXUS Addresses It |
|----------|------------------------|
| Application of Technology | Gemini Pro/Flash, Featherless Mistral, Speechmatics real-time voice, Vultr deployment |
| Presentation | Live voice-to-decision demo; real-time agent visualization |
| Business Value | Reduces strategic response time from weeks to seconds; applicable to any enterprise |
| Originality | First system to externalize enterprise cognitive fragmentation as parallel AI agents |

---

## 👥 The Team

Built at AI Agent Olympics Hackathon @ AI WEEK 2026

---

*NEXUS — Because great decisions shouldn't wait for the next meeting.*
