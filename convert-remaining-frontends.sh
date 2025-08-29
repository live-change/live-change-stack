#!/bin/bash

# Script to help convert remaining frontend projects to use vue-i18n
# Run this from the workspace root

echo "🚀 Vue.js i18n Conversion Script for Live Change Stack"
echo "======================================================"

# List of remaining frontend projects to convert
FRONTENDS=(
    "billing-frontend"
    "blog-frontend" 
    "content-frontend"
    "flow-frontend"
    "image-frontend"
    "peer-connection-frontend"
    "security-frontend"
    "survey-frontend"
    "task-frontend"
    "upload-frontend"
    "url-frontend"
    "video-call-frontend"
    "wysiwyg-frontend"
    "frontend-base"
    "frontend-template"
)

# Function to create locales directory and en.json if they don't exist
create_locales_structure() {
    local frontend_path=$1
    local locales_dir="${frontend_path}/front/locales"
    local en_json="${locales_dir}/en.json"
    
    if [ ! -d "$locales_dir" ]; then
        echo "  📁 Creating locales directory..."
        mkdir -p "$locales_dir"
    fi
    
    if [ ! -f "$en_json" ]; then
        echo "  📝 Creating en.json file..."
        cat > "$en_json" << 'EOF'
{
  "actions": {
    "save": "Save",
    "edit": "Edit",
    "delete": "Delete",
    "view": "View",
    "create": "Create",
    "cancel": "Cancel",
    "submit": "Submit",
    "reset": "Reset",
    "close": "Close"
  },
  "common": {
    "or": "OR",
    "and": "AND",
    "yes": "Yes",
    "no": "No",
    "error": "Error",
    "success": "Success",
    "warning": "Warning",
    "info": "Info",
    "loading": "Loading...",
    "please": "Please",
    "required": "Required",
    "optional": "Optional"
  },
  "nav": {
    "home": "Home",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "menu": "Menu"
  }
}
EOF
    fi
}

# Function to find hardcoded texts in Vue files
find_hardcoded_texts() {
    local frontend_path=$1
    local src_path="${frontend_path}/front/src"
    
    if [ -d "$src_path" ]; then
        echo "  🔍 Scanning for hardcoded texts..."
        
        # Find template texts like >Text<
        echo "    Template texts:"
        grep -r ">[A-Z][a-zA-Z ,.!?'-]*<" "$src_path" --include="*.vue" | head -10 | sed 's/^/      /'
        
        # Find label attributes
        echo "    Label attributes:"
        grep -r 'label="[A-Z][a-zA-Z ,.!?'"'"'-]*"' "$src_path" --include="*.vue" | head -10 | sed 's/^/      /'
        
        # Find toast messages
        echo "    Toast messages:"
        grep -r "summary.*[\"'][A-Z]" "$src_path" --include="*.vue" | head -5 | sed 's/^/      /'
        
        echo ""
    fi
}

# Function to show conversion examples
show_conversion_examples() {
    echo "📝 Conversion Examples:"
    echo "======================"
    echo ""
    echo "1. Template Text:"
    echo "   Before: <div>Save Changes</div>"
    echo "   After:  <div>{{ t('actions.saveChanges') }}</div>"
    echo ""
    echo "2. Button Labels:"
    echo "   Before: <Button label=\"Edit\" icon=\"pi pi-edit\" />"
    echo "   After:  <Button :label=\"t('actions.edit')\" icon=\"pi pi-edit\" />"
    echo ""
    echo "3. Toast Messages:"
    echo "   Before: toast.add({ severity: 'success', summary: 'Saved successfully' })"
    echo "   After:  toast.add({ severity: 'success', summary: t('messages.savedSuccessfully') })"
    echo ""
    echo "4. Add useI18n import:"
    echo "   <script setup>"
    echo "     import { useI18n } from 'vue-i18n'"
    echo "     const { t } = useI18n()"
    echo "     // ... rest of script"
    echo "   </script>"
    echo ""
    echo "5. Interpolation:"
    echo "   Before: \`Delete \${item.name}\`"
    echo "   After:  t('actions.deleteItem', { name: item.name })"
    echo ""
}

# Main conversion process
convert_frontend() {
    local frontend_name=$1
    local frontend_path="frontend/${frontend_name}"
    
    echo "🎯 Converting: $frontend_name"
    echo "================================"
    
    if [ ! -d "$frontend_path" ]; then
        echo "  ❌ Directory not found: $frontend_path"
        return 1
    fi
    
    create_locales_structure "$frontend_path"
    find_hardcoded_texts "$frontend_path"
    
    echo "  ✅ Ready for manual conversion"
    echo ""
}

# Show usage information
show_usage() {
    echo "Usage: $0 [frontend-name|all|examples]"
    echo ""
    echo "Options:"
    echo "  frontend-name  Convert specific frontend (e.g., billing-frontend)"
    echo "  all           Analyze all remaining frontends"
    echo "  examples      Show conversion examples"
    echo ""
    echo "Available frontends:"
    for frontend in "${FRONTENDS[@]}"; do
        echo "  - $frontend"
    done
}

# Main script logic
main() {
    case "${1:-}" in
        "examples")
            show_conversion_examples
            ;;
        "all")
            echo "🔄 Analyzing all remaining frontends..."
            echo ""
            for frontend in "${FRONTENDS[@]}"; do
                convert_frontend "$frontend"
            done
            show_conversion_examples
            ;;
        "")
            show_usage
            ;;
        *)
            if [[ " ${FRONTENDS[@]} " =~ " $1 " ]]; then
                convert_frontend "$1"
                show_conversion_examples
            else
                echo "❌ Unknown frontend: $1"
                show_usage
                exit 1
            fi
            ;;
    esac
}

# Run the script
main "$@"