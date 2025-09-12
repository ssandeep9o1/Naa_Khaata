import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  Container, Typography, Box, CircularProgress,
} from '@mui/material';
import './NotesPage.css';

interface Note {
  id: string;
  title: string | null; // Title can be null
  content: string;
  created_at: string;
}

interface Task {
  id: string;
  Task: string;
  created_at: string;
  is_completed: boolean;
}

const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const [isTasksView, setIsTasksView] = useState(false);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  // State is now simplified to a single input
  const [newNoteInput, setNewNoteInput] = useState('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTask, setNewTask] = useState('');

  // Simplified data fetching
  useEffect(() => {
    if (!user) return;

    const fetchNotes = async () => {
      setLoadingNotes(true);
      const { data, error } = await supabase.from('notes').select('*').eq('shop_id', user.id).order('created_at', { ascending: false });
      if (error) console.error('Error fetching notes:', error);
      else setNotes(data || []);
      setLoadingNotes(false);
    };

    const fetchTasks = async () => {
      setLoadingTasks(true);
      const { data, error } = await supabase.from('tasks').select('*').eq('shop_id', user.id).order('is_completed', { ascending: true }).order('created_at', { ascending: false });
      if (error) console.error('Error fetching tasks:', error);
      else setTasks(data || []);
      setLoadingTasks(false);
    };

    fetchNotes();
    fetchTasks();
  }, [user]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newNoteInput.trim();
    if (!content || !user) return;

    const { data, error } = await supabase
      .from('notes')
      .insert({ content, shop_id: user.id }) // Only inserting content
      .select()
      .single();

    if (error) {
      alert('Error adding note: ' + error.message);
    } else if (data) {
      setNotes([data, ...notes]);
      setNewNoteInput(''); // Reset the single input
    }
  };


  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) alert('Error deleting note: ' + error.message);
      else setNotes(notes.filter(note => note.id !== id));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskContent = newTask.trim();
    if (!taskContent || !user) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ Task: taskContent, shop_id: user.id })
      .select()
      .single();

    if (error) {
      alert('Error adding task: ' + error.message);
    } else if (data) {
      setTasks([data, ...tasks]);
      setNewTask('');
    }
  };
  
  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) alert('Error deleting task: ' + error.message);
      else setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const handleToggleTask = async (id: string, currentStatus: boolean) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, is_completed: !currentStatus } : task));
    const { error } = await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id);
    if (error) {
      alert('Error updating task. Please try again.');
      setTasks(tasks.map(task => task.id === id ? { ...task, is_completed: currentStatus } : task));
    }
  };
  
  const renderNotesView = () => (
    <div className="modern-notes-app">
      <h1>My Notes</h1>
      
      <form onSubmit={handleAddNote} className="add-note-form">
        <input
          type="text"
          className="note-input"
          placeholder="Type a new note..."
          value={newNoteInput}
          onChange={(e) => setNewNoteInput(e.target.value)}
          required
        />
        <button className="add-button" title="Add Note" type="submit">
          <svg className="plus-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5V19.5M4.5 12H19.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>

      {loadingNotes ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : (
        <div className="notes-list">
          {notes.length > 0 ? notes.map((note) => (
            <div className="note-item" key={note.id}>
              <div className="note-content">
                <p className="note-text">{note.content}</p>
                <span className="note-timestamp">
                  {new Date(note.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
              <button className="delete-button" title="Delete note" onClick={() => handleDeleteNote(note.id)}>
                <svg viewBox="0 0 15 17.5" height="17.5" width="15" xmlns="http://www.w3.org/2000/svg" className="icon"><path transform="translate(-2.5 -1.25)" d="M15,18.75H5A1.251,1.251,0,0,1,3.75,17.5V5H2.5V3.75h15V5H16.25V17.5A1.251,1.251,0,0,1,15,18.75ZM5,5V17.5H15V5Zm7.5,10H11.25V7.5H12.5V15ZM8.75,15H7.5V7.5H8.75V15ZM12.5,2.5h-5V1.25h5V2.5Z" id="Fill"></path></svg>
              </button>
            </div>
          )) : (
            <Typography sx={{ textAlign: 'center', my: 4, color: '#888' }}>
              No notes found.
            </Typography>
          )}
        </div>
      )}
    </div>
  );

  const renderTasksView = () => (
    <div className="modern-checklist">
        <h1>My Tasks</h1>

        <form onSubmit={handleAddTask} className="add-task-form">
            <input 
              type="text"
              className="add-task-input" 
              placeholder="Add a new task..." 
              value={newTask} onChange={(e) => setNewTask(e.target.value)}
              required
            />
            <button className="add-button" title="Add Task" type="submit">
              <svg className="plus-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5V19.5M4.5 12H19.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        {loadingTasks ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
        ) : (
            <div className='checklist-rows'>
                {tasks.length > 0 ? tasks.map((task) => (
                    <div className="checklist-row" key={task.id}>
                      <label className="task-container">
                          <input type="checkbox" className="task-checkbox" checked={task.is_completed} onChange={() => handleToggleTask(task.id, task.is_completed)} />
                            <span className="custom-checkbox">
                            <span className="checkbox-fill"></span>
                              <svg className="tick-mark" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeWidth="2.5" stroke="white" fill="none" d="M6,12.4l4.2,4.2L18,7"/></svg>
                            </span>
                            <span className="task-label">{task.Task}</span>
                      </label>
                          <button className="delete-button" title="Delete task" onClick={() => handleDeleteTask(task.id)}>
                            <svg viewBox="0 0 15 17.5" height="17.5" width="15" xmlns="http://www.w3.org/2000/svg" className="icon"><path transform="translate(-2.5 -1.25)" d="M15,18.75H5A1.251,1.251,0,0,1,3.75,17.5V5H2.5V3.75h15V5H16.25V17.5A1.251,1.251,0,0,1,15,18.75ZM5,5V17.5H15V5Zm7.5,10H11.25V7.5H12.5V15ZM8.75,15H7.5V7.5H8.75V15ZM12.5,2.5h-5V1.25h5V2.5Z" id="Fill"></path></svg>
                          </button>
                    </div>
                )):(
                    <Typography sx={{ textAlign: 'center', my: 4, color: '#888' }}>
                        No tasks found.
                    </Typography>
                )}
              </div>
            )}
          </div>  
    );

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
        <label className="liquid-switch">
          <input type="checkbox" checked={isTasksView} onChange={(e) => setIsTasksView(e.target.checked)} />
          <div className="switch-content"><div className="toggle-button"></div><span className="label tasks">Notes</span><span className="label notes">Tasks</span></div>
        </label>
      </Box>

      {isTasksView ? renderTasksView() : renderNotesView()}
      
      <svg style={{ display: 'none' }}>
        <defs><filter id="gooey-effect"><feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" /><feComposite in="SourceGraphic" in2="goo" operator="atop" /></filter></defs>
      </svg>
    </Container>
  );
};

export default NotesPage;