import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface StepNotesProps {
  stepId: string;
  initialNote: string;
  onNoteChange: (stepId: string, note: string) => void;
}

const MAX_CHARS = 500;

export function StepNotes({ stepId, initialNote, onNoteChange }: StepNotesProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState(initialNote);

  // Auto-save after 1 second of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (note !== initialNote) {
        onNoteChange(stepId, note);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [note, stepId, onNoteChange, initialNote]);

  // Sync with external changes
  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setNote(value);
    }
  };

  const charCount = note.length;
  const isNearLimit = charCount > MAX_CHARS * 0.8;

  return (
    <div className="space-y-2">
      <label htmlFor={`notes-${stepId}`} className="text-sm font-medium">
        {t('timer.notes_for_step')}
      </label>
      <textarea
        id={`notes-${stepId}`}
        value={note}
        onChange={handleChange}
        placeholder={t('timer.notes_for_step')}
        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical"
        rows={4}
      />
      <div className={`text-xs text-right ${isNearLimit ? 'text-yellow-600' : 'text-muted-foreground'}`}>
        {charCount} / {MAX_CHARS}
      </div>
    </div>
  );
}
