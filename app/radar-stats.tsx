import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import Svg, { Circle, Polygon, Line, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 80;
const CENTER = CHART_SIZE / 2;
const RADIUS = CENTER - 60;

interface RadarDataPoint {
  label: string;
  value: number;
  max: number;
}

export default function RadarStatsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  const getRadarData = (): RadarDataPoint[] => {
    if (user.role === 'player' && 'radarStats' in user) {
      return [
        { label: 'Speed', value: user.radarStats.speed, max: 100 },
        { label: 'Pass %', value: user.radarStats.passPercentage, max: 100 },
        { label: 'Goal %', value: user.radarStats.goalPercentage, max: 100 },
        { label: 'Matches %', value: user.radarStats.matchCompletionPercentage, max: 100 },
        { label: 'Dribbles', value: user.radarStats.dribbles, max: 100 },
      ];
    } else if (user.role === 'coach' && 'radarStats' in user) {
      return [
        { label: 'Win %', value: user.radarStats.winPercentage, max: 100 },
        { label: 'Development', value: user.radarStats.playerDevelopment, max: 100 },
        { label: 'Attendance', value: user.radarStats.trainingAttendance, max: 100 },
        { label: 'Tactics', value: user.radarStats.tacticsScore, max: 100 },
        { label: 'Motivation', value: user.radarStats.motivation, max: 100 },
      ];
    } else if (user.role === 'club' && 'radarStats' in user) {
      return [
        { label: 'Win %', value: user.radarStats.winPercentage, max: 100 },
        { label: 'Goals/Game', value: user.radarStats.goalsPerGame, max: 10 },
        { label: 'Clean Sheets', value: user.radarStats.cleanSheets, max: 100 },
        { label: 'Youth Dev', value: user.radarStats.youthDevelopment, max: 100 },
        { label: 'Budget', value: user.radarStats.budgetManagement, max: 100 },
      ];
    }
    return [];
  };

  const radarData = getRadarData();
  const numPoints = radarData.length;
  const angleStep = (2 * Math.PI) / numPoints;

  const calculatePoint = (index: number, value: number, max: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const normalizedValue = (value / max) * RADIUS;
    const x = CENTER + normalizedValue * Math.cos(angle);
    const y = CENTER + normalizedValue * Math.sin(angle);
    return { x, y };
  };

  const getPolygonPoints = () => {
    return radarData
      .map((item, index) => {
        const point = calculatePoint(index, item.value, item.max);
        return `${point.x},${point.y}`;
      })
      .join(' ');
  };

  const getLabelPosition = (index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const labelRadius = RADIUS + 40;
    const x = CENTER + labelRadius * Math.cos(angle);
    const y = CENTER + labelRadius * Math.sin(angle);
    return { x, y };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Performance Radar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {user.role.toUpperCase()} STATS
        </Text>

        <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
          <Svg width={CHART_SIZE} height={CHART_SIZE}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
              <Polygon
                key={`grid-${i}`}
                points={radarData
                  .map((_, index) => {
                    const point = calculatePoint(index, scale * 100, 1);
                    return `${point.x},${point.y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={theme.border}
                strokeWidth="1"
                opacity={0.3}
              />
            ))}

            {radarData.map((_, index) => {
              const endPoint = calculatePoint(index, 100, 1);
              return (
                <Line
                  key={`axis-${index}`}
                  x1={CENTER}
                  y1={CENTER}
                  x2={endPoint.x}
                  y2={endPoint.y}
                  stroke={theme.border}
                  strokeWidth="1"
                  opacity={0.3}
                />
              );
            })}

            <Polygon
              points={getPolygonPoints()}
              fill={COLORS.primary}
              fillOpacity={0.3}
              stroke={COLORS.skyBlue}
              strokeWidth="3"
            />

            {radarData.map((item, index) => {
              const point = calculatePoint(index, item.value, item.max);
              return (
                <Circle
                  key={`point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill={COLORS.skyBlue}
                />
              );
            })}

            {radarData.map((item, index) => {
              const labelPos = getLabelPosition(index);
              return (
                <SvgText
                  key={`label-${index}`}
                  x={labelPos.x}
                  y={labelPos.y}
                  fill={theme.text}
                  fontSize="14"
                  fontWeight="600"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {item.label}
                </SvgText>
              );
            })}
          </Svg>
        </View>

        <View style={styles.statsGrid}>
          {radarData.map((item, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {item.value}
                {item.max === 100 && '%'}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Stats are automatically updated when you upload new videos and our AI analyzes your performance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 20,
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
