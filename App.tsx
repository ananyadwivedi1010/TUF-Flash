
import React, { useState, useEffect, useMemo } from 'react';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Handlers ---
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const id = Date.now().toString();
    setCategories([...categories, { id, name: newCategoryName }]);
    setNewCategoryName('');
    setActiveCategory(id);
  };

  const handleAddFlashcard = () => {
    if (!selectedCategoryId || !newQuestion.trim() || !newAnswer.trim()) return;
    
    if (editingId) {
      setFlashcards(flashcards.map(f => f.id === editingId ? { ...f, categoryId: selectedCategoryId, question: newQuestion, answer: newAnswer } : f));
      setEditingId(null);
    } else {
      const newCard = {
        id: Date.now().toString(),
        categoryId: selectedCategoryId,
        question: newQuestion,
        answer: newAnswer,
      };
      setFlashcards([...flashcards, newCard]);
    }
    setNewQuestion('');
    setNewAnswer('');
  };

  const handleEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setNewQuestion(card.question);
    setNewAnswer(card.answer);
    setSelectedCategoryId(card.categoryId);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDeleteFlashcard = (id: string) => {
    setFlashcards(flashcards.filter(f => f.id !== id));
  };

  const toggleFlip = (id: string) => {
    const next = new Set(flippedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFlippedIds(next);
  };

  // LIVE FETCHING via Gemini API
  const syncWithTUF = async () => {
    setIsSyncing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate a new batch of 6 high-quality DSA flashcards based specifically on the content of Striver's A2Z DSA Sheet (https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z).",
        config: {
          systemInstruction: `You are the TUF AI Assistant. Your goal is to help students learn the A2Z roadmap. 
          Identify key problems and concepts from the Striver's A2Z sheet. 
          Provide a JSON array where each object has:
          - 'category': The module name (e.g., 'Basics', 'Arrays', 'Binary Search', 'Linked List').
          - 'question': A concept-based question or 'How do you solve [Problem Name] optimally?'.
          - 'short_answer': A concise explanation of the logic or time complexity.
          Avoid duplicates and focus on high-yield interview concepts.`,
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
        
        // Prevent exact question duplicates
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
      
      // Auto-switch to a new category if one was added
      if (data.length > 0) {
        const firstNewCat = updatedCategories.find(c => c.name.toLowerCase() === data[0].category.toLowerCase());
        if (firstNewCat) setActiveCategory(firstNewCat.id);
      }

    } catch (error) {
      console.error("Sync Error:", error);
      alert("Live sync failed. Ensure your Gemini API Key is active.");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredFlashcards = useMemo(() => {
    return flashcards.filter(f => f.categoryId === activeCategory);
  }, [flashcards, activeCategory]);

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] selection:bg-red-500/30">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-12 py-6 border-b border-white/5">
        <div className="flex items-center gap-12">
          <div className="flex items-center">
            <span className="text-red-700 font-black italic text-2xl tracking-tighter">⚡FLASHLEARNER</span>
          </div>
          <span className="font-bold text-lg text-white/90">Dashboard</span>
        </div>
        <div className="flex gap-4">
          <button className="px-5 py-2 text-sm font-bold border border-white/20 rounded-lg hover:bg-white/5 transition">Sign Up</button>
          <button className="px-6 py-2 text-sm font-bold bg-[#A91D3A] hover:bg-[#C7253E] rounded-lg transition shadow-lg shadow-red-900/20">Log In</button>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-24 pb-32 text-center max-w-5xl mx-auto px-6">
        <h1 className="text-6xl md:text-8xl font-black mb-10 leading-[1.1] tracking-tight">
          The ultimate <span className="text-[#A91D3A]">learning</span>
          <br />platform
        </h1>
        <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
          Meet FlashLearner, the new standard for learning DSA. Sync with Striver's A2Z Sheet to get live problem flashcards.
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
              <span>Fetching Live Data...</span>
            </div>
          )}
        </button>
      </header>

      {/* Tabs & Content */}
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
                  className="bg-[#121212] border border-white/5 rounded-3xl p-10 min-h-[300px] flex flex-col justify-between group transition-all hover:border-white/20 hover:bg-[#161616] relative"
                >
                  <div className="text-center cursor-pointer flex-1 flex flex-col justify-center" onClick={() => toggleFlip(card.id)}>
                    <h3 className="text-2xl font-black mb-4">
                      {flippedIds.has(card.id) ? 'The Logic' : card.question}
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed font-medium">
                      {flippedIds.has(card.id) ? card.answer : 'Click card to flip and reveal answer...'}
                    </p>
                  </div>
                  <div className="mt-10 flex justify-center gap-4">
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
                No flashcards in this category yet. Click sync or add one manually!
              </div>
            )}
          </div>
        </section>

        {/* Dashboard Tools */}
        <section className="bg-[#080808] border border-white/5 rounded-[3.5rem] p-16 shadow-2xl">
          <h2 className="text-4xl font-black text-center mb-16">Manage Content</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            
            {/* Category Admin */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-center">New Category</h3>
              <input 
                type="text"
                placeholder="Category name (e.g. Graphs)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-8 py-5 focus:outline-none focus:border-[#A91D3A] transition text-lg"
              />
              <button 
                onClick={handleAddCategory}
                className="w-full py-5 bg-[#A91D3A] hover:bg-[#C7253E] rounded-2xl font-black text-xl transition shadow-xl"
              >
                Create Category
              </button>
            </div>

            {/* Flashcard Admin */}
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
                placeholder="Question / Problem Name"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-8 py-5 focus:outline-none focus:border-[#A91D3A] transition text-lg"
              />
              
              <textarea 
                placeholder="Optimal Answer / Logic Explanation"
                rows={4}
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-8 py-5 focus:outline-none focus:border-[#A91D3A] transition resize-none text-lg"
              />
              
              <button 
                onClick={handleAddFlashcard}
                className="w-full py-5 bg-[#A91D3A] hover:bg-[#C7253E] rounded-2xl font-black text-xl transition shadow-xl"
              >
                {editingId ? 'Update Card' : 'Add Flashcard'}
              </button>
              {editingId && (
                <button 
                  onClick={() => { setEditingId(null); setNewQuestion(''); setNewAnswer(''); }}
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
        Inspired by Take U Forward (Striver) &copy; 2024 FlashLearner AI
      </footer>
    </div>
  );
};

export default App;
