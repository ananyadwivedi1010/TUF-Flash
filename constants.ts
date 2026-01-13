
import { Category } from './types';

// Fixed missing 'id' in Category objects and provided explicit initializers for problem properties
export const INITIAL_DSA_SHEET: Category[] = [
  {
    id: "cat-arrays",
    name: "Arrays",
    problems: [
      { 
        id: "a1", 
        title: "Largest Element in Array", 
        difficulty: "Easy", 
        category: "Arrays", 
        link: "https://leetcode.com/problems/largest-element-in-an-array/", 
        isCompleted: false 
      },
      { 
        id: "a2", 
        title: "Second Largest Element", 
        difficulty: "Easy", 
        category: "Arrays", 
        link: "https://leetcode.com/problems/second-largest-element-in-an-array/", 
        isCompleted: false 
      }
    ]
  }
];
