import React from 'react';
import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Column from '../components/Column';
import Board from '../components/Board';

describe('Column and Board Components', () => {
  const sampleTasks = [
    {
      _id: 'job-1',
      companyName: 'Stripe',
      jobTitle: 'Backend Engineer',
      status: 'Applied',
      priority: 'High',
    },
    {
      _id: 'job-2',
      companyName: 'Brex',
      jobTitle: 'Fullstack Dev',
      status: 'Applied',
      priority: 'Medium',
    },
  ];

  test('Column displays title, task count, and renders card items', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Column
          columnId="Applied"
          title="Applied"
          tasks={sampleTasks}
          moveTask={jest.fn()}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
          onView={jest.fn()}
        />
      </DndProvider>
    );

    const appliedElements = screen.getAllByText('Applied');
    expect(appliedElements.length).toBeGreaterThan(0);
    expect(appliedElements[0]).toHaveClass('column-title');
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();
    expect(screen.getByText('Brex')).toBeInTheDocument();
  });

  test('Column displays empty placeholder when there are no tasks', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Column
          columnId="Offer"
          title="Offer"
          tasks={[]}
          moveTask={jest.fn()}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
          onView={jest.fn()}
        />
      </DndProvider>
    );

    expect(screen.getByText(/drop cards here/i)).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('Board renders all 6 standard pipeline columns', () => {
    const tasksByColumn = {
      Saved: [],
      Applied: [sampleTasks[0]],
      'Online Assessment': [],
      Interview: [],
      Offer: [],
      Rejected: [],
    };

    render(
      <DndProvider backend={HTML5Backend}>
        <Board
          tasks={tasksByColumn}
          onMoveTask={jest.fn()}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
          onView={jest.fn()}
        />
      </DndProvider>
    );

    const expectedColumns = [
      'Saved',
      'Applied',
      'Online Assessment',
      'Interview',
      'Offer',
      'Rejected',
    ];

    expectedColumns.forEach((status) => {
      const elements = screen.getAllByText(status);
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0]).toHaveClass('column-title');
    });

    expect(screen.getByText('Stripe')).toBeInTheDocument();
  });
});
