import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  users,
  notes,
  shifts,
  prescriptions,
  checklists,
  libraryCategories,
  libraryItems,
  handovers,
  goals,
} from "./schema";

// User types
export type User = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

// Note types
export type Note = InferSelectModel<typeof notes>;
export type NoteInput = InferInsertModel<typeof notes>;

// Shift types
export type Shift = InferSelectModel<typeof shifts>;
export type ShiftInput = InferInsertModel<typeof shifts>;

// Prescription types
export type Prescription = InferSelectModel<typeof prescriptions>;
export type PrescriptionInput = InferInsertModel<typeof prescriptions>;

// Checklist types
export type Checklist = InferSelectModel<typeof checklists>;
export type ChecklistInput = InferInsertModel<typeof checklists>;

// Library types
export type LibraryCategory = InferSelectModel<typeof libraryCategories>;
export type LibraryCategoryInput = InferInsertModel<typeof libraryCategories>;

export type LibraryItem = InferSelectModel<typeof libraryItems>;
export type LibraryItemInput = InferInsertModel<typeof libraryItems>;

// Handover types
export type Handover = InferSelectModel<typeof handovers>;
export type HandoverInput = InferInsertModel<typeof handovers>;

// Goal types
export type Goal = InferSelectModel<typeof goals>;
export type GoalInput = InferInsertModel<typeof goals>;
