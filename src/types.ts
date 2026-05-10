export type Mood = 'tired' | 'normal' | 'stressed' | 'motivated';

export type StudentType = 'Engineering' | 'Medical' | 'Business' | 'Arts' | 'Other';

export interface Task {
  id: string;
  text: string;
  deadline?: string;
  notes?: string;
}

export interface AiRecommendation {
  priorityTask: string;
  nextAction: string;
  backupTask: string;
  reason: string;
  confidence: {
    score: number;
    urgency: 'high' | 'medium' | 'low';
    energyMatch: 'good' | 'average' | 'poor';
    impact: 'high' | 'medium' | 'low';
  };
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  taskName: string;
  completed: boolean;
  mood: Mood;
  studentType: StudentType;
  timeOfDay: string;
}

export interface WhatIfResponse {
  shortTerm: string;
  longTerm: string;
}

export interface BehavioralInsight {
  pattern: string;
  consistencyScore: number;
}
