"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Trash2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserAccountIcon,
  AiBrowserIcon,
  Notification01Icon,
  AnonymousIcon,
  InboxDownloadIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newName, setNewName] = useState(profile?.full_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [contractAlerts, setContractAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Privacy
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  // Save display name
  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: newName.trim() })
        .eq("id", user?.id);

      if (error) throw error;
      await refreshProfile?.();
      setEditingName(false);
    } catch (err: any) {
      setError(err.message || "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  // Save password
  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setEditingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  // Section wrapper component
  const Section = ({
    title,
    description,
    children,
    icon,
    danger = false
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
    icon?: any;
    danger?: boolean;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 md:gap-12 py-4">
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          {icon && <HugeiconsIcon icon={icon} size={14} className={danger ? "text-red-400" : "text-muted-foreground"} />}
          <h2 className={cn(
            "text-sm font-medium",
            danger ? "text-red-400" : "text-foreground"
          )}>
            {title}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  // Form row component
  const FormRow = ({
    label,
    children,
    className
  }: {
    label?: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
      )}
      {children}
    </div>
  );

  // Toggle row component
  const ToggleRow = ({
    label,
    description,
    checked,
    onCheckedChange
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  return (
    <motion.div
      className="h-full bg-background overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-4xl px-6 py-4">
        {/* Profile Section */}
        <Section title="Profile" description="Set your account details" icon={UserAccountIcon}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormRow label="Display Name">
                  {editingName ? (
                    <div className="space-y-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter your name"
                        className="h-10 rounded-lg"
                        data-rounded="true"
                        autoFocus
                      />
                      {error && !editingPassword && (
                        <p className="text-xs text-red-400">{error}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={saving}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingName(false); setError(""); setNewName(profile?.full_name || ""); }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingName(true)}
                      className="w-full h-10 px-3 text-left text-sm border border-border bg-transparent hover:border-purple-500/50 transition-colors flex items-center justify-between group rounded-lg"
                    >
                      <span className="text-foreground">{profile?.full_name || "Not set"}</span>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                    </button>
                  )}
                </FormRow>

                <FormRow label="Email">
                  <div className="h-10 px-3 text-sm border border-border bg-muted/30 flex items-center text-muted-foreground rounded-lg">
                    {user?.email || "Not set"}
                  </div>
                </FormRow>
              </div>

              <FormRow label="Password">
                {editingPassword ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="h-10 rounded-lg"
                        data-rounded="true"
                        autoFocus
                      />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="h-10 rounded-lg"
                        data-rounded="true"
                      />
                    </div>
                    {error && editingPassword && (
                      <p className="text-xs text-red-400">{error}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePassword}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                        Update
                      </button>
                      <button
                        onClick={() => { setEditingPassword(false); setError(""); setNewPassword(""); setConfirmPassword(""); }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingPassword(true)}
                    className="w-full sm:w-1/2 h-10 px-3 text-left text-sm border border-border bg-transparent hover:border-purple-500/50 transition-colors flex items-center justify-between group rounded-lg"
                  >
                    <span className="text-muted-foreground">••••••••</span>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Change</span>
                  </button>
                )}
              </FormRow>
            </div>

          </div>
        </Section>

        {/* Appearance Section */}
        <Section title="Appearance" description="Customize how EasyTerms looks" icon={AiBrowserIcon}>
          <ToggleRow
            label="Dark Mode"
            description="Use dark theme throughout the app"
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </Section>

        {/* Notifications Section */}
        <Section title="Notifications" description="Manage your notification preferences" icon={Notification01Icon}>
          <ToggleRow
            label="Email Notifications"
            description="Receive important updates via email"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
          <ToggleRow
            label="Contract Alerts"
            description="Get notified about key dates and deadlines"
            checked={contractAlerts}
            onCheckedChange={setContractAlerts}
          />
          <ToggleRow
            label="Marketing Emails"
            description="Product updates, tips, and announcements"
            checked={marketingEmails}
            onCheckedChange={setMarketingEmails}
          />
        </Section>

        {/* Privacy Section */}
        <Section title="Privacy" description="Control your data and privacy settings" icon={AnonymousIcon}>
          <ToggleRow
            label="Analytics"
            description="Help improve EasyTerms by sharing anonymous usage data"
            checked={analyticsEnabled}
            onCheckedChange={setAnalyticsEnabled}
          />
        </Section>

        {/* Data Section */}
        <Section title="Data" description="Manage your contract data" icon={InboxDownloadIcon}>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Export All Data</p>
              <p className="text-xs text-muted-foreground">Download all your contracts and analysis</p>
            </div>
            <button className="px-4 py-2 text-xs font-semibold rounded-md border border-border hover:bg-muted transition-colors flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone" description="Irreversible account actions" danger>
          <div className="flex items-center justify-between py-2 px-4 rounded-lg border border-red-500/20 bg-red-500/5">
            <div>
              <p className="text-sm font-medium text-red-400">Delete Account</p>
              <p className="text-xs text-red-400/60">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 text-xs font-semibold rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </Section>

        {/* Version */}
        <div className="pt-8 pb-4">
          <p className="text-xs text-muted-foreground/50">EasyTerms v1.0.0</p>
        </div>
      </div>
    </motion.div>
  );
}
