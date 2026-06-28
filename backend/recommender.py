import pandas as pd
import numpy as np

from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer


class MovieRecommender:

    def __init__(self, movies_df, ratings_df):

        self.movies_df = movies_df.copy()
        self.ratings_df = ratings_df.copy()

        self.movies_df["movieId"] = self.movies_df["movieId"].astype(int)
        self.ratings_df["movieId"] = self.ratings_df["movieId"].astype(int)
        self.ratings_df["userId"] = self.ratings_df["userId"].astype(int)
        self.ratings_df["rating"] = self.ratings_df["rating"].astype(float)

        self._prepare_data()

    def _prepare_data(self):

        ##################################################
        # USER ITEM MATRIX
        ##################################################

        self.user_item_matrix = self.ratings_df.pivot_table(
            index="userId",
            columns="movieId",
            values="rating"
        )

        self.user_item_filled = self.user_item_matrix.fillna(0)

        ##################################################
        # CONTENT FEATURES
        ##################################################

        self.movies_df["genres_clean"] = (
            self.movies_df["genres"]
            .fillna("")
            .str.replace("|", " ", regex=False)
        )

        self.tfidf = TfidfVectorizer(
            token_pattern=r"(?u)\b\w+\b"
        )

        self.genre_matrix = self.tfidf.fit_transform(
            self.movies_df["genres_clean"]
        )

        ##################################################
        # LOOKUP TABLES
        ##################################################

        self.movie_lookup = self.movies_df.set_index(
            "movieId"
        ).to_dict("index")

        self.movie_index = {
            movie_id: idx
            for idx, movie_id in enumerate(
                self.movies_df["movieId"]
            )
        }

        ##################################################
        # USER HISTORY CACHE
        ##################################################

        self.user_history = {}

        for uid, grp in self.ratings_df.groupby("userId"):

            self.user_history[int(uid)] = grp.set_index(
                "movieId"
            )["rating"]

        ##################################################
        # GLOBAL POPULAR MOVIES
        ##################################################

        self.global_popular = (
            self.ratings_df.groupby("movieId")
            .agg(
                avg_rating=("rating", "mean"),
                count=("rating", "count")
            )
            .sort_values(
                ["avg_rating", "count"],
                ascending=False
            )
        )

        def get_user_watch_history(self, user_id, top_n=10):
        """
        Return the user's highest-rated movies.
        """

        if user_id not in self.user_history:
            return []

        ratings = self.user_history[user_id]

        top_movies = ratings.sort_values(ascending=False).head(top_n)

        history = []

        for movie_id, rating in top_movies.items():

            movie = self.movie_lookup.get(
                movie_id,
                {
                    "title": f"Unknown Movie {movie_id}",
                    "genres": ""
                }
            )

            history.append({
                "movieId": int(movie_id),
                "title": movie["title"],
                "genres": movie["genres"].split("|")
                if movie["genres"] else [],
                "rating": float(rating)
            })

        return history


    ###########################################################
    # USER BASED COLLABORATIVE FILTERING
    ###########################################################

    def recommend_user_cf(self, user_id, top_n=10, k=20):

        if user_id not in self.user_item_matrix.index:
            return []

        target_vector = self.user_item_filled.loc[[user_id]]

        similarities = cosine_similarity(
            target_vector,
            self.user_item_filled
        )[0]

        similarity_series = pd.Series(
            similarities,
            index=self.user_item_filled.index
        )

        similarity_series = similarity_series.drop(user_id)

        similar_users = similarity_series.nlargest(k)

        user_ratings = self.user_item_matrix.loc[user_id]

        unrated_movies = user_ratings[user_ratings.isna()].index

        predictions = {}

        for movie_id in unrated_movies:

            ratings = self.user_item_matrix.loc[
                similar_users.index,
                movie_id
            ].dropna()

            if ratings.empty:
                continue

            sims = similar_users.loc[ratings.index]

            denominator = np.abs(sims).sum()

            if denominator == 0:
                continue

            prediction = np.dot(
                ratings.values,
                sims.values
            ) / denominator

            predictions[movie_id] = prediction

        ranked = sorted(
            predictions.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_n]

        recommendations = []

        for movie_id, score in ranked:

            movie = self.movie_lookup.get(
                movie_id,
                {
                    "title": f"Unknown Movie {movie_id}",
                    "genres": ""
                }
            )

            recommendations.append({

                "movieId": int(movie_id),

                "title": movie["title"],

                "genres": movie["genres"].split("|")
                if movie["genres"] else [],

                "predicted_rating": round(float(score), 2),

                "algorithm": "User-Based CF",

                "reason":
                "Highly rated by users with similar tastes."
            })

        return recommendations
        
        ###########################################################
    # ITEM BASED COLLABORATIVE FILTERING (Memory Optimized)
    ###########################################################

    def recommend_item_cf(self, user_id, top_n=10, k=10):

        if user_id not in self.user_item_matrix.index:
            return []

        user_ratings = self.user_item_matrix.loc[user_id].dropna()

        if user_ratings.empty:
            return []

        predictions = {}

        for candidate_movie in self.user_item_matrix.columns:

            if candidate_movie in user_ratings.index:
                continue

            if candidate_movie not in self.movie_index:
                continue

            candidate_idx = self.movie_index[candidate_movie]

            candidate_vector = self.genre_matrix[candidate_idx]

            similarities = []

            weighted_sum = 0
            similarity_sum = 0

            for watched_movie, rating in user_ratings.items():

                if watched_movie not in self.movie_index:
                    continue

                watched_idx = self.movie_index[watched_movie]

                similarity = cosine_similarity(
                    candidate_vector,
                    self.genre_matrix[watched_idx]
                )[0][0]

                similarities.append(
                    (similarity, rating)
                )

            similarities = sorted(
                similarities,
                key=lambda x: x[0],
                reverse=True
            )[:k]

            for sim, rating in similarities:

                weighted_sum += sim * rating
                similarity_sum += abs(sim)

            if similarity_sum > 0:

                predictions[candidate_movie] = (
                    weighted_sum / similarity_sum
                )

        ranked_movies = sorted(
            predictions.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_n]

        recommendations = []

        for movie_id, score in ranked_movies:

            movie = self.movie_lookup.get(
                movie_id,
                {
                    "title": f"Unknown Movie {movie_id}",
                    "genres": ""
                }
            )

            recommendations.append({

                "movieId": int(movie_id),

                "title": movie["title"],

                "genres": movie["genres"].split("|")
                if movie["genres"] else [],

                "predicted_rating": round(float(score),2),

                "algorithm":"Item-Based CF",

                "reason":"Similar to movies you rated highly."
            })

        return recommendations

        ###########################################################
    # CONTENT-BASED SIMILAR MOVIES
    ###########################################################

    def recommend_content_similar(self, movie_id, top_n=10):

        if movie_id not in self.movie_index:
            return []

        target_idx = self.movie_index[movie_id]

        target_vector = self.genre_matrix[target_idx]

        similarities = cosine_similarity(
            target_vector,
            self.genre_matrix
        ).flatten()

        similarity_series = pd.Series(
            similarities,
            index=self.movies_df["movieId"]
        )

        similarity_series = similarity_series.drop(movie_id)

        top_movies = similarity_series.nlargest(top_n)

        recommendations = []

        for m_id, score in top_movies.items():

            movie = self.movie_lookup.get(
                m_id,
                {
                    "title": f"Unknown Movie {m_id}",
                    "genres": ""
                }
            )

            recommendations.append({

                "movieId": int(m_id),

                "title": movie["title"],

                "genres": movie["genres"].split("|")
                if movie["genres"] else [],

                "score": round(float(score), 2),

                "predicted_rating": round(score * 4 + 1, 2),

                "algorithm": "Content-Based",

                "reason":
                "Similar genres and movie characteristics."
            })

        return recommendations


    ###########################################################
    # CONTENT-BASED USER RECOMMENDATIONS
    ###########################################################

    def recommend_content_user(self, user_id, top_n=10):

        if user_id not in self.user_history:
            return []

        user_ratings = self.user_history[user_id]

        positive = user_ratings[user_ratings >= 4]

        if positive.empty:
            positive = user_ratings

        profile = None

        for movie_id, rating in positive.items():

            if movie_id not in self.movie_index:
                continue

            idx = self.movie_index[movie_id]

            vec = self.genre_matrix[idx]

            if profile is None:
                profile = vec * rating
            else:
                profile += vec * rating

        if profile is None:
            return []

        similarities = cosine_similarity(
            profile,
            self.genre_matrix
        ).flatten()

        similarity_series = pd.Series(
            similarities,
            index=self.movies_df["movieId"]
        )

        watched = set(user_ratings.index)

        similarity_series = similarity_series.drop(
            labels=list(watched),
            errors="ignore"
        )

        top_movies = similarity_series.nlargest(top_n)

        recommendations = []

        for movie_id, score in top_movies.items():

            movie = self.movie_lookup.get(
                movie_id,
                {
                    "title": f"Unknown Movie {movie_id}",
                    "genres": ""
                }
            )

            recommendations.append({

                "movieId": int(movie_id),

                "title": movie["title"],

                "genres": movie["genres"].split("|")
                if movie["genres"] else [],

                "score": round(float(score), 2),

                "predicted_rating": round(score * 4 + 1, 2),

                "algorithm": "Content-Based",

                "reason":
                "Matches your preferred genres."
            })

        return recommendations

        ###########################################################
    # HYBRID RECOMMENDER
    ###########################################################

    def recommend_hybrid(self, user_id, top_n=10):

        user_cf = self.recommend_user_cf(user_id, top_n * 2)

        content = self.recommend_content_user(user_id, top_n * 2)

        combined = {}

        ##################################################
        # USER CF SCORE
        ##################################################

        for rec in user_cf:

            movie_id = rec["movieId"]

            score = (rec["predicted_rating"] - 1) / 4

            combined[movie_id] = {
                "title": rec["title"],
                "genres": rec["genres"],
                "cf": score,
                "cb": 0
            }

        ##################################################
        # CONTENT SCORE
        ##################################################

        for rec in content:

            movie_id = rec["movieId"]

            if movie_id in combined:

                combined[movie_id]["cb"] = rec["score"]

            else:

                combined[movie_id] = {

                    "title": rec["title"],

                    "genres": rec["genres"],

                    "cf": 0,

                    "cb": rec["score"]
                }

        ##################################################
        # COMBINE
        ##################################################

        recommendations = []

        for movie_id, data in combined.items():

            hybrid_score = 0.5 * data["cf"] + 0.5 * data["cb"]

            predicted = hybrid_score * 4 + 1

            if data["cf"] > 0 and data["cb"] > 0:

                reason = (
                    "Recommended by similar users and "
                    "matches your favourite genres."
                )

            elif data["cf"] > 0:

                reason = (
                    "Recommended by users with similar taste."
                )

            else:

                reason = (
                    "Matches your preferred genres."
                )

            recommendations.append({

                "movieId": int(movie_id),

                "title": data["title"],

                "genres": data["genres"],

                "predicted_rating": round(float(predicted), 2),

                "algorithm": "Hybrid",

                "reason": reason

            })

        ##################################################
        # SORT
        ##################################################

        recommendations = sorted(

            recommendations,

            key=lambda x: x["predicted_rating"],

            reverse=True

        )

        ##################################################
        # COLD START
        ##################################################

        if len(recommendations) < top_n:

            already = {

                rec["movieId"]

                for rec in recommendations

            }

            for movie_id, row in self.global_popular.iterrows():

                if movie_id in already:

                    continue

                movie = self.movie_lookup.get(movie_id)

                if movie is None:

                    continue

                recommendations.append({

                    "movieId": int(movie_id),

                    "title": movie["title"],

                    "genres": movie["genres"].split("|")
                    if movie["genres"] else [],

                    "predicted_rating": round(float(row["avg_rating"]), 2),

                    "algorithm": "Popularity",

                    "reason":
                    "Popular among all users."

                })

                if len(recommendations) >= top_n:

                    break

        return recommendations[:top_n]
