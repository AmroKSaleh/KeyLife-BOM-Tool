# ⚡ Quick Start Guide

Get up and running with the KeyLife BOM Consolidation Tool in 5 minutes!

---

## 🎯 **What You'll Learn**
1. How to upload your first BOM
2. How to search and manage components
3. How to use KiCad integration
4. How to save and import data

---

## 📝 **Step 1: Upload Your First BOM** (2 minutes)

### A. Prepare Your BOM File
Make sure your BOM has:
- ✅ Header row with column names
- ✅ Component data in rows
- ✅ Supported format (`.csv`, `.xlsx`, or `.xls`)

### B. Upload Process
1. **Enter Project Name**
   ```
   Example: "Power Supply Board Rev A"
   ```

2. **Click "Choose a file"**
   - Navigate to your BOM file
   - Select and open

3. **Wait for Processing**
   - Processing bar appears
   - Success message shows component count

**✅ Success!** Your components are now in the library.

---

## 🔍 **Step 2: Search & Filter** (1 minute)

### Search Components
1. **Use Search Box**
   ```
   Type: "resistor" or "0805" or "10k"
   ```
   - Searches all fields instantly
   - Results update in real-time

2. **Filter by Project**
   - Click dropdown: "All Projects"
   - Select your project name
   - View only that project's components

3. **Clear Filters**
   - Click the X on filter tags
   - Or select "All Projects" again

---

## ✏️ **Step 3: Manage Components** (2 minutes)

### Edit a Component
1. Find component in table
2. Click **"Edit"** button
3. Modify any field
4. Click **"Save"** or **"Cancel"**

### Delete a Component
1. Click **"Delete"** button
2. Confirm deletion
3. Component removed

### Manage Projects
1. Scroll to **Project Management** panel
2. See all projects and component counts
3. Actions:
   - **View**: Filter to that project
   - **Delete**: Remove entire project

---

## 🔧 **Step 4: KiCad Integration** (3 minutes)

### Upload KiCad Schematic
1. **Ensure project name matches**
   ```
   BOM Project Name = KiCad Project Name
   ```

2. **Upload Schematic**
   - Scroll to "KiCad Schematic Integration"
   - Click "Upload KiCad Schematic"
   - Select `.kicad_sch` file
   - Wait for parsing

3. **Verify Upload**
   - Green success message appears
   - Shows component count
   - File name displayed

### Use KiCad Copy Feature
1. **Find Component**
   - Look in component table
   - Components from project with schematic

2. **Copy for KiCad**
   - Purple **"KiCad"** button appears
   - Click button
   - Button shows **"Done"** ✓
   - Data copied to clipboard

3. **Paste in KiCad**
   - Open KiCad schematic
   - Select component
   - Paste (Ctrl+V / Cmd+V)
   - Component properties filled

---

## 💾 **Step 5: Save Your Work** (1 minute)

### Save Library
1. **Click "Save Library"** button
2. **Modern Browsers:**
   - Choose save location
   - Name your file
   - Click Save

3. **Older Browsers:**
   - File downloads automatically
   - Check Downloads folder

**File saved as:** `keylife_bom_library_2024-10-21.json`

### Import Existing Library
1. Click **"Import Library"**
2. Select JSON file
3. Confirm merge
4. Data combined with current library

---

## 🤖 **Bonus: AI Component Alternatives** (1 minute)

### Find Alternative Parts
1. Click **"AI"** button next to any component
2. Wait for analysis (few seconds)
3. Review 3-4 alternative suggestions
4. See:
   - Manufacturer part numbers
   - Key specifications
   - Compatibility notes
   - Important differences

**Note:** Requires Gemini API key to be configured

---

## 🎓 **Common Workflows**

### Workflow 1: New Project Setup
```
1. Enter project name
2. Upload BOM file
3. Upload KiCad schematic
4. Verify component count
5. Save library
```

### Workflow 2: Daily Component Lookup
```
1. Open app (data loads automatically)
2. Search for component
3. Find alternatives (AI button)
4. Copy for KiCad if needed
```

### Workflow 3: Project Cleanup
```
1. Go to Project Management
2. Review old projects
3. Delete unused projects
4. Save updated library
```

### Workflow 4: Library Maintenance
```
1. Review components
2. Edit incorrect data
3. Delete duplicates
4. Add missing information
5. Save library
```

---

## 💡 **Pro Tips**

### Tip 1: Consistent Naming
```
✅ Good: "PowerSupply_Rev_A"
❌ Bad: "ps1", "new board", "test"
```

### Tip 2: Regular Saves
- Save library after major uploads
- Before deleting projects
- Before closing browser

### Tip 3: Project Organization
```
Format: "ProductName_BoardName_Revision"
Example: "SmartWatch_MainBoard_Rev_C"
```

### Tip 4: KiCad Matching
Ensure BOM designators match schematic references:
```
BOM: R1, R2, C1
KiCad: R1, R2, C1  ✅
```

### Tip 5: Search Shortcuts
- Part numbers: `"RC0805"`
- Values: `"10k"` or `"0.1uF"`
- Packages: `"0805"` or `"SOT-23"`
- Manufacturers: `"Yageo"` or `"Murata"`

---

## ⚠️ **Common Issues & Solutions**

### Issue: "Please enter a project name"
**Solution:** Fill in project name field before uploading

### Issue: No "KiCad" button appears
**Solution:** Upload schematic file first for that project

### Issue: AI button not working
**Solution:** Check if API key is configured in useGeminiAI.js

### Issue: Data not saving
**Solution:** Check browser localStorage settings (may be disabled)

### Issue: File won't upload
**Solution:** 
- Check file format (.csv, .xlsx, .xls, .kicad_sch)
- Ensure file has header row
- Try re-saving file from source application

---

## 📊 **Feature Quick Reference**

| Button | Location | Action |
|--------|----------|--------|
| Choose a file | Setup Section | Upload BOM |
| Upload KiCad Schematic | KiCad Section | Parse schematic |
| Search box | Above table | Search all fields |
| Filter dropdown | Above table | Filter by project |
| AI | Component row | Find alternatives |
| KiCad | Component row | Copy for KiCad |
| Edit | Component row | Edit component |
| Delete | Component row | Delete component |
| View | Project card | Filter to project |
| Delete | Project card | Delete project |
| Import Library | Below table | Import JSON |
| Save Library | Below table | Save JSON |
| Clear All | Below table | Clear all data |

---

## 🎯 **Next Steps**

Now that you're up and running:

1. **Explore Features**
   - Read FEATURES.md for complete guide
   - Try all buttons and features
   - Practice workflows

2. **Customize Setup**
   - Add Gemini API key for AI features
   - Organize existing BOMs by project
   - Upload KiCad schematics

3. **Daily Use**
   - Quick component lookups
   - Find alternatives
   - Manage library
   - Keep data organized

4. **Advanced Usage**
   - Multi-project management
   - Component standardization
   - Supply chain planning
   - Design reuse

---

## 📞 **Need Help?**

1. Check tooltips (hover over buttons)
2. Review error messages
3. Check browser console (F12)
4. Read FEATURES.md
5. Contact R&D Team

---

**🎉 Congratulations!** You're now ready to use the BOM Consolidation Tool!

**Time to productivity:** 5-10 minutes  
**Estimated learning curve:** 1 day for all features

---

**Version:** 0.1.0 Beta  
**Last Updated:** October 2025  
**Support:** KeyLife Electronics R&D Team