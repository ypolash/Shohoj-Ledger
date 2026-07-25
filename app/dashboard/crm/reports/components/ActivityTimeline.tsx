"use client";

import React from 'react';
import { ActivityFeed } from './ActivityFeed';

// A wrapper to reuse ActivityFeed for simpler dashboard views
export function ActivityTimeline() {
  return <ActivityFeed />;
}
