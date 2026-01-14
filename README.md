📝Problem Statement

While revising Data Structures & Algorithms, students often face these challenges:

Scattered Notes: Problem solutions are written across notebooks, Google Docs, PDFs, or screenshots. Searching for a specific solution is time-consuming.

Lack of Organization: Difficult to track which topics or problems have been completed and which need revision.

No Personal Repository: Students cannot easily maintain a personal collection of their solved problems with explanations, images, or PDFs.

Inefficient Revision: Revisiting old solutions often requires scrolling through multiple platforms or documents, which slows down learning.

Goal: Create a simple, organized, personalized digital notebook where students can store, view, and track all the DSA problems they’ve studied.

💡 Solution

TUF Flash addresses these challenges by providing:

Personalized Flashcards: Students can create topics (categories) like Arrays, Graphs, Strings, etc., and add problems they’ve solved.

Track Progress: Each problem can have a question, solution, and notes. Quickly see which problems have been studied.

Attach Supporting Materials: Add images or PDF files for explanations, diagrams, or detailed solutions.

Easy Retrieval: Instantly search and revisit any problem in a clean, organized UI.

Offline & Persistent: All flashcards are saved locally in the browser, so students don’t lose their progress.

## Database Setup

This project uses Supabase for user authentication and data persistence. To set up the database:

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Go to Settings > API and copy your Project URL and anon public key

3. Update the `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. In your Supabase dashboard, go to the SQL Editor and run the following to create the tables:

   ```sql
   -- Create categories table
   CREATE TABLE categories (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create flashcards table
   CREATE TABLE flashcards (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
     question TEXT NOT NULL,
     answer TEXT,
     answer_image TEXT,
     answer_pdf TEXT,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
   ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

   -- Create policies for categories
   CREATE POLICY "Users can view their own categories" ON categories
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own categories" ON categories
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own categories" ON categories
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own categories" ON categories
     FOR DELETE USING (auth.uid() = user_id);

   -- Create policies for flashcards
   CREATE POLICY "Users can view their own flashcards" ON flashcards
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own flashcards" ON flashcards
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own flashcards" ON flashcards
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own flashcards" ON flashcards
     FOR DELETE USING (auth.uid() = user_id);
   ```

5. In Supabase Auth settings, enable email authentication.

Now your app is connected to Supabase! Users can sign up, log in, and their data will be stored in the database.

Check out the demo of **TUF Flash**:

[![Watch the Demo](https://img.youtube.com/vi/cOVIomnrkn6/maxresdefault.jpg)](https://go.screenpal.com/watch/cOVIomnrkn6)



