/**
 * Primitivas de UI compartilhadas — tudo no tema dark do Foco.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R, SP, softShadow } from '@/constants/theme';

/* ------------------------------------------------------------------ */

export function Screen({ children, style, deep, floatingAction }: ViewProps & { deep?: boolean; floatingAction?: React.ReactNode }) {
  return (
    <SafeAreaView style={[styles.screen, deep && { backgroundColor: C.bgDeep }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.screenContent, style]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {floatingAction}
    </SafeAreaView>
  );
}

export function Card({ children, style }: ViewProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  count,
  onAdd,
  actionLabel,
  onAction,
}: {
  title: string;
  count?: number;
  onAdd?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {typeof count === 'number' && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {onAdd ? (
        <Pressable onPress={onAdd} hitSlop={10} style={styles.sectionAdd}>
          <Ionicons name="add" size={18} color={C.accentLight} />
        </Pressable>
      ) : actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  colorDot,
  style,
  textStyle,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  colorDot?: string;
  style?: object;
  textStyle?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, selected && styles.chipSelected, style]}
    >
      {colorDot ? <View style={[styles.chipDot, { backgroundColor: colorDot }]} /> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} style={[styles.segmentItem, active && styles.segmentItemActive]} onPress={() => onChange(o.value)}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive, active && o.color ? { color: o.color } : null]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 420 || fontScale > 1.2;
  const dec = () => {
    if (value - step >= min) onChange(value - step);
  };
  const inc = () => {
    if (value + step <= max) onChange(value + step);
  };
  return (
    <View style={[styles.stepperRow, compact && styles.stepperRowCompact]}>
      <Text style={[styles.stepperLabel, styles.stepperTitle, compact && { flex: 0 }]}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable onPress={dec} hitSlop={8} style={[styles.stepperBtn, value - step < min && styles.stepperDisabled]}>
          <Ionicons name="remove" size={18} color={value - step < min ? C.textFaint : C.text} />
        </Pressable>
        <Text style={styles.stepperValue}>
          {value}
          {suffix ?? ''}
        </Text>
        <Pressable onPress={inc} hitSlop={8} style={[styles.stepperBtn, value + step > max && styles.stepperDisabled]}>
          <Ionicons name="add" size={18} color={value + step > max ? C.textFaint : C.text} />
        </Pressable>
      </View>
    </View>
  );
}

export function SwitchRow({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, minWidth: 0, paddingRight: SP.l }}>
        <Text style={styles.stepperLabel}>{label}</Text>
        {description ? <Text style={styles.switchDescription}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.surface3, true: C.accentDeep }}
        thumbColor={value ? '#EDE9FE' : '#8E8EA3'}
      />
    </View>
  );
}

export function ActionRow({
  icon,
  iconColor,
  label,
  description,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? C.red : iconColor ?? C.accentLight;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: C.surface2 }]}>
      <View style={[styles.actionIcon, { backgroundColor: danger ? C.redSoft : C.accentSoft }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.actionLabel, danger && { color: C.red }]}>{label}</Text>
        {description ? <Text style={styles.actionDescription}>{description}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.textFaint} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={C.textFaint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function AppInput(props: TextInputProps) {
  return <TextInput placeholderTextColor={C.textFaint} selectionColor={C.accentLight} {...props} style={[styles.input, props.style]} />;
}

/* ------------------------------------------------------------------ */
/* Bottom sheet modal                                                  */
/* ------------------------------------------------------------------ */

export function SheetModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent={Platform.OS !== 'android'} onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={[styles.modalRoot, { paddingTop: insets.top + SP.s }]}
      >
        <Pressable style={styles.modalBackdrop} onPress={close} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, SP.l) + SP.l }]}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' ? false : undefined}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {visible ? children : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Seletor simples estilo action sheet. */
export function ChooserSheet({
  visible,
  onClose,
  title,
  options,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[];
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.chooserRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.chooserSheet, { paddingBottom: Math.max(insets.bottom, SP.l) + SP.l }]}>
          <Text style={styles.chooserTitle}>{title}</Text>
          {options.map((o) => (
            <Pressable
              key={o.label}
              style={({ pressed }) => [styles.chooserOption, pressed && { backgroundColor: C.surface2 }]}
              onPress={() => {
                onClose();
                o.onPress();
              }}
            >
              <Ionicons name={o.icon} size={20} color={C.accentLight} />
              <Text style={styles.chooserLabel}>{o.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.chooserCancel} onPress={onClose}>
            <Text style={styles.chooserCancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Botão principal (cheio, violeta) e secundário (fantasma). */
export function PrimaryButton({ label, onPress, disabled, danger }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        danger && { backgroundColor: C.redSoft, borderColor: 'rgba(248,113,113,0.4)' },
        disabled && styles.btnDisabled,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.primaryBtnText, danger && { color: C.red }]}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}>
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

/** FAB inferior direito. */
export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <View style={[styles.fab, softShadow]}>
      <Pressable onPress={onPress} style={styles.fabPress} hitSlop={6}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  screenContent: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: SP.xl, paddingBottom: 120, flexGrow: 1 },

  card: {
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: 'rgba(38, 38, 51, 0.8)',
    padding: SP.l,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SP.xxl, marginBottom: SP.m },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SP.s },
  sectionTitle: { color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  countBadge: {
    backgroundColor: C.accentSoft,
    borderRadius: R.pill,
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
  },
  countText: { color: C.accentLight, fontSize: 12, fontWeight: '700' },
  sectionAdd: {
    width: 30,
    height: 30,
    borderRadius: R.pill,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionAction: { color: C.accentLight, fontSize: 13, fontWeight: '700' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface2,
    borderRadius: R.chip,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: C.accent, borderColor: C.accentLight },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { flexShrink: 1, color: C.textDim, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },

  segmented: {
    flexDirection: 'row',
    backgroundColor: C.surface2,
    borderRadius: R.chip,
    padding: 3,
    gap: 3,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: R.chip - 3 },
  segmentItemActive: { backgroundColor: C.surface3 },
  segmentText: { textAlign: 'center', flexShrink: 1, color: C.textDim, fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: C.text },

  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SP.m, paddingVertical: 11 },
  stepperRowCompact: { flexDirection: 'column', alignItems: 'stretch' },
  stepperTitle: { flex: 1, minWidth: 0 },
  stepperLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, gap: SP.s },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisabled: { opacity: 0.35 },
  stepperValue: { color: C.text, fontSize: 15, fontWeight: '800', minWidth: 56, textAlign: 'center', fontVariant: ['tabular-nums'] },

  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  switchDescription: { color: C.textFaint, fontSize: 12, marginTop: 2 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.m,
    paddingVertical: 11,
    borderRadius: R.chip,
    paddingHorizontal: 4,
  },
  actionIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  actionDescription: { color: C.textFaint, fontSize: 12, marginTop: 1 },

  empty: { alignItems: 'center', paddingVertical: SP.xxl, gap: SP.s },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SP.xs,
  },
  emptyTitle: { color: C.textDim, fontSize: 15, fontWeight: '700' },
  emptySubtitle: { color: C.textFaint, fontSize: 13, textAlign: 'center', maxWidth: 260 },
  emptyBtn: {
    marginTop: SP.m,
    backgroundColor: C.accentSoft,
    borderRadius: R.btn,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyBtnText: { color: C.accentLight, fontWeight: '800', fontSize: 14 },

  field: { gap: SP.s },
  fieldLabel: { color: C.textDim, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    backgroundColor: C.surface2,
    borderRadius: R.field,
    borderWidth: 1,
    borderColor: 'transparent',
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: SP.l,
    paddingVertical: 13,
  },

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    flex: 1,
    maxHeight: '92%',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.surface3,
    marginTop: SP.m,
  },
  modalTitle: { color: C.text, fontSize: 19, fontWeight: '800', paddingHorizontal: SP.xl, paddingTop: SP.m, paddingBottom: SP.s },
  modalContent: { paddingHorizontal: SP.xl, paddingTop: SP.s, gap: SP.l },

  chooserRoot: { flex: 1, justifyContent: 'flex-end' },
  chooserSheet: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: C.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: SP.xl,
    paddingBottom: SP.xxl,
    gap: SP.xs,
  },
  chooserTitle: { color: C.textDim, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SP.s },
  chooserOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.m,
    paddingVertical: 14,
    borderRadius: R.chip,
    paddingHorizontal: SP.s,
  },
  chooserLabel: { color: C.text, fontSize: 16, fontWeight: '700' },
  chooserCancel: { alignItems: 'center', paddingVertical: 12, marginTop: SP.xs },
  chooserCancelText: { color: C.textDim, fontSize: 15, fontWeight: '700' },

  primaryBtn: {
    minHeight: 48,
    paddingHorizontal: SP.l,
    backgroundColor: C.accent,
    borderRadius: R.btn,
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryBtnText: { textAlign: 'center', flexShrink: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  ghostBtn: {
    minHeight: 48,
    paddingHorizontal: SP.l,
    borderRadius: R.btn,
    alignItems: 'center',
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: C.surface3,
  },
  ghostBtnText: { textAlign: 'center', flexShrink: 1, color: C.textDim, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },

  fab: {
    position: 'absolute',
    right: SP.xl,
    bottom: SP.xl,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: C.accent,
  },
  fabPress: { alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
});
