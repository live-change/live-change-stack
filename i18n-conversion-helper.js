#!/usr/bin/env node

/**
 * Vue.js i18n Conversion Helper Script
 * 
 * This script helps convert hardcoded texts in Vue.js files to use vue-i18n.
 * Usage: node i18n-conversion-helper.js [frontend-project-name]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common patterns to find hardcoded texts
const PATTERNS = {
  templateText: />([A-Z][a-zA-Z ,.!?'-]*[a-zA-Z])</,
  labelAttribute: /label="([A-Z][a-zA-Z ,.!?'-]*[a-zA-Z])"/g,
  toastSummary: /summary:\s*['"]([A-Z][a-zA-Z ,.!?'-]*[a-zA-Z])['"]/g,
  buttonText: /<Button[^>]*>([A-Z][a-zA-Z ,.!?'-]*[a-zA-Z])</,
  headings: /<h[1-6][^>]*>([A-Z][a-zA-Z ,.!?'-]*[a-zA-Z])</
};

// Common translation key categories
const CATEGORIES = {
  auth: ['sign', 'login', 'register', 'password', 'email', 'authentication'],
  actions: ['save', 'delete', 'edit', 'view', 'create', 'cancel', 'submit'],
  common: ['or', 'and', 'yes', 'no', 'ok', 'error', 'success'],
  nav: ['home', 'menu', 'back', 'next', 'previous'],
  forms: ['required', 'optional', 'validation', 'field'],
  messages: ['success', 'error', 'warning', 'info', 'notification']
};

class I18nConverter {
  constructor(frontendPath) {
    this.frontendPath = frontendPath;
    this.localesPath = path.join(frontendPath, 'front', 'locales');
    this.enJsonPath = path.join(this.localesPath, 'en.json');
    this.translations = {};
    this.loadExistingTranslations();
  }

  loadExistingTranslations() {
    try {
      if (fs.existsSync(this.enJsonPath)) {
        const content = fs.readFileSync(this.enJsonPath, 'utf8');
        this.translations = JSON.parse(content);
      }
    } catch (error) {
      console.log('Creating new translations file...');
      this.translations = {};
    }
  }

  // Find all Vue files in the frontend
  findVueFiles() {
    const srcPath = path.join(this.frontendPath, 'front', 'src');
    const vueFiles = [];
    
    function walkDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.vue')) {
          vueFiles.push(filePath);
        }
      }
    }
    
    walkDir(srcPath);
    return vueFiles;
  }

  // Analyze a Vue file for hardcoded texts
  analyzeVueFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];

    // Find template texts
    const templateTextMatches = content.match(/>([A-Z][a-zA-Z ,.!?'-]*[a-zA-Z])</g);
    if (templateTextMatches) {
      templateTextMatches.forEach(match => {
        const text = match.slice(1, -1); // Remove > and <
        findings.push({ type: 'template', text, original: match });
      });
    }

    // Find label attributes
    const labelMatches = [...content.matchAll(/label="([A-Z][a-zA-Z ,.!?'-]*[a-zA-Z])"/g)];
    labelMatches.forEach(match => {
      findings.push({ type: 'label', text: match[1], original: match[0] });
    });

    // Find toast messages
    const toastMatches = [...content.matchAll(/summary:\s*['"]([A-Z][a-zA-Z ,.!?'-]*[a-zA-Z])['"]/g)];
    toastMatches.forEach(match => {
      findings.push({ type: 'toast', text: match[1], original: match[0] });
    });

    return findings;
  }

  // Generate translation key from text
  generateKey(text, category = 'common') {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  // Categorize text based on content
  categorizeText(text) {
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'common';
  }

  // Check if file has useI18n import
  hasI18nImport(content) {
    return content.includes("import { useI18n } from 'vue-i18n'") || 
           content.includes('useI18n');
  }

  // Add useI18n import to Vue file
  addI18nImport(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (this.hasI18nImport(content)) {
      return; // Already has import
    }

    // Find script setup section
    const scriptSetupMatch = content.match(/<script setup>([\s\S]*?)<\/script>/);
    if (scriptSetupMatch) {
      const scriptContent = scriptSetupMatch[1];
      
      // Add import after existing imports or at the beginning
      const importMatch = scriptContent.match(/import.*from.*['"].*['"][;\n]/);
      if (importMatch) {
        // Add after last import
        const lastImportIndex = scriptContent.lastIndexOf('import');
        const nextLineIndex = scriptContent.indexOf('\n', lastImportIndex);
        const newScriptContent = 
          scriptContent.slice(0, nextLineIndex + 1) +
          "  import { useI18n } from 'vue-i18n'\n" +
          "  const { t } = useI18n()\n" +
          scriptContent.slice(nextLineIndex + 1);
        
        content = content.replace(scriptSetupMatch[1], newScriptContent);
      } else {
        // Add at the beginning of script
        const newScriptContent = 
          "\n  import { useI18n } from 'vue-i18n'\n" +
          "  const { t } = useI18n()\n" +
          scriptContent;
        
        content = content.replace(scriptSetupMatch[1], newScriptContent);
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`✓ Added useI18n import to ${path.basename(filePath)}`);
    }
  }

  // Generate analysis report
  generateReport() {
    console.log(`\n📊 I18n Conversion Analysis for ${path.basename(this.frontendPath)}\n`);
    
    const vueFiles = this.findVueFiles();
    console.log(`Found ${vueFiles.length} Vue files\n`);
    
    let totalFindings = 0;
    const reportData = {};

    vueFiles.forEach(filePath => {
      const findings = this.analyzeVueFile(filePath);
      if (findings.length > 0) {
        const relativePath = path.relative(this.frontendPath, filePath);
        reportData[relativePath] = findings;
        totalFindings += findings.length;
      }
    });

    console.log(`Total hardcoded texts found: ${totalFindings}\n`);
    
    // Group by category
    const categorized = {};
    Object.values(reportData).flat().forEach(finding => {
      const category = this.categorizeText(finding.text);
      if (!categorized[category]) categorized[category] = [];
      categorized[category].push(finding.text);
    });

    console.log('Texts by category:');
    Object.entries(categorized).forEach(([category, texts]) => {
      console.log(`  ${category}: ${texts.length} texts`);
    });

    return reportData;
  }

  // Save updated translations
  saveTranslations() {
    if (!fs.existsSync(this.localesPath)) {
      fs.mkdirSync(this.localesPath, { recursive: true });
    }
    
    fs.writeFileSync(
      this.enJsonPath, 
      JSON.stringify(this.translations, null, 2)
    );
    console.log(`✓ Saved translations to ${this.enJsonPath}`);
  }
}

// Main execution
function main() {
  const frontendName = process.argv[2];
  
  if (!frontendName) {
    console.log('Usage: node i18n-conversion-helper.js [frontend-project-name]');
    console.log('\nAvailable frontend projects:');
    
    const frontendDir = path.join(__dirname, 'frontend');
    const projects = fs.readdirSync(frontendDir)
      .filter(name => fs.statSync(path.join(frontendDir, name)).isDirectory())
      .filter(name => name.endsWith('-frontend'));
    
    projects.forEach(project => console.log(`  - ${project}`));
    return;
  }

  const frontendPath = path.join(__dirname, 'frontend', frontendName);
  
  if (!fs.existsSync(frontendPath)) {
    console.error(`❌ Frontend project not found: ${frontendName}`);
    return;
  }

  console.log(`🚀 Starting i18n analysis for ${frontendName}...`);
  
  const converter = new I18nConverter(frontendPath);
  const report = converter.generateReport();
  
  // Create sample translations structure
  const sampleTranslations = {
    actions: {
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      create: "Create",
      cancel: "Cancel"
    },
    common: {
      or: "OR",
      and: "AND",
      yes: "Yes",
      no: "No",
      error: "Error",
      success: "Success"
    },
    // Add more categories based on findings...
  };

  converter.translations = { ...converter.translations, ...sampleTranslations };
  converter.saveTranslations();
  
  console.log(`\n📋 Next steps for ${frontendName}:`);
  console.log('1. Review the generated en.json file');
  console.log('2. Add missing translation keys');
  console.log('3. Replace hardcoded texts with t() calls');
  console.log('4. Add useI18n imports to Vue files');
  console.log('\nExample replacements:');
  console.log('  >Save< → >{{ t("actions.save") }}<');
  console.log('  label="Edit" → :label="t("actions.edit")"');
  console.log('  summary: "Success" → summary: t("common.success")');
}

if (require.main === module) {
  main();
}

module.exports = { I18nConverter };