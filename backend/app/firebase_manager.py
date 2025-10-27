import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firestore():
    """Initializes the Firestore client, safely checking if it's already initialized."""
    if not firebase_admin._apps:
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cred_path = os.path.join(base_dir, "firebase-credentials.json")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

db = initialize_firestore()
STATE_COLLECTION = "pipeline_state"
POSTS_COLLECTION = "parsed_posts"
CHANNELS_COLLECTION = "saved_channel"
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

def delete_post(post_id: str):
    """Deletes a single post by its document ID."""
    try:
        doc_ref = db.collection(POSTS_COLLECTION).document(post_id)
        doc_ref.delete()
        print(f"Successfully deleted post {post_id}")
        return True
    except Exception as e:
        print(f"Error deleting post {post_id}: {e}")
        return False

def delete_all_posts():
    """Deletes all posts from the parsed_posts collection."""
    try:
        posts_ref = db.collection(POSTS_COLLECTION)
        docs = posts_ref.stream()
        
        deleted_count = 0
        for doc in docs:
            doc.reference.delete()
            deleted_count += 1
        
        print(f"Successfully deleted {deleted_count} posts")
        return deleted_count
    except Exception as e:
        print(f"Error deleting all posts: {e}")
        return 0

def save_channel(channel_username: str):
    """Saves a channel username to the saved_channels collection. Only keeps one channel - the latest."""
    try:
        # Remove @ if present and validate
        clean_username = channel_username.lstrip('@').strip()
        if not clean_username:
            print("Channel username is empty")
            return False
        
        # Delete all existing channels first (we only keep one)
        existing_channels = list(db.collection(CHANNELS_COLLECTION).get())
        for doc in existing_channels:
            doc.reference.delete()
        
        # Save new channel
        channel_data = {
            'username': clean_username,
            'saved_at': firestore.SERVER_TIMESTAMP
        }
        db.collection(CHANNELS_COLLECTION).add(channel_data)
        print(f"Successfully saved channel @{clean_username} (replaced all previous)")
        return True
    except Exception as e:
        print(f"Error saving channel {channel_username}: {e}")
        return False

def get_saved_channel():
    """Fetches the saved channel (only one exists)."""
    try:
        channels_ref = db.collection(CHANNELS_COLLECTION).order_by("saved_at", direction=firestore.Query.DESCENDING).limit(1)
        channels = list(channels_ref.get())
        if channels:
            channel_data = channels[0].to_dict()
            channel_data['id'] = channels[0].id
            return channel_data
        return None
    except Exception as e:
        print(f"Error fetching channel: {e}")
        return None

def is_channel_saved(channel_username: str):
    """Checks if the given channel is the currently saved channel."""
    try:
        clean_username = channel_username.lstrip('@').strip()
        if not clean_username:
            return False
        
        saved_channel = get_saved_channel()
        if saved_channel and saved_channel.get('username') == clean_username:
            return True
        return False
    except Exception as e:
        print(f"Error checking channel {channel_username}: {e}")
        return False

def delete_saved_channel():
    """Deletes the saved channel."""
    try:
        existing = list(db.collection(CHANNELS_COLLECTION).get())
        
        deleted_count = 0
        for doc in existing:
            doc.reference.delete()
            deleted_count += 1
        
        if deleted_count > 0:
            print(f"Successfully deleted saved channel")
            return True
        else:
            print(f"No saved channel found")
            return False
    except Exception as e:
        print(f"Error deleting saved channel: {e}")
        return False

def cleanup_old_channels_collection():
    """Deletes the old 'saved_channels' collection if it exists."""
    try:
        old_collection = "saved_channels"
        existing = list(db.collection(old_collection).get())
        
        deleted_count = 0
        for doc in existing:
            doc.reference.delete()
            deleted_count += 1
        
        if deleted_count > 0:
            print(f"Successfully cleaned up old collection '{old_collection}' - deleted {deleted_count} documents")
        else:
            print(f"Old collection '{old_collection}' was already empty or doesn't exist")
        
        return True
    except Exception as e:
        print(f"Error cleaning up old channels collection: {e}")
        return False
