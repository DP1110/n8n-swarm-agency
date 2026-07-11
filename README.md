# n8n Swarm Agency 🤖

A modern web application that orchestrates collaborative AI agents through n8n workflows to complete complex tasks intelligently and efficiently.

## Overview

**n8n Swarm Agency** is a full-stack application that enables seamless communication between a responsive web interface and autonomous AI agents coordinated through n8n. Submit objectives and watch as a swarm of specialized agents collaboratively solve problems, gather information, and deliver comprehensive results.

## ✨ Key Features

- **Agent Swarm Orchestration** — Multiple AI agents work together through coordinated n8n workflows
- **Real-time Task Processing** — Live status updates with step-by-step progress visualization
- **Markdown Support** — Rich text rendering with code blocks, tables, blockquotes, and formatting
- **Task History** — Automatic local storage of recent queries with execution metadata
- **Responsive Design** — Modern, mobile-first UI with smooth animations and accessibility
- **Rate Limiting Handling** — Graceful error handling for API rate limits
- **Character Limit Management** — Built-in input validation (2,000 character limit)
- **Performance Tracking** — Execution time and word count metrics for every response

## 🏗️ Project Structure

```
n8n-swarm-agency/
├── index.html                 # Main web interface with semantic HTML
├── style.css                  # Responsive styling with CSS animations
├── app.js                     # Client-side application logic
├── server.js                  # Node.js server setup
├── n8n_7_agent_swarm.json     # n8n workflow configuration file
├── test_swarm.js              # Testing utilities
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14+ recommended)
- **n8n** cloud account or self-hosted instance
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dipmane123/n8n-swarm-agency.git
   cd n8n-swarm-agency
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure webhook URL**
   
   Update the `WEBHOOK_URL` in `app.js` to match your n8n webhook endpoint:
   ```javascript
   const WEBHOOK_URL = 'https://your-instance.app.n8n.cloud/webhook/ai-swarm-agency';
   ```

4. **Start the server**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

5. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## 📖 Usage

### Submitting Tasks

1. Enter your objective in the textarea (up to 2,000 characters)
2. Click **"Submit"** or press **Ctrl+Enter** (Cmd+Enter on Mac)
3. Watch the progress indicators as agents process your request
4. Review the results with formatting and metadata

### Viewing History

- Recent tasks appear in the **History** section
- Click any history item to reload and reuse that task
- Clear all history with the **Clear History** button

### Interpreting Results

Each result displays:
- **Execution Time** — How long agents took to complete the task
- **Word Count** — Total output length for reference
- **Rich Formatting** — Markdown rendered as styled HTML

## 🔧 Configuration

### Core Settings (`app.js`)

| Setting | Default | Purpose |
|---------|---------|---------|
| `WEBHOOK_URL` | `https://dipmane.app.n8n.cloud/webhook/...` | n8n webhook endpoint |
| `MAX_CHARS` | `2000` | Maximum input length |
| `MAX_HISTORY` | `10` | Recent tasks stored locally |
| `HISTORY_KEY` | `swarm_history` | localStorage key |

### Customizing Timeouts & Delays

Edit the timeout values in `animateSteps()` (line 386-406) to adjust step animation timing:

```javascript
// Default: 800ms for step transitions
setTimeout(() => { ... }, 800);  // Step 1→2
setTimeout(() => { ... }, 2500); // Step 2→3
```

## 🔌 n8n Integration

### Webhook Configuration

The application sends POST requests with the following payload:

```json
{
  "objective": "Your task description here"
}
```

### Response Format

n8n should return one of these formats:

```json
{
  "report": {
    "raw_markdown": "# Result\n\nYour markdown content..."
  }
}
```

Or with sections:

```json
{
  "report": {
    "title": "Report Title",
    "sections": [
      { "title": "Section 1", "body": "Content here..." },
      { "title": "Section 2", "body": "Content here..." }
    ]
  }
}
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Or execute test cases directly:

```bash
node test_swarm.js
```

## 📝 API Reference

### Core Functions

#### `submitTask()`
Sends the user's objective to the swarm via webhook and handles the response pipeline.

#### `renderMarkdown(text)`
Converts markdown text to styled HTML with support for:
- Headers (h1–h4)
- Code blocks with language highlighting
- Tables with alignment
- Lists (ordered & unordered)
- Bold, italic, and inline code
- Links and blockquotes

#### `extractOutput(data)`
Intelligently extracts content from various n8n response formats with multiple fallback strategies.

#### `copyResult()`
Copies the raw result text to the user's clipboard with fallback support for older browsers.

## 🎨 UI/UX Highlights

- **Smooth Animations** — CSS transitions for state changes and notifications
- **Loading States** — Visual progress indicators during processing
- **Error Handling** — User-friendly error messages with recovery suggestions
- **Toast Notifications** — Non-intrusive feedback for user actions
- **Responsive Layout** — Adapts seamlessly from mobile to desktop
- **Accessibility** — Semantic HTML and keyboard navigation support

## 🛠️ Troubleshooting

### "API Rate Limit" Error
The n8n instance is receiving too many requests. Wait 60 seconds before retrying.

### Empty Response
The swarm agents may be temporarily unavailable. Verify:
- n8n webhook is accessible
- Workflow is active and not in error state
- Network connection is stable

### History Not Saving
localStorage may be disabled or full. Check:
- Browser privacy settings allow localStorage
- Available storage space (typically 5–10MB)
- Browser console for quota exceeded errors

### Button/UI Not Responding
Clear browser cache and reload. Some older versions may have conflicts.

## 📦 Dependencies

- **Node.js built-ins** — Express, fs, path
- **Frontend** — Vanilla JavaScript (no frameworks)
- **Styling** — Pure CSS3 with animations

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📄 License

This project is open source. Please see the LICENSE file for details.

## 👤 Author

**dipmane123** — [GitHub Profile](https://github.com/dipmane123)

## 🙋 Support & Questions

For issues, feature requests, or questions:
- Open an [Issue](https://github.com/dipmane123/n8n-swarm-agency/issues)
- Check existing discussions and documentation
- Review the troubleshooting section above

## 🔗 Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Webhooks Guide](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Made with ❤️ for collaborative AI workflows**
