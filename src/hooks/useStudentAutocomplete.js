// src/hooks/useStudentAutocomplete.js
import { useState } from 'react';

const useStudentAutocomplete = () => {
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStudentSuggestions = async (query) => {
    if (query.length < 3) {
      setStudentSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://ccmr-final-node-production.up.railway.app/api/students/search?id=${query}`);
      const data = await response.json();
      
      if (data.success) {
        // Get the latest school year semester for each student
        const latestStudents = getLatestSemesterStudents(data.students);
        setStudentSuggestions(latestStudents);
        setShowSuggestions(latestStudents.length > 0);
      } else {
        setStudentSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching student suggestions:", error);
      setStudentSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get the latest semester record for each student
  const getLatestSemesterStudents = (students) => {
    const studentMap = new Map();
    
    students.forEach(student => {
      const studentId = student.sd_id_number;
      const existingStudent = studentMap.get(studentId);
      
      if (!existingStudent) {
        studentMap.set(studentId, student);
      } else {
        // Compare school year semesters to keep the latest one
        const existingSem = existingStudent.sd_school_year_semesterr || '';
        const newSem = student.sd_school_year_semesterr || '';
        
        // Parse the semester string to determine which is latest
        if (isNewerSemester(newSem, existingSem)) {
          studentMap.set(studentId, student);
        }
      }
    });
    
    return Array.from(studentMap.values());
  };

  // Helper function to compare semester strings
  // Format: "YYYY-YYYY-SEM" where SEM is 1 or 2
  const isNewerSemester = (newSem, oldSem) => {
    if (!newSem && !oldSem) return false;
    if (!newSem) return false;
    if (!oldSem) return true;
    
    // Extract year and semester
    const newParts = newSem.split('-');
    const oldParts = oldSem.split('-');
    
    if (newParts.length !== 3 || oldParts.length !== 3) {
      // Fallback to string comparison
      return newSem > oldSem;
    }
    
    // Compare end year first
    const newEndYear = parseInt(newParts[1]);
    const oldEndYear = parseInt(oldParts[1]);
    
    if (newEndYear > oldEndYear) return true;
    if (newEndYear < oldEndYear) return false;
    
    // Same end year, compare semester
    const newSemester = parseInt(newParts[2]);
    const oldSemester = parseInt(oldParts[2]);
    
    return newSemester > oldSemester;
  };

  const clearSuggestions = () => {
    setStudentSuggestions([]);
    setShowSuggestions(false);
  };

  return {
    studentSuggestions,
    showSuggestions,
    isLoading,
    fetchStudentSuggestions,
    clearSuggestions
  };
};

export default useStudentAutocomplete;