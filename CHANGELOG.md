# 📋 Changelog

All notable changes to the KeyLife Electronics BOM Consolidation Tool.

---

## [0.1.0-beta.2] - 2025-10-21

### 🐛 Bug Fixes

#### **Critical: Last Project Deletion Bug**
- **Fixed:** Deleting the last project now properly clears all data
- **Issue:** Previously, deleting the last project would leave orphaned data in localStorage (projectName, headers), causing the project to reload after page refresh
- **Solution:** 
  - `deleteProject()` now checks if it's the last project
  - Clears headers and projectName when no components remain
  - Calls `clearLocalStorage()` for complete cleanup
  - Modified save effect to only persist when components exist
  - Enhanced load effect to skip loading if no components found

**Affected Functions:**
```javascript
- deleteProject()      // Now clears everything when last project deleted
- deleteComponent()    // Now clears everything when last component deleted  
- clearLibrary()       // Enhanced with proper state cleanup
- Save useEffect       // Only saves when components exist
- Load useEffect       // Validates data before loading
```

**Testing:**
```
Test: Delete last project → Refresh page
Before: Components reload ❌
After: Page stays empty ✅
```

### 🎯 Related Improvements

#### **localStorage Management**
- Added validation before loading data
- Clear orphaned data on mount if no components
- Prevent saving empty states
- Better error handling for corrupted data

#### **State Consistency**
- Ensure headers match remaining components
- Rebuild headers after project deletion
- Proper cleanup in all deletion paths

### 📝 Files Changed
- `src/hooks/useBOMData.js`
  - Modified `deleteProject()`
  - Modified `deleteComponent()`
  - Modified `clearLibrary()`
  - Enhanced save `useEffect`
  - Enhanced load `useEffect`

---

## [0.1.0-beta.1] - 2024-10-21

### ✨ New Features

#### **Component Management**
- ✅ Inline editing of components in table
- ✅ Delete individual components
- ✅ Edit/Save/Cancel workflow
- ✅ Visual feedback for all actions

#### **Project Management**
- ✅ Project overview panel with statistics
- ✅ Visual project cards
- ✅ Quick project filtering
- ✅ Delete entire projects
- ✅ Confirmation dialogs for destructive actions

#### **Enhanced Data Management**
- ✅ Save library to specific location (File System Access API)
- ✅ Import previously saved libraries
- ✅ Smart merging of imported data
- ✅ Fallback for older browsers
- ✅ Better file naming with timestamps

#### **KiCad Integration** 🎉
- ✅ Parse KiCad schematic files (`.kicad_sch`)
- ✅ Dedicated upload section for schematics
- ✅ Component matching between BOM and schematic
- ✅ "Copy for KiCad" button with formatted output
- ✅ One-click clipboard copy
- ✅ Smart data filling from schematic
- ✅ localStorage persistence for schematic data
- ✅ Visual feedback with purple theme

### 🎨 UI Improvements
- ✅ Fixed alignment of Project Name and File Upload inputs
- ✅ Changed from `items-end` to `items-start`
- ✅ Purple theme for KiCad features
- ✅ Improved button layout (compact)
- ✅ Better visual hierarchy

### 📚 New Components
- `ProjectManager.jsx` - Project management panel
- `KiCadUploadSection.jsx` - KiCad schematic upload
- `ComponentActions.jsx` - Component edit/delete controls (unused in final implementation)

### 🔧 New Hooks
- `useKiCadParser.js` - KiCad schematic parser with component matching

### 📖 Documentation
- `FEATURES.md` - Complete feature documentation
- `QUICKSTART.md` - 5-minute getting started guide
- `TESTING.md` - Comprehensive testing guide
- `CHANGELOG.md` - This file

---

## [0.1.0-beta.0] - 2024-10-20

### 🎉 Initial Release

#### **Core Features**
- Multi-format BOM upload (CSV, XLS, XLSX)
- Component library consolidation
- Project-based organization
- Advanced search and filtering
- localStorage persistence
- Export to JSON
- Clear library functionality

#### **AI Features**
- Google Gemini integration
- AI-powered component alternative finder
- Formatted suggestions with specifications

#### **Technical**
- React 18
- Vite 7
- ExcelJS for file parsing (security fix from xlsx)
- Tailwind CSS
- Express server for production

#### **Branding**
- KeyLife Electronics theme
- Navy Life primary color
- Blue Life accent color
- Logo integration

---

## 📊 Version History Summary

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 0.1.0-beta.2 | 2024-10-21 | Bug Fix | Fixed last project deletion bug |
| 0.1.0-beta.1 | 2024-10-21 | Feature | Added management & KiCad features |
| 0.1.0-beta.0 | 2024-10-20 | Release | Initial beta release |

---

## 🔜 Upcoming

### Planned for v0.2.0
- [ ] Export to Excel
- [ ] Batch operations (multi-select)
- [ ] Component comparison view
- [ ] Advanced filtering (by value range, footprint, etc.)
- [ ] Custom field templates
- [ ] Undo/Redo functionality
- [ ] Keyboard shortcuts
- [ ] Dark/Light theme toggle

### Under Consideration
- [ ] Backend integration
- [ ] Multi-user support
- [ ] Cloud sync
- [ ] Component database integration
- [ ] Price tracking
- [ ] Stock availability checking
- [ ] Automated BOM validation

---

## 🐛 Known Issues

None currently identified.

### Previous Issues (Resolved)
- ✅ Last project deletion bug (v0.1.0-beta.2)
- ✅ UI alignment issue (v0.1.0-beta.1)
- ✅ XLSX vulnerability (v0.1.0-beta.0)

---

## 📝 Notes

### Breaking Changes
None in beta releases.

### Deprecations
None.

### Migration Required
- From v0.1.0-beta.0 to v0.1.0-beta.1: No migration needed
- From v0.1.0-beta.1 to v0.1.0-beta.2: No migration needed

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Older browsers: Limited (no File System Access API)

---

## 🙏 Credits

**Developer:** Amro K. Saleh  
**Organization:** KeyLife Electronics R&D Team  
**License:** ISC (Internal Tool)

---

**For questions or bug reports, contact the R&D Team.**