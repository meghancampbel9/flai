export const spacing = {
  // Base spacing units
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 30,
  xxxxxl: 60,
  
  // Common paddings from existing screens
  screenHorizontal: 24,
  screenVertical: 40,
  sectionBottom: 40,
  buttonVertical: 16,
  buttonVerticalLarge: 18,
  
  // Border radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 25,
    xl: 30,
  },
} as const;

export type SpacingKey = keyof typeof spacing; 