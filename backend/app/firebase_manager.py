import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firestore():
    """Initializes the Firestore client, safely checking if it's already initialized."""
    if not firebase_admin._apps:
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cred_path = os.path.join(base_dir, "..", "shared", "firebase-credentials.json")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

db = initialize_firestore()
STATE_COLLECTION = "pipeline_state"
POSTS_COLLECTION = "parsed_posts"
MAIN_DOC = "progress_tracker"

def get_state_document():
    """Fetches the main state document from Firestore."""
    doc_ref = db.collection(STATE_COLLECTION).document(MAIN_DOC)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return {}

def update_state(updates: dict):
    """Updates fields in the main state document."""
    doc_ref = db.collection(STATE_COLLECTION).document(MAIN_DOC)
    doc_ref.update(updates)

def set_state(state: dict):
    """Sets the entire state document (overwrites)."""
    doc_ref = db.collection(STATE_COLLECTION).document(MAIN_DOC)
    doc_ref.set(state)

def save_post(post_data: dict):
    """Saves a post document to the parsed_posts collection with a server timestamp."""
    if not isinstance(post_data, dict):
        print("Error: post_data must be a dictionary.")
        return
    
    try:
        # Добавляем серверную временную метку
        post_data['saved_at'] = firestore.SERVER_TIMESTAMP
        
        # Используем add() для создания документа с авто-ID
        db.collection(POSTS_COLLECTION).add(post_data)
        
        # Логируем для отладки
        original_id = post_data.get('original_message_id', 'N/A')
        print(f"Successfully saved post (original_id: {original_id}) to Firestore collection '{POSTS_COLLECTION}'.")

    except Exception as e:
        print(f"Error saving post to Firestore: {e}")

def get_all_posts():
    """Fetches all posts from the parsed_posts collection, ordered by date."""
    try:
        posts_ref = db.collection(POSTS_COLLECTION).order_by("original_date", direction=firestore.Query.DESCENDING)
        docs = posts_ref.stream()
        
        posts = []
        for doc in docs:
            post_data = doc.to_dict()
            post_data['id'] = doc.id # Добавляем ID документа
            posts.append(post_data)
        
        return posts
    except Exception as e:
        print(f"Error fetching posts: {e}")
        return []

def get_post(post_id: str):
    """Fetches a single post by its document ID."""
    try:
        doc_ref = db.collection(POSTS_COLLECTION).document(post_id)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None
    except Exception as e:
        print(f"Error fetching post {post_id}: {e}")
        return None

def update_post(post_id: str, updates: dict):
    """Updates fields in a specific post document."""
    try:
        doc_ref = db.collection(POSTS_COLLECTION).document(post_id)
        doc_ref.update(updates)
    except Exception as e:
        print(f"Error updating post {post_id}: {e}")
