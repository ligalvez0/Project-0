import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Category } from '../../models';
import { colors } from '../../constants/colors';

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = category.id === selectedId;
          return (
            <Chip
              key={category.id}
              selected={isSelected}
              onPress={() => onSelect(category.id)}
              icon={() => (
                <MaterialCommunityIcons
                  name={category.icon}
                  size={18}
                  color={isSelected ? colors.surface : category.color}
                />
              )}
              style={[
                styles.chip,
                isSelected && { backgroundColor: category.color },
              ]}
              textStyle={[
                styles.chipText,
                isSelected && { color: colors.surface },
              ]}
              showSelectedOverlay={false}
            >
              {category.name}
            </Chip>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
});
