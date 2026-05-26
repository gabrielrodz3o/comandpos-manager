import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { palette } from '@theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, style, ...rest }, ref) => {
    const c = palette.dark;
    return (
      <View style={{ gap: 8 }}>
        {label ? (
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', letterSpacing: -0.1 }}>
            {label}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: error ? c.danger : c.border,
            paddingHorizontal: 16,
            height: 52,
          }}
        >
          {leftIcon ? <View style={{ marginRight: 10 }}>{leftIcon}</View> : null}
          <TextInput
            ref={ref}
            placeholderTextColor={c.textMuted}
            style={[
              {
                flex: 1,
                color: c.text,
                fontSize: 15,
                fontWeight: '500',
              },
              style,
            ]}
            {...rest}
          />
          {rightIcon ? <View style={{ marginLeft: 10 }}>{rightIcon}</View> : null}
        </View>
        {error ? (
          <Text style={{ color: c.danger, fontSize: 12, fontWeight: '500' }}>{error}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';
