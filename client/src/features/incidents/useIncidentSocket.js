/**
 * useIncidentSocket.js — Custom hook for real-time incident updates
 *
 * Uses the latest-ref pattern for event callbacks to prevent unnecessary
 * room unsubscriptions/re-subscriptions on component re-renders.
 */
import { useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';

export function useIncidentSocket(incidentId, { onIncidentUpdated, onTimelineEntryCreated }) {
  const socket = useSocket();
  const onIncidentUpdatedRef = useRef(onIncidentUpdated);
  const onTimelineEntryCreatedRef = useRef(onTimelineEntryCreated);

  // Keep references to the latest callbacks
  useEffect(() => {
    onIncidentUpdatedRef.current = onIncidentUpdated;
    onTimelineEntryCreatedRef.current = onTimelineEntryCreated;
  });

  useEffect(() => {
    if (!socket || !incidentId) return;

    // Join the incident-specific room
    socket.emit('join', incidentId);

    const handleIncidentUpdated = (updated) => {
      onIncidentUpdatedRef.current?.(updated);
    };

    const handleTimelineEntryCreated = (entry) => {
      onTimelineEntryCreatedRef.current?.(entry);
    };

    // Register event listeners
    socket.on('incident_updated', handleIncidentUpdated);
    socket.on('timeline_entry_created', handleTimelineEntryCreated);

    // Cleanup: leave the room and remove listeners on unmount
    return () => {
      socket.emit('leave', incidentId);
      socket.off('incident_updated', handleIncidentUpdated);
      socket.off('timeline_entry_created', handleTimelineEntryCreated);
    };
  }, [socket, incidentId]);
}
