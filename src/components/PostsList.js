import React, { useEffect } from 'react';
import { usePosts } from '../hooks/usePosts';
import PostCard from './PostCard';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const PostsList = () => {
  const { posts, isLoading, error, fetchPosts, handleTranslatePost } = usePosts();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (isLoading) {
    return <p className='text-center text-gray-400'>Loading posts...</p>;
  }

  if (error) {
    return <p className='text-center text-red-400'>Error: {error}</p>;
  }

  return (
    <Card className='shadow-2xl bg-black/80 backdrop-blur-sm border-gray-800'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'>
          Saved Posts
        </CardTitle>
        <Button onClick={fetchPosts} variant='outline' size='sm'>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className='text-center text-gray-500'>No posts found.</p>
        ) : (
          <div className='space-y-4'>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onTranslate={handleTranslatePost} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostsList;
