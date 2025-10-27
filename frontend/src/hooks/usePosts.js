import { useState, useCallback } from 'react';
import { getPosts, translatePost, deletePost, deleteAllPosts } from '../services/api';

export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPosts();
      if (response.data.ok) {
        setPosts(response.data.posts);
      } else {
        throw new Error('Failed to fetch posts');
      }
    } catch (err) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTranslatePost = useCallback(
    async (postId, targetLang) => {
      try {
        await translatePost(postId, targetLang);
        // После успешного перевода обновляем список, чтобы показать результат
        fetchPosts();
      } catch (err) {
        // Можно добавить более гранулярную обработку ошибок для конкретного поста
        console.error(`Failed to translate post ${postId}:`, err);
        alert(`Error translating post: ${err.message}`);
      }
    },
    [fetchPosts]
  );

  const handleDeletePost = useCallback(
    async (postId) => {
      try {
        await deletePost(postId);
        // После успешного удаления обновляем список
        fetchPosts();
      } catch (err) {
        console.error(`Failed to delete post ${postId}:`, err);
        alert(`Error deleting post: ${err.message}`);
      }
    },
    [fetchPosts]
  );

  const handleDeleteAllPosts = useCallback(async () => {
    try {
      const response = await deleteAllPosts();
      if (response.data.ok) {
        // После успешного удаления всех постов обновляем список
        fetchPosts();
        alert(response.data.message);
      }
    } catch (err) {
      console.error('Failed to delete all posts:', err);
      alert(`Error deleting all posts: ${err.message}`);
    }
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
    handleTranslatePost,
    handleDeletePost,
    handleDeleteAllPosts,
  };
};
