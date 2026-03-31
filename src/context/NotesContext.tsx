import React, { createContext, useState, useContext, useEffect } from 'react';
import RNFS from 'react-native-fs';

export interface Note {
  id: string;
  scenario: string;
  mode: string;
  query: string;
  response: string;
  timestamp: number;
}

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'timestamp'>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);
const NOTES_FILE = `${RNFS.DocumentDirectoryPath}/bolsaathi_notes.json`;

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const exists = await RNFS.exists(NOTES_FILE);
        if (exists) {
          const content = await RNFS.readFile(NOTES_FILE, 'utf8');
          setNotes(JSON.parse(content));
        }
      } catch (e) {
        console.error('Failed to load notes', e);
      }
    };
    loadNotes();
  }, []);

  const saveNotes = async (newNotes: Note[]) => {
    try {
      await RNFS.writeFile(NOTES_FILE, JSON.stringify(newNotes), 'utf8');
    } catch (e) {
      console.error('Failed to save notes', e);
    }
  };

  const addNote = async (noteData: Omit<Note, 'id' | 'timestamp'>) => {
    const newNote: Note = {
      ...noteData,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
  };

  const deleteNote = async (id: string) => {
    const updatedNotes = notes.filter((n) => n.id !== id);
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, deleteNote }}>{children}</NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within NotesProvider');
  return context;
};
