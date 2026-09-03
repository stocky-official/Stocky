import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { Branch, Company, CompanyUserRole } from '@stocky/types';

interface DashboardScreenProps {
  company: Company | null;
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
  userEmail?: string | null;
  userRole?: CompanyUserRole;
  onNavigateToInventory: () => void;
  onOpenScanner: () => void;
}

export function DashboardScreen({
  company,
  branches,
  selectedBranchId,
  onSelectBranch,
  userEmail,
  userRole = 'owner',
  onNavigateToInventory,
  onOpenScanner,
}: DashboardScreenProps) {
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Organization Branding Card */}
        <View style={styles.orgCard}>
          <View style={styles.orgHeader}>
            {company?.logoUrl ? (
              <Image source={{ uri: company.logoUrl }} style={styles.orgLogo} resizeMode="contain" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>
                  {(company?.name?.[0] || 'S').toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.orgMeta}>
              <Text style={styles.orgName}>{company?.name || 'Stocky Organization'}</Text>
              <Text style={styles.orgCode}>Code: {company?.code || 'CRK'} • Mobile Platform</Text>
            </View>
          </View>

          {/* User Session Bar */}
          <View style={styles.sessionRow}>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail || 'stocky.admin@gmail.com'}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {userRole === 'owner' ? 'Owner' : userRole === 'admin' ? 'Admin' : userRole === 'manager' ? 'Branch Manager' : 'Staff'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Scan Callout */}
        <TouchableOpacity activeOpacity={0.8} onPress={onOpenScanner} style={styles.scanBanner}>
          <View style={styles.scanBannerContent}>
            <Text style={styles.scanBannerTitle}>📷 Instant Shelf Barcode Scanner</Text>
            <Text style={styles.scanBannerDesc}>
              Point your camera at any SKU barcode to check or adjust stock counts on the spot.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Operational KPI Grid */}
        <Text style={styles.sectionHeading}>Operational Overview</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Catalog SKUs</Text>
            <Text style={styles.kpiValue}>31,488</Text>
            <Text style={styles.kpiSub}>Active products live</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Branch Locations</Text>
            <Text style={styles.kpiValue}>{branches.length}</Text>
            <Text style={styles.kpiSub}>Operating stores</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Current Location</Text>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {selectedBranch ? selectedBranch.name : 'All Hubs'}
            </Text>
            <Text style={styles.kpiSub}>Active branch scope</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Categories</Text>
            <Text style={styles.kpiValue}>42</Text>
            <Text style={styles.kpiSub}>Retail item types</Text>
          </View>
        </View>

        {/* Navigate to Full Inventory */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNavigateToInventory}
          style={styles.invButton}
        >
          <Text style={styles.invButtonText}>Open Inventory Catalog →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  orgCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  orgLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0057FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  orgMeta: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  orgCode: {
    fontSize: 11,
    color: '#777777',
    marginTop: 2,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
    paddingTop: 10,
  },
  userEmail: {
    fontSize: 11,
    color: '#555555',
    flex: 1,
  },
  roleBadge: {
    backgroundColor: 'rgba(0, 87, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 87, 255, 0.18)',
  },
  roleText: {
    color: '#0057FF',
    fontSize: 10,
    fontWeight: '500',
  },
  scanBanner: {
    backgroundColor: '#0057FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  scanBannerContent: {
    gap: 4,
  },
  scanBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  scanBannerDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    padding: 14,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#777777',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  kpiSub: {
    fontSize: 10,
    color: '#999999',
    marginTop: 4,
  },
  invButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  invButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0057FF',
  },
});
