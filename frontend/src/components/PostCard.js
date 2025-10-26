import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const PostCard = ({ post, onTranslate }) => {
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  return (
    <Card className='shadow-lg bg-gray-900/70 border-gray-700 text-white'>
      <CardHeader>
        <CardTitle className='text-lg font-bold text-cyan-400'>
          Post from: {post.source_channel}
        </CardTitle>
        <p className='text-xs text-gray-400'>
          Original ID: {post.original_message_id} | Saved: {formatDate(post.saved_at)}
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <h4 className='font-semibold text-gray-300 mb-2'>Original Text:</h4>
          <p className='text-sm text-gray-200 whitespace-pre-wrap bg-black/50 p-3 rounded-md'>
            {post.content || 'No text content.'}
          </p>
        </div>
        {post.translated_content && (
          <div>
            <h4 className='font-semibold text-gray-300 mb-2'>
              Translated Text ({post.target_lang}):
            </h4>
            <p className='text-sm text-yellow-200 whitespace-pre-wrap bg-black/50 p-3 rounded-md'>
              {post.translated_content}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className='flex justify-between items-center'>
        <div className='flex gap-2 flex-wrap'>
          <Badge variant='secondary'>Views: {post.original_views || 0}</Badge>
          {post.is_top_post && <Badge variant='destructive'>Top Post</Badge>}
          {post.is_merged && <Badge variant='outline'>Merged</Badge>}
        </div>
        {!post.translated_content && post.content && (
          <Button onClick={() => onTranslate(post.id, 'EN')} size='sm'>
            Translate to EN
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;
