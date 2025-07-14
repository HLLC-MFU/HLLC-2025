// components/ui/SearchInput.tsx
import React from 'react'
import { XStack, Input } from 'tamagui'
import { Search } from 'lucide-react-native'

type SearchInputProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
}) => {
  return (
    <XStack
      alignItems="center"
      paddingHorizontal="$3"
      borderRadius="$6"
      height="$5"
      borderWidth={2}
      borderColor={"#ffffff20"}
    >
      <Search size={18} color={"#ffffff80"} />
      <Input
        flex={1}
        size="$4"
        borderWidth={0}
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        style={{ backgroundColor: 'transparent' }}
      />
    </XStack>
  )
}
