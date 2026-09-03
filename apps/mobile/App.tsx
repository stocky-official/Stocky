import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { supabase } from './src/lib/supabase';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BarcodeScannerModal } from './src/components/BarcodeScannerModal';
import type { Branch, Company, CompanyUserRole } from '@stocky/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'settings'>('dashboard');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core Platform Data
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [userEmail, setUserEmail] = useState<string | null>('stocky.admin@gmail.com');
  const [userRole, setUserRole] = useState<CompanyUserRole>('owner');
  const [assignedBranchIds, setAssignedBranchIds] = useState<string[]>([]);

  useEffect(() => {
    async function initMobile() {
      try {
        // 1. Fetch Company
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (comp) {
          setCompany({
            id: comp.id,
            name: comp.name,
            code: comp.code,
            logoUrl: comp.logo_url,
            createdAt: comp.created_at,
            updatedAt: comp.updated_at,
          });
        }

        // 2. Fetch Branches
        const { data: dbBranches } = await supabase
          .from('branches')
          .select('*')
          .order('name');

        if (dbBranches) {
          const mapped: Branch[] = dbBranches.map((b: any) => ({
            id: b.id,
            companyId: b.company_id,
            name: b.name,
            code: b.code,
            address: b.address,
            phone: b.phone,
            isActive: b.is_active,
            createdAt: b.created_at,
            updatedAt: b.updated_at,
          }));
          setBranches(mapped);
        }

        // 3. Fetch User session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email ?? null);
          const { data: profile } = await supabase
            .from('company_users')
            .select('*')
            .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
            .limit(1)
            .maybeSingle();

          if (profile) {
            setUserRole(profile.role);
            const { data: ub } = await supabase
              .from('user_branches')
              .select('branch_id')
              .eq('user_id', profile.id);

            if (ub && ub.length > 0) {
              const bIds = ub.map((r: any) => r.branch_id);
              setAssignedBranchIds(bIds);
              if (profile.role === 'manager' || profile.role === 'staff') {
                setSelectedBranchId(bIds[0]);
              }
            }
          }
        }
      } catch (err) {
        console.error('Mobile initialization note:', err);
      } finally {
        setLoading(false);
      }
    }

    initMobile();
  }, []);

  const visibleBranches = React.useMemo(() => {
    if (userRole === 'owner' || userRole === 'admin' || assignedBranchIds.length === 0) {
      return branches;
    }
    return branches.filter((b) => assignedBranchIds.includes(b.id));
  }, [branches, userRole, assignedBranchIds]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#0057FF" size="large" />
        <Text style={styles.loadingText}>Connecting to Stocky Catalog...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Content */}
      <View style={styles.screenWrapper}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            company={company}
            branches={visibleBranches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={setSelectedBranchId}
            userEmail={userEmail}
            userRole={userRole}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryScreen
            branches={visibleBranches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={setSelectedBranchId}
            userRole={userRole}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            company={company}
            userEmail={userEmail}
            userRole={userRole}
            onSignOut={() => supabase.auth.signOut()}
          />
        )}
      </View>

      {/* Floating Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNavPill}>
          <TouchableOpacity
            onPress={() => setActiveTab('dashboard')}
            style={[styles.navTab, activeTab === 'dashboard' && styles.navTabActive]}
          >
            <Text style={[styles.navIcon, activeTab === 'dashboard' && styles.navTextActive]}>
              📊
            </Text>
            <Text style={[styles.navLabel, activeTab === 'dashboard' && styles.navTextActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('inventory')}
            style={[styles.navTab, activeTab === 'inventory' && styles.navTabActive]}
          >
            <Text style={[styles.navIcon, activeTab === 'inventory' && styles.navTextActive]}>
              📦
            </Text>
            <Text style={[styles.navLabel, activeTab === 'inventory' && styles.navTextActive]}>
              Inventory
            </Text>
          </TouchableOpacity>

          {/* Quick Camera Barcode Scan Trigger */}
          <TouchableOpacity
            onPress={() => setIsScannerOpen(true)}
            style={styles.navScanTab}
          >
            <View style={styles.navScanCircle}>
              <Text style={styles.navScanIcon}>📷</Text>
            </View>
            <Text style={styles.navScanLabel}>Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('settings')}
            style={[styles.navTab, activeTab === 'settings' && styles.navTabActive]}
          >
            <Text style={[styles.navIcon, activeTab === 'settings' && styles.navTextActive]}>
              ⚙️
            </Text>
            <Text style={[styles.navLabel, activeTab === 'settings' && styles.navTextActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Global Barcode Scanner */}
      <BarcodeScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanned={(barcode) => {
          setActiveTab('inventory');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#777777',
  },
  screenWrapper: {
    flex: 1,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bottomNavPill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 360,
  },
  navTab: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  navTabActive: {
    backgroundColor: 'rgba(0, 87, 255, 0.08)',
  },
  navIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    color: '#777777',
    fontWeight: '400',
  },
  navTextActive: {
    color: '#0057FF',
    fontWeight: '500',
  },
  navScanTab: {
    alignItems: 'center',
    top: -10,
  },
  navScanCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0057FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  navScanIcon: {
    fontSize: 18,
  },
  navScanLabel: {
    fontSize: 9,
    color: '#0057FF',
    fontWeight: '500',
    marginTop: 2,
  },
});
