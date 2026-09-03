import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { Company, CompanyUserRole, CompanyUser } from '@stocky/types';

interface SettingsScreenProps {
  company: Company | null;
  userEmail?: string | null;
  userRole?: CompanyUserRole;
  onSignOut: () => void;
}

export function SettingsScreen({
  company,
  userEmail,
  userRole = 'owner',
  onSignOut,
}: SettingsScreenProps) {
  const [teamMembers, setTeamMembers] = useState<CompanyUser[]>([]);

  useEffect(() => {
    async function loadTeam() {
      if (company?.id) {
        const { data } = await supabase
          .from('company_users')
          .select('*')
          .eq('company_id', company.id)
          .order('role');

        if (data) {
          setTeamMembers(
            data.map((u: any) => ({
              id: u.id,
              companyId: u.company_id,
              authUserId: u.auth_user_id,
              email: u.email,
              fullName: u.full_name,
              avatarUrl: u.avatar_url,
              role: u.role,
              canEdit: u.can_edit,
              canDelete: u.can_delete,
              status: u.status,
              createdAt: u.created_at,
              updatedAt: u.updated_at,
            }))
          );
        }
      }
    }
    loadTeam();
  }, [company?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Organization Entity */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Organization Profile</Text>

          <View style={styles.orgRow}>
            {company?.logoUrl && (
              <Image source={{ uri: company.logoUrl }} style={styles.logo} resizeMode="contain" />
            )}
            <View>
              <Text style={styles.orgName}>{company?.name || 'Stocky Organization'}</Text>
              <Text style={styles.subText}>Code: {company?.code || 'CRK'} • Active</Text>
            </View>
          </View>
        </View>

        {/* Current Session */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Active User Session</Text>
          <Text style={styles.userEmail}>{userEmail || 'stocky.admin@gmail.com'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                Role: {userRole === 'owner' ? 'Owner' : userRole === 'admin' ? 'Admin' : userRole === 'manager' ? 'Branch Manager' : 'Staff'}
              </Text>
            </View>
            <View style={styles.tenantBadge}>
              <Text style={styles.tenantText}>
                Tenant: {company?.name || 'Circle K'}
              </Text>
            </View>
          </View>
        </View>

        {/* Team Members */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>
            Team & Authorizations ({teamMembers.length})
          </Text>

          {teamMembers.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.fullName || m.email}</Text>
                <Text style={styles.memberEmail}>{m.email}</Text>
              </View>
              <View style={styles.memberRoleBadge}>
                <Text style={styles.memberRoleText}>
                  {m.role === 'owner' ? 'Owner' : m.role === 'admin' ? 'Admin' : m.role === 'manager' ? 'Manager' : 'Staff'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity activeOpacity={0.8} onPress={onSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out of Mobile App</Text>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    paddingBottom: 8,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  orgName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  subText: {
    fontSize: 11,
    color: '#777777',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(0, 87, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 87, 255, 0.2)',
  },
  roleText: {
    color: '#0057FF',
    fontSize: 10,
    fontWeight: '500',
  },
  tenantBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tenantText: {
    color: '#065F46',
    fontSize: 10,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F9F9F9',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  memberEmail: {
    fontSize: 10,
    color: '#777777',
    marginTop: 2,
  },
  memberRoleBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberRoleText: {
    fontSize: 10,
    color: '#555555',
  },
  signOutBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
  },
});
