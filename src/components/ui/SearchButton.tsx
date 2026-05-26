import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { palette } from '@theme/colors';
import { GlobalSearch } from '@components/search/GlobalSearch';

export const SearchButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: palette.dark.soft,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontSize: 16 }}>🔍</Text>
      </Pressable>
      <GlobalSearch visible={open} onClose={() => setOpen(false)} />
    </>
  );
};
