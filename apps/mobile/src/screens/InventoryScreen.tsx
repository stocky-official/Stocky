import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { ItemEditModal } from '../components/ItemEditModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import type { Item, Branch, CompanyUserRole } from '@stocky/types';

interface InventoryScreenProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
  userRole?: CompanyUserRole;
}

export function InventoryScreen({
  branches,
  selectedBranchId,
  onSelectBranch,
  userRole = 'owner',
}: InventoryScreenProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  // Modals
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Fetch categories once
  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      if (data) {
        setCategories(['All', ...data.map((c: any) => c.name)]);
      }
    }
    loadCategories();
  }, []);

  // Fetch items with branch, search, and category filters
  const fetchItems = useCallback(
    async (pageNumber = 1, append = false) => {
      setLoading(true);
      try {
        let query = supabase.from('items').select('*', { count: 'exact' });

        if (selectedBranchId !== 'all') {
          query = query.eq('branch_id', selectedBranchId);
        }

        if (selectedCategory !== 'All') {
          query = query.eq('category_name', selectedCategory);
        }

        if (searchQuery.trim()) {
          const clean = searchQuery.trim();
          query = query.or(`name.ilike.%${clean}%,barcode.ilike.%${clean}%`);
        }

        const from = (pageNumber - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, count, error } = await query
          .order('name')
          .range(from, to);

        if (error) throw error;

        if (data) {
          const mapped: Item[] = data.map((i: any) => ({
            id: i.id,
            companyId: i.company_id,
            branchId: i.branch_id,
            categoryName: i.category_name,
            name: i.name,
            quantity: i.quantity,
            balance: i.balance,
            barcode: i.barcode,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
          }));

          setItems((prev) => (append ? [...prev, ...mapped] : mapped));
        }

        if (count !== null) setTotalCount(count);
      } catch (err) {
        console.error('Error fetching inventory items on mobile:', err);
      } finally {
        setLoading(false);
      }
    },
    [selectedBranchId, selectedCategory, searchQuery]
  );

  useEffect(() => {
    setPage(1);
    fetchItems(1, false);
  }, [fetchItems]);

  const handleEndReached = () => {
    if (!loading && items.length < totalCount) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchItems(nextPage, true);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
  };

  const handleItemSaved = (updated: Item) => {
    setItems((prev) =>
      prev.map((it) => (it.id === updated.id ? updated : it))
    );
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setEditingItem(item)}
      style={styles.itemCard}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemQty}>
          {item.quantity.toLocaleString()} units
        </Text>
      </View>

      <View style={styles.itemMeta}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.categoryName}</Text>
        </View>

        <Text style={styles.itemBalance}>
          ${Number(item.balance).toFixed(2)}
        </Text>
      </View>

      {item.barcode && (
        <View style={styles.barcodeRow}>
          <Text style={styles.barcodeText}>Barcode: {item.barcode}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Controls: Search Bar & Barcode Camera Trigger */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarWrapper}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search SKUs or Barcode..."
            placeholderTextColor="#888888"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Barcode Camera Button */}
        <TouchableOpacity
          onPress={() => setIsScannerOpen(true)}
          style={styles.scanActionBtn}
        >
          <Text style={styles.scanActionText}>📷 Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Branch Selector Pills */}
      <View style={styles.branchScrollWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All Branches' }, ...branches]}
          keyExtractor={(b) => b.id}
          renderItem={({ item: b }) => {
            const isSelected = selectedBranchId === b.id;
            return (
              <TouchableOpacity
                onPress={() => onSelectBranch(b.id)}
                style={[
                  styles.branchPill,
                  isSelected && styles.branchPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.branchPillText,
                    isSelected && styles.branchPillTextActive,
                  ]}
                >
                  {b.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.branchPillContainer}
        />
      </View>

      {/* Count Indicator */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {totalCount.toLocaleString()} items matching criteria
        </Text>
      </View>

      {/* Item List */}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          loading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color="#0057FF" size="small" />
            </View>
          ) : null
        }
      />

      {/* Item Edit Modal */}
      <ItemEditModal
        visible={!!editingItem}
        item={editingItem}
        userRole={userRole}
        onClose={() => setEditingItem(null)}
        onSaved={handleItemSaved}
      />

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanned={handleBarcodeScanned}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: '#000000',
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#888888',
  },
  scanActionBtn: {
    backgroundColor: '#0057FF',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  branchScrollWrapper: {
    paddingVertical: 4,
  },
  branchPillContainer: {
    paddingHorizontal: 16,
    gap: 6,
  },
  branchPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  branchPillActive: {
    backgroundColor: '#0057FF',
    borderColor: '#0057FF',
  },
  branchPillText: {
    fontSize: 11,
    color: '#555555',
  },
  branchPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 11,
    color: '#888888',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 18,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0057FF',
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryBadge: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    color: '#666666',
  },
  itemBalance: {
    fontSize: 12,
    color: '#444444',
    fontWeight: '500',
  },
  barcodeRow: {
    marginTop: 6,
    borderTopWidth: 1,
    borderColor: '#F5F5F5',
    paddingTop: 6,
  },
  barcodeText: {
    fontSize: 10,
    color: '#999999',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
