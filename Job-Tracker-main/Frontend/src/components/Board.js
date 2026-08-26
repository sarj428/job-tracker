import React from 'react';
import Column from './Column';
import { COLUMN_IDS, COLUMN_NAMES } from '../utils/constants';

const Board = ({ tasks, onMoveTask, onDelete, onEdit, onView }) => {
  return (
    <div className="board-wrap">
      <div className="board">
        {Object.entries(COLUMN_NAMES).map(([columnId, title]) => (
          <Column
            key={columnId}
            columnId={columnId}
            title={title}
            tasks={tasks[columnId] || []}
            moveTask={onMoveTask}
            onDelete={onDelete}
            onEdit={onEdit}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
};

export default Board;
