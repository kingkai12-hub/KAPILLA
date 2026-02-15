'use client';

import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import L from 'leaflet';

export interface RouteSegment {
  start: [number, number];
  end: [number, number];
  completed: boolean;
  index: number;
}

interface DynamicRoutePolylineProps {
  routePoints: [number, number][];
  currentPosition: [number, number];
  completedColor?: string;
  remainingColor?: string;
  completedWeight?: number;
  remainingWeight?: number;
  completedOpacity?: number;
  remainingOpacity?: number;
  showProgress?: boolean;
}

/**
 * DynamicRoutePolyline - A single continuous route that dynamically recolors based on progress
 *
 * Features:
 * - Single continuous polyline for the entire route
 * - Logically segmented for dynamic recoloring
 * - Smooth color transitions at vehicle position
 * - Performance optimized with useMemo
 * - Customizable colors, weights, and opacity
 */
export function DynamicRoutePolyline({
  routePoints,
  currentPosition,
  completedColor = '#2563eb', // Blue for completed
  remainingColor = '#ef4444', // Red for remaining
  completedWeight = 8,
  remainingWeight = 6,
  completedOpacity = 0.9,
  remainingOpacity = 0.5,
  showProgress = true,
}: DynamicRoutePolylineProps) {
  // Find the closest point on the route to current position
  const closestIndex = useMemo(() => {
    if (!routePoints || routePoints.length === 0) return 0;

    let minDistance = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < routePoints.length; i++) {
      const dLat = routePoints[i][0] - currentPosition[0];
      const dLng = routePoints[i][1] - currentPosition[1];
      const distance = dLat * dLat + dLng * dLng; // Squared distance (faster)

      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    }

    return closestIdx;
  }, [routePoints, currentPosition]);

  // Split route into completed and remaining segments
  const { completedRoute, remainingRoute } = useMemo(() => {
    if (!routePoints || routePoints.length < 2) {
      return { completedRoute: null, remainingRoute: null };
    }

    // Completed: from start to current position (inclusive)
    const completed = routePoints.slice(0, Math.max(1, closestIndex + 1));

    // Remaining: from current position to end
    const remaining = routePoints.slice(Math.max(0, closestIndex), routePoints.length);

    return {
      completedRoute: completed.length > 1 ? completed : null,
      remainingRoute: remaining.length > 1 ? remaining : null,
    };
  }, [routePoints, closestIndex]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (!routePoints || routePoints.length === 0) return 0;
    return Math.round((closestIndex / (routePoints.length - 1)) * 100);
  }, [closestIndex, routePoints]);

  if (!routePoints || routePoints.length < 2) {
    return null;
  }

  return (
    <>
      {/* Remaining route (drawn first, appears below) */}
      {remainingRoute && (
        <Polyline
          positions={remainingRoute as unknown as L.LatLngExpression[]}
          pathOptions={{
            color: remainingColor,
            weight: remainingWeight,
            opacity: remainingOpacity,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: '12, 12', // Dashed line for remaining
          }}
          smoothFactor={1}
        />
      )}

      {/* Completed route (drawn second, appears on top) */}
      {completedRoute && (
        <Polyline
          positions={completedRoute as unknown as L.LatLngExpression[]}
          pathOptions={{
            color: completedColor,
            weight: completedWeight,
            opacity: completedOpacity,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          smoothFactor={1}
        />
      )}

      {/* Progress indicator (optional) */}
      {showProgress && (
        <div className="hidden">
          {/* Progress data available for external use: {progressPercentage}% */}
        </div>
      )}
    </>
  );
}

/**
 * SegmentedRoutePolyline - Alternative implementation with explicit segments
 * Useful when you need more granular control over individual segments
 */
interface SegmentedRoutePolylineProps {
  segments: RouteSegment[];
  completedColor?: string;
  remainingColor?: string;
  completedWeight?: number;
  remainingWeight?: number;
}

export function SegmentedRoutePolyline({
  segments,
  completedColor = '#2563eb',
  remainingColor = '#ef4444',
  completedWeight = 8,
  remainingWeight = 6,
}: SegmentedRoutePolylineProps) {
  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <>
      {segments.map((segment) => (
        <Polyline
          key={`segment-${segment.index}`}
          positions={[segment.start, segment.end] as unknown as L.LatLngExpression[]}
          pathOptions={{
            color: segment.completed ? completedColor : remainingColor,
            weight: segment.completed ? completedWeight : remainingWeight,
            opacity: segment.completed ? 0.9 : 0.5,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: segment.completed ? undefined : '12, 12',
          }}
        />
      ))}
    </>
  );
}

/**
 * MultiColorRoutePolyline - Advanced implementation with multiple color zones
 * Supports different colors for different route sections (e.g., highway, urban, rural)
 */
interface RouteZone {
  startIndex: number;
  endIndex: number;
  color: string;
  label?: string;
  weight?: number;
}

interface MultiColorRoutePolylineProps {
  routePoints: [number, number][];
  zones: RouteZone[];
  currentPosition: [number, number];
  defaultColor?: string;
  defaultWeight?: number;
}

export function MultiColorRoutePolyline({
  routePoints,
  zones,
  currentPosition,
  defaultColor = '#6b7280',
  defaultWeight = 6,
}: MultiColorRoutePolylineProps) {
  const closestIndex = useMemo(() => {
    if (!routePoints || routePoints.length === 0) return 0;

    let minDistance = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < routePoints.length; i++) {
      const dLat = routePoints[i][0] - currentPosition[0];
      const dLng = routePoints[i][1] - currentPosition[1];
      const distance = dLat * dLat + dLng * dLng;

      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    }

    return closestIdx;
  }, [routePoints, currentPosition]);

  const zoneSegments = useMemo(() => {
    if (!routePoints || routePoints.length < 2) return [];

    const segments: Array<{
      points: [number, number][];
      color: string;
      weight: number;
      completed: boolean;
    }> = [];

    // Sort zones by start index
    const sortedZones = [...zones].sort((a, b) => a.startIndex - b.startIndex);

    let currentIdx = 0;

    for (const zone of sortedZones) {
      // Add default segment before zone if needed
      if (currentIdx < zone.startIndex) {
        const points = routePoints.slice(currentIdx, zone.startIndex + 1);
        if (points.length > 1) {
          segments.push({
            points,
            color: defaultColor,
            weight: defaultWeight,
            completed: zone.startIndex <= closestIndex,
          });
        }
      }

      // Add zone segment
      const zonePoints = routePoints.slice(zone.startIndex, zone.endIndex + 1);
      if (zonePoints.length > 1) {
        segments.push({
          points: zonePoints,
          color: zone.color,
          weight: zone.weight || defaultWeight,
          completed: zone.endIndex <= closestIndex,
        });
      }

      currentIdx = zone.endIndex;
    }

    // Add remaining default segment if needed
    if (currentIdx < routePoints.length - 1) {
      const points = routePoints.slice(currentIdx);
      if (points.length > 1) {
        segments.push({
          points,
          color: defaultColor,
          weight: defaultWeight,
          completed: false,
        });
      }
    }

    return segments;
  }, [routePoints, zones, closestIndex, defaultColor, defaultWeight]);

  if (!routePoints || routePoints.length < 2) {
    return null;
  }

  return (
    <>
      {zoneSegments.map((segment, idx) => (
        <Polyline
          key={`zone-${idx}`}
          positions={segment.points as unknown as L.LatLngExpression[]}
          pathOptions={{
            color: segment.color,
            weight: segment.weight,
            opacity: segment.completed ? 0.9 : 0.5,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: segment.completed ? undefined : '12, 12',
          }}
          smoothFactor={1}
        />
      ))}
    </>
  );
}

/**
 * Utility function to create route segments from points
 */
export function createRouteSegments(
  routePoints: [number, number][],
  currentPosition: [number, number]
): RouteSegment[] {
  if (!routePoints || routePoints.length < 2) return [];

  // Find closest point
  let closestIdx = 0;
  let minDistance = Infinity;

  for (let i = 0; i < routePoints.length; i++) {
    const dLat = routePoints[i][0] - currentPosition[0];
    const dLng = routePoints[i][1] - currentPosition[1];
    const distance = dLat * dLat + dLng * dLng;

    if (distance < minDistance) {
      minDistance = distance;
      closestIdx = i;
    }
  }

  // Create segments
  const segments: RouteSegment[] = [];

  for (let i = 0; i < routePoints.length - 1; i++) {
    segments.push({
      start: routePoints[i],
      end: routePoints[i + 1],
      completed: i < closestIdx,
      index: i,
    });
  }

  return segments;
}
