import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  Badge,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Tabs,
  Tab,
  Popper,
  Grow,
  ClickAwayListener
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import VideocamIcon from '@mui/icons-material/Videocam';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tutorial-tabpanel-${index}`}
      aria-labelledby={`tutorial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface TutorialStep {
  label: string;
  description: string;
  element?: string; // CSS selector for highlighting elements
  image?: string; // Optional image URL for visual aid
  action?: string; // Optional action description
}

interface TutorialData {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g., "2 min"
  steps: TutorialStep[];
  category: 'beginner' | 'intermediate' | 'advanced';
  completed?: boolean;
}

interface InteractiveTutorialsProps {
  tutorialType?: 'platform' | 'trustScore' | 'pricePrediction' | 'riskAssessment' | 'fraudDetection';
  onComplete?: (tutorialId: string) => void;
  initiallyOpen?: boolean;
}

const InteractiveTutorials = React.forwardRef<any, InteractiveTutorialsProps>((
  { tutorialType = 'platform', onComplete, initiallyOpen = false },
  ref
) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [activeStep, setActiveStep] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [activeTutorial, setActiveTutorial] = useState<TutorialData | null>(null);
  const [tutorialListOpen, setTutorialListOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [tourMode, setTourMode] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  // Expose methods to parent components via ref
  React.useImperativeHandle(ref, () => ({
    startTutorial: (tutorialId?: string) => {
      if (tutorialId) {
        const tutorial = allTutorials.find(t => t.id === tutorialId);
        if (tutorial) {
          setActiveTutorial(tutorial);
          setActiveStep(0);
          setTourMode(true);
          return true;
        }
        return false;
      } else if (tutorials.length > 0) {
        setActiveTutorial(tutorials[0]);
        setActiveStep(0);
        setTourMode(true);
        return true;
      }
      return false;
    },
    closeTutorial: () => {
      setTourMode(false);
      setOpen(false);
      setHighlightedElement(null);
    }
  }));

  // Sample tutorial data - in a real app, this would come from an API or config
  const allTutorials: TutorialData[] = [
    {
      id: 'platform-overview',
      title: 'Platform Overview',
      description: 'Learn the basics of navigating the NFT TrustScore platform',
      duration: '3 min',
      category: 'beginner',
      steps: [
        {
          label: 'Welcome to NFT TrustScore',
          description: 'This platform helps you make informed decisions about NFT investments through trust scores, price predictions, risk assessments, and fraud detection.',
          image: '/assets/tutorials/dashboard-overview.png'
        },
        {
          label: 'Dashboard Navigation',
          description: 'Use the tabs at the top to switch between different analysis views: Overview, Trust Score, Price Intelligence, Risk Assessment, and Fraud Detection.',
          element: '#nft-analysis-tab-0'
        },
        {
          label: 'Interactive Elements',
          description: 'Throughout the platform, you\'ll find interactive charts and visualizations. Hover over elements to see tooltips with additional information.',
          element: '.MuiPaper-root'
        },
        {
          label: 'Help Resources',
          description: 'Look for the info icons next to metrics and visualizations for detailed explanations of our methodology.',
          element: '.MuiSpeedDial-root'
        }
      ]
    },
    {
      id: 'trust-score-deep-dive',
      title: 'Trust Score Deep Dive',
      description: 'Understand how to interpret trust scores and factor breakdowns',
      duration: '4 min',
      category: 'intermediate',
      steps: [
        {
          label: 'Trust Score Basics',
          description: 'The trust score represents the overall reliability and quality of an NFT based on multiple factors.'
        },
        {
          label: 'Factor Breakdown',
          description: 'Explore individual factors that contribute to the trust score, including ownership history, creator reputation, and market performance.',
          element: '.MuiPaper-root'
        },
        {
          label: 'Historical Trends',
          description: 'View how the trust score has evolved over time to identify patterns and potential concerns.',
          element: '.MuiPaper-root'
        },
        {
          label: 'Collection Comparison',
          description: 'See how this NFT compares to others in its collection to gauge its relative quality.',
          element: '.MuiPaper-root'
        }
      ]
    },
    {
      id: 'price-prediction-tutorial',
      title: 'Price Prediction Tutorial',
      description: 'Learn how to use price predictions for investment decisions',
      duration: '3 min',
      category: 'intermediate',
      steps: [
        {
          label: 'Price Prediction Overview',
          description: 'Our price predictions show estimated future values based on historical data and market trends.'
        },
        {
          label: 'Confidence Intervals',
          description: 'The shaded area around predictions represents the range of potential outcomes, with wider bands indicating higher uncertainty.',
          element: '.MuiPaper-root'
        },
        {
          label: 'Price Tools',
          description: 'Use the interactive tools to adjust time periods, explore comparable sales, and set price alerts.',
          element: '.MuiPaper-root'
        },
        {
          label: 'Value Indicators',
          description: 'Look for undervalued/overvalued indicators to identify potential investment opportunities.',
          element: '.MuiPaper-root'
        }
      ]
    },
    {
      id: 'risk-assessment-guide',
      title: 'Risk Assessment Guide',
      description: 'Understand how to interpret risk metrics and take action',
      duration: '5 min',
      category: 'advanced',
      steps: [
        {
          label: 'Risk Profile Overview',
          description: 'The risk profile shows potential vulnerabilities across multiple dimensions including liquidity, volatility, and market manipulation.'
        },
        {
          label: 'Risk Radar Chart',
          description: 'The radar chart visualizes different risk factors, with points further from the center indicating higher risk in that dimension.',
          element: '.MuiPaper-root'
        },
        {
          label: 'Mitigation Recommendations',
          description: 'Review suggested actions to mitigate identified risks before making investment decisions.',
          element: '.MuiPaper-root'
        },
        {
          label: 'Risk Alerts',
          description: 'Configure risk alerts to be notified when risk levels change significantly.',
          element: '.MuiButton-root'
        }
      ]
    },
    {
      id: 'fraud-detection-walkthrough',
      title: 'Fraud Detection Walkthrough',
      description: 'Learn how to identify and investigate potential fraud',
      duration: '6 min',
      category: 'advanced',
      steps: [
        {
          label: 'Fraud Indicators',
          description: 'Review highlighted fraud indicators including image similarity, suspicious transactions, and metadata issues.'
        },
        {
          label: 'Evidence Examination',
          description: 'Use the interactive tools to examine evidence supporting fraud findings, such as similar images or suspicious transaction patterns.',
          element: '.MuiPaper-root'
        },
        {
          label: 'Severity Classification',
          description: 'Understand the severity levels assigned to different findings and their implications for investment decisions.',
          element: '.MuiChip-root'
        },
        {
          label: 'Reporting Options',
          description: 'Learn how to report suspicious activities and contribute to the platform\'s fraud detection capabilities.',
          element: '.MuiButton-root'
        }
      ]
    },
    {
      id: 'advanced-analysis-features',
      title: 'Advanced Analysis Features',
      description: 'Master the powerful analysis tools for deeper insights',
      duration: '8 min',
      category: 'advanced',
      steps: [
        {
          label: 'Advanced Analysis Overview',
          description: 'Discover the advanced features that can help you gain deeper insights into NFT investments.'
        },
        {
          label: 'Comparative Analysis',
          description: 'Learn how to compare multiple NFTs side-by-side to identify the best investment opportunities.',
          element: '.MuiGrid-root'
        },
        {
          label: 'Custom Alerts',
          description: 'Set up personalized alerts for price changes, risk level shifts, and potential fraud indicators.',
          element: '.MuiButton-root'
        },
        {
          label: 'Data Export',
          description: 'Export analysis data for further processing or record-keeping in your preferred format.',
          element: '.MuiButton-root'
        },
        {
          label: 'API Integration',
          description: 'For advanced users, learn how to integrate our analysis tools with your own systems and workflows.'
        }
      ]
    }
  ];

  // Filter tutorials based on type
  const tutorials = allTutorials.filter(tutorial => {
    if (tutorialType === 'platform') return tutorial.id === 'platform-overview' || tutorial.id === 'advanced-analysis-features';
    if (tutorialType === 'trustScore') return tutorial.id === 'trust-score-deep-dive';
    if (tutorialType === 'pricePrediction') return tutorial.id === 'price-prediction-tutorial';
    if (tutorialType === 'riskAssessment') return tutorial.id === 'risk-assessment-guide';
    if (tutorialType === 'fraudDetection') return tutorial.id === 'fraud-detection-walkthrough';
    return true;
  });
  
  useEffect(() => {
    if (tutorials.length > 0 && !activeTutorial) {
      setActiveTutorial(tutorials[0]);
    }
    
    // Load completed tutorials from localStorage in a real app
    const savedCompletedTutorials = localStorage.getItem('completedTutorials');
    if (savedCompletedTutorials) {
      try {
        setCompletedTutorials(JSON.parse(savedCompletedTutorials));
      } catch (e) {
        console.error('Error parsing completed tutorials:', e);
      }
    }
  }, [tutorialType]);
  
  // Effect to highlight elements during tour
  useEffect(() => {
    if (tourMode && activeTutorial && activeStep < activeTutorial.steps.length) {
      const currentStep = activeTutorial.steps[activeStep];
      if (currentStep.element) {
        const element = document.querySelector(currentStep.element);
        setHighlightedElement(element);

        // Scroll element into view if needed
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }

    return () => {
      setHighlightedElement(null);
    };
  }, [tourMode, activeTutorial, activeStep]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const startTutorial = (tutorial: TutorialData) => {
    setActiveTutorial(tutorial);
    setActiveStep(0);
    setTourMode(true);
    setTutorialListOpen(false);
    setOpen(false);
  };

  const handleNext = () => {
    if (activeTutorial) {
      if (activeStep === activeTutorial.steps.length - 1) {
        // Mark tutorial as completed
        if (!completedTutorials.includes(activeTutorial.id)) {
          const newCompletedTutorials = [...completedTutorials, activeTutorial.id];
          setCompletedTutorials(newCompletedTutorials);
          if (onComplete) {
            onComplete(activeTutorial.id);
          }
          // In a real app, save to localStorage
          localStorage.setItem('completedTutorials', JSON.stringify(newCompletedTutorials));
        }
        // End tutorial
        setTourMode(false);
        setHighlightedElement(null);
      } else {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleClose = () => {
    setOpen(false);
    setTourMode(false);
    setHighlightedElement(null);
    setTutorialListOpen(false);
  };
  
  const handleOpen = () => {
    setOpen(true);
  };

  const handleTutorialListOpen = () => {
    setTutorialListOpen(true);
  };

  const handleTutorialListClose = () => {
    setTutorialListOpen(false);
  };

  const handleTutorialComplete = () => {
    if (activeTutorial) {
      // Mark tutorial as completed
      if (!completedTutorials.includes(activeTutorial.id)) {
        const newCompletedTutorials = [...completedTutorials, activeTutorial.id];
        setCompletedTutorials(newCompletedTutorials);
        if (onComplete) {
          onComplete(activeTutorial.id);
        }
        localStorage.setItem('completedTutorials', JSON.stringify(newCompletedTutorials));
      }
      setTourMode(false);
      setHighlightedElement(null);
    }
  };
  
  // Render tutorial card
  const renderTutorialCard = (tutorial: TutorialData) => {
    const isCompleted = completedTutorials.includes(tutorial.id);
    
    return (
      <Card 
        sx={{ 
          mb: 2, 
          border: isCompleted ? '1px solid #4caf50' : 'none',
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {isCompleted && (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Completed" 
            color="success" 
            size="small"
            sx={{ position: 'absolute', top: 10, right: 10 }}
          />
        )}
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {tutorial.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {tutorial.description}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
            <Chip 
              label={tutorial.category} 
              size="small" 
              color={
                tutorial.category === 'beginner' ? 'success' :
                tutorial.category === 'intermediate' ? 'primary' : 'secondary'
              }
            />
            <Typography variant="caption" color="text.secondary">
              {tutorial.duration}
            </Typography>
          </Box>
        </CardContent>
        <CardActions>
          <Button 
            startIcon={<PlayArrowIcon />} 
            variant="contained" 
            size="small" 
            onClick={() => startTutorial(tutorial)}
            fullWidth
          >
            {isCompleted ? 'Review Tutorial' : 'Start Tutorial'}
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  // Element highlight overlay
  const renderHighlight = () => {
    if (!highlightedElement || !tourMode) return null;

    const rect = highlightedElement.getBoundingClientRect();

    return (
      <Box
        ref={highlightRef}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1200,
          pointerEvents: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            zIndex: 1201,
            border: '2px solid #2196f3',
            borderRadius: 1,
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(33, 150, 243, 0.7)'
              },
              '70%': {
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 10px rgba(33, 150, 243, 0)'
              },
              '100%': {
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(33, 150, 243, 0)'
              }
            }
          }}
        />
      </Box>
    );
  };
  
  // Render tutorial tour dialog
  const renderTutorialTour = () => {
    if (!activeTutorial || !tourMode) return null;

    const currentStep = activeTutorial.steps[activeStep];

    return (
      <Dialog
        open={tourMode}
        onClose={handleClose}
        maxWidth="sm"
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            m: 0,
            width: '90%',
            maxWidth: 500,
            borderRadius: 2,
            boxShadow: 3
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{currentStep.label}</Typography>
            <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {currentStep.image && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <img 
                src={currentStep.image} 
                alt={currentStep.label} 
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
              />
            </Box>
          )}
          <Typography variant="body1">{currentStep.description}</Typography>
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 1, pb: 1 }}>
            <Button 
              onClick={handleBack} 
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              {activeStep + 1} / {activeTutorial.steps.length}
            </Typography>
            <Button 
              onClick={handleNext} 
              variant="contained"
              endIcon={activeStep === activeTutorial.steps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
            >
              {activeStep === activeTutorial.steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <>
      <Tooltip title="Interactive Tutorials">
        <Badge badgeContent={tutorials.filter(t => !completedTutorials.includes(t.id)).length} color="primary">
          <IconButton onClick={handleOpen} color="primary">
            <SchoolIcon />
          </IconButton>
        </Badge>
      </Tooltip>

      <Dialog
        open={open && !tourMode}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Interactive Tutorials</Typography>
            <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="tutorial categories">
              <Tab label="All Tutorials" />
              <Tab label="Beginner" />
              <Tab label="Intermediate" />
              <Tab label="Advanced" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              {tutorials.map((tutorial) => (
                <Grid item xs={12} sm={6} md={4} key={tutorial.id}>
                  {renderTutorialCard(tutorial)}
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              {tutorials
                .filter(tutorial => tutorial.category === 'beginner')
                .map((tutorial) => (
                  <Grid item xs={12} sm={6} md={4} key={tutorial.id}>
                    {renderTutorialCard(tutorial)}
                  </Grid>
                ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2}>
              {tutorials
                .filter(tutorial => tutorial.category === 'intermediate')
                .map((tutorial) => (
                  <Grid item xs={12} sm={6} md={4} key={tutorial.id}>
                    {renderTutorialCard(tutorial)}
                  </Grid>
                ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={2}>
              {tutorials
                .filter(tutorial => tutorial.category === 'advanced')
                .map((tutorial) => (
                  <Grid item xs={12} sm={6} md={4} key={tutorial.id}>
                    {renderTutorialCard(tutorial)}
                  </Grid>
                ))}
            </Grid>
          </TabPanel>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px dashed rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TipsAndUpdatesIcon sx={{ mr: 1 }} color="primary" />
              Quick Tips
            </Typography>
            <Typography variant="body2" paragraph>
              • Click on any tutorial card to start a guided tour
            </Typography>
            <Typography variant="body2" paragraph>
              • Tutorials are categorized by difficulty level
            </Typography>
            <Typography variant="body2" paragraph>
              • Completed tutorials are marked with a green checkmark
            </Typography>
            <Typography variant="body2">
              • During tutorials, important UI elements will be highlighted
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {renderTutorialTour()}
      {renderHighlight()}
    </>
  );
});

export default InteractiveTutorials;