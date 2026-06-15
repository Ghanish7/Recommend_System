# CineMatch – AI Movie Recommender System

CineMatch is a full-stack AI-powered movie recommender system that recommends movies using **Collaborative Filtering (User-Based and Item-Based)**, **Content-Based Filtering (Genre Similarity)**, and a **Hybrid Model**. The application is built on top of the MovieLens Small Dataset (~100,000 ratings on 9,000 movies).

---

## Features
1. **Home Page**: Interactive hero section detailing recommendation logic alongside 6 popular trending movies.
2. **User Selection**: Preview ratings history/watchlist for any of the first 50 mock users.
3. **Recommendations Dashboard**:
   - **Split View**: Side-by-side comparison of **Collaborative Filtering** (User-Based or Item-Based) and **Content-Based Filtering** ("Because you liked..." seed selector).
   - **Hybrid View**: Blends both collaborative and content insights into a unified list.
   - Interactive search and genre-tag filtering.
4. **Movie Details**: Full metadata, average rating metrics, and 6 similar content-based movie recommendations. Deep links are fully shareable (e.g. `http://localhost:5173/#movie/31`).
5. **Evaluation Dashboard**: Visualizes Precision@10, Recall@10, F1-Score, and RMSE for all algorithms using interactive Recharts bar charts and tables.

---

## Tech Stack
* **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons, Recharts
* **Backend**: Python (FastAPI), Uvicorn
* **ML Libraries**: Pandas, NumPy, Scikit-Learn, SciPy

---

## Setup & Run Instructions

### 1. Prerequisites
- Python 3.11 or newer
- Node.js v22 or newer (A portable Node installation has been downloaded to `/node-portable`)

### 2. Run the Backend
Navigate to the root workspace and run the FastAPI server:
```bash
pip install fastapi uvicorn pandas numpy scikit-learn scipy requests
python backend/main.py
```
The backend server will run on `http://127.0.0.1:8000`. On startup, it will automatically download the MovieLens dataset from GroupLens, extract it to `/backend/data`, and pre-compute similarity matrices and evaluation metrics.

### 3. Run the Frontend
Navigate to the `/frontend` directory and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`. Open it in your browser.

---

## Algorithmic Details

1. **User-Based Collaborative Filtering**:
   - Centers ratings and computes user-user cosine similarity.
   - Selects top-20 similar users to predict ratings on unrated movies using a weighted average.
2. **Item-Based Collaborative Filtering**:
   - Computes item-item cosine similarity.
   - Projects ratings for unrated movies based on the user's ratings for similar items.
3. **Content-Based Filtering**:
   - Uses TF-IDF representation of movie genres.
   - User profile vector is built by averaging the TF-IDF vectors of movies they rated highly (rating > 3.0), weighted by their rating score.
   - Ranks unrated movies by their cosine similarity to this user profile.
4. **Hybrid Model**:
   - Blends User-Based CF and Content-Based Profile predictions by normalizing and taking a 50/50 weighted average of both scores.
