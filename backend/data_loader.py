import os
import zipfile
import requests
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
ZIP_URL = "http://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
ZIP_PATH = os.path.join(DATA_DIR, "ml-latest-small.zip")
EXTRACT_DIR = os.path.join(DATA_DIR, "ml-latest-small")

# Robust fallback dataset (50 movies, 20 users)
FALLBACK_MOVIES = [
    {"movieId": 1, "title": "Toy Story (1995)", "genres": "Adventure|Animation|Children|Comedy|Fantasy"},
    {"movieId": 2, "title": "Jumanji (1995)", "genres": "Adventure|Children|Fantasy"},
    {"movieId": 3, "title": "Grumpier Old Men (1995)", "genres": "Comedy|Romance"},
    {"movieId": 4, "title": "Waiting to Exhale (1995)", "genres": "Comedy|Drama|Romance"},
    {"movieId": 5, "title": "Father of the Bride Part II (1995)", "genres": "Comedy"},
    {"movieId": 6, "title": "Heat (1995)", "genres": "Action|Crime|Thriller"},
    {"movieId": 7, "title": "Sabrina (1995)", "genres": "Comedy|Romance"},
    {"movieId": 8, "title": "Tom and Huck (1995)", "genres": "Adventure|Children"},
    {"movieId": 9, "title": "Sudden Death (1995)", "genres": "Action"},
    {"movieId": 10, "title": "GoldenEye (1995)", "genres": "Action|Adventure|Thriller"},
    {"movieId": 11, "title": "American President, The (1995)", "genres": "Comedy|Drama|Romance"},
    {"movieId": 12, "title": "Dracula: Dead and Loving It (1995)", "genres": "Comedy|Horror"},
    {"movieId": 13, "title": "Balto (1995)", "genres": "Adventure|Animation|Children"},
    {"movieId": 14, "title": "Nixon (1995)", "genres": "Drama"},
    {"movieId": 15, "title": "Cutthroat Island (1995)", "genres": "Action|Adventure|Romance"},
    {"movieId": 16, "title": "Casino (1995)", "genres": "Crime|Drama"},
    {"movieId": 17, "title": "Sense and Sensibility (1995)", "genres": "Drama|Romance"},
    {"movieId": 18, "title": "Four Rooms (1995)", "genres": "Comedy"},
    {"movieId": 19, "title": "Ace Ventura: When Nature Calls (1995)", "genres": "Comedy"},
    {"movieId": 20, "title": "Money Train (1995)", "genres": "Action|Comedy|Crime|Drama|Thriller"},
    {"movieId": 21, "title": "Get Shorty (1995)", "genres": "Comedy|Crime|Thriller"},
    {"movieId": 22, "title": "Copycat (1995)", "genres": "Crime|Drama|Horror|Mystery|Thriller"},
    {"movieId": 23, "title": "Assassins (1995)", "genres": "Action|Crime|Thriller"},
    {"movieId": 24, "title": "Powder (1995)", "genres": "Drama|Sci-Fi"},
    {"movieId": 25, "title": "Leaving Las Vegas (1995)", "genres": "Drama|Romance"},
    {"movieId": 26, "title": "Othello (1995)", "genres": "Drama"},
    {"movieId": 27, "title": "Now and Then (1995)", "genres": "Children|Drama"},
    {"movieId": 28, "title": "Persuasion (1995)", "genres": "Drama|Romance"},
    {"movieId": 29, "title": "City of Lost Children, The (Cité des enfants perdus, La) (1995)", "genres": "Adventure|Drama|Fantasy|Mystery|Sci-Fi"},
    {"movieId": 30, "title": "Shanghai Triad (Yao a yao, yao dao waipo qiao) (1995)", "genres": "Crime|Drama"},
    {"movieId": 31, "title": "Dangerous Minds (1995)", "genres": "Drama"},
    {"movieId": 32, "title": "Twelve Monkeys (a.k.a. 12 Monkeys) (1995)", "genres": "Mystery|Sci-Fi|Thriller"},
    {"movieId": 34, "title": "Babe (1995)", "genres": "Children|Drama"},
    {"movieId": 36, "title": "Dead Man Walking (1995)", "genres": "Crime|Drama"},
    {"movieId": 38, "title": "It Takes Two (1995)", "genres": "Children|Comedy"},
    {"movieId": 39, "title": "Clueless (1995)", "genres": "Comedy|Romance"},
    {"movieId": 40, "title": "Cry, the Beloved Country (1995)", "genres": "Drama"},
    {"movieId": 41, "title": "Richard III (1995)", "genres": "Drama|War"},
    {"movieId": 42, "title": "Dead Presidents (1995)", "genres": "Action|Crime|Drama"},
    {"movieId": 43, "title": "Restoration (1995)", "genres": "Drama"},
    {"movieId": 44, "title": "Mortal Kombat (1995)", "genres": "Action|Adventure|Fantasy"},
    {"movieId": 45, "title": "To Die For (1995)", "genres": "Comedy|Drama|Thriller"},
    {"movieId": 46, "title": "How to Make an American Quilt (1995)", "genres": "Drama|Romance"},
    {"movieId": 47, "title": "Seven (a.k.a. Se7en) (1995)", "genres": "Mystery|Thriller"},
    {"movieId": 48, "title": "Pocahontas (1995)", "genres": "Animation|Children|Drama|Musical|Romance"},
    {"movieId": 49, "title": "When Night Is Falling (1995)", "genres": "Drama|Romance"},
    {"movieId": 50, "title": "Usual Suspects, The (1995)", "genres": "Crime|Mystery|Thriller"}
]

def generate_fallback_ratings():
    ratings = []
    np.random.seed(42)  # For reproducible evaluation metrics
    for u in range(1, 21):  # 20 users
        # Each user rates a subset of movies
        num_ratings = np.random.randint(15, 30)
        rated_movies = np.random.choice([m["movieId"] for m in FALLBACK_MOVIES], size=num_ratings, replace=False)
        for m_id in rated_movies:
            # Users have preferences: odd users like Action (6, 9, 10, etc.), even users like Comedy/Animation (1, 5, 7, etc.)
            base = 3.5
            is_action = m_id in [6, 9, 10, 15, 20, 23, 42, 44]
            is_comedy = m_id in [1, 3, 4, 5, 7, 12, 18, 19, 38, 39, 45]
            if u % 2 == 1 and is_action:
                base += 1.0
            elif u % 2 == 0 and is_comedy:
                base += 1.0
            
            rating = np.clip(base + np.random.normal(0, 0.5), 1.0, 5.0)
            rating = round(rating * 2) / 2 # Round to nearest 0.5
            ratings.append({"userId": u, "movieId": int(m_id), "rating": rating, "timestamp": 1234567890})
    return ratings

def download_data():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Try downloading from GroupLens
    if not os.path.exists(ZIP_PATH):
        print("Downloading MovieLens Small Dataset...")
        try:
            response = requests.get(ZIP_URL, timeout=15)
            if response.status_code == 200:
                with open(ZIP_PATH, 'wb') as f:
                    f.write(response.content)
                print("Download completed.")
            else:
                print(f"Failed to download dataset. Status code: {response.status_code}")
        except Exception as e:
            print(f"Error downloading dataset: {e}")
            
    if os.path.exists(ZIP_PATH) and not os.path.exists(EXTRACT_DIR):
        print("Extracting dataset...")
        try:
            with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
                zip_ref.extractall(DATA_DIR)
            print("Extraction completed.")
        except Exception as e:
            print(f"Error extracting dataset: {e}")

# Bollywood and Tollywood Injection Dataset
INDIAN_MOVIES = [
    # Bollywood
    {"movieId": 300001, "title": "3 Idiots (2009)", "genres": "Comedy|Drama", "industry": "Bollywood"},
    {"movieId": 300002, "title": "Dangal (2016)", "genres": "Action|Drama", "industry": "Bollywood"},
    {"movieId": 300003, "title": "Dilwale Dulhania Le Jayenge (1995)", "genres": "Comedy|Drama|Romance", "industry": "Bollywood"},
    {"movieId": 300004, "title": "Lagaan: Once Upon a Time in India (2001)", "genres": "Drama|Musical|Romance", "industry": "Bollywood"},
    {"movieId": 300005, "title": "Sholay (1975)", "genres": "Action|Adventure|Comedy", "industry": "Bollywood"},
    {"movieId": 300006, "title": "Gangs of Wasseypur (2012)", "genres": "Action|Comedy|Crime|Drama|Thriller", "industry": "Bollywood"},
    {"movieId": 300007, "title": "Barfi! (2012)", "genres": "Comedy|Drama|Romance", "industry": "Bollywood"},
    {"movieId": 300008, "title": "My Name Is Khan (2010)", "genres": "Drama|Romance", "industry": "Bollywood"},
    {"movieId": 300009, "title": "Zindagi Na Milegi Dobara (2011)", "genres": "Comedy|Drama|Romance", "industry": "Bollywood"},
    {"movieId": 300010, "title": "Queen (2013)", "genres": "Comedy|Drama", "industry": "Bollywood"},
    # Tollywood
    {"movieId": 400001, "title": "Baahubali: The Beginning (2015)", "genres": "Action|Adventure|Fantasy", "industry": "Tollywood"},
    {"movieId": 400002, "title": "Baahubali 2: The Conclusion (2017)", "genres": "Action|Adventure|Fantasy", "industry": "Tollywood"},
    {"movieId": 400003, "title": "RRR (2022)", "genres": "Action|Drama", "industry": "Tollywood"},
    {"movieId": 400004, "title": "K.G.F: Chapter 1 (2018)", "genres": "Action|Crime|Drama", "industry": "Tollywood"},
    {"movieId": 400005, "title": "Pushpa: The Rise (2021)", "genres": "Action|Crime|Drama|Thriller", "industry": "Tollywood"},
    {"movieId": 400006, "title": "Vikram (2022)", "genres": "Action|Thriller", "industry": "Tollywood"},
    {"movieId": 400007, "title": "Kantara (2022)", "genres": "Action|Drama|Thriller", "industry": "Tollywood"},
    {"movieId": 400008, "title": "Eega (2012)", "genres": "Action|Fantasy|Thriller", "industry": "Tollywood"},
    {"movieId": 400009, "title": "Magadheera (2009)", "genres": "Action|Drama|Fantasy|Romance", "industry": "Tollywood"},
    {"movieId": 400010, "title": "Ala Vaikunthapurramuloo (2020)", "genres": "Action|Comedy|Drama", "industry": "Tollywood"}
]

def inject_indian_movies(movies_df, ratings_df):
    print("Injecting Bollywood and Tollywood cinema into dataset...")
    # Add industry column if not present
    if 'industry' not in movies_df.columns:
        movies_df['industry'] = 'Hollywood'
        
    # Create Indian movies DataFrame
    indian_df = pd.DataFrame(INDIAN_MOVIES)
    
    # Concatenate movies
    movies_combined = pd.concat([movies_df, indian_df], ignore_index=True)
    
    # Generate ratings for Indian movies by existing users
    new_ratings = []
    unique_users = ratings_df['userId'].unique()
    np.random.seed(42)
    
    for item in INDIAN_MOVIES:
        m_id = item["movieId"]
        is_tollywood = item["industry"] == "Tollywood"
        # Select between 30 and 70 users to rate this movie
        num_raters = np.random.randint(30, 70)
        raters = np.random.choice(unique_users, size=num_raters, replace=False)
        
        for u_id in raters:
            # High ratings for these popular movies (3.5 to 5.0)
            rating = np.random.choice([3.5, 4.0, 4.5, 5.0], p=[0.1, 0.3, 0.4, 0.2])
            new_ratings.append({
                "userId": int(u_id),
                "movieId": int(m_id),
                "rating": float(rating),
                "timestamp": 1234567890
            })
            
    ratings_combined = pd.concat([ratings_df, pd.DataFrame(new_ratings)], ignore_index=True)
    return movies_combined, ratings_combined

def load_data():
    # Attempt to download and extract
    download_data()
    
    # Look for files in extracted folder
    movie_path = os.path.join(EXTRACT_DIR, "movies.csv")
    rating_path = os.path.join(EXTRACT_DIR, "ratings.csv")
    
    # Check if files exist, otherwise fallback
    if os.path.exists(movie_path) and os.path.exists(rating_path):
        print("Loading MovieLens dataset from disk...")
        try:
            movies_df = pd.read_csv(movie_path)
            ratings_df = pd.read_csv(rating_path)
            # Inject Indian cinema
            movies_df, ratings_df = inject_indian_movies(movies_df, ratings_df)
            return movies_df, ratings_df, False
        except Exception as e:
            print(f"Error reading dataset files: {e}. Falling back to sample data.")
            
    print("Using hardcoded fallback dataset.")
    movies_df = pd.DataFrame(FALLBACK_MOVIES)
    ratings_df = pd.DataFrame(generate_fallback_ratings())
    # Inject Indian cinema into fallback
    movies_df, ratings_df = inject_indian_movies(movies_df, ratings_df)
    return movies_df, ratings_df, True

if __name__ == "__main__":
    movies, ratings, is_fallback = load_data()
    print(f"Loaded {len(movies)} movies and {len(ratings)} ratings. Fallback used: {is_fallback}")
