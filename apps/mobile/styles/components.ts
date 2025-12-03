import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Spacing, Layout, BorderRadius } from './spacing';
import { FontSize, FontWeight } from './typography';

// TrueCSS Component Styles

export const Components = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  // Card/Surface
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    padding: Layout.cardPadding,
    marginBottom: Layout.gap,
  },
  
  // Primary Button (White on Black)
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.small,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: FontSize.normal,
    fontWeight: FontWeight.medium,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  
  // Secondary Button (Black with Border)
  secondaryButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: FontSize.normal,
    fontWeight: FontWeight.medium,
  },
  
  // Input Field
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    padding: Layout.inputPadding,
    fontSize: FontSize.normal,
    color: Colors.textPrimary,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.small,
    marginBottom: Spacing.sm,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: Layout.modalPadding,
    width: '80%',
    maxWidth: 400,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: Layout.screenPadding,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Separator
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  
  // Avatar
  avatar: {
    borderRadius: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarPlaceholder: {
    borderRadius: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

