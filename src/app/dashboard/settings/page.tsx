"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ChevronRight, Moon, Sun, Bell, Shield, Download, Trash2, User, Mail, Key, Check, Loader2 } from "lucide-react";
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
  const [currentPassword, setCurrentPassword] = useState("");
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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Account Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {/* Display Name */}
            <div className="p-4">
              <button
                onClick={() => !editingName && setEditingName(true)}
                className={cn(
                  "w-full flex items-center gap-3 text-left transition-all duration-200",
                  editingName && "pointer-events-none"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200",
                  editingName ? "bg-purple-500/10" : "bg-muted"
                )}>
                  <User className={cn(
                    "w-4 h-4 transition-colors duration-200",
                    editingName ? "text-purple-500" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Display Name</p>
                  {!editingName && (
                    <p className="text-xs text-muted-foreground truncate">{profile?.full_name || "Not set"}</p>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: editingName ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: editingName ? "auto" : 0,
                  opacity: editingName ? 1 : 0
                }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-9 text-sm !rounded-none"
                    autoFocus={editingName}
                  />
                  {error && !editingPassword && <p className="text-xs text-red-400">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setError(""); setNewName(profile?.full_name || ""); }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Email (read-only) */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "Not set"}</p>
              </div>
            </div>

            {/* Password */}
            <div className="p-4">
              <button
                onClick={() => !editingPassword && setEditingPassword(true)}
                className={cn(
                  "w-full flex items-center gap-3 text-left transition-all duration-200",
                  editingPassword && "pointer-events-none"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200",
                  editingPassword ? "bg-purple-500/10" : "bg-muted"
                )}>
                  <Key className={cn(
                    "w-4 h-4 transition-colors duration-200",
                    editingPassword ? "text-purple-500" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {editingPassword ? "Change Password" : "Password"}
                  </p>
                  {!editingPassword && (
                    <p className="text-xs text-muted-foreground">••••••••</p>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: editingPassword ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: editingPassword ? "auto" : 0,
                  opacity: editingPassword ? 1 : 0
                }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="h-9 text-sm !rounded-none"
                    autoFocus={editingPassword}
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="h-9 text-sm !rounded-none"
                  />
                  {error && editingPassword && <p className="text-xs text-red-400">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePassword}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Update Password
                    </button>
                    <button
                      onClick={() => { setEditingPassword(false); setError(""); setNewPassword(""); setConfirmPassword(""); }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Appearance</h2>
          <div className="rounded-xl border border-border bg-card">
            <div className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Sun className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Use dark theme</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notifications</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Bell className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Bell className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Contract Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified about key dates</p>
              </div>
              <Switch checked={contractAlerts} onCheckedChange={setContractAlerts} />
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Marketing Emails</p>
                <p className="text-xs text-muted-foreground">Product updates and tips</p>
              </div>
              <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Privacy</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Analytics</p>
                <p className="text-xs text-muted-foreground">Help improve EasyTerms</p>
              </div>
              <Switch checked={analyticsEnabled} onCheckedChange={setAnalyticsEnabled} />
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Data</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Download className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Export Data</p>
                <p className="text-xs text-muted-foreground">Download all your contracts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Danger Zone</h2>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5">
            <button className="w-full p-4 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Delete Account</p>
                <p className="text-xs text-red-400/60">Permanently delete your account and data</p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Version */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground/50">EasyTerms v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
