import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Palette as PaletteIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  Language as LanguageIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface CreatorStats {
  totalSales: number;
  totalVolume: number;
  averagePrice: number;
  uniqueCollectors: number;
  successfulProjects: number;
  reputationScore: number;
}

interface SocialMetric {
  platform: string;
  followers: number;
  engagement: number;
  verified: boolean;
}

interface CreatorHistory {
  date: string;
  value: number;
  projects: number;
}

interface CreatorProfileProps {
  creatorName: string;
  avatarUrl: string;
  bio: string;
  verified: boolean;
  joinDate: string;
  stats: CreatorStats;
  socialMetrics: SocialMetric[];
  history: CreatorHistory[];
  expertise: Array<{ skill: string; level: number }>;
  achievements: Array<{ title: string; description: string; date: string }>;
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({
  creatorName,
  avatarUrl,
  bio,
  verified,
  joinDate,
  stats,
  socialMetrics,
  history,
  expertise,
  achievements,
}) => {
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETH',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return <TwitterIcon />;
      case 'instagram':
        return <InstagramIcon />;
      default:
        return <LanguageIcon />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Creator Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={avatarUrl}
                  alt={creatorName}
                  sx={{ width: 64, height: 64, mr: 2 }}
                />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5" component="h2">
                      {creatorName}
                    </Typography>
                    {verified && (
                      <Tooltip title="Verified Creator">
                        <VerifiedIcon color="primary" sx={{ ml: 1 }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Member since {new Date(joinDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" paragraph>
                {bio}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Creator Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Sales
                    </Typography>
                    <Typography variant="h6">{stats.totalSales.toLocaleString()}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Volume
                    </Typography>
                    <Typography variant="h6">{formatCurrency(stats.totalVolume)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Average Price
                    </Typography>
                    <Typography variant="h6">{formatCurrency(stats.averagePrice)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Unique Collectors
                    </Typography>
                    <Typography variant="h6">{stats.uniqueCollectors.toLocaleString()}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">Reputation Score</Typography>
                  <Typography variant="h6">{stats.reputationScore}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.reputationScore}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: stats.reputationScore >= 70 ? 'success.main' : 'warning.main',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Social Presence */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Social Presence
              </Typography>
              <List>
                {socialMetrics.map((metric) => (
                  <ListItem key={metric.platform} sx={{ px: 0 }}>
                    <ListItemIcon>{getSocialIcon(metric.platform)}</ListItemIcon>
                    <ListItemText
                      primary={metric.platform}
                      secondary={`${metric.followers.toLocaleString()} followers`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        {metric.engagement}% engagement
                      </Typography>
                      {metric.verified && (
                        <Tooltip title="Verified Account">
                          <VerifiedIcon color="primary" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Expertise */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expertise
              </Typography>
              {expertise.map((item) => (
                <Box key={item.skill} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{item.skill}</Typography>
                    <Typography variant="body2">{item.level}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.level}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Achievements
              </Typography>
              <List>
                {achievements.map((achievement) => (
                  <ListItem key={achievement.title} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <StarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={achievement.title}
                      secondary={
                        <>
                          {achievement.description}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(achievement.date).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Historical Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Historical Performance
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={history} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis yAxisId="left" tickFormatter={(value) => `${value} ETH`} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => value} />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [
                        name === 'value' ? `${value} ETH` : value,
                        name === 'value' ? 'Volume' : 'Projects',
                      ]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="value"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="projects"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="projects"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreatorProfile;