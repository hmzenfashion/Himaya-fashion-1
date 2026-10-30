import React from 'react';
import { AdConfiguration } from '../types';

interface AdManagerProps {
  config?: AdConfiguration;
  isAdminOpen?: boolean;
}

/**
 * AdManager:
 * Ads & Links (বিজ্ঞাপন) completely removed from the website so customers
 * are never annoyed by popunders, floating banners, or third-party ad scripts.
 */
export const AdManager: React.FC<AdManagerProps> = () => {
  return null;
};
