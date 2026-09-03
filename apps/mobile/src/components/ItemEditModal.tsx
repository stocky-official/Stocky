import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { Item, CompanyUserRole } from '@stocky/types';

interface ItemEditModalProps {
  visible: boolean;
  item: Item | null;
  userRole?: CompanyUserRole;
  allCategories?: string[];
  onClose: () => void;
  onSaved: (updatedItem: Item) => void;
}

export function ItemEditModal({
  visible,
  item,
  userRole = 'owner',
  onClose,
  onSaved,
}: ItemEditModalProps) {
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [balance, setBalance] = useState('0');
  const [barcode, setBarcode] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isStaff = userRole === 'staff';

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategoryName(item.categoryName || '');
      setQuantity(String(item.quantity ?? 0));
      setBalance(String(item.balance ?? 0));
      setBarcode(item.barcode || '');
      setErrorMsg(null);
    }
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);

    try {
      const parsedQty = parseInt(quantity, 10) || 0;
      const parsedBal = parseFloat(balance) || 0;

      const updatePayload: any = {
        quantity: parsedQty,
        updated_at: new Date().toISOString(),
      };

      // Only non-staff roles can update master catalog attributes
      if (!isStaff) {
        updatePayload.name = name.trim();
        updatePayload.category_name = categoryName.trim();
        updatePayload.balance = parsedBal;
        updatePayload.barcode = barcode.trim() || null;
      }

      const { data, error } = await supabase
        .from('items')
        .update(updatePayload)
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;

      onSaved({
        ...item,
        name: updatePayload.name ?? item.name,
        categoryName: updatePayload.category_name ?? item.categoryName,
        quantity: parsedQty,
        balance: updatePayload.balance ?? item.balance,
        barcode: updatePayload.barcode ?? item.barcode,
      });
      onClose();
    } catch (err: any) {
      console.error('Error saving item on mobile:', err);
      setErrorMsg(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Edit Inventory Item</Text>
              <Text style={styles.subtitle}>ID: {item.id.slice(0, 8)}...</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Staff notice badge */}
            {isStaff && (
              <View style={styles.staffBadge}>
                <Text style={styles.staffBadgeText}>
                  Staff Access: Only stock count (quantity) can be adjusted. Master fields are locked.
                </Text>
              </View>
            )}

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Item Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                editable={!isStaff}
                style={[styles.input, isStaff && styles.inputDisabled]}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                value={categoryName}
                onChangeText={setCategoryName}
                editable={!isStaff}
                style={[styles.input, isStaff && styles.inputDisabled]}
              />
            </View>

            {/* Quantity & Balance */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, isStaff && { color: '#0057FF', fontWeight: '500' }]}>
                  Quantity (Units) {isStaff ? '★ Editable' : ''}
                </Text>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  autoFocus={isStaff}
                  style={[styles.input, isStaff && styles.inputHighlight]}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Balance ($)</Text>
                <TextInput
                  value={balance}
                  onChangeText={setBalance}
                  keyboardType="numeric"
                  editable={!isStaff}
                  style={[styles.input, isStaff && styles.inputDisabled]}
                />
              </View>
            </View>

            {/* Barcode */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Barcode</Text>
              <TextInput
                value={barcode}
                onChangeText={setBarcode}
                editable={!isStaff}
                style={[styles.input, isStaff && styles.inputDisabled]}
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: '#EBEBEB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#EBEBEB',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  subtitle: {
    fontSize: 11,
    color: '#777777',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  closeText: {
    fontSize: 13,
    color: '#555555',
  },
  body: {
    paddingHorizontal: 20,
  },
  bodyContent: {
    paddingVertical: 16,
  },
  staffBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  staffBadgeText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 11,
    color: '#B91C1C',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '400',
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#000000',
  },
  inputDisabled: {
    opacity: 0.55,
    backgroundColor: '#F0F0F0',
  },
  inputHighlight: {
    borderColor: '#0057FF',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#EBEBEB',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  cancelText: {
    fontSize: 12,
    color: '#444444',
  },
  saveBtn: {
    backgroundColor: '#0057FF',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 110,
  },
  saveText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
