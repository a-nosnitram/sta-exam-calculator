# Privacy Policy (Confidentiality Policy) for MMSCalc

Effective date: 2026-05-11

## 1. Overview

MMSCalc is a browser extension that helps students estimate exam grades using data visible on MySaint and MMS pages.

This policy explains what data the extension processes, why it is processed, and how it is protected.

## 2. Data We Process

The extension processes only data required for its core function:

- Module codes
- Coursework grades
- Overall module grades
- Academic year values
- Coursework/module links from MySaint/MMS pages
- Minimal extension state (for example, calculation/error state)

The extension does **not** request unnecessary personal profile data.

## 3. Where Data Is Stored

- Data is stored locally in the browser using the extension storage API.
- Data is used to perform calculations and avoid re-scraping the same values repeatedly.
- Data is not sold.

## 4. Permissions and Purpose

### `activeTab`
Used only after user interaction (clicking the extension) to access the current tab and open the calculator on supported pages.

### `storage`
Used to save calculation-related data locally (grades, module metadata, academic year, and state).

### Host permissions
The extension is limited to:

- `https://mysaint.st-andrews.ac.uk/*`
- `https://mms.st-andrews.ac.uk/*`

These are required to read relevant course/grade information for calculations.

## 5. Network Requests

The extension may make network requests to:

- `mysaint.st-andrews.ac.uk`
- `mms.st-andrews.ac.uk`
- `www.st-andrews.ac.uk` (module catalogue pages)

For module assessment-pattern lookups, requests are routed through `corsproxy.io` in the current implementation. These requests are for calculation functionality and typically include module-related query parameters.

## 6. Remote Code

The extension does **not** download and execute remote JavaScript code.

- No `eval`-based remote script execution is used.
- Executable code is packaged with the extension build.

## 7. Data Sharing

We do not sell user data.  
We do not use extension data for advertising.

Data is used only for the extension’s core educational calculation purpose.

## 8. Data Retention and User Control

- Stored extension data remains in local browser storage until removed.
- Users can clear extension data by removing/clearing extension storage in browser extension settings.

## 9. Security

We aim to minimize data handling and limit access scope to the required domains and permissions.

## 10. Changes to This Policy

This policy may be updated if extension functionality or data handling changes.

## 11. Contact

For privacy questions or requests, please contact the publisher via the extension listing contact details or open an issue in the project repository.
