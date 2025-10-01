import React from 'react';
import { Progress } from './ui/progress';
import PropTypes from 'prop-types';

const ProgressSection = ({ processed, total }) => {
  const progress = total > 0 ? (processed / total) * 100 : 0;

  return (
    <div className='space-y-2'>
      <div className='flex justify-between text-sm text-gray-400'>
        <span>Прогресс</span>
        <span>
          {processed} / {total}
        </span>
      </div>
      <Progress value={progress} className='h-2' />
    </div>
  );
};

ProgressSection.propTypes = {
  processed: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

export { ProgressSection };
