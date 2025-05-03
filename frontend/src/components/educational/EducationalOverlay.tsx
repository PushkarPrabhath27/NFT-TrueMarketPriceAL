import React, { useState, useRef } from 'react';
import { Box, Fab, Tooltip, SpeedDial, SpeedDialAction, SpeedDialIcon, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, IconButton } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import InfoIcon from '@mui/icons-material/Info';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import { MethodologyExplanation, InteractiveTutorials, DecisionSupportTools } from './index';

interface EducationalOverlayProps {
  currentTab: number; // The currently active dashboard tab
  onTutorialStart?: () => void;
  onTutorialComplete?: (tutorialId: string) => void;
}

const EducationalOverlay: React.FC<EducationalOverlayProps> = ({ currentTab, onTutorialStart, onTutorialComplete }) => {
  const [open, setOpen] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showTutorialSelector, setShowTutorialSelector] = useState(false);
  const tutorialRef = useRef<any>(null);
  
  // Determine which methodology explanation to show based on the current tab
  const getMethodologyType = () => {
    switch (currentTab) {
      case 0: // Overview tab
      case 1: // Trust Score tab
        return 'trustScore';
      case 2: // Price Intelligence tab
        return 'pricePrediction';
      case 3: // Risk Assessment tab
        return 'riskAssessment';
      case 4: // Fraud Detection tab
        return 'fraudDetection';
      default:
        return 'trustScore';
    }
  };
  
  // Determine which tutorial type to show based on the current tab
  const getTutorialType = () => {
    switch (currentTab) {
      case 0: // Overview tab
        return 'platform';
      case 1: // Trust Score tab
        return 'trustScore';
      case 2: // Price Intelligence tab
        return 'pricePrediction';
      case 3: // Risk Assessment tab
        return 'riskAssessment';
      case 4: // Fraud Detection tab
        return 'fraudDetection';
      default:
        return 'platform';
    }
  };

  const actions = [
    { icon: <InfoIcon />, name: 'Methodology', component: <MethodologyExplanation type={getMethodologyType() as any} showIcon={false} /> },
    { icon: <SchoolIcon />, name: 'Tutorials', component: <InteractiveTutorials tutorialType={getTutorialType() as any} /> },
    { icon: <AssessmentIcon />, name: 'Decision Tools', component: <DecisionSupportTools /> },
  ];

  // Function to handle tutorial completion
  const handleTutorialComplete = (tutorialId: string) => {
    if (onTutorialComplete) {
      onTutorialComplete(tutorialId);
    }
    
    // Store completion in localStorage
    const completedTutorials = JSON.parse(localStorage.getItem('completedTutorials') || '[]');
    if (!completedTutorials.includes(tutorialId)) {
      completedTutorials.push(tutorialId);
      localStorage.setItem('completedTutorials', JSON.stringify(completedTutorials));
    }
  };

  // Function to start a specific tutorial
  const startTutorial = (tutorialId?: string) => {
    setShowWelcomeDialog(false);
    setShowTutorialSelector(true);
    
    // Use the ref to start the tutorial programmatically
    if (tutorialRef.current) {
      setTimeout(() => {
        tutorialRef.current.startTutorial(tutorialId);
      }, 300); // Small delay to ensure component is mounted
    }
    
    if (onTutorialStart) {
      onTutorialStart();
    }
  };

  // Check if user is new (no completed tutorials)
  React.useEffect(() => {
    const completedTutorials = JSON.parse(localStorage.getItem('completedTutorials') || '[]');
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome') === 'true';
    
    if (completedTutorials.length === 0 && !hasSeenWelcome) {
      setShowWelcomeDialog(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1050 }}>
        <SpeedDial
          ariaLabel="Educational Tools"
          icon={<SpeedDialIcon icon={<HelpOutlineIcon />} />}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          open={open}
          direction="up"
          FabProps={{
            sx: {
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }
          }}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              tooltipOpen
              onClick={() => {
                setOpen(false);
                if (action.name === 'Tutorials') {
                  setShowTutorialSelector(true);
                }
              }}
              FabProps={{
                sx: { '& .MuiSvgIcon-root': { pointerEvents: 'none' } }
              }}
            >
              {action.name === 'Tutorials' ? null : action.component}
            </SpeedDialAction>
          ))}
        </SpeedDial>
      </Box>

      {/* Welcome Dialog for New Users */}
      <Dialog
        open={showWelcomeDialog}
        onClose={() => setShowWelcomeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Welcome to NFT TrustScore!</Typography>
            <IconButton edge="end" color="inherit" onClick={() => setShowWelcomeDialog(false)} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Thank you for using our NFT Analysis Dashboard. We've designed this platform to help you make informed decisions about NFT investments.
          </Typography>
          <Typography variant="body1" paragraph>
            Would you like to take a quick tour to learn how to use the platform effectively?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWelcomeDialog(false)}>Skip for now</Button>
          <Button 
            variant="contained" 
            startIcon={<PlayArrowIcon />}
            onClick={startTutorial}
          >
            Start Tutorial
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tutorial Selector */}
      {showTutorialSelector && (
        <InteractiveTutorials 
          tutorialType={getTutorialType() as any} 
          initiallyOpen={true} 
          onComplete={handleTutorialComplete}
          ref={tutorialRef}
        />
      )}
    </>
  );
};

export default EducationalOverlay;