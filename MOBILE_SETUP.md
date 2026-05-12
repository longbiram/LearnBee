# LearnBee Mobile - React Native Setup Guide

This guide provides the necessary technical configuration and a **Master AI Prompt** to build the **LearnBee Mobile** app (Teacher & Student versions) using React Native Expo.

---

## 🚀 Master AI Agent Prompt
*Copy and paste this into an AI Agent (like Antigravity or Cursor) to initialize the mobile project.*

```markdown
Act as a Senior React Native Developer. Build the "LearnBee Mobile" app using **Expo (SDK 52+)**, **TypeScript**, and **NativeWind (Tailwind CSS)**.

### 1. Project Context
LearnBee ERP is a SaaS platform for schools. The mobile app serves two roles: Students and Teachers.
- **Backend**: Supabase (Postgres + Edge Functions).
- **API Strategy**: Strictly use `supabase.functions.invoke('mobile-api', { body: { method, payload } })` for data. Direct DB queries are prohibited.
- **Design**: "Dark Premium SaaS" aesthetic. Use deep blacks (`#050505`), neon green accents (`#00FF88`), and glassmorphism.

### 2. Core Technical Setup
- **Supabase Client**: Initialize with `AsyncStorage` for session persistence.
- **Navigation**: Use **Expo Router** (Tab-based for main dashboards).
- **State Management**: Use `React Query` (TanStack Query) for API calls.

### 3. Implementation Roadmap
1. **Auth Module**: 
   - Login screen (Email/Password).
   - "Claim Account" for Students: Verify `admission_number` + `date_of_birth` against `erp_students`, then allow them to create an auth account linked to their profile.
2. **Subscription Gating (CRITICAL)**:
   - If `mobile-api` returns a **403 status** with `subscription_blocked: true`, the app MUST show a full-screen blocking modal: "School Subscription Expired. Please contact administrator."
3. **Student Dashboard**: 
   - Display `profile`, `attendance` stats (last 30 days), `upcoming exams`, and `recent notices`.
   - Data Source: `mobile-api` method `getStudentDashboard`.
4. **Teacher Dashboard**: 
   - Display schedule/routine summary.
   - Data Source: `mobile-api` method `getTeacherMobileDashboard`.
5. **Push Notifications**: 
   - Integrate `expo-notifications`.
   - Register tokens using `mobile-api` method `registerDevice`.

### 5. API Response Shapes
#### `getStudentDashboard` (200 OK)
```json
{
  "profile": { "id": "...", "first_name": "...", "erp_classes": { "name": "Class 10A" } },
  "attendance": [...],
  "exams": [...],
  "notices": [...],
  "subscription": { "plan": "pro", "expires_at": "..." }
}
```
#### Blocked Response (403 Forbidden)
```json
{
  "subscription_blocked": true,
  "message": "School subscription is inactive..."
}
```

### 4. Credentials (Local Dev)
- **Supabase URL**: https://ensxqeamigwifsoicdam.supabase.co
- **Anon Key**: (Get from .env or VITE_SUPABASE_ANON_KEY)
```

---

## 🛠️ Prerequisites
- Node.js & npm
- Expo CLI (`npx expo install`)
- A physical device with **Expo Go** or an Emulator.

## 📦 Key Dependencies
```bash
npx expo install expo-router react-native-safe-area-context react-native-screens @supabase/supabase-js @react-native-async-storage/async-storage @tanstack/react-query lucide-react-native nativewind tailwindcss
```

## 🔐 Supabase Client (`src/lib/supabase.ts`)
```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ensxqeamigwifsoicdam.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY'; // Replace with actual VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## 📱 Backend Integration (Edge Functions)
The mobile app communicates primarily with the `mobile-api` Edge Function.

#### Dashboard Fetch Hook Example:
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useStudentDashboard() {
  return useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('mobile-api', {
        body: { method: 'getStudentDashboard' }
      });
      if (error) throw error;
      return data;
    },
  });
}
```

## 🏗️ Folder Structure (Recommended)
```text
learnbee-mobile/
├── app/                  # Expo Router directory (screens/tabs)
│   ├── (auth)/           # Login, Claim Account
│   ├── (student)/        # Student Tabs (Home, Attendance, Exams)
│   └── (teacher)/        # Teacher Tabs (Home, Marking, Schedule)
├── src/
│   ├── components/       # Reusable UI (Cards, Buttons, Glassmorphic containers)
│   ├── hooks/            # useAuth, useStudentDashboard, etc.
│   ├── lib/              # supabase.ts, queryClient.ts
│   └── types/            # Database and API types
├── tailwind.config.js
└── app.json
```

## 🚧 Critical Implementation Details

### 1. Student Account Linking
Students exist in `erp_students` but don't have login credentials by default. 
- **The Flow**: Student enters Admission No + DOB -> App calls `mobile-api` to verify -> If valid, App calls `supabase.auth.signUp` -> Upon success, App calls a backend method to update `erp_students.profile_id` with the new `auth.uid()`.

### 2. Geofenced Attendance (Teachers)
The `schools` table contains `latitude`, `longitude`, and `radius`. Use `expo-location` to ensure teachers are within the school boundary before allowing them to "Check-in".

### 3. Visual Aesthetic
- Use `NativeWind` for styling.
- **Background**: `bg-[#050505]`
- **Cards**: `bg-white/5 border border-white/10 backdrop-blur-md`
- **Primary**: `text-[#00FF88]` (Neon Green)

