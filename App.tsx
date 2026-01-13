
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, Category } from './types';

const App: React.FC = () => {
  // Persistence with LocalStorage
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
      { id: 'f1', categoryId: '1', question: 'What is an array?', answer: 'A collection of elements identified by index or key.' },
      { id: 'f2', categoryId: '1', question: 'What is the index of the first element in an array?', answer: '0' },
      { id: 'f3', categoryId: '2', question: 'What is a string?', answer: 'A sequence of characters.' },
      { id: 'f4', categoryId: '2', question: 'How do you concatenate two strings?', answer: 'Using the + operator or concat() function.' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('fl_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('fl_cards', JSON.stringify(flashcards));
  }, [flashcards]);

  const [activeCategory, setActiveCategory] = useState<string>('1');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newAnswerImage, setNewAnswerImage] = useState<string | undefined>(undefined);
  const [newAnswerPdf, setNewAnswerPdf] = useState<string | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setSelectedCategoryId(card.categoryId);
    setNewQuestion(card.question);
    setNewAnswer(card.answer);
    setNewAnswerImage(card.answerImage);
    setNewAnswerPdf(card.answerPdf);
    document.getElementById('manage-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteFlashcard = (id: string) => {
    setFlashcards(prev => prev.filter(f => f.id !== id));
    setFlippedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAnswerImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert("Please select a PDF file");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAnswerPdf(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openPdfInNewTab = (base64Data: string) => {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(blob);
    window.open(fileURL);
  };

  const syncWithTUF = async () => {
    const key = import.meta.env.VITE_API_KEY;

    if (!key) {
      alert("API Key missing. Please set process.env.API_KEY.");
      return;
    }

    setIsSyncing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate a new batch of 6 high-quality DSA flashcards based specifically on the content of Striver's A2Z DSA Sheet.",
        config: {
          systemInstruction: `You are the TUF AI Assistant. Provide JSON array with 'category', 'question', 'short_answer'.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                question: { type: Type.STRING },
                short_answer: { type: Type.STRING }
              },
              required: ["category", "question", "short_answer"]
            }
          }
        },
      });

      const data = JSON.parse(response.text || "[]");
      const updatedCategories = [...categories];
      const updatedFlashcards = [...flashcards];

      data.forEach((item: any) => {
        let cat = updatedCategories.find(c => c.name.toLowerCase() === item.category.toLowerCase());
        let catId = cat?.id;
        if (!catId) {
          catId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          updatedCategories.push({ id: catId, name: item.category });
        }
        
        if (!updatedFlashcards.some(f => f.question === item.question)) {
          updatedFlashcards.push({
            id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            categoryId: catId,
            question: item.question,
            answer: item.short_answer
          });
        }
      });

      setCategories(updatedCategories);
      setFlashcards(updatedFlashcards);
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredFlashcards = useMemo(() => {
    return flashcards.filter(f => f.categoryId === activeCategory);
  }, [flashcards, activeCategory]);

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] selection:bg-red-500/30">
      <nav className="flex items-center justify-between px-12 py-6 border-b border-white/5">
        <div className="flex items-center gap-12">
          <div className="flex items-center">
            <span className="text-red-700 font-black italic text-2xl tracking-tighter">⚡TUF-Flash</span>
          </div>
          <span className="font-bold text-lg text-white/90">Dashboard</span>
        </div>
        <div className="flex gap-4">
          <button className="px-5 py-2 text-sm font-bold border border-white/20 rounded-lg hover:bg-white/5 transition">Sign Up</button>
          <button className="px-6 py-2 text-sm font-bold bg-[#A91D3A] hover:bg-[#C7253E] rounded-lg transition shadow-lg shadow-red-900/20">Log In</button>
        </div>
      </nav>

      <header className="pt-24 pb-32 text-center max-w-5xl mx-auto px-6">
        <h1 className="text-6xl md:text-8xl font-black mb-10 leading-[1.1] tracking-tight">
          The ultimate <span className="text-[#A91D3A]">learning</span>
          <br />platform
        </h1>
        <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
          Meet TUF-Flash, the new standard for learning DSA. Now supporting Text, Image, and PDF solutions.
        </p>
        <button 
          onClick={syncWithTUF}
          disabled={isSyncing}
          className={`px-10 py-4 bg-[#A91D3A] hover:bg-[#C7253E] rounded-full font-black text-lg transition-all shadow-2xl shadow-red-900/40 relative overflow-hidden group ${isSyncing ? 'opacity-70' : ''}`}
        >
          <span className={isSyncing ? 'opacity-0' : 'opacity-100'}>
            Sync TUF A2Z Sheet
          </span>
          {isSyncing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
              <span>Fetching...</span>
            </div>
          )}
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-8 pb-32">
        <section className="mb-24">
          <h2 className="text-4xl font-black text-center mb-16">What do you want to study?</h2>
          
          <div className="flex flex-wrap justify-center gap-10 mb-16">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xl font-bold transition-all relative pb-2 ${activeCategory === cat.id ? 'text-[#C7253E]' : 'text-gray-500 hover:text-white'}`}
              >
                {cat.name}
                {activeCategory === cat.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#C7253E] rounded-full shadow-[0_0_10px_#C7253E]" />}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredFlashcards.length > 0 ? (
              filteredFlashcards.map(card => (
                <div 
                  key={card.id} 
                  className="bg-[#121212] border border-white/5 rounded-3xl p-8 min-h-[400px] flex flex-col justify-between group transition-all hover:border-white/20 hover:bg-[#161616] relative"
                >
                  <div className="text-center cursor-pointer flex-1 flex flex-col justify-center" onClick={() => toggleFlip(card.id)}>
                    <h3 className="text-2xl font-black mb-4 px-2">
                      {flippedIds.has(card.id) ? 'The Logic' : card.question}
                    </h3>
                    
                    {flippedIds.has(card.id) ? (
                      <div className="space-y-6">
                         <p className="text-gray-400 text-lg leading-relaxed font-medium px-4">
                          {card.answer}
                        </p>
                        
                        {card.answerImage && (
                          <div className="mt-4 rounded-xl overflow-hidden border border-white/10 max-h-[500px] flex justify-center">
                            <img src={card.answerImage} alt="Solution" className="object-contain w-full h-full" />
                          </div>
                        )}

                        {card.answerPdf && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openPdfInNewTab(card.answerPdf!); }}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            View PDF Solution
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">Click to flip and reveal logic...</p>
                    )}
                  </div>
                  
                  <div className="mt-8 flex justify-center gap-4 border-t border-white/5 pt-6">
                    <button 
                      onClick={() => handleEdit(card)}
                      className="px-6 py-2 bg-[#2D5A47]/40 text-[#4ADE80] hover:bg-[#2D5A47] hover:text-white rounded-xl text-sm font-bold transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteFlashcard(card.id)}
                      className="px-6 py-2 bg-[#A91D3A]/20 text-[#FF4D4D] hover:bg-[#A91D3A] hover:text-white rounded-xl text-sm font-bold transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-32 border-2 border-dashed border-white/10 rounded-[3rem] text-gray-600 font-bold text-2xl italic">
                No flashcards in this category yet.
              </div>
            )}
          </div>
        </section>

        <section id="manage-content" className="bg-[#080808] border border-white/5 rounded-[3.5rem] p-16 shadow-2xl">
          <h2 className="text-4xl font-black text-center mb-16">Manage Content</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-center">New Category</h3>
              <input 
                type="text"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-8 py-5 focus:outline-none focus:border-[#A91D3A] transition text-lg"
              />
              <button 
                onClick={() => {
                  if (!newCategoryName.trim()) return;
                  const id = Date.now().toString();
                  setCategories([...categories, { id, name: newCategoryName }]);
                  setNewCategoryName('');
                  setActiveCategory(id);
                }}
                className="w-full py-5 bg-[#A91D3A] hover:bg-[#C7253E] rounded-2xl font-black text-xl transition shadow-xl"
              >
                Create Category
              </button>
            </div>

            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-center">New Flashcard</h3>
              <div className="relative">
                <select 
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-2xl px-8 py-5 focus:outline-none focus:border-[#A91D3A] transition appearance-none text-lg text-white font-medium"
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
              </div>
              
              <input 
                type="text"
                placeholder="Question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-8 py-5 focus:outline-none focus:border-[#A91D3A] transition text-lg"
              />
              
              <textarea 
                placeholder="Answer Text (Optional if image/PDF provided)"
                rows={2}
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-8 py-5 focus:outline-none focus:border-[#A91D3A] transition resize-none text-lg"
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Image Upload */}
                <div className="space-y-4">
                  <input type="file" accept="image/*" onChange={handleImageChange} ref={imageInputRef} className="hidden" />
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className={`w-full py-4 border rounded-2xl font-bold text-xs transition flex flex-col items-center gap-2 ${newAnswerImage ? 'border-green-500 text-green-500' : 'border-white/10 text-white/60 hover:border-white/30'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    {newAnswerImage ? 'Image Loaded' : 'Upload Image'}
                  </button>
                  {newAnswerImage && (
                    <button onClick={() => setNewAnswerImage(undefined)} className="w-full text-xs text-red-500 hover:underline">Remove Image</button>
                  )}
                </div>

                {/* PDF Upload */}
                <div className="space-y-4">
                  <input type="file" accept="application/pdf" onChange={handlePdfChange} ref={pdfInputRef} className="hidden" />
                  <button 
                    onClick={() => pdfInputRef.current?.click()}
                    className={`w-full py-4 border rounded-2xl font-bold text-xs transition flex flex-col items-center gap-2 ${newAnswerPdf ? 'border-red-500 text-red-500' : 'border-white/10 text-white/60 hover:border-white/30'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    {newAnswerPdf ? 'PDF Loaded' : 'Upload PDF'}
                  </button>
                  {newAnswerPdf && (
                    <button onClick={() => setNewAnswerPdf(undefined)} className="w-full text-xs text-red-500 hover:underline">Remove PDF</button>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => {
                   if (!selectedCategoryId || !newQuestion.trim()) return;
                   const cardData: Flashcard = {
                     id: editingId || Date.now().toString(),
                     categoryId: selectedCategoryId,
                     question: newQuestion,
                     answer: newAnswer,
                     answerImage: newAnswerImage,
                     answerPdf: newAnswerPdf
                   };

                   if (editingId) {
                     setFlashcards(flashcards.map(f => f.id === editingId ? cardData : f));
                     setEditingId(null);
                   } else {
                     setFlashcards([...flashcards, cardData]);
                   }
                   
                   setNewQuestion('');
                   setNewAnswer('');
                   setNewAnswerImage(undefined);
                   setNewAnswerPdf(undefined);
                }}
                className="w-full py-5 bg-[#A91D3A] hover:bg-[#C7253E] rounded-2xl font-black text-xl transition shadow-xl"
              >
                {editingId ? 'Update Card' : 'Add Flashcard'}
              </button>
              
              {editingId && (
                <button 
                  onClick={() => { 
                    setEditingId(null); setNewQuestion(''); setNewAnswer(''); 
                    setNewAnswerImage(undefined); setNewAnswerPdf(undefined);
                  }}
                  className="w-full text-gray-500 font-bold hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 text-center text-gray-700 text-sm font-bold uppercase tracking-widest">
        Inspired by Take U Forward (Striver) &copy; 2026 TUF-Flash
      </footer>
    </div>
  );
};

export default App;
