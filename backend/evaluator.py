import numpy as np
import pandas as pd
from recommender import MovieRecommender

def evaluate_recommenders(movies_df, ratings_df, sample_users_count=30, relevance_threshold=3.5):
    """
    Splits the ratings 80/20 into train/test sets, trains recommenders on train set,
    and computes Precision@10, Recall@10, F1@10, and RMSE.
    """
    # 1. 80/20 Split
    np.random.seed(42)
    shuffled_indices = np.random.permutation(len(ratings_df))
    split_idx = int(len(ratings_df) * 0.8)
    
    train_indices = shuffled_indices[:split_idx]
    test_indices = shuffled_indices[split_idx:]
    
    train_ratings = ratings_df.iloc[train_indices].copy()
    test_ratings = ratings_df.iloc[test_indices].copy()
    
    # Initialize recommender with train data
    train_recommender = MovieRecommender(movies_df, train_ratings)
    
    # Identify unique test users
    test_users = test_ratings['userId'].unique()
    
    # If there are many users, sample them to speed up evaluation
    if len(test_users) > sample_users_count:
        test_users = np.random.choice(test_users, size=sample_users_count, replace=False)
        
    metrics = {
        "User-Based CF": {"precision": [], "recall": [], "f1": [], "rmse": []},
        "Item-Based CF": {"precision": [], "recall": [], "f1": [], "rmse": []},
        "Content-Based": {"precision": [], "recall": [], "f1": [], "rmse": []}
    }
    
    # Helper to calculate rating predictions for test set
    for u_id in test_users:
        u_test = test_ratings[test_ratings['userId'] == u_id]
        if u_test.empty:
            continue
            
        # Get actual rated movie IDs and ratings in test set
        test_movies = u_test['movieId'].values
        test_actual_ratings = u_test.set_index('movieId')['rating'].to_dict()
        
        # Relevant movies in the test set (rating >= threshold)
        relevant_test_movies = set(u_test[u_test['rating'] >= relevance_threshold]['movieId'])
        if len(relevant_test_movies) == 0:
            continue  # Skip user if they have no relevant movies in test set
            
        # Get recommendations (which will include predicted ratings or scores)
        # Note: Standard CF recommenders recommend unrated movies in their training set.
        # For evaluation, we predict ratings for the test set movies, and also generate recommendations.
        
        # Predict ratings for test movies for RMSE
        # User-CF Predictions
        user_cf_preds = {}
        if u_id in train_recommender.user_item_matrix.index:
            user_ratings = train_recommender.user_item_matrix.loc[u_id]
            similar_users = train_recommender.user_similarity_df.loc[u_id].drop(u_id).sort_values(ascending=False).head(20)
            
            for m_id in test_movies:
                if m_id not in train_recommender.user_item_matrix.columns:
                    continue
                movie_ratings = train_recommender.user_item_matrix[m_id].dropna()
                common_users = similar_users.index.intersection(movie_ratings.index)
                if len(common_users) > 0:
                    sims = similar_users.loc[common_users]
                    ratings = movie_ratings.loc[common_users]
                    sum_sims = sims.abs().sum()
                    if sum_sims > 0:
                        user_cf_preds[m_id] = np.dot(ratings, sims) / sum_sims
                        
        # Item-CF Predictions
        item_cf_preds = {}
        if u_id in train_recommender.user_item_matrix.index:
            user_ratings_train = train_recommender.user_item_matrix.loc[u_id].dropna()
            if not user_ratings_train.empty:
                for m_id in test_movies:
                    if m_id not in train_recommender.item_similarity_df.index:
                        continue
                    movie_sims = train_recommender.item_similarity_df.loc[m_id, user_ratings_train.index]
                    top_k_sims = movie_sims.sort_values(ascending=False).head(10)
                    sum_sims = top_k_sims.abs().sum()
                    if sum_sims > 0:
                        item_cf_preds[m_id] = np.dot(user_ratings_train.loc[top_k_sims.index], top_k_sims) / sum_sims
                        
        # Content-Based Predictions (Profile similarity scaled)
        cb_preds = {}
        if u_id in train_recommender.user_item_matrix.index:
            user_ratings_train = train_recommender.user_item_matrix.loc[u_id].dropna()
            positive_mask = user_ratings_train > 3.0
            if positive_mask.sum() > 0:
                user_ratings_filtered = user_ratings_train[positive_mask]
                rated_indices = [train_recommender.movies_df[train_recommender.movies_df['movieId'] == mid].index[0] for mid in user_ratings_filtered.index]
                weights = user_ratings_filtered.values.reshape(-1, 1)
                user_profile = np.sum(train_recommender.genre_matrix[rated_indices].multiply(weights), axis=0)
            else:
                rated_indices = [train_recommender.movies_df[train_recommender.movies_df['movieId'] == mid].index[0] for mid in user_ratings_train.index]
                weights = user_ratings_train.values.reshape(-1, 1)
                user_profile = np.sum(train_recommender.genre_matrix[rated_indices].multiply(weights), axis=0)
            
            user_profile = np.asarray(user_profile)
            all_movie_sims = cosine_similarity(user_profile, train_recommender.genre_matrix).flatten()
            
            for m_id in test_movies:
                matches = train_recommender.movies_df[train_recommender.movies_df['movieId'] == m_id]
                if not matches.empty:
                    idx = matches.index[0]
                    score = all_movie_sims[idx]
                    cb_preds[m_id] = score * 4.0 + 1.0  # Scale similarity to 1-5 rating
                    
        # Compute RMSE for predicted vs actual
        for algo, preds in [("User-Based CF", user_cf_preds), ("Item-Based CF", item_cf_preds), ("Content-Based", cb_preds)]:
            sq_errors = []
            for m_id in test_movies:
                if m_id in preds:
                    sq_errors.append((preds[m_id] - test_actual_ratings[m_id]) ** 2)
            if sq_errors:
                metrics[algo]["rmse"].append(np.sqrt(np.mean(sq_errors)))
                
        # Generate Top-10 Recommendations for each algorithm
        # Check precision, recall, f1 relative to relevant test set
        for algo, rec_func in [
            ("User-Based CF", train_recommender.recommend_user_cf),
            ("Item-Based CF", train_recommender.recommend_item_cf),
            ("Content-Based", train_recommender.recommend_content_user)
        ]:
            recs = rec_func(u_id, top_n=10)
            rec_ids = [r["movieId"] for r in recs]
            
            # Count intersection with relevant items in test set
            hits = len(set(rec_ids).intersection(relevant_test_movies))
            
            precision = hits / 10.0
            recall = hits / len(relevant_test_movies) if len(relevant_test_movies) > 0 else 0.0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
            
            metrics[algo]["precision"].append(precision)
            metrics[algo]["recall"].append(recall)
            metrics[algo]["f1"].append(f1)
            
    # Aggregate results
    report = []
    for algo in metrics:
        avg_precision = np.mean(metrics[algo]["precision"]) if metrics[algo]["precision"] else 0.0
        avg_recall = np.mean(metrics[algo]["recall"]) if metrics[algo]["recall"] else 0.0
        avg_f1 = np.mean(metrics[algo]["f1"]) if metrics[algo]["f1"] else 0.0
        avg_rmse = np.mean(metrics[algo]["rmse"]) if metrics[algo]["rmse"] else 0.0
        
        report.append({
            "algorithm": algo,
            "precision": round(float(avg_precision * 100), 2),  # percentage
            "recall": round(float(avg_recall * 100), 2),        # percentage
            "f1_score": round(float(avg_f1 * 100), 2),          # percentage
            "rmse": round(float(avg_rmse), 3)
        })
        
    return report

if __name__ == "__main__":
    from data_loader import load_data
    movies, ratings, is_fallback = load_data()
    print("Evaluating recommender system...")
    report = evaluate_recommenders(movies, ratings)
    print(pd.DataFrame(report))
