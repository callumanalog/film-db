export const ADD_ROLL_METADATA_STORAGE_KEY = "filmDb.addRoll.metadata.v1";
export const ADD_ROLL_METADATA_SYNC_FLAG = "filmDb.addRoll.metadataSync.v1";

export const ADD_ROLL_FIELD_KEYS = [
  "camera",
  "location",
  "lens",
  "lab",
  "scanner",
  "iso",
  "format",
] as const;
export type AddRollFieldKey = (typeof ADD_ROLL_FIELD_KEYS)[number];

export type AddRollMetadataDraft = {
  camera: string;
  location: string;
  lens: string;
  lab: string;
  scanner: string;
  rollName: string;
  caption: string;
  selectedFormat: string;
  shotIso: string;
  /** Stock format options when opening the format field editor (from the modal at navigate time). */
  formatOptions: string[];
};

/** Map `/add-roll/field/[field]` segment to the session draft key. */
export function addRollRouteFieldDraftKey(field: AddRollFieldKey): keyof AddRollMetadataDraft {
  switch (field) {
    case "iso":
      return "shotIso";
    case "format":
      return "selectedFormat";
    default:
      return field as keyof AddRollMetadataDraft;
  }
}

export function isAddRollFieldKey(s: string): s is AddRollFieldKey {
  return (ADD_ROLL_FIELD_KEYS as readonly string[]).includes(s);
}

export function defaultAddRollMetadataDraft(): AddRollMetadataDraft {
  return {
    camera: "",
    location: "",
    lens: "",
    lab: "",
    scanner: "",
    rollName: "",
    caption: "",
    selectedFormat: "",
    shotIso: "",
    formatOptions: [],
  };
}

export function readAddRollMetadataDraft(): AddRollMetadataDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADD_ROLL_METADATA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AddRollMetadataDraft>;
    return { ...defaultAddRollMetadataDraft(), ...parsed };
  } catch {
    return null;
  }
}

export function writeAddRollMetadataDraftFull(draft: AddRollMetadataDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ADD_ROLL_METADATA_STORAGE_KEY, JSON.stringify(draft));
}

export function markAddRollMetadataSynced(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ADD_ROLL_METADATA_SYNC_FLAG, "1");
}
