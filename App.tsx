
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Flashcard, Category, User } from './types';
import Auth from './components/Auth';
import ChatBot from './components/ChatBot';
import Intro from './components/Intro';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fl_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('fl_categories');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Arrays' },
      { id: '2', name: 'Strings' },
      { id: '3', name: 'Graphs' },
      { id: '4', name: 'Trees' },
    ];
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('fl_cards');
    return saved ? JSON.parse(saved) : [
      { id: 'f1', categoryId: '1', question: 'Largest Element in an Array', answer: 'Find the maximum value by iterating once or using a built-in max function.' },
      { id: 'f3', categoryId: '2', question: 'Palindrome Check', answer: 'Compare the string with its reverse or use two pointers meeting at center.' },
    ];
  });

  useEffect(() => {
    if (user) localStorage.setItem('fl_user', JSON.stringify(user));
    else localStorage.removeItem('fl_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('fl_categories', JSON.stringify(categories));
    localStorage.setItem('fl_cards', JSON.stringify(flashcards));
  }, [categories, flashcards]);

  const [activeCategory, setActiveCategory] = useState<string>('1');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newAnswerImage, setNewAnswerImage] = useState<string | undefined>(undefined);
  const [newAnswerPdf, setNewAnswerPdf] = useState<string | undefined>(undefined);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryEditName, setCategoryEditName] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCardId(card.id);
    setSelectedCategoryId(card.categoryId);
    setNewQuestion(card.question);
    setNewAnswer(card.answer);
    setNewAnswerImage(card.answerImage);
    setNewAnswerPdf(card.answerPdf);
    document.getElementById('manage-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteCard = (id: string) => {
    if (window.confirm("Delete this flashcard?")) {
      setFlashcards(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm("Deleting this module will also delete all its flashcards. Continue?")) {
      setCategories(prev => prev.filter(c => c.id !== id));
      setFlashcards(prev => prev.filter(f => f.categoryId !== id));
      if (activeCategory === id) setActiveCategory(categories[0]?.id || '');
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCategoryEditName(cat.name);
  };

  const saveCategoryEdit = () => {
    if (!categoryEditName.trim()) return;
    setCategories(prev => prev.map(c => c.id === editingCategoryId ? { ...c, name: categoryEditName } : c));
    setEditingCategoryId(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewAnswerImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => setNewAnswerPdf(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openPdfInNewTab = (base64Data: string) => {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  const filteredFlashcards = useMemo(() => {
    return flashcards.filter(f => f.categoryId === activeCategory);
  }, [flashcards, activeCategory]);

  if (showIntro) {
    return <Intro onComplete={() => setShowIntro(false)} />;
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] relative overflow-x-hidden">
      {/* Top Level Layering: Fixed components must be sibling to avoid transform-induced positioning bugs */}
      <ChatBot />

      <div className="relative z-10 min-h-screen flex flex-col">
        <nav className="flex items-center justify-between px-8 md:px-12 py-6 border-b border-white/5 sticky top-0 bg-black/95 backdrop-blur-xl z-[100]">
          <div className="flex items-center gap-12">
            <span className="text-red-700 font-black italic text-2xl tracking-tighter hover:scale-105 transition-transform cursor-pointer">⚡TUF-FLASH</span>
            <span className="font-bold text-xs uppercase tracking-widest text-white/40 hidden md:block">DSA TRACKER</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-default">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-red-900 flex items-center justify-center text-[10px] font-black uppercase overflow-hidden border border-white/20">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="User" /> : user.name.charAt(0)}
              </div>
              <span className="text-xs font-black text-white">{user.name}</span>
            </div>
            <button 
              onClick={() => setUser(null)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-900/20 hover:text-red-500 transition-all border border-white/5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </nav>

        <header className="pt-28 pb-20 text-center max-w-5xl mx-auto px-6">
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">
            Master the <span className="text-[#A91D3A] inline-block hover:scale-110 transition-transform italic">Sheet</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium tracking-tight">
            Tap cards to reveal logic. Questions are exclusive to the front face.
          </p>
        </header>

        <main className="max-w-6xl mx-auto px-8 relative z-10 w-full pb-40">
          <section className="mb-24">
            <div className="flex flex-wrap justify-center gap-4 mb-20">
              {categories.map(cat => (
                <div key={cat.id} className="relative group">
                  {editingCategoryId === cat.id ? (
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-red-500/50">
                      <input 
                        autoFocus
                        className="bg-transparent border-none outline-none text-white font-bold w-24"
                        value={categoryEditName}
                        onChange={(e) => setCategoryEditName(e.target.value)}
                        onBlur={saveCategoryEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveCategoryEdit()}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveCategory(cat.id)}
                      className={`text-lg font-bold px-6 py-3 rounded-2xl transition-all border border-transparent flex items-center gap-3 ${activeCategory === cat.id ? 'text-white bg-white/10 border-white/10 shadow-lg scale-105' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}
                    >
                      {cat.name}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg onClick={(e) => { e.stopPropagation(); handleEditCategory(cat); }} className="w-4 h-4 text-gray-400 hover:text-blue-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        <svg onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {filteredFlashcards.length > 0 ? (
                filteredFlashcards.map(card => (
                  <div key={card.id} className={`flip-card ${flippedIds.has(card.id) ? 'is-flipped' : ''}`}>
                    <div className="flip-card-inner">
                      {/* FRONT OF CARD: QUESTION ONLY */}
                      <div className="flip-card-front bg-[#0A0A0A] border border-white/5 shadow-2xl flex flex-col items-center">
                        <div className="flex-1 flex flex-col items-center justify-start text-center w-full cursor-pointer p-12" onClick={() => toggleFlip(card.id)}>
                          <h3 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mt-6">
                            {card.question}
                          </h3>
                          
                          <div className="flex-1 flex flex-col items-center justify-center">
                             <div className="w-16 h-16 rounded-full border border-red-900/30 flex items-center justify-center mb-6 text-red-700 animate-pulse">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                </svg>
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-900">Reveal Implementation</span>
                          </div>
                        </div>

                        <div className="w-full flex justify-center gap-12 py-8 bg-black/40 border-t border-white/5 mt-auto">
                          <button onClick={(e) => { e.stopPropagation(); handleEditCard(card); }} className="text-[11px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors">Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }} className="text-[11px] font-black text-red-950 hover:text-red-500 uppercase tracking-widest transition-colors">Delete</button>
                        </div>
                      </div>

                      {/* BACK OF CARD: SOLUTION ONLY */}
                      <div className="flip-card-back bg-[#080808] border border-red-900/20 shadow-2xl flex flex-col p-12">
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 cursor-pointer" onClick={() => toggleFlip(card.id)}>
                          <span className="block text-[11px] font-black tracking-[0.5em] text-red-600 mb-10 uppercase text-center">Logic & Implementation</span>
                          <div className="space-y-8">
                            <p className="text-white text-xl md:text-2xl leading-relaxed font-medium">{card.answer || "Implementation details pending."}</p>
                            {card.answerImage && <img src={card.answerImage} className="w-full h-auto rounded-3xl border border-white/10 shadow-xl" alt="Solution visual" />}
                            {card.answerPdf && (
                              <button onClick={(e) => { e.stopPropagation(); openPdfInNewTab(card.answerPdf!); }} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-white/10 transition-all">
                                Open Solution PDF
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-10">
                          <button onClick={() => toggleFlip(card.id)} className="w-full py-6 rounded-[1.5rem] bg-white/5 border border-white/10 text-xs font-black text-red-600 hover:bg-white/10 uppercase tracking-[0.3em] transition-all">
                            Flip Back
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-40 border-2 border-dashed border-white/5 rounded-[4rem] text-gray-800 font-black text-4xl tracking-tighter opacity-10 uppercase">
                  Empty Module
                </div>
              )}
            </div>
          </section>

          <section id="manage-content" className="bg-[#050505] border border-white/5 rounded-[4rem] p-12 md:p-20 shadow-2xl shadow-red-900/5">
            <div className="max-w-4xl mx-auto space-y-24">
              <div className="space-y-12 text-center">
                <h2 className="text-3xl font-black tracking-tight uppercase italic">Add Module</h2>
                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                  <input 
                    type="text"
                    placeholder="E.g. Dynamic Programming"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-black border border-white/10 rounded-3xl px-8 py-5 focus:border-red-500/50 outline-none transition-all placeholder-gray-800 font-bold"
                  />
                  <button 
                    onClick={() => {
                      if (!newCategoryName.trim()) return;
                      const id = Date.now().toString();
                      setCategories([...categories, { id, name: newCategoryName }]);
                      setNewCategoryName('');
                      setActiveCategory(id);
                    }}
                    className="px-10 py-5 bg-[#A91D3A] rounded-3xl font-black shadow-lg shadow-red-900/20 active:scale-95 transition-transform uppercase text-xs tracking-widest"
                  >
                    Create
                  </button>
                </div>
              </div>

              <div className="space-y-12">
                <h2 className="text-3xl font-black text-center tracking-tight uppercase italic">
                  {editingCardId ? 'Edit Challenge' : 'New Challenge'}
                </h2>
                <div className="space-y-6 max-w-2xl mx-auto">
                  <select 
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-3xl px-8 py-5 text-white outline-none font-bold appearance-none text-center cursor-pointer"
                  >
                    <option value="">Select Module</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input 
                    type="text"
                    placeholder="Problem Statement"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-3xl px-8 py-5 outline-none font-bold text-center"
                  />
                  <textarea 
                    placeholder="Implementation logic & complexities..."
                    rows={4}
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-3xl px-8 py-5 outline-none resize-none font-medium leading-relaxed"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button onClick={() => imageInputRef.current?.click()} className={`py-5 border rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${newAnswerImage ? 'border-green-500/50 text-green-500 bg-green-500/5' : 'border-white/10 text-gray-600 hover:border-white/20'}`}>
                      {newAnswerImage ? 'Image Attached' : 'Attach Image'}
                      <input type="file" accept="image/*" onChange={handleImageChange} ref={imageInputRef} className="hidden" />
                    </button>
                    <button onClick={() => pdfInputRef.current?.click()} className={`py-5 border rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${newAnswerPdf ? 'border-red-500/50 text-red-500 bg-red-500/5' : 'border-white/10 text-gray-600 hover:border-white/20'}`}>
                      {newAnswerPdf ? 'PDF Attached' : 'Attach PDF'}
                      <input type="file" accept="application/pdf" onChange={handlePdfChange} ref={pdfInputRef} className="hidden" />
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                         if (!selectedCategoryId || !newQuestion.trim()) return;
                         const cardData: Flashcard = {
                           id: editingCardId || Date.now().toString(),
                           categoryId: selectedCategoryId,
                           question: newQuestion,
                           answer: newAnswer,
                           answerImage: newAnswerImage,
                           answerPdf: newAnswerPdf
                         };
                         if (editingCardId) setFlashcards(flashcards.map(f => f.id === editingCardId ? cardData : f));
                         else setFlashcards([...flashcards, cardData]);
                         setEditingCardId(null);
                         setNewQuestion(''); setNewAnswer(''); setNewAnswerImage(undefined); setNewAnswerPdf(undefined);
                      }}
                      className="flex-1 py-8 bg-[#A91D3A] rounded-[2rem] font-black text-2xl shadow-2xl shadow-red-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase"
                    >
                      {editingCardId ? 'Update' : 'Save'}
                    </button>
                    {editingCardId && (
                      <button 
                        onClick={() => {
                          setEditingCardId(null);
                          setNewQuestion(''); setNewAnswer(''); setNewAnswerImage(undefined); setNewAnswerPdf(undefined);
                        }}
                        className="px-10 bg-white/5 border border-white/10 rounded-[2rem] font-bold text-gray-400 uppercase text-xs"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
