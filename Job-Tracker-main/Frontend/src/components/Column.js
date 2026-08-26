import React from 'react';
import { useDrop } from 'react-dnd';
import Card from './Card';
import { STATUS_COLORS } from '../utils/constants';

const Column = ({ columnId, title, tasks, moveTask, onDelete, onEdit, onView }) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'CARD',
      drop: (item) => {
        if (item.fromColumn !== columnId) {
          moveTask(item.task, item.fromColumn, columnId);
        }
      },
      collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }),
    [columnId]
  );

  const dotColor = STATUS_COLORS[columnId] || '#6366f1';

  return (
    <div ref={drop} className={`column${isOver ? ' drag-over' : ''}`}>
      <div className="column-header">
        <div className="column-title-row">
          <div className="column-dot" style={{ backgroundColor: dotColor }} />
          <span className="column-title">{title}</span>
        </div>
        <span className="column-count">{tasks.length}</span>
      </div>

      <div className="column-cards">
        {tasks.length === 0 ? (
          <div className="column-empty">
            <div className="column-empty-icon">○</div>
            Drop cards here
          </div>
        ) : (
          tasks.map((task) => (
            <Card
              key={task._id}
              task={task}
              fromColumn={columnId}
              onDelete={onDelete}
              onEdit={onEdit}
              onView={onView}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Column;
