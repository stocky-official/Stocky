'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BoxesIcon,
  WarehouseIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  ArrowUpRightIcon,
} from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';

export interface OrganizationOnboardingWidgetProps {
  userEmail?: string | null;
  onSuccess?: () => void;
}

/**
 * OrganizationOnboardingWidget (v0.1.0 Design System)
 * Multi-tenant onboarding step for submitting a company verification request:
 * - Company Name & Code
 * - Optional Logo upload to stocky-private bucket under the application id
 * - Initial branch request
 * - Owner membership is created only after Stocky admin approval
 */
export function OrganizationOnboardingWidget({
  userEmail,
  onSuccess,
}: OrganizationOnboardingWidgetProps) {
  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [branchName, setBranchName] = useState('Main Branch');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-suggest URL slug/code from name if user hasn't typed one
  const handleNameChange = (val: string) => {
    setOrgName(val);
    if (!codeManuallyEdited) {
      const suggested = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
      setOrgCode(suggested);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 5MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please upload a PNG, JPG, WebP, or SVG image.');
      return;
    }

    setErrorMsg(null);
    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setErrorMsg('Organization name is required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be signed in to create an organization.');
      }

      // The application id is used to keep each upload unique. The user's
      // auth id is the first storage path segment so the pending applicant can
      // upload before the application row exists.
      const applicationId = crypto.randomUUID();
      let uploadedLogoPath: string | null = null;

      // 2. Submit the application through a SECURITY DEFINER function. This
      // prevents a browser client from creating companies or memberships.
      const cleanCode = (orgCode.trim() || orgName.trim())
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 30);

      const reservedSlugs = ['platform', 'admin', 'auth', 'onboarding', 'verification-pending', 'api', 'app', '_next'];
      if (reservedSlugs.includes(cleanCode)) {
        throw new Error(`“${cleanCode}” is a reserved system route. Please choose a different workspace URL slug.`);
      }

      const initialBranchName = branchName.trim() || 'Main Branch';
      const { error: applicationError } = await supabase.rpc('submit_company_application', {
        application_id: applicationId,
        requested_company_name: orgName.trim(),
        requested_company_code: cleanCode,
        requested_logo_path: null,
        requested_initial_branch_name: initialBranchName,
      });

      if (applicationError) throw applicationError;

      // 3. Upload the optional logo under the authenticated applicant.
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop() || 'png';
        const logoStoragePath = `${user.id}/applications/${applicationId}/logo-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('stocky-private')
          .upload(logoStoragePath, logoFile, {
            contentType: logoFile.type,
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedLogoPath = logoStoragePath;

        const { error: logoPathError } = await supabase.rpc('set_company_application_logo', {
          p_application_id: applicationId,
          p_logo_path: uploadedLogoPath,
        });

        if (logoPathError) throw logoPathError;
      }

      setSuccessMsg('Application submitted. Stocky will review your company before access is enabled.');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      setErrorMsg(err.message || 'Failed to create organization. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto p-4 sm:p-6">
      <Card className="p-6 sm:p-8 bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget space-y-6">
        {/* Step Badge & Header */}
        <div className="border-b border-stocky-border-subtle pb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-stocky-primary uppercase tracking-wider bg-stocky-primary/10 px-2.5 py-0.5 rounded-widget border border-stocky-primary/20">
              Verification Request
            </span>
            {userEmail && (
              <span className="text-xs text-stocky-text-sub truncate max-w-[200px]">
                {userEmail}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-medium text-stocky-text-main tracking-tight">
            Submit Your Company
          </h1>
          <p className="text-xs sm:text-sm font-normal text-stocky-text-sub leading-relaxed">
            Tell us about your company. After Stocky verifies it, you will be able to manage branches, inventory, suppliers, and team members.
          </p>
        </div>

        {/* Form Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-widget bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
            <AlertCircleIcon size="xs" className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-widget bg-green-50 border border-green-200 text-green-700 flex items-center gap-2 text-xs">
            <CheckCircleIcon size="xs" className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Organization Name */}
          <div className="space-y-1.5">
            <label className="font-medium text-stocky-text-main block">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Acme Retail, Circle K, Metro Markets"
              className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2.5 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
            />
          </div>

          {/* Company Code & Initial Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium text-stocky-text-main block flex items-center justify-between">
                <span>Workspace URL Slug</span>
                <span className="text-[10px] text-stocky-text-sub font-mono font-normal">/{orgCode || 'company'}</span>
              </label>
              <input
                type="text"
                maxLength={30}
                value={orgCode}
                onChange={(e) => {
                  setCodeManuallyEdited(true);
                  setOrgCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                }}
                placeholder="e.g. appleco"
                className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2.5 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors font-mono lowercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-stocky-text-main block">
                Primary Branch / Store Name
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Downtown Central Branch"
                className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2.5 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
              />
            </div>
          </div>

          {/* Organization Logo Upload */}
          <div className="space-y-2">
            <label className="font-medium text-stocky-text-main block flex items-center justify-between">
                <span>Company Logo</span>
              <span className="text-[10px] text-stocky-text-sub font-normal">Optional • Max 5MB</span>
            </label>

            {logoPreview ? (
              <div className="flex items-center gap-3 p-3 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle">
                <div className="w-12 h-12 rounded-widget overflow-hidden border border-stocky-border-subtle bg-white flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-stocky-text-main block truncate">
                    {logoFile?.name}
                  </span>
                  <span className="text-[11px] text-stocky-text-sub block">
                    Saved to stocky-private / profile-imgs
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="w-7 h-7 rounded-widget hover:bg-stocky-bg-widget border border-stocky-border-subtle flex items-center justify-center text-stocky-text-sub hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove logo"
                >
                  <XIcon size="xs" />
                </button>
              </div>
            ) : (
              <label className="border border-dashed border-stocky-border-subtle hover:border-stocky-primary/60 rounded-widget p-5 flex flex-col items-center justify-center gap-2 bg-stocky-bg-global/50 hover:bg-stocky-bg-global transition-colors cursor-pointer text-center">
                <div className="w-8 h-8 rounded-full bg-stocky-bg-widget border border-stocky-border-subtle flex items-center justify-center text-stocky-text-sub">
                  <BoxesIcon size="xs" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-stocky-primary block">
                    Click to browse or drag and drop
                  </span>
                  <span className="text-[11px] text-stocky-text-sub block">
                    PNG, JPG, WebP, or SVG (square format recommended)
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-stocky-border-subtle flex items-center justify-end">
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={loading || !orgName.trim()}
              className="w-full sm:w-auto px-6 py-2 text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
                <span>{loading ? 'Submitting for Review...' : 'Submit for Verification'}</span>
              <ArrowUpRightIcon size="xs" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
