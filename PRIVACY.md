# Privacy Policy: CasaOS Generator

**Last Updated: October 25, 2023**

CasaOS Generator is built with a **Privacy-By-Design** approach. As a client-side tool, your privacy is not just a policy—it is a technical reality.

## 1. Data Processing
- **Zero Server-Side Handling**: No data you enter (app names, volumes, secrets, etc.) is ever sent to our servers or any third-party servers.
- **Local Execution**: All YAML and ZIP generation occurs locally in your browser's memory.
- **No Persistence**: Once you close your browser tab, data in memory is cleared unless you have explicitly allowed `localStorage` persistence.

## 2. Storage & Cookies
- **No Cookies**: This tool does not use cookies for tracking, analytics, or functional purposes.
- **LocalStorage**: We use browser `localStorage` for:
  - Saving your current configuration draft so you don't lose work on refresh.
  - Remembering your preference for dismissing the privacy notification.
- **You Control Your Data**: You can clear all data stored by this tool at any time by clearing your browser's site data or cache.

## 3. Third-Party Dependencies
We load standard functional libraries from reputable CDNs to ensure the tool's performance:
- **js-yaml** (jsdelivr): YAML engine.
- **CodeMirror** (cdnjs): Code editor interface.
- **JSZip** (jsdelivr): File compression.
- **Google Fonts**: Typography.

These services do not receive the data you enter into the generator.

## 4. Open Source Transparency
The complete source code for CasaOS Generator is public and auditable. We encourage users to review the code to verify our privacy claims.
[View Source on GitHub](https://github.com/acidgreenservers/CasaOS-Generator)

## 5. Your Responsibility
Since this tool handles sensitive configuration data (such as environment variables and potential secrets):
- Avoid using this tool on public or untrusted devices.
- Treat generated configurations with the same security caution you would apply to any sensitive server file.

## 6. Questions
If you have any questions or security concerns, please open an issue on our [GitHub repository](https://github.com/acidgreenservers/CasaOS-Generator/issues).
