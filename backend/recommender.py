import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

class MovieRecommender:
    def __init__(self, movies_df, ratings_df):
        self.movies_df = movies_df.copy()
        self.ratings_df = ratings_df.copy()
        
        # Ensure correct types
        self.movies_df['movieId'] = self.movies_df['movieId'].astype(int)
        self.ratings_df['movieId'] = self.ratings_df['movieId'].astype(int)
        self.ratings_df['userId'] = self.ratings_df['userId'].astype(int)
        self.ratings_df['rating'] = self.ratings_df['rating'].astype(float)
        
        self._prepare_data()
        
    def _prepare_data(self):
        # 1. Build User-Item Matrix
        self.user_item_matrix = self.ratings_df.pivot(index='userId', columns='movieId', values='rating')
        # Mean ratings for centering (optional, helpful for centering User-Based CF)
        self.user_means = self.user_item_matrix.mean(axis=1)
        
        # User-item filled with 0 for similarity computations
        self.user_item_filled = self.user_item_matrix.fillna(0)
        
        # 2. Compute User-User Cosine Similarity
        self.user_similarity = cosine_similarity(self.user_item_filled)
        # Convert to DataFrame for easier lookup
        self.user_similarity_df = pd.DataFrame(
            self.user_similarity, 
            index=self.user_item_filled.index, 
            columns=self.user_item_filled.index
        )
        
        # 3. Compute Item-Item Cosine Similarity
        self.item_item_matrix = self.user_item_filled.T
        self.item_similarity = cosine_similarity(self.item_item_matrix)
        self.item_similarity_df = pd.DataFrame(
            self.item_similarity,
            index=self.item_item_matrix.index,
            columns=self.item_item_matrix.index
        )
        
        # 4. Content-Based features: one-hot or TF-IDF on genre string
        # Clean genres string (replace '|' with ' ')
        self.movies_df['genres_clean'] = self.movies_df['genres'].fillna('').apply(lambda x: x.replace('|', ' '))
        self.tfidf = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b') # Match single letters/words
        self.genre_matrix = self.tfidf.fit_transform(self.movies_df['genres_clean'])
        self.movie_similarity = cosine_similarity(self.genre_matrix)
        self.movie_similarity_df = pd.DataFrame(
            self.movie_similarity,
            index=self.movies_df['movieId'],
            columns=self.movies_df['movieId']
        )
        
        # Movie ID lookup dictionary
        self.movie_lookup = self.movies_df.set_index('movieId').to_dict('index')

    def get_user_watch_history(self, user_id, top_n=10):
        """Returns the top-rated movies for a given user."""
        if user_id not in self.user_item_matrix.index:
            return []
        
        user_ratings = self.user_item_matrix.loc[user_id].dropna()
        top_ratings = user_ratings.sort_values(ascending=False).head(top_n)
        
        history = []
        for m_id, rating in top_ratings.items():
            movie_info = self.movie_lookup.get(m_id, {"title": f"Unknown Movie {m_id}", "genres": ""})
            history.append({
                "movieId": int(m_id),
                "title": movie_info["title"],
                "genres": movie_info["genres"].split('|') if movie_info["genres"] else [],
                "rating": float(rating)
            })
        return history

    def recommend_user_cf(self, user_id, top_n=10, k=20):
        """User-Based Collaborative Filtering using Cosine Similarity."""
        if user_id not in self.user_item_matrix.index:
            return []
            
        # Get target user ratings
        user_ratings = self.user_item_matrix.loc[user_id]
        unrated_movies = user_ratings[user_ratings.isna()].index
        
        # Find top K similar users (exclude user itself)
        similar_users = self.user_similarity_df.loc[user_id].drop(user_id).sort_values(ascending=False).head(k)
        
        predicted_ratings = {}
        
        for movie_id in unrated_movies:
            # Users who rated this movie
            movie_ratings = self.user_item_matrix[movie_id].dropna()
            # Intersect with similar users
            common_users = similar_users.index.intersection(movie_ratings.index)
            
            if len(common_users) == 0:
                continue
                
            # Weighted average rating
            sims = similar_users.loc[common_users]
            ratings = movie_ratings.loc[common_users]
            
            sum_sims = sims.abs().sum()
            if sum_sims > 0:
                predicted_rating = np.dot(ratings, sims) / sum_sims
                predicted_ratings[movie_id] = predicted_rating
                
        # Sort and select top N
        sorted_predictions = sorted(predicted_ratings.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        recommendations = []
        for m_id, pred_rating in sorted_predictions:
            movie_info = self.movie_lookup.get(m_id, {"title": f"Unknown Movie {m_id}", "genres": ""})
            recommendations.append({
                "movieId": int(m_id),
                "title": movie_info["title"],
                "genres": movie_info["genres"].split('|') if movie_info["genres"] else [],
                "predicted_rating": round(float(pred_rating), 2),
                "algorithm": "User-Based CF",
                "reason": f"Highly rated by users with similar movie tastes."
            })
            
        return recommendations

    def recommend_item_cf(self, user_id, top_n=10, k=10):
        """Item-Based Collaborative Filtering using Cosine Similarity."""
        if user_id not in self.user_item_matrix.index:
            return []
            
        # User ratings
        user_ratings = self.user_item_matrix.loc[user_id].dropna()
        if user_ratings.empty:
            return []
            
        # Unrated movies
        unrated_movies = self.user_item_matrix.loc[user_id]
        unrated_movies = unrated_movies[unrated_movies.isna()].index
        
        predicted_ratings = {}
        
        for movie_id in unrated_movies:
            if movie_id not in self.item_similarity_df.index:
                continue
            # Similarity between this movie and all movies user rated
            movie_sims = self.item_similarity_df.loc[movie_id, user_ratings.index]
            
            # Select top K similar rated movies
            top_k_sims = movie_sims.sort_values(ascending=False).head(k)
            
            sum_sims = top_k_sims.abs().sum()
            if sum_sims > 0:
                pred_rating = np.dot(user_ratings.loc[top_k_sims.index], top_k_sims) / sum_sims
                predicted_ratings[movie_id] = pred_rating
                
        # Sort and select top N
        sorted_predictions = sorted(predicted_ratings.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        recommendations = []
        for m_id, pred_rating in sorted_predictions:
            movie_info = self.movie_lookup.get(m_id, {"title": f"Unknown Movie {m_id}", "genres": ""})
            recommendations.append({
                "movieId": int(m_id),
                "title": movie_info["title"],
                "genres": movie_info["genres"].split('|') if movie_info["genres"] else [],
                "predicted_rating": round(float(pred_rating), 2),
                "algorithm": "Item-Based CF",
                "reason": "Similar to other movies you enjoyed in the past."
            })
            
        return recommendations

    def recommend_content_similar(self, movie_id, top_n=10):
        """Content-Based: Find top N similar movies for a given movie ID."""
        if movie_id not in self.movie_similarity_df.index:
            return []
            
        sim_scores = self.movie_similarity_df.loc[movie_id].drop(movie_id)
        top_similar = sim_scores.sort_values(ascending=False).head(top_n)
        
        recommendations = []
        for m_id, score in top_similar.items():
            movie_info = self.movie_lookup.get(m_id, {"title": f"Unknown Movie {m_id}", "genres": ""})
            recommendations.append({
                "movieId": int(m_id),
                "title": movie_info["title"],
                "genres": movie_info["genres"].split('|') if movie_info["genres"] else [],
                "score": round(float(score), 2),
                "predicted_rating": round(float(score * 4 + 1), 2), # Scale 0-1 similarity score to 1-5 rating range
                "algorithm": "Content-Based",
                "reason": f"Matches genre configuration ({movie_info['genres']}) closely."
            })
        return recommendations

    def recommend_content_user(self, user_id, top_n=10):
        """Content-Based user recommendations based on their user profile vector (weighted by ratings)."""
        if user_id not in self.user_item_matrix.index:
            return []
            
        user_ratings = self.user_item_matrix.loc[user_id].dropna()
        if user_ratings.empty:
            return []
            
        # Unrated movies
        unrated_movies = self.user_item_matrix.loc[user_id]
        unrated_movies = unrated_movies[unrated_movies.isna()].index
        
        # Build user profile as weighted average of genre vectors
        rated_indices = [self.movies_df[self.movies_df['movieId'] == mid].index[0] for mid in user_ratings.index]
        user_ratings_arr = user_ratings.values.reshape(-1, 1)
        
        # Center ratings around mean user rating to get positive and negative weight
        mean_rating = user_ratings.mean()
        centered_ratings = user_ratings_arr - mean_rating
        # (Make sure we don't zero out completely, add a small offset or keep positive only)
        # Using positive ratings (> 3.0) is often more stable:
        positive_mask = user_ratings > 3.0
        if positive_mask.sum() > 0:
            user_ratings_filtered = user_ratings[positive_mask]
            rated_indices_filtered = [self.movies_df[self.movies_df['movieId'] == mid].index[0] for mid in user_ratings_filtered.index]
            weights = user_ratings_filtered.values.reshape(-1, 1)
            user_profile = np.sum(self.genre_matrix[rated_indices_filtered].multiply(weights), axis=0)
        else:
            weights = user_ratings.values.reshape(-1, 1)
            user_profile = np.sum(self.genre_matrix[rated_indices].multiply(weights), axis=0)
            
        # Convert profile to standard numpy array
        user_profile = np.asarray(user_profile)
        
        # Compute cosine similarity between user profile and all movies
        all_movie_sims = cosine_similarity(user_profile, self.genre_matrix).flatten()
        
        # Filter to unrated movies
        unrated_movie_indices = self.movies_df[self.movies_df['movieId'].isin(unrated_movies)].index
        unrated_movie_ids = self.movies_df.loc[unrated_movie_indices, 'movieId'].values
        unrated_sims = all_movie_sims[unrated_movie_indices]
        
        sim_series = pd.Series(unrated_sims, index=unrated_movie_ids)
        top_similar = sim_series.sort_values(ascending=False).head(top_n)
        
        recommendations = []
        for m_id, score in top_similar.items():
            movie_info = self.movie_lookup.get(m_id, {"title": f"Unknown Movie {m_id}", "genres": ""})
            recommendations.append({
                "movieId": int(m_id),
                "title": movie_info["title"],
                "genres": movie_info["genres"].split('|') if movie_info["genres"] else [],
                "score": round(float(score), 2),
                "predicted_rating": round(float(score * 4 + 1), 2), # Map similarity (0-1) to rating (1-5)
                "algorithm": "Content-Based",
                "reason": f"Aligned with your favorite genres: {', '.join(movie_info['genres'].split('|')[:2])}."
            })
        return recommendations

    def recommend_hybrid(self, user_id, top_n=10):
        """Hybrid: Combines User-Based CF and Content-Based Profile predictions."""
        user_cf_recs = self.recommend_user_cf(user_id, top_n=top_n * 2)
        content_recs = self.recommend_content_user(user_id, top_n=top_n * 2)
        
        # Combine predictions using scores/predicted ratings
        combined_scores = {}
        
        for rec in user_cf_recs:
            m_id = rec["movieId"]
            # Normalize CF rating from [1, 5] to [0, 1]
            norm_cf = (rec["predicted_rating"] - 1.0) / 4.0
            combined_scores[m_id] = {"cf_score": norm_cf, "cb_score": 0.0, "genres": rec["genres"], "title": rec["title"]}
            
        for rec in content_recs:
            m_id = rec["movieId"]
            norm_cb = rec["score"]  # Score is already cosine similarity [0, 1]
            if m_id in combined_scores:
                combined_scores[m_id]["cb_score"] = norm_cb
            else:
                combined_scores[m_id] = {"cf_score": 0.0, "cb_score": norm_cb, "genres": rec["genres"], "title": rec["title"]}
                
        # Weighted score: 50% CF, 50% Content
        hybrid_rankings = []
        for m_id, scores in combined_scores.items():
            # If a movie only has score from one algorithm, assign a small penalty or default value
            cf_val = scores["cf_score"]
            cb_val = scores["cb_score"]
            
            # Hybrid formula
            hybrid_val = 0.5 * cf_val + 0.5 * cb_val
            predicted_rating = hybrid_val * 4.0 + 1.0  # Project back to [1, 5]
            
            # Determine reason
            if cf_val > 0 and cb_val > 0:
                reason = "Highly rated by similar users and matches your genre preferences."
            elif cf_val > 0:
                reason = "Recommended by users with similar movie tastes."
            else:
                reason = "Highly aligns with genres of movies you previously enjoyed."
                
            hybrid_rankings.append({
                "movieId": int(m_id),
                "title": scores["title"],
                "genres": scores["genres"],
                "predicted_rating": round(float(predicted_rating), 2),
                "algorithm": "Hybrid",
                "reason": reason
            })
            
        hybrid_rankings = sorted(hybrid_rankings, key=lambda x: x["predicted_rating"], reverse=True)[:top_n]
        return hybrid_rankings
