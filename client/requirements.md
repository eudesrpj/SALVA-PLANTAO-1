## Packages
recharts | Financial charts
framer-motion | Animations for page transitions and modals
date-fns | Date formatting
react-day-picker | Calendar component
lucide-react | Icons
clsx | Class merging
tailwind-merge | Class merging
@radix-ui/react-dialog | Modal primitives
@radix-ui/react-slot | Component composition
@radix-ui/react-tabs | Tab interfaces
@radix-ui/react-switch | Toggles for admin panel
@radix-ui/react-label | Form labels
@radix-ui/react-select | Dropdowns
@radix-ui/react-scroll-area | Custom scrollbars

## Notes
- Admin features assume `user.role === 'admin'` and `user.status` fields (mocked or real).
- Payment lock screen intercepts access for `user.status === 'pending'`.
- "Pix" payment flow is manual (show QR code/key, user contacts admin, admin approves).
- Prescriptions page includes rich filtering and "Favorites" (local or DB).
