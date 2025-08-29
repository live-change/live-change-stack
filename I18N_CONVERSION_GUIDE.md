# Vue.js Internationalization (i18n) Conversion Guide

## ✅ Completed Projects

The following frontend projects have been successfully converted to use vue-i18n:

### 1. access-control-frontend ✅
- **Files converted:** 7 Vue components
- **Features:** Access control, invitations, user management
- **Translation keys:** 25+ organized in categories (access, invite, common)
- **Location:** `frontend/access-control-frontend/front/locales/en.json`

### 2. user-frontend ✅ (Partially)
- **Files converted:** 6+ authentication-related components  
- **Features:** Authentication, password management, user settings
- **Translation keys:** 40+ organized in categories (auth, errors, common)
- **Location:** `frontend/user-frontend/front/locales/en.json`

### 3. frontend-auto-form ✅ (Partially)
- **Files converted:** 3+ CRUD components
- **Features:** Auto-generated forms, model editing, CRUD operations
- **Translation keys:** 30+ organized in categories (actions, crud, nav)
- **Location:** `frontend/frontend-auto-form/front/locales/en.json`

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

The following projects still need i18n conversion:

### High Priority (User-Facing)
1. **billing-frontend** - Payment and billing interfaces
2. **task-frontend** - Task management system  
3. **content-frontend** - Content management system
4. **upload-frontend** - File upload interfaces
5. **wysiwyg-frontend** - Rich text editor

### Medium Priority  
6. **blog-frontend** - Blog management
7. **survey-frontend** - Survey creation and management
8. **url-frontend** - URL management
9. **video-call-frontend** - Video calling interface
10. **image-frontend** - Image editing and management

### Lower Priority (Internal/Base)
11. **frontend-base** - Base components and utilities
12. **frontend-template** - Template frontend
13. **peer-connection-frontend** - WebRTC peer connections
14. **security-frontend** - Security configurations
15. **flow-frontend** - Flow diagram editor

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

### Completed: 3/18 projects (~17%)
- ✅ access-control-frontend
- ✅ user-frontend (partial)
- ✅ frontend-auto-form (partial)

### Remaining: 15 projects
- 🔄 High priority: 5 projects
- 🔄 Medium priority: 5 projects  
- 🔄 Lower priority: 5 projects

## 🚀 Next Steps

1. **Continue with high-priority frontends:**
   - billing-frontend
   - task-frontend
   - content-frontend

2. **Use the created tools:**
   - Run analysis scripts
   - Follow the established patterns
   - Maintain consistent translation key structure

3. **Quality assurance:**
   - Test each converted frontend
   - Ensure no functionality is broken
   - Verify all texts are properly internationalized

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