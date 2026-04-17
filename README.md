# NeuroPulse: Premium Twitter AI Sentiment System

NeuroPulse is a production-grade, triple-column web dashboard designed to conduct Deep-Learning Sentiment Analysis and Misinformation Risk detection natively on Twitter profiles and custom strings in real-time. 

## 🚀 Architecture 

1. **Frontend (Vite + React)**
   - **X-AI Reasoning:** Fully explainable AI drawers exposing triggers.
   - **Recharts Dashboard:** Live Donut-Chart visualization polling MongoDB natively.
   - **Glassmorphism UI:** Seamless deep-violet glass UI structure (`App.jsx`).

2. **Backend (Flask + Scikit-Learn)**
   - **Vectorizer Pipeline:** NLTK + SVM execution routing.
   - **In-Memory Caching:** Prevents redundant processing of the same viral tweets dynamically.
   - **Twitter API Route:** RapidAPI hooks allowing batch username scans processing 5-20 tweets independently. 

3. **Database (MongoDB Atlas)**
   - `analysis_history`: Long-term storage of user queries allowing historical aggregation.
   - `feature_vault`: An active-learning reservoir storing raw N-Dimensional Arrays (TF-IDF Vector Embeddings) waiting to be reviewed later for Model retraining cycles seamlessly.

## 🛠 Usage & Deployment 

**Local Quickstart**
1. Run `start_both.bat` to launch the API and Vite simultaneously.
2. Ensure your `.env` contains:
```bash
MONGO_URI=mongodb+srv://...
VITE_API_URL=http://127.0.0.1:5000
```
3. Visit `http://localhost:5173`.

**Production Scaling (Docker)**
Use the baked-in container orchestrator to safely scale into production across DigitalOcean, AWS EventBridge, or Render:
`docker compose up --build`
