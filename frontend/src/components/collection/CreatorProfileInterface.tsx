import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CompareIcon from '@mui/icons-material/Compare';

// Mock data for demonstration
const mockCreatorData = {
  name: 'CryptoArtist',
  avatar: 'https://via.placeholder.com/150',
  verified: true,
  joinedDate: 'January 2021',
  reputationScore: 87,
  reputationHistory: [
    { month: 'Jan', score: 65 },
    { month: 'Feb', score: 68 },
    { month: 'Mar', score: 72 },
    { month: 'Apr', score: 75 },
    { month: 'May', score: 80 },
    { month: 'Jun', score: 83 },
    { month: 'Jul', score: 87 },
  ],
  portfolioPerformance: [
    { collection: 'Digital Dreams', avgTrustScore: 82, salesVolume: 45.2, floorPrice: 0.8 },
    { collection: 'Neon Futures', avgTrustScore: 76, salesVolume: 32.7, floorPrice: 0.5 },
    { collection: 'Abstract Realms', avgTrustScore: 91, salesVolume: 67.3, floorPrice: 1.2 },
  ],
  projectDelivery: [
    { project: 'Digital Dreams', promised: '2022-03-15', delivered: '2022-03-20', status: 'Completed', satisfaction: 85 },
    { project: 'Neon Futures', promised: '2022-06-01', delivered: '2022-06-05', status: 'Completed', satisfaction: 90 },
    { project: 'Abstract Realms', promised: '2022-09-10', delivered: '2022-09-08', status: 'Completed', satisfaction: 95 },
    { project: 'Quantum Artifacts', promised: '2023-01-15', delivered: null, status: 'In Progress', satisfaction: null },
  ],
  communityEngagement: {
    discordActivity: 85,
    twitterActivity: 92,
    responseRate: 78,
    communityEvents: 12,
    feedbackImplementation: 80
  },
  strengths: ['Consistent delivery', 'High-quality artwork', 'Active community engagement', 'Transparent roadmap'],
  redFlags: ['Occasional delays in responses', 'Limited edition sizes']
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CreatorProfileInterface: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderReputationScore = (score: number) => {
    let color = 'error.main';
    if (score >= 70) color = 'success.main';
    else if (score >= 50) color = 'warning.main';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ color, mr: 2 }}>{score}</Typography>
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={score} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
                borderRadius: 5,
              }
            }} 
          />
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Reputation Score
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Creator Profile</Typography>
      
      <Grid container spacing={3}>
        {/* Creator Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  src={mockCreatorData.avatar} 
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5">{mockCreatorData.name}</Typography>
                    {mockCreatorData.verified && (
                      <Tooltip title="Verified Creator">
                        <VerifiedIcon color="primary" sx={{ ml: 1 }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Joined {mockCreatorData.joinedDate}
                  </Typography>
                </Box>
              </Box>
              
              {renderReputationScore(mockCreatorData.reputationScore)}
              
              <Typography variant="subtitle1" gutterBottom>Strengths</Typography>
              <Box sx={{ mb: 2 }}>
                {mockCreatorData.strengths.map((strength, index) => (
                  <Chip 
                    key={index}
                    label={strength}
                    color="success"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>Potential Concerns</Typography>
              <Box>
                {mockCreatorData.redFlags.map((flag, index) => (
                  <Chip 
                    key={index}
                    label={flag}
                    color="warning"
                    size="small"
                    icon={<WarningIcon />}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reputation History */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Reputation History</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockCreatorData.reputationHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8884d8" 
                    name="Reputation Score" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Tabs for different sections */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<AssessmentIcon />} label="Portfolio Performance" />
              <Tab icon={<TimelineIcon />} label="Project Delivery" />
              <Tab icon={<CompareIcon />} label="Community Engagement" />
            </Tabs>
            
            {/* Portfolio Performance Tab */}
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Portfolio Performance</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={mockCreatorData.portfolioPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="collection" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="avgTrustScore" name="Avg Trust Score" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="salesVolume" name="Sales Volume (ETH)" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>Collections</Typography>
                    <List>
                      {mockCreatorData.portfolioPerformance.map((collection, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText 
                              primary={collection.collection}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2">
                                    Avg Trust Score: {collection.avgTrustScore} | 
                                    Sales Volume: {collection.salesVolume} ETH | 
                                    Floor Price: {collection.floorPrice} ETH
                                  </Typography>
                                </>
                              }
                            />
                            <Button size="small" variant="outlined">View Details</Button>
                          </ListItem>
                          {index < mockCreatorData.portfolioPerformance.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Project Delivery Tab */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Project Delivery History</Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Timeline of project commitments and deliveries
                  </Typography>
                  
                  {mockCreatorData.projectDelivery.map((project, index) => {
                    const isCompleted = project.status === 'Completed';
                    const isOnTime = isCompleted && new Date(project.promised) >= new Date(project.delivered);
                    
                    return (
                      <Paper key={index} sx={{ p: 2, mb: 2, borderLeft: 6, borderColor: isCompleted ? (isOnTime ? 'success.main' : 'warning.main') : 'info.main' }}>
                        <Typography variant="subtitle1">{project.project}</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>Promised:</strong> {project.promised}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>Delivered:</strong> {project.delivered || 'In Progress'}
                            </Typography>
                          </Grid>
                        </Grid>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Chip 
                            label={project.status} 
                            color={isCompleted ? 'success' : 'info'} 
                            size="small" 
                            sx={{ mr: 2 }}
                          />
                          {isCompleted && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ mr: 1 }}>User Satisfaction:</Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={project.satisfaction} 
                                sx={{ 
                                  width: 100,
                                  height: 8, 
                                  borderRadius: 5,
                                  backgroundColor: 'grey.300',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: project.satisfaction > 80 ? 'success.main' : 'warning.main',
                                    borderRadius: 5,
                                  }
                                }} 
                              />
                              <Typography variant="body2" sx={{ ml: 1 }}>{project.satisfaction}%</Typography>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            )}
            
            {/* Community Engagement Tab */}
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Community Engagement</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart outerRadius={90} data={[
                        {
                          subject: 'Discord',
                          A: mockCreatorData.communityEngagement.discordActivity,
                          fullMark: 100,
                        },
                        {
                          subject: 'Twitter',
                          A: mockCreatorData.communityEngagement.twitterActivity,
                          fullMark: 100,
                        },
                        {
                          subject: 'Response Rate',
                          A: mockCreatorData.communityEngagement.responseRate,
                          fullMark: 100,
                        },
                        {
                          subject: 'Events',
                          A: mockCreatorData.communityEngagement.communityEvents * 8, // Scaled for visualization
                          fullMark: 100,
                        },
                        {
                          subject: 'Feedback',
                          A: mockCreatorData.communityEngagement.feedbackImplementation,
                          fullMark: 100,
                        },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar name="Engagement" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Engagement Metrics</Typography>
                        <List>
                          <ListItem>
                            <ListItemText 
                              primary="Discord Activity"
                              secondary="Daily active participation in community discussions"
                            />
                            <Typography variant="body1">{mockCreatorData.communityEngagement.discordActivity}/100</Typography>
                          </ListItem>
                          <Divider />
                          <ListItem>
                            <ListItemText 
                              primary="Twitter Activity"
                              secondary="Regular updates and engagement with followers"
                            />
                            <Typography variant="body1">{mockCreatorData.communityEngagement.twitterActivity}/100</Typography>
                          </ListItem>
                          <Divider />
                          <ListItem>
                            <ListItemText 
                              primary="Response Rate"
                              secondary="How quickly and consistently the creator responds to community"
                            />
                            <Typography variant="body1">{mockCreatorData.communityEngagement.responseRate}/100</Typography>
                          </ListItem>
                          <Divider />
                          <ListItem>
                            <ListItemText 
                              primary="Community Events"
                              secondary="Number of AMAs, Twitter Spaces, and other events in the last 3 months"
                            />
                            <Typography variant="body1">{mockCreatorData.communityEngagement.communityEvents}</Typography>
                          </ListItem>
                          <Divider />
                          <ListItem>
                            <ListItemText 
                              primary="Feedback Implementation"
                              secondary="How well the creator incorporates community feedback"
                            />
                            <Typography variant="body1">{mockCreatorData.communityEngagement.feedbackImplementation}/100</Typography>
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreatorProfileInterface;