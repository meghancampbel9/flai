import React from 'react';
import { Pressable, Text, PressableStateCallbackType, ViewStyle, TextStyle } from 'react-native';
import { uiStyles } from './styles';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}) => {
  const handlePress = () => {
    console.log('🔘 Button pressed:', title);
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const getButtonStyle = ({ pressed }: { pressed: boolean }) => {
    const baseStyle = size === 'large' 
      ? uiStyles.primaryButtonLarge 
      : uiStyles.primaryButton;
    
    return [
      baseStyle,
      disabled && uiStyles.primaryButtonDisabled,
      pressed && !disabled && uiStyles.buttonPressed,
      style,
    ];
  };

  const getTextStyle = () => {
    return [
      uiStyles.primaryButtonText,
      disabled && uiStyles.primaryButtonTextDisabled,
      textStyle,
    ];
  };

  return (
    <Pressable
      style={getButtonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <Text style={getTextStyle()}>
        {loading ? 'Loading...' : title}
      </Text>
    </Pressable>
  );
}; 