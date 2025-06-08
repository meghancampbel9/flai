export const colors = {
  // Primary
  primary: '#000000',
  primaryPressed: '#333333',
  
  // Background
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  
  // Text
  text: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  
  // Border
  border: '#e0e0e0',
  borderFocus: '#000000',
  
  // Status
  error: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
  info: '#007AFF',
  
  // Gradient
  gradientStart: '#f8f9fa',
  gradientEnd: '#ffffff',
  
  // Disabled
  disabled: '#e0e0e0',
} as const;

export type ColorKey = keyof typeof colors; 