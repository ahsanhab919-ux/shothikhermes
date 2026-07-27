'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen,
  Check,
  X,
  AlertCircle,
  Clock,
  Lightbulb,
  Image as ImageIcon,
  Edit3,
  Eye,
  Send,
  Save,
  Rocket,
  ChevronRight,
  Sparkles,
  Target,
  Hash,
  Tag,
  AlignLeft,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublishingPageProps {
  project?: any;
  onBackToEditor?: () => void;
  onSaveDraft?: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  sublabel: string;
  status: 'complete' | 'pending' | 'required';
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: '1',
    label: 'Manuscript Complete',
    sublabel: '45,000 words verified',
    status: 'complete',
  },
  {
    id: '2',
    label: 'Cover Art Linked',
    sublabel: 'High-resolution CMYK',
    status: 'complete',
  },
  {
    id: '3',
    label: 'Metadata Finished',
    sublabel: 'Description needs attention',
    status: 'pending',
  },
  {
    id: '4',
    label: 'Category Selection',
    sublabel: 'Select at least one category',
    status: 'required',
  },
  {
    id: '5',
    label: 'Pricing Set',
    sublabel: '$9.99 (Standard Tier)',
    status: 'complete',
  },
];

const KEYWORDS = ['Cyberpunk', 'Thriller', 'Dystopian'];

export function PublishingPage({ project, onBackToEditor, onSaveDraft }: PublishingPageProps) {
  const [title, setTitle] = useState('The Obsidian Protocol');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState(
    'In a world where digital consciousness is the new currency, a rogue agent uncovers the obsidian protocol—a secret directive that threatens to rewrite the human soul. This cyberpunk thriller takes you on a journey through the neon-drenched streets of Neo-Tokyo...'
  );
  const [keywords, setKeywords] = useState(KEYWORDS);
  const [category, setCategory] = useState('thriller');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const completedCount = CHECKLIST_ITEMS.filter(i => i.status === 'complete').length;
  const readiness = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  const removeKeyword = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !keywords.includes(keyword)) {
      setKeywords(prev => [...prev, keyword]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-brand-canvas">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-brand-canvas/80 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-brand">
              <BookOpen className="w-7 h-7" />
              <h1 className="text-xl font-black tracking-tight">BookPublish</h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={onBackToEditor}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-brand transition-colors"
              >
                Back to Editor
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onSaveDraft}
              className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
            >
              Save Draft
            </button>
            <button 
              onClick={() => setShowPublishModal(true)}
              className="bg-brand hover:bg-brand/90 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-brand/20 transition-all flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Publish
            </button>
            <div className="h-10 w-10 rounded-full border-2 border-brand/20 bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-500">U</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Breadcrumbs & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
            <span>Projects</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-brand">The Obsidian Protocol</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-zinc-900 dark:text-white">Publishing Setup</span>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white">Publishing and Metadata Setup</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-lg">Finalize your book details and manuscript requirements before going live.</p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Publishing Checklist */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-brand" />
                Publishing Checklist
              </h3>
              
              <div className="space-y-4">
                {CHECKLIST_ITEMS.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 group">
                    <div className={cn(
                      "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                      item.status === 'complete' && "bg-emerald-500/10 text-emerald-500",
                      item.status === 'pending' && "bg-amber-500/10 text-amber-500",
                      item.status === 'required' && "bg-red-500/10 text-red-500"
                    )}>
                      {item.status === 'complete' && <Check className="w-3.5 h-3.5" />}
                      {item.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                      {item.status === 'required' && <X className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.label}</p>
                      <p className={cn(
                        "text-xs",
                        item.status === 'required' && "text-red-500 italic"
                      )}>{item.sublabel}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-zinc-500">Readiness</span>
                  <span className="text-sm font-bold text-brand">{readiness}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand h-full rounded-full shadow-[0_0_8px_rgba(19,127,236,0.4)]"
                    style={{ width: `${readiness}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI Insight */}
            <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-brand mb-2">
                <Lightbulb className="w-5 h-5" />
                <h4 className="font-bold text-sm uppercase tracking-wider">AI Insight</h4>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Books with at least 7 keywords see a <span className="font-bold">24% higher</span> discovery rate. You currently have {keywords.length}.
              </p>
            </div>
          </aside>

          {/* Center Column: Metadata Form */}
          <section className="col-span-12 lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-6 space-y-8">
                {/* Book Title Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-brand pl-3">General Information</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Book Title</label>
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Subtitle <span className="text-zinc-400 font-normal">(Optional)</span>
                      </label>
                      <input 
                        type="text" 
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Enter a catchy subtitle..."
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold border-l-4 border-brand pl-3">Description & Blurb</h3>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold hover:bg-brand/20 transition-all">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Assist
                    </button>
                  </div>
                  
                  <div className="relative">
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write a compelling blurb for your book..."
                      rows={8}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs font-medium text-zinc-500">
                      {description.length} / 4000
                    </div>
                  </div>
                </div>

                {/* Categorization Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-brand pl-3">Keywords & Category</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Search Keywords</label>
                      <div className="flex flex-wrap gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg min-h-[46px] items-center">
                        {keywords.map((keyword) => (
                          <span 
                            key={keyword}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-brand/20 text-brand text-xs font-bold"
                          >
                            {keyword}
                            <button 
                              onClick={() => removeKeyword(keyword)}
                              className="hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input 
                          type="text"
                          placeholder="Add keywords..."
                          className="flex-grow bg-transparent border-none text-xs outline-none focus:ring-0 px-2 text-zinc-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addKeyword(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Primary Category</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all appearance-none"
                      >
                        <option value="">Select a category...</option>
                        <option value="scifi">Science Fiction &gt; Cyberpunk</option>
                        <option value="thriller">Mystery &amp; Thriller &gt; Techno-thriller</option>
                        <option value="nonfiction">Non-Fiction &gt; Technology</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-zinc-50 dark:bg-zinc-800/30 p-6 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
                <button className="px-5 py-2 rounded-lg text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                  Discard Changes
                </button>
                <button className="bg-brand/10 text-brand hover:bg-brand/20 px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Progress
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Cover Preview */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-brand" />
                Cover Preview
              </h3>
              
              <div className="relative group aspect-[2/3] w-full max-w-[280px] mx-auto rounded-lg overflow-hidden shadow-2xl shadow-black/40 border border-zinc-800 bg-zinc-900">
                {/* Simulated Book Cover */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-indigo-950 to-brand/40 flex flex-col justify-between p-6 overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-brand/80 mb-1">A Tech Thriller</p>
                    <h4 className="text-2xl font-black leading-tight text-white italic">{title.toUpperCase()}</h4>
                  </div>
                  
                  <div className="relative z-10 text-right">
                    <div className="h-px bg-white/20 w-12 ml-auto mb-2"></div>
                    <p className="text-xs font-bold tracking-widest text-white/90">AUTHOR NAME</p>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand/20 blur-3xl rounded-full"></div>
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                  <button className="bg-white text-zinc-950 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-brand hover:text-white transition-all">
                    <Edit3 className="w-3.5 h-3.5" />
                    Change Cover
                  </button>
                  <button className="bg-transparent border border-white text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider hover:bg-white/10 transition-all">
                    <Eye className="w-3.5 h-3.5" />
                    Full Preview
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Dimensions</span>
                  <span className="font-bold">1600 x 2400 px</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">File Size</span>
                  <span className="font-bold">2.4 MB</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Color Profile</span>
                  <span className="font-bold">CMYK / Fogra39</span>
                </div>
              </div>
            </div>

            {/* Unsaved Progress Warning */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center text-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
              <h4 className="font-bold text-sm mb-1">Unsaved Progress</h4>
              <p className="text-xs text-zinc-500 mb-4">Your description was updated 2 minutes ago but hasn't been synced.</p>
              <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-xs font-bold transition-all">
                Sync Now
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <>
            <div 
              className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-sm"
              onClick={() => setShowPublishModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10" />
                  </div>
                  
                  <h2 className="text-2xl font-black mb-2">Ready for Publication?</h2>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                    You're about to publish <span className="text-zinc-900 dark:text-white font-bold">"{title}"</span>. Once live, metadata changes may take up to 24 hours to propagate.
                  </p>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-8 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Estimated Reach</span>
                      <span className="font-bold text-emerald-500">12 Global Markets</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Listing Price</span>
                      <span className="font-bold text-zinc-900 dark:text-white">$9.99 USD</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        setShowPublishModal(false);
                        onBackToEditor?.();
                      }}
                      className="px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-sm"
                    >
                      Back to Editor
                    </button>
                    <button className="bg-brand hover:bg-brand/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand/30 transition-all text-sm">
                      Confirm & Publish
                    </button>
                  </div>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 text-center border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-medium tracking-widest">
                    By clicking confirm, you agree to our distribution terms.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Publish Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => setShowPublishModal(true)}
          className="bg-brand hover:scale-105 active:scale-95 text-white h-14 w-14 rounded-full flex items-center justify-center shadow-2xl shadow-brand/40 transition-all group"
        >
          <Send className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
}
