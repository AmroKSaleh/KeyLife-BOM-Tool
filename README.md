# 🔧 KeyLife Electronics - BOM Consolidation Tool

[![Version](https://img.shields.io/badge/version-0.1.0--beta-blue.svg)](https://github.com/yourusername/bom-tool)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A modern, AI-powered Bill of Materials (BOM) consolidation tool for managing and searching electronic component libraries across multiple projects.

![KeyLife BOM Tool](docs/screenshot.png)

## 🌟 Features

- **📊 Multi-Format Support**: Import BOMs from CSV, XLS, and XLSX files
- **🔍 Advanced Search & Filtering**: Quickly find components across all projects
- **🤖 AI-Powered Alternatives**: Find component substitutes using Google Gemini AI
- **💾 Local Persistence**: Data cached in browser localStorage
- **📦 Project Organization**: Tag and organize components by project
- **📤 Export Functionality**: Export consolidated library as JSON
- **🎨 Modern UI**: Clean, responsive interface with KeyLife branding
- **⚡ Fast & Efficient**: Built with React 18 and Vite for optimal performance

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bom-consolidation-tool.git
cd bom-consolidation-tool

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Gemini API key to .env
# Edit .env and add: VITE_GEMINI_API_KEY=your_key_here
```

### Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Server will run at http://localhost:3000
```

## 📖 Usage Guide

### 1. Upload BOM Files

1. Enter a project name (e.g., "Project Phoenix")
2. Click "Choose a file" and select your BOM file
3. Supported formats: `.csv`, `.xlsx`, `.xls`
4. Components are automatically added to the library

### 2. Search & Filter

- **Search Box**: Search across all component fields
- **Project Filter**: Filter by specific project
- **Active Tags**: View and clear active filters

### 3. Find Alternatives

1. Click "Find Alternatives" button for any component
2. AI analyzes the component specifications
3. View suggested alternatives with compatibility notes

### 4. Export Data

- Click "Export Library" to download all data as JSON
- Includes metadata (version, export date, component count)

### 5. Clear Library

- Click "Clear Library" to remove all data
- Confirmation required to prevent accidental deletion

## 🏗️ Project Structure

```
bom-consolidation-tool/
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── src/img/
│       ├── keylife-logo-white.png
│       ├── keylife-logo-black.png
│       └── keylife-logo-colored.png
├── src/
│   ├── components/
│   │   ├── AiModal.jsx          # AI suggestions modal
│   │   ├── DataTable.jsx         # Component data table
│   │   └── SetupSection.jsx      # File upload interface
│   ├── hooks/
│   │   ├── useBOMData.js         # BOM data management
│   │   └── useGeminiAI.js        # AI integration
│   ├── App.jsx                   # Main application
│   └── main.jsx                  # Entry point
├── index.html                    # HTML template
├── vite.config.js               # Vite configuration
├── server.js                    # Express production server
├── package.json                 # Dependencies
└── .env.example                 # Environment template
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Required
VITE_GEMINI_API_KEY=your_api_key_here

# Optional
PORT=3000
HOST=localhost
NODE_ENV=development
```

### Brand Colors

Customize colors in `index.html`:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'keylife-primary': '#00254a',  // Navy Life
        'keylife-accent': '#49a4ad',   // Blue Life
      }
    }
  }
}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] CSV file upload
- [ ] Excel file upload (.xlsx, .xls)
- [ ] Project name validation
- [ ] Search functionality
- [ ] Project filtering
- [ ] AI alternatives (requires API key)
- [ ] Export to JSON
- [ ] Clear library
- [ ] Data persistence

### Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 🤝 Contributing

This is an internal R&D tool for KeyLife Electronics. For contributions:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 🐛 Known Issues

- **localStorage Limit**: Browser storage limited to ~5-10MB
- **Large Files**: Performance may degrade with >1000 components
- **AI Rate Limits**: Gemini API has usage quotas

## 📝 Changelog

### v0.1.0-beta (Current)
- Initial release
- Multi-format BOM import
- AI-powered alternative finder
- Local storage persistence
- Search and filtering
- Export functionality

## 🔒 Security

- **API Keys**: Never commit `.env` file
- **Data Privacy**: All data stored locally in browser
- **No Backend**: No server-side data storage

## 📄 License

ISC License - KeyLife Electronics Internal Tool

## 👨‍💻 Author

**Amro K. Saleh**  
Hardware Engineer, R&D Team  
KeyLife Electronics

---

## 🆘 Support

For issues or questions:
1. Check this README
2. Review code comments
3. Contact the R&D team

## 🚀 Future Roadmap

- [ ] TypeScript migration
- [ ] Unit testing
- [ ] Batch operations
- [ ] Advanced filtering
- [ ] Component comparison
- [ ] Excel export
- [ ] Backend integration (optional)
- [ ] Multi-user support

---

**By Amro K Saleh**
**Built with ❤️ for KeyLife Electronics R&D Team**