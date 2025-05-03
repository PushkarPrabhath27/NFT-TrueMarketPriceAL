import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { InteractiveTutorials } from './index';

type TutorialType = 'platform' | 'trustScore' | 'pricePrediction' | 'riskAssessment' | 'fraudDetection';

interface TutorialContextType {
  startTutorial: (tutorialId?: string, tabIndex?: number) => void;
  completeTutorial: (tutorialId: string) => void;
  isActiveTutorial: boolean;
  activeTutorialId: string | null;
  completedTutorials: string[];
  currentTutorialType: TutorialType;
  resetTutorial: () => void;
  skipTutorial: (tutorialId: string) => void;
}

const TutorialContext = createContext<TutorialContextType>({
  startTutorial: () => {},
  completeTutorial: () => {},
  isActiveTutorial: false,
  activeTutorialId: null,
  completedTutorials: [],
  currentTutorialType: 'platform',
  resetTutorial: () => {},
  skipTutorial: () => {},
});

export const useTutorials = () => useContext(TutorialContext);

interface TutorialManagerProps {
  children: React.ReactNode;
  currentTab: number;
}

export const TutorialManager: React.FC<TutorialManagerProps> = ({ children, currentTab }) => {
  const [isActiveTutorial, setIsActiveTutorial] = useState(false);
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTutorialType, setCurrentTutorialType] = useState<TutorialType>('platform');
  const tutorialRef = useRef<{ startTutorial: (id?: string) => void } | null>(null);
  
  // Load completed tutorials from localStorage
  useEffect(() => {
    const savedCompletedTutorials = localStorage.getItem('completedTutorials');
    if (savedCompletedTutorials) {
      try {
        setCompletedTutorials(JSON.parse(savedCompletedTutorials));
      } catch (e) {
        console.error('Error parsing completed tutorials:', e);
      }
    }
  }, []);
  
  // Determine which tutorial type to show based on the current tab
  const getTutorialType = (tabIndex: number): TutorialType => {
    switch (tabIndex) {
      case 0: return 'platform';
      case 1: return 'trustScore';
      case 2: return 'pricePrediction';
      case 3: return 'riskAssessment';
      case 4: return 'fraudDetection';
      default: return 'platform';
    }
  };

  useEffect(() => {
    setCurrentTutorialType(getTutorialType(currentTab));
  }, [currentTab]);

  const startTutorial = (tutorialId?: string, tabIndex?: number) => {
    const targetTab = tabIndex !== undefined ? tabIndex : currentTab;
    const tutorialType = getTutorialType(targetTab);
    
    setShowTutorial(true);
    setIsActiveTutorial(true);
    setCurrentTutorialType(tutorialType);
    
    if (tutorialId) {
      setActiveTutorialId(tutorialId);
    }
    
    // Use setTimeout to ensure the tutorial component is mounted
    const timeoutId = setTimeout(() => {
      if (tutorialRef.current) {
        tutorialRef.current.startTutorial(tutorialId);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const completeTutorial = (tutorialId: string) => {
    if (!completedTutorials.includes(tutorialId)) {
      const newCompletedTutorials = [...completedTutorials, tutorialId];
      setCompletedTutorials(newCompletedTutorials);
      localStorage.setItem('completedTutorials', JSON.stringify(newCompletedTutorials));
    }
    
    setIsActiveTutorial(false);
    setActiveTutorialId(null);
  };

  const resetTutorial = () => {
    setIsActiveTutorial(false);
    setActiveTutorialId(null);
    setShowTutorial(false);
  };

  const skipTutorial = (tutorialId: string) => {
    const newCompletedTutorials = [...completedTutorials, tutorialId];
    setCompletedTutorials(newCompletedTutorials);
    localStorage.setItem('completedTutorials', JSON.stringify(newCompletedTutorials));
    resetTutorial();
  };

  const handleTutorialComplete = (tutorialId: string) => {
    completeTutorial(tutorialId);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      resetTutorial();
    };
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        startTutorial,
        completeTutorial,
        isActiveTutorial,
        activeTutorialId,
        completedTutorials,
        currentTutorialType,
        resetTutorial,
        skipTutorial,
      }}
    >
      {children}
      
      {showTutorial && (
        <InteractiveTutorials
          ref={tutorialRef}
          tutorialType={currentTutorialType}
          initiallyOpen={true}
          onComplete={handleTutorialComplete}
        />
      )}
    </TutorialContext.Provider>
  );
};

export default TutorialManager;