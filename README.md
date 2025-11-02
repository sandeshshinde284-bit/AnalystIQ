# AnalystIQ - AI Startup Investment Analysis Platform

**🏆 Google Cloud Gen AI Exchange Hackathon 2025**

## 🚀 Live Demo
- **Frontend:** [[https://analyst-iq-5b9e1.web.app](https://analyst-iq.web.app/app/new-analysis)](https://analyst-iq.web.app/)
- **Backend API:** https://analyst-iq-backend-631446553603.us-central1.run.app/api/status

## 📝 Project Overview
AI-powered platform that automatically analyzes startup pitch decks, extracts key investment metrics, and provides data-driven investment recommendations for VCs and angel investors.

### 🎯 What It Does
- Automatically analyzes startup pitch decks using AI
- Extracts key investment metrics with source verification
- Provides data-driven investment recommendations  
- Real-time risk assessment and market analysis

### 👥 Target Users
- Venture Capitalists & Angel Investors
- Investment Analysts & Due Diligence Teams
- Startup Accelerators & Incubators

## 🛠️ Tech Stack

### 🤖 AI & Machine Learning
- **Gemini AI** - Advanced language understanding
- **Document AI** - PDF content extraction
- **Vertex AI** - Enterprise ML infrastructure
- **Cloud Vision** - Chart & image analysis

### 🎨 Frontend
- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Pinia** for state management
- **Chart.js** for data visualization

### ☁️ Backend & Infrastructure
- **Cloud Run** for serverless backend
- **Firebase** (Firestore, Storage, Hosting)
- **Cloud Functions** for AI processing
- **BigQuery** for analytics

## ✨ Key Features

### 📄 Intelligent Document Processing
- PDF Upload & Analysis - Drag-and-drop interface
- Multi-format Support - PDFs, PowerPoint, Google Slides
- Real-time Processing - Live progress tracking

### 🎯 AI-Powered Metric Extraction
- Revenue Metrics - ARR, MRR, Growth Rate, Burn Rate
- Market Analysis - TAM, SAM, SOM, Competitive Landscape
- Team Assessment - Size, Experience, Domain Expertise
- Financial Health - Runway, Unit Economics, Funding History

### 🔍 Source Verification System
- Slide-Level Mapping - Exact location of each metric
- Confidence Scoring - High/Medium/Low reliability indicators
- Visual Highlighting - Click to see source in original document

### 📊 Investment Recommendation Engine
- Risk Assessment - Market, Financial, Operational, Technical
- Scoring Algorithm - 0-100 investment attractiveness score
- Comparative Analysis - Benchmark against industry standards

## 🏗️ Architecture

Built on Google Cloud's enterprise-grade AI infrastructure:
- **Scalability:** Handles thousands of analyses simultaneously
- **Speed:** 10-second AI analysis (99.6% time reduction)
- **Security:** Enterprise-grade security protocols
- **Innovation:** Advanced AI/ML services integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Cloud Account
- Firebase Project

### Installation
```bash
# Clone repository
git clone https://github.com/sandeshshinde284-bit/AnalystIQ.git
cd AnalystIQ

# Setup backend
cd backend
npm install
npm run build
gcloud run deploy --source .

# Setup frontend
cd ../frontend

📈 Impact & Solution
🔥 Problem Solved
23+ Hours Manual Work → 10-Second AI Analysis
1,000+ Deals Annually → Automated Bulk Processing
Inconsistent Evaluation → Standardized AI Scoring
Human Fatigue & Bias → Objective AI Analysis 24/7
🎯 Competitive Advantage
Superior to existing solutions (Pitchbook, Crunchbase, traditional VC tools):

Real-time pitch deck analysis vs static historical data
Automated content analysis vs manual data entry
Source verification vs no verification
AI-powered insights vs deal flow management only

🤝 Contributing
Built for Google Cloud Gen AI Exchange Hackathon 2025

📄 License
MIT License
npm install
npm run build
firebase deploy
