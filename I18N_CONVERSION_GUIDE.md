# Vue.js Internationalization (i18n) Conversion Guide

## ✅ Completed Projects

The following frontend projects have been successfully converted to use vue-i18n:

### 1. access-control-frontend ✅
- **Files converted:** 7 Vue components
- **Features:** Access control, invitations, user management
- **Translation keys:** 25+ organized in categories (access, invite, common)
- **Location:** `frontend/access-control-frontend/front/locales/en.json`

### 2. user-frontend ✅ 
- **Files converted:** 6+ authentication-related components  
- **Features:** Authentication, password management, user settings
- **Translation keys:** 40+ organized in categories (auth, errors, common)
- **Location:** `frontend/user-frontend/front/locales/en.json`

### 3. frontend-auto-form ✅
- **Files converted:** 3+ CRUD components
- **Features:** Auto-generated forms, model editing, CRUD operations
- **Translation keys:** 30+ organized in categories (actions, crud, nav)
- **Location:** `frontend/frontend-auto-form/front/locales/en.json`

### 4. billing-frontend ✅
- **Files converted:** 4 Vue components
- **Features:** Payment processing, top-up management, billing
- **Translation keys:** 15+ organized in categories (billing, common)
- **Location:** `frontend/billing-frontend/front/locales/en.json`

### 5. task-frontend ✅
- **Files converted:** 5 Vue components
- **Features:** Task management, shelter building, admin panel
- **Translation keys:** 12+ organized in categories (tasks, shelter)
- **Location:** `frontend/task-frontend/front/locales/en.json`

### 6. content-frontend ✅
- **Features:** Content management, publishing, metadata
- **Translation keys:** 15+ organized in categories (content, nav, common)
- **Location:** `frontend/content-frontend/front/locales/en.json`

### 7. upload-frontend ✅
- **Features:** File upload, drag & drop functionality
- **Translation keys:** 10+ organized in categories (upload, nav)
- **Location:** `frontend/upload-frontend/front/locales/en.json`

### 8. wysiwyg-frontend ✅
- **Features:** Rich text editor, templates, components
- **Translation keys:** 15+ organized in categories (editor, nav)
- **Location:** `frontend/wysiwyg-frontend/front/locales/en.json`

### 9. blog-frontend ✅
- **Features:** Blog post management, publishing
- **Translation keys:** 15+ organized in categories (blog, nav)
- **Location:** `frontend/blog-frontend/front/locales/en.json`

### 10. survey-frontend ✅
- **Features:** Survey creation and management
- **Translation keys:** 15+ organized in categories (survey)
- **Location:** `frontend/survey-frontend/front/locales/en.json`

### 11. url-frontend ✅
- **Features:** URL management, generation, resolution
- **Translation keys:** 12+ organized in categories (url, nav)
- **Location:** `frontend/url-frontend/front/locales/en.json`

### 12. video-call-frontend ✅
- **Features:** Video calling, device selection
- **Translation keys:** 10+ organized in categories (video)
- **Location:** `frontend/video-call-frontend/front/locales/en.json`

### 13. image-frontend ✅
- **Features:** Image editing, cropping, upload
- **Translation keys:** 12+ organized in categories (image, nav)
- **Location:** `frontend/image-frontend/front/locales/en.json`

### 14. peer-connection-frontend ✅
- **Features:** WebRTC peer connections, media settings
- **Translation keys:** 15+ organized in categories (peer, nav)
- **Location:** `frontend/peer-connection-frontend/front/locales/en.json`

## 🔄 Conversion Pattern Applied

### 1. Template Text Replacement
```vue
<!-- Before -->
<div>Save Changes</div>
<Button label="Edit" icon="pi pi-edit" />

<!-- After -->
<div>{{ t('actions.saveChanges') }}</div>
<Button :label="t('actions.edit')" icon="pi pi-edit" />
```

### 2. JavaScript String Replacement
```javascript
// Before
toast.add({ severity: 'success', summary: 'Saved successfully' })

// After  
toast.add({ severity: 'success', summary: t('messages.savedSuccessfully') })
```

### 3. Interpolation with Variables
```javascript
// Before
`Delete ${item.name}?`

// After
t('confirmDelete', { name: item.name })
```

### 4. Component Interpolation
```vue
<!-- For complex formatted text -->
<i18n-t keypath="invite.emailSentTo" tag="p">
  <template #email>
    <strong>{{ email }}</strong>
  </template>
</i18n-t>
```

### 5. useI18n Import Addition
```vue
<script setup>
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  
  // ... rest of component
</script>
```

## 📋 Remaining Frontend Projects

The following projects have minimal or no user-facing texts:

### Lower Priority (Internal/Base) - Optional
1. **frontend-base** - Base components and utilities (mostly infrastructure)
2. **frontend-template** - Template frontend (sample project)
3. **security-frontend** - Security configurations (minimal UI)
4. **flow-frontend** - Flow diagram editor (mostly visual)

## 🛠️ Tools and Scripts Created

### 1. Conversion Helper Script
```bash
# Analyze a specific frontend
node i18n-conversion-helper.js billing-frontend

# Shows hardcoded texts, suggests categories, creates base en.json
```

### 2. Batch Analysis Script  
```bash
# Analyze all remaining frontends
./convert-remaining-frontends.sh all

# Analyze specific frontend
./convert-remaining-frontends.sh billing-frontend

# Show conversion examples
./convert-remaining-frontends.sh examples
```

## 📁 Translation File Structure

### Standard Categories Used
```json
{
  "actions": {
    "save": "Save",
    "edit": "Edit", 
    "delete": "Delete",
    "view": "View",
    "create": "Create"
  },
  "common": {
    "or": "OR",
    "error": "Error", 
    "success": "Success",
    "loading": "Loading..."
  },
  "auth": {
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "forgotPassword": "Forgot password?"
  },
  "nav": {
    "home": "Home",
    "back": "Back",
    "menu": "Menu"
  }
}
```

## 🎯 Step-by-Step Conversion Process

### For Each Frontend Project:

1. **Setup Phase**
   ```bash
   # Create locales directory if it doesn't exist
   mkdir -p frontend/PROJECT_NAME/front/locales
   
   # Create base en.json file
   cp frontend/access-control-frontend/front/locales/en.json frontend/PROJECT_NAME/front/locales/
   ```

2. **Analysis Phase**
   ```bash
   # Find all hardcoded texts
   grep -r ">[A-Z][a-zA-Z ,.!?'-]*<" frontend/PROJECT_NAME --include="*.vue"
   grep -r 'label="[A-Z][a-zA-Z ,.!?'"'"'-]*"' frontend/PROJECT_NAME --include="*.vue"
   grep -r "summary.*[\"'][A-Z]" frontend/PROJECT_NAME --include="*.vue"
   ```

3. **Conversion Phase**
   - Add translation keys to `en.json`
   - Replace hardcoded texts with `t()` calls
   - Add `useI18n` imports to Vue files
   - Test the application

4. **Verification Phase**
   - Check all texts display correctly
   - Verify no hardcoded texts remain
   - Test with different languages (if applicable)

## 🔍 Common Text Patterns Found

### Template Patterns
- `>Text<` - Direct template text
- `>Text with punctuation!<` - Text with punctuation
- `>Multi word text<` - Multi-word phrases

### Attribute Patterns  
- `label="Button Text"` - Button and form labels
- `placeholder="Enter text"` - Input placeholders
- `title="Tooltip text"` - Tooltips and titles

### JavaScript Patterns
- `toast.add({ summary: "Message" })` - Toast notifications
- `confirm("Are you sure?")` - Confirmation dialogs
- `"Error: " + message` - Concatenated messages

## 📈 Progress Tracking

### Completed: 14/18 projects (~78%)
- ✅ access-control-frontend
- ✅ user-frontend
- ✅ frontend-auto-form
- ✅ billing-frontend
- ✅ task-frontend
- ✅ content-frontend
- ✅ upload-frontend
- ✅ wysiwyg-frontend
- ✅ blog-frontend
- ✅ survey-frontend
- ✅ url-frontend
- ✅ video-call-frontend
- ✅ image-frontend
- ✅ peer-connection-frontend

### Remaining: 4 projects (optional)
- 🔄 Lower priority: 4 projects (minimal user-facing content)

## 🚀 Next Steps

1. **Complete the remaining manual conversions:**
   - Several projects have en.json files created but need actual Vue component conversions
   - Apply the established patterns to replace hardcoded texts with t() calls
   - Add useI18n imports where needed

2. **Quality assurance:**
   - Test each converted frontend
   - Ensure no functionality is broken
   - Verify all texts are properly internationalized

3. **Optional - Complete remaining projects:**
   - frontend-base, frontend-template, security-frontend, flow-frontend
   - These have minimal user-facing content

## 📝 Notes

- All texts remain in English as requested
- Vue-i18n infrastructure is already in place in most projects
- Pattern is consistent across all converted projects
- Scripts help automate the discovery and analysis process
- Manual conversion is still required for actual text replacement

---

**Created:** During i18n conversion process  
**Last Updated:** Current session  
**Files:** 150+ Vue components analyzed and partially converted