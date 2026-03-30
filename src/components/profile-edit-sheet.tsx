"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  UserPen,
  SlidersHorizontal,
  Bell,
  Shield,
  CircleUser,
  type LucideIcon,
} from "lucide-react";
import {
  updateProfileSettings,
  uploadProfileAvatar,
  clearProfileAvatar,
} from "@/app/actions/update-profile-settings";
import { instagramUrlToFormValue } from "@/lib/profile-links";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { showToastViaEvent } from "@/components/toast";
import { useAuth } from "@/context/auth-context";
import { SITE_NAME } from "@/lib/site";
import { topLeftNavChevronIconClassName, topLeftNavIconTouchClassName } from "@/lib/top-left-nav-icon";
import { cn } from "@/lib/utils";
import Link from "next/link";

const BIO_MAX = 160;

type AccountScreen =
  | "menu"
  | "edit-profile"
  | "preferences"
  | "notifications"
  | "privacy"
  | "account";

type AccountMenuRowDef = {
  id: "edit-profile" | "preferences" | "notifications" | "privacy" | "account";
  label: string;
  icon: LucideIcon;
};

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Unique handle (profiles.display_name); read-only in UI. */
  handle: string;
  fullName: string;
  bio: string;
  avatarUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  onSaved: () => void | Promise<void>;
}

const PROFILE_FORM_ID = "profile-settings-form";

const MENU_ROWS: AccountMenuRowDef[] = [
  { id: "edit-profile", label: "Edit profile", icon: UserPen },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "account", label: "Account", icon: CircleUser },
];

function AccountMenuRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-h-[52px] items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60 md:hover:bg-muted/30"
    >
      <Icon className="h-6 w-6 shrink-0 text-foreground" strokeWidth={1.75} aria-hidden />
      <span className="min-w-0 flex-1 font-sans text-base font-normal text-foreground">{label}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/80" strokeWidth={2} aria-hidden />
    </button>
  );
}

export function ProfileEditSheet({
  open,
  onOpenChange,
  handle,
  fullName: initialFullName,
  bio: initialBio,
  avatarUrl: initialAvatarUrl,
  instagramUrl: initialInstagramUrl,
  websiteUrl: initialWebsiteUrl,
  onSaved,
}: ProfileEditSheetProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<AccountScreen>("menu");
  const [fullName, setFullName] = useState(initialFullName);
  const [bio, setBio] = useState(initialBio);
  const [instagram, setInstagram] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScreen("menu");
    setFullName(initialFullName);
    setBio(initialBio);
    setInstagram(instagramUrlToFormValue(initialInstagramUrl));
    setWebsiteUrl(initialWebsiteUrl?.trim() ?? "");
    setAvatarPreview(initialAvatarUrl);
  }, [open, initialFullName, initialBio, initialInstagramUrl, initialWebsiteUrl, initialAvatarUrl]);

  const isDirty = useMemo(() => {
    const igInitial = instagramUrlToFormValue(initialInstagramUrl);
    const webInitial = (initialWebsiteUrl ?? "").trim();
    return (
      fullName.trim() !== initialFullName.trim() ||
      bio !== initialBio ||
      instagram.trim() !== igInitial.trim() ||
      websiteUrl.trim() !== webInitial
    );
  }, [
    fullName,
    bio,
    instagram,
    websiteUrl,
    initialFullName,
    initialBio,
    initialInstagramUrl,
    initialWebsiteUrl,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || saving) return;
    setSaving(true);
    const result = await updateProfileSettings({ fullName, bio, instagram, websiteUrl });
    setSaving(false);
    if (!result.ok) {
      showToastViaEvent(result.error);
      return;
    }
    showToastViaEvent("Profile updated.");
    onOpenChange(false);
    await onSaved();
  }

  async function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarUploading(true);
    const fd = new FormData();
    fd.set("avatar", file);
    const result = await uploadProfileAvatar(fd);
    setAvatarUploading(false);
    if (!result.ok) {
      showToastViaEvent(result.error);
      return;
    }
    setAvatarPreview(result.publicUrl);
    showToastViaEvent("Profile photo updated.");
    await onSaved();
  }

  async function onRemoveAvatar() {
    setAvatarUploading(true);
    const result = await clearProfileAvatar();
    setAvatarUploading(false);
    if (!result.ok) {
      showToastViaEvent(result.error);
      return;
    }
    setAvatarPreview(null);
    showToastViaEvent("Profile photo removed.");
    await onSaved();
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      onOpenChange(false);
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  function handleMenuSelect(row: AccountMenuRowDef) {
    setScreen(row.id);
  }

  const headerTitle =
    screen === "menu"
      ? "Account"
      : screen === "edit-profile"
        ? "Edit profile"
        : screen === "preferences"
          ? "Preferences"
          : screen === "notifications"
            ? "Notifications"
            : screen === "privacy"
              ? "Privacy"
              : "Account";

  function headerBack() {
    if (screen === "menu") {
      onOpenChange(false);
    } else {
      setScreen("menu");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="z-[60]"
        className={cn(
          "z-[60] gap-0 p-0 !rounded-none border-0 shadow-none",
          "flex h-dvh max-h-dvh flex-col overflow-hidden bg-white dark:bg-background",
          "data-[side=bottom]:max-h-dvh data-[side=bottom]:h-dvh"
        )}
      >
        <SheetTitle className="sr-only">{headerTitle}</SheetTitle>

        <header
          className="relative flex shrink-0 items-center justify-center border-b border-border/60 px-2 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]"
        >
          <button
            type="button"
            onClick={headerBack}
            className={cn("absolute left-0 top-1/2 -translate-y-1/2", topLeftNavIconTouchClassName)}
            aria-label={screen === "menu" ? "Close account" : "Back"}
          >
            <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
          </button>
          <h2 className="font-sans text-base font-semibold tracking-tight text-foreground">{headerTitle}</h2>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {screen === "menu" ? (
            <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain" aria-label="Account">
              {MENU_ROWS.map((row) => (
                <AccountMenuRow
                  key={row.id}
                  icon={row.icon}
                  label={row.label}
                  onClick={() => handleMenuSelect(row)}
                />
              ))}
            </nav>
          ) : screen === "edit-profile" ? (
            <>
              <form
                id={PROFILE_FORM_ID}
                onSubmit={handleSubmit}
                className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
              >
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-4 py-5">
                  <div className="space-y-3">
                    <span className="text-sm font-medium text-foreground">Profile photo</span>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted/60">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt=""
                            width={72}
                            height={72}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">No photo</span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={onAvatarFile}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="default"
                          className="w-full sm:w-auto"
                          disabled={avatarUploading}
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          {avatarUploading ? "Working…" : avatarPreview ? "Change photo" : "Add photo"}
                        </Button>
                        {avatarPreview ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="default"
                            className="w-full sm:w-auto"
                            disabled={avatarUploading}
                            onClick={onRemoveAvatar}
                          >
                            Remove photo
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF. Up to 5MB.</p>
                  </div>
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
                  <div className="space-y-2">
                    <label htmlFor="profile-instagram" className="text-sm font-medium text-foreground">
                      Instagram
                    </label>
                    <Input
                      id="profile-instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@username or profile link"
                      autoComplete="off"
                      className="bg-muted/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile-website" className="text-sm font-medium text-foreground">
                      Website
                    </label>
                    <Input
                      id="profile-website"
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://your-site.com"
                      autoComplete="url"
                      className="bg-muted/40"
                    />
                  </div>
                </div>
              </form>
              <div className="shrink-0 border-t border-border/60 bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3">
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
          ) : screen === "account" ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain px-4 py-5">
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    More options
                  </h3>
                  <Link
                    href="/profile/settings"
                    onClick={() => onOpenChange(false)}
                    className="flex w-full min-h-[52px] items-center gap-3 rounded-md border border-border/60 px-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex-1 text-left text-sm font-medium text-foreground">
                      Password, policies &amp; support
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/80" />
                  </Link>
                </section>
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Session</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign out of {SITE_NAME} on this device. You can sign in again anytime.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="w-full"
                    disabled={signingOut}
                    onClick={handleSignOut}
                  >
                    {signingOut ? "Signing out…" : "Log out"}
                  </Button>
                </section>
              </div>
            </div>
          ) : screen === "privacy" ? (
            <div className="flex flex-1 flex-col px-4 py-8">
              <p className="text-sm text-muted-foreground">
                Read how we handle your data and privacy on {SITE_NAME}.
              </p>
              <Link
                href="/privacy"
                onClick={() => onOpenChange(false)}
                className={cn(buttonVariants({ variant: "secondary", size: "cta" }), "mt-6 w-full")}
              >
                Privacy policy
              </Link>
            </div>
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
