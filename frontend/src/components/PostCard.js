import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const PostCard = ({ post, onTranslate, onDelete }) => {
  return (
    <Card className='hover:shadow-md transition-shadow rounded-lg'>
      <CardContent className='p-4 space-y-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-semibold truncate'>{post.source_channel}</p>
            <p className='text-xs text-muted-foreground mt-0.5'>ID: {post.original_message_id}</p>
          </div>
          <div className='flex gap-2 items-center shrink-0'>
            <Badge variant='secondary' className='text-xs px-2 py-1 rounded-md font-medium'>
              👁 {post.original_views || 0}
            </Badge>
            {post.is_top_post && (
              <Badge variant='secondary' className='text-xs px-2 py-1 rounded-md font-medium'>
                ⭐
              </Badge>
            )}
          </div>
        </div>
        <div className='space-y-2'>
          <p className='text-sm font-medium'>Оригинал</p>
          <p className='text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md line-clamp-3'>
            {post.content || 'Нет текста'}
          </p>
        </div>
        {post.translated_content && (
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Перевод</p>
            <p className='text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md line-clamp-3'>
              {post.translated_content}
            </p>
          </div>
        )}
        <div className='flex gap-2'>
          {!post.translated_content && post.content && (
            <Button
              onClick={() => onTranslate(post.id, 'EN')}
              size='sm'
              variant='outline'
              className='flex-1'
            >
              Перевести на английский
            </Button>
          )}
          <Button
            onClick={() => {
              const confirmed = window.confirm('Вы уверены, что хотите удалить этот пост?');
              if (confirmed) {
                onDelete(post.id);
              }
            }}
            size='sm'
            variant='destructive'
            className={!post.translated_content && post.content ? 'w-auto' : 'w-full'}
          >
            Удалить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
