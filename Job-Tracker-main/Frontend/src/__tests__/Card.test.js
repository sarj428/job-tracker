import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Card from '../components/Card';

describe('Card Component', () => {
  const sampleTask = {
    _id: 'job-123',
    companyName: 'Acme Corp',
    jobTitle: 'Software Engineer',
    location: 'Remote',
    status: 'Interview',
    priority: 'High',
    appliedDate: '2026-03-01T00:00:00.000Z',
    interview: {
      scheduled: true,
      date: '2026-03-15T00:00:00.000Z',
      time: '14:00',
      type: 'Technical',
    },
  };

  const renderCard = (props = {}) => {
    const defaultProps = {
      task: sampleTask,
      fromColumn: 'Interview',
      onDelete: jest.fn(),
      onEdit: jest.fn(),
      onView: jest.fn(),
      ...props,
    };

    return {
      ...render(
        <DndProvider backend={HTML5Backend}>
          <Card {...defaultProps} />
        </DndProvider>
      ),
      props: defaultProps,
    };
  };

  test('renders company name, job title, location, status, and priority badges', () => {
    renderCard();

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText(/Remote/i)).toBeInTheDocument();
    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText(/🎙 Interview/i)).toBeInTheDocument();
  });

  test('calls onView when the card body is clicked', () => {
    const { props } = renderCard();

    fireEvent.click(screen.getByText('Acme Corp'));
    expect(props.onView).toHaveBeenCalledWith(sampleTask);
  });

  test('calls onEdit with task when edit button is clicked without bubbling to onView', () => {
    const { props } = renderCard();

    const editBtn = screen.getByTitle('Edit');
    fireEvent.click(editBtn);

    expect(props.onEdit).toHaveBeenCalledWith(sampleTask);
    expect(props.onView).not.toHaveBeenCalled();
  });

  test('calls onDelete with job ID when delete button is clicked without bubbling to onView', () => {
    const { props } = renderCard();

    const deleteBtn = screen.getByTitle('Delete');
    fireEvent.click(deleteBtn);

    expect(props.onDelete).toHaveBeenCalledWith('job-123');
    expect(props.onView).not.toHaveBeenCalled();
  });

  test('returns null when task is null/undefined', () => {
    const { container } = render(
      <DndProvider backend={HTML5Backend}>
        <Card
          task={null}
          fromColumn="Saved"
          onDelete={jest.fn()}
          onEdit={jest.fn()}
          onView={jest.fn()}
        />
      </DndProvider>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
