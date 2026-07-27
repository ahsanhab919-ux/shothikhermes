'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Brain, Heart, Shield, Sparkles, Cloud, CloudOff } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { EnneagramEngine, type CharacterDNA, type EnneagramType } from '@/lib/nobel-engine';
import { cn } from '@/lib/utils';

interface CharacterPanelProps {
  projectId: string;
}

export function CharacterPanel({ projectId }: CharacterPanelProps) {
  const [characters, setCharacters] = useState<CharacterDNA[]>([]);
  const [selectedChar, setSelectedChar] = useState<CharacterDNA | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveCharactersMutation = useMutation(api.writing.saveCharacters);
  const savedData = useQuery(api.writing.getCharacters, { localProjectId: projectId });

  useEffect(() => {
    if (Array.isArray(savedData)) {
      setCharacters(savedData as CharacterDNA[]);
    }
  }, [savedData]);

  const persistCharacters = useCallback(async (updated: CharacterDNA[]) => {
    setSyncStatus('saving');
    try {
      await saveCharactersMutation({
        localProjectId: projectId,
        characters: updated as any,
      });
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch {
      setSyncStatus('error');
    }
  }, [projectId, saveCharactersMutation]);

  const createCharacter = (name: string, type: EnneagramType) => {
    const newChar = EnneagramEngine.generateCharacterDNA(name, type);
    const updated = [...characters, newChar];
    setCharacters(updated);
    setSelectedChar(newChar);
    setShowCreate(false);
    persistCharacters(updated);
  };

  if (showCreate) {
    return (
      <CreateCharacterForm
        onCreate={createCharacter}
        onCancel={() => setShowCreate(false)}
      />
    );
  }

  if (selectedChar) {
    return (
      <CharacterDetail
        character={selectedChar}
        onBack={() => setSelectedChar(null)}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
            Characters
          </span>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus === 'saving' && (
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Cloud className="w-3 h-3 animate-pulse" /> Saving…
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="text-[10px] text-green-500 flex items-center gap-1">
              <Cloud className="w-3 h-3" /> Saved
            </span>
          )}
          {syncStatus === 'error' && (
            <span className="text-[10px] text-red-400 flex items-center gap-1">
              <CloudOff className="w-3 h-3" /> Error
            </span>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-2">No characters yet</p>
          <p className="text-xs">Create characters with psychological depth</p>
        </div>
      ) : (
        <div className="space-y-2">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedChar(char)}
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                  {char.name}
                </span>
                <span className="text-xs text-zinc-500">
                  Type {char.enneagram.type}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {EnneagramEngine.getTypeData(char.enneagram.type).name}
              </div>
              <div className="mt-2 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${char.arc.progress}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                Arc: {char.arc.progress}%
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateCharacterForm({
  onCreate,
  onCancel
}: {
  onCreate: (name: string, type: EnneagramType) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<EnneagramType>(3);

  const types: { num: EnneagramType; name: string; center: string }[] = [
    { num: 1, name: 'The Reformer', center: 'gut' },
    { num: 2, name: 'The Helper', center: 'heart' },
    { num: 3, name: 'The Achiever', center: 'heart' },
    { num: 4, name: 'The Individualist', center: 'heart' },
    { num: 5, name: 'The Investigator', center: 'head' },
    { num: 6, name: 'The Loyalist', center: 'head' },
    { num: 7, name: 'The Enthusiast', center: 'head' },
    { num: 8, name: 'The Challenger', center: 'gut' },
    { num: 9, name: 'The Peacemaker', center: 'gut' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), selectedType);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600">
          ←
        </button>
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          New Character
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Character name"
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
            Enneagram Type
          </label>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {types.map((type) => (
              <button
                key={type.num}
                type="button"
                onClick={() => setSelectedType(type.num)}
                className={cn(
                  "w-full p-2 text-left rounded-lg border transition-colors",
                  selectedType === type.num
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">
                    {type.num}. {type.name}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    type.center === 'gut' ? 'bg-red-100 text-red-700' :
                    type.center === 'heart' ? 'bg-pink-100 text-pink-700' :
                    'bg-blue-100 text-blue-700'
                  )}>
                    {type.center}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create Character
        </button>
      </form>
    </div>
  );
}

function CharacterDetail({
  character,
  onBack
}: {
  character: CharacterDNA;
  onBack: () => void;
}) {
  const typeData = EnneagramEngine.getTypeData(character.enneagram.type);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-zinc-400 hover:text-zinc-600">
          ←
        </button>
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          {character.name}
        </span>
      </div>

      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span className="font-semibold text-purple-700 dark:text-purple-300">
            Type {character.enneagram.type}: {typeData.name}
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {EnneagramEngine.getInstinctDescription(character.enneagram.type, character.enneagram.instinct)}
        </p>
      </div>

      <div className="space-y-3">
        <CoreSection
          icon={Shield}
          title="Core Fear"
          content={character.enneagram.core.fear}
          color="red"
        />
        <CoreSection
          icon={Heart}
          title="Core Desire"
          content={character.enneagram.core.desire}
          color="pink"
        />
        <CoreSection
          icon={Brain}
          title="The Lie"
          content={character.enneagram.core.lie}
          color="amber"
        />
        <CoreSection
          icon={Sparkles}
          title="The Truth"
          content={character.enneagram.core.truth}
          color="green"
        />
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">
          Character Arc
        </h4>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          <p><span className="text-zinc-400">From:</span> {character.arc.starting}</p>
          <p className="mt-1"><span className="text-zinc-400">To:</span> {character.arc.target}</p>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Arc Progress</span>
            <span>{character.arc.progress}%</span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${character.arc.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CoreSection({
  icon: Icon,
  title,
  content,
  color
}: {
  icon: React.ElementType;
  title: string;
  content: string;
  color: 'red' | 'pink' | 'amber' | 'green';
}) {
  const colorClasses = {
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  };

  return (
    <div className={cn("p-3 rounded-lg", colorClasses[color])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="text-sm opacity-90">{content}</p>
    </div>
  );
}
