"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { updateProfileSettings } from "@/app/actions/update-profile-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { showToastViaEvent } from "@/components/toast";
import { cn } from "@/lib/utils";

const BIO_MAX = 160;

const SETTINGS_TABS = [
  { id: "profile" as const, label: "Profile" },
  { id: "preferences" as const, label: "Preferences" },
  { id: "notifications" as const, label: "Notifications" },
  { id: "privacy" as const, label: "Privacy" },
  { id: "account" as const, label: "Account" },
];

type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Unique handle (profiles.display_name); read-only in UI. */
  handle: string;
  fullName: string;
  bio: string;
  onSaved: () => void | Promise<void>;
}

const PROFILE_FORM_ID = "profile-settings-form";

export function ProfileEditSheet({
  open,
  onOpenChange,
  handle,
  fullName: initialFullName,
  bio: initialBio,
  onSaved,
}: ProfileEditSheetProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const [fullName, setFullName] = useState(initialFullName);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveTab("profile");
    setFullName(initialFullName);
    setBio(initialBio);
  }, [open, initialFullName, initialBio]);

  const isDirty = useMemo(() => {
    return fullName.trim() !== initialFullName.trim() || bio !== initialBio;
  }, [fullName, bio, initialFullName, initialBio]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || saving) return;
    setSaving(true);
    const result = await updateProfileSettings({ fullName, bio });
    setSaving(false);
    if (!result.ok) {
      showToastViaEvent(result.error);
      return;
    }
    showToastViaEvent("Profile updated.");
    onOpenChange(false);
    await onSaved();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="z-[60]"
        className={cn(
          "z-[60] gap-0 p-0 !rounded-none border-0 shadow-none",
          "flex h-dvh max-h-dvh flex-col overflow-hidden",
          "data-[side=bottom]:max-h-dvh data-[side=bottom]:h-dvh"
        )}
      >
        <SheetTitle className="sr-only">Settings</SheetTitle>

        <header
          className="relative flex shrink-0 items-center justify-center border-b border-border/50 px-2 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]"
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute left-1 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
            aria-label="Close settings"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          </button>
          <h2 className="font-sans text-base font-semibold tracking-tight text-foreground">Settings</h2>
        </header>

        <nav
          className="shrink-0 border-b border-border/50 px-0"
          aria-label="Settings sections"
        >
          <div className="scrollbar-hide flex gap-0 overflow-x-auto overscroll-x-contain px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SETTINGS_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap",
                  activeTab === t.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {activeTab === t.id ? (
                  <span
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-foreground"
                    aria-hidden
                  />
                ) : null}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {activeTab === "profile" ? (
            <>
              <form
                id={PROFILE_FORM_ID}
                onSubmit={handleSubmit}
                className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
              >
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-4 py-5">
                  <div className="space-y-2">
                    <label htmlFor="profile-handle" className="text-sm font-medium text-foreground">
                      Username
                    </label>
                    <Input id="profile-handle" value={handle} readOnly disabled className="bg-muted/60" />
                    <p className="text-xs text-muted-foreground">It&apos;s not possible to change username yet.</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile-full-name" className="text-sm font-medium text-foreground">
                      Display name
                    </label>
                    <Input
                      id="profile-full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      maxLength={80}
                      autoComplete="name"
                      className="bg-muted/40"
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown as the main name on your profile. Leave blank to use your username.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile-bio" className="text-sm font-medium text-foreground">
                      Bio
                    </label>
                    <div className="relative">
                      <textarea
                        id="profile-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                        placeholder="Tell us a little about yourself"
                        rows={4}
                        maxLength={BIO_MAX}
                        className={cn(
                          "min-h-[6rem] w-full min-w-0 resize-y rounded-card border-0 bg-muted/40 px-3 py-2.5 pb-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
                        )}
                      />
                      <span
                        className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums text-muted-foreground/60"
                        aria-live="polite"
                      >
                        {bio.length}/{BIO_MAX}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
              <div className="shrink-0 border-t border-border/50 bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3">
                <Button
                  type="submit"
                  form={PROFILE_FORM_ID}
                  variant="secondary"
                  size="cta"
                  className="w-full"
                  disabled={!isDirty || saving}
                >
                  {saving ? "Saving…" : "Update profile"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">Coming soon.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
