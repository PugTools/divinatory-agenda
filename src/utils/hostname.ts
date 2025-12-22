/**
 * Utility for hostname detection and environment identification
 */

export type Environment = 'localhost' | 'preview' | 'published' | 'production';

interface HostnameInfo {
  hostname: string;
  environment: Environment;
  isLocalhost: boolean;
  isPreview: boolean;
  isPublished: boolean;
  isProduction: boolean;
  isLovable: boolean;
  subdomain: string | null;
}

/**
 * Get detailed hostname information for the current environment
 */
export const getHostnameInfo = (): HostnameInfo => {
  const hostname = window.location.hostname;
  
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPreview = hostname.includes('lovableproject.com');
  const isPublished = hostname.includes('lovable.app');
  const isLovable = isPreview || isPublished;
  const isProduction = !isLocalhost && !isLovable;
  
  // Extract subdomain from hostname (first part before the first dot)
  const subdomain = isProduction ? hostname.split('.')[0] : null;
  
  let environment: Environment;
  if (isLocalhost) {
    environment = 'localhost';
  } else if (isPreview) {
    environment = 'preview';
  } else if (isPublished) {
    environment = 'published';
  } else {
    environment = 'production';
  }
  
  return {
    hostname,
    environment,
    isLocalhost,
    isPreview,
    isPublished,
    isProduction,
    isLovable,
    subdomain,
  };
};

/**
 * Check if the current environment is a development/preview environment
 */
export const isDevelopmentEnvironment = (): boolean => {
  const { isLocalhost, isLovable } = getHostnameInfo();
  return isLocalhost || isLovable;
};

/**
 * Check if the current environment is a production environment
 */
export const isProductionEnvironment = (): boolean => {
  return getHostnameInfo().isProduction;
};

/**
 * Get the base URL for the current environment
 */
export const getBaseUrl = (): string => {
  return window.location.origin;
};

/**
 * Generate a personalized link for a priest subdomain
 */
export const getPersonalizedLink = (subdomain: string): string => {
  const { isProduction } = getHostnameInfo();
  
  if (isProduction) {
    // In production, use actual subdomain format
    return `https://${subdomain}.yourdomain.com`;
  }
  
  // In development/preview, use query parameter
  return `${getBaseUrl()}/?priest=${subdomain}`;
};
