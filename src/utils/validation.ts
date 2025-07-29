export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== '';
};

export const validateQuestionForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!validateRequired(data.title)) {
    errors.title = 'Title is required';
  }

  if (!validateRequired(data.content)) {
    errors.content = 'Content is required';
  }

  if (!validateRequired(data.type)) {
    errors.type = 'Question type is required';
  }

  if (!validateRequired(data.subject)) {
    errors.subject = 'Subject is required';
  }

  if (!validateRequired(data.topic)) {
    errors.topic = 'Topic is required';
  }

  if (!validateRequired(data.difficulty)) {
    errors.difficulty = 'Difficulty is required';
  }

  if (!validateRequired(data.grade)) {
    errors.grade = 'Grade is required';
  }

  if (data.type === 'multiple-choice') {
    if (!data.options || data.options.length < 2) {
      errors.options = 'Multiple choice questions must have at least 2 options';
    } else {
      const hasCorrectOption = data.options.some((opt: any) => opt.isCorrect);
      if (!hasCorrectOption) {
        errors.options = 'At least one option must be marked as correct';
      }
    }
  }

  return errors;
};

export const validateTestForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!validateRequired(data.title)) {
    errors.title = 'Title is required';
  }

  if (!validateRequired(data.subject)) {
    errors.subject = 'Subject is required';
  }

  if (!validateRequired(data.grade)) {
    errors.grade = 'Grade is required';
  }

  if (!data.questions || data.questions.length === 0) {
    errors.questions = 'At least one question is required';
  }

  if (!data.timeLimit || data.timeLimit < 1) {
    errors.timeLimit = 'Time limit must be at least 1 minute';
  }

  if (!data.startDate) {
    errors.startDate = 'Start date is required';
  }

  if (!data.endDate) {
    errors.endDate = 'End date is required';
  }

  if (new Date(data.endDate) <= new Date(data.startDate)) {
    errors.endDate = 'End date must be after start date';
  }

  return errors;
};