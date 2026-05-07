# NeuroPulse 2.0: 10-Model Ensemble AI Sentiment & Misinformation System

NeuroPulse is a production-grade web dashboard designed to conduct Deep-Learning Sentiment Analysis and Misinformation Risk detection natively on Twitter profiles and custom strings in real-time. **Version 2.0** introduces a powerful **10-Model Parallel Inference Engine** alongside **Gemini 2.5 Flash Fact-Checking**.

## 🚀 Architecture 

1. **Frontend (Vite + React)**
   - **X-AI Reasoning:** Fully explainable AI drawers exposing triggers and keyword features.
   - **Recharts Dashboard:** Live Donut-Chart visualization polling MongoDB natively.
   - **Glassmorphism UI:** Seamless deep-violet glass UI structure with dynamic model capability badges.

2. **Backend (Flask + Concurrent.futures)**
   - **10-Model Parallel Inference:** Runs 10 models concurrently to reach a high-confidence consensus sentiment:
     - **Classic ML:** SVM, Logistic Regression, Random Forest, XGBoost, Naive Bayes.
     - **Deep Learning:** BiLSTM, 1D-CNN.
     - **Transformers:** DistilBERT, BERT (Multilingual), RoBERTa (Twitter).
   - **Misinformation Detection:** Dedicated XGBoost pipeline to flag high-risk out-of-distribution text.
   - **Gemini Fact-Checking:** Auto-triggers **Gemini 2.5 Flash** with Google Search Grounding to fact-check tweets flagged for high misinformation risk and provide source URLs.
   - **Twitter API Route:** RapidAPI hooks allowing batch username scans processing 5-20 tweets independently. 

3. **Database (MongoDB Atlas)**
   - `analysis_history`: Long-term storage of user queries allowing historical aggregation.
   - `feature_vault`: An active-learning reservoir storing raw N-Dimensional Arrays (TF-IDF Vector Embeddings) waiting to be reviewed later for Model retraining cycles seamlessly.

## 🛠 Usage & Deployment 

**Local Quickstart**
1. Run `start_both.bat` to launch the Flask API and Vite Frontend simultaneously.
2. Ensure your `.env` contains the required keys:
```bash
MONGO_URI=mongodb+srv://...
VITE_API_URL=http://127.0.0.1:5000
GEMINI_API_KEY=your_gemini_api_key_here
```
3. Visit `http://localhost:5173`.

**Production Scaling (Docker)**
Use the baked-in container orchestrator to safely scale into production across DigitalOcean, AWS EventBridge, or Render:
```bash
docker compose up --build
```
