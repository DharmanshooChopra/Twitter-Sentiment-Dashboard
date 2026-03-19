# 🐦 AI Twitter Sentiment & Misinformation Analyst

An end-to-end Machine Learning web application designed to scrape live tweets from X (Twitter) and instantly classify their sentiment as **Positive**, **Neutral**, or **Negative** using an optimized Support Vector Machine (SVM) pipeline. 

This project features a beautiful glassmorphic UI, real-time analytics dashboards, and an automated VADER fallback mechanism to ensure 100% uptime even in strict Windows deployment environments.

---

## ✨ Key Features
- **🤖 Scikit-Learn SVM engine:** Custom-trained AI utilizing TF-IDF Vectorization across 30,000 features, carefully calibrated with a Stratified K-Fold Grid Search for probability distribution.
- **⚡ Flask REST API:** A highly-optimized Python backend that natively loads the pre-trained `.pkl` artifacts directly into RAM for lightning-fast sub-millisecond response times.
- **🌐 Live Twitter Scraping:** Fully bypasses Twitter’s official locked API by scraping live profiles and hidden timeline endpoints via RapidAPI's `Twitter241`. 
- **📈 Bulk Analyzer:** Capable of streaming up to 100 live tweets from any target user straight into the Chat UI, dynamically rendering Chart.js visualizations in real-time.
- **🛡️ NLTK VADER Failsafe:** An integrated, pure-Python Natural Language Toolkit fallback algorithm that instantly hot-swaps the AI if the operating system (e.g., Windows Defender) blocks the execution of `NumPy` or `SciPy` backend C-extension `.dll` files.

---

## 🛠️ Tech Stack
| Component | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (Glassmorphism), Vanilla JavaScript, Bootstrap 5, Chart.js |
| **Backend** | Python 3, Flask, Requests, Built-in JSON recursive parsing |
| **Machine Learning** | Scikit-Learn (SVM & Logistic Regression), Pandas, TF-IDF |
| **Natural Language Processing** | NLTK (WordNetLemmatizer, VADER, Tokenizer, Stopwords) |
| **Data Provider** | RapidAPI (Twitter241 Unofficial Proxy Endpoint) |

---

## 🚀 Setting Up the Project Locally

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/twitter-sentiment-analysis.git
cd twitter-sentiment-analysis/Code 2.0
```

### 2. Create the Virtual Environment & Install Dependencies
```bash
python -m venv .venv
# Activate the environment (Windows)
.\.venv\Scripts\activate
# Activate the environment (Mac/Linux)
source .venv/bin/activate

pip install -r requirements.txt
```
*(If `requirements.txt` is not yet available, manually install `flask`, `nltk`, `scikit-learn`, `pandas`, `requests`, and `numpy`).*

### 3. Generate the Machine Learning Models
If you want to train the AI directly from the data `Tweets.csv`, run the training pipeline:
```bash
python train_sentiment.py
```
*Depending on your CPU, this may take up to 2 minutes as it runs 18 cross-validations over the SVM framework. Once finished, a `models/` directory will be successfully created!*

### 4. Start the Application
Boot up the Flask local development server:
```bash
python app.py
```
Finally, open your web browser and navigate to exactly: **`http://127.0.0.1:5000/`**.

---

## 📂 Project Structure
```
📁 Code 2.0/
│
├── 📜 app.py                 # Core Flask Web Application & API router
├── 📜 train_sentiment.py     # ML Model training grid script
├── 📊 Tweets.csv             # The raw dataset used for training
│
├── 📁 models/                # Holds the compiled .pkl AI brains
│   ├── logreg_model.pkl
│   ├── svm_model.pkl
│   └── tfidf_vectorizer.pkl
│
├── 📁 templates/
│   └── index.html            # Main front-end UI
│
└── 📁 static/
    ├── script.js             # Async fetching, API parsing, and Chart loops
    └── style.css             # Glassmorphism and UI animations
```

---

## 💡 How the API Fallback works
If you are presenting this project in a restricted environment (like a University PC laboratory), security firewalls commonly block Python from loading Machine Learning libraries. 

If `app.py` boots up and determines the `models/` trajectory was blocked by your OS, it **smoothly catches the exception and hot-loads NLTK VADER**. VADER operates in 100% native Python dictionary rules, ensuring that your demonstration page and sentiment visualization charts always work perfectly.
