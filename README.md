# Elume Availability Checker Dashboard

This repository contains my submission for the Round 2 Developer Role application at Elume. 

It is designed to run entirely client-side as a static web application hosted on GitHub Pages, providing an interactive dashboard that simulates a highly reliable scraper scheduler and column-level secure storage system.

## 🚀 Live Demo
The application is structured to run directly in the browser. You can deploy it instantly on GitHub Pages or run it locally.

### Features
1. **Active Scheduler Queue**: A client-side task scheduler that schedules periodic checks of targets, complete with live timer countdowns. You can dynamically register new target URLs.
2. **Reliability Engine Simulator**:
   - Rotates residential IP proxies and user-agent strings on every request.
   - **Timeout Simulator**: Simulates high-latency / slow targets and visualizes timeout retry backoff states.
   - **Rate Limit Simulator**: Simulates a `429 Too Many Requests` block, showcasing safety-lock triggers, exponential backoff (e.g. 8s, 16s, 32s delay), and automated proxy rotation to recover.
3. **Cryptographic Storage Sandbox**: An interactive visualization of field-level envelope encryption for customer PII (e.g. plain data encrypted using AES-GCM local DEK, with the DEK wrapped with a KMS master key).
4. **Strategic Architecture Panel**: Contains my detailed answers to the three application questions.

---

## 🛠️ Local Setup
To run this dashboard locally, clone the repository and run a simple HTTP server:

```bash
# Clone the repository
git clone https://github.com/maruthisriram/Elume.git
cd Elume

# Run with any static server, e.g.:
npx http-server .
# OR
python -m http.server 8000
```
Open your browser at `http://localhost:8080` (or `http://localhost:8000`) to view the interactive dashboard.

---

## 📂 Project Structure
- `index.html` - Core interface scaffolding and strategic responses.
- `styles.css` - Custom design system utilizing modern dark-mode glassmorphic styling.
- `app.js` - Client-side task scheduler queue, scraper simulation engine, and encryption sandbox.
